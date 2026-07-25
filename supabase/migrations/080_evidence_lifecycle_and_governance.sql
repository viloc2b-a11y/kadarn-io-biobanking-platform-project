-- ============================================================================
-- KADARN v2 — Evidence Lifecycle & Governance (Loop 2)
-- ============================================================================
-- Migration: 080
-- Authority: KAD-LOOP-002, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Addresses schema gaps from Phases 1-8:
-- 1. evidence_lifecycle_status enum (Phase 6) — 10 states
-- 2. rule_status enum (Phase 3) — draft/active/deprecated/retired
-- 3. review_decision enum (Phase 8) — approved/rejected/needs_more_evidence/not_applicable
-- 4. evidence_nodes.lifecycle_status column (Phase 6)
-- 5. evidence_generation_rules.rule_status column + RLS (Phase 3)
-- 6. institutional_events RLS policies (Phase 1)
-- 7. claim_evidence_links RLS policies (Phase 7)
-- 8. review_tasks: review_outcome, required_actions, evidence_snapshot (Phase 8)
-- ============================================================================

-- ############################################################################
-- PART 1: NEW ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE evidence_lifecycle_status AS ENUM (
        'draft',
        'generated',
        'imported',
        'verified',
        'reviewed',
        'accepted',
        'rejected',
        'superseded',
        'archived',
        'invalidated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rule_status AS ENUM (
        'draft',
        'active',
        'deprecated',
        'retired'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE review_decision AS ENUM (
        'approved',
        'rejected',
        'needs_more_evidence',
        'not_applicable'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: EVIDENCE NODES — lifecycle_status (Phase 6)
-- ############################################################################

ALTER TABLE public.evidence_nodes
    ADD COLUMN IF NOT EXISTS lifecycle_status evidence_lifecycle_status DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_evidence_nodes_lifecycle
    ON public.evidence_nodes(lifecycle_status);

COMMENT ON COLUMN public.evidence_nodes.lifecycle_status IS
    'KAD-LOOP-002: Canonical 10-state lifecycle. Coexists with legacy evidence_node_status (045).';

-- ############################################################################
-- PART 3: EVIDENCE GENERATION RULES — rule_status + RLS (Phase 3)
-- ############################################################################

ALTER TABLE public.evidence_generation_rules
    ADD COLUMN IF NOT EXISTS rule_status rule_status DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_evidence_generation_rules_status
    ON public.evidence_generation_rules(rule_status);

ALTER TABLE public.evidence_generation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY egr_select_tenant ON public.evidence_generation_rules
    FOR SELECT
    USING (
        owner IS NULL
        OR owner IN (
            SELECT user_id FROM public.organization_memberships
            WHERE status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY egr_insert_tenant ON public.evidence_generation_rules
    FOR INSERT
    WITH CHECK (
        owner IS NULL
        OR owner IN (
            SELECT user_id FROM public.organization_memberships
            WHERE status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY egr_update_tenant ON public.evidence_generation_rules
    FOR UPDATE
    USING (
        owner IS NULL
        OR owner IN (
            SELECT user_id FROM public.organization_memberships
            WHERE status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY egr_all_service ON public.evidence_generation_rules
    FOR ALL
    USING (auth.role() = 'service_role');

COMMENT ON COLUMN public.evidence_generation_rules.rule_status IS
    'KAD-LOOP-002: Rule governance lifecycle — draft/active/deprecated/retired.';

-- ############################################################################
-- PART 4: INSTITUTIONAL EVENTS — RLS policies (Phase 1)
-- ############################################################################

CREATE POLICY ie_select_tenant ON public.institutional_events
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ie_insert_tenant ON public.institutional_events
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ie_update_tenant ON public.institutional_events
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ie_all_service ON public.institutional_events
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 5: CLAIM EVIDENCE LINKS — RLS policies (Phase 7)
-- ############################################################################

ALTER TABLE public.claim_evidence_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY cel_select_tenant ON public.claim_evidence_links
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY cel_insert_tenant ON public.claim_evidence_links
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY cel_delete_tenant ON public.claim_evidence_links
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY cel_all_service ON public.claim_evidence_links
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 6: REVIEW TASKS — review_outcome + required_actions + snapshot (Phase 8)
-- ############################################################################

ALTER TABLE public.review_tasks
    ADD COLUMN IF NOT EXISTS review_outcome review_decision;

ALTER TABLE public.review_tasks
    ADD COLUMN IF NOT EXISTS required_actions JSONB DEFAULT '[]';

ALTER TABLE public.review_tasks
    ADD COLUMN IF NOT EXISTS evidence_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_review_tasks_outcome
    ON public.review_tasks(review_outcome);

COMMENT ON COLUMN public.review_tasks.review_outcome IS
    'KAD-LOOP-002: Explicit review decision — approved/rejected/needs_more_evidence/not_applicable.';
COMMENT ON COLUMN public.review_tasks.required_actions IS
    'KAD-LOOP-002: JSONB array of required follow-up actions from the review.';
COMMENT ON COLUMN public.review_tasks.evidence_snapshot IS
    'KAD-LOOP-002: Immutable copy of evidence state at review time for audit trail.';

-- ############################################################################
-- PART 7: GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.evidence_generation_rules TO authenticated, service_role;
GRANT DELETE ON public.evidence_generation_rules TO service_role;

-- ############################################################################
-- END OF MIGRATION 080
-- ============================================================================
