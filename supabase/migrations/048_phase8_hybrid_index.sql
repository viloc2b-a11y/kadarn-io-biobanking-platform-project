-- ============================================================================
-- Phase 8 Sprint 28K — Hybrid indexing (ADR-032)
-- ============================================================================

CREATE TABLE IF NOT EXISTS phase8_materialized_edges (
    edge_id             TEXT PRIMARY KEY,
    from_type           TEXT NOT NULL,
    from_id             TEXT NOT NULL,
    to_type             TEXT NOT NULL,
    to_id               TEXT NOT NULL,
    relationship        TEXT NOT NULL,
    weight              NUMERIC NOT NULL DEFAULT 1,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mat_edges_from ON phase8_materialized_edges(from_id, relationship);
CREATE INDEX IF NOT EXISTS idx_mat_edges_to ON phase8_materialized_edges(to_id, relationship);
CREATE INDEX IF NOT EXISTS idx_mat_edges_rel ON phase8_materialized_edges(relationship);

CREATE INDEX IF NOT EXISTS idx_published_views_projection_gin ON phase8_published_views USING gin (projection);

COMMENT ON TABLE phase8_materialized_edges IS 'Phase 8 hybrid graph index — PostgreSQL only, no Graph DB';
