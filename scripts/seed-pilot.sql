-- ==========================================================================
-- ALPHA-PILOT-01 — Production Seed Environment
-- ==========================================================================
-- Creates realistic seed data for the Kadarn alpha pilot.
-- Idempotent: uses INSERT ... ON CONFLICT DO NOTHING.
--
-- Usage:
--   supabase db execute --file scripts/seed-pilot.sql
--   # or:
--   psql "$DATABASE_URL" -f scripts/seed-pilot.sql
-- ==========================================================================

BEGIN;

-- ==========================================================================
-- 1. Organizations
-- ==========================================================================
INSERT INTO organizations (id, name, legal_name, tax_id, country, city, region, postal_code, email, phone, description, is_active, visibility_scope, created_by, certifications)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Kadarn Demo Network', NULL, NULL, 'CH', NULL, NULL, NULL, 'admin@kadarn-demo.io', NULL, 'Kadarn platform demo network', true, 'network', '00000000-0000-0000-0000-000000000000', '{}'),
  ('a1000000-0000-0000-0000-000000000010', 'Lyon Translational Biobank', 'Hospices Civils de Lyon - Biobanque', 'FR-123456789', 'FR', 'Lyon', 'Auvergne-Rhone-Alpes', '69003', 'biobank@lyon-biobank.fr', '+33 4 72 11 00 01', 'ISO 20387 certified biobank specializing in oncology biospecimens', true, 'network', '00000000-0000-0000-0000-000000000000', '{"ISO-20387", "NF-S96-900"}'),
  ('a1000000-0000-0000-0000-000000000020', 'Centre Hospitalier Lyon-Sud', 'Hospices Civils de Lyon', 'FR-987654321', 'FR', 'Pierre-Benite', 'Auvergne-Rhone-Alpes', '69495', 'contact@chu-lyon.fr', '+33 4 78 86 00 00', 'University hospital with active clinical research programs', true, 'network', '00000000-0000-0000-0000-000000000000', '{}'),
  ('a1000000-0000-0000-0000-000000000030', 'Geneva Research Pharma AG', 'Geneva Research Pharma AG', 'CHE-123.456.789', 'CH', 'Geneva', 'Geneva', '1202', 'info@grp-pharma.ch', '+41 22 555 00 00', 'Clinical-stage biopharmaceutical company specializing in oncology', true, 'network', '00000000-0000-0000-0000-000000000000', '{}'),
  ('a1000000-0000-0000-0000-000000000040', 'Eurofins Central Laboratory', 'Eurofins Genomics GmbH', 'DE-123456789', 'DE', 'Munich', 'Bavaria', '80333', 'lab@eurofins-genomics.de', '+49 89 12345 000', 'CAP-accredited central laboratory for biomarker analysis', true, 'network', '00000000-0000-0000-0000-000000000000', '{"CAP", "ISO-15189"}'),
  ('a1000000-0000-0000-0000-000000000050', 'Global Cryo Logistics', 'Global Cryo Logistics BV', 'NL-123456789B01', 'NL', 'Amsterdam', 'North Holland', '1118', 'ops@globalcryo.nl', '+31 20 555 0000', 'Specialized biostorage and cold chain logistics provider', true, 'network', '00000000-0000-0000-0000-000000000000', '{"GDP", "IATA-CEIV"}')
ON CONFLICT (id) DO NOTHING;

-- ==========================================================================
-- 2. Programs
-- ==========================================================================
INSERT INTO programs (id, name, short_name, description, status, sponsor_org_id, created_by, created_by_organization_id)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'BREAST-2026: Multi-center biomarker validation', 'BREAST-2026', 'Retrospective and prospective collection of breast cancer specimens for novel biomarker validation across 3 European sites', 'active', 'a1000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000030'),
  ('c1000000-0000-0000-0000-000000000002', 'LUNG-2026: Early detection cfDNA study', 'LUNG-2026', 'Multi-center study for early-stage lung cancer detection using circulating free DNA from liquid biopsies', 'draft', 'a1000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000030')
ON CONFLICT (id) DO NOTHING;

-- ==========================================================================
-- 3. Collections (collection_twins)
-- ==========================================================================
INSERT INTO collection_twins (id, organization_id, status, target_enrollment, actual_enrollment, protocol, irb_ref, consent_model)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 'active', 500, 342, 'FFPE extraction per SOP-BRCA-001', 'IRB-LYON-2025-078', 'opt-out'),
  ('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000020', 'active', 200, 47, 'Surgical collection per SOP-LYON-SURG-001', 'IRB-LYON-2026-012', 'opt-in')
ON CONFLICT (id) DO NOTHING;

-- ==========================================================================
-- 4. Supply items
-- ==========================================================================
INSERT INTO supply_items (organization_id, created_by, type, title, description, disease_icd10, disease_label, sample_types, country, commercial_use_allowed, non_profit_use_allowed)
VALUES
  ('a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'existing_collection', 'Breast cancer FFPE tissue microarray', 'Tissue microarray blocks from 342 breast cancer patients with 5-year clinical follow-up', 'C50', 'Breast cancer', '{"FFPE","frozen_tissue"}', 'FR', false, true),
  ('a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'existing_collection', 'Serum biobank from oncology patients', 'Matched serum samples from 200 breast cancer patients', 'C50', 'Breast cancer', '{"serum","plasma"}', 'FR', false, true)
ON CONFLICT DO NOTHING;

-- ==========================================================================
-- 5. Exchange request + deal
-- ==========================================================================
INSERT INTO exchange_requests (id, requester_id, organization_id, title, description, status, target_org_ids, program_id, requested_sample_count, commercial_use, nonprofit_use, submitted_at)
VALUES
  ('d1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000030', 'FFPE blocks for BREAST-2026 biomarker validation', 'Request for 200 FFPE tissue microarray cores from breast cancer cohort for IHC and NGS validation', 'submitted', '{a1000000-0000-0000-0000-000000000010}', 'c1000000-0000-0000-0000-000000000001', 200, false, true, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO exchange_deals (id, request_id, sponsor_org_id, provider_org_id, program_id, title, status, total_value, currency, sample_count_expected, created_by)
VALUES
  ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000030', 'a1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001', 'FFPE cores supply for BREAST-2026', 'active', 45000.00, 'EUR', 200, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO exchange_escrow (deal_id, total_amount, released_amount, refunded_amount, status, created_by)
VALUES
  ('d2000000-0000-0000-0000-000000000001', 45000.00, 0, 0, 'pending', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (deal_id) DO NOTHING;

-- ==========================================================================
-- 6. Shipments
-- ==========================================================================
INSERT INTO logistics_shipments (id, program_id, organization_id, shipment_name, status, carrier, origin_address, destination_address, container_type, created_by)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 'FFPE blocks batch 1', 'delivered', 'fedex', 'Lyon Biobank, France', 'Eurofins Munich, Germany', 'ambient', '00000000-0000-0000-0000-000000000000'),
  ('f1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 'Serum samples batch 1', 'in_transit', 'dhl', 'Lyon Biobank, France', 'Eurofins Munich, Germany', 'dry_ice_box', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- ==========================================================================
-- 7. Processing samples + aliquots + QC
-- ==========================================================================
INSERT INTO processing_samples (id, program_id, organization_id, sample_id, sample_type, collection_date, current_state, created_by)
VALUES
  ('d4000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 'd4000000-0000-0000-0000-000000000001', 'FFPE', '2026-01-15', 'processing', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO processing_aliquots (id, sample_id, program_id, aliquot_id, quantity, quantity_unit, concentration, concentration_unit, current_state, qc_status, storage_condition, created_by)
VALUES
  ('d5000000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'ALQ-BRCA-001', 50, 'uL', 45.2, 'ng/uL', 'stored', 'pass', 'frozen_minus_80', '00000000-0000-0000-0000-000000000000'),
  ('d5000000-0000-0000-0000-000000000002', 'd4000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'ALQ-BRCA-002', 50, 'uL', 12.8, 'ng/uL', 'stored', 'fail', 'frozen_minus_80', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- ==========================================================================
-- 8. Provenance
-- ==========================================================================
INSERT INTO provenance_nodes (id, node_type, external_id, label, organization_id, properties)
VALUES
  ('a2000000-0000-0000-0000-000000000001', 'organization', 'a1000000-0000-0000-0000-000000000010', 'Lyon Translational Biobank', 'a1000000-0000-0000-0000-000000000010', '{"type":"biobank","country":"FR","certifications":["ISO-20387"]}'),
  ('a2000000-0000-0000-0000-000000000002', 'specimen', 'LYON-BRCA-001', 'Breast cancer FFPE block LYON-BRCA-001', 'a1000000-0000-0000-0000-000000000010', '{"diagnosis":"invasive ductal carcinoma","grade":3,"er_status":"positive","her2_status":"negative"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provenance_edges (id, edge_type, source_node_id, target_node_id, properties)
VALUES
  ('a3000000-0000-0000-0000-000000000001', 'derived_from', 'a2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', '{"relation":"owned_by"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provenance_evidence (id, node_id, evidence_type, reference, description)
VALUES
  ('a4000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'pathology_report', 'https://kadarn-demo.io/evidence/PATH-BRCA-001.pdf', 'Original pathology report confirming invasive ductal carcinoma diagnosis')
ON CONFLICT (id) DO NOTHING;

-- ==========================================================================
-- 9. Audit events
-- ==========================================================================
INSERT INTO audit_events (action, resource_type, resource_id, actor_id, organization_id, metadata)
VALUES
  ('create', 'organization', 'a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', NULL, '{}'),
  ('submit', 'access_request', 'd1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000030', '{}'),
  ('create', 'other', 'f1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000010', '{}'),
  ('update', 'sample', 'd5000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000010', '{}');

-- ==========================================================================
-- 10. Note: Organization memberships require auth.users
-- ==========================================================================
-- Memberships reference auth.users (Supabase auth schema).
-- Create users via Supabase Auth API first, then insert memberships.
-- Skipped in this seed — create users via:
--   supabase auth create-user --email admin@lyon-biobank.fr --password secure123
-- Then insert:
--   INSERT INTO organization_memberships (organization_id, user_id, status, invited_by, invited_at, joined_at)
--   SELECT 'a1000000-0000-0000-0000-000000000010', id, 'active', id, now(), now()
--   FROM auth.users WHERE email = 'admin@lyon-biobank.fr';

COMMIT;

-- ==========================================================================
-- Summary
-- ==========================================================================
DO $$
DECLARE
  org_count INT;
  prog_count INT;
  coll_count INT;
  supply_count INT;
  req_count INT;
  deal_count INT;
  ship_count INT;
  sample_count INT;
  prov_nodes INT;
  prov_edges INT;
  audit_count INT;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations WHERE id::text LIKE 'a1%';
  SELECT COUNT(*) INTO prog_count FROM programs WHERE id::text LIKE 'c1%';
  SELECT COUNT(*) INTO coll_count FROM collection_twins WHERE id::text LIKE 'e1%';
  SELECT COUNT(*) INTO supply_count FROM supply_items WHERE organization_id::text LIKE 'a1000000-0000-0000-0000-000000000010';
  SELECT COUNT(*) INTO req_count FROM exchange_requests WHERE id = 'd1000000-0000-0000-0000-000000000001'::uuid;
  SELECT COUNT(*) INTO deal_count FROM exchange_deals WHERE id = 'd2000000-0000-0000-0000-000000000001'::uuid;
  SELECT COUNT(*) INTO ship_count FROM logistics_shipments WHERE id::text LIKE 'f1%';
  SELECT COUNT(*) INTO sample_count FROM processing_samples WHERE id::text LIKE 'd4%';
  SELECT COUNT(*) INTO prov_nodes FROM provenance_nodes WHERE id::text LIKE 'a2%';
  SELECT COUNT(*) INTO prov_edges FROM provenance_edges WHERE id::text LIKE 'a3%';
  SELECT COUNT(*) INTO audit_count FROM audit_events WHERE action = 'create' AND created_at > now() - interval '1 minute';

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Alpha Pilot Seed — Summary';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Organizations:      %', org_count;
  RAISE NOTICE 'Programs:           %', prog_count;
  RAISE NOTICE 'Collections:        %', coll_count;
  RAISE NOTICE 'Supply items:       %', supply_count;
  RAISE NOTICE 'Exchange requests:  %', req_count;
  RAISE NOTICE 'Exchange deals:     %', deal_count;
  RAISE NOTICE 'Shipments:          %', ship_count;
  RAISE NOTICE 'Samples:            %', sample_count;
  RAISE NOTICE 'Provenance nodes:   %', prov_nodes;
  RAISE NOTICE 'Provenance edges:   %', prov_edges;
  RAISE NOTICE 'Audit events:       %', audit_count;
  RAISE NOTICE '==========================================';
END;
$$;
