-- ============================================================================
-- KTP-1.2 — Migration 054: Readiness Evaluations
-- ============================================================================
-- Purpose:
--   Persist institutional readiness self-assessments against Program Types.
--   Each evaluation is organization-scoped by default. The evaluation_snapshot
--   is a DERIVED cache — canonical readiness is always recomputed from evidence.
--
--   Includes:
--   - readiness_status enum (not_ready, partial, conditionally_ready, ready)
--   - readiness_evaluations table with full RLS
--   - Audit trigger for every status change
--   - audit_resource_type enum extension
--   - audit_table_trigger() CASE mapping update
--
-- Boundaries:
--   - Readiness IS DERIVED from evidence, not stored as truth.
--   - evaluation_snapshot is a JSONB cache with invalidation metadata.
--   - Does NOT compute readiness — that belongs in readiness-engine.
--   - Does NOT modify Evidence Core tables.
--
-- Decision References:
--   - KTP-1.0A §3: Readiness is derived from Evidence → Claims → Confidence
--   - KTP-1.0A §4: Program Readiness is institution-proven capacity
--
-- Dependencies:
--   - public.organizations (migration 008)
--   - public.programs (migration 010)
--   - public.program_type_taxonomy (migration 052)
--   - public.audit_events (migration 010)
--   - public.audit_table_trigger() (migration 010)
--   - audit_resource_type enum (migration 010)
-- ============================================================================

-- ###########################################################################
-- PART 1: readiness_status ENUM
-- ###########################################################################

DO $$ BEGIN
    CREATE TYPE readiness_status AS ENUM (
        'not_ready',            -- Critical evidence gaps. Cannot proceed.
        'partial',              -- Some evidence present, significant gaps remain.
        'conditionally_ready',  -- Evidence sufficient with minor conditions.
        'ready'                 -- All mandatory evidence present, confidence >= threshold.
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ###########################################################################
-- PART 2: readiness_evaluations TABLE
-- ###########################################################################

CREATE TABLE IF NOT EXISTS public.readiness_evaluations (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Which institution is being evaluated
    organization_id                 UUID NOT NULL
        REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Which Program Type template is the institution evaluating against
    program_id                      UUID NOT NULL
        REFERENCES public.programs(id) ON DELETE CASCADE,

    -- Redundant FK to taxonomy for direct taxonomy queries.
    -- Always matches the program_type of the referenced program.
    program_type_id                 UUID NOT NULL
        REFERENCES public.program_type_taxonomy(id) ON DELETE RESTRICT,

    -- Current readiness status (DERIVED from evidence, cached here)
    readiness_status                readiness_status NOT NULL DEFAULT 'not_ready',

    -- Overall readiness confidence (0.00 - 1.00). DERIVED at evaluation time.
    -- NULL until first evaluation completes.
    overall_confidence              NUMERIC(3,2),

    -- Visibility: organization-only by default. Institution publishes to network.
    visibility_scope                visibility_scope NOT NULL DEFAULT 'organization',

    -- DERIVED CACHE — canonical readiness is always recomputed from evidence.
    -- Includes computed_at and evidence_graph_correlation_id for invalidation.
    evaluation_snapshot             JSONB,

    -- When this evaluation snapshot was computed (NULL until first evaluation)
    computed_at                     TIMESTAMPTZ,

    -- Links to the evidence graph state used for this computation.
    -- Changes when evidence is added/removed → triggers re-evaluation.
    evidence_graph_correlation_id   TEXT,

    -- Extension point
    metadata                        JSONB DEFAULT '{}',

    -- Who triggered this evaluation (auth.users UUID)
    created_by                      UUID NOT NULL,

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One evaluation per institution per program type.
    -- Re-evaluations UPDATE the existing row; they do not create new rows.
    CONSTRAINT uq_readiness_eval_org_program_type UNIQUE (organization_id, program_type_id)
);

COMMENT ON TABLE public.readiness_evaluations IS
    'Institutional readiness self-assessments against Program Types. '
    'Readiness is DERIVED from the evidence graph, not stored as semantic truth. '
    'evaluation_snapshot is a JSONB cache with invalidation metadata. '
    'KEMS-001 §1: Kadarn never asserts institutional truth — it reports evidence-backed confidence.';

COMMENT ON COLUMN public.readiness_evaluations.evaluation_snapshot IS
    'DERIVED cache of the last readiness computation. Canonical readiness is always '
    'recomputed from evidence. This snapshot includes computed_at and '
    'evidence_graph_correlation_id for cache invalidation.';

COMMENT ON COLUMN public.readiness_evaluations.overall_confidence IS
    '0.00-1.00, derived at evaluation time by readiness-engine. '
    'NULL until the first evaluation is triggered.';

COMMENT ON COLUMN public.readiness_evaluations.program_type_id IS
    'Redundant FK to program_type_taxonomy enabling direct taxonomy queries '
    'without joining through programs. Always matches the program_type of the '
    'referenced program. ON DELETE RESTRICT prevents orphan evaluations.';

-- ###########################################################################
-- PART 3: INDEXES
-- ###########################################################################

-- Primary lookup: org X program type X status
CREATE INDEX IF NOT EXISTS idx_readiness_evals_org
    ON public.readiness_evaluations(organization_id, program_type_id, readiness_status);

-- Query by program template
CREATE INDEX IF NOT EXISTS idx_readiness_evals_program
    ON public.readiness_evaluations(program_id, readiness_status);

-- Network-visible evaluations (Discovery Engine, Sponsor Intelligence)
CREATE INDEX IF NOT EXISTS idx_readiness_evals_visibility
    ON public.readiness_evaluations(visibility_scope)
    WHERE visibility_scope = 'network';

-- High-confidence evaluations (Sponsor Discovery)
CREATE INDEX IF NOT EXISTS idx_readiness_evals_confidence
    ON public.readiness_evaluations(overall_confidence)
    WHERE overall_confidence IS NOT NULL;

-- ###########################################################################
-- PART 4: TRIGGERS
-- ###########################################################################

-- updated_at maintenance
DROP TRIGGER IF EXISTS trg_readiness_evals_updated_at ON public.readiness_evaluations;
CREATE TRIGGER trg_readiness_evals_updated_at
    BEFORE UPDATE ON public.readiness_evaluations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ###########################################################################
-- PART 5: ROW-LEVEL SECURITY
-- ###########################################################################

ALTER TABLE public.readiness_evaluations ENABLE ROW LEVEL SECURITY;

-- SELECT: org members can see their own evaluations
DROP POLICY IF EXISTS readiness_evals_select_org ON public.readiness_evaluations;
CREATE POLICY readiness_evals_select_org
    ON public.readiness_evaluations FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- SELECT: any authenticated user can see network-published evaluations
DROP POLICY IF EXISTS readiness_evals_select_network ON public.readiness_evaluations;
CREATE POLICY readiness_evals_select_network
    ON public.readiness_evaluations FOR SELECT
    TO authenticated
    USING (visibility_scope = 'network');

-- INSERT: org admin for their own org, must match auth.uid()
DROP POLICY IF EXISTS readiness_evals_insert ON public.readiness_evaluations;
CREATE POLICY readiness_evals_insert
    ON public.readiness_evaluations FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_org_admin(organization_id)
        AND created_by = auth.uid()
    );

-- UPDATE: org admin for their own org
DROP POLICY IF EXISTS readiness_evals_update ON public.readiness_evaluations;
CREATE POLICY readiness_evals_update
    ON public.readiness_evaluations FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- DELETE: org admin for their own org (rare — evaluations are re-evaluated, not deleted)
DROP POLICY IF EXISTS readiness_evals_delete ON public.readiness_evaluations;
CREATE POLICY readiness_evals_delete
    ON public.readiness_evaluations FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

-- ###########################################################################
-- PART 6: AUDIT — Extend audit_resource_type ENUM
-- ###########################################################################

-- Add 'readiness_evaluation' to the audit_resource_type enum.
-- PostgreSQL ALTER TYPE ADD VALUE is safe — it appends, never removes.
DO $$ BEGIN
    ALTER TYPE audit_resource_type ADD VALUE 'readiness_evaluation';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ###########################################################################
-- PART 7: AUDIT — Update audit_table_trigger() CASE mapping
-- ###########################################################################

-- Replace the audit_table_trigger() function to include
-- 'readiness_evaluations' -> 'readiness_evaluation' mapping.
-- Use CREATE OR REPLACE to overwrite the existing function.

CREATE OR REPLACE FUNCTION public.audit_table_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_action audit_action;
    v_resource_type audit_resource_type;
    v_summary TEXT;
    v_old_json JSONB;
    v_new_json JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_new_json := to_jsonb(NEW);
        v_summary := TG_TABLE_NAME || ' created';
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_old_json := to_jsonb(OLD);
        v_new_json := to_jsonb(NEW);
        v_summary := TG_TABLE_NAME || ' updated';
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_old_json := to_jsonb(OLD);
        v_summary := TG_TABLE_NAME || ' deleted';
        v_new_json := NULL;
    ELSE
        RETURN NULL;
    END IF;

    BEGIN
        -- Map plural table names to singular enum values
        v_resource_type := CASE TG_TABLE_NAME
            WHEN 'programs' THEN 'program'::audit_resource_type
            WHEN 'organizations' THEN 'organization'::audit_resource_type
            WHEN 'organization_memberships' THEN 'organization_membership'::audit_resource_type
            WHEN 'organization_capabilities' THEN 'organization_capability'::audit_resource_type
            WHEN 'user_profiles' THEN 'user_profile'::audit_resource_type
            WHEN 'program_participants' THEN 'program_participant'::audit_resource_type
            WHEN 'program_access_policies' THEN 'program_access_policy'::audit_resource_type
            WHEN 'identity_providers' THEN 'identity_provider'::audit_resource_type
            WHEN 'readiness_evaluations' THEN 'readiness_evaluation'::audit_resource_type
            ELSE TG_TABLE_NAME::audit_resource_type
        END;
    EXCEPTION WHEN others THEN
        v_resource_type := 'other';
    END;

    PERFORM public.emit_audit_event(
        p_action        => v_action,
        p_resource_type => v_resource_type,
        p_resource_id   => COALESCE(NEW.id, OLD.id),
        p_actor_id      => COALESCE(
            (NEW.organization_id),
            (OLD.organization_id)
        ),
        p_organization_id => COALESCE(
            (NEW.organization_id),
            (OLD.organization_id)
        ),
        p_summary       => v_summary,
        p_old_values    => v_old_json,
        p_new_values    => v_new_json
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ###########################################################################
-- PART 8: AUDIT — Attach trigger to readiness_evaluations
-- ###########################################################################

DROP TRIGGER IF EXISTS trg_readiness_evals_audit ON public.readiness_evaluations;
CREATE TRIGGER trg_readiness_evals_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.readiness_evaluations
    FOR EACH ROW EXECUTE FUNCTION public.audit_table_trigger();
