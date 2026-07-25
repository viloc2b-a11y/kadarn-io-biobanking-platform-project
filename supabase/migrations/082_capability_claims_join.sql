-- ============================================================================
-- KADARN v2 — Capability-Claim M2M Join (Loop 3)
-- ============================================================================
-- Migration: 082
-- Authority: KAD-LOOP-003 Phase 1, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Creates the capability_claims many-to-many join table linking capabilities
-- (065) to claims (045). Currently capabilities.primary_claim_id is a single
-- FK (1:1); this table enables multiple claims per capability with typed
-- relationships (primary/secondary/supporting/contradicting) and weights.
--
-- Backfill: existing capabilities.primary_claim_id values are migrated as
-- 'primary' relationship entries.
-- ============================================================================

-- ############################################################################
-- PART 1: ENUM — capability_claim_relationship
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE capability_claim_relationship AS ENUM (
        'primary',
        'secondary',
        'supporting',
        'contradicting'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — capability_claims
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.capability_claims (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capability_id       UUID NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
    claim_id            UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    relationship_type   capability_claim_relationship NOT NULL DEFAULT 'primary',
    weight              NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID,

    CONSTRAINT uq_capability_claim UNIQUE (capability_id, claim_id),
    CONSTRAINT cc_weight_range CHECK (weight >= 0.00 AND weight <= 9.99)
);

-- ############################################################################
-- PART 3: INDEXES
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_capability_claims_capability
    ON public.capability_claims(capability_id);

CREATE INDEX IF NOT EXISTS idx_capability_claims_claim
    ON public.capability_claims(claim_id);

CREATE INDEX IF NOT EXISTS idx_capability_claims_relationship
    ON public.capability_claims(relationship_type);

-- ############################################################################
-- PART 4: RLS — capability_claims
-- ############################################################################
-- Org-scoped: a user may access a join row if the underlying capability
-- belongs to an organization where the user has active membership.

ALTER TABLE public.capability_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cc_select_org ON public.capability_claims;
CREATE POLICY cc_select_org ON public.capability_claims
    FOR SELECT
    USING (
        capability_id IN (
            SELECT c.id FROM public.capabilities c
            WHERE c.organization_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
            )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cc_insert_org ON public.capability_claims;
CREATE POLICY cc_insert_org ON public.capability_claims
    FOR INSERT
    WITH CHECK (
        capability_id IN (
            SELECT c.id FROM public.capabilities c
            WHERE c.organization_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
            )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cc_update_org ON public.capability_claims;
CREATE POLICY cc_update_org ON public.capability_claims
    FOR UPDATE
    USING (
        capability_id IN (
            SELECT c.id FROM public.capabilities c
            WHERE c.organization_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
            )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cc_delete_org ON public.capability_claims;
CREATE POLICY cc_delete_org ON public.capability_claims
    FOR DELETE
    USING (
        capability_id IN (
            SELECT c.id FROM public.capabilities c
            WHERE c.organization_id IN (
                SELECT om.organization_id FROM public.organization_memberships om
                WHERE om.user_id = auth.uid() AND om.status = 'active'
            )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cc_all_service ON public.capability_claims;
CREATE POLICY cc_all_service ON public.capability_claims
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 5: BACKFILL — migrate existing primary_claim_id entries
-- ############################################################################
-- Each capability with a non-null primary_claim_id gets a 'primary' row.
-- Idempotent via ON CONFLICT skip.

INSERT INTO public.capability_claims (capability_id, claim_id, relationship_type, weight)
SELECT
    c.id,
    c.primary_claim_id,
    'primary'::capability_claim_relationship,
    1.00
FROM public.capabilities c
WHERE c.primary_claim_id IS NOT NULL
ON CONFLICT (capability_id, claim_id) DO NOTHING;

-- ############################################################################
-- PART 6: GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE, DELETE ON public.capability_claims TO authenticated, service_role;

-- ############################################################################
-- END OF MIGRATION 082
-- ============================================================================
