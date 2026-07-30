-- ============================================================================
-- KADARN v2 — Sprint 2 Block B: Claim–Evidence Relationships
-- ============================================================================
-- Authority: Final Gate Decision 1
-- Many-to-many relationship between claims and evidence with role semantics.
-- Roles: supports, contradicts, qualifies
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE evidence_link_role AS ENUM ('supports', 'contradicts', 'qualifies');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE link_review_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- TABLE: claim_evidence_links
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.claim_evidence_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id        UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    evidence_id     UUID NOT NULL REFERENCES public.evidence_nodes(id) ON DELETE CASCADE,
    role            evidence_link_role NOT NULL DEFAULT 'supports',
    weight          NUMERIC(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
    valid_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until     TIMESTAMPTZ,
    review_status   link_review_status NOT NULL DEFAULT 'pending',
    revoked_at      TIMESTAMPTZ,
    revoked_by      UUID,
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One active link per (claim, evidence, role) at any time
    CONSTRAINT uq_active_link UNIQUE (claim_id, evidence_id, role) WHERE revoked_at IS NULL
);

-- ############################################################################
-- INDEXES
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_cel_claim ON public.claim_evidence_links(claim_id);
CREATE INDEX IF NOT EXISTS idx_cel_evidence ON public.claim_evidence_links(evidence_id);
CREATE INDEX IF NOT EXISTS idx_cel_claim_role ON public.claim_evidence_links(claim_id, role) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cel_evidence_role ON public.claim_evidence_links(evidence_id, role) WHERE revoked_at IS NULL;

-- ############################################################################
-- RLS
-- ############################################################################

ALTER TABLE public.claim_evidence_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY cel_select_org ON public.claim_evidence_links
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.claims c WHERE c.id = claim_id
            AND (c.organization_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active')
            OR auth.role() = 'service_role'))
    );

CREATE POLICY cel_insert_org ON public.claim_evidence_links
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.claims c WHERE c.id = claim_id
            AND (c.organization_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active')
            OR auth.role() = 'service_role'))
    );

CREATE POLICY cel_update_org ON public.claim_evidence_links
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.claims c WHERE c.id = claim_id
            AND (c.organization_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active')
            OR auth.role() = 'service_role'))
    );

-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.claim_evidence_links TO authenticated, service_role;
GRANT DELETE ON public.claim_evidence_links TO service_role;

COMMENT ON TABLE public.claim_evidence_links IS 'KADARN v2 — Typed relationship between Claim and Evidence. Supports/contradicts/qualifies semantics.';
COMMENT ON COLUMN public.claim_evidence_links.role IS 'supports = reinforces claim; contradicts = conflicts with claim; qualifies = limits scope/conditions.';
COMMENT ON COLUMN public.claim_evidence_links.weight IS 'Contribution strength for confidence computation (0.0–1.0).';
COMMENT ON COLUMN public.claim_evidence_links.review_status IS 'pending → accepted/rejected.';
