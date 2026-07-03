-- ============================================================================
-- KADARN PLATFORM — Discovery Curation Events (Sprint 20A.6)
-- ============================================================================
-- Curation is NOT promotion. Curation does not write to Evidence Core.
-- Every curation action is an immutable provenance event.
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE curation_action AS ENUM (
        'ACCEPT', 'REJECT', 'ENRICH', 'DEFER',
        'NEEDS_MORE_EVIDENCE', 'MERGE', 'SPLIT', 'ARCHIVE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE curation_target_type AS ENUM (
        'EVIDENCE_CANDIDATE', 'CLASSIFICATION', 'ENTITY', 'RELATIONSHIP',
        'SNAPSHOT_ITEM'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS discovery_curation_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type         curation_target_type NOT NULL,
    target_id           TEXT NOT NULL,
    action              curation_action NOT NULL,

    -- Actor
    actor_id            TEXT NOT NULL,
    actor_role          TEXT NOT NULL DEFAULT 'reviewer',

    -- Provenance
    reason              TEXT,
    enrichment_payload  JSONB,
    previous_state      TEXT,
    new_state           TEXT,
    provenance_ref      TEXT NOT NULL,
    discovery_run_id    UUID NOT NULL REFERENCES discovery_runs(id),
    artifact_id         TEXT,
    layer1_id           TEXT,

    -- Merge/split
    merge_source_ids    JSONB,
    split_child_ids     JSONB,

    -- Temporal
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_curation_target ON discovery_curation_events(target_type, target_id);
CREATE INDEX idx_curation_run ON discovery_curation_events(discovery_run_id);

-- ############################################################################
-- ROW-LEVEL SECURITY
-- ############################################################################
-- Org-scoped via discovery_run_id -> discovery_runs.session_id ->
-- discovery_sessions.organization_id. Curation events are immutable
-- provenance records (no UPDATE/DELETE policy) — curation never rewrites
-- history, it only appends new events.

ALTER TABLE discovery_curation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY discovery_curation_events_select_org ON discovery_curation_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_curation_events.discovery_run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_curation_events_insert_org ON discovery_curation_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_runs r
            JOIN discovery_sessions s ON s.id = r.session_id
            WHERE r.id = discovery_curation_events.discovery_run_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- ============================================================================
-- END OF MIGRATION 049
-- ============================================================================
