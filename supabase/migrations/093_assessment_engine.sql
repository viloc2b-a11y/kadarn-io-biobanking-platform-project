-- ============================================================================
-- KADARN v2 — Block 03-A: Assessment Engine
-- ============================================================================
-- Authority: Architecture Alignment Audit v2, §2.7 Assessment Engine
-- Purpose: Formal assessment model — assessments, results, gaps, and
--          mitigations with institution-scoped RLS.
-- Migration: 093 (idempotent — all DDL guarded by IF NOT EXISTS)
-- Dependencies: 008 (organizations), 065 (capabilities)
-- ============================================================================

-- ############################################################################
-- PART 1: TABLE — assessments
-- ############################################################################
-- Top-level assessment record. An assessment groups assessment_results
-- produced during a single evaluation run against an institution.

CREATE TABLE IF NOT EXISTS public.assessments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The institution being assessed
    institution_id      UUID NOT NULL
                        REFERENCES public.organizations(id) ON DELETE RESTRICT,

    -- What kind of assessment (e.g., 'readiness', 'confidence', 'gap_analysis')
    assessment_type     TEXT NOT NULL,

    -- Lifecycle status
    status              TEXT NOT NULL DEFAULT 'pending',

    -- Timing
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,

    -- Rolled-up results (extensible)
    results_summary     JSONB DEFAULT '{}',

    -- Audit
    created_by          UUID,                                 -- auth.users.id
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 2: TABLE — assessment_results
-- ############################################################################
-- Per-capability result within an assessment. Each row scores a single
-- capability against the assessment's methodology.

CREATE TABLE IF NOT EXISTS public.assessment_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent assessment
    assessment_id       UUID NOT NULL
                        REFERENCES public.assessments(id) ON DELETE CASCADE,

    -- The capability being scored (nullable for backward compat)
    capability_id       UUID
                        REFERENCES public.capabilities(id) ON DELETE SET NULL,

    -- Score
    score               NUMERIC(5,4) CHECK (score >= 0 AND score <= 1),

    -- Confidence in this result
    confidence_level    TEXT,
    -- e.g., 'low', 'medium', 'high', 'very_high'

    -- Gaps discovered during this result (extensible snapshot)
    gaps_summary        JSONB DEFAULT '{}',

    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 3: TABLE — gaps
-- ############################################################################
-- A gap is a shortfall or deficiency discovered during an assessment_result.
-- Each gap can have one or more mitigations proposed.

CREATE TABLE IF NOT EXISTS public.gaps (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent assessment result
    assessment_result_id    UUID NOT NULL
                            REFERENCES public.assessment_results(id) ON DELETE CASCADE,

    -- Classification
    gap_type                TEXT,
    -- e.g., 'evidence_gap', 'documentation_gap', 'capability_gap',
    --      'staffing_gap', 'infrastructure_gap'

    -- Human-readable description
    description             TEXT,

    -- Severity
    severity                TEXT DEFAULT 'medium',
    -- e.g., 'critical', 'high', 'medium', 'low'

    -- What could be done about it (summary, elaborated in mitigations)
    mitigation_summary      TEXT,

    -- Audit
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 4: TABLE — mitigations
-- ############################################################################
-- A mitigation is a concrete action proposed to close or reduce a gap.
-- Multiple mitigations can target the same gap.

CREATE TABLE IF NOT EXISTS public.mitigations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent gap
    gap_id              UUID NOT NULL
                        REFERENCES public.gaps(id) ON DELETE CASCADE,

    -- Human-readable plan
    description         TEXT,

    -- Estimated effort (human-readable)
    effort_estimate     TEXT,
    -- e.g., '1-2 weeks', '3-6 months', '1+ year'

    -- Lifecycle status
    status              TEXT DEFAULT 'proposed',
    -- e.g., 'proposed', 'approved', 'in_progress', 'completed', 'rejected'

    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 5: INDEXES
-- ############################################################################

-- assessments
CREATE INDEX IF NOT EXISTS idx_assessments_institution
    ON public.assessments(institution_id);

CREATE INDEX IF NOT EXISTS idx_assessments_status
    ON public.assessments(institution_id, status);

CREATE INDEX IF NOT EXISTS idx_assessments_type
    ON public.assessments(institution_id, assessment_type);

-- assessment_results
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment
    ON public.assessment_results(assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_results_capability
    ON public.assessment_results(capability_id)
    WHERE capability_id IS NOT NULL;

-- gaps
CREATE INDEX IF NOT EXISTS idx_gaps_result
    ON public.gaps(assessment_result_id);

CREATE INDEX IF NOT EXISTS idx_gaps_severity
    ON public.gaps(assessment_result_id, severity);

-- mitigations
CREATE INDEX IF NOT EXISTS idx_mitigations_gap
    ON public.mitigations(gap_id);

CREATE INDEX IF NOT EXISTS idx_mitigations_status
    ON public.mitigations(gap_id, status);

-- ############################################################################
-- PART 6: TRIGGERS — updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_assessments_updated_at ON public.assessments;
CREATE TRIGGER trg_assessments_updated_at
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_mitigations_updated_at ON public.mitigations;
CREATE TRIGGER trg_mitigations_updated_at
    BEFORE UPDATE ON public.mitigations
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- PART 7: ROW-LEVEL SECURITY
-- ############################################################################
-- Institution-scoped: a user may access rows if they have active membership
-- in the organization that owns the record.
--
-- Pattern: assessments uses direct organization_memberships check.
-- Children (assessment_results, gaps, mitigations) inherit tenant scope
-- via EXISTS subquery through their parent FK chain.

-- ─── assessments ──────────────────────────────────────────────────────────

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- SELECT: org members see their org's assessments
CREATE POLICY asm_select_org ON public.assessments
    FOR SELECT
    USING (
        institution_id IN (
            SELECT om.organization_id FROM public.organization_memberships om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: org members can create assessments for their org
CREATE POLICY asm_insert_org ON public.assessments
    FOR INSERT
    WITH CHECK (
        institution_id IN (
            SELECT om.organization_id FROM public.organization_memberships om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- UPDATE: org members can update their org's assessments
CREATE POLICY asm_update_org ON public.assessments
    FOR UPDATE
    USING (
        institution_id IN (
            SELECT om.organization_id FROM public.organization_memberships om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- DELETE: only service_role can delete (audit trail preservation)
CREATE POLICY asm_delete_service ON public.assessments
    FOR DELETE
    USING (auth.role() = 'service_role');

-- service_role full-access bypass
CREATE POLICY asm_all_service ON public.assessments
    FOR ALL
    USING (auth.role() = 'service_role');

-- ─── assessment_results (inherit tenant via parent assessment) ────────────

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY ar_select_tenant ON public.assessment_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_results.assessment_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ar_insert_tenant ON public.assessment_results
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_results.assessment_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ar_update_tenant ON public.assessment_results
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_results.assessment_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ar_delete_tenant ON public.assessment_results
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_results.assessment_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ar_all_service ON public.assessment_results
    FOR ALL
    USING (auth.role() = 'service_role');

-- ─── gaps (inherit tenant via result → assessment) ───────────────────────

ALTER TABLE public.gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY gp_select_tenant ON public.gaps
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assessment_results ar
            JOIN public.assessments a ON a.id = ar.assessment_id
            WHERE ar.id = gaps.assessment_result_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY gp_insert_tenant ON public.gaps
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessment_results ar
            JOIN public.assessments a ON a.id = ar.assessment_id
            WHERE ar.id = gaps.assessment_result_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY gp_update_tenant ON public.gaps
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assessment_results ar
            JOIN public.assessments a ON a.id = ar.assessment_id
            WHERE ar.id = gaps.assessment_result_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY gp_delete_tenant ON public.gaps
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assessment_results ar
            JOIN public.assessments a ON a.id = ar.assessment_id
            WHERE ar.id = gaps.assessment_result_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY gp_all_service ON public.gaps
    FOR ALL
    USING (auth.role() = 'service_role');

-- ─── mitigations (inherit tenant via gap → result → assessment) ──────────

ALTER TABLE public.mitigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY mt_select_tenant ON public.mitigations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.gaps g
            JOIN public.assessment_results ar ON ar.id = g.assessment_result_id
            JOIN public.assessments a ON a.id = ar.assessment_id
            WHERE g.id = mitigations.gap_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY mt_insert_tenant ON public.mitigations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gaps g
            JOIN public.assessment_results ar ON ar.id = g.assessment_result_id
            JOIN public.assessments a ON a.id = ar.assessment_id
            WHERE g.id = mitigations.gap_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY mt_update_tenant ON public.mitigations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.gaps g
            JOIN public.assessment_results ar ON ar.id = g.assessment_result_id
            JOIN public.assessments a ON a.id = ar.assessment_id
            WHERE g.id = mitigations.gap_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY mt_delete_tenant ON public.mitigations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.gaps g
            JOIN public.assessment_results ar ON ar.id = g.assessment_result_id
            JOIN public.assessments a ON a.id = ar.assessment_id
            WHERE g.id = mitigations.gap_id
              AND a.institution_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY mt_all_service ON public.mitigations
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 8: GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.assessments TO authenticated, service_role;
GRANT DELETE ON public.assessments TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.assessment_results TO authenticated, service_role;
GRANT DELETE ON public.assessment_results TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.gaps TO authenticated, service_role;
GRANT DELETE ON public.gaps TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.mitigations TO authenticated, service_role;
GRANT DELETE ON public.mitigations TO service_role;

-- ############################################################################
-- PART 9: COMMENTS
-- ############################################################################

COMMENT ON TABLE public.assessments IS
    'KADARN v2 Block 03-A — Top-level assessment record. Groups per-capability results produced during a single evaluation run against an institution.';

COMMENT ON COLUMN public.assessments.institution_id IS
    'FK to organizations — the institution being assessed.';

COMMENT ON COLUMN public.assessments.assessment_type IS
    'Kind of assessment: readiness, confidence, gap_analysis, etc.';

COMMENT ON COLUMN public.assessments.status IS
    'Lifecycle: pending, in_progress, completed, failed.';

COMMENT ON COLUMN public.assessments.results_summary IS
    'JSONB: rolled-up results — { total_capabilities, scored, avg_score, band_distribution, ... }.';

COMMENT ON TABLE public.assessment_results IS
    'KADARN v2 Block 03-A — Per-capability result within an assessment. Each row scores one capability with a confidence level and gaps snapshot.';

COMMENT ON COLUMN public.assessment_results.capability_id IS
    'FK to capabilities — the capability being scored. Nullable for assessments that pre-date formal capability registration.';

COMMENT ON COLUMN public.assessment_results.score IS
    'Computed score [0.0000–1.0000].';

COMMENT ON COLUMN public.assessment_results.confidence_level IS
    'Confidence in this result: low, medium, high, very_high.';

COMMENT ON COLUMN public.assessment_results.gaps_summary IS
    'JSONB: snapshot of gaps discovered — { gap_count, critical_count, high_count, ... }.';

COMMENT ON TABLE public.gaps IS
    'KADARN v2 Block 03-A — A shortfall or deficiency discovered during an assessment result. Can have mitigations.';

COMMENT ON COLUMN public.gaps.gap_type IS
    'Classification: evidence_gap, documentation_gap, capability_gap, staffing_gap, infrastructure_gap, etc.';

COMMENT ON COLUMN public.gaps.severity IS
    'Severity level: critical, high, medium, low.';

COMMENT ON COLUMN public.gaps.mitigation_summary IS
    'Summary of how the gap could be addressed (elaborated in mitigations).';

COMMENT ON TABLE public.mitigations IS
    'KADARN v2 Block 03-A — A concrete action proposed to close or reduce a gap. Multiple mitigations can target the same gap.';

COMMENT ON COLUMN public.mitigations.effort_estimate IS
    'Estimated effort in human-readable form: e.g., 1-2 weeks, 3-6 months, 1+ year.';

COMMENT ON COLUMN public.mitigations.status IS
    'Lifecycle: proposed, approved, in_progress, completed, rejected.';

-- ============================================================================
-- END OF MIGRATION 093
-- ============================================================================
