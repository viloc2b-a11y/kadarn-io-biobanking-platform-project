-- ==========================================================================
-- APF-03 — Twin UUID and Schema Hardening
-- ==========================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
--
-- Schema audit findings:
--
-- Tables with DEFAULT gen_random_uuid():        14/18 OK
-- Tables WITHOUT DEFAULT gen_random_uuid():      4 (organization_twins,
--                                                    shipment_twins,
--                                                    specimen_twins,
--                                                    transaction_twins)
--
-- These 4 twin tables share the same pattern and were likely created
-- before the convention of adding DEFAULT gen_random_uuid() was established.
-- Fix: add missing defaults to all 4.
-- ==========================================================================

-- ############################################################################
-- PART 1: Add DEFAULT gen_random_uuid() to twin tables
-- ############################################################################

ALTER TABLE IF EXISTS organization_twins
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE IF EXISTS shipment_twins
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE IF EXISTS specimen_twins
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE IF EXISTS transaction_twins
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ############################################################################
-- PART 2: VERIFY
-- ############################################################################

DO $$
DECLARE
    v_org_default TEXT;
    v_shp_default TEXT;
    v_spc_default TEXT;
    v_trx_default TEXT;
BEGIN
    SELECT column_default INTO v_org_default FROM information_schema.columns
        WHERE table_name = 'organization_twins' AND column_name = 'id';
    SELECT column_default INTO v_shp_default FROM information_schema.columns
        WHERE table_name = 'shipment_twins' AND column_name = 'id';
    SELECT column_default INTO v_spc_default FROM information_schema.columns
        WHERE table_name = 'specimen_twins' AND column_name = 'id';
    SELECT column_default INTO v_trx_default FROM information_schema.columns
        WHERE table_name = 'transaction_twins' AND column_name = 'id';

    IF v_org_default IS NULL THEN RAISE EXCEPTION 'organization_twins.id still has no default'; END IF;
    IF v_shp_default IS NULL THEN RAISE EXCEPTION 'shipment_twins.id still has no default'; END IF;
    IF v_spc_default IS NULL THEN RAISE EXCEPTION 'specimen_twins.id still has no default'; END IF;
    IF v_trx_default IS NULL THEN RAISE EXCEPTION 'transaction_twins.id still has no default'; END IF;

    RAISE NOTICE 'APF-03: All twin tables have UUID defaults — OK';
    RAISE NOTICE '  organization_twins: %', v_org_default;
    RAISE NOTICE '  shipment_twins:     %', v_shp_default;
    RAISE NOTICE '  specimen_twins:     %', v_spc_default;
    RAISE NOTICE '  transaction_twins:  %', v_trx_default;
END;
$$;
