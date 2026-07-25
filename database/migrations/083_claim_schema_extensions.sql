-- ============================================================================
-- KADARN v2 — Claim Schema Extensions (Loop 3)
-- ============================================================================
-- Migration: 083
-- Authority: KAD-LOOP-003 Phase 1, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Extends the claims table (045) with institutional governance columns:
--   - claim_category, claim_scope, priority, version
--   - owner_id (FK to auth.users)
--   - lifecycle_status, review_status (typed enums)
--   - expires_at, superseded_by, supersession_reason
--
-- 5 new enums are created and the new columns are typed against them.
-- No existing columns are modified or dropped. claims RLS (045) is unchanged.
-- ============================================================================

-- ############################################################################
-- PART 1: NEW ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE claim_lifecycle_status AS ENUM (
        'draft',
        'review',
        'approved',
        'rejected',
        'superseded',
        'expired',
        'archived'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_review_status AS ENUM (
        'pending',
        'in_review',
        'approved',
        'rejected'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_scope_enum AS ENUM (
        'institution',
        'location',
        'person'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_priority AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_category_enum AS ENUM (
        'regulatory',
        'operational',
        'competency',
        'capability',
        'compliance'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: CLAIMS — add governance columns
-- ############################################################################

ALTER TABLE public.claims
    ADD COLUMN IF NOT EXISTS claim_category      claim_category_enum,
    ADD COLUMN IF NOT EXISTS claim_scope         claim_scope_enum,
    ADD COLUMN IF NOT EXISTS priority            claim_priority NOT NULL DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS version             INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS owner_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS lifecycle_status    claim_lifecycle_status NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS review_status       claim_review_status NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS expires_at          TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS superseded_by       UUID REFERENCES public.claims(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS supersession_reason TEXT;

-- ############################################################################
-- PART 3: INDEXES
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_claims_lifecycle_status
    ON public.claims(lifecycle_status);

CREATE INDEX IF NOT EXISTS idx_claims_owner
    ON public.claims(owner_id);

CREATE INDEX IF NOT EXISTS idx_claims_organization_lifecycle
    ON public.claims(organization_id, lifecycle_status);

-- ############################################################################
-- PART 4: COMMENTS
-- ############################################################################

COMMENT ON COLUMN public.claims.claim_category IS
    'KAD-LOOP-003: Categorical classification — regulatory/operational/competency/capability/compliance.';
COMMENT ON COLUMN public.claims.claim_scope IS
    'KAD-LOOP-003: Scope of the claim — institution/location/person.';
COMMENT ON COLUMN public.claims.priority IS
    'KAD-LOOP-003: Priority tier — low/medium/high/critical. Defaults to medium.';
COMMENT ON COLUMN public.claims.version IS
    'KAD-LOOP-003: Monotonically increasing version number for claim revisions. Starts at 1.';
COMMENT ON COLUMN public.claims.owner_id IS
    'KAD-LOOP-003: User accountable for this claim. NULL means unassigned.';
COMMENT ON COLUMN public.claims.lifecycle_status IS
    'KAD-LOOP-003: 7-state lifecycle — draft/review/approved/rejected/superseded/expired/archived.';
COMMENT ON COLUMN public.claims.review_status IS
    'KAD-LOOP-003: 4-state review status — pending/in_review/approved/rejected.';
COMMENT ON COLUMN public.claims.expires_at IS
    'KAD-LOOP-003: Optional expiry timestamp. When reached the claim should transition to expired.';
COMMENT ON COLUMN public.claims.superseded_by IS
    'KAD-LOOP-003: FK to the claim that supersedes this one. NULL for current claims.';
COMMENT ON COLUMN public.claims.supersession_reason IS
    'KAD-LOOP-003: Human-readable reason this claim was superseded.';

-- ############################################################################
-- PART 5: GRANTS (no change — claims already granted in 045)
-- ############################################################################
-- claims already has RLS and grants from migration 045. No RLS changes here.

-- ############################################################################
-- END OF MIGRATION 083
-- ============================================================================
