-- ============================================================================
-- KADARN PLATFORM — Sprint 0C: Audit & Programs
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Design: ADR-002 — Audit from Sprint 0, Program-centric architecture
-- Blueprint: §6 — Program Engine, §4.2 — Visibility Scopes
-- Dependencies: 008_organizations_capabilities.sql, 009_rls_foundation.sql
--
-- This migration creates:
--   1. audit_events — unified audit trail (immutable log)
--   2. programs — cross-organization collaboration units
--   3. program_participants — orgs within programs
--   4. program_access_policies — data sharing rules
--
-- Design principles:
--   - "No audit = no action" (Blueprint §2.4)
--   - Program is the central object (Blueprint §2.6)
--   - Every table has RLS + updated_at triggers (Blueprint §19.2)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

-- Audit action types (Blueprint §2.4)
DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM (
        'create', 'read', 'update', 'delete',
        'login', 'logout',
        'invite', 'approve', 'reject', 'submit', 'withdraw',
        'fulfill', 'complete', 'cancel',
        'system', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Resource types tracked in audit (extensible)
DO $$ BEGIN
    CREATE TYPE audit_resource_type AS ENUM (
        'organization',
        'organization_membership',
        'organization_capability',
        'user_profile',
        'program',
        'program_participant',
        'program_access_policy',
        'supply_item',
        'collection',
        'donor',
        'sample',
        'access_request',
        'negotiation_message',
        'exchange_deal',
        'chain_telemetry',
        'identity_provider',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Program lifecycle (Blueprint §6.2)
DO $$ BEGIN
    CREATE TYPE program_status AS ENUM (
        'draft', 'active', 'paused', 'completed', 'archived', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Participant roles within a program (Blueprint §6.4)
DO $$ BEGIN
    CREATE TYPE participant_role AS ENUM (
        'sponsor',      -- funds the program
        'lead',         -- leads/coordinates
        'contributor',  -- contributes data or samples
        'consumer',     -- consumes data or samples
        'processor',    -- processes samples or data
        'reviewer',     -- reviews access requests
        'observer'      -- read-only access
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Participant status lifecycle
DO $$ BEGIN
    CREATE TYPE participant_status AS ENUM (
        'invited', 'active', 'suspended', 'inactive', 'removed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Data sharing scope within programs (Blueprint §6.5)
DO $$ BEGIN
    CREATE TYPE data_sharing_scope AS ENUM (
        'no_sharing',           -- coordination only
        'metadata_only',        -- catalog-level metadata
        'aggregate_only',       -- counts and summaries
        'de_identified',        -- de-identified individual-level
        'pseudonymized',        -- pseudonymized (Multi-PID protected)
        'identified',           -- fully identified (limited, audited)
        'full_access'           -- unrestricted within program
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — audit_events
-- ############################################################################
--
-- Unified audit trail for all significant actions.
-- Immutable: no UPDATE or DELETE policies.
-- (Blueprint §2.4 — "No audit = no action", Sprint 0 requirement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who
    actor_id            UUID NOT NULL,
    actor_email         TEXT,                             -- denormalized for speed
    impersonated_by     UUID,

    -- What
    action              audit_action NOT NULL,
    resource_type       audit_resource_type NOT NULL,
    resource_id         UUID,
    resource_owner_org_id UUID,

    -- Context
    organization_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    program_id          UUID,                             -- FK added in this migration (no cycle)
    session_id          TEXT,
    ip_address          INET,
    user_agent          TEXT,

    -- Details
    old_values          JSONB,
    new_values          JSONB,
    summary             TEXT,
    metadata            JSONB DEFAULT '{}',

    -- Timing
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common audit queries
CREATE INDEX IF NOT EXISTS idx_audit_actor
    ON public.audit_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource
    ON public.audit_events(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org
    ON public.audit_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_program
    ON public.audit_events(program_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created
    ON public.audit_events(created_at DESC);

COMMENT ON TABLE public.audit_events IS
    'Unified audit trail. Immutable log — no UPDATE or DELETE.';

-- ############################################################################
-- PART 3: TABLE — programs
-- ############################################################################
--
-- The central object of Kadarn. A program is a cross-organization
-- collaboration around biospecimen and/or clinical data needs.
-- (Blueprint §6 — Program Engine, §2.6 — Program-Centric)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.programs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name                TEXT NOT NULL,
    short_name          TEXT,
    description         TEXT,
    program_identifier  TEXT UNIQUE,                      -- external ID (NCT, grant, etc.)

    -- Classification
    program_type        TEXT[] DEFAULT '{}',
    therapeutic_areas   TEXT[] DEFAULT '{}',
    diseases            JSONB DEFAULT '[]',

    -- Timeline
    start_date          DATE,
    end_date            DATE,
    status              program_status NOT NULL DEFAULT 'draft',

    -- Governance
    sponsor_org_id      UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    lead_org_id         UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_by_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

    -- Data sharing defaults (Blueprint §6.5)
    default_data_scope  data_sharing_scope NOT NULL DEFAULT 'metadata_only',
    allow_commercial_use BOOLEAN NOT NULL DEFAULT false,
    require_ethics_approval BOOLEAN NOT NULL DEFAULT true,

    -- Visibility
    visibility_scope    visibility_scope NOT NULL DEFAULT 'network',

    -- Audit
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programs_status
    ON public.programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_sponsor
    ON public.programs(sponsor_org_id);
CREATE INDEX IF NOT EXISTS idx_programs_lead
    ON public.programs(lead_org_id);
CREATE INDEX IF NOT EXISTS idx_programs_visibility
    ON public.programs(visibility_scope);

COMMENT ON TABLE public.programs IS
    'Central object. Cross-organization collaboration units.';

-- The creating org must be known for RLS on first participant insert
ALTER TABLE public.programs
ADD CONSTRAINT programs_created_by_org_required
CHECK (created_by_organization_id IS NOT NULL) NOT VALID;

-- ############################################################################
-- PART 4: TABLE — program_participants
-- ############################################################################
--
-- Which organizations participate in which programs, and in what role.
-- Core of multi-tenant program-based data sharing.
-- (Blueprint §6.4 — participant roles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_participants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    role                participant_role NOT NULL DEFAULT 'contributor',
    status              participant_status NOT NULL DEFAULT 'invited',

    data_scope_override data_sharing_scope,               -- NULL = use program default

    invited_at          TIMESTAMPTZ,
    joined_at           TIMESTAMPTZ,
    deactivated_at      TIMESTAMPTZ,
    deactivated_reason  TEXT,

    primary_contact_id  UUID,

    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (program_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_prog_participants_program
    ON public.program_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_prog_participants_org
    ON public.program_participants(organization_id);
CREATE INDEX IF NOT EXISTS idx_prog_participants_status
    ON public.program_participants(status);
CREATE INDEX IF NOT EXISTS idx_prog_participants_role
    ON public.program_participants(role);

COMMENT ON TABLE public.program_participants IS
    'Organizations participating in programs. Core of multi-tenant data sharing.';

-- ############################################################################
-- PART 5: TABLE — program_access_policies
-- ############################################################################
--
-- Fine-grained data sharing rules within a program.
-- (Blueprint §6.5 — data sharing scopes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_access_policies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,

    name                TEXT NOT NULL,
    description         TEXT,
    policy_type         TEXT NOT NULL DEFAULT 'default',

    resource_type       audit_resource_type,               -- NULL = all types
    target_role         participant_role,                  -- NULL = all roles

    allowed_data_scope  data_sharing_scope NOT NULL DEFAULT 'metadata_only',
    allow_export        BOOLEAN NOT NULL DEFAULT false,
    require_approval    BOOLEAN NOT NULL DEFAULT false,
    max_record_count    INTEGER,

    valid_from          TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until         TIMESTAMPTZ,

    approved_by         UUID,
    approval_ref        TEXT,
    metadata            JSONB DEFAULT '{}',

    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prog_access_policies_program
    ON public.program_access_policies(program_id);
CREATE INDEX IF NOT EXISTS idx_prog_access_policies_type
    ON public.program_access_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_prog_access_policies_valid
    ON public.program_access_policies(program_id, valid_from, valid_until)
    WHERE valid_until IS NULL OR valid_until > now();

COMMENT ON TABLE public.program_access_policies IS
    'Data sharing rules within programs. Controls role-based access to resource types.';

-- ############################################################################
-- PART 6: TRIGGERS — updated_at
-- ############################################################################

CREATE TRIGGER trg_programs_updated_at
    BEFORE UPDATE ON public.programs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_program_participants_updated_at
    BEFORE UPDATE ON public.program_participants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_program_access_policies_updated_at
    BEFORE UPDATE ON public.program_access_policies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 7: AUDIT EVENT HELPERS
-- ############################################################################
--
-- Functions to emit audit events from triggers or application code.
-- (Blueprint §2.4 — audit from Sprint 0)
-- ============================================================================

-- Low-level function to emit a single audit event
CREATE OR REPLACE FUNCTION public.emit_audit_event(
    p_action            audit_action,
    p_resource_type     audit_resource_type,
    p_resource_id       UUID,
    p_resource_owner_org_id UUID DEFAULT NULL,
    p_organization_id   UUID DEFAULT NULL,
    p_program_id        UUID DEFAULT NULL,
    p_summary           TEXT DEFAULT NULL,
    p_old_values        JSONB DEFAULT NULL,
    p_new_values        JSONB DEFAULT NULL,
    p_metadata          JSONB DEFAULT '{}'
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
    v_actor_email TEXT;
BEGIN
    BEGIN
        v_actor_email := auth.jwt() ->> 'email';
    EXCEPTION WHEN OTHERS THEN
        v_actor_email := NULL;
    END;

    INSERT INTO public.audit_events (
        actor_id, actor_email, action, resource_type, resource_id,
        resource_owner_org_id, organization_id, program_id, summary,
        old_values, new_values, metadata
    ) VALUES (
        auth.uid(), v_actor_email, p_action, p_resource_type, p_resource_id,
        p_resource_owner_org_id, p_organization_id, p_program_id, p_summary,
        p_old_values, p_new_values, p_metadata
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Trigger function: generic audit for any table
-- Attach with: CREATE TRIGGER ... AFTER INSERT OR UPDATE OR DELETE
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
        v_resource_type := TG_TABLE_NAME::audit_resource_type;
    EXCEPTION WHEN others THEN
        v_resource_type := 'other';
    END;

    PERFORM public.emit_audit_event(
        p_action        => v_action,
        p_resource_type => v_resource_type,
        p_resource_id   => COALESCE(NEW.id, OLD.id),
        p_summary       => v_summary,
        p_old_values    => v_old_json,
        p_new_values    => v_new_json
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ############################################################################
-- PART 8: RLS — ENABLE
-- ############################################################################

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_access_policies ENABLE ROW LEVEL SECURITY;

-- ############################################################################
-- PART 9: RLS POLICIES — audit_events
-- ############################################################################
--
-- Audit is an immutable log: SELECT and INSERT only, no UPDATE or DELETE.
-- (Blueprint §2.4)
-- ============================================================================

-- SELECT: users see their own events; org_admins see org events
CREATE POLICY audit_events_select_self ON public.audit_events
    FOR SELECT
    USING (actor_id = auth.uid());

CREATE POLICY audit_events_select_admin ON public.audit_events
    FOR SELECT
    USING (public.is_org_admin(organization_id));

-- INSERT: any authenticated user (emit_audit_event is SECURITY DEFINER)
CREATE POLICY audit_events_insert ON public.audit_events
    FOR INSERT
    WITH CHECK (actor_id = auth.uid());

-- ############################################################################
-- PART 10: RLS POLICIES — programs
-- ############################################################################
--
-- (Blueprint §6 — Program Engine, §20.1 — Sprint 0 acceptance)
-- ============================================================================

-- SELECT:
--   - Participants of the program
--   - Network/public visibility
--   - Org_admins
CREATE POLICY programs_select ON public.programs
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND (
            visibility_scope IN ('public', 'network')
            OR EXISTS (
                SELECT 1 FROM public.program_participants pp
                WHERE pp.program_id = id
                  AND pp.status = 'active'
                  AND public.is_org_member(pp.organization_id)
            )
            OR public.is_org_admin()
        )
    );

-- INSERT: any authenticated user (creator)
CREATE POLICY programs_insert ON public.programs
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND created_by = auth.uid()
    );

-- UPDATE: sponsor or lead org_admin
CREATE POLICY programs_update ON public.programs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

-- DELETE: sponsor or lead org_admin
CREATE POLICY programs_delete ON public.programs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

-- ############################################################################
-- PART 11: RLS POLICIES — program_participants
-- ############################################################################

-- SELECT: org members of participating orgs, or org_admin
CREATE POLICY program_participants_select ON public.program_participants
    FOR SELECT
    USING (
        public.is_org_member(organization_id)
        OR public.is_org_admin()
    );

-- INSERT: sponsor/lead org_admin of the program
DROP POLICY IF EXISTS program_participants_insert ON public.program_participants;

CREATE POLICY program_participants_insert ON public.program_participants
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND (
            -- First participant: creator org of the program
            organization_id = (
                SELECT p.created_by_organization_id
                FROM public.programs p
                WHERE p.id = program_id
                  AND p.created_by = auth.uid()
            )
            OR
            -- Subsequent participants: active sponsor/lead org admin
            EXISTS (
                SELECT 1
                FROM public.program_participants pp
                WHERE pp.program_id = program_id
                  AND pp.role IN ('sponsor', 'lead')
                  AND pp.status = 'active'
                  AND public.is_org_admin(pp.organization_id)
            )
        )
    );

-- UPDATE: sponsor/lead org_admin
CREATE POLICY program_participants_update ON public.program_participants
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

-- DELETE: sponsor/lead org_admin
CREATE POLICY program_participants_delete ON public.program_participants
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

-- ############################################################################
-- PART 12: RLS POLICIES — program_access_policies
-- ############################################################################

-- SELECT: program participants
CREATE POLICY program_access_policies_select ON public.program_access_policies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.status = 'active'
              AND public.is_org_member(pp.organization_id)
        )
    );

-- INSERT/UPDATE/DELETE: program sponsor/lead org_admin
CREATE POLICY program_access_policies_insert ON public.program_access_policies
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

CREATE POLICY program_access_policies_update ON public.program_access_policies
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

CREATE POLICY program_access_policies_delete ON public.program_access_policies
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

-- ############################################################################
-- PART 13: AUDIT TRIGGERS — programs
-- ############################################################################
--
-- Automatic audit events for program lifecycle changes.
-- (Blueprint §20.1 — Sprint 0 acceptance: audit captures critical actions)
-- ============================================================================

CREATE TRIGGER trg_programs_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.programs
    FOR EACH ROW EXECUTE FUNCTION public.audit_table_trigger();

CREATE TRIGGER trg_program_participants_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.program_participants
    FOR EACH ROW EXECUTE FUNCTION public.audit_table_trigger();

CREATE TRIGGER trg_program_access_policies_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.program_access_policies
    FOR EACH ROW EXECUTE FUNCTION public.audit_table_trigger();

-- ============================================================================
-- END OF MIGRATION 010 — Sprint 0C: Audit & Programs
-- ============================================================================
-- Next: 011_seed_data.sql — demo organizations, users, programs
-- ============================================================================
