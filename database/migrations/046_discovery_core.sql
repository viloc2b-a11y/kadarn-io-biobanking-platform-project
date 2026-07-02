-- ============================================================================
-- KADARN PLATFORM — Evidence Discovery (Sprint 20A.2)
-- ============================================================================
-- Baseline: AF-1.0
-- Domain model: Sprint 20A.1 — KEMS-002 / KEMS-002A
--
-- This migration implements persistence for the Evidence Discovery subsystem.
-- Discovery is SEPARATE from the Evidence Core. No discovery table writes to
-- canonical evidence tables. Evidence Candidates are provisional until promoted.
--
-- KEMS-002 Principles enforced:
--   Principle 1: Discovery never writes directly to Evidence Core
--   Principle 3: Evidence Candidate before Evidence Node
--   Principle 4: Layer 0 is immutable
--   Principle 5: Trace everything — full provenance chain
--
-- KEMS-002A invariants:
--   Every transition is persisted as immutable event
--   No transition without event
--   Complete lifecycle reconstructable from events
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE discovery_artifact_type AS ENUM (
        'pdf', 'docx', 'zip', 'image', 'api_payload', 'public_registry', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE discovery_session_status AS ENUM (
        'active', 'completed', 'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE discovery_run_status AS ENUM (
        'running', 'completed', 'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE discovery_candidate_state AS ENUM (
        'RAW_SOURCE', 'DISCOVERED', 'CLASSIFIED', 'ENTITY_EXTRACTED',
        'CLAIMS_PROPOSED', 'CURATION', 'ENRICHED', 'NEEDS_MORE_EVIDENCE',
        'READY_FOR_PROMOTION', 'PROMOTED', 'REJECTED', 'MERGED', 'SPLIT',
        'ARCHIVED',
        'DISCOVERY_FAILED', 'CLASSIFICATION_FAILED',
        'ENTITY_EXTRACTION_FAILED', 'CLAIM_DETECTION_FAILED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: DISCOVERY SESSION
-- ############################################################################

CREATE TABLE IF NOT EXISTS discovery_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    site_id             UUID,  -- optional, linked when SiteIdentity exists
    status              discovery_session_status NOT NULL DEFAULT 'active',
    created_by          UUID NOT NULL,
    correlation_id      UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discovery_sessions_org ON discovery_sessions(organization_id);

-- ############################################################################
-- PART 3: DISCOVERY RUN
-- ############################################################################

CREATE TABLE IF NOT EXISTS discovery_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES discovery_sessions(id) ON DELETE CASCADE,
    status              discovery_run_status NOT NULL DEFAULT 'running',
    pipeline_version    TEXT NOT NULL,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    error_message       TEXT
);

CREATE INDEX idx_discovery_runs_session ON discovery_runs(session_id);

-- ############################################################################
-- PART 4: DISCOVERY ARTIFACTS (Layer 0 metadata)
-- ############################################################################
-- KEMS-002 Principle 4: Layer 0 is immutable.
-- KEMS-002A: Layer 0 metadata may not be mutated after creation.

CREATE TABLE IF NOT EXISTS discovery_artifacts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id              UUID NOT NULL REFERENCES discovery_runs(id) ON DELETE CASCADE,
    file_name           TEXT NOT NULL,
    artifact_type       discovery_artifact_type NOT NULL,
    size_bytes          BIGINT NOT NULL,
    file_hash           TEXT NOT NULL,        -- SHA-256
    source              TEXT NOT NULL,
    storage_ref         TEXT NOT NULL,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Immutable enforcement: no UPDATE trigger — only INSERT allowed
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discovery_artifacts_run ON discovery_artifacts(run_id);
CREATE INDEX idx_discovery_artifacts_hash ON discovery_artifacts(file_hash);

-- ############################################################################
-- PART 5: LAYER 1 — EXTRACTED REPRESENTATION
-- ############################################################################
-- KEMS-002A: Layer 1 references Layer 0. Cannot exist without Layer 0.

CREATE TABLE IF NOT EXISTS discovery_layer1 (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id         UUID NOT NULL REFERENCES discovery_artifacts(id) ON DELETE CASCADE,
    markdown            TEXT NOT NULL,
    extractor           TEXT NOT NULL,
    extractor_version   TEXT NOT NULL,
    original_hash       TEXT NOT NULL,        -- hash of Layer 0 for provenance
    status              TEXT NOT NULL DEFAULT 'completed',
    error_message       TEXT,
    extracted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discovery_layer1_artifact ON discovery_layer1(artifact_id);

-- ############################################################################
-- PART 6: EVIDENCE CANDIDATES (Layer 2 — semantic objects)
-- ############################################################################
-- KEMS-002 Principle 3: Provisional until promoted.
-- KEMS-002A: State machine governs lifecycle.

CREATE TABLE IF NOT EXISTS discovery_candidates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id                  UUID NOT NULL REFERENCES discovery_runs(id) ON DELETE CASCADE,
    current_state           discovery_candidate_state NOT NULL DEFAULT 'RAW_SOURCE',
    proposed_evidence_class TEXT,                          -- 'A'..'F'
    content                 TEXT NOT NULL,
    discovery_confidence    NUMERIC(5,3) NOT NULL DEFAULT 0,
    source                  TEXT NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- If promoted, reference to canonical EvidenceNode (populated by Promotion Pipeline)
    promoted_evidence_node_id UUID
);

CREATE INDEX idx_discovery_candidates_run ON discovery_candidates(run_id);
CREATE INDEX idx_discovery_candidates_state ON discovery_candidates(current_state);

-- ############################################################################
-- PART 7: CANDIDATE → ARTIFACT LINKS
-- ############################################################################

CREATE TABLE IF NOT EXISTS discovery_candidate_artifacts (
    candidate_id    UUID NOT NULL REFERENCES discovery_candidates(id) ON DELETE CASCADE,
    artifact_id     UUID NOT NULL REFERENCES discovery_artifacts(id) ON DELETE CASCADE,
    PRIMARY KEY (candidate_id, artifact_id)
);

-- ############################################################################
-- PART 8: TRANSITION EVENTS (append-only, immutable)
-- ############################################################################
-- KEMS-002A §6: Every transition emits an immutable event.
-- KEMS-002A §10: Every state transition must be reproducible.

CREATE TABLE IF NOT EXISTS discovery_transition_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id        UUID NOT NULL REFERENCES discovery_candidates(id) ON DELETE CASCADE,
    from_state          discovery_candidate_state NOT NULL,
    to_state            discovery_candidate_state NOT NULL,
    actor               TEXT NOT NULL,
    pipeline_version    TEXT NOT NULL,
    model_version       TEXT,
    reason              TEXT NOT NULL,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Idempotency: unique constraint prevents duplicate transition events
    UNIQUE (candidate_id, from_state, to_state, occurred_at)
);

CREATE INDEX idx_discovery_events_candidate ON discovery_transition_events(candidate_id);
CREATE INDEX idx_discovery_events_timing ON discovery_transition_events(occurred_at);

-- ############################################################################
-- PART 9: APPEND-ONLY ENFORCEMENT (Layer 0 artifacts — immutable)
-- ############################################################################

CREATE OR REPLACE FUNCTION discovery_artifacts_no_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'discovery_artifacts is append-only. Artifact % cannot be modified.', OLD.id;
END;
$$;

DROP TRIGGER IF EXISTS trg_discovery_artifacts_no_update ON discovery_artifacts;
CREATE TRIGGER trg_discovery_artifacts_no_update
    BEFORE UPDATE ON discovery_artifacts
    FOR EACH ROW EXECUTE FUNCTION discovery_artifacts_no_update();

-- Transition events are also append-only
CREATE OR REPLACE FUNCTION discovery_events_no_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'discovery_transition_events is append-only. Event % cannot be modified.', OLD.id;
END;
$$;

DROP TRIGGER IF EXISTS trg_discovery_events_no_update ON discovery_transition_events;
CREATE TRIGGER trg_discovery_events_no_update
    BEFORE UPDATE ON discovery_transition_events
    FOR EACH ROW EXECUTE FUNCTION discovery_events_no_update();

-- ############################################################################
-- PART 10: ROW-LEVEL SECURITY
-- ############################################################################
-- Discovery is org-scoped through discovery_sessions.organization_id.
-- Child tables (runs, artifacts, layer1, candidates, candidate_artifacts,
-- transition_events) join up to discovery_sessions to resolve org ownership.
-- discovery_artifacts and discovery_transition_events are append-only (see
-- PART 9 triggers above) — no UPDATE/DELETE policy is defined for them.
-- ============================================================================

ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_layer1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_candidate_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_transition_events ENABLE ROW LEVEL SECURITY;

-- discovery_sessions: org-scoped directly
CREATE POLICY discovery_sessions_select_org ON discovery_sessions
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY discovery_sessions_insert_org ON discovery_sessions
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY discovery_sessions_update_org ON discovery_sessions
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    )
    WITH CHECK (
        organization_id = (SELECT original.organization_id FROM discovery_sessions original WHERE original.id = discovery_sessions.id)
    );

-- discovery_runs: via parent session's organization_id
CREATE POLICY discovery_runs_select_org ON discovery_runs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_sessions s
            WHERE s.id = discovery_runs.session_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_runs_insert_org ON discovery_runs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_sessions s
            WHERE s.id = discovery_runs.session_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_runs_update_org ON discovery_runs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM discovery_sessions s
            WHERE s.id = discovery_runs.session_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    )
    WITH CHECK (
        session_id = (SELECT original.session_id FROM discovery_runs original WHERE original.id = discovery_runs.id)
    );

-- discovery_artifacts: via parent run -> session's organization_id.
-- Layer 0 is immutable (KEMS-002 Principle 4) — INSERT only, no UPDATE/DELETE policy.
CREATE POLICY discovery_artifacts_select_org ON discovery_artifacts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_artifacts.run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_artifacts_insert_org ON discovery_artifacts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_artifacts.run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- discovery_layer1: via parent artifact -> run -> session's organization_id
CREATE POLICY discovery_layer1_select_org ON discovery_layer1
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_artifacts a
            JOIN discovery_runs r ON r.id = a.run_id
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE a.id = discovery_layer1.artifact_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_layer1_insert_org ON discovery_layer1
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_artifacts a
            JOIN discovery_runs r ON r.id = a.run_id
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE a.id = discovery_layer1.artifact_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_layer1_update_org ON discovery_layer1
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM discovery_artifacts a
            JOIN discovery_runs r ON r.id = a.run_id
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE a.id = discovery_layer1.artifact_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    )
    WITH CHECK (
        artifact_id = (SELECT original.artifact_id FROM discovery_layer1 original WHERE original.id = discovery_layer1.id)
    );

-- discovery_candidates: via parent run -> session's organization_id
CREATE POLICY discovery_candidates_select_org ON discovery_candidates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_candidates.run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_candidates_insert_org ON discovery_candidates
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_candidates.run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_candidates_update_org ON discovery_candidates
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_candidates.run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    )
    WITH CHECK (
        run_id = (SELECT original.run_id FROM discovery_candidates original WHERE original.id = discovery_candidates.id)
    );

-- discovery_candidate_artifacts: link table, visible/insertable if the
-- candidate is visible/insertable (org derived transitively via candidate).
CREATE POLICY discovery_candidate_artifacts_select_org ON discovery_candidate_artifacts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_candidates c
            JOIN discovery_runs r ON r.id = c.run_id
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE c.id = discovery_candidate_artifacts.candidate_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_candidate_artifacts_insert_org ON discovery_candidate_artifacts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_candidates c
            JOIN discovery_runs r ON r.id = c.run_id
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE c.id = discovery_candidate_artifacts.candidate_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- discovery_transition_events: append-only (KEMS-002A §6) — INSERT/SELECT
-- only, no UPDATE/DELETE policy. Org resolved via candidate -> run -> session.
CREATE POLICY discovery_transition_events_select_org ON discovery_transition_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_candidates c
            JOIN discovery_runs r ON r.id = c.run_id
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE c.id = discovery_transition_events.candidate_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_transition_events_insert_org ON discovery_transition_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_candidates c
            JOIN discovery_runs r ON r.id = c.run_id
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE c.id = discovery_transition_events.candidate_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- ############################################################################
-- PART 11: VERIFICATION QUERIES
-- ############################################################################

-- List all discovery tables:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public'
--   AND tablename LIKE 'discovery_%' ORDER BY tablename;

-- Reconstruct candidate lifecycle:
--   SELECT * FROM discovery_transition_events
--   WHERE candidate_id = :candidate_id
--   ORDER BY occurred_at;

-- List all RLS policies for discovery tables:
--   SELECT * FROM pg_policies WHERE schemaname = 'public'
--   AND tablename LIKE 'discovery_%' ORDER BY tablename, policyname;

-- ============================================================================
-- END OF MIGRATION 046
-- ============================================================================
