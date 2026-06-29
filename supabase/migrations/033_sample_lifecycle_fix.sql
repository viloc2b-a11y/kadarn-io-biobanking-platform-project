-- ============================================================================
-- APF-02 — Sample Lifecycle Schema Fix
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
--
-- Changes:
--   1. Add DEFAULT gen_random_uuid() to collection_twins.id
--      Without this, INSERT into collection_twins requires an explicit UUID,
--      which breaks the API flow where the route creates collection_twins
--      without providing an ID (expecting DB to generate one).
--
--   2. This is the only schema fix needed.
--      processing_samples already has correct nullable parent_sample_id and
--      TEXT sample_id (human-readable). No circular FK exists.
-- ============================================================================

-- ############################################################################
-- PART 1: collection_twins — ADD DEFAULT gen_random_uuid()
-- ############################################################################
-- The current schema has `id UUID PRIMARY KEY` without a default.
-- This means every INSERT must provide an explicit UUID, which is inconsistent
-- with every other Kadarn table. This was discovered during ALPHA-PILOT-03.
-- ============================================================================

ALTER TABLE IF EXISTS collection_twins
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ############################################################################
-- PART 2: VERIFY
-- ############################################################################

DO $$
DECLARE
    v_has_default BOOLEAN;
    v_can_insert  UUID;
BEGIN
    -- Check that the default was set
    SELECT pg_catalog.has_column_privilege(
        'collection_twins'::regclass, 'id', 'INSERT'
    ) INTO v_has_default;

    -- Test that we can insert without providing an id
    INSERT INTO collection_twins (organization_id, status)
    VALUES ('00000000-0000-0000-0000-000000000000', 'planned')
    RETURNING id INTO v_can_insert;

    RAISE NOTICE 'collection_twins auto-id: % (inserted id: %)',
        CASE WHEN v_can_insert IS NOT NULL THEN 'OK' ELSE 'FAIL' END,
        v_can_insert;

    -- Clean up test row
    DELETE FROM collection_twins WHERE id = v_can_insert;

    RAISE NOTICE 'APF-02 migration applied successfully';
END;
$$;
