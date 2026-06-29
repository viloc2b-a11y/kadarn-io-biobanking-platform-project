-- ============================================================================
-- KADARN PLATFORM — Sprint 4: Feasibility Engine
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: 008, 009, 010, 013 (supply_items)
--
-- This migration creates the Feasibility Engine foundation:
--   1. feasibility_assessments — store assessment requests and results
--   2. feasibility_scores — per-organization scoring within assessments
--   3. feasibility_scoring function — algorithmic org matching
--   4. RLS policies
-- (Blueprint §8 — Feasibility Engine)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE feasibility_status AS ENUM (
        'draft', 'pending', 'completed', 'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE feasibility_dimension AS ENUM (
        'capacity', 'timeline', 'quality', 'regulatory', 'cost', 'risk'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — feasibility_assessments
-- ############################################################################
--
-- A feasibility assessment evaluates whether a program can succeed
-- given the current network state.
-- (Blueprint §8.3 — Output)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feasibility_assessments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who requested this assessment
    created_by          UUID NOT NULL,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Assessment input (the program requirements)
    program_name        TEXT NOT NULL,
    program_description TEXT,
    program_type        TEXT,
    therapeutic_area    TEXT,
    disease_icd10       TEXT,
    disease_label       TEXT,
    required_sample_types TEXT[] DEFAULT '{}',
    required_capabilities TEXT[] DEFAULT '{}',  -- capability keys (sponsor, cro, biobank, etc.)
    target_countries    TEXT[] DEFAULT '{}',
    estimated_sample_count INTEGER,
    urgency             TEXT DEFAULT 'standard'
                        CHECK (urgency IN ('standard', 'fast', 'flexible')),

    -- Assessment configuration
    dimensions          feasibility_dimension[] DEFAULT '{capacity,quality,regulatory,cost,risk,timeline}',

    -- Assessment result
    status              feasibility_status NOT NULL DEFAULT 'draft',
    summary             TEXT,                 -- human-readable summary
    risk_level          TEXT,                 -- low, medium, high
    overall_score       NUMERIC(5,2),         -- 0-100 composite score
    estimated_timeline_days INTEGER,          -- estimated days to complete
    estimated_cost_min   NUMERIC(12,2),
    estimated_cost_max   NUMERIC(12,2),
    candidate_count     INTEGER,              -- number of candidate orgs found
    metadata            JSONB DEFAULT '{}',

    -- Audit
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feasibility_org
    ON public.feasibility_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_feasibility_status
    ON public.feasibility_assessments(status);
CREATE INDEX IF NOT EXISTS idx_feasibility_created
    ON public.feasibility_assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_feasibility_disease
    ON public.feasibility_assessments(disease_icd10);

COMMENT ON TABLE public.feasibility_assessments IS
    'Feasibility assessments. Each assessment evaluates whether a program can succeed given the current network state.';

-- ############################################################################
-- PART 3: TABLE — feasibility_scores
-- ############################################################################
--
-- Per-organization scoring within an assessment.
-- (Blueprint §8.3 — Candidate site list with capability fit scores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feasibility_scores (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id       UUID NOT NULL REFERENCES public.feasibility_assessments(id) ON DELETE CASCADE,

    -- The candidate organization
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_name   TEXT NOT NULL,        -- denormalized for convenience
    organization_country CHAR(2),

    -- Fit scoring
    capability_score    NUMERIC(5,2) NOT NULL DEFAULT 0,  -- how well capabilities match
    capacity_score      NUMERIC(5,2) NOT NULL DEFAULT 0,  -- available capacity
    quality_score       NUMERIC(5,2) NOT NULL DEFAULT 0,  -- certifications and quality
    geographic_score    NUMERIC(5,2) NOT NULL DEFAULT 0,  -- geographic fit
    overall_score       NUMERIC(5,2) NOT NULL DEFAULT 0,  -- weighted composite

    -- Details
    matched_capabilities TEXT[] DEFAULT '{}',
    certifications      TEXT[] DEFAULT '{}',
    country             TEXT,
    notes               TEXT,

    UNIQUE (assessment_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_feasibility_scores_assessment
    ON public.feasibility_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_feasibility_scores_org
    ON public.feasibility_scores(organization_id);

COMMENT ON TABLE public.feasibility_scores IS
    'Per-organization scoring within a feasibility assessment.';

-- ############################################################################
-- PART 4: FEASIBILITY SCORING FUNCTION
-- ############################################################################
--
-- Runs a feasibility assessment based on program requirements.
-- Scores organizations by:
--   1. Capability match (do they have the required capabilities?)
--   2. Supply item match (do they have relevant supply items?)
--   3. Geographic match (are they in the target countries?)
--   4. Quality (certifications)
-- (Blueprint §8.2 — Feasibility Dimensions)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.run_feasibility_assessment(
    p_assessment_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_assessment RECORD;
    v_org_record RECORD;
    v_capability_score NUMERIC(5,2);
    v_supply_score NUMERIC(5,2);
    v_geo_score NUMERIC(5,2);
    v_quality_score NUMERIC(5,2);
    v_overall NUMERIC(5,2);
    v_candidate_count INTEGER := 0;
    v_total_score NUMERIC(5,2) := 0;
BEGIN
    -- Get the assessment
    SELECT * INTO v_assessment
    FROM public.feasibility_assessments
    WHERE id = p_assessment_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Delete existing scores for this assessment
    DELETE FROM public.feasibility_scores
    WHERE assessment_id = p_assessment_id;

    -- Score each active organization
    FOR v_org_record IN
        SELECT o.id, o.name, o.country, o.certifications
        FROM public.organizations o
        WHERE o.is_active = true
    LOOP
        -- 1. Capability score (0-100)
        SELECT COALESCE(
            (SELECT COUNT(*)::NUMERIC * 20
             FROM public.organization_capabilities oc
             JOIN public.organization_capability_types oct ON oct.id = oc.capability_type_id
             WHERE oc.organization_id = v_org_record.id
               AND oct.key = ANY(v_assessment.required_capabilities)
            ), 0
        ) INTO v_capability_score;

        -- Cap: 100 max
        v_capability_score := LEAST(v_capability_score, 100);

        -- 2. Supply item score (0-100)
        SELECT COALESCE(
            (SELECT COUNT(*)::NUMERIC * 25
             FROM public.supply_items si
             WHERE si.organization_id = v_org_record.id
               AND si.status = 'active'
               AND (v_assessment.disease_icd10 IS NULL OR si.disease_icd10 = v_assessment.disease_icd10)
            ), 0
        ) INTO v_supply_score;
        v_supply_score := LEAST(v_supply_score, 100);

        -- 3. Geographic score (0-100)
        IF v_assessment.target_countries IS NULL OR array_length(v_assessment.target_countries, 1) IS NULL THEN
            v_geo_score := 50; -- neutral if no country filter
        ELSIF v_org_record.country = ANY(v_assessment.target_countries) THEN
            v_geo_score := 100;
        ELSE
            v_geo_score := 0;
        END IF;

        -- 4. Quality score (0-100) based on certifications
        IF v_org_record.certifications IS NOT NULL AND array_length(v_org_record.certifications, 1) > 0 THEN
            v_quality_score := LEAST(array_length(v_org_record.certifications, 1)::NUMERIC * 25, 100);
        ELSE
            v_quality_score := 20; -- base score for having no certifications
        END IF;

        -- Composite score (weighted average)
        v_overall := (
            v_capability_score * 0.40 +
            v_supply_score * 0.25 +
            v_geo_score * 0.20 +
            v_quality_score * 0.15
        );

        -- Only insert if at least one capability matches
        IF v_capability_score > 0 THEN
            INSERT INTO public.feasibility_scores (
                assessment_id, organization_id, organization_name, organization_country,
                capability_score, capacity_score, quality_score, geographic_score, overall_score,
                matched_capabilities, certifications, country
            ) VALUES (
                p_assessment_id, v_org_record.id, v_org_record.name, v_org_record.country,
                v_capability_score, 50, v_quality_score, v_geo_score, v_overall,
                (SELECT ARRAY_AGG(oct.key)
                 FROM public.organization_capabilities oc
                 JOIN public.organization_capability_types oct ON oct.id = oc.capability_type_id
                 WHERE oc.organization_id = v_org_record.id
                   AND oct.key = ANY(v_assessment.required_capabilities)),
                v_org_record.certifications,
                v_org_record.country
            );

            v_candidate_count := v_candidate_count + 1;
            v_total_score := v_total_score + v_overall;
        END IF;
    END LOOP;

    -- Update assessment with results
    UPDATE public.feasibility_assessments
    SET
        status = 'completed',
        candidate_count = v_candidate_count,
        overall_score = CASE WHEN v_candidate_count > 0
                         THEN ROUND(v_total_score / v_candidate_count, 2)
                         ELSE 0 END,
        risk_level = CASE
            WHEN v_candidate_count >= 5 THEN 'low'
            WHEN v_candidate_count >= 2 THEN 'medium'
            ELSE 'high'
        END,
        estimated_timeline_days = CASE
            WHEN v_candidate_count >= 5 THEN 90
            WHEN v_candidate_count >= 2 THEN 180
            ELSE 365
        END,
        completed_at = now()
    WHERE id = p_assessment_id;

    RETURN true;
END;
$$;

COMMENT ON FUNCTION public.run_feasibility_assessment IS
    'Scores organizations against program requirements. Returns true if assessment was completed.';

-- ############################################################################
-- PART 5: TRIGGERS
-- ############################################################################

CREATE TRIGGER trg_feasibility_assessments_updated_at
    BEFORE UPDATE ON public.feasibility_assessments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 6: RLS
-- ############################################################################

ALTER TABLE public.feasibility_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_scores ENABLE ROW LEVEL SECURITY;

-- Assessments: users see their own, org_admins see org's
CREATE POLICY feasibility_assessments_select_self ON public.feasibility_assessments
    FOR SELECT
    USING (created_by = auth.uid());

CREATE POLICY feasibility_assessments_select_admin ON public.feasibility_assessments
    FOR SELECT
    USING (public.is_org_admin(organization_id));

CREATE POLICY feasibility_assessments_insert ON public.feasibility_assessments
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY feasibility_assessments_update ON public.feasibility_assessments
    FOR UPDATE
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY feasibility_assessments_delete ON public.feasibility_assessments
    FOR DELETE
    USING (public.is_org_admin(organization_id));

-- Scores: visible to assessment owner or org_admin
CREATE POLICY feasibility_scores_select_assessment ON public.feasibility_scores
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.feasibility_assessments fa
            WHERE fa.id = assessment_id
              AND (fa.created_by = auth.uid() OR public.is_org_admin(fa.organization_id))
        )
    );

-- ############################################################################
-- PART 7: POSTGREST PERMISSIONS
-- ############################################################################

GRANT ALL ON public.feasibility_assessments TO anon, authenticated, service_role;
GRANT ALL ON public.feasibility_scores TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION 014 — Sprint 4: Feasibility Engine
-- ============================================================================
