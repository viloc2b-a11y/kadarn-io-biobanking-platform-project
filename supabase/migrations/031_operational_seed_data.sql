-- ============================================================================
-- KADARN PLATFORM — Operational Seed Data
-- ============================================================================
-- Target: local dev + CI only. Never run against production.
-- Dependencies: All migrations 008–030 must run first.
--
-- Populates the platform with realistic operational data so that:
--   Marketplace search returns results
--   Workspace shows org-scoped programs, requests, shipments
--   KOC dashboards have real KPIs, trust scores, exceptions, KPE data
--
-- Scenario: "Oncology Biomarker Validation Program"
--   Sponsor: PharmaCorp
--   CRO: ClinResearch CRO
--   Sites: Univ Medical Center
--   Biobank: National Biobank
--   Lab: Advanced Path Lab
--   Courier: Global Cold Chain
--   IRB: Central IRB
-- ============================================================================

-- ############################################################################
-- PART 1: PROGRAMS
-- ############################################################################

DO $$
DECLARE
    v_sponsor  CONSTANT UUID := 'a0000000-0000-0000-0000-000000000001';
    v_cro      CONSTANT UUID := 'a0000000-0000-0000-0000-000000000002';
    v_site     CONSTANT UUID := 'a0000000-0000-0000-0000-000000000003';
    v_biobank  CONSTANT UUID := 'a0000000-0000-0000-0000-000000000004';
    v_lab      CONSTANT UUID := 'a0000000-0000-0000-0000-000000000005';
    v_courier  CONSTANT UUID := 'a0000000-0000-0000-0000-000000000006';
    v_admin1   CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
    v_irb      CONSTANT UUID := 'a0000000-0000-0000-0000-000000000007';

    v_prog1 UUID; v_prog2 UUID;
    v_deal1 UUID; v_deal2 UUID; v_deal3 UUID;
    v_ship1 UUID; v_ship2 UUID;
    v_spec1 UUID; v_spec2 UUID; v_spec3 UUID; v_spec4 UUID; v_spec5 UUID;
    v_twin1 UUID; v_twin2 UUID;
BEGIN

-- Programs
INSERT INTO public.programs (id, name, short_name, description, program_type, therapeutic_areas, status, sponsor_org_id, start_date, end_date, created_by, created_by_organization_id)
VALUES (gen_random_uuid(), 'Oncology Biomarker Validation 2024-05', 'OBV-2024-05', 'Multi-site validation of PD-L1 and HER2 biomarkers in NSCLC and breast cancer', ARRAY['biomarker_validation'], ARRAY['oncology', 'immuno-oncology'], 'active', v_sponsor, '2024-06-01', '2026-12-31', v_admin1, v_sponsor)
RETURNING id INTO v_prog1;

INSERT INTO public.programs (id, name, short_name, description, program_type, therapeutic_areas, status, sponsor_org_id, start_date, end_date, created_by, created_by_organization_id)
VALUES (gen_random_uuid(), 'Rare Disease Registry — ALD', 'RDR-ALD', 'Longitudinal biospecimen collection for adrenoleukodystrophy research', ARRAY['registry'], ARRAY['rare_disease', 'neurology'], 'active', v_sponsor, '2025-01-01', '2028-12-31', v_admin1, v_sponsor)
RETURNING id INTO v_prog2;

-- Program participants
INSERT INTO public.program_participants (program_id, organization_id, role, created_by) VALUES
    (v_prog1, v_sponsor,  'sponsor', v_admin1),
    (v_prog1, v_cro,      'lead', v_admin1),
    (v_prog1, v_site,     'contributor', v_admin1),
    (v_prog1, v_biobank,  'contributor', v_admin1),
    (v_prog1, v_lab,      'processor', v_admin1),
    (v_prog1, v_courier,  'processor', v_admin1),
    (v_prog1, v_irb,      'reviewer', v_admin1),
    (v_prog2, v_sponsor,  'sponsor', v_admin1),
    (v_prog2, v_site,     'contributor', v_admin1),
    (v_prog2, v_biobank,  'contributor', v_admin1);

-- ############################################################################
-- PART 2: EXCHANGE DEALS (requests + MTA + fulfillment)
-- ############################################################################

INSERT INTO public.exchange_requests (id, organization_id, program_id, status, title, description, requester_id)
VALUES
        (gen_random_uuid(), v_biobank, v_prog1, 'accepted', 'NSCLC FFPE blocks — 200 cases', 'Requesting 200 FFPE blocks from NSCLC stage III-IV with PD-L1 IHC results', v_biobank) RETURNING id INTO v_deal1;

INSERT INTO public.exchange_requests (id, organization_id, program_id, status, title, description, requester_id)
VALUES
        (gen_random_uuid(), v_biobank, v_prog1, 'accepted', 'Breast cancer plasma — 500 aliquots', 'Matched plasma aliquots from HR+ HER2- breast cancer patients pre/post treatment', v_biobank) RETURNING id INTO v_deal2;

INSERT INTO public.exchange_requests (id, organization_id, program_id, status, title, description, requester_id)
VALUES
    (gen_random_uuid(), v_biobank, v_prog2, 'submitted', 'ALD whole blood — 50 donors', 'Longitudinal whole blood collection from ALD patients, 4 timepoints each', v_biobank) RETURNING id INTO v_deal3;

-- ############################################################################
-- PART 3: SPECIMENS + SPECIMEN TWINS
-- ############################################################################

-- Create specimens and their twins via twin events
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES
    ('specimen', gen_random_uuid(), 'SpecimenCollected', '{"organization_id":"a0000000-0000-0000-0000-000000000004","specimen_type":"ffpe","container_type":"block","preservation_type":"ffpe","storage_temperature":"ambient","initial_quantity":1,"unit":"block","consent_status":"active","collection_protocol":"OBV-NSCLC-001"}', 1, '2025-03-15T10:00:00Z', (SELECT id FROM auth.users LIMIT 1))
RETURNING twin_id INTO v_spec1;
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('specimen', v_spec1, 'QCPassed', '{"qcResult":"passed","qcType":"morphology","qcPerformedBy":"path-001"}', 2, '2025-03-16T14:00:00Z', (SELECT id FROM auth.users LIMIT 1));

INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('specimen', gen_random_uuid(), 'SpecimenCollected', '{"organization_id":"a0000000-0000-0000-0000-000000000004","specimen_type":"ffpe","container_type":"block","preservation_type":"ffpe","storage_temperature":"ambient","initial_quantity":1,"unit":"block","consent_status":"active"}', 1, '2025-04-01T09:00:00Z', (SELECT id FROM auth.users LIMIT 1))
RETURNING twin_id INTO v_spec2;
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('specimen', v_spec2, 'QCPassed', '{"qcResult":"passed","qcType":"morphology","qcPerformedBy":"path-001"}', 2, '2025-04-02T11:00:00Z', (SELECT id FROM auth.users LIMIT 1));

INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('specimen', gen_random_uuid(), 'SpecimenCollected', '{"organization_id":"a0000000-0000-0000-0000-000000000004","specimen_type":"plasma","container_type":"cryovial","preservation_type":"fresh_frozen","storage_temperature":"minus_80","initial_quantity":1.5,"unit":"mL","consent_status":"active"}', 1, '2025-03-20T08:00:00Z', (SELECT id FROM auth.users LIMIT 1))
RETURNING twin_id INTO v_spec3;
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('specimen', v_spec3, 'QCPassed', '{"qcResult":"passed","qcType":"hemolysis","qcPerformedBy":"lab-002"}', 2, '2025-03-20T14:00:00Z', (SELECT id FROM auth.users LIMIT 1));

INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('specimen', gen_random_uuid(), 'SpecimenCollected', '{"organization_id":"a0000000-0000-0000-0000-000000000004","specimen_type":"whole_blood","container_type":"edta_tube","preservation_type":"fresh","storage_temperature":"refrigerated_4c","initial_quantity":8,"unit":"mL","consent_status":"active"}', 1, '2025-05-10T07:00:00Z', (SELECT id FROM auth.users LIMIT 1))
RETURNING twin_id INTO v_spec4;

INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('specimen', gen_random_uuid(), 'SpecimenCollected', '{"organization_id":"a0000000-0000-0000-0000-000000000004","specimen_type":"ffpe","container_type":"block","preservation_type":"ffpe","storage_temperature":"ambient","initial_quantity":1,"unit":"block","consent_status":"active"}', 1, '2025-06-01T10:00:00Z', (SELECT id FROM auth.users LIMIT 1))
RETURNING twin_id INTO v_spec5;
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('specimen', v_spec5, 'QCFailed', '{"qcResult":"failed","qcType":"morphology","qcPerformedBy":"path-003","notes":"Tissue fragmentation exceeds threshold"}', 2, '2025-06-02T09:00:00Z', (SELECT id FROM auth.users LIMIT 1));

-- ############################################################################
-- PART 4: SHIPMENTS + SHIPMENT TWINS
-- ############################################################################

INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', gen_random_uuid(), 'ShipmentScheduled', '{"organization_id":"a0000000-0000-0000-0000-000000000006","courier":"Global Cold Chain","originOrgId":"a0000000-0000-0000-0000-000000000004","destinationOrgId":"a0000000-0000-0000-0000-000000000005","temperatureRange":"minus_80"}', 1, '2025-06-10T08:00:00Z', (SELECT id FROM auth.users LIMIT 1))
RETURNING twin_id INTO v_ship1;
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', v_ship1, 'ShipmentPickedUp', '{"trackingNumber":"GCC-2025-0610-01"}', 2, '2025-06-10T14:00:00Z', (SELECT id FROM auth.users LIMIT 1));
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', v_ship1, 'TemperatureReading', '{"temperature":-78,"timestamp":"2025-06-10T16:00:00Z"}', 3, '2025-06-10T16:00:00Z', (SELECT id FROM auth.users LIMIT 1));
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', v_ship1, 'ShipmentDelivered', '{}', 4, '2025-06-12T10:00:00Z', (SELECT id FROM auth.users LIMIT 1));
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', v_ship1, 'ShipmentAccepted', '{}', 5, '2025-06-12T14:00:00Z', (SELECT id FROM auth.users LIMIT 1));

-- Second shipment — with temperature breach (exception)
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', gen_random_uuid(), 'ShipmentScheduled', '{"organization_id":"a0000000-0000-0000-0000-000000000006","courier":"Global Cold Chain","originOrgId":"a0000000-0000-0000-0000-000000000004","destinationOrgId":"a0000000-0000-0000-0000-000000000005","temperatureRange":"minus_80"}', 1, '2025-06-20T08:00:00Z', (SELECT id FROM auth.users LIMIT 1))
RETURNING twin_id INTO v_ship2;
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', v_ship2, 'ShipmentPickedUp', '{"trackingNumber":"GCC-2025-0620-01"}', 2, '2025-06-20T14:00:00Z', (SELECT id FROM auth.users LIMIT 1));
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', v_ship2, 'TemperatureReading', '{"temperature":-82,"timestamp":"2025-06-20T18:00:00Z"}', 3, '2025-06-20T18:00:00Z', (SELECT id FROM auth.users LIMIT 1));
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', v_ship2, 'TemperatureBreach', '{"temperature":-45,"threshold":-50,"durationMinutes":15}', 4, '2025-06-21T02:00:00Z', (SELECT id FROM auth.users LIMIT 1));
INSERT INTO twin_events (twin_type, twin_id, event_type, payload, sequence, occurred_at, actor_id)
VALUES ('shipment', v_ship2, 'ShipmentDelivered', '{}', 5, '2025-06-22T10:00:00Z', (SELECT id FROM auth.users LIMIT 1));
-- Shipment disputed — no ShipmentAccepted recorded

-- ############################################################################
-- PART 5: TRUST SCORES + TRUST EVENTS
-- ############################################################################

INSERT INTO organization_trust (organization_id, operational_score, regulatory_score, financial_score, technical_score, overall_score, total_fulfillments, successful_fulfillments, incident_count)
VALUES
    (v_sponsor,  0.92, 0.95, 0.98, 0.90, 0.94, 45, 44, 0),
    (v_cro,      0.85, 0.90, 0.82, 0.88, 0.86, 120, 115, 2),
    (v_site,     0.78, 0.92, 0.75, 0.80, 0.81, 230, 220, 3),
    (v_biobank,  0.95, 0.97, 0.90, 0.93, 0.94, 890, 875, 1),
    (v_lab,      0.88, 0.93, 0.85, 0.91, 0.89, 560, 548, 4),
    (v_courier,  0.82, 0.88, 0.90, 0.85, 0.86, 1200, 1150, 12),
    (v_irb,      0.90, 0.98, 0.85, 0.87, 0.90, 340, 340, 0)
ON CONFLICT (organization_id) DO UPDATE SET
    operational_score = EXCLUDED.operational_score,
    regulatory_score = EXCLUDED.regulatory_score,
    financial_score = EXCLUDED.financial_score,
    technical_score = EXCLUDED.technical_score,
    overall_score = EXCLUDED.overall_score,
    total_fulfillments = EXCLUDED.total_fulfillments,
    successful_fulfillments = EXCLUDED.successful_fulfillments,
    incident_count = EXCLUDED.incident_count;

-- Trust events
INSERT INTO trust_events (organization_id, dimension, impact, evidence_ref, source, severity, description, score_before, score_after)
VALUES
    (v_biobank, 'operational', 0.02, 'f-890', 'fulfillment.completed', 'normal', 'Fulfillment #890 completed successfully — 200 FFPE blocks', 0.93, 0.95),
    (v_courier, 'operational', -0.10, 'breach-0620', 'temperature.breach', 'high', 'Temperature breach on shipment GCC-2025-0620-01: -45°C for 15 min', 0.92, 0.82),
    (v_lab, 'operational', 0.01, 'qc-pass-4501', 'qc.passed', 'normal', 'QC passed for batch OBV-NSCLC-047', 0.87, 0.88),
    (v_site, 'regulatory', 0.05, 'irb-renewal-2025', 'accreditation.verified', 'normal', 'IRB approval renewed for oncology protocols', 0.87, 0.92),
    (v_biobank, 'regulatory', -0.08, 'cap-expiry', 'accreditation.expired', 'high', 'CAP accreditation expired — renewal in process', 0.97, 0.89);

-- ############################################################################
-- PART 6: PROVENANCE NODES + EDGES
-- ############################################################################

-- Create provenance nodes for the specimen flow
INSERT INTO provenance_nodes (node_type, external_id, label, organization_id)
VALUES
    ('specimen', v_spec1, 'NSCLC FFPE Block S-001', v_biobank),
    ('specimen', v_spec2::TEXT, 'NSCLC FFPE Block S-002', v_biobank),
    ('specimen', v_spec3::TEXT, 'Plasma Aliquot P-001', v_biobank),
    ('consent', 'consent-objv-001', 'Patient Consent OBV-NSCLC-001', v_site),
    ('processing_event', 'proc-ffpe-001', 'FFPE Sectioning — 5µm slides', v_lab),
    ('qc_result', 'qc-001', 'QC Pass — morphology', v_biobank),
    ('qc_result', 'qc-002', 'QC Fail — tissue fragmentation', v_biobank),
    ('shipment', v_ship1, 'Shipment GCC-2025-0610-01', v_courier),
    ('shipment', v_ship2, 'Shipment GCC-2025-0620-01 (breached)', v_courier),
    ('dataset', 'ds-rnaseq-001', 'RNAseq Dataset — OBV NSCLC cohort', v_lab),
    ('document', 'mta-objv-001', 'MTA — PharmaCorp / National Biobank', v_sponsor)
ON CONFLICT (node_type, external_id) DO NOTHING;

-- Link provenance edges
INSERT INTO provenance_edges (edge_type, source_node_id, target_node_id)
SELECT 'authorized_by', n1.id, n2.id
FROM provenance_nodes n1, provenance_nodes n2
WHERE n1.node_type = 'specimen' AND n1.external_id = v_spec1::TEXT
  AND n2.node_type = 'consent' AND n2.external_id = 'consent-objv-001'
ON CONFLICT DO NOTHING;

INSERT INTO provenance_edges (edge_type, source_node_id, target_node_id)
SELECT 'verified_by', n1.id, n2.id
FROM provenance_nodes n1, provenance_nodes n2
WHERE n1.node_type = 'specimen' AND n1.external_id = v_spec1::TEXT
  AND n2.node_type = 'qc_result' AND n2.external_id = 'qc-001'
ON CONFLICT DO NOTHING;

INSERT INTO provenance_edges (edge_type, source_node_id, target_node_id)
SELECT 'shipped_with', n1.id, n2.id
FROM provenance_nodes n1, provenance_nodes n2
WHERE n1.node_type = 'specimen' AND n1.external_id = v_spec1::TEXT
  AND n2.node_type = 'shipment' AND n2.external_id = v_ship1::TEXT
ON CONFLICT DO NOTHING;

INSERT INTO provenance_edges (edge_type, source_node_id, target_node_id)
SELECT 'derived_from', n1.id, n2.id
FROM provenance_nodes n1, provenance_nodes n2
WHERE n1.node_type = 'dataset' AND n1.external_id = 'ds-rnaseq-001'
  AND n2.node_type = 'specimen' AND n2.external_id = v_spec1::TEXT
ON CONFLICT DO NOTHING;

-- ############################################################################
-- PART 7: POLICY EVALUATIONS
-- ############################################################################

INSERT INTO policy_evaluations (policy_id, context, outcome, matched_rules, trace)
SELECT id, '{"request":{"purpose":"research","consent":{"scope":"oncology"}}}'::jsonb, 'allow', ARRAY['rule-001'],
       '[{"ruleId":"rule-001","condition":{"eq":[{"var":"request.consent.scope"},"oncology"]},"result":true}]'::jsonb
FROM policies WHERE name = 'Oncology Use Only' AND status = 'active' LIMIT 1;

-- ############################################################################
-- PART 8: AUDIT EVENTS
-- ############################################################################

INSERT INTO public.audit_events (action, resource_type, resource_id, organization_id, actor_id, summary)
VALUES
    ('create', 'program', v_prog1, v_sponsor, (SELECT id FROM auth.users LIMIT 1), 'Oncology Biomarker Validation program created'),
    ('submit', 'access_request', v_deal1, v_biobank, (SELECT id FROM auth.users LIMIT 1), 'NSCLC FFPE blocks requested for OBV program'),
    ('create', 'sample', v_spec1, v_biobank, (SELECT id FROM auth.users LIMIT 1), 'FFPE block collected for NSCLC case'),
    ('create', 'other', NULL, v_biobank, (SELECT id FROM auth.users LIMIT 1), 'QC passed — morphology acceptable'),
    ('create', 'other', v_ship1, v_courier, (SELECT id FROM auth.users LIMIT 1), 'Shipment scheduled: National Biobank → Advanced Path Lab'),
    ('other', 'other', v_ship2, v_courier, (SELECT id FROM auth.users LIMIT 1), 'Temperature breach: -45°C for 15 min'),
    ('create', 'other', NULL, v_lab, (SELECT id FROM auth.users LIMIT 1), 'RNAseq dataset generated from OBV NSCLC cohort');

-- ############################################################################
-- PART 9: WORKFLOW INSTANCES
-- ############################################################################

INSERT INTO workflow_instances (definition_id, status, context, current_step_index, organization_id)
SELECT id, 'running', '{"program":"OBV-2024-05","requestType":"specimen_request"}'::jsonb, 2, v_biobank
FROM workflow_definitions WHERE name = 'Specimen Access Request' AND status = 'active' LIMIT 1;

INSERT INTO workflow_instances (definition_id, status, context, current_step_index, organization_id)
SELECT id, 'blocked', '{"program":"OBV-2024-05","requestType":"specimen_request","blockedBy":"export_permit"}'::jsonb, 1, v_biobank
FROM workflow_definitions WHERE name = 'Specimen Access Request' AND status = 'active' LIMIT 1;

-- ############################################################################
-- PART 10: CONFIRMATION
-- ############################################################################

RAISE NOTICE 'Operational seed data loaded: 2 programs, 3 deals, 5 specimens, 2 shipments, trust scores, provenance, audit trail';
END $$;
