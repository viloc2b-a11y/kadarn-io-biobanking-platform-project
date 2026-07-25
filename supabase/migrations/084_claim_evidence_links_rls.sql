-- ============================================================================
-- KADARN v2 — claim_evidence_links RLS & updated_at (Loop 3)
-- ============================================================================
-- Migration: 084
-- Authority: KAD-LOOP-003 Phase 1, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Addresses the RLS gap on claim_evidence_links (078):
--   1. ENABLE ROW LEVEL SECURITY (078 created the table without RLS)
--   2. Create org-scoped SELECT / INSERT policies keyed on the parent claim's org
--   3. Create service_role bypass policy
--   4. Add updated_at column + trigger (same pattern as 080)
--
-- Note: Migration 080 already added tenant-scoped RLS policies to this table
-- (cel_select_tenant, cel_insert_tenant, cel_delete_tenant, cel_all_service).
-- This migration adds an alternative org-scoped policy set that resolves
-- the owning org via a subquery to the parent claims row, plus the
-- updated_at tracking column. Policies use DROP IF EXISTS + CREATE to be
-- idempotent and avoid duplicate-policy errors.
-- ============================================================================

-- ############################################################################
-- PART 1: ENABLE RLS
-- ############################################################################

ALTER TABLE public.claim_evidence_links ENABLE ROW LEVEL SECURITY;

-- ############################################################################
-- PART 2: RLS POLICIES — org-scoped (resolve org via parent claim)
-- ############################################################################
-- These policies resolve the owning organization from the parent claims row
-- and check membership. They coexist with the tenant_id-based policies from
-- migration 080 (tenant_id is denormalized on the link row; these policies
-- provide an additional org-membership verification path).

DROP POLICY IF EXISTS cel_select_org ON public.claim_evidence_links;
CREATE POLICY cel_select_org ON public.claim_evidence_links
    FOR SELECT
    USING (
        tenant_id = (
            SELECT c.organization_id FROM public.claims c
            WHERE c.id = claim_evidence_links.claim_id
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cel_insert_org ON public.claim_evidence_links;
CREATE POLICY cel_insert_org ON public.claim_evidence_links
    FOR INSERT
    WITH CHECK (
        tenant_id = (
            SELECT c.organization_id FROM public.claims c
            WHERE c.id = claim_evidence_links.claim_id
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cel_all_service ON public.claim_evidence_links;
CREATE POLICY cel_all_service ON public.claim_evidence_links
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 3: updated_at COLUMN + TRIGGER
-- ############################################################################

ALTER TABLE public.claim_evidence_links
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- trigger_set_updated_at() is defined in migration 062 and is idempotent.
DROP TRIGGER IF EXISTS trg_claim_evidence_links_updated_at
    ON public.claim_evidence_links;

CREATE TRIGGER trg_claim_evidence_links_updated_at
    BEFORE UPDATE ON public.claim_evidence_links
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

COMMENT ON COLUMN public.claim_evidence_links.updated_at IS
    'KAD-LOOP-003: Last modification timestamp. Maintained by trg_claim_evidence_links_updated_at.';

-- ############################################################################
-- PART 4: GRANTS (claim_evidence_links already granted in 078/080)
-- ############################################################################

-- ############################################################################
-- END OF MIGRATION 084
-- ============================================================================
