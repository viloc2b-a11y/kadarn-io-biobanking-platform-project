-- ============================================================================
-- KADARN v2 — Confidence Assessment Sub-table RLS (Loop 4, Phase 1)
-- ============================================================================
-- Migration: 088
-- Authority: KAD-LOOP-004 Phase 1, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Adds RLS policies for confidence_factors and confidence_blockers,
-- both of which inherit tenant scope from their parent
-- confidence_assessments row via FK.
--
-- Tables were created without RLS policies in migration 087.
-- This migration:
--   1. ENABLE ROW LEVEL SECURITY on confidence_factors and confidence_blockers
--   2. Creates tenant-inheritance policies using the EXISTS subquery pattern
--      (same pattern as confidence_rules in migration 086)
--   3. Adds service_role bypass policies
--
-- All policies use DROP IF EXISTS + CREATE for idempotency.
-- ============================================================================

-- ############################################################################
-- PART 1: RLS — confidence_factors (tenant inheritance via assessment FK)
-- ############################################################################

ALTER TABLE public.confidence_factors ENABLE ROW LEVEL SECURITY;

-- SELECT: inherit tenant from parent assessment
DROP POLICY IF EXISTS cf_select_tenant ON public.confidence_factors;
CREATE POLICY cf_select_tenant ON public.confidence_factors
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.confidence_assessments ca
            WHERE ca.id = confidence_factors.assessment_id
              AND ca.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: inherit tenant from parent assessment
DROP POLICY IF EXISTS cf_insert_tenant ON public.confidence_factors;
CREATE POLICY cf_insert_tenant ON public.confidence_factors
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.confidence_assessments ca
            WHERE ca.id = confidence_factors.assessment_id
              AND ca.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- UPDATE: inherit tenant from parent assessment
DROP POLICY IF EXISTS cf_update_tenant ON public.confidence_factors;
CREATE POLICY cf_update_tenant ON public.confidence_factors
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.confidence_assessments ca
            WHERE ca.id = confidence_factors.assessment_id
              AND ca.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- DELETE: inherit tenant from parent assessment
DROP POLICY IF EXISTS cf_delete_tenant ON public.confidence_factors;
CREATE POLICY cf_delete_tenant ON public.confidence_factors
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.confidence_assessments ca
            WHERE ca.id = confidence_factors.assessment_id
              AND ca.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- service_role full-access bypass
DROP POLICY IF EXISTS cf_all_service ON public.confidence_factors;
CREATE POLICY cf_all_service ON public.confidence_factors
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 2: RLS — confidence_blockers (tenant inheritance via assessment FK)
-- ############################################################################

ALTER TABLE public.confidence_blockers ENABLE ROW LEVEL SECURITY;

-- SELECT: inherit tenant from parent assessment
DROP POLICY IF EXISTS cb_select_tenant ON public.confidence_blockers;
CREATE POLICY cb_select_tenant ON public.confidence_blockers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.confidence_assessments ca
            WHERE ca.id = confidence_blockers.assessment_id
              AND ca.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: inherit tenant from parent assessment
DROP POLICY IF EXISTS cb_insert_tenant ON public.confidence_blockers;
CREATE POLICY cb_insert_tenant ON public.confidence_blockers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.confidence_assessments ca
            WHERE ca.id = confidence_blockers.assessment_id
              AND ca.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- UPDATE: inherit tenant from parent assessment
DROP POLICY IF EXISTS cb_update_tenant ON public.confidence_blockers;
CREATE POLICY cb_update_tenant ON public.confidence_blockers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.confidence_assessments ca
            WHERE ca.id = confidence_blockers.assessment_id
              AND ca.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- DELETE: inherit tenant from parent assessment
DROP POLICY IF EXISTS cb_delete_tenant ON public.confidence_blockers;
CREATE POLICY cb_delete_tenant ON public.confidence_blockers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.confidence_assessments ca
            WHERE ca.id = confidence_blockers.assessment_id
              AND ca.tenant_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- service_role full-access bypass
DROP POLICY IF EXISTS cb_all_service ON public.confidence_blockers;
CREATE POLICY cb_all_service ON public.confidence_blockers
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- END OF MIGRATION 088
-- ============================================================================