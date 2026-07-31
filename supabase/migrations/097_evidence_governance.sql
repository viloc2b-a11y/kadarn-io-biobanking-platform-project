-- ============================================================================
-- KADARN v2 — Evidence Governance Tables (KEMS Site Profile)
-- ============================================================================
-- Migration: 095
-- Authority: KEMS-SITE-PROFILE, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Adds evidence governance tables supporting authenticity verification,
-- entity relationship tracking, conflict detection, and review event
-- auditing. Also adds support_type classification to claim_evidence_links.
--
-- Tables:
--   1. evidence_authenticity_signals — signal-based authenticity metadata
--   2. evidence_entity_relationships — links evidence to domain entities
--   3. evidence_conflicts — pairwise conflict detection between evidence nodes
--   4. evidence_review_events — audit trail of review decisions
--   5. claim_evidence_links.support_type — evidential support classification
-- ============================================================================

-- ############################################################################
-- PART 1: TABLE — evidence_authenticity_signals
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.evidence_authenticity_signals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID NOT NULL REFERENCES public.evidence_nodes(id) ON DELETE CASCADE,
    signal_type     TEXT NOT NULL,
    status          TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}',
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 2: TABLE — evidence_entity_relationships
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.evidence_entity_relationships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id         UUID NOT NULL REFERENCES public.evidence_nodes(id) ON DELETE CASCADE,
    entity_type         TEXT NOT NULL,
    entity_id           UUID NOT NULL,
    relationship_type   TEXT NOT NULL DEFAULT 'record_subject',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 3: TABLE — evidence_conflicts
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.evidence_conflicts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_a          UUID NOT NULL REFERENCES public.evidence_nodes(id) ON DELETE CASCADE,
    evidence_b          UUID NOT NULL REFERENCES public.evidence_nodes(id) ON DELETE CASCADE,
    conflict_type       TEXT NOT NULL,
    detected_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolution_status   TEXT NOT NULL DEFAULT 'unresolved',
    CONSTRAINT evidence_conflicts_self_check CHECK (evidence_a <> evidence_b)
);

-- ############################################################################
-- PART 4: TABLE — evidence_review_events
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.evidence_review_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID NOT NULL REFERENCES public.evidence_nodes(id) ON DELETE CASCADE,
    reviewer        UUID,
    review_result   TEXT NOT NULL,
    review_notes    TEXT,
    reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 5: INDEXES — evidence_authenticity_signals
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_eas_evidence_id
    ON public.evidence_authenticity_signals(evidence_id);

CREATE INDEX IF NOT EXISTS idx_eas_signal_type
    ON public.evidence_authenticity_signals(signal_type);

CREATE INDEX IF NOT EXISTS idx_eas_status
    ON public.evidence_authenticity_signals(status);

CREATE INDEX IF NOT EXISTS idx_eas_recorded_at
    ON public.evidence_authenticity_signals(recorded_at);

-- ############################################################################
-- PART 6: INDEXES — evidence_entity_relationships
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_eer_evidence_id
    ON public.evidence_entity_relationships(evidence_id);

CREATE INDEX IF NOT EXISTS idx_eer_entity
    ON public.evidence_entity_relationships(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_eer_relationship_type
    ON public.evidence_entity_relationships(relationship_type);

-- ############################################################################
-- PART 7: INDEXES — evidence_conflicts
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_ec_evidence_a
    ON public.evidence_conflicts(evidence_a);

CREATE INDEX IF NOT EXISTS idx_ec_evidence_b
    ON public.evidence_conflicts(evidence_b);

CREATE INDEX IF NOT EXISTS idx_ec_conflict_type
    ON public.evidence_conflicts(conflict_type);

CREATE INDEX IF NOT EXISTS idx_ec_resolution_status
    ON public.evidence_conflicts(resolution_status);

CREATE INDEX IF NOT EXISTS idx_ec_detected_at
    ON public.evidence_conflicts(detected_at);

-- ############################################################################
-- PART 8: INDEXES — evidence_review_events
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_ere_evidence_id
    ON public.evidence_review_events(evidence_id);

CREATE INDEX IF NOT EXISTS idx_ere_reviewer
    ON public.evidence_review_events(reviewer);

CREATE INDEX IF NOT EXISTS idx_ere_review_result
    ON public.evidence_review_events(review_result);

CREATE INDEX IF NOT EXISTS idx_ere_reviewed_at
    ON public.evidence_review_events(reviewed_at);

-- ############################################################################
-- PART 9: ALTER — claim_evidence_links.support_type
-- ############################################################################

ALTER TABLE IF EXISTS public.claim_evidence_links
    ADD COLUMN IF NOT EXISTS support_type TEXT NOT NULL DEFAULT 'DIRECT'
    CHECK (support_type IN ('DIRECT', 'PARTIAL', 'CONTEXTUAL', 'CONTRADICTORY', 'OBSOLETE'));

CREATE INDEX IF NOT EXISTS idx_cel_support_type
    ON public.claim_evidence_links(support_type);

-- ############################################################################
-- PART 10: RLS — evidence_authenticity_signals
-- ############################################################################
-- Resolve organization via: evidence_node → claim → organization_id

ALTER TABLE public.evidence_authenticity_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eas_select_org ON public.evidence_authenticity_signals;
CREATE POLICY eas_select_org ON public.evidence_authenticity_signals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
                AND om.user_id = auth.uid()
                AND om.status = 'active'
            WHERE en.id = evidence_authenticity_signals.evidence_id
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS eas_insert_org ON public.evidence_authenticity_signals;
CREATE POLICY eas_insert_org ON public.evidence_authenticity_signals
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
                AND om.user_id = auth.uid()
                AND om.status = 'active'
            WHERE en.id = evidence_authenticity_signals.evidence_id
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS eas_all_service ON public.evidence_authenticity_signals;
CREATE POLICY eas_all_service ON public.evidence_authenticity_signals
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 11: RLS — evidence_entity_relationships
-- ############################################################################

ALTER TABLE public.evidence_entity_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eer_select_org ON public.evidence_entity_relationships;
CREATE POLICY eer_select_org ON public.evidence_entity_relationships
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
                AND om.user_id = auth.uid()
                AND om.status = 'active'
            WHERE en.id = evidence_entity_relationships.evidence_id
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS eer_insert_org ON public.evidence_entity_relationships;
CREATE POLICY eer_insert_org ON public.evidence_entity_relationships
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
                AND om.user_id = auth.uid()
                AND om.status = 'active'
            WHERE en.id = evidence_entity_relationships.evidence_id
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS eer_all_service ON public.evidence_entity_relationships;
CREATE POLICY eer_all_service ON public.evidence_entity_relationships
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 12: RLS — evidence_conflicts
-- ############################################################################
-- Conflicts span two evidence nodes; user must have access to evidence_a's org

ALTER TABLE public.evidence_conflicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ec_select_org ON public.evidence_conflicts;
CREATE POLICY ec_select_org ON public.evidence_conflicts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
                AND om.user_id = auth.uid()
                AND om.status = 'active'
            WHERE en.id = evidence_conflicts.evidence_a
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS ec_insert_org ON public.evidence_conflicts;
CREATE POLICY ec_insert_org ON public.evidence_conflicts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
                AND om.user_id = auth.uid()
                AND om.status = 'active'
            WHERE en.id = evidence_conflicts.evidence_a
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS ec_all_service ON public.evidence_conflicts;
CREATE POLICY ec_all_service ON public.evidence_conflicts
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 13: RLS — evidence_review_events
-- ############################################################################

ALTER TABLE public.evidence_review_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ere_select_org ON public.evidence_review_events;
CREATE POLICY ere_select_org ON public.evidence_review_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
                AND om.user_id = auth.uid()
                AND om.status = 'active'
            WHERE en.id = evidence_review_events.evidence_id
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS ere_insert_org ON public.evidence_review_events;
CREATE POLICY ere_insert_org ON public.evidence_review_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.evidence_nodes en
            JOIN public.claims cl ON cl.id = en.claim_id
            JOIN public.organization_memberships om
                ON om.organization_id = cl.organization_id
                AND om.user_id = auth.uid()
                AND om.status = 'active'
            WHERE en.id = evidence_review_events.evidence_id
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS ere_all_service ON public.evidence_review_events;
CREATE POLICY ere_all_service ON public.evidence_review_events
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 14: COMMENTS
-- ############################################################################

COMMENT ON TABLE public.evidence_authenticity_signals IS
    'KEMS-SITE-PROFILE: Signal-based authenticity metadata for evidence nodes. Tracks verification signals such as source trust, format integrity, and provenance checks.';

COMMENT ON COLUMN public.evidence_authenticity_signals.evidence_id IS
    'KEMS-SITE-PROFILE: FK to evidence_nodes. Deletes cascade with the parent evidence.';

COMMENT ON COLUMN public.evidence_authenticity_signals.signal_type IS
    'KEMS-SITE-PROFILE: Classification of the authenticity signal (e.g., source_trust, format_integrity, provenance_check).';

COMMENT ON COLUMN public.evidence_authenticity_signals.status IS
    'KEMS-SITE-PROFILE: Current status of the signal evaluation (e.g., valid, invalid, pending, expired).';

COMMENT ON COLUMN public.evidence_authenticity_signals.metadata IS
    'KEMS-SITE-PROFILE: JSONB payload with signal-specific details (scores, source info, method).';

COMMENT ON TABLE public.evidence_entity_relationships IS
    'KEMS-SITE-PROFILE: Links evidence nodes to domain entities (organizations, people, locations, claims). Supports entity-centric evidence browsing.';

COMMENT ON COLUMN public.evidence_entity_relationships.entity_type IS
    'KEMS-SITE-PROFILE: Domain entity type (e.g., organization, person, location, claim).';

COMMENT ON COLUMN public.evidence_entity_relationships.entity_id IS
    'KEMS-SITE-PROFILE: UUID of the related domain entity.';

COMMENT ON COLUMN public.evidence_entity_relationships.relationship_type IS
    'KEMS-SITE-PROFILE: Nature of the relationship. Default record_subject.';

COMMENT ON TABLE public.evidence_conflicts IS
    'KEMS-SITE-PROFILE: Pairwise conflict detection between evidence nodes. Tracks resolution status for each detected conflict.';

COMMENT ON COLUMN public.evidence_conflicts.evidence_a IS
    'KEMS-SITE-PROFILE: FK to the first evidence node in the conflict pair.';

COMMENT ON COLUMN public.evidence_conflicts.evidence_b IS
    'KEMS-SITE-PROFILE: FK to the second evidence node in the conflict pair. Self-check constraint ensures a <> b.';

COMMENT ON COLUMN public.evidence_conflicts.conflict_type IS
    'KEMS-SITE-PROFILE: Classification of the conflict (e.g., direct_contradiction, temporal_inconsistency, source_divergence).';

COMMENT ON COLUMN public.evidence_conflicts.resolution_status IS
    'KEMS-SITE-PROFILE: Current resolution state. Default unresolved.';

COMMENT ON TABLE public.evidence_review_events IS
    'KEMS-SITE-PROFILE: Immutable audit trail of review decisions on evidence nodes. Each row captures who reviewed, what result, and when.';

COMMENT ON COLUMN public.evidence_review_events.reviewer IS
    'KEMS-SITE-PROFILE: UUID of the reviewer. References the user principal that performed the review.';

COMMENT ON COLUMN public.evidence_review_events.review_result IS
    'KEMS-SITE-PROFILE: Outcome of the review (e.g., approved, rejected, needs_more_evidence).';

COMMENT ON COLUMN public.evidence_review_events.review_notes IS
    'KEMS-SITE-PROFILE: Free-text reviewer commentary and justification.';

COMMENT ON COLUMN public.claim_evidence_links.support_type IS
    'KEMS-SITE-PROFILE: Evidential support classification — DIRECT, PARTIAL, CONTEXTUAL, CONTRADICTORY, or OBSOLETE. Default DIRECT.';

-- ############################################################################
-- PART 15: GRANTS
-- ############################################################################

GRANT SELECT, INSERT ON public.evidence_authenticity_signals TO authenticated, service_role;
GRANT UPDATE, DELETE ON public.evidence_authenticity_signals TO service_role;

GRANT SELECT, INSERT ON public.evidence_entity_relationships TO authenticated, service_role;
GRANT UPDATE, DELETE ON public.evidence_entity_relationships TO service_role;

GRANT SELECT, INSERT ON public.evidence_conflicts TO authenticated, service_role;
GRANT UPDATE, DELETE ON public.evidence_conflicts TO service_role;

GRANT SELECT, INSERT ON public.evidence_review_events TO authenticated, service_role;
GRANT UPDATE, DELETE ON public.evidence_review_events TO service_role;

-- ############################################################################
-- END OF MIGRATION 095
-- ============================================================================
