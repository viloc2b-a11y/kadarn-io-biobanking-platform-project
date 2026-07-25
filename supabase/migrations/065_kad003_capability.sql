-- ============================================================================
-- KAD-003 — Capability Model
-- ============================================================================
-- Authority: Foundation Library, KEMS-001
-- Capability is a DERIVED entity from Claims backed by Evidence.
-- A Capability represents a verified institutional capability.
--
-- Relationship:
--   Claim ──derives── Capability ──published_in── Passport
--
-- Capability status follows the Evidence trust chain:
--   declared → evidence_submitted → under_review → verified → published
-- ============================================================================

-- ############################################################################
-- ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE capability_status AS ENUM (
        'declared',
        'evidence_submitted',
        'under_review',
        'verified',
        'published',
        'deprecated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- TABLE: capabilities
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.capabilities (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name                TEXT NOT NULL,
    description         TEXT,
    capability_type_id  UUID REFERENCES public.organization_capability_types(id) ON DELETE SET NULL,
    domain              TEXT,

    -- Ownership
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Source Claim (the primary claim that established this capability)
    primary_claim_id    UUID REFERENCES public.claims(id) ON DELETE SET NULL,

    -- Status
    status              capability_status NOT NULL DEFAULT 'declared',

    -- Confidence (computed from evidence)
    confidence_score    NUMERIC(3,2),

    -- Temporal
    first_declared_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_verified_at    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT uq_capability_org_type UNIQUE (organization_id, capability_type_id)
);

-- ############################################################################
-- INDEXES
-- ############################################################################

CREATE INDEX idx_capabilities_organization ON public.capabilities(organization_id);
CREATE INDEX idx_capabilities_status ON public.capabilities(status);
CREATE INDEX idx_capabilities_type ON public.capabilities(capability_type_id);

-- ############################################################################
-- TRIGGER: updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_capabilities_updated_at ON public.capabilities;
CREATE TRIGGER trg_capabilities_updated_at
    BEFORE UPDATE ON public.capabilities
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- RLS
-- ############################################################################

ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY capabilities_select_org ON public.capabilities
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY capabilities_insert_org ON public.capabilities
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY capabilities_update_org ON public.capabilities
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY capabilities_all_service ON public.capabilities
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.capabilities TO authenticated, service_role;
GRANT DELETE ON public.capabilities TO service_role;
