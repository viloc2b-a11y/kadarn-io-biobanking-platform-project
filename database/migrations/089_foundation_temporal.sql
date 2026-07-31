-- ============================================================================
-- 01-F FOUNDATION — Temporal Tracking for Institution Model
-- ============================================================================
-- Authority: KADARN MVP Block 01-F
-- Purpose: Add temporal validity columns (valid_from, valid_until) to the 
--          core institution tables: locations, organization_memberships, 
--          membership_roles. Also adds alias_resolution_attributes JSONB to 
--          the people table.
-- Strategy: All new columns are NULLABLE (backward compatible with existing 
--           data). No data migration is required — existing rows will have 
--           NULL for the new columns.
-- ============================================================================

-- ############################################################################
-- 1. LOCATIONS — Add temporal validity
-- ############################################################################

ALTER TABLE public.locations
    ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

COMMENT ON COLUMN public.locations.valid_from IS 
    'When this location record becomes effective (temporal lower bound). NULL = unbounded past.';
COMMENT ON COLUMN public.locations.valid_until IS 
    'When this location record ceases to be effective (temporal upper bound). NULL = currently valid.';

-- ############################################################################
-- 2. ORGANIZATION_MEMBERSHIPS — Add temporal validity
-- ############################################################################

ALTER TABLE public.organization_memberships
    ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

COMMENT ON COLUMN public.organization_memberships.valid_from IS 
    'When this membership becomes effective (temporal lower bound). NULL = unbounded past.';
COMMENT ON COLUMN public.organization_memberships.valid_until IS 
    'When this membership ceases to be effective (temporal upper bound). NULL = currently valid.';

-- ############################################################################
-- 3. MEMBERSHIP_ROLES — Add temporal validity
-- ############################################################################

ALTER TABLE public.membership_roles
    ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

COMMENT ON COLUMN public.membership_roles.valid_from IS 
    'When this role assignment becomes effective (temporal lower bound). NULL = unbounded past.';
COMMENT ON COLUMN public.membership_roles.valid_until IS 
    'When this role assignment ceases to be effective (temporal upper bound). NULL = currently valid.';

-- ############################################################################
-- 4. PEOPLE — Add alias resolution attributes
-- ############################################################################

ALTER TABLE public.people
    ADD COLUMN IF NOT EXISTS alias_resolution_attributes JSONB;

COMMENT ON COLUMN public.people.alias_resolution_attributes IS 
    'Machine-readable attributes used for entity resolution / alias merging. Stores known name variants, identifier mappings, and resolution confidence metadata.';

-- ############################################################################
-- VERIFICATION CHECKS
-- ############################################################################

DO $$
BEGIN
    -- Verify locations columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'locations' AND column_name = 'valid_from'
    ) THEN
        RAISE EXCEPTION 'Column valid_from missing on public.locations';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'locations' AND column_name = 'valid_until'
    ) THEN
        RAISE EXCEPTION 'Column valid_until missing on public.locations';
    END IF;

    -- Verify organization_memberships columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organization_memberships' AND column_name = 'valid_from'
    ) THEN
        RAISE EXCEPTION 'Column valid_from missing on public.organization_memberships';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organization_memberships' AND column_name = 'valid_until'
    ) THEN
        RAISE EXCEPTION 'Column valid_until missing on public.organization_memberships';
    END IF;

    -- Verify membership_roles columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'membership_roles' AND column_name = 'valid_from'
    ) THEN
        RAISE EXCEPTION 'Column valid_from missing on public.membership_roles';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'membership_roles' AND column_name = 'valid_until'
    ) THEN
        RAISE EXCEPTION 'Column valid_until missing on public.membership_roles';
    END IF;

    -- Verify people column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'people' AND column_name = 'alias_resolution_attributes'
    ) THEN
        RAISE EXCEPTION 'Column alias_resolution_attributes missing on public.people';
    END IF;

    RAISE NOTICE '✓ Migration 089 verification passed: all temporal columns added successfully.';
END $$;
