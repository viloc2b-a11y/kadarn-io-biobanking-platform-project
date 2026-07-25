-- ============================================================================
-- KADARN v2 — Confidence Core Enums and Tables (Loop 4, Phase 1)
-- ============================================================================
-- Migration: 086
-- Authority: KAD-LOOP-004 Phase 1, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Creates the foundational enums and tables for the Confidence domain:
--   1. Eleven (11) new ENUM types for confidence band, model status,
--      rule status/category/effect, assessment status, factor/blocker
--      classification, and readiness state.
--   2. confidence_models — versioned, tenant-scoped confidence model
--      definitions with effective dating and governance status.
--   3. confidence_rules — rule entries scoped to a confidence model,
--      with category, priority, effect configuration, and blocking
--      behavior support.
--
-- All enums use idempotent DO $$ blocks. Tables use IF NOT EXISTS.
-- RLS is enabled on all tables with tenant-scoped policies.
-- ============================================================================

-- ############################################################################
-- PART 1: NEW ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE confidence_band AS ENUM (
        'UNASSESSED',
        'VERY_LOW',
        'LOW',
        'MODERATE',
        'HIGH',
        'VERY_HIGH'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE confidence_model_status AS ENUM (
        'draft',
        'active',
        'deprecated',
        'retired'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE confidence_rule_status AS ENUM (
        'draft',
        'active',
        'deprecated',
        'retired'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE confidence_rule_category AS ENUM (
        'evidence_coverage',
        'evidence_quality',
        'review_completeness',
        'freshness',
        'consistency',
        'claim_completeness',
        'source_diversity',
        'governance_integrity'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE confidence_rule_effect_type AS ENUM (
        'positive',
        'penalty',
        'blocker'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_status AS ENUM (
        'pending',
        'completed',
        'failed',
        'superseded'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE factor_type AS ENUM (
        'positive_factor',
        'penalty'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE blocker_type AS ENUM (
        'missing_required_claim',
        'unreviewed_claim',
        'conflicting_evidence',
        'expired_evidence',
        'rejected_evidence',
        'stale_source',
        'incomplete_review',
        'insufficient_coverage',
        'inactive_model',
        'cross_tenant_inconsistency'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE readiness_state AS ENUM (
        'not_ready',
        'partially_ready',
        'ready',
        'conditionally_ready'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — confidence_models
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.confidence_models (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    name                        TEXT NOT NULL,
    description                 TEXT,
    version                     INTEGER NOT NULL DEFAULT 1,
    status                      confidence_model_status DEFAULT 'draft',
    owner_id                    UUID,
    effective_from              TIMESTAMPTZ NOT NULL,
    effective_until             TIMESTAMPTZ,
    methodology                 TEXT NOT NULL,
    minimum_data_requirements   TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deprecated_at               TIMESTAMPTZ,

    -- One active version per tenant
    CONSTRAINT uq_confidence_model_tenant_version UNIQUE (tenant_id, version)
);

COMMENT ON TABLE public.confidence_models IS
    'KAD-LOOP-004: Versioned, tenant-scoped confidence model definitions. One active version per tenant.';

COMMENT ON COLUMN public.confidence_models.tenant_id IS
    'KAD-LOOP-004: The organization/tenant that owns this confidence model.';
COMMENT ON COLUMN public.confidence_models.status IS
    'KAD-LOOP-004: Governance lifecycle — draft/active/deprecated/retired.';
COMMENT ON COLUMN public.confidence_models.version IS
    'KAD-LOOP-004: Monotonically increasing model version per tenant.';
COMMENT ON COLUMN public.confidence_models.effective_from IS
    'KAD-LOOP-004: Start of the window during which this model version is authoritative.';
COMMENT ON COLUMN public.confidence_models.effective_until IS
    'KAD-LOOP-004: End of the authoritative window. NULL = currently effective (no end date set).';
COMMENT ON COLUMN public.confidence_models.methodology IS
    'KAD-LOOP-004: Description of the scoring methodology/algorithms used.';
COMMENT ON COLUMN public.confidence_models.minimum_data_requirements IS
    'KAD-LOOP-004: Text describing data prerequisites before this model can produce meaningful scores.';
COMMENT ON COLUMN public.confidence_models.deprecated_at IS
    'KAD-LOOP-004: Timestamp when this model version was deprecated (if applicable).';

-- ############################################################################
-- PART 3: INDEXES — confidence_models
-- ############################################################################

-- Primary query pattern: find active model versions for a tenant
CREATE INDEX IF NOT EXISTS idx_confidence_models_tenant_status
    ON public.confidence_models(tenant_id, status);

-- Lookup by version (used with the UNIQUE constraint for upserts)
CREATE INDEX IF NOT EXISTS idx_confidence_models_tenant_version
    ON public.confidence_models(tenant_id, version);

-- Find models effective at a given point in time
CREATE INDEX IF NOT EXISTS idx_confidence_models_effective_from
    ON public.confidence_models(effective_from);

-- ############################################################################
-- PART 4: RLS — confidence_models
-- ############################################################################

ALTER TABLE public.confidence_models ENABLE ROW LEVEL SECURITY;

-- SELECT: tenant-scoped — user must be an active member of the owning org
DROP POLICY IF EXISTS cm_select_tenant ON public.confidence_models;
CREATE POLICY cm_select_tenant ON public.confidence_models
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: tenant-scoped
DROP POLICY IF EXISTS cm_insert_tenant ON public.confidence_models;
CREATE POLICY cm_insert_tenant ON public.confidence_models
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- UPDATE: tenant-scoped
DROP POLICY IF EXISTS cm_update_tenant ON public.confidence_models;
CREATE POLICY cm_update_tenant ON public.confidence_models
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- service_role full-access bypass
DROP POLICY IF EXISTS cm_all_service ON public.confidence_models;
CREATE POLICY cm_all_service ON public.confidence_models
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 5: updated_at TRIGGER — confidence_models
-- ############################################################################

-- trigger_set_updated_at() is defined in migration 062 and is idempotent.
DROP TRIGGER IF EXISTS trg_confidence_models_updated_at
    ON public.confidence_models;

CREATE TRIGGER trg_confidence_models_updated_at
    BEFORE UPDATE ON public.confidence_models
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ############################################################################
-- PART 6: TABLE — confidence_rules
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.confidence_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confidence_model_id UUID NOT NULL REFERENCES public.confidence_models(id) ON DELETE CASCADE,
    rule_key            TEXT NOT NULL,
    version             INTEGER NOT NULL DEFAULT 1,
    category            confidence_rule_category NOT NULL,
    description         TEXT NOT NULL,
    input_requirements  TEXT,
    condition           TEXT NOT NULL,
    effect_type         confidence_rule_effect_type NOT NULL,
    effect_value        NUMERIC(5,2) NOT NULL,
    priority            INTEGER DEFAULT 0,
    blocking_behavior   BOOLEAN DEFAULT false,
    effective_from      TIMESTAMPTZ NOT NULL,
    effective_until     TIMESTAMPTZ,
    status              confidence_rule_status DEFAULT 'draft',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One rule_key per model
    CONSTRAINT uq_confidence_rule_model_key UNIQUE (confidence_model_id, rule_key)
);

COMMENT ON TABLE public.confidence_rules IS
    'KAD-LOOP-004: Rule entries scoped to a confidence model. Each rule_key is unique per model.';

COMMENT ON COLUMN public.confidence_rules.confidence_model_id IS
    'KAD-LOOP-004: FK to the owning confidence model. CASCADE delete removes rules when a model is removed.';
COMMENT ON COLUMN public.confidence_rules.rule_key IS
    'KAD-LOOP-004: Stable identifier for the rule, unique per model (e.g., min_evidence_coverage).';
COMMENT ON COLUMN public.confidence_rules.category IS
    'KAD-LOOP-004: Classification of the rule — evidence_coverage, evidence_quality, review_completeness, etc.';
COMMENT ON COLUMN public.confidence_rules.condition IS
    'KAD-LOOP-004: Executable condition expression that determines when this rule applies.';
COMMENT ON COLUMN public.confidence_rules.effect_type IS
    'KAD-LOOP-004: How the rule affects scoring — positive (adds), penalty (subtracts), blocker (prevents).';
COMMENT ON COLUMN public.confidence_rules.effect_value IS
    'KAD-LOOP-004: Numeric effect magnitude (e.g., 0.15 for +0.15). Range model-specific.';
COMMENT ON COLUMN public.confidence_rules.priority IS
    'KAD-LOOP-004: Evaluation priority. Higher values evaluated first. Default 0.';
COMMENT ON COLUMN public.confidence_rules.blocking_behavior IS
    'KAD-LOOP-004: If true, this rule can generate a confidence_blocker that blocks scoring.';
COMMENT ON COLUMN public.confidence_rules.effective_from IS
    'KAD-LOOP-004: Start of the window during which this rule version is authoritative.';
COMMENT ON COLUMN public.confidence_rules.effective_until IS
    'KAD-LOOP-004: End of the authoritative window. NULL = currently effective.';
COMMENT ON COLUMN public.confidence_rules.status IS
    'KAD-LOOP-004: Rule governance lifecycle — draft/active/deprecated/retired.';

-- ############################################################################
-- PART 7: INDEXES — confidence_rules
-- ############################################################################

-- Primary query: fetch all rules for a model, ordered by priority
CREATE INDEX IF NOT EXISTS idx_confidence_rules_model_priority
    ON public.confidence_rules(confidence_model_id, priority DESC);

-- Lookup rules by key within a model
CREATE INDEX IF NOT EXISTS idx_confidence_rules_model_key
    ON public.confidence_rules(confidence_model_id, rule_key);

-- Filter rules by status (active rules query)
CREATE INDEX IF NOT EXISTS idx_confidence_rules_status
    ON public.confidence_rules(status);

-- Filter rules by category (dashboard / category-based analysis)
CREATE INDEX IF NOT EXISTS idx_confidence_rules_category
    ON public.confidence_rules(category);

-- ############################################################################
-- PART 8: RLS — confidence_rules
-- ############################################################################
-- RLS inherits tenant scope from the parent confidence_model via FK.
-- A user may access rules for a model if they are an active member of the
-- same tenant that owns the confidence_model.

ALTER TABLE public.confidence_rules ENABLE ROW LEVEL SECURITY;

-- SELECT: inherit tenant from parent confidence_model
DROP POLICY IF EXISTS cr_select_tenant ON public.confidence_rules;
CREATE POLICY cr_select_tenant ON public.confidence_rules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.confidence_models cm
            WHERE cm.id = confidence_rules.confidence_model_id
              AND cm.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: inherit tenant from parent confidence_model
DROP POLICY IF EXISTS cr_insert_tenant ON public.confidence_rules;
CREATE POLICY cr_insert_tenant ON public.confidence_rules
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.confidence_models cm
            WHERE cm.id = confidence_rules.confidence_model_id
              AND cm.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- UPDATE: inherit tenant from parent confidence_model
DROP POLICY IF EXISTS cr_update_tenant ON public.confidence_rules;
CREATE POLICY cr_update_tenant ON public.confidence_rules
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.confidence_models cm
            WHERE cm.id = confidence_rules.confidence_model_id
              AND cm.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- DELETE: inherit tenant from parent confidence_model
DROP POLICY IF EXISTS cr_delete_tenant ON public.confidence_rules;
CREATE POLICY cr_delete_tenant ON public.confidence_rules
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.confidence_models cm
            WHERE cm.id = confidence_rules.confidence_model_id
              AND cm.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- service_role full-access bypass
DROP POLICY IF EXISTS cr_all_service ON public.confidence_rules;
CREATE POLICY cr_all_service ON public.confidence_rules
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 9: updated_at TRIGGER — confidence_rules
-- ############################################################################

-- trigger_set_updated_at() is defined in migration 062 and is idempotent.
DROP TRIGGER IF EXISTS trg_confidence_rules_updated_at
    ON public.confidence_rules;

CREATE TRIGGER trg_confidence_rules_updated_at
    BEFORE UPDATE ON public.confidence_rules
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ############################################################################
-- PART 10: GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.confidence_models TO authenticated, service_role;
GRANT DELETE ON public.confidence_models TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.confidence_rules TO authenticated, service_role;
GRANT DELETE ON public.confidence_rules TO service_role;

-- ############################################################################
-- END OF MIGRATION 086
-- ============================================================================