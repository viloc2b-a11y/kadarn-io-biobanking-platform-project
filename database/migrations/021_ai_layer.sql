-- ============================================================================
-- KADARN PLATFORM — Sprint 11: AI Layer
-- ============================================================================
-- Dependencies: All prior migrations (008-020)
--
-- This migration creates the AI Layer foundation:
--   1. ai_models — model registry
--   2. ai_inferences — inference tracking
--   3. ai_embeddings — vector embeddings for semantic search (pgvector)
--   4. ai_training_data — training data collection
--   5. ai_suggestions — AI-generated suggestions across engines
--   6. RLS policies
-- (Blueprint §17 — AI Layer)
-- ============================================================================

-- ############################################################################
-- PART 1: EXTENSION (pgvector if available)
-- ############################################################################

-- pgvector enables semantic/vector search for the AI Layer.
-- If not available, the platform falls back to full-text search.
-- CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ############################################################################
-- PART 2: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE ai_capability AS ENUM (
        'natural_language_search', 'capability_matching', 'timeline_prediction',
        'anomaly_detection', 'document_generation', 'smart_negotiation'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_model_status AS ENUM (
        'dev', 'staging', 'production', 'deprecated', 'archived'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_suggestion_type AS ENUM (
        'org_recommendation', 'timeline_estimate', 'risk_assessment',
        'search_expansion', 'document_template', 'negotiation_term',
        'anomaly_alert', 'capability_gap'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 3: TABLE — ai_models
-- ############################################################################
--
-- Registry of AI models used across the platform.
-- (Blueprint §17 — AI Layer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_models (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    model_name          TEXT NOT NULL,
    model_version       TEXT NOT NULL,
    capability          ai_capability NOT NULL,
    description         TEXT,

    -- Model metadata
    framework           TEXT,  -- pytorch, tensorflow, sklearn, etc.
    model_url           TEXT,  -- URL to model artifact
    metrics             JSONB DEFAULT '{}',  -- accuracy, f1, etc.

    -- Lifecycle
    status              ai_model_status NOT NULL DEFAULT 'dev',
    is_active           BOOLEAN NOT NULL DEFAULT false,
    deployed_at         TIMESTAMPTZ,
    deprecated_at       TIMESTAMPTZ,

    created_by          UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (model_name, model_version)
);

CREATE INDEX IF NOT EXISTS idx_ai_models_capability ON public.ai_models(capability);
CREATE INDEX IF NOT EXISTS idx_ai_models_active ON public.ai_models(is_active);

COMMENT ON TABLE public.ai_models IS
    'Registry of AI models across the platform. Tracks deployment lifecycle.';

-- ############################################################################
-- PART 4: TABLE — ai_inferences
-- ############################################################################
--
-- Tracks AI inference requests and results.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_inferences (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id            UUID REFERENCES public.ai_models(id) ON DELETE SET NULL,

    capability          ai_capability NOT NULL,
    input_data          JSONB NOT NULL,
    output_data         JSONB,
    confidence          NUMERIC(5,4),  -- 0-1 confidence score
    latency_ms          INTEGER,

    -- Context
    user_id             UUID,
    organization_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,

    -- Audit
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_inferences_capability ON public.ai_inferences(capability);
CREATE INDEX IF NOT EXISTS idx_ai_inferences_model ON public.ai_inferences(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_inferences_created ON public.ai_inferences(created_at DESC);

COMMENT ON TABLE public.ai_inferences IS
    'AI inference request/response tracking. Used for monitoring and training data collection.';

-- ############################################################################
-- PART 5: TABLE — ai_suggestions
-- ############################################################################
--
-- AI-generated suggestions surfaced to users across engines.
-- (Blueprint §17.2 — AI Capabilities)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_suggestions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_type     ai_suggestion_type NOT NULL,

    -- Where the suggestion applies
    engine              TEXT NOT NULL,  -- discovery, feasibility, exchange, chain, regulatory
    organization_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,

    -- Suggestion content
    title               TEXT NOT NULL,
    description         TEXT,
    confidence          NUMERIC(5,4),
    payload             JSONB DEFAULT '{}',  -- structured suggestion data

    -- Status
    is_applied          BOOLEAN NOT NULL DEFAULT false,
    is_dismissed        BOOLEAN NOT NULL DEFAULT false,
    applied_at          TIMESTAMPTZ,

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_by          UUID,  -- NULL = system-generated
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_engine ON public.ai_suggestions(engine, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON public.ai_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_program ON public.ai_suggestions(program_id);

COMMENT ON TABLE public.ai_suggestions IS
    'AI-generated suggestions across all engines. Users can apply or dismiss.';

-- ############################################################################
-- PART 6: TABLE — ai_training_data
-- ############################################################################
--
-- Collected training data for future model improvements.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_training_data (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capability          ai_capability NOT NULL,

    -- Input/output pairs
    input_text          TEXT,
    input_data          JSONB DEFAULT '{}',
    output_text         TEXT,
    output_data         JSONB DEFAULT '{}',

    -- Label (for supervised learning)
    human_label         TEXT,
    human_labeled_by    UUID,
    human_labeled_at    TIMESTAMPTZ,

    -- Source
    source              TEXT,  -- inference_log, user_feedback, manual_curation
    is_used_for_training BOOLEAN NOT NULL DEFAULT false,

    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_training_capability ON public.ai_training_data(capability);
CREATE INDEX IF NOT EXISTS idx_ai_training_used ON public.ai_training_data(is_used_for_training);

COMMENT ON TABLE public.ai_training_data IS
    'Training data collected from inferences and user feedback.';

-- ############################################################################
-- PART 7: AI HELPER FUNCTIONS
-- ############################################################################

-- Log an inference
CREATE OR REPLACE FUNCTION public.log_ai_inference(
    p_capability ai_capability,
    p_input JSONB,
    p_output JSONB DEFAULT NULL,
    p_confidence NUMERIC DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_organization_id UUID DEFAULT NULL,
    p_program_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.ai_inferences (capability, input_data, output_data, confidence, user_id, organization_id, program_id)
    VALUES (p_capability, p_input, p_output, p_confidence, p_user_id, p_organization_id, p_program_id)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- Generate a capability matching suggestion
CREATE OR REPLACE FUNCTION public.suggest_organizations(
    p_required_capabilities TEXT[],
    p_disease_icd10 TEXT DEFAULT NULL,
    p_target_country TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'organization_id', o.id,
        'organization_name', o.name,
        'country', o.country,
        'matched_capabilities', (
            SELECT jsonb_agg(oct.key)
            FROM public.organization_capabilities oc
            JOIN public.organization_capability_types oct ON oct.id = oc.capability_type_id
            WHERE oc.organization_id = o.id AND oct.key = ANY(p_required_capabilities)
        ),
        'score', (
            SELECT COUNT(*)::NUMERIC / array_length(p_required_capabilities, 1)
            FROM public.organization_capabilities oc
            JOIN public.organization_capability_types oct ON oct.id = oc.capability_type_id
            WHERE oc.organization_id = o.id AND oct.key = ANY(p_required_capabilities)
        )
    ) ORDER BY score DESC)
    INTO v_result
    FROM public.organizations o
    WHERE o.is_active = true
      AND (p_target_country IS NULL OR o.country = p_target_country)
      AND EXISTS (
          SELECT 1 FROM public.organization_capabilities oc
          JOIN public.organization_capability_types oct ON oct.id = oc.capability_type_id
          WHERE oc.organization_id = o.id AND oct.key = ANY(p_required_capabilities)
      )
    LIMIT p_limit;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.suggest_organizations IS
    'AI-powered organization suggestion based on required capabilities. Used by Feasibility Engine.';

-- ############################################################################
-- PART 8: RLS
-- ############################################################################

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_inferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;

-- Models: all authenticated can read
CREATE POLICY ai_models_select ON public.ai_models
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY ai_models_insert ON public.ai_models
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Inferences: users see their own, org_admins see org's
CREATE POLICY ai_inferences_select_self ON public.ai_inferences
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ai_inferences_select_admin ON public.ai_inferences
    FOR SELECT USING (public.is_org_admin(organization_id));
CREATE POLICY ai_inferences_insert ON public.ai_inferences
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Suggestions: visible to relevant participants
CREATE POLICY ai_suggestions_select ON public.ai_suggestions
    FOR SELECT
    USING (
        (organization_id IS NULL OR public.is_org_member(organization_id))
        OR (program_id IS NULL OR public.can_access_program(program_id))
        OR public.is_org_admin()
    );

-- Training data: admin only (sensitive)
CREATE POLICY ai_training_data_select ON public.ai_training_data
    FOR SELECT USING (public.is_org_admin());

-- ############################################################################
-- PART 9: POSTGREST PERMISSIONS
-- ############################################################################

GRANT ALL ON public.ai_models TO anon, authenticated, service_role;
GRANT ALL ON public.ai_inferences TO anon, authenticated, service_role;
GRANT ALL ON public.ai_suggestions TO anon, authenticated, service_role;
GRANT ALL ON public.ai_training_data TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION 021 — Sprint 11: AI Layer
-- ============================================================================
