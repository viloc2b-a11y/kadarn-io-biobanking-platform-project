-- ============================================================================
-- KADARN PLATFORM — Extend visibility_scope for evidence-core
-- ============================================================================
-- Migration 008 creates visibility_scope with values:
--   'organization', 'program', 'network', 'public'
-- Evidence-core needs additional values: 'site', 'sponsor_authorized', 'system'.
-- This file runs in its OWN transaction (separate migration file), so
-- ALTER TYPE ... ADD VALUE works without triggering PostgreSQL error 55P04.
-- Requires PostgreSQL 17+ for ADD VALUE IF NOT EXISTS.
-- ============================================================================

ALTER TYPE visibility_scope ADD VALUE IF NOT EXISTS 'site';
ALTER TYPE visibility_scope ADD VALUE IF NOT EXISTS 'sponsor_authorized';
ALTER TYPE visibility_scope ADD VALUE IF NOT EXISTS 'system';
