-- ============================================================================
-- KADARN v2 — Pilot Seed Data: Vilo Research (feat/kems-site-profile-production)
-- ============================================================================
-- Seed file: pilot_vilo_research.sql
-- Authority: KEMS Site Profile Production, WO-KEMS-DOC-003
-- Idempotent: all INSERTs guarded by ON CONFLICT DO NOTHING
--
-- Seeds a realistic pilot tenant with:
--   - 1 tenant: Vilo Research (extends migration 072 org record)
--   - 2 locations: Houston-01 (main clinic), Austin-02 (satellite lab)
--   - 2 PIs: Dr. Smith (PI at Houston), Dr. Garcia (PI at Austin)
--   - Therapeutic areas: primary care, OB/GYN, endocrinology
--   - Phase I capability declared
--   - Biospecimen collection + sample processing capabilities
--   - Community recruitment + Spanish language support
--   - Selected equipment: centrifuge, -80 freezer, monitoring
--   - Site profile + profile version + publications
--   - Capability instances + activation events
--   - Claims backed by evidence nodes + evidence sources
--
-- NO PHI, NO patient names, NO medical records, NO credentials.
-- All PII-free. Uses stable deterministic UUIDs for traceability.
--
-- Dependencies (all migrations must be applied before this seed):
--   - 008 organizations + capabilities
--   - 045 evidence_core (evidence_nodes, claims)
--   - 063 locations
--   - 065 capabilities
--   - 072 vilo_seed (organizations row for Vilo)
--   - 094 claims_evidence_rag
--   - 095 claims_extended
--   - 096 site_profile_core
--   - 097 evidence_governance
--   - 098 capability_activation_taxonomy
-- ============================================================================

-- ############################################################################
-- PART 1: STABLE UUIDs
-- ############################################################################
-- All seed rows use deterministic UUIDs for cross-environment traceability.
-- UUID prefix: v0000000-0000-0000-0000-xxxxxxxxxxxx where x is a counter.

-- Organization (already seeded by migration 072, but idempotent)
-- e0000000-0000-0000-0000-000000000001 = Vilo Research Group

-- Locations
-- v0000000-0000-0000-0000-000000000001 = Houston-01
-- v0000000-0000-0000-0000-000000000002 = Austin-02

-- People (PI records in some future people table — for now, expressed via
-- claims and profile data as structured facts, not PII)
-- PIs referenced by stable surrogate UUIDs:
-- p0000000-0000-0000-0000-000000000001 = Dr. Smith
-- p0000000-0000-0000-0000-000000000002 = Dr. Garcia

-- Site Profile
-- f0000000-0000-0000-0000-000000000001 = Vilo Research site profile

-- Capability Instances
-- a0000000-0000-0000-0000-000000000001 = biospecimen_collection
-- a0000000-0000-0000-0000-000000000002 = sample_processing
-- a0000000-0000-0000-0000-000000000003 = community_recruitment
-- a0000000-0000-0000-0000-000000000004 = spanish_language_capability
-- a0000000-0000-0000-0000-000000000005 = phase_i_capability

-- Claims
-- c0000000-0000-0000-0000-000000000001 through c0000000-...-000000000010

-- Evidence Nodes
-- d0000000-0000-0000-0000-000000000001 through d0000000-...-000000000012

-- ############################################################################
-- PART 2: LOCATIONS
-- ############################################################################

INSERT INTO public.locations (id, name, location_type, institution_id,
    address_line1, city, state_province, postal_code, country,
    phone, timezone, status)
VALUES
    ('v0000000-0000-0000-0000-000000000001',
     'Houston-01',
     'phase1_unit',
     'e0000000-0000-0000-0000-000000000001',
     '1200 Research Forest Drive',
     'Houston',
     'TX',
     '77380',
     'US',
     '+1-555-0101',
     'America/Chicago',
     'active'),

    ('v0000000-0000-0000-0000-000000000002',
     'Austin-02',
     'laboratory',
     'e0000000-0000-0000-0000-000000000001',
     '4500 Southwest Parkway',
     'Austin',
     'TX',
     '78735',
     'US',
     '+1-555-0102',
     'America/Chicago',
     'active')
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 3: SITE PROFILE
-- ############################################################################

INSERT INTO public.site_profiles (id, institution_id, profile_type, state,
    current_version, completion_data)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'clinical_research_site',
    'PUBLISHED',
    1,
    '{
      "identity_completeness": 1.0,
      "people_completeness": 0.85,
      "location_completeness": 1.0,
      "structured_data_completeness": 0.9,
      "claim_completeness": 0.8,
      "evidence_coverage": 0.75,
      "evidence_currency": 1.0,
      "attestation_completeness": 1.0,
      "review_completeness": 1.0,
      "therapeutic_areas": ["primary_care", "ob_gyn", "endocrinology"],
      "research_focus": ["Phase I"],
      "languages": ["English", "Spanish"],
      "institution_type": "Independent Research Site",
      "dba_name": "Vilo Research",
      "website": "https://viloresearch.com",
      "research_modalities": ["Drug Trials", "Device Studies"],
      "equipment": [
        {"name": "Centrifuge", "model": "Sorvall ST 40R", "qty": 2},
        {"name": "-80°C Freezer", "model": "Thermo Scientific TSU Series", "qty": 3},
        {"name": "Temperature Monitoring System", "model": "Rees Centron Z2", "qty": 1}
      ]
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 4: SITE PROFILE VERSION (v1 — published snapshot)
-- ############################################################################

INSERT INTO public.site_profile_versions (id, profile_id, version,
    snapshot, published_at)
VALUES (
    'f0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000001',
    1,
    '{
      "profile_type": "clinical_research_site",
      "institution_name": "Vilo Research Group",
      "therapeutic_areas": ["primary_care", "ob_gyn", "endocrinology"],
      "research_focus": ["Phase I"],
      "languages": ["English", "Spanish"],
      "locations": [
        {"code": "Houston-01", "type": "phase1_unit", "city": "Houston", "state": "TX"},
        {"code": "Austin-02", "type": "laboratory", "city": "Austin", "state": "TX"}
      ],
      "principal_investigators": [
        {"name": "Dr. Smith", "location": "Houston-01", "therapeutic_areas": ["primary_care", "endocrinology"]},
        {"name": "Dr. Garcia", "location": "Austin-02", "therapeutic_areas": ["ob_gyn", "primary_care"]}
      ],
      "capabilities": [
        "biospecimen_collection",
        "sample_processing",
        "community_recruitment",
        "spanish_language_capability",
        "phase_i_capability"
      ],
      "equipment": [
        {"name": "Centrifuge", "model": "Sorvall ST 40R", "qty": 2},
        {"name": "-80°C Freezer", "model": "Thermo Scientific TSU Series", "qty": 3},
        {"name": "Temperature Monitoring System", "model": "Rees Centron Z2", "qty": 1}
      ]
    }'::jsonb,
    '2026-07-15T14:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 5: PROFILE ATTESTATION (authorized representative)
-- ############################################################################

INSERT INTO public.profile_attestations (id, profile_id, version_id,
    attested_by, attested_by_role, scope, attestation_text_version)
VALUES (
    'f0000000-0000-0000-0000-000000000003',
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authorized_representative',
    '{"sections": ["identity", "locations", "capabilities", "equipment"]}'::jsonb,
    'v1.0.0'
)
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 6: PROFILE PUBLICATION
-- ############################################################################

INSERT INTO public.profile_publications (id, profile_id, version_id,
    published_by, visibility_level, passport_hash)
VALUES (
    'f0000000-0000-0000-0000-000000000004',
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'NETWORK_VISIBLE',
    'sha256:vilo-research-passport-v1-placeholder'
)
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 7: CAPABILITY INSTANCES
-- ############################################################################

INSERT INTO public.capability_instances (id, profile_id, capability_code,
    entity_type, entity_id, state, readiness_contribution, activated_at)
VALUES
    -- Biospecimen Collection (Houston-01)
    ('a0000000-0000-0000-0000-000000000001',
     'f0000000-0000-0000-0000-000000000001',
     'biospecimen_collection',
     'location',
     'v0000000-0000-0000-0000-000000000001',
     'ACTIVATED',
     0.85,
     '2026-07-01T10:00:00Z'),

    -- Sample Processing (both locations)
    ('a0000000-0000-0000-0000-000000000002',
     'f0000000-0000-0000-0000-000000000001',
     'sample_processing',
     'location',
     'v0000000-0000-0000-0000-000000000001',
     'ACTIVATED',
     0.80,
     '2026-07-02T10:00:00Z'),

    -- Community Recruitment (Houston-01)
    ('a0000000-0000-0000-0000-000000000003',
     'f0000000-0000-0000-0000-000000000001',
     'community_recruitment',
     'location',
     'v0000000-0000-0000-0000-000000000001',
     'ACTIVATED',
     0.70,
     '2026-07-03T10:00:00Z'),

    -- Spanish Language Capability (both locations)
    ('a0000000-0000-0000-0000-000000000004',
     'f0000000-0000-0000-0000-000000000001',
     'spanish_language_capability',
     NULL,
     NULL,
     'ACTIVATED',
     0.60,
     '2026-07-04T10:00:00Z'),

    -- Phase I Capability
    ('a0000000-0000-0000-0000-000000000005',
     'f0000000-0000-0000-0000-000000000001',
     'phase_i_capability',
     NULL,
     NULL,
     'ACTIVATED',
     0.95,
     '2026-07-05T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 8: CAPABILITY ACTIVATION EVENTS (audit trail)
-- ############################################################################

INSERT INTO public.capability_activation_events (id, capability_id,
    from_state, to_state, triggered_by, event_data, occurred_at)
VALUES
    ('a0000000-0000-0000-0000-000000000010',
     'a0000000-0000-0000-0000-000000000001',
     'DECLARED', 'DOCUMENTING', 'manual_declaration',
     '{"actor": "site_administrator"}'::jsonb,
     '2026-06-15T09:00:00Z'),

    ('a0000000-0000-0000-0000-000000000011',
     'a0000000-0000-0000-0000-000000000001',
     'DOCUMENTING', 'VERIFIED', 'dependency_resolved',
     '{"actor": "authorized_representative", "evidence_count": 3}'::jsonb,
     '2026-07-01T10:00:00Z'),

    ('a0000000-0000-0000-0000-000000000012',
     'a0000000-0000-0000-0000-000000000001',
     'VERIFIED', 'ACTIVATED', 'manual_review',
     '{"actor": "authorized_representative"}'::jsonb,
     '2026-07-01T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 9: CLAIMS — Structured facts about Vilo Research
-- ############################################################################
-- All claims are institution-scoped. No PHI, no patient names, no credentials.

INSERT INTO public.claims (id, institution_id, claim_hash,
    question_text, answer_value, answer_type, category,
    confidence_level, confidence_score, evidence_count, version,
    valid_from, valid_until)
VALUES
    -- Claim 1: Biospecimen collection capability exists
    ('c0000000-0000-0000-0000-000000000001',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:biospecimen-collection-capability-v1',
     'Does the site have biospecimen collection capability?',
     'Yes — site maintains certified phlebotomy and biospecimen collection services at Houston-01.',
     'text',
     'infrastructure',
     'verified',
     0.95, 3, 1,
     '2026-06-01T00:00:00Z', '2027-06-01T00:00:00Z'),

    -- Claim 2: Sample processing lab
    ('c0000000-0000-0000-0000-000000000002',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:sample-processing-lab-v1',
     'Does the site have a sample processing laboratory?',
     'Yes — CLIA-waived processing lab at Houston-01 with centrifuge, -80°C storage, and temperature monitoring.',
     'text',
     'infrastructure',
     'verified',
     0.90, 2, 1,
     '2026-06-02T00:00:00Z', '2027-06-02T00:00:00Z'),

    -- Claim 3: Phase I capability
    ('c0000000-0000-0000-0000-000000000003',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:phase-i-capability-v1',
     'Is the site capable of conducting Phase I clinical trials?',
     'Yes — Houston-01 is a dedicated Phase I unit with overnight monitoring capability.',
     'text',
     'infrastructure',
     'verified',
     0.92, 2, 1,
     '2026-06-03T00:00:00Z', '2027-06-03T00:00:00Z'),

    -- Claim 4: Therapeutic area — primary care
    ('c0000000-0000-0000-0000-000000000004',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:therapeutic-primary-care-v1',
     'What therapeutic areas does the site cover?',
     'Primary Care — general adult medicine, preventive care, chronic disease management.',
     'text',
     'identity',
     'verified',
     0.85, 1, 1,
     '2026-06-04T00:00:00Z', '2027-06-04T00:00:00Z'),

    -- Claim 5: Therapeutic area — OB/GYN
    ('c0000000-0000-0000-0000-000000000005',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:therapeutic-obgyn-v1',
     'What therapeutic areas does the site cover?',
     'OB/GYN — women''s health, prenatal care, gynecological conditions.',
     'text',
     'identity',
     'verified',
     0.85, 1, 1,
     '2026-06-04T00:00:00Z', '2027-06-04T00:00:00Z'),

    -- Claim 6: Therapeutic area — endocrinology
    ('c0000000-0000-0000-0000-000000000006',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:therapeutic-endocrinology-v1',
     'What therapeutic areas does the site cover?',
     'Endocrinology — diabetes, thyroid disorders, metabolic conditions.',
     'text',
     'identity',
     'verified',
     0.85, 1, 1,
     '2026-06-04T00:00:00Z', '2027-06-04T00:00:00Z'),

    -- Claim 7: Community recruitment capability
    ('c0000000-0000-0000-0000-000000000007',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:community-recruitment-v1',
     'Does the site have community-based participant recruitment capability?',
     'Yes — established community outreach program with local clinics and health fairs.',
     'text',
     'experience',
     'verified',
     0.75, 1, 1,
     '2026-06-05T00:00:00Z', '2027-06-05T00:00:00Z'),

    -- Claim 8: Spanish language support
    ('c0000000-0000-0000-0000-000000000008',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:spanish-language-v1',
     'Does the site provide Spanish language support?',
     'Yes — bilingual staff (English/Spanish) available at both locations. Informed consent forms available in Spanish.',
     'text',
     'experience',
     'verified',
     0.80, 1, 1,
     '2026-06-06T00:00:00Z', '2027-06-06T00:00:00Z'),

    -- Claim 9: Equipment — centrifuge
    ('c0000000-0000-0000-0000-000000000009',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:equipment-centrifuge-v1',
     'Does the site have a refrigerated centrifuge?',
     'Yes — Sorvall ST 40R refrigerated centrifuge (2 units) with maintenance logs current.',
     'text',
     'infrastructure',
     'verified',
     0.90, 1, 1,
     '2026-06-07T00:00:00Z', '2027-06-07T00:00:00Z'),

    -- Claim 10: Equipment — -80°C freezer
    ('c0000000-0000-0000-0000-000000000010',
     'e0000000-0000-0000-0000-000000000001',
     'sha256:equipment-freezer-v1',
     'Does the site have -80°C freezer storage?',
     'Yes — Thermo Scientific TSU Series -80°C freezers (3 units) with 24/7 temperature monitoring.',
     'text',
     'infrastructure',
     'verified',
     0.92, 1, 1,
     '2026-06-08T00:00:00Z', '2027-06-08T00:00:00Z')
ON CONFLICT (institution_id, claim_hash, version) DO NOTHING;

-- ############################################################################
-- PART 10: CLAIMS EXTENSION (network-governance metadata)
-- ############################################################################

INSERT INTO public.claims_ext (claim_id, entity_type, entity_id,
    location_id, statement, claim_type, canonical_claim_code,
    visibility, review_due_at)
VALUES
    ('c0000000-0000-0000-0000-000000000001',
     'location', 'v0000000-0000-0000-0000-000000000001',
     'v0000000-0000-0000-0000-000000000001',
     'Vilo Research maintains certified biospecimen collection services at Houston-01.',
     'SELF_DECLARED', 'biospecimen_collection',
     'NETWORK_VISIBLE', '2027-06-01T00:00:00Z'),

    ('c0000000-0000-0000-0000-000000000002',
     'location', 'v0000000-0000-0000-0000-000000000001',
     'v0000000-0000-0000-0000-000000000001',
     'CLIA-waived processing lab with centrifuge, -80°C storage, and temperature monitoring.',
     'SELF_DECLARED', 'sample_processing',
     'NETWORK_VISIBLE', '2027-06-02T00:00:00Z'),

    ('c0000000-0000-0000-0000-000000000003',
     'institution', 'e0000000-0000-0000-0000-000000000001',
     'v0000000-0000-0000-0000-000000000001',
     'Vilo Research operates a dedicated Phase I unit with overnight monitoring.',
     'SELF_DECLARED', 'phase_i_capability',
     'NETWORK_VISIBLE', '2027-06-03T00:00:00Z'),

    ('c0000000-0000-0000-0000-000000000007',
     'institution', 'e0000000-0000-0000-0000-000000000001',
     'v0000000-0000-0000-0000-000000000001',
     'Community outreach program with local clinics and health fairs.',
     'SELF_DECLARED', 'community_recruitment',
     'NETWORK_VISIBLE', '2027-06-05T00:00:00Z'),

    ('c0000000-0000-0000-0000-000000000008',
     'institution', 'e0000000-0000-0000-0000-000000000001',
     NULL,
     'Bilingual staff and Spanish-language informed consent forms available at both locations.',
     'SELF_DECLARED', 'spanish_language_capability',
     'NETWORK_VISIBLE', '2027-06-06T00:00:00Z')
ON CONFLICT (claim_id) DO NOTHING;

-- ############################################################################
-- PART 11: EVIDENCE SOURCES (documents backing claims)
-- ############################################################################

INSERT INTO public.evidence_sources (id, institution_id, source_type,
    label, description, file_name, file_type, file_size,
    processing_status)
VALUES
    -- Lab certification
    ('d0000000-0000-0000-0000-000000000001',
     'e0000000-0000-0000-0000-000000000001',
     'document_upload',
     'CLIA Certificate — Houston-01 Lab',
     'CLIA Certificate of Waiver for Houston-01 processing laboratory.',
     'clia_certificate_houston01.pdf',
     'application/pdf',
     245760,
     'completed'),

    -- Equipment calibration log
    ('d0000000-0000-0000-0000-000000000002',
     'e0000000-0000-0000-0000-000000000001',
     'document_upload',
     'Centrifuge Calibration Log',
     'Annual calibration and preventive maintenance log for Sorvall ST 40R centrifuges.',
     'centrifuge_calibration_2026.pdf',
     'application/pdf',
     122880,
     'completed'),

    -- Freezer temperature log
    ('d0000000-0000-0000-0000-000000000003',
     'e0000000-0000-0000-0000-000000000001',
     'document_upload',
     '-80°C Freezer Temperature Log',
     '30-day continuous temperature monitoring report for all -80°C freezers.',
     'freezer_temp_log_jun2026.pdf',
     'application/pdf',
     368640,
     'completed'),

    -- Phase I unit documentation
    ('d0000000-0000-0000-0000-000000000004',
     'e0000000-0000-0000-0000-000000000001',
     'document_upload',
     'Phase I Unit Capability Statement',
     'Documentation of Phase I unit capabilities including bed capacity, monitoring equipment, and emergency protocols.',
     'phase1_capability_statement.pdf',
     'application/pdf',
     204800,
     'completed'),

    -- Community outreach program description
    ('d0000000-0000-0000-0000-000000000005',
     'e0000000-0000-0000-0000-000000000001',
     'manual_entry',
     'Community Outreach Program Description',
     'Description of community outreach program, partner clinics, and recruitment methods.',
     'community_outreach_program.txt',
     'text/plain',
     4096,
     'completed'),

    -- Spanish language materials sample
    ('d0000000-0000-0000-0000-000000000006',
     'e0000000-0000-0000-0000-000000000001',
     'document_upload',
     'Spanish ICF Template',
     'Sample informed consent form template in Spanish language.',
     'icf_template_es.pdf',
     'application/pdf',
     98304,
     'completed')
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 12: EVIDENCE NODES (immutable evidence backing claims)
-- ############################################################################

INSERT INTO public.evidence_nodes (id, claim_id, evidence_class,
    content, source, node_date, status, weight,
    provenance, visibility, is_counter_evidence)
VALUES
    -- Evidence for Claim 1 (biospecimen collection)
    ('d0000000-0000-0000-0000-000000000007',
     'c0000000-0000-0000-0000-000000000001',
     'A',
     'CLIA Certificate of Waiver for Houston-01 processing laboratory, valid through 2027. Issued by CMS. Certificate number on file.',
     'clia_certificate_houston01.pdf',
     '2026-01-15',
     'active',
     0.95,
     '{"generated_by": "document_upload", "source_id": "d0000000-0000-0000-0000-000000000001"}'::jsonb,
     '{"scope": "network_visible"}'::jsonb,
     false),

    -- Evidence for Claim 1 (protocol documentation)
    ('d0000000-0000-0000-0000-000000000008',
     'c0000000-0000-0000-0000-000000000001',
     'B',
     'Standard Operating Procedure for biospecimen collection, processing, and storage. SOP-BC-001 v2.1, last reviewed 2026-03.',
     'internal_sop_repository',
     '2026-03-10',
     'active',
     0.85,
     '{"generated_by": "manual_entry", "reviewer": "lab_director"}'::jsonb,
     '{"scope": "network_visible"}'::jsonb,
     false),

    -- Evidence for Claim 2 (sample processing lab)
    ('d0000000-0000-0000-0000-000000000009',
     'c0000000-0000-0000-0000-000000000002',
     'A',
     'Centrifuge Calibration Log — Sorvall ST 40R SN:ST40R-2023-001 and SN:ST40R-2023-002. Annual calibration completed 2026-02-15. All parameters within specification.',
     'centrifuge_calibration_2026.pdf',
     '2026-02-15',
     'active',
     0.90,
     '{"generated_by": "document_upload", "source_id": "d0000000-0000-0000-0000-000000000002"}'::jsonb,
     '{"scope": "network_visible"}'::jsonb,
     false),

    -- Evidence for Claim 2 (freezer log)
    ('d0000000-0000-0000-0000-000000000010',
     'c0000000-0000-0000-0000-000000000002',
     'B',
     '30-day temperature log for -80°C freezers (SN:TSX-2023-001, TSX-2023-002, TSX-2023-003). All readings within -80°C ± 5°C. No excursions.',
     'freezer_temp_log_jun2026.pdf',
     '2026-06-01',
     'active',
     0.85,
     '{"generated_by": "document_upload", "source_id": "d0000000-0000-0000-0000-000000000003"}'::jsonb,
     '{"scope": "network_visible"}'::jsonb,
     false),

    -- Evidence for Claim 3 (Phase I capability)
    ('d0000000-0000-0000-0000-000000000011',
     'c0000000-0000-0000-0000-000000000003',
     'A',
     'Phase I Unit Capability Statement: 6-bed dedicated Phase I unit with 24/7 nurse staffing, cardiac monitoring, emergency crash cart, and negative pressure isolation room.',
     'phase1_capability_statement.pdf',
     '2026-05-20',
     'active',
     0.90,
     '{"generated_by": "document_upload", "source_id": "d0000000-0000-0000-0000-000000000004"}'::jsonb,
     '{"scope": "network_visible"}'::jsonb,
     false),

    -- Evidence for Claim 7 (community recruitment)
    ('d0000000-0000-0000-0000-000000000012',
     'c0000000-0000-0000-0000-000000000007',
     'C',
     'Community outreach program: partnerships with 4 local clinics, quarterly health fairs, patient navigator program. Active community advisory board.',
     'community_outreach_program.txt',
     '2026-04-01',
     'active',
     0.70,
     '{"generated_by": "manual_entry", "source_id": "d0000000-0000-0000-0000-000000000005"}'::jsonb,
     '{"scope": "network_visible"}'::jsonb,
     false),

    -- Evidence for Claim 8 (Spanish language)
    ('d0000000-0000-0000-0000-000000000013',
     'c0000000-0000-0000-0000-000000000008',
     'B',
     'Spanish-language ICF template reviewed and approved by IRB. Bilingual staff roster: 3 Spanish-speaking coordinators, 1 Spanish-speaking PI (Dr. Garcia).',
     'icf_template_es.pdf',
     '2026-03-15',
     'active',
     0.80,
     '{"generated_by": "document_upload", "source_id": "d0000000-0000-0000-0000-000000000006"}'::jsonb,
     '{"scope": "network_visible"}'::jsonb,
     false),

    -- Evidence for Claim 9 (centrifuge)
    ('d0000000-0000-0000-0000-000000000014',
     'c0000000-0000-0000-0000-000000000009',
     'A',
     'Sorvall ST 40R refrigerated centrifuge — 2 units operational. Maintenance logs current. Last preventive maintenance: 2026-02-15.',
     'centrifuge_calibration_2026.pdf',
     '2026-02-15',
     'active',
     0.90,
     '{"generated_by": "document_export", "derived_from": "d0000000-0000-0000-0000-000000000009"}'::jsonb,
     '{"scope": "network_visible"}'::jsonb,
     false),

    -- Evidence for Claim 10 (-80 freezer)
    ('d0000000-0000-0000-0000-000000000015',
     'c0000000-0000-0000-0000-000000000010',
     'A',
     'Thermo Scientific TSU Series -80°C freezers — 3 units operational with 24/7 Rees Centron Z2 temperature monitoring. All within specification.',
     'freezer_temp_log_jun2026.pdf',
     '2026-06-01',
     'active',
     0.92,
     '{"generated_by": "document_export", "derived_from": "d0000000-0000-0000-0000-000000000010"}'::jsonb,
     '{"scope": "network_visible"}'::jsonb,
     false)
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 13: CLAIM EVIDENCE LINKS
-- ############################################################################

INSERT INTO public.claim_evidence_links (claim_id, source_id,
    relationship_type, weight, evidence_class, support_type)
VALUES
    -- Claim 1 links
    ('c0000000-0000-0000-0000-000000000001',
     'd0000000-0000-0000-0000-000000000001',
     'supports', 0.95, 'A', 'DIRECT'),
    ('c0000000-0000-0000-0000-000000000001',
     NULL,
     'supports', 0.85, 'B', 'DIRECT'),

    -- Claim 2 links
    ('c0000000-0000-0000-0000-000000000002',
     'd0000000-0000-0000-0000-000000000002',
     'supports', 0.90, 'A', 'DIRECT'),
    ('c0000000-0000-0000-0000-000000000002',
     'd0000000-0000-0000-0000-000000000003',
     'corroborates', 0.85, 'B', 'DIRECT'),

    -- Claim 3 links
    ('c0000000-0000-0000-0000-000000000003',
     'd0000000-0000-0000-0000-000000000004',
     'supports', 0.90, 'A', 'DIRECT'),

    -- Claim 7 links
    ('c0000000-0000-0000-0000-000000000007',
     'd0000000-0000-0000-0000-000000000005',
     'supports', 0.70, 'C', 'DIRECT'),

    -- Claim 8 links
    ('c0000000-0000-0000-0000-000000000008',
     'd0000000-0000-0000-0000-000000000006',
     'supports', 0.80, 'B', 'DIRECT'),

    -- Claim 9 links
    ('c0000000-0000-0000-0000-000000000009',
     'd0000000-0000-0000-0000-000000000002',
     'supports', 0.90, 'A', 'DIRECT'),

    -- Claim 10 links
    ('c0000000-0000-0000-0000-000000000010',
     'd0000000-0000-0000-0000-000000000003',
     'supports', 0.92, 'A', 'DIRECT')
ON CONFLICT DO NOTHING;

-- ############################################################################
-- PART 14: CAPABILITY CLAIM LINKS (dependency mapping)
-- ############################################################################

INSERT INTO public.capability_claim_links (capability_id, claim_id,
    dependency_type, is_critical, weight)
VALUES
    -- Biospecimen collection depends on claim 1
    ('a0000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     'ALL_REQUIRED', true, 1.00),

    -- Sample processing depends on claim 2
    ('a0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000002',
     'ALL_REQUIRED', true, 1.00),

    -- Phase I depends on claim 3
    ('a0000000-0000-0000-0000-000000000005',
     'c0000000-0000-0000-0000-000000000003',
     'ALL_REQUIRED', true, 1.00),

    -- Community recruitment depends on claim 7
    ('a0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000007',
     'ALL_REQUIRED', false, 1.00),

    -- Spanish language depends on claim 8
    ('a0000000-0000-0000-0000-000000000004',
     'c0000000-0000-0000-0000-000000000008',
     'ALL_REQUIRED', false, 1.00)
ON CONFLICT (capability_id, claim_id) DO NOTHING;

-- ############################################################################
-- PART 15: CAPABILITY DEPENDENCY STATUS (resolved)
-- ############################################################################

INSERT INTO public.capability_dependency_status (capability_id,
    dependency_claim_id, status, evaluated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     'SATISFIED', '2026-07-01T10:00:00Z'),

    ('a0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000002',
     'SATISFIED', '2026-07-02T10:00:00Z'),

    ('a0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000007',
     'SATISFIED', '2026-07-03T10:00:00Z'),

    ('a0000000-0000-0000-0000-000000000004',
     'c0000000-0000-0000-0000-000000000008',
     'SATISFIED', '2026-07-04T10:00:00Z'),

    ('a0000000-0000-0000-0000-000000000005',
     'c0000000-0000-0000-0000-000000000003',
     'SATISFIED', '2026-07-05T10:00:00Z')
ON CONFLICT (capability_id, dependency_claim_id) DO NOTHING;

-- ============================================================================
-- END OF SEED FILE
-- ============================================================================
