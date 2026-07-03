-- ============================================================================
-- Phase 8 Sprint 28C / 28D — Claim versions + Published Views (append-only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS phase8_claim_instances (
    claim_instance_id   TEXT PRIMARY KEY,
    claim_type_id       TEXT NOT NULL,
    org_id              UUID NOT NULL,
    subject_entity_id   TEXT NOT NULL,
    lifecycle_state     TEXT NOT NULL,
    current_claim_version_id TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase8_claim_versions (
    claim_version_id    TEXT PRIMARY KEY,
    claim_instance_id   TEXT NOT NULL REFERENCES phase8_claim_instances(claim_instance_id),
    schema_version_id   TEXT NOT NULL,
    payload             JSONB NOT NULL,
    content_hash        TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    supersedes_version_id TEXT
);

CREATE TABLE IF NOT EXISTS phase8_claim_candidates (
    candidate_id        TEXT PRIMARY KEY,
    claim_type_id       TEXT NOT NULL,
    org_id              UUID NOT NULL,
    subject_entity_id   TEXT NOT NULL,
    fact_ids            JSONB NOT NULL DEFAULT '[]',
    rule_id             TEXT NOT NULL,
    rule_version        TEXT NOT NULL,
    proposed_payload    JSONB NOT NULL,
    status              TEXT NOT NULL,
    discovery_session_id TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase8_published_views (
    view_id             TEXT PRIMARY KEY,
    view_version        TEXT NOT NULL,
    claim_instance_id   TEXT NOT NULL,
    claim_version_id    TEXT NOT NULL,
    org_id              UUID NOT NULL,
    schema_version      TEXT NOT NULL,
    adapter_version     TEXT NOT NULL,
    projection          JSONB NOT NULL,
    confidence_level    TEXT NOT NULL,
    confidence_value    NUMERIC NOT NULL,
    confidence_computed_at TIMESTAMPTZ NOT NULL,
    published_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visibility_policy_ref TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_published_views_claim ON phase8_published_views(claim_instance_id);
CREATE INDEX IF NOT EXISTS idx_published_views_org ON phase8_published_views(org_id);

COMMENT ON TABLE phase8_published_views IS 'ADR-030 Published View projections — append-only';
