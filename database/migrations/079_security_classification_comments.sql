-- COMMENT ON COLUMN statements only. No structural changes.
-- Classification model: PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED

COMMENT ON COLUMN evidence_nodes.content IS 'CONFIDENTIAL';
COMMENT ON COLUMN evidence_nodes.raw_metadata IS 'CONFIDENTIAL';
COMMENT ON COLUMN source_records.content_hash IS 'INTERNAL';
COMMENT ON COLUMN source_records.raw_metadata IS 'CONFIDENTIAL';
COMMENT ON COLUMN source_records.locator_uri IS 'INTERNAL';
COMMENT ON COLUMN claims.subject IS 'CONFIDENTIAL';
COMMENT ON COLUMN claims.tags IS 'INTERNAL';
COMMENT ON COLUMN institutional_events.payload IS 'CONFIDENTIAL';
COMMENT ON COLUMN institutional_events.actor_id IS 'INTERNAL';
COMMENT ON COLUMN claim_evidence_links.rationale IS 'CONFIDENTIAL';
COMMENT ON COLUMN claim_evidence_links.provenance IS 'CONFIDENTIAL';
COMMENT ON COLUMN evidence_generation_rules.required_inputs IS 'INTERNAL';
COMMENT ON COLUMN evidence_generation_rules.confidence_policy IS 'INTERNAL';
COMMENT ON COLUMN evidence_generation_rules.preconditions IS 'INTERNAL';