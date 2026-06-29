-- ============================================================================
-- KADARN PLATFORM — Sprint 5: Provenance node types for critical operations
-- ============================================================================
-- Extends provenance_node_type enum so helper node types persist via
-- upsert_provenance_node without RPC rejection.
-- Depends on: 025_provenance_graph.sql, 032_provenance_append_only.sql
-- ============================================================================

ALTER TYPE provenance_node_type ADD VALUE IF NOT EXISTS 'feasibility_assessment';
ALTER TYPE provenance_node_type ADD VALUE IF NOT EXISTS 'exchange_deal';
ALTER TYPE provenance_node_type ADD VALUE IF NOT EXISTS 'settlement';
ALTER TYPE provenance_node_type ADD VALUE IF NOT EXISTS 'workflow_activity';
ALTER TYPE provenance_node_type ADD VALUE IF NOT EXISTS 'twin_event';
