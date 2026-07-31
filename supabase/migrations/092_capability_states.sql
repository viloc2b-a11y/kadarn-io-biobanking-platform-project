-- ============================================================================
-- KADARN v2 — Block 02-C: Capability Intelligence — capability_states
-- ============================================================================
-- Authority: Architecture Alignment Audit v2, Block 02-C Capability Intelligence
-- Purpose: Temporal tracking of capability states (declared → documented →
--          verified) with evidence summaries and validity windows.
-- Migration: 092 (idempotent — all DDL guarded by IF NOT EXISTS)
-- Dependencies: 065 (capabilities table), 008 (organizations)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUM — capability_state_type
-- ############################################################################
-- Canonical capability state values for temporal tracking:
--   declared  — capability asserted by the institution, not yet backed
--   documented — capability has documentation/evidence submitted
--   verified  — capability has been independently verified/reviewed

DO $$ BEGIN
    CREATE TYPE capability_state_type AS ENUM (
        'declared',
        'documented',
        'verified'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — capability_states
-- ############################################################################
-- Each row records a temporal window during which a capability was in a
-- particular state. The valid_until IS NULL means "currently in this state."
-- When a capability transitions to a new state, the previous row's
-- valid_until is set to the transition timestamp.
--
-- Relationship: capability_states N:1 capabilities
--   A capability has a chronological chain of state records.

CREATE TABLE IF NOT EXISTS public.capability_states (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK to the parent capability
    capability_id       UUID NOT NULL
                        REFERENCES public.capabilities(id) ON DELETE CASCADE,

    -- Denormalized organization_id for RLS fast path
    -- (matches capability.organization_id, enforced by trigger or app logic)
    organization_id     UUID NOT NULL
                        REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- What state the capability was/is in
    state               capability_state_type NOT NULL,

    -- Temporal validity window
    valid_from          TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until         TIMESTAMPTZ,                          -- NULL = currently valid

    -- Evidence summary for this state transition
    evidence_summary    JSONB DEFAULT '{}',

    -- Metadata (extensible)
    metadata            JSONB DEFAULT '{}',

    -- Audit
    created_by          UUID,                                  -- auth.users.id
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 3: INDEXES
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_capability_states_capability
    ON public.capability_states(capability_id);

CREATE INDEX IF NOT EXISTS idx_capability_states_org
    ON public.capability_states(organization_id);

CREATE INDEX IF NOT EXISTS idx_capability_states_state
    ON public.capability_states(state);

CREATE INDEX IF NOT EXISTS idx_capability_states_valid_from
    ON public.capability_states(valid_from DESC);

CREATE INDEX IF NOT EXISTS idx_capability_states_current
    ON public.capability_states(capability_id, valid_from DESC)
    WHERE valid_until IS NULL;

-- ############################################################################
-- PART 4: TRIGGER — updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_capability_states_updated_at ON public.capability_states;
CREATE TRIGGER trg_capability_states_updated_at
    BEFORE UPDATE ON public.capability_states
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- PART 5: ROW-LEVEL SECURITY
-- ############################################################################
-- Institution-scoped: a user may access capability_states rows if they have
-- active membership in the organization that owns the parent capability.
-- Mirrors the pattern from migration 082 (capability_claims).

ALTER TABLE public.capability_states ENABLE ROW LEVEL SECURITY;

-- SELECT: org members see their org's capability states
CREATE POLICY cs_select_org ON public.capability_states
    FOR SELECT
    USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_memberships om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: org members can insert for their org
CREATE POLICY cs_insert_org ON public.capability_states
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_memberships om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- UPDATE: org members can update their org's capability states
-- (e.g., setting valid_until when transitioning state)
CREATE POLICY cs_update_org ON public.capability_states
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT om.organization_id FROM public.organization_memberships om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- DELETE: only service_role can delete (audit trail preservation)
CREATE POLICY cs_delete_service ON public.capability_states
    FOR DELETE
    USING (auth.role() = 'service_role');

-- Full-access fallback for service_role
CREATE POLICY cs_all_service ON public.capability_states
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 6: GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.capability_states TO authenticated, service_role;
GRANT DELETE ON public.capability_states TO service_role;

-- ############################################################################
-- PART 7: COMMENTS
-- ############################################################################

COMMENT ON TABLE public.capability_states IS
    'KADARN v2 Block 02-C — Temporal tracking of capability states. Each row records a validity window during which a capability was declared, documented, or verified.';

COMMENT ON COLUMN public.capability_states.state IS
    'Capability state: declared (asserted), documented (evidence submitted), verified (independently confirmed).';

COMMENT ON COLUMN public.capability_states.valid_from IS
    'When this state became effective (temporal lower bound).';

COMMENT ON COLUMN public.capability_states.valid_until IS
    'When this state ceased to be effective (temporal upper bound). NULL = currently in this state.';

COMMENT ON COLUMN public.capability_states.evidence_summary IS
    'JSONB: summary of evidence supporting this state — { source_count, evidence_ids, assessment_notes, reviewer_id }.';

COMMENT ON COLUMN public.capability_states.organization_id IS
    'Denormalized FK to organizations for institution-scoped RLS. MUST match capability.organization_id.';

-- ============================================================================
-- END OF MIGRATION 092
-- ============================================================================
