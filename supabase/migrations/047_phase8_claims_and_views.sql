-- ============================================================================
-- KADARN PLATFORM — Evidence Discovery Preparation Layer (Sprint 20A.3B)
-- ============================================================================
-- Baseline: AF-1.0
-- Design: KEMS-002, KEMS-002A, Agent Responsibility Matrix
--
-- Creates the semantic extraction request queue between Layer 1 extraction
-- and the future Agent Pipeline. No AI agents. No Evidence Core writes.
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE discovery_request_type AS ENUM (
        'DOCUMENT_CLASSIFICATION',
        'ENTITY_EXTRACTION',
        'RELATIONSHIP_EXTRACTION',
        'CLAIM_CANDIDATE_DETECTION',
        'TIMELINE_RECONSTRUCTION',
        'GAP_DETECTION',
        'LEVERAGE_RECOMMENDATION'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE discovery_request_status AS ENUM (
        'PENDING', 'CLAIMED', 'RUNNING', 'COMPLETED',
        'FAILED', 'CANCELLED', 'SKIPPED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE discovery_request_priority AS ENUM (
        'high', 'normal', 'low'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS discovery_preparation_requests (
    request_id          UUID PRIMARY KEY,
    discovery_run_id    UUID NOT NULL REFERENCES discovery_runs(id) ON DELETE CASCADE,
    artifact_id         UUID NOT NULL REFERENCES discovery_artifacts(id),
    layer1_id           UUID NOT NULL REFERENCES discovery_layer1(id),
    request_type        discovery_request_type NOT NULL,
    status              discovery_request_status NOT NULL DEFAULT 'PENDING',
    priority            discovery_request_priority NOT NULL DEFAULT 'normal',
    pipeline_version    TEXT NOT NULL,
    agent_version       TEXT,
    model_version       TEXT,
    input_hash          TEXT NOT NULL,
    output_ref          TEXT,
    error               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Idempotency: no duplicate active PENDING/CLAIMED/RUNNING requests
    -- for the same layer1Id + requestType + pipelineVersion
    CONSTRAINT uq_active_request UNIQUE (layer1_id, request_type, pipeline_version, status)
);

CREATE INDEX idx_prep_requests_run ON discovery_preparation_requests(discovery_run_id);
CREATE INDEX idx_prep_requests_status ON discovery_preparation_requests(status);
CREATE INDEX idx_prep_requests_type ON discovery_preparation_requests(request_type);

-- ############################################################################
-- ROW-LEVEL SECURITY
-- ############################################################################
-- Org-scoped via discovery_run_id -> discovery_runs.session_id ->
-- discovery_sessions.organization_id (same pattern as migration 046).

ALTER TABLE discovery_preparation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY discovery_preparation_requests_select_org ON discovery_preparation_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_preparation_requests.discovery_run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_preparation_requests_insert_org ON discovery_preparation_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_preparation_requests.discovery_run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- UPDATE: request lifecycle transitions (status, claimed_at, completed_at,
-- failed_at, output_ref, error) by org members; identity/queue fields
-- (discovery_run_id, artifact_id, layer1_id, request_type, input_hash) are
-- immutable once created.
CREATE POLICY discovery_preparation_requests_update_org ON discovery_preparation_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_preparation_requests.discovery_run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    )
    WITH CHECK (
        discovery_run_id = (SELECT original.discovery_run_id FROM discovery_preparation_requests original WHERE original.request_id = discovery_preparation_requests.request_id)
        AND artifact_id = (SELECT original.artifact_id FROM discovery_preparation_requests original WHERE original.request_id = discovery_preparation_requests.request_id)
        AND layer1_id = (SELECT original.layer1_id FROM discovery_preparation_requests original WHERE original.request_id = discovery_preparation_requests.request_id)
        AND request_type = (SELECT original.request_type FROM discovery_preparation_requests original WHERE original.request_id = discovery_preparation_requests.request_id)
    );

-- ============================================================================
-- END OF MIGRATION 047
-- ============================================================================
