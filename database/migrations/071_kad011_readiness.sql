-- ============================================================================
-- KAD-011 — Readiness Scores
-- ============================================================================
-- Persists computed institutional readiness scores.
-- Readiness is computed from:
--   Profile completeness, Evidence coverage, Credential validity,
--   Operational metrics, Recruitment capability, Diversity evidence,
--   Experience, Infrastructure, Passport completeness, Data freshness
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.readiness_scores (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Overall readiness (0.00 – 1.00)
    overall_score       NUMERIC(3,2) NOT NULL DEFAULT 0,

    -- Dimension scores
    profile_completeness    NUMERIC(3,2) DEFAULT 0,
    evidence_coverage       NUMERIC(3,2) DEFAULT 0,
    credential_validity     NUMERIC(3,2) DEFAULT 0,
    operational_metrics     NUMERIC(3,2) DEFAULT 0,
    recruitment_capability  NUMERIC(3,2) DEFAULT 0,
    passport_completeness   NUMERIC(3,2) DEFAULT 0,

    -- Metadata
    breakdown           JSONB DEFAULT '{}',
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One score per organization
    CONSTRAINT uq_readiness_org UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_readiness_org ON public.readiness_scores(organization_id);

ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY readiness_select ON public.readiness_scores
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR auth.role() = 'service_role'
    );

CREATE POLICY readiness_insert ON public.readiness_scores
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR auth.role() = 'service_role'
    );

CREATE POLICY readiness_update ON public.readiness_scores
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR auth.role() = 'service_role'
    );

GRANT SELECT, INSERT, UPDATE ON public.readiness_scores TO authenticated, service_role;
