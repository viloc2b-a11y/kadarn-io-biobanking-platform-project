-- ============================================================================
-- KADARN PLATFORM — Provenance Append-Only Enforcement
-- ============================================================================
-- Depends on: 025_provenance_graph.sql
-- KAA: KAA-003 (W3C PROV Provenance Engine), Section 12
--
-- Provenance records are append-only by design. This is not a technical
-- preference — it is a regulatory requirement. A chain of custody that can
-- be retroactively modified is not a chain of custody.
--
-- This migration enforces that constraint at the database level so that no
-- application bug, migration mistake, or direct DB access can violate it.
--
-- Corrections use the wasRevisionOf pattern: a new node is appended that
-- references the incorrect node. The original is never modified.
-- ============================================================================

-- ############################################################################
-- PART 1: APPEND-ONLY TRIGGERS
-- ############################################################################

-- Block UPDATE on provenance_nodes
CREATE OR REPLACE FUNCTION provenance_nodes_no_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'provenance_nodes is append-only. To correct a record, append a new node '
        'with node_type = ''correction'' and link it via a derived_from edge to '
        'the node being corrected. Original node id: %', OLD.id
        USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_provenance_nodes_no_update ON provenance_nodes;
CREATE TRIGGER trg_provenance_nodes_no_update
    BEFORE UPDATE ON provenance_nodes
    FOR EACH ROW
    EXECUTE FUNCTION provenance_nodes_no_update();

-- Block DELETE on provenance_nodes
CREATE OR REPLACE FUNCTION provenance_nodes_no_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'provenance_nodes is append-only. Provenance records cannot be deleted. '
        'Original node id: %', OLD.id
        USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_provenance_nodes_no_delete ON provenance_nodes;
CREATE TRIGGER trg_provenance_nodes_no_delete
    BEFORE DELETE ON provenance_nodes
    FOR EACH ROW
    EXECUTE FUNCTION provenance_nodes_no_delete();

-- Block UPDATE on provenance_edges
CREATE OR REPLACE FUNCTION provenance_edges_no_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'provenance_edges is append-only. Edge id: %', OLD.id
        USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_provenance_edges_no_update ON provenance_edges;
CREATE TRIGGER trg_provenance_edges_no_update
    BEFORE UPDATE ON provenance_edges
    FOR EACH ROW
    EXECUTE FUNCTION provenance_edges_no_update();

-- Block DELETE on provenance_edges
CREATE OR REPLACE FUNCTION provenance_edges_no_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'provenance_edges is append-only. Edge id: %', OLD.id
        USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_provenance_edges_no_delete ON provenance_edges;
CREATE TRIGGER trg_provenance_edges_no_delete
    BEFORE DELETE ON provenance_edges
    FOR EACH ROW
    EXECUTE FUNCTION provenance_edges_no_delete();

-- Block UPDATE on provenance_evidence
CREATE OR REPLACE FUNCTION provenance_evidence_no_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'provenance_evidence is append-only. Evidence id: %', OLD.id
        USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_provenance_evidence_no_update ON provenance_evidence;
CREATE TRIGGER trg_provenance_evidence_no_update
    BEFORE UPDATE ON provenance_evidence
    FOR EACH ROW
    EXECUTE FUNCTION provenance_evidence_no_update();

-- Block DELETE on provenance_evidence
CREATE OR REPLACE FUNCTION provenance_evidence_no_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'provenance_evidence is append-only. Evidence id: %', OLD.id
        USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_provenance_evidence_no_delete ON provenance_evidence;
CREATE TRIGGER trg_provenance_evidence_no_delete
    BEFORE DELETE ON provenance_evidence
    FOR EACH ROW
    EXECUTE FUNCTION provenance_evidence_no_delete();

-- ############################################################################
-- PART 2: REPLACE ensure_provenance_node WITH APPEND-ONLY VERSION
-- ############################################################################

-- The original ensure_provenance_node used ON CONFLICT DO UPDATE, which
-- mutates existing nodes. This violates the append-only constraint now
-- enforced above. The new version uses ON CONFLICT DO NOTHING and returns
-- the existing id without modification.
--
-- Callers that need to update a node must instead:
--   1. Call upsert_provenance_node (below) which uses the correction pattern
--   2. Or insert a new correction node manually

CREATE OR REPLACE FUNCTION ensure_provenance_node(
    p_node_type       provenance_node_type,
    p_external_id     VARCHAR(255),
    p_label           VARCHAR(500)  DEFAULT NULL,
    p_properties      JSONB         DEFAULT '{}'::jsonb,
    p_organization_id UUID          DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_node_id UUID;
BEGIN
    INSERT INTO provenance_nodes (node_type, external_id, label, properties, organization_id)
    VALUES (p_node_type, p_external_id, p_label, p_properties, p_organization_id)
    ON CONFLICT (node_type, external_id) DO NOTHING
    RETURNING id INTO v_node_id;

    -- If the node already existed, return its id
    IF v_node_id IS NULL THEN
        SELECT id INTO v_node_id
        FROM provenance_nodes
        WHERE node_type = p_node_type AND external_id = p_external_id;
    END IF;

    RETURN v_node_id;
END;
$$;

-- ############################################################################
-- PART 3: upsert_provenance_node — CORRECTION PATTERN
-- ############################################################################

-- Used by the POST /api/v1/operations/provenance route when a node needs to
-- be "updated." Instead of mutating, appends a new node linked via derived_from.
-- Returns the id of the new correction node (not the original).

CREATE OR REPLACE FUNCTION upsert_provenance_node(
    p_node_type       provenance_node_type,
    p_external_id     VARCHAR(255),
    p_label           VARCHAR(500)  DEFAULT NULL,
    p_properties      JSONB         DEFAULT '{}'::jsonb,
    p_organization_id UUID          DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_id UUID;
    v_new_id      UUID;
BEGIN
    SELECT id INTO v_existing_id
    FROM provenance_nodes
    WHERE node_type = p_node_type AND external_id = p_external_id;

    IF v_existing_id IS NULL THEN
        -- First time: plain insert
        INSERT INTO provenance_nodes (node_type, external_id, label, properties, organization_id)
        VALUES (p_node_type, p_external_id, p_label, p_properties, p_organization_id)
        RETURNING id INTO v_new_id;
        RETURN v_new_id;
    ELSE
        -- Subsequent call: correction pattern
        -- Insert a new node with the corrected data
        INSERT INTO provenance_nodes (
            node_type, external_id, label, properties, organization_id
        ) VALUES (
            p_node_type,
            p_external_id || ':correction:' || extract(epoch from now())::bigint,
            COALESCE(p_label, ''),
            p_properties || jsonb_build_object(
                'correction_of', v_existing_id,
                'corrected_at', now()
            ),
            p_organization_id
        )
        RETURNING id INTO v_new_id;

        -- Link via derived_from edge (wasRevisionOf semantic)
        INSERT INTO provenance_edges (edge_type, source_node_id, target_node_id, properties)
        VALUES (
            'derived_from',
            v_new_id,
            v_existing_id,
            '{"relation": "wasRevisionOf"}'::jsonb
        )
        ON CONFLICT (edge_type, source_node_id, target_node_id) DO NOTHING;

        RETURN v_new_id;
    END IF;
END;
$$;

-- ############################################################################
-- PART 4: integrity_status FUNCTION
-- ############################################################################

-- Computes the integrity status of a node at query time.
-- Called by the provenance API route — not stored as a column to avoid
-- the temptation to UPDATE it.
--
-- Values:
--   'complete'         — has evidence AND has at least one edge
--   'warning'          — has evidence but no edges (isolated node)
--   'missing_evidence' — critical node type with no supporting evidence

CREATE OR REPLACE FUNCTION provenance_node_integrity_status(
    p_node_id   UUID,
    p_node_type provenance_node_type
) RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_evidence_count INTEGER;
    v_edge_count     INTEGER;
    v_critical_types provenance_node_type[] := ARRAY[
        'specimen'::provenance_node_type,
        'aliquot'::provenance_node_type,
        'consent'::provenance_node_type,
        'shipment'::provenance_node_type
    ];
BEGIN
    SELECT COUNT(*) INTO v_evidence_count
    FROM provenance_evidence
    WHERE node_id = p_node_id;

    SELECT COUNT(*) INTO v_edge_count
    FROM provenance_edges
    WHERE source_node_id = p_node_id OR target_node_id = p_node_id;

    IF v_evidence_count = 0 AND p_node_type = ANY(v_critical_types) THEN
        RETURN 'missing_evidence';
    END IF;

    IF v_edge_count = 0 THEN
        RETURN 'warning';
    END IF;

    RETURN 'complete';
END;
$$;

-- ############################################################################
-- PART 5: BATCH integrity_status FOR API EFFICIENCY
-- ############################################################################

-- Called by GET /api/v1/operations/provenance to avoid N individual RPC calls.
-- Returns one row per node id with its computed integrity_status.

CREATE OR REPLACE FUNCTION provenance_node_integrity_status_batch(
    p_node_ids UUID[]
) RETURNS TABLE(node_id UUID, integrity_status TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_critical_types provenance_node_type[] := ARRAY[
        'specimen'::provenance_node_type,
        'aliquot'::provenance_node_type,
        'consent'::provenance_node_type,
        'shipment'::provenance_node_type
    ];
BEGIN
    RETURN QUERY
    SELECT
        n.id AS node_id,
        CASE
            WHEN COUNT(ev.id) = 0 AND n.node_type = ANY(v_critical_types) THEN 'missing_evidence'
            WHEN COUNT(e.id) = 0                                           THEN 'warning'
            ELSE                                                                'complete'
        END AS integrity_status
    FROM provenance_nodes n
    LEFT JOIN provenance_evidence ev ON ev.node_id = n.id
    LEFT JOIN provenance_edges    e  ON e.source_node_id = n.id OR e.target_node_id = n.id
    WHERE n.id = ANY(p_node_ids)
    GROUP BY n.id, n.node_type;
END;
$$;

-- ############################################################################
-- PART 6: VERIFY — confirm triggers are in place
-- ############################################################################

DO $$
DECLARE
    v_trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%provenance%'
    AND event_manipulation IN ('UPDATE', 'DELETE');

    IF v_trigger_count < 6 THEN
        RAISE EXCEPTION 'Expected 6 provenance append-only triggers, found %', v_trigger_count;
    END IF;

    RAISE NOTICE 'Provenance append-only enforcement: % triggers confirmed', v_trigger_count;
END;
$$;
