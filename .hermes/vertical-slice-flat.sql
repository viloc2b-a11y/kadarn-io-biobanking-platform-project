-- ═══════════════════════════════════════════════════════════════════
-- KAD-LOOP-005 — Persisted Vertical Slice (single-statement version)
-- ═══════════════════════════════════════════════════════════════════

-- Clean previous run (individual statements)
DELETE FROM passport_shares
WHERE created_at > '2026-07-26'
;

DELETE FROM passport_entries
WHERE created_at > '2026-07-26'
;

DELETE FROM confidence_assessments
WHERE created_at > '2026-07-26'
;

DELETE FROM review_tasks
WHERE created_at > '2026-07-26'
;

DELETE FROM evidence_nodes
WHERE created_at > '2026-07-26'
;

DELETE FROM claim_versions
WHERE created_at > '2026-07-26'
;

DELETE FROM claims
WHERE created_at > '2026-07-26'
;

DELETE FROM source_records
WHERE created_at > '2026-07-26'
;

DELETE FROM institutional_events
WHERE created_at > '2026-07-26'
;

DELETE FROM capabilities
WHERE created_at > '2026-07-26'
;

DELETE FROM institutions
WHERE name = 'Test Institution VS'
  AND created_at > '2026-07-26'
;

DELETE FROM organizations
WHERE name = 'Test Sponsor VS'
  AND created_at > '2026-07-26'
;

-- Seed: tenant organization
INSERT INTO organizations (id, name, slug, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Sponsor VS', 'test-sponsor-vs', now())
ON CONFLICT (id) DO NOTHING
;

-- Seed: institution
INSERT INTO institutions (id, name, organization_id, created_at)
VALUES ('00000000-0000-0000-0000-000000000010', 'Test Institution VS', '00000000-0000-0000-0000-000000000001', now())
ON CONFLICT (id) DO NOTHING
;

-- Seed: institutional event
INSERT INTO institutional_events (id, organization_id, event_type, event_version, occurred_at, recorded_at, actor_type, payload, idempotency_key, tenant_id)
VALUES ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'accreditation_milestone', 1, now() - interval '30 days', now(), 'system', '{"milestone":"initial_accreditation","body":"FDA"}', 'inkey-vslice-001', '00000000-0000-0000-0000-000000000001')
;

-- Seed: source record
INSERT INTO source_records (id, evidence_source_id, institution_id, record_type, source_version, acquired_at, content_hash, locator_uri, acquisition_status, created_at)
VALUES ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000010', 'accreditation_certificate', '1.0', now() - interval '28 days', 'sha256-abc-certificate-001', 'https://registry.example.com/cert/001', 'acquired', now())
;

-- Seed: claim
INSERT INTO claims (id, claim_type_id, name, description, organization_id, status, domain, decays, decay_period_months, valid_evidence_classes, required_evidence_classes, created_by_actor_id, created_by_org_id, correlation_id, owning_org_id, visibility_scope, authorized_sponsor_ids, created_at, updated_at, workflow_state, priority, version, lifecycle_status, review_status)
VALUES ('00000000-0000-0000-0000-000000000400', 'capability_declaration', 'FDA Accreditation Active', 'The institution holds a valid FDA accreditation for clinical trial operations.', '00000000-0000-0000-0000-000000000001', 'verified', 'clinical_ops', false, NULL, ARRAY['certification_document'], ARRAY['certification_document'], '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'organization_sponsors', ARRAY['00000000-0000-0000-0000-000000000001'], now(), now(), 'approved', 1, 3, 'active', 'approved')
;

-- Seed: evidence node
INSERT INTO evidence_nodes (id, claim_id, evidence_class, content, source, node_date, status, weight, provenance, visibility, created_at, updated_at, is_counter_evidence, has_response, source_record_id, lifecycle_status)
VALUES ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000400', 'certification_document', 'FDA accreditation certificate #CERT-001 issued to Test Institution VS.', 'system://registry.example.com', CURRENT_DATE, 'verified', 1.0, '{"origin":"SourceRecord e2","process":"auto_ingest"}', '{"visibility":"internal"}', now(), now(), false, false, '00000000-0000-0000-0000-000000000200', 'accepted')
;

-- Seed: review task
INSERT INTO review_tasks (id, organization_id, claim_id, evidence_node_id, task_type, status, assigned_to, created_at, created_by, decision, reviewer_notes, review_outcome, reviewer_id)
VALUES ('00000000-0000-0000-0000-000000000500', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000300', 'evidence_review', 'completed', '00000000-0000-0000-0000-000000000001', now(), '00000000-0000-0000-0000-000000000001', 'approved', 'FDA certificate verified against registry. Match confirmed.', 'approved', '00000000-0000-0000-0000-000000000001')
;

-- Seed: claim version
INSERT INTO claim_versions (id, claim_id, version, claim_type_id, name, description, organization_id, workflow_state, lifecycle_status, review_status, evidence_count, created_by_actor_id, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000600', '00000000-0000-0000-0000-000000000400', 3, 'capability_declaration', 'FDA Accreditation Active', 'The institution holds a valid FDA accreditation for clinical trial operations.', '00000000-0000-0000-0000-000000000001', 'approved', 'active', 'approved', 1, '00000000-0000-0000-0000-000000000001', now(), now())
;

-- Seed: capability
INSERT INTO capabilities (id, name, description, organization_id, status, first_declared_at, created_at, updated_at, primary_claim_id)
VALUES ('00000000-0000-0000-0000-000000000700', 'FDA-Regulated Trial Operations', 'Capability to conduct FDA-regulated clinical trials with valid accreditation.', '00000000-0000-0000-0000-000000000001', 'verified', now() - interval '30 days', now(), now(), '00000000-0000-0000-0000-000000000400')
;

-- Seed: confidence assessment 1 (before update)
INSERT INTO confidence_assessments (id, tenant_id, institution_id, capability_id, confidence_model_id, model_version, score, confidence_band, readiness_state, assessment_status, calculated_at, explanation_summary, input_snapshot_hash, output_hash, created_by, created_at)
VALUES ('00000000-0000-0000-0000-000000000800', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000700', '00000000-0000-0000-0000-000000000001', 3, 0.92, 'VERY_HIGH', 'ready', 'completed', now(), 'FDA accreditation verified. All evidence gates passed.', 'sha256-input-v1', 'sha256-output-v1', '00000000-0000-0000-0000-000000000001', now())
;

-- ═══════ SNAPSHOT 1 ═══════
INSERT INTO passport_entries (id, organization_id, claim_id, publication_status, visibility_scope, authorized_sponsor_ids, title, version, status, created_by, created_at, updated_at, capability_id, confidence_assessment_id, input_snapshot_hash, output_hash, policy_version)
VALUES ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000400', 'published', 'organization_sponsors', ARRAY['00000000-0000-0000-0000-000000000001'], 'FDA Accreditation Snapshot v1', 1, 'published', '00000000-0000-0000-0000-000000000001', now(), now(), '00000000-0000-0000-0000-000000000700', '00000000-0000-0000-0000-000000000800', 'sha256-canonical-input-v1', 'sha256-canonical-output-v1', 1)
;

-- ═══════ SHARE GRANT for Snapshot 1 ═══════
INSERT INTO passport_shares (id, passport_entry_id, sponsor_organization_id, granted_at, granted_by, expires_at, access_level, permissions, access_token, created_at, updated_at, snapshot_id)
VALUES ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000001', now(), '00000000-0000-0000-0000-000000000001', now() + interval '90 days', 'read_only', '{"view_passport": true}', encode(sha256('grant-token-plaintext-vslice-001'::bytea), 'hex')::uuid, now(), now(), '00000000-0000-0000-0000-000000000901')
;

-- ═══════ MODIFY UPSTREAM: supersede evidence ═══════
UPDATE evidence_nodes
SET status = 'superseded', updated_at = now(), lifecycle_status = 'archived'
WHERE id = '00000000-0000-0000-0000-000000000300'
;

-- ═══════ INSERT new evidence ═══════
INSERT INTO evidence_nodes (id, claim_id, evidence_class, content, source, node_date, status, weight, provenance, visibility, created_at, updated_at, is_counter_evidence, has_response, source_record_id, lifecycle_status)
VALUES ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000400', 'certification_document', 'FDA accreditation certificate #CERT-002 (renewal) issued to Test Institution VS.', 'system://registry.example.com', CURRENT_DATE, 'verified', 1.0, '{"origin":"SourceRecord e2","process":"auto_ingest","supersedes":"00000000-0000-0000-0000-000000000300"}', '{"visibility":"internal"}', now(), now(), false, false, '00000000-0000-0000-0000-000000000200', 'accepted')
;

-- ═══════ NEW confidence assessment (after evidence change) ═══════
INSERT INTO confidence_assessments (id, tenant_id, institution_id, capability_id, confidence_model_id, model_version, score, confidence_band, readiness_state, assessment_status, calculated_at, explanation_summary, input_snapshot_hash, output_hash, supersedes_assessment_id, created_by, created_at)
VALUES ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000700', '00000000-0000-0000-0000-000000000001', 3, 0.95, 'VERY_HIGH', 'ready', 'completed', now(), 'FDA accreditation renewed. Updated evidence #CERT-002. Confidence improved.', 'sha256-input-v2', 'sha256-output-v2', '00000000-0000-0000-0000-000000000800', '00000000-0000-0000-0000-000000000001', now())
;

-- ═══════ SNAPSHOT 2 — NEW INSERT, version 2 ═══════
INSERT INTO passport_entries (id, organization_id, claim_id, publication_status, visibility_scope, authorized_sponsor_ids, title, version, status, created_by, created_at, updated_at, capability_id, confidence_assessment_id, input_snapshot_hash, output_hash, policy_version)
VALUES ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000400', 'published', 'organization_sponsors', ARRAY['00000000-0000-0000-0000-000000000001'], 'FDA Accreditation Snapshot v2', 2, 'published', '00000000-0000-0000-0000-000000000001', now(), now(), '00000000-0000-0000-0000-000000000700', '00000000-0000-0000-0000-000000000801', 'sha256-canonical-input-v2', 'sha256-canonical-output-v2', 1)
;

-- ═══════ Link Snapshot 1 to Snapshot 2 as superseded ═══════
UPDATE passport_entries
SET superseded_by = '00000000-0000-0000-0000-000000000902',
    supersession_reason = 'Evidence renewed: CERT-001->CERT-002',
    updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000901'
;

-- ═══════ SHARE GRANT for Snapshot 2 ═══════
INSERT INTO passport_shares (id, passport_entry_id, sponsor_organization_id, granted_at, granted_by, expires_at, access_level, permissions, access_token, created_at, updated_at, snapshot_id)
VALUES ('00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000001', now(), '00000000-0000-0000-0000-000000000001', now() + interval '90 days', 'read_only', '{"view_passport": true}', encode(sha256('grant-token-plaintext-vslice-002'::bytea), 'hex')::uuid, now(), now(), '00000000-0000-0000-0000-000000000902')
;

-- ═══════ EXPIRED GRANT ═══════
INSERT INTO passport_shares (id, passport_entry_id, sponsor_organization_id, granted_at, granted_by, expires_at, access_level, permissions, access_token, created_at, updated_at, snapshot_id)
VALUES ('00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000001', now() - interval '30 days', '00000000-0000-0000-0000-000000000001', now() - interval '1 day', 'read_only', '{"view_passport": true}', encode(sha256('grant-token-expired-vslice'::bytea), 'hex')::uuid, now() - interval '30 days', now() - interval '30 days', '00000000-0000-0000-0000-000000000901')
;

-- ═══════ CROSS-TENANT GRANT (intruder) ═══════
INSERT INTO organizations (id, name, slug, created_at)
VALUES ('00000000-0000-0000-0000-000000000002', 'Intruder Org', 'intruder-org', now())
ON CONFLICT (id) DO NOTHING
;

INSERT INTO passport_shares (id, passport_entry_id, sponsor_organization_id, granted_at, granted_by, expires_at, access_level, permissions, access_token, created_at, updated_at, snapshot_id)
VALUES ('00000000-0000-0000-0000-000000000aff', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000002', now(), '00000000-0000-0000-0000-000000000001', now() + interval '90 days', 'read_only', '{"view_passport": true}', encode(sha256('grant-token-intruder'::bytea), 'hex')::uuid, now(), now(), '00000000-0000-0000-0000-000000000901')
;

SELECT 'SEED_COMPLETE' AS result;