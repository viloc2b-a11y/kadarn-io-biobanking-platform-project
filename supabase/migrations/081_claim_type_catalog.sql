-- ============================================================================
-- KADARN v2 — Claim Type Catalog (Loop 3)
-- ============================================================================
-- Migration: 081
-- Authority: KAD-LOOP-003 Phase 1, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Creates a canonical claim_types reference table to replace the free-text
-- claims.claim_type_id column (045). The existing TEXT column is NOT altered
-- or constrained with a FK in this migration — existing rows retain their
-- legacy TEXT values and a future migration will backfill + add the FK once
-- all producers have adopted the catalog.
--
-- 7 canonical claim types seeded to match the deprecated ClaimLegacyType
-- enum values used by the application layer.
-- ============================================================================

-- ############################################################################
-- PART 1: TABLE — claim_types
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.claim_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key             TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_types_key
    ON public.claim_types(key);

CREATE INDEX IF NOT EXISTS idx_claim_types_active_order
    ON public.claim_types(is_active, display_order);

-- ############################################################################
-- PART 2: SEED DATA — 7 canonical claim types
-- ############################################################################
-- Matches deprecated ClaimLegacyType: inventory, collections,
-- experience_phase1..4, site_capability.

INSERT INTO public.claim_types (key, name, category, description, is_active, display_order)
VALUES
    ('inventory',          'Inventory Claim',           'asset',         'Claim asserting the existence and quantity of a tangible asset or inventory item.', true, 1),
    ('collections',        'Collections Claim',         'asset',         'Claim asserting the composition, curation, or holdings of a collection.', true, 2),
    ('experience_phase1',  'Experience Phase 1 Claim',  'experience',    'Claim asserting foundational Phase 1 experience or competency.',          true, 3),
    ('experience_phase2',  'Experience Phase 2 Claim',  'experience',    'Claim asserting intermediate Phase 2 experience or competency.',          true, 4),
    ('experience_phase3',  'Experience Phase 3 Claim',  'experience',    'Claim asserting advanced Phase 3 experience or competency.',              true, 5),
    ('experience_phase4',  'Experience Phase 4 Claim',  'experience',    'Claim asserting expert-level Phase 4 experience or competency.',          true, 6),
    ('site_capability',    'Site Capability Claim',      'capability',   'Claim asserting a site-level operational capability or readiness.',        true, 7)
ON CONFLICT (key) DO NOTHING;

-- ############################################################################
-- PART 3: RLS — claim_types
-- ############################################################################
-- Reference table: service_role can read; only service_role can write
-- (org-admin writes are mediated through service_role at the API layer).

ALTER TABLE public.claim_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY claim_types_select_service ON public.claim_types
    FOR SELECT
    USING (auth.role() = 'service_role');

CREATE POLICY claim_types_all_service ON public.claim_types
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 4: GRANTS
-- ############################################################################

GRANT SELECT ON public.claim_types TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.claim_types TO service_role;

-- ############################################################################
-- END OF MIGRATION 081
-- ============================================================================
