-- ============================================================================
-- Kadarn Platform — Runtime Execution Gate Seed Data
-- ============================================================================
-- This seed creates the complete data environment for all 5 operational pilots.
-- Run AFTER all migrations have been applied.
-- ============================================================================

-- ############################################################################
-- ORGANIZATIONS
-- ############################################################################

-- Note: In production these are created via POST /api/organizations.
-- For the execution gate, we seed them directly.

INSERT INTO public.organizations (id, name, legal_name, country, is_active, created_at) VALUES
  ('org-sponsor-0001', 'PharmaCorp Oncology', 'PharmaCorp Inc.', 'US', true, now()),
  ('org-biobank-0002', 'National Biobank Repository', 'National Biobank Foundation', 'GB', true, now()),
  ('org-hospital-0003', 'City University Hospital', 'City Hospital NHS Trust', 'GB', true, now()),
  ('org-lab-0004',    'Advanced Pathology Lab', 'APL Diagnostics GmbH', 'DE', true, now()),
  ('org-logistics-0005', 'Global Cold Chain Logistics', 'GCC Logistics Ltd', 'NL', true, now())
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- CAPABILITIES
-- ############################################################################

-- Ensure capability types exist
INSERT INTO public.organization_capability_types (key, name, category) VALUES
  ('sponsor', 'Sponsor', 'funding'),
  ('biobank', 'Biobank', 'storage'),
  ('clinical_site', 'Clinical Site', 'clinical'),
  ('processing_lab', 'Processing Lab', 'laboratory'),
  ('logistics_vendor', 'Logistics Vendor', 'logistics')
ON CONFLICT (key) DO NOTHING;

-- Assign capabilities to orgs
INSERT INTO public.organization_capabilities (organization_id, capability_type_id)
SELECT 'org-sponsor-0001', id FROM public.organization_capability_types WHERE key = 'sponsor'
UNION ALL
SELECT 'org-biobank-0002', id FROM public.organization_capability_types WHERE key = 'biobank'
UNION ALL
SELECT 'org-hospital-0003', id FROM public.organization_capability_types WHERE key = 'clinical_site'
UNION ALL
SELECT 'org-lab-0004', id FROM public.organization_capability_types WHERE key = 'processing_lab'
UNION ALL
SELECT 'org-logistics-0005', id FROM public.organization_capability_types WHERE key = 'logistics_vendor'
ON CONFLICT DO NOTHING;

-- ############################################################################
-- USERS (auth.users + user_profiles)
-- ############################################################################
-- Note: In production, users register via Supabase Auth.
-- For the execution gate, we create placeholder profiles.
-- Actual auth.users must be created via Supabase Auth API.

INSERT INTO public.user_profiles (id, full_name, email, role) VALUES
  ('user-sponsor-admin', 'Dr. Sarah Chen', 'sarah.chen@pharmacorp.com', 'org_admin'),
  ('user-biobank-admin', 'Prof. James Wilson', 'j.wilson@biobank.org', 'org_admin'),
  ('user-hospital-admin', 'Dr. Maria Rodriguez', 'm.rodriguez@cityhospital.nhs.uk', 'org_admin'),
  ('user-lab-admin', 'Dr. Klaus Mueller', 'k.mueller@apl.de', 'org_admin'),
  ('user-logistics-admin', 'Elena Van den Berg', 'e.vandenberg@gcc.nl', 'org_admin'),
  ('user-researcher', 'Dr. Alex Thompson', 'a.thompson@pharmacorp.com', 'org_member')
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- MEMBERSHIPS
-- ############################################################################

INSERT INTO public.organization_memberships (organization_id, user_id, role, status, joined_at) VALUES
  ('org-sponsor-0001', 'user-sponsor-admin', 'admin', 'active', now()),
  ('org-sponsor-0001', 'user-researcher', 'member', 'active', now()),
  ('org-biobank-0002', 'user-biobank-admin', 'admin', 'active', now()),
  ('org-hospital-0003', 'user-hospital-admin', 'admin', 'active', now()),
  ('org-lab-0004', 'user-lab-admin', 'admin', 'active', now()),
  ('org-logistics-0005', 'user-logistics-admin', 'admin', 'active', now())
ON CONFLICT DO NOTHING;

-- ############################################################################
-- PROGRAMS (Pilot 1 — Prospective Collection)
-- ############################################################################

INSERT INTO public.programs (id, name, short_name, description, status, sponsor_org_id, visibility_scope, created_by, created_at) VALUES
  ('prog-pilot1-001', 'Oncology Biomarker Validation 2026', 'OBV-2026', 'Prospective collection of NSCLC specimens for biomarker validation study.', 'active', 'org-sponsor-0001', 'network', 'user-sponsor-admin', now())
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PROGRAM PARTICIPANTS (Pilot 1)
-- ############################################################################

INSERT INTO public.program_participants (program_id, organization_id, role, status, joined_at) VALUES
  ('prog-pilot1-001', 'org-sponsor-0001', 'sponsor', 'active', now()),
  ('prog-pilot1-001', 'org-hospital-0003', 'contributor', 'active', now()),
  ('prog-pilot1-001', 'org-biobank-0002', 'contributor', 'active', now()),
  ('prog-pilot1-001', 'org-lab-0004', 'processor', 'active', now()),
  ('prog-pilot1-001', 'org-logistics-0005', 'processor', 'active', now())
ON CONFLICT DO NOTHING;

-- ############################################################################
-- MILESTONES (Pilot 1)
-- ############################################################################

DO $$
DECLARE
  prog_id UUID := 'prog-pilot1-001';
BEGIN
  INSERT INTO public.program_milestones (program_id, milestone_type, title, status, planned_end_date) VALUES
    (prog_id, 'irb_submission',  'IRB Protocol Submission',         'completed', now() - interval '30 days'),
    (prog_id, 'irb_approval',    'IRB Approval Received',           'completed', now() - interval '20 days'),
    (prog_id, 'mta_execution',   'Material Transfer Agreement',     'completed', now() - interval '15 days'),
    (prog_id, 'collection_start','Specimen Collection Start',       'completed', now() - interval '10 days'),
    (prog_id, 'collection_complete', 'Collection Complete',         'in_progress', now() + interval '20 days'),
    (prog_id, 'processing_start', 'FFPE Processing Start',          'pending', now() + interval '25 days'),
    (prog_id, 'qc_review',        'QC Review',                      'pending', now() + interval '40 days'),
    (prog_id, 'data_delivery',    'Data Package Delivery',          'pending', now() + interval '60 days');
END $$;

-- ############################################################################
-- SUPPLY ITEMS (Pilot 2 + 4 — Marketplace)
-- ############################################################################

INSERT INTO public.supply_items (organization_id, created_by, type, title, description, sample_types, disease_label, country, commercial_use_allowed) VALUES
  ('org-biobank-0002', 'user-biobank-admin', 'existing_collection', 'Lung Cancer FFPE Cohort 2019-2024', 'Retrospective FFPE tissue blocks from NSCLC patients. 450 specimens with matched clinical data.', ARRAY['ffpe'], 'Non-small Cell Lung Cancer', 'GB', true),
  ('org-biobank-0002', 'user-biobank-admin', 'existing_collection', 'Breast Cancer Serum Collection', 'Serum samples from 200 HR+/HER2- breast cancer patients. Annual follow-up available.', ARRAY['serum', 'plasma'], 'Breast Cancer', 'GB', false),
  ('org-hospital-0003', 'user-hospital-admin', 'prospective_collection', 'Prospective Colorectal Cancer Collection', 'Fresh tissue + blood from colorectal cancer patients undergoing surgical resection.', ARRAY['fresh_frozen', 'whole_blood'], 'Colorectal Cancer', 'GB', true),
  ('org-lab-0004', 'user-lab-admin', 'laboratory_service', 'IHC & Multiplex Immunofluorescence', 'Full-service IHC panel and 7-plex immunofluorescence for FFPE sections.', ARRAY['ffpe'], NULL, 'DE', true);

-- ############################################################################
-- TRUST SCORES (Pilot 2 + 4)
-- ############################################################################

INSERT INTO public.organization_trust (organization_id, overall_score, operational_score, regulatory_score, financial_score, technical_score, total_fulfillments, successful_fulfillments) VALUES
  ('org-biobank-0002', 0.87, 0.90, 0.95, 0.82, 0.85, 45, 42),
  ('org-hospital-0003', 0.78, 0.75, 0.88, 0.70, 0.80, 18, 15),
  ('org-lab-0004', 0.92, 0.95, 0.90, 0.88, 0.93, 67, 65),
  ('org-logistics-0005', 0.85, 0.88, 0.80, 0.82, 0.90, 120, 112)
ON CONFLICT (organization_id) DO NOTHING;

-- ############################################################################
-- SPECIMEN TWINS (Pilot 1)
-- ############################################################################

DO $$
DECLARE
  i INTEGER;
  spec_id UUID;
  prog_id UUID := 'prog-pilot1-001';
  hosp_id UUID := 'org-hospital-0003';
BEGIN
  FOR i IN 1..10 LOOP
    spec_id := gen_random_uuid();
    INSERT INTO public.specimen_twins (id, external_id, specimen_type, twin_status, twin_health, organization_id, program_id, properties)
    VALUES (
      spec_id,
      'OBV-' || LPAD(i::TEXT, 4, '0') || '-FFPE',
      'ffpe',
      'active',
      'healthy',
      hosp_id,
      prog_id,
      jsonb_build_object(
        'collection_date', (now() - interval '5 days' + (i || ' days')::INTERVAL)::TEXT,
        'tissue_type', CASE i % 3 WHEN 0 THEN 'lung' WHEN 1 THEN 'lymph_node' ELSE 'pleura' END,
        'preservation', 'ffpe',
        'block_count', 1 + (i % 3)
      )
    );

    -- Provenance node for each specimen
    INSERT INTO public.provenance_nodes (id, node_type, external_id, label, properties, organization_id)
    VALUES (
      gen_random_uuid(),
      'specimen',
      'OBV-' || LPAD(i::TEXT, 4, '0'),
      'Tissue Block OBV-' || LPAD(i::TEXT, 4, '0'),
      jsonb_build_object('program_id', prog_id, 'specimen_id', spec_id),
      hosp_id
    );
  END LOOP;
END $$;

-- ############################################################################
-- SHIPMENT TWINS (Pilot 1)
-- ############################################################################

INSERT INTO public.shipment_twins (id, external_id, twin_status, twin_health, organization_id, program_id, metadata)
SELECT
  gen_random_uuid(),
  'SH-OBV-001',
  'in_transit',
  'healthy',
  'org-logistics-0005',
  'prog-pilot1-001',
  jsonb_build_object('carrier', 'FedEx', 'origin', 'Manchester, UK', 'destination', 'Berlin, DE')
WHERE NOT EXISTS (SELECT 1 FROM public.shipment_twins WHERE external_id = 'SH-OBV-001');

-- ############################################################################
-- LOGISTICS SHIPMENT
-- ############################################################################

INSERT INTO public.logistics_shipments (id, program_id, organization_id, shipment_name, status, carrier, origin, destination, estimated_delivery)
SELECT
  gen_random_uuid(), 'prog-pilot1-001', 'org-logistics-0005', 'OBV Shipment 001', 'in_transit', 'FedEx', 'Manchester, UK', 'Berlin, DE', now() + interval '3 days'
WHERE NOT EXISTS (SELECT 1 FROM public.logistics_shipments WHERE shipment_name = 'OBV Shipment 001');

-- ############################################################################
-- PROVENANCE EDGES
-- ############################################################################

DO $$
DECLARE
  collection_node UUID;
  processing_node UUID;
  shipment_node UUID;
  specimen_nodes UUID[];
  n RECORD;
BEGIN
  -- Create a collection event
  INSERT INTO public.provenance_nodes (node_type, external_id, label, organization_id)
  VALUES ('collection_event', 'COL-OBV-001', 'OBV Collection Event — City Hospital', 'org-hospital-0003')
  RETURNING id INTO collection_node;

  -- Create processing event
  INSERT INTO public.provenance_nodes (node_type, external_id, label, organization_id)
  VALUES ('processing_event', 'PROC-OBV-001', 'FFPE Processing — APL Berlin', 'org-lab-0004')
  RETURNING id INTO processing_node;

  -- Create shipment event
  INSERT INTO public.provenance_nodes (node_type, external_id, label, organization_id)
  VALUES ('shipment', 'SH-OBV-001', 'Shipment OBV-001 — Manchester to Berlin', 'org-logistics-0005')
  RETURNING id INTO shipment_node;

  -- Link: specimens → collection
  FOR n IN SELECT id FROM public.provenance_nodes WHERE node_type = 'specimen' AND properties->>'program_id' = 'prog-pilot1-001' LIMIT 5 LOOP
    INSERT INTO public.provenance_edges (edge_type, source_node_id, target_node_id)
    VALUES ('collected_in', n.id, collection_node);
  END LOOP;

  -- Link: collection → processing
  INSERT INTO public.provenance_edges (edge_type, source_node_id, target_node_id)
  VALUES ('processed_at', collection_node, processing_node);

  -- Link: processing → shipment
  INSERT INTO public.provenance_edges (edge_type, source_node_id, target_node_id)
  VALUES ('shipped_via', processing_node, shipment_node);
END $$;

-- ############################################################################
-- EXCHANGE DEALS + ESCROW (Pilot 1 settlement)
-- ############################################################################

DO $$
DECLARE
  req_id UUID;
  deal_id UUID;
BEGIN
  -- Create an exchange request first (required by exchange_deals FK)
  INSERT INTO public.exchange_requests (id, requester_id, organization_id, program_id, title, description, status)
  VALUES (
    gen_random_uuid(), 'user-sponsor-admin', 'org-sponsor-0001', 'prog-pilot1-001',
    'OBV-2026 Specimen Access Request',
    'Access to 50 FFPE blocks + matched clinical data for biomarker validation.',
    'accepted'
  ) RETURNING id INTO req_id;

  -- Create the exchange deal
  INSERT INTO public.exchange_deals (request_id, sponsor_org_id, provider_org_id, program_id, title, status, total_value, sample_count_expected, sample_count_delivered, mta_signed_by_sponsor, mta_signed_by_provider, mta_signed_at, created_by)
  VALUES (
    req_id, 'org-sponsor-0001', 'org-biobank-0002', 'prog-pilot1-001',
    'OBV-2026 Biomarker Validation Agreement', 'active',
    150000.00, 50, 25,
    true, true, now(),
    'user-sponsor-admin'
  ) RETURNING id INTO deal_id;

  -- Escrow: 80% released (simulating partial delivery)
  INSERT INTO public.exchange_escrow (deal_id, status, total_amount, released_amount)
  VALUES (deal_id, 'partially_released', 150000.00, 120000.00);
END $$;

-- ############################################################################
-- AUDIT EVENTS (for activity feed)
-- ############################################################################

INSERT INTO public.audit_events (actor_id, actor_email, action, resource_type, resource_id, organization_id, program_id, summary, created_at)
SELECT
  'user-sponsor-admin', 'sarah.chen@pharmacorp.com', 'create', 'program', 'prog-pilot1-001', 'org-sponsor-0001', 'prog-pilot1-001',
  'Program created: Oncology Biomarker Validation 2026', now() - interval '45 days'
WHERE NOT EXISTS (SELECT 1 FROM public.audit_events WHERE resource_id = 'prog-pilot1-001' AND action = 'create');

INSERT INTO public.audit_events (actor_id, actor_email, action, resource_type, resource_id, organization_id, program_id, summary, created_at)
SELECT
  'user-hospital-admin', 'm.rodriguez@cityhospital.nhs.uk', 'complete', 'milestone', gen_random_uuid()::TEXT, 'org-hospital-0003', 'prog-pilot1-001',
  'Milestone completed: IRB Approval Received', now() - interval '20 days'
WHERE NOT EXISTS (SELECT 1 FROM public.audit_events WHERE summary LIKE '%IRB Approval%');

INSERT INTO public.audit_events (actor_id, actor_email, action, resource_type, resource_id, organization_id, program_id, summary, created_at)
SELECT
  'user-logistics-admin', 'e.vandenberg@gcc.nl', 'create', 'shipment', gen_random_uuid()::TEXT, 'org-logistics-0005', 'prog-pilot1-001',
  'Shipment created: OBV Shipment 001 — Manchester to Berlin', now() - interval '2 days'
WHERE NOT EXISTS (SELECT 1 FROM public.audit_events WHERE summary LIKE '%OBV Shipment%');

-- ############################################################################
-- TRUST CHALLENGES (for exceptions dashboard)
-- ############################################################################

INSERT INTO public.trust_challenges (organization_id, dimension, challenged_score, proposed_score, evidence_ref, reason, status, created_by)
SELECT
  'org-hospital-0003', 'financial', 0.70, 0.78,
  'doc-ref-2026-001', 'Recent capital investment in cold chain infrastructure not reflected in financial score.',
  'filed', 'user-hospital-admin'
WHERE NOT EXISTS (SELECT 1 FROM public.trust_challenges WHERE organization_id = 'org-hospital-0003');

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
-- After seeding, verify with:
--   supabase db dump --data-only --file verify.sql
--   grep "INSERT" verify.sql | wc -l
-- ============================================================================
