-- ============================================================================
-- KADARN PLATFORM — Discovery Validation Notes (Sprint 20C)
-- ============================================================================
-- Validation Notes are product-validation data, NOT Evidence Core. They let
-- a reviewer record observations about the Discovery Interaction Dashboard
-- itself (what Kadarn got right, what it missed, false positives/negatives,
-- surprising findings, documents to request, user reactions, time-to-first-
-- value observations, or general notes) while reviewing a Discovery session.
--
-- Validation Notes never write to Evidence Core, never certify a site, and
-- never influence Claim Confidence. They are append-only observations.
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE validation_note_category AS ENUM (
        'GOT_RIGHT', 'MISSED', 'FALSE_POSITIVE', 'FALSE_NEGATIVE',
        'SURPRISING', 'DOCUMENT_TO_REQUEST', 'USER_REACTION', 'TTFV', 'GENERAL'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS discovery_validation_notes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovery_session_id    UUID NOT NULL REFERENCES discovery_sessions(id) ON DELETE CASCADE,
    discovery_run_id        UUID REFERENCES discovery_runs(id),
    author_id               UUID NOT NULL,
    category                validation_note_category NOT NULL,
    note                    TEXT NOT NULL,
    target_type             TEXT,
    target_id               TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_notes_session ON discovery_validation_notes(discovery_session_id);
CREATE INDEX idx_validation_notes_run ON discovery_validation_notes(discovery_run_id);
CREATE INDEX idx_validation_notes_category ON discovery_validation_notes(category);

-- ############################################################################
-- APPEND-ONLY ENFORCEMENT
-- ############################################################################
-- Validation Notes are observations captured during review. Like discovery_
-- transition_events and discovery_curation_events, they are never revised —
-- correcting a note means adding a new one.

CREATE OR REPLACE FUNCTION discovery_validation_notes_no_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'discovery_validation_notes is append-only. Note % cannot be modified.', OLD.id;
END;
$$;

DROP TRIGGER IF EXISTS trg_discovery_validation_notes_no_update ON discovery_validation_notes;
CREATE TRIGGER trg_discovery_validation_notes_no_update
    BEFORE UPDATE ON discovery_validation_notes
    FOR EACH ROW EXECUTE FUNCTION discovery_validation_notes_no_update();

-- ############################################################################
-- ROW-LEVEL SECURITY
-- ############################################################################
-- Org-scoped via discovery_session_id -> discovery_sessions.organization_id
-- (same pattern as migrations 046-049). Append-only — no UPDATE/DELETE policy.

ALTER TABLE discovery_validation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY discovery_validation_notes_select_org ON discovery_validation_notes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discovery_sessions s
            WHERE s.id = discovery_validation_notes.discovery_session_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY discovery_validation_notes_insert_org ON discovery_validation_notes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM discovery_sessions s
            WHERE s.id = discovery_validation_notes.discovery_session_id
            AND s.organization_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- ############################################################################
-- VERIFICATION QUERIES
-- ############################################################################

-- List all validation notes for a session:
--   SELECT * FROM discovery_validation_notes
--   WHERE discovery_session_id = :session_id ORDER BY created_at DESC;

-- ============================================================================
-- END OF MIGRATION 050
-- ============================================================================
