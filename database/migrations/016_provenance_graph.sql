-- ============================================================================
-- KADARN PLATFORM — Provenance Graph (P0 Engine)
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Domain: Cross-entity lineage tracking — specimen → processing → shipment
--         → dataset, with supporting evidence links
-- Design: ADR-014 — Provenance Graph: Cross-Entity Lineage
-- Reference: KRM-RAO §2.6 (Provenance), §4.2 (Provenance Graph)
-- Dependencies: 008_organizations_capabilities.sql
--               015_operational_twins.sql (twin_events)
--
-- This migration creates the Provenance Graph storage layer.
-- The query logic lives in packages/provenance-graph/.
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE provenance_node_type AS ENUM (
        'specimen', 'aliquot', 'consent', 'protocol',
        'processing_event', 'qc_result', 'shipment',
        'temperature_log', 'receipt', 'dataset', 'document',
        'organization', 'program', 'access_request', 'policy_evaluation'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE provenance_edge_type AS ENUM (
        'derived_from',
        'authorized_by',
        'processed_by',
        'verified_by',
        'shipped_with',
        'linked_to',
        'generated_from',
        'requested_by',
        'approved_by',
        'owned_by'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: PROVENANCE NODES
-- ############################################################################

CREATE TABLE IF NOT EXISTS provenance_nodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_type       provenance_node_type NOT NULL,
    external_id     VARCHAR(255) NOT NULL,  -- ID in the source system/table
    label           VARCHAR(500),           -- Human-readable name
    properties      JSONB DEFAULT '{}'::jsonb,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Each external ID within a node type must be unique
    CONSTRAINT provenance_nodes_unique_external
        UNIQUE (node_type, external_id)
);

COMMENT ON TABLE provenance_nodes IS
    'Entities tracked in the Provenance Graph. Each node represents a real-world entity or event.';
COMMENT ON COLUMN provenance_nodes.external_id IS
    'The ID of this entity in its source table (e.g., specimen ID, shipment ID, consent ID).';

CREATE INDEX IF NOT EXISTS idx_provenance_nodes_type
    ON provenance_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_provenance_nodes_external
    ON provenance_nodes(node_type, external_id);
CREATE INDEX IF NOT EXISTS idx_provenance_nodes_org
    ON provenance_nodes(organization_id);

-- ############################################################################
-- PART 3: PROVENANCE EDGES
-- ############################################################################

CREATE TABLE IF NOT EXISTS provenance_edges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edge_type       provenance_edge_type NOT NULL,
    source_node_id  UUID NOT NULL REFERENCES provenance_nodes(id) ON DELETE CASCADE,
    target_node_id  UUID NOT NULL REFERENCES provenance_nodes(id) ON DELETE CASCADE,
    properties      JSONB DEFAULT '{}'::jsonb,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Each edge must be unique (no duplicate edges between same nodes)
    CONSTRAINT provenance_edges_unique
        UNIQUE (edge_type, source_node_id, target_node_id)
);

COMMENT ON TABLE provenance_edges IS
    'Directed, typed relationships between provenance nodes. Forms a DAG.';

CREATE INDEX IF NOT EXISTS idx_provenance_edges_source
    ON provenance_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_provenance_edges_target
    ON provenance_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_provenance_edges_type
    ON provenance_edges(edge_type);
CREATE INDEX IF NOT EXISTS idx_provenance_edges_source_type
    ON provenance_edges(source_node_id, edge_type);
CREATE INDEX IF NOT EXISTS idx_provenance_edges_target_type
    ON provenance_edges(target_node_id, edge_type);

-- ############################################################################
-- PART 4: PROVENANCE EVIDENCE
-- ############################################################################

CREATE TABLE IF NOT EXISTS provenance_evidence (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id         UUID NOT NULL REFERENCES provenance_nodes(id) ON DELETE CASCADE,
    evidence_type   VARCHAR(100) NOT NULL,  -- 'mta_pdf', 'temperature_log', 'qc_report', etc.
    reference       TEXT NOT NULL,           -- URL, file path, or external ID
    hash            TEXT,                    -- Content hash for integrity verification
    description     TEXT,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE provenance_evidence IS
    'Verifiable evidence linked to provenance nodes. Supports integrity checking.';

CREATE INDEX IF NOT EXISTS idx_provenance_evidence_node
    ON provenance_evidence(node_id);

-- ############################################################################
-- PART 5: ROW-LEVEL SECURITY
-- ############################################################################

ALTER TABLE provenance_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE provenance_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE provenance_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY provenance_nodes_select ON provenance_nodes
    FOR SELECT USING (
        organization_id IS NULL
        OR organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY provenance_nodes_insert ON provenance_nodes
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY provenance_nodes_update ON provenance_nodes
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY provenance_edges_select ON provenance_edges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM provenance_nodes n
            WHERE (n.id = provenance_edges.source_node_id OR n.id = provenance_edges.target_node_id)
            AND (n.organization_id IS NULL
                OR n.organization_id IN (
                    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
                ))
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY provenance_edges_insert ON provenance_edges
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY provenance_evidence_select ON provenance_evidence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM provenance_nodes n
            WHERE n.id = provenance_evidence.node_id
            AND (n.organization_id IS NULL
                OR n.organization_id IN (
                    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
                ))
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY provenance_evidence_insert ON provenance_evidence
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ############################################################################
-- PART 6: HELPER FUNCTIONS
-- ############################################################################

-- Ensure a provenance node exists (insert or return existing)
CREATE OR REPLACE FUNCTION ensure_provenance_node(
    p_node_type     provenance_node_type,
    p_external_id   VARCHAR(255),
    p_label         VARCHAR(500) DEFAULT NULL,
    p_properties    JSONB DEFAULT '{}'::jsonb,
    p_organization_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_node_id UUID;
BEGIN
    INSERT INTO provenance_nodes (node_type, external_id, label, properties, organization_id)
    VALUES (p_node_type, p_external_id, p_label, p_properties, p_organization_id)
    ON CONFLICT (node_type, external_id) DO UPDATE SET
        label = COALESCE(p_label, provenance_nodes.label),
        properties = CASE
            WHEN p_properties = '{}'::jsonb THEN provenance_nodes.properties
            ELSE provenance_nodes.properties || p_properties
        END,
        recorded_at = now()
    RETURNING id INTO v_node_id;

    RETURN v_node_id;
END;
$$;

-- Create a provenance edge (idempotent)
CREATE OR REPLACE FUNCTION ensure_provenance_edge(
    p_edge_type       provenance_edge_type,
    p_source_node_id  UUID,
    p_target_node_id  UUID,
    p_properties      JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_edge_id UUID;
BEGIN
    INSERT INTO provenance_edges (edge_type, source_node_id, target_node_id, properties)
    VALUES (p_edge_type, p_source_node_id, p_target_node_id, p_properties)
    ON CONFLICT (edge_type, source_node_id, target_node_id) DO NOTHING
    RETURNING id INTO v_edge_id;

    RETURN v_edge_id;
END;
$$;
