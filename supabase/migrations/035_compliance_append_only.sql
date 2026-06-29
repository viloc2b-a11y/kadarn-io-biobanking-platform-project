-- ============================================================================
-- KADARN PLATFORM — Sprint 3: Database & Compliance Hardening
-- ============================================================================
-- Depends on: 019_regulatory_engine, 022_policy_engine, 023_trust_engine,
--             024_operational_twins, 010_audit_programs, 032_provenance_append_only
--
-- Enforces append-only at the database level for all compliance audit tables.
-- Adds regulatory submission audit trail and schema compatibility columns.
-- ============================================================================

-- ############################################################################
-- PART 1: GENERIC APPEND-ONLY TRIGGER FUNCTIONS
-- ############################################################################

CREATE OR REPLACE FUNCTION public.reject_append_only_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        '% is append-only. UPDATE not permitted. Row id: %',
        TG_TABLE_NAME, OLD.id
        USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_append_only_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        '% is append-only. DELETE not permitted. Row id: %',
        TG_TABLE_NAME, OLD.id
        USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_append_only_triggers(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_table_name TEXT := p_table::text;
    v_update_trigger TEXT := 'trg_' || replace(v_table_name, '.', '_') || '_no_update';
    v_delete_trigger TEXT := 'trg_' || replace(v_table_name, '.', '_') || '_no_delete';
BEGIN
    EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON %s',
        v_update_trigger, p_table
    );
    EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION public.reject_append_only_update()',
        v_update_trigger, p_table
    );

    EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON %s',
        v_delete_trigger, p_table
    );
    EXECUTE format(
        'CREATE TRIGGER %I BEFORE DELETE ON %s FOR EACH ROW EXECUTE FUNCTION public.reject_append_only_delete()',
        v_delete_trigger, p_table
    );
END;
$$;

COMMENT ON FUNCTION public.apply_append_only_triggers(regclass) IS
    'Installs BEFORE UPDATE/DELETE append-only triggers on a table.';

-- ############################################################################
-- PART 2: APPEND-ONLY TRIGGERS — COMPLIANCE AUDIT TABLES
-- ############################################################################

SELECT public.apply_append_only_triggers('public.audit_events'::regclass);
SELECT public.apply_append_only_triggers('public.policy_evaluations'::regclass);
SELECT public.apply_append_only_triggers('public.trust_events'::regclass);
SELECT public.apply_append_only_triggers('public.twin_events'::regclass);

-- ############################################################################
-- PART 3: REGULATORY SUBMISSION AUDIT TRAIL (APPEND-ONLY)
-- ############################################################################
--
-- Mutable regulatory_submissions holds current state; every status transition
-- is recorded immutably in regulatory_submission_events.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.regulatory_submission_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id       UUID NOT NULL REFERENCES public.regulatory_submissions(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,

    event_type          TEXT NOT NULL CHECK (event_type IN (
        'created', 'status_changed', 'document_attached', 'note_added', 'withdrawn'
    )),
    from_status         submission_status,
    to_status           submission_status,

    actor_id            UUID NOT NULL,
    summary             TEXT,
    payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_sub_events_submission
    ON public.regulatory_submission_events(submission_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reg_sub_events_org
    ON public.regulatory_submission_events(organization_id, created_at DESC);

COMMENT ON TABLE public.regulatory_submission_events IS
    'Append-only audit log for IRB/ethics submission lifecycle. Current state lives in regulatory_submissions.';

SELECT public.apply_append_only_triggers('public.regulatory_submission_events'::regclass);

-- Log submission lifecycle changes automatically
CREATE OR REPLACE FUNCTION public.log_regulatory_submission_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor UUID;
    v_event_type TEXT;
BEGIN
    v_actor := COALESCE(auth.uid(), NEW.created_by, OLD.created_by);

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.regulatory_submission_events (
            submission_id, organization_id, program_id,
            event_type, from_status, to_status, actor_id, summary, payload
        ) VALUES (
            NEW.id, NEW.organization_id, NEW.program_id,
            'created', NULL, NEW.status, v_actor,
            'Submission created',
            jsonb_build_object('submission_type', NEW.submission_type)
        );
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        v_event_type := CASE
            WHEN NEW.status = 'withdrawn' THEN 'withdrawn'
            ELSE 'status_changed'
        END;

        INSERT INTO public.regulatory_submission_events (
            submission_id, organization_id, program_id,
            event_type, from_status, to_status, actor_id, summary, payload
        ) VALUES (
            NEW.id, NEW.organization_id, NEW.program_id,
            v_event_type, OLD.status, NEW.status, v_actor,
            format('Status changed from %s to %s', OLD.status, NEW.status),
            jsonb_build_object(
                'submission_type', NEW.submission_type,
                'irb_number', NEW.irb_number
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_regulatory_submissions_audit ON public.regulatory_submissions;
CREATE TRIGGER trg_regulatory_submissions_audit
    AFTER INSERT OR UPDATE OF status ON public.regulatory_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_regulatory_submission_event();

-- ############################################################################
-- PART 4: SCHEMA COMPATIBILITY — policies & policy_evaluations
-- ############################################################################
--
-- Resolves API/schema drift: API expected policy_type, severity, result, created_at.
-- Canonical columns remain domain, outcome, evaluated_at.
-- ============================================================================

ALTER TABLE public.policies
    ADD COLUMN IF NOT EXISTS policy_type TEXT,
    ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';

UPDATE public.policies
SET policy_type = domain::text
WHERE policy_type IS NULL;

UPDATE public.policies
SET severity = COALESCE(metadata->>'severity', 'medium')
WHERE severity IS NULL OR severity = 'medium';

CREATE OR REPLACE FUNCTION public.sync_policy_compat_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.policy_type := NEW.domain::text;
    IF NEW.severity IS NULL OR NEW.severity = '' THEN
        NEW.severity := COALESCE(NEW.metadata->>'severity', 'medium');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_policies_compat_columns ON public.policies;
CREATE TRIGGER trg_policies_compat_columns
    BEFORE INSERT OR UPDATE ON public.policies
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_policy_compat_columns();

-- Evaluation API aliases (read-only generated columns)
ALTER TABLE public.policy_evaluations
    ADD COLUMN IF NOT EXISTS result TEXT
        GENERATED ALWAYS AS (outcome::text) STORED;

ALTER TABLE public.policy_evaluations
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ
        GENERATED ALWAYS AS (evaluated_at) STORED;

COMMENT ON COLUMN public.policy_evaluations.result IS
    'API alias for outcome (allow|deny|conditional). Append-only — derived, not writable.';
COMMENT ON COLUMN public.policy_evaluations.created_at IS
    'API alias for evaluated_at. Append-only — derived, not writable.';

-- ############################################################################
-- PART 5: RLS — regulatory_submission_events + append-only table hardening
-- ############################################################################

ALTER TABLE public.regulatory_submission_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY regulatory_submission_events_select ON public.regulatory_submission_events
    FOR SELECT
    USING (
        public.can_access_program(program_id)
        OR public.is_org_admin(organization_id)
        OR public.is_org_member(organization_id)
    );

CREATE POLICY regulatory_submission_events_insert ON public.regulatory_submission_events
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role' OR actor_id = auth.uid());

-- Explicit: no UPDATE/DELETE policies on append-only audit tables (RLS denies by default).
-- Revoke direct mutation grants from client roles (triggers are the last line of defense).
REVOKE UPDATE, DELETE ON public.audit_events FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.policy_evaluations FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.trust_events FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.twin_events FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.regulatory_submission_events FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.provenance_nodes FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.provenance_edges FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.provenance_evidence FROM anon, authenticated;

GRANT SELECT, INSERT ON public.regulatory_submission_events TO anon, authenticated, service_role;

-- ############################################################################
-- PART 6: BACKFILL — submission events for existing rows
-- ############################################################################

INSERT INTO public.regulatory_submission_events (
    submission_id, organization_id, program_id,
    event_type, from_status, to_status, actor_id, summary, payload, created_at
)
SELECT
    rs.id,
    rs.organization_id,
    rs.program_id,
    'created',
    NULL,
    rs.status,
    rs.created_by,
    'Backfilled from existing submission',
    jsonb_build_object('submission_type', rs.submission_type, 'backfill', true),
    rs.created_at
FROM public.regulatory_submissions rs
WHERE NOT EXISTS (
    SELECT 1 FROM public.regulatory_submission_events e
    WHERE e.submission_id = rs.id
);

-- ############################################################################
-- PART 7: VERIFY
-- ############################################################################

DO $$
DECLARE
    v_append_only_triggers INTEGER;
    v_reg_events_triggers INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_append_only_triggers
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND (
          event_object_table IN (
              'audit_events', 'policy_evaluations', 'trust_events',
              'twin_events', 'regulatory_submission_events'
          )
      )
      AND event_manipulation IN ('UPDATE', 'DELETE');

    IF v_append_only_triggers < 10 THEN
        RAISE EXCEPTION
            'Expected at least 10 compliance append-only triggers, found %',
            v_append_only_triggers;
    END IF;

    SELECT COUNT(*) INTO v_reg_events_triggers
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name = 'trg_regulatory_submissions_audit';

    IF v_reg_events_triggers <> 1 THEN
        RAISE EXCEPTION 'regulatory_submissions audit trigger missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'policy_evaluations'
          AND column_name = 'result'
    ) THEN
        RAISE EXCEPTION 'policy_evaluations.result compatibility column missing';
    END IF;

    RAISE NOTICE 'Sprint 3 compliance hardening: % append-only triggers confirmed',
        v_append_only_triggers;
END;
$$;

-- ============================================================================
-- END OF MIGRATION 035 — Database & Compliance Hardening
-- ============================================================================
