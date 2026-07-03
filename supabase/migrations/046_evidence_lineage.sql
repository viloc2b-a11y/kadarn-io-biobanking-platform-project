-- ============================================================================
-- KADARN PLATFORM — Evidence Lineage (Phase 8, Sprint 28B)
-- ============================================================================
-- Domain frozen at packages/types/src/phase8 (28A).
-- Append-only lineage chain: Source → SourceVersion → Artifact → ExtractionRun → ExtractedFact
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_sources (
    source_id           TEXT PRIMARY KEY,
    source_type         TEXT NOT NULL,
    provider_ref        TEXT,
    org_id              UUID NOT NULL,
    canonical_identity_id TEXT,
    connector_id        TEXT,
    external_url        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_source_versions (
    source_version_id   TEXT PRIMARY KEY,
    source_id           TEXT NOT NULL REFERENCES evidence_sources(source_id),
    content_hash        TEXT NOT NULL,
    ingested_at         TIMESTAMPTZ NOT NULL,
    connector_id        TEXT NOT NULL,
    correlation_id      TEXT NOT NULL,
    byte_size           BIGINT,
    mime_type           TEXT
);

CREATE TABLE IF NOT EXISTS evidence_artifacts (
    artifact_id         TEXT PRIMARY KEY,
    source_version_id   TEXT NOT NULL REFERENCES evidence_source_versions(source_version_id),
    storage_ref         TEXT NOT NULL,
    mime_type           TEXT NOT NULL,
    byte_size           BIGINT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_extraction_runs (
    run_id              TEXT PRIMARY KEY,
    artifact_id         TEXT NOT NULL REFERENCES evidence_artifacts(artifact_id),
    parser_version      TEXT NOT NULL,
    model_version       TEXT NOT NULL,
    pipeline_version    TEXT NOT NULL,
    resolution_run_id   TEXT,
    started_at          TIMESTAMPTZ NOT NULL,
    completed_at        TIMESTAMPTZ,
    status              TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    correlation_id      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_extracted_facts (
    fact_id             TEXT PRIMARY KEY,
    extraction_run_id   TEXT NOT NULL REFERENCES evidence_extraction_runs(run_id),
    value               TEXT NOT NULL,
    semantic_type       TEXT NOT NULL,
    span_address_type   TEXT NOT NULL,
    span_address_value  TEXT NOT NULL,
    span_source_version_id TEXT NOT NULL,
    evidence_class      TEXT,
    confidence_input    NUMERIC,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extracted_facts_run ON evidence_extracted_facts(extraction_run_id);
CREATE INDEX IF NOT EXISTS idx_source_versions_source ON evidence_source_versions(source_id);

COMMENT ON TABLE evidence_extracted_facts IS 'Phase 8 ExtractedFact — atomic document-derived truth; not Claims';
