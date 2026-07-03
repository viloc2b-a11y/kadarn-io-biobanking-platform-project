-- ============================================================================
-- KADARN PLATFORM — Discovery Agent Outputs (Sprint 20A.4A)
-- ============================================================================
-- Stores structured outputs from Discovery Agents (Document Classifier,
-- Entity Extractor, Claim Detector, etc.).
-- Agents NEVER write to Evidence Core.
-- ============================================================================

CREATE TABLE IF NOT EXISTS discovery_agent_outputs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          UUID NOT NULL REFERENCES discovery_preparation_requests(request_id),
    agent_name          TEXT NOT NULL,
    agent_version       TEXT NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('COMPLETED', 'FAILED', 'SKIPPED')),
    output              JSONB NOT NULL DEFAULT '{}',
    confidence          NUMERIC(5,3) NOT NULL DEFAULT 0,
    warnings            JSONB NOT NULL DEFAULT '[]',
    provenance          JSONB NOT NULL DEFAULT '{}',

    -- Traceability
    layer1_id           UUID NOT NULL REFERENCES discovery_layer1(id),
    artifact_id         UUID NOT NULL REFERENCES discovery_artifacts(id),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_outputs_request ON discovery_agent_outputs(request_id);
CREATE INDEX idx_agent_outputs_agent ON discovery_agent_outputs(agent_name);

-- ############################################################################
-- ROW-LEVEL SECURITY
-- ############################################################################
-- Org-scoped via artifact_id -> discovery_artifacts.run_id ->
-- discovery_runs.session_id -> discovery_sessions.organization_id.
-- Agent outputs are immutable once written (no UPDATE/DELETE policy) —
-- agents never write to Evidence Core and never revise their own outputs.

ALTER TABLE discovery_agent_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY discovery_agent_outputs_select_org ON discovery_agent_outputs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_artifacts a
            JOIN discovery_runs r ON r.id = a.run_id
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE a.id = discovery_agent_outputs.artifact_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_agent_outputs_insert_org ON discovery_agent_outputs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_artifacts a
            JOIN discovery_runs r ON r.id = a.run_id
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE a.id = discovery_agent_outputs.artifact_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- ============================================================================
-- END OF MIGRATION 048
-- ============================================================================
