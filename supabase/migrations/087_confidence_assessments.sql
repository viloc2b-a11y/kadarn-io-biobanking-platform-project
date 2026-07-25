-- ============================================================================
-- KADARN v2 — Confidence Assessments (Loop 4, Phase 1)
-- ============================================================================
-- Migration: 087
-- Authority: KAD-LOOP-004 Phase 1, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Creates the assessment-layer tables for the Confidence domain:
--   1. confidence_assessments — the central scoring record that links a
--      capability to a confidence model version, storing the computed
--      score, band, readiness state, and assessment metadata.
--      Multiple assessments per capability are supported over time,
--      forming a lineage chain via supersedes.
--   2. confidence_factors — individual factor contributions that
--      constitute an assessment score, linked to the rule that produced
--      them and the source entity (evidence, claim, review, etc.).
--   3. confidence_blockers — blocking conditions that prevent scoring
--      (or reduce confidence) for an assessment.
--
-- RLS is enabled on all tables. confidence_assessments is tenant-scoped
-- directly; confidence_factors and confidence_blockers inherit tenant
-- from their parent assessment via FK. (Sub-table RLS policies are
-- added in migration 088.)
-- ============================================================================

-- ############################################################################
-- PART 1: TABLE — confidence_assessments
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.confidence_assessments (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                 UUID NOT NULL,
    institution_id            UUID NOT NULL,
    capability_id             UUID NOT NULL REFERENCES public.capabilities(id) ON DELETE RESTRICT,
    confidence_model_id       UUID NOT NULL REFERENCES public.confidence_models(id) ON DELETE RESTRICT,
    model_version             INTEGER NOT NULL,
    score                     NUMERIC(5,4) NOT NULL CHECK (score >= 0 AND score <= 1),
    confidence_band           confidence_band NOT NULL,
    readiness_state           readiness_state NOT NULL,
    assessment_status         assessment_status DEFAULT 'completed',
    calculated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until               TIMESTAMPTZ,
    stale_at                  TIMESTAMPTZ,
    requires_manual_review    BOOLEAN DEFAULT false,
    explanation_summary       TEXT,
    input_snapshot_hash       TEXT NOT NULL,
    output_hash               TEXT NOT NULL,
    supersedes_assessment_id  UUID REFERENCES public.confidence_assessments(id) ON DELETE SET NULL,
    created_by                UUID,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.confidence_assessments IS
    'KAD-LOOP-004: Central confidence scoring record linking a capability to a model version at a point in time. Supports multiple assessments per capability over time with supersession lineage.';

COMMENT ON COLUMN public.confidence_assessments.tenant_id IS
    'KAD-LOOP-004: The organization/tenant that owns this assessment.';
COMMENT ON COLUMN public.confidence_assessments.institution_id IS
    'KAD-LOOP-004: The institution being assessed (denormalized from the capability for query efficiency).';
COMMENT ON COLUMN public.confidence_assessments.capability_id IS
    'KAD-LOOP-004: FK to the assessed capability. RESTRICT prevents deletion of capabilities with assessments.';
COMMENT ON COLUMN public.confidence_assessments.confidence_model_id IS
    'KAD-LOOP-004: FK to the confidence model used. RESTRICT prevents deletion of models with assessments.';
COMMENT ON COLUMN public.confidence_assessments.model_version IS
    'KAD-LOOP-004: Snapshot of the model version at calculation time.';
COMMENT ON COLUMN public.confidence_assessments.score IS
    'KAD-LOOP-004: Final computed confidence score [0.0000–1.0000].';
COMMENT ON COLUMN public.confidence_assessments.confidence_band IS
    'KAD-LOOP-004: Mapped band from the computed score (UNASSESSED/VERY_LOW/LOW/MODERATE/HIGH/VERY_HIGH).';
COMMENT ON COLUMN public.confidence_assessments.readiness_state IS
    'KAD-LOOP-004: Derived readiness state (not_ready/partially_ready/ready/conditionally_ready).';
COMMENT ON COLUMN public.confidence_assessments.assessment_status IS
    'KAD-LOOP-004: Processing status — pending/completed/failed/superseded.';
COMMENT ON COLUMN public.confidence_assessments.calculated_at IS
    'KAD-LOOP-004: When the score was computed.';
COMMENT ON COLUMN public.confidence_assessments.valid_until IS
    'KAD-LOOP-004: Upper bound of the assessment validity period. NULL = currently valid.';
COMMENT ON COLUMN public.confidence_assessments.stale_at IS
    'KAD-LOOP-004: Threshold after which the assessment is considered stale and should be refreshed.';
COMMENT ON COLUMN public.confidence_assessments.requires_manual_review IS
    'KAD-LOOP-004: Flag indicating the assessment needs human review before being considered authoritative.';
COMMENT ON COLUMN public.confidence_assessments.explanation_summary IS
    'KAD-LOOP-004: Human-readable summary of how the score was derived.';
COMMENT ON COLUMN public.confidence_assessments.input_snapshot_hash IS
    'KAD-LOOP-004: Deterministic hash of all input data at calculation time (for reproducibility).';
COMMENT ON COLUMN public.confidence_assessments.output_hash IS
    'KAD-LOOP-004: Deterministic hash of the output score and factors (for integrity verification).';
COMMENT ON COLUMN public.confidence_assessments.supersedes_assessment_id IS
    'KAD-LOOP-004: Self-referential FK — the previous assessment that this one supersedes. NULL = first assessment for this capability/model pair.';
COMMENT ON COLUMN public.confidence_assessments.created_by IS
    'KAD-LOOP-004: The actor (user or system) that triggered this assessment.';

-- ############################################################################
-- PART 2: INDEXES — confidence_assessments
-- ############################################################################

-- Primary query: find the latest assessment for a capability
CREATE INDEX IF NOT EXISTS idx_confidence_assessments_capability
    ON public.confidence_assessments(capability_id, calculated_at DESC);

-- Tenant-scoped queries (dashboard, listing)
CREATE INDEX IF NOT EXISTS idx_confidence_assessments_tenant
    ON public.confidence_assessments(tenant_id, calculated_at DESC);

-- Find assessments that need refresh (stale or pending)
CREATE INDEX IF NOT EXISTS idx_confidence_assessments_stale
    ON public.confidence_assessments(stale_at, assessment_status)
    WHERE assessment_status = 'completed';

-- Find active (non-superseded) assessments for a capability/model
CREATE INDEX IF NOT EXISTS idx_confidence_assessments_active
    ON public.confidence_assessments(capability_id, confidence_model_id)
    WHERE assessment_status = 'completed';

-- Lookup supersession chain (find what an assessment supersedes)
CREATE INDEX IF NOT EXISTS idx_confidence_assessments_supersedes
    ON public.confidence_assessments(supersedes_assessment_id)
    WHERE supersedes_assessment_id IS NOT NULL;

-- Assessments by model version (for validation / audit)
CREATE INDEX IF NOT EXISTS idx_confidence_assessments_model
    ON public.confidence_assessments(confidence_model_id, model_version);

-- ############################################################################
-- PART 3: RLS — confidence_assessments
-- ############################################################################

ALTER TABLE public.confidence_assessments ENABLE ROW LEVEL SECURITY;

-- SELECT: tenant-scoped
DROP POLICY IF EXISTS ca_select_tenant ON public.confidence_assessments;
CREATE POLICY ca_select_tenant ON public.confidence_assessments
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: tenant-scoped
DROP POLICY IF EXISTS ca_insert_tenant ON public.confidence_assessments;
CREATE POLICY ca_insert_tenant ON public.confidence_assessments
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- UPDATE: tenant-scoped
DROP POLICY IF EXISTS ca_update_tenant ON public.confidence_assessments;
CREATE POLICY ca_update_tenant ON public.confidence_assessments
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- DELETE: tenant-scoped
DROP POLICY IF EXISTS ca_delete_tenant ON public.confidence_assessments;
CREATE POLICY ca_delete_tenant ON public.confidence_assessments
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- service_role full-access bypass
DROP POLICY IF EXISTS ca_all_service ON public.confidence_assessments;
CREATE POLICY ca_all_service ON public.confidence_assessments
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 4: TABLE — confidence_factors
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.confidence_factors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id       UUID NOT NULL REFERENCES public.confidence_assessments(id) ON DELETE CASCADE,
    rule_id             UUID REFERENCES public.confidence_rules(id) ON DELETE SET NULL,
    factor_type         factor_type NOT NULL,
    source_entity_type  TEXT NOT NULL,
    source_entity_id    UUID NOT NULL,
    raw_value           NUMERIC,
    normalized_value    NUMERIC(5,4) NOT NULL CHECK (normalized_value >= 0 AND normalized_value <= 1),
    applied_weight      NUMERIC(5,4) NOT NULL DEFAULT 1.0 CHECK (applied_weight >= 0 AND applied_weight <= 1),
    score_contribution  NUMERIC(5,4),
    exclusion_reason    TEXT,
    explanation         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.confidence_factors IS
    'KAD-LOOP-004: Individual factor contributions to a confidence assessment score. Each factor records what rule produced it and what source entity was evaluated.';

COMMENT ON COLUMN public.confidence_factors.assessment_id IS
    'KAD-LOOP-004: FK to the parent assessment. CASCADE delete removes factors when an assessment is removed.';
COMMENT ON COLUMN public.confidence_factors.rule_id IS
    'KAD-LOOP-004: FK to the rule that produced this factor. SET NULL preserves the factor if the rule is removed.';
COMMENT ON COLUMN public.confidence_factors.factor_type IS
    'KAD-LOOP-004: Whether this factor contributes positively (positive_factor) or negatively (penalty).';
COMMENT ON COLUMN public.confidence_factors.source_entity_type IS
    'KAD-LOOP-004: Entity type that was evaluated (e.g., claim, evidence, review, source).';
COMMENT ON COLUMN public.confidence_factors.source_entity_id IS
    'KAD-LOOP-004: UUID of the evaluated entity.';
COMMENT ON COLUMN public.confidence_factors.raw_value IS
    'KAD-LOOP-004: Raw computed value before normalization.';
COMMENT ON COLUMN public.confidence_factors.normalized_value IS
    'KAD-LOOP-004: Normalized value [0.0000–1.0000] for consistent weighting.';
COMMENT ON COLUMN public.confidence_factors.applied_weight IS
    'KAD-LOOP-004: Weight applied to this factor [0.0000–1.0000]. Default 1.0.';
COMMENT ON COLUMN public.confidence_factors.score_contribution IS
    'KAD-LOOP-004: Actual contribution to the final score (normalized_value * applied_weight).';
COMMENT ON COLUMN public.confidence_factors.exclusion_reason IS
    'KAD-LOOP-004: If the factor was excluded from scoring, the reason why.';
COMMENT ON COLUMN public.confidence_factors.explanation IS
    'KAD-LOOP-004: Human-readable explanation of how this factor was computed.';

-- ############################################################################
-- PART 5: INDEXES — confidence_factors
-- ############################################################################

-- Primary query: all factors for an assessment
CREATE INDEX IF NOT EXISTS idx_confidence_factors_assessment
    ON public.confidence_factors(assessment_id);

-- Filter factors by type (positive vs penalty breakdown)
CREATE INDEX IF NOT EXISTS idx_confidence_factors_type
    ON public.confidence_factors(assessment_id, factor_type);

-- Trace origin of factors back to source entity
CREATE INDEX IF NOT EXISTS idx_confidence_factors_source
    ON public.confidence_factors(source_entity_type, source_entity_id);

-- ############################################################################
-- PART 6: TABLE — confidence_blockers
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.confidence_blockers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id       UUID NOT NULL REFERENCES public.confidence_assessments(id) ON DELETE CASCADE,
    blocker_type        blocker_type NOT NULL,
    source_entity_type  TEXT NOT NULL,
    source_entity_id    UUID,
    description         TEXT NOT NULL,
    blocks_scoring      BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.confidence_blockers IS
    'KAD-LOOP-004: Blocking conditions that prevent or degrade scoring for a confidence assessment.';

COMMENT ON COLUMN public.confidence_blockers.assessment_id IS
    'KAD-LOOP-004: FK to the parent assessment. CASCADE delete removes blockers when an assessment is removed.';
COMMENT ON COLUMN public.confidence_blockers.blocker_type IS
    'KAD-LOOP-004: Classification of the blocking condition (e.g., missing_required_claim, expired_evidence).';
COMMENT ON COLUMN public.confidence_blockers.source_entity_type IS
    'KAD-LOOP-004: Entity type that triggered the blocker (e.g., claim, evidence, source).';
COMMENT ON COLUMN public.confidence_blockers.source_entity_id IS
    'KAD-LOOP-004: UUID of the entity that triggered the blocker. NULL if not entity-specific.';
COMMENT ON COLUMN public.confidence_blockers.description IS
    'KAD-LOOP-004: Human-readable description of the blocking condition.';
COMMENT ON COLUMN public.confidence_blockers.blocks_scoring IS
    'KAD-LOOP-004: If true, this blocker prevents scoring entirely. If false, it degrades confidence.';

-- ############################################################################
-- PART 7: INDEXES — confidence_blockers
-- ############################################################################

-- Primary query: all blockers for an assessment
CREATE INDEX IF NOT EXISTS idx_confidence_blockers_assessment
    ON public.confidence_blockers(assessment_id);

-- Filter blockers by type (dashboard / analysis)
CREATE INDEX IF NOT EXISTS idx_confidence_blockers_type
    ON public.confidence_blockers(assessment_id, blocker_type);

-- ############################################################################
-- PART 8: GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.confidence_assessments TO authenticated, service_role;
GRANT DELETE ON public.confidence_assessments TO service_role;

GRANT SELECT, INSERT ON public.confidence_factors TO authenticated, service_role;
GRANT UPDATE, DELETE ON public.confidence_factors TO service_role;

GRANT SELECT, INSERT ON public.confidence_blockers TO authenticated, service_role;
GRANT UPDATE, DELETE ON public.confidence_blockers TO service_role;

-- ############################################################################
-- END OF MIGRATION 087
-- ============================================================================