-- ============================================================================
-- KAD-004 — Claim Consolidation
-- ============================================================================
-- Authority: KADARN Foundation Library
-- 
-- 1. Deprecates continuity_experience_claims in favor of canonical claims table
-- 2. Ensures evidence-core claims table has all required columns
-- 3. No data migration — legacy data remains for backward compatibility
-- ============================================================================

-- ############################################################################
-- Ensure canonical claims table has all columns needed for unification
-- ############################################################################

ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.people(id) ON DELETE SET NULL;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0;

-- ############################################################################
-- Add indexes on new columns
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_claims_person ON public.claims(person_id);
CREATE INDEX IF NOT EXISTS idx_claims_tags ON public.claims USING gin (to_tsvector('simple', COALESCE(tags, '')));

-- ############################################################################
-- Document continuity_experience_claims as legacy
-- ############################################################################

COMMENT ON TABLE public.continuity_experience_claims IS 'DEPRECATED in KAD-004. Use public.claims (evidence-core) instead. This table exists only for backward compatibility during migration.';
