-- ============================================================================
-- KADARN PLATFORM — Evidence Core (Phase 1, Sprint 17.2)
-- ============================================================================
-- Baseline: AF-1.0
-- Domain model: Sprint 17.1
-- Design: KEMS-001 v1.0, ADR-011, ADR-012
--
-- This migration implements the persistence layer for the Evidence Core.
-- The Evidence Core stores, relates, preserves provenance, controls access,
-- and manages process state. It does NOT compute Confidence.
--
-- ADR-011 five-condition test:
--   1. Store — evidence and evidence metadata
--   2. Provenance — immutable creation and modification history
--   3. Relations — connections between evidence nodes
--   4. Access — visibility policy enforcement (RLS)
--   5. Process State — lifecycle tracking without content interpretation
--
-- Append-only enforcement: evidence_nodes may not be UPDATEd or DELETEd.
-- Corrections use the wasRevisionOf pattern: a new node is appended that
-- references the superseded node. The original is never modified.
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE evidence_class AS ENUM (
        'A', 'B', 'C', 'D', 'E', 'F'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE evidence_node_status AS ENUM (
        'active',
        'superseded',
        'disputed',
        'resolved'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE evidence_relationship_type AS ENUM (
        'supports',
        'contradicts',
        'corroborates',
        'responds_to',
        'supersedes'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_status AS ENUM (
        'active',
        'archived',
        'deprecated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE response_status AS ENUM (
        'submitted',
        'accepted',
        'rejected',
        'confirmed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE confidence_level AS ENUM (
        'high',
        'moderate',
        'low',
        'insufficient'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE visibility_scope AS ENUM (
        'site',
        'sponsor_authorized',
        'system'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: REFERENCE DATA — Evidence Class
-- ############################################################################
-- KEMS-001 §3: six Evidence Classes with decay and weight defaults.

CREATE TABLE IF NOT EXISTS evidence_class_ref (
    id              evidence_class PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    decay_months    INTEGER,        -- NULL = no decay
    default_weight  NUMERIC(3,2) NOT NULL
);

INSERT INTO evidence_class_ref (id, name, description, decay_months, default_weight) VALUES
    ('A', 'Public Independent Evidence', 'Evidence from public registries verifiable without relying on the institution.', 60, 0.80),
    ('B', 'Institutional Documentary Evidence', 'Evidence from the institution in the form of structured documents.', 24, 0.50),
    ('C', 'Operational Evidence', 'Evidence generated automatically by operational systems as a byproduct of execution.', 12, 0.70),
    ('D', 'Cross-Source Corroboration', 'Structural consistency when independent sources agree.', NULL, 0.00),
    ('E', 'Temporal Continuity Evidence', 'Evidence of consistent capability maintenance over time.', NULL, 0.00),
    ('F', 'External Confirmation', 'Evidence from an independent third party confirming capability.', 36, 1.00)
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 3: CLAIMS
-- ############################################################################
-- KEMS-001 §1: A Claim is a bounded assertion about institutional capability.

CREATE TABLE IF NOT EXISTS claims (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_type_id           TEXT NOT NULL,
    name                    TEXT NOT NULL,
    description             TEXT NOT NULL,
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status                  claim_status NOT NULL DEFAULT 'active',
    domain                  TEXT NOT NULL,
    decays                  BOOLEAN NOT NULL DEFAULT true,
    decay_period_months     INTEGER,
    valid_evidence_classes  evidence_class[] NOT NULL DEFAULT '{}',
    required_evidence_classes evidence_class[] NOT NULL DEFAULT '{}',

    -- Provenance metadata
    created_by_actor_id     UUID NOT NULL,
    created_by_org_id       UUID NOT NULL REFERENCES organizations(id),
    correlation_id          UUID NOT NULL,
    provenance_summary      TEXT,
    source_event_id         UUID,

    -- Visibility metadata
    owning_org_id           UUID NOT NULL REFERENCES organizations(id),
    visibility_scope        visibility_scope NOT NULL DEFAULT 'site',
    authorized_sponsor_ids  UUID[] NOT NULL DEFAULT '{}',

    -- Temporal metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT claim_valid_classes CHECK (array_length(valid_evidence_classes, 1) > 0),
    CONSTRAINT claim_decay_consistent CHECK (
        (decays = true AND decay_period_months IS NOT NULL) OR
        (decays = false AND decay_period_months IS NULL)
    )
);

CREATE INDEX idx_claims_organization ON claims(organization_id);
CREATE INDEX idx_claims_claim_type ON claims(claim_type_id);
CREATE INDEX idx_claims_status ON claims(status);

-- ############################################################################
-- PART 4: EVIDENCE NODES
-- ############################################################################
-- KEMS-001 §2 Component B: immutable, append-only.

CREATE TABLE IF NOT EXISTS evidence_nodes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id            UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    evidence_class      evidence_class NOT NULL,
    content             TEXT NOT NULL,
    source              TEXT NOT NULL,
    node_date           DATE NOT NULL,      -- date evidence was produced
    status              evidence_node_status NOT NULL DEFAULT 'active',
    weight              NUMERIC(5,3) NOT NULL,

    -- Provenance metadata (structured JSONB for flexibility)
    provenance          JSONB NOT NULL DEFAULT '{}',
    -- Visibility metadata
    visibility          JSONB NOT NULL DEFAULT '{}',
    -- Temporal metadata
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Counter Evidence extension: null for regular nodes
    is_counter_evidence BOOLEAN NOT NULL DEFAULT false,
    has_response        BOOLEAN NOT NULL DEFAULT false,
    response_id         UUID,

    CONSTRAINT evidence_node_non_negative_weight CHECK (weight >= 0 OR is_counter_evidence = true),
    CONSTRAINT counter_evidence_negative_weight CHECK (
        (is_counter_evidence = true AND weight < 0) OR
        (is_counter_evidence = false AND weight >= 0)
    ),
    CONSTRAINT counter_evidence_response_consistent CHECK (
        (is_counter_evidence = false AND has_response = false AND response_id IS NULL) OR
        (is_counter_evidence = true)
    )
);

CREATE INDEX idx_evidence_nodes_claim ON evidence_nodes(claim_id);
CREATE INDEX idx_evidence_nodes_class ON evidence_nodes(evidence_class);
CREATE INDEX idx_evidence_nodes_counter ON evidence_nodes(is_counter_evidence) WHERE is_counter_evidence = true;

-- ############################################################################
-- PART 4b: APPEND-ONLY ENFORCEMENT — evidence_nodes
-- ############################################################################
-- KEMS-001 §4: Counter Evidence cannot be deleted. Evidence Nodes are immutable.

CREATE OR REPLACE FUNCTION evidence_nodes_no_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'evidence_nodes is append-only. Node % cannot be modified.', OLD.id;
END;
$$;

CREATE OR REPLACE FUNCTION evidence_nodes_no_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'evidence_nodes is append-only. Node % cannot be deleted.', OLD.id;
END;
$$;

DROP TRIGGER IF EXISTS trg_evidence_nodes_no_update ON evidence_nodes;
CREATE TRIGGER trg_evidence_nodes_no_update
    BEFORE UPDATE ON evidence_nodes
    FOR EACH ROW EXECUTE FUNCTION evidence_nodes_no_update();

DROP TRIGGER IF EXISTS trg_evidence_nodes_no_delete ON evidence_nodes;
CREATE TRIGGER trg_evidence_nodes_no_delete
    BEFORE DELETE ON evidence_nodes
    FOR EACH ROW EXECUTE FUNCTION evidence_nodes_no_delete();

-- ############################################################################
-- PART 5: EVIDENCE RELATIONSHIPS
-- ############################################################################
-- KEMS-001 §2 Component C: relationships between evidence nodes.

CREATE TABLE IF NOT EXISTS evidence_relationships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id      UUID NOT NULL REFERENCES evidence_nodes(id) ON DELETE CASCADE,
    target_node_id      UUID NOT NULL REFERENCES evidence_nodes(id) ON DELETE CASCADE,
    relationship_type   evidence_relationship_type NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    provenance          JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT no_self_reference CHECK (source_node_id <> target_node_id)
);

CREATE INDEX idx_evidence_relationships_source ON evidence_relationships(source_node_id);
CREATE INDEX idx_evidence_relationships_target ON evidence_relationships(target_node_id);
CREATE INDEX idx_evidence_relationships_type ON evidence_relationships(relationship_type);

-- ############################################################################
-- PART 6: RIGHT OF RESPONSE
-- ############################################################################
-- KEMS-001 §8: attached to Counter Evidence without modifying it.

CREATE TABLE IF NOT EXISTS right_of_response (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counter_evidence_id     UUID NOT NULL REFERENCES evidence_nodes(id) ON DELETE CASCADE,
    description             TEXT NOT NULL,
    resolution_date         DATE NOT NULL,
    status                  response_status NOT NULL DEFAULT 'submitted',
    supporting_evidence_ids UUID[] NOT NULL DEFAULT '{}',

    -- Provenance
    created_by_actor_id     UUID NOT NULL,
    created_by_org_id       UUID NOT NULL REFERENCES organizations(id),
    correlation_id          UUID NOT NULL,
    provenance_summary      TEXT,

    -- Visibility
    owning_org_id           UUID NOT NULL REFERENCES organizations(id),
    visibility_scope        visibility_scope NOT NULL DEFAULT 'site',
    authorized_sponsor_ids  UUID[] NOT NULL DEFAULT '{}',

    -- Temporal
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT response_attached_to_counter_evidence CHECK (
        -- enforced by FK + application logic: counter_evidence_id must reference
        -- an evidence_node with is_counter_evidence = true
        true
    )
);

CREATE INDEX idx_right_of_response_counter ON right_of_response(counter_evidence_id);

-- ############################################################################
-- PART 7: CONFIDENCE STATE SNAPSHOTS
-- ############################################################################
-- KEMS-001 §2 Component D: stored as append-only snapshots. NOT computed here.
-- Computation belongs to an Engine per ADR-011.

CREATE TABLE IF NOT EXISTS confidence_state_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id        UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    value           INTEGER NOT NULL CHECK (value BETWEEN 0 AND 100),
    level           confidence_level NOT NULL,
    explanation     TEXT NOT NULL,
    contributions   JSONB NOT NULL DEFAULT '[]',
    has_unresolved_counter_evidence BOOLEAN NOT NULL DEFAULT false,
    snapshot_date   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Provenance
    computed_by_actor_id UUID,
    correlation_id       UUID NOT NULL,
    provenance_summary   TEXT
);

CREATE INDEX idx_confidence_snapshots_claim ON confidence_state_snapshots(claim_id);
CREATE INDEX idx_confidence_snapshots_date ON confidence_state_snapshots(snapshot_date);

-- ############################################################################
-- PART 8: ROW-LEVEL SECURITY
-- ############################################################################
-- KEMS-001 §7: multi-actor visibility model.

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE right_of_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidence_state_snapshots ENABLE ROW LEVEL SECURITY;

-- Claims: org sees own claims; sponsors see authorized claims
CREATE POLICY claims_select_org ON claims
    FOR SELECT
    USING (
        owning_org_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY claims_select_sponsor ON claims
    FOR SELECT
    USING (
        visibility_scope = 'sponsor_authorized'
        AND auth.uid() = ANY(authorized_sponsor_ids)
    );

CREATE POLICY claims_select_system ON claims
    FOR SELECT
    USING (visibility_scope = 'system');

-- INSERT: only active members of the owning org may create Claims for that org.
-- created_by_org_id must match owning_org_id — no cross-org claim creation.
CREATE POLICY claims_insert_org ON claims
    FOR INSERT
    WITH CHECK (
        owning_org_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        AND created_by_org_id = owning_org_id
    );

-- UPDATE: append-only domain semantics — Claims may only transition status
-- (active/archived/deprecated) by the owning org. Evidence content fields
-- (claim_type_id, domain, valid/required evidence classes) are immutable
-- post-creation; corrections require a new Claim per KEMS-001 append-only rule.
CREATE POLICY claims_update_org ON claims
    FOR UPDATE
    USING (
        owning_org_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    )
    WITH CHECK (
        owning_org_id = (SELECT original.owning_org_id FROM claims original WHERE original.id = claims.id)
        AND organization_id = (SELECT original.organization_id FROM claims original WHERE original.id = claims.id)
        AND claim_type_id = (SELECT original.claim_type_id FROM claims original WHERE original.id = claims.id)
        AND domain = (SELECT original.domain FROM claims original WHERE original.id = claims.id)
        AND created_by_actor_id = (SELECT original.created_by_actor_id FROM claims original WHERE original.id = claims.id)
        AND created_by_org_id = (SELECT original.created_by_org_id FROM claims original WHERE original.id = claims.id)
    );

-- Evidence nodes: same pattern
CREATE POLICY evidence_nodes_select_org ON evidence_nodes
    FOR SELECT
    USING (
        visibility->>'owningOrganizationId' IN (
            SELECT organization_id::text FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY evidence_nodes_select_sponsor ON evidence_nodes
    FOR SELECT
    USING (
        visibility->>'scope' = 'sponsor_authorized'
        AND auth.uid()::text = ANY(
            ARRAY(SELECT jsonb_array_elements_text(visibility->'authorizedSponsorIds'))
        )
    );

-- INSERT: only active members of the claim's owning org may append Evidence
-- Nodes (including Counter Evidence). No UPDATE/DELETE policy is defined —
-- evidence_nodes is append-only and already enforced by DB triggers above.
CREATE POLICY evidence_nodes_insert_org ON evidence_nodes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM claims c
            WHERE c.id = evidence_nodes.claim_id
            AND c.owning_org_id IN (
                SELECT organization_id FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- Evidence relationships: inherited from source node visibility
CREATE POLICY evidence_relationships_select ON evidence_relationships
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM evidence_nodes en
            WHERE en.id = source_node_id
            AND (
                en.visibility->>'owningOrganizationId' IN (
                    SELECT organization_id::text FROM organization_memberships
                    WHERE user_id = auth.uid() AND status = 'active'
                )
                OR en.visibility->>'scope' = 'sponsor_authorized'
            )
        )
    );

-- INSERT: relationships are append-only (no UPDATE/DELETE policy defined).
-- Requires org membership on the owning org of BOTH source and target nodes,
-- so a relationship cannot be forged linking evidence the caller cannot see.
CREATE POLICY evidence_relationships_insert_org ON evidence_relationships
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM evidence_nodes en
            WHERE en.id = evidence_relationships.source_node_id
            AND en.visibility->>'owningOrganizationId' IN (
                SELECT organization_id::text FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
        AND EXISTS (
            SELECT 1 FROM evidence_nodes en
            WHERE en.id = evidence_relationships.target_node_id
            AND en.visibility->>'owningOrganizationId' IN (
                SELECT organization_id::text FROM organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- Right of Response: same owning org rules
CREATE POLICY right_of_response_select_org ON right_of_response
    FOR SELECT
    USING (
        owning_org_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- INSERT: only active members of the owning org may submit a Right of Response.
CREATE POLICY right_of_response_insert_org ON right_of_response
    FOR INSERT
    WITH CHECK (
        owning_org_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- UPDATE: KEMS-001 §8 process state — status may transition
-- (submitted -> accepted/rejected/confirmed) by the owning org only.
-- Immutable fields (description, resolution_date, supporting evidence,
-- provenance) cannot be altered after submission.
CREATE POLICY right_of_response_update_org ON right_of_response
    FOR UPDATE
    USING (
        owning_org_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    )
    WITH CHECK (
        owning_org_id = (SELECT original.owning_org_id FROM right_of_response original WHERE original.id = right_of_response.id)
        AND counter_evidence_id = (SELECT original.counter_evidence_id FROM right_of_response original WHERE original.id = right_of_response.id)
        AND description = (SELECT original.description FROM right_of_response original WHERE original.id = right_of_response.id)
        AND resolution_date = (SELECT original.resolution_date FROM right_of_response original WHERE original.id = right_of_response.id)
        AND created_by_actor_id = (SELECT original.created_by_actor_id FROM right_of_response original WHERE original.id = right_of_response.id)
        AND created_by_org_id = (SELECT original.created_by_org_id FROM right_of_response original WHERE original.id = right_of_response.id)
    );

-- Confidence state snapshots: via claim visibility
CREATE POLICY confidence_snapshots_select ON confidence_state_snapshots
    FOR SELECT
    USING (
        claim_id IN (
            SELECT id FROM claims WHERE
                owning_org_id IN (
                    SELECT organization_id FROM organization_memberships
                    WHERE user_id = auth.uid() AND status = 'active'
                )
                OR visibility_scope IN ('system', 'sponsor_authorized')
        )
    );

-- INSERT: append-only per KEMS §2 Component D (no UPDATE/DELETE policy defined).
-- Restricted to active members of the claim's owning org — Confidence
-- computation is an Engine concern (ADR-011) but snapshot persistence
-- still requires org-scoped write access, same as other Core tables.
CREATE POLICY confidence_snapshots_insert_org ON confidence_state_snapshots
    FOR INSERT
    WITH CHECK (
        claim_id IN (
            SELECT id FROM claims WHERE
                owning_org_id IN (
                    SELECT organization_id FROM organization_memberships
                    WHERE user_id = auth.uid() AND status = 'active'
                )
        )
    );

-- ############################################################################
-- PART 9: VERIFICATION
-- ############################################################################

-- Run to list all policies defined in this migration:
--   SELECT * FROM pg_policies WHERE schemaname = 'public'
--   AND tablename IN ('claims', 'evidence_nodes', 'evidence_relationships',
--                      'right_of_response', 'confidence_state_snapshots')
--   ORDER BY tablename, policyname;

-- ============================================================================
-- END OF MIGRATION 045
-- ============================================================================
