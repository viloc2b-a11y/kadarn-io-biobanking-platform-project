-- ==========================================================================
-- Kadarn Provenance Engine — Append-Only DB Trigger Verification
-- ==========================================================================
-- KAA-003 Section 12: Provenance records are append-only by design.
--
-- These tests verify the DB-level enforcement from migration 032.
-- They require a running Supabase local instance.
--
-- To run against a local Supabase instance:
--   1. supabase start
--   2. psql "$SUPABASE_DB_URL" -f tests/provenance/provenance-append-only-triggers.sql
--
-- Expected: all statements succeed (no errors raised).
-- ==========================================================================

BEGIN;
SELECT plan(4);

-- --------------------------------------------------------------------------
-- Test 1: UPDATE on provenance_nodes is blocked
-- --------------------------------------------------------------------------
PREPARE update_node_blocked AS
  UPDATE provenance_nodes
  SET label = 'mutated'
  WHERE id = (SELECT id FROM provenance_nodes LIMIT 1);

SELECT throws_ok(
  'update_node_blocked',
  'restrict_violation',
  'provenance_nodes is append-only',
  'UPDATE provenance_nodes must raise restrict_violation'
);

-- --------------------------------------------------------------------------
-- Test 2: DELETE on provenance_nodes is blocked
-- --------------------------------------------------------------------------
PREPARE delete_node_blocked AS
  DELETE FROM provenance_nodes
  WHERE id = (SELECT id FROM provenance_nodes LIMIT 1);

SELECT throws_ok(
  'delete_node_blocked',
  'restrict_violation',
  'provenance_nodes is append-only',
  'DELETE provenance_nodes must raise restrict_violation'
);

-- --------------------------------------------------------------------------
-- Test 3: UPDATE on provenance_edges is blocked
-- --------------------------------------------------------------------------
PREPARE update_edge_blocked AS
  UPDATE provenance_edges
  SET properties = '{"mutated": true}'
  WHERE id = (SELECT id FROM provenance_edges LIMIT 1);

SELECT throws_ok(
  'update_edge_blocked',
  'restrict_violation',
  'provenance_edges is append-only',
  'UPDATE provenance_edges must raise restrict_violation'
);

-- --------------------------------------------------------------------------
-- Test 4: DELETE on provenance_edges is blocked
-- --------------------------------------------------------------------------
PREPARE delete_edge_blocked AS
  DELETE FROM provenance_edges
  WHERE id = (SELECT id FROM provenance_edges LIMIT 1);

SELECT throws_ok(
  'delete_edge_blocked',
  'restrict_violation',
  'provenance_edges is append-only',
  'DELETE provenance_edges must raise restrict_violation'
);

-- --------------------------------------------------------------------------
-- Finish
-- --------------------------------------------------------------------------
SELECT * FROM finish();
ROLLBACK;
