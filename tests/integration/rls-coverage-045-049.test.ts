// ==========================================================================
// Security fix regression — RLS coverage for migrations 045-049
// ==========================================================================
// Follows the source-string-assertion convention used by
// tests/integration/schema-hardening.test.ts (no live Supabase required).
//
// Covers:
//   - Finding 1: migration 045 (Evidence Core) had SELECT-only RLS policies;
//     INSERT/UPDATE policies were missing, so every write through the
//     RLS-enforced anon-key client was rejected.
//   - Finding 3: migrations 046-049 (Discovery) had ZERO RLS at all.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function readMigration(fileName: string): string {
  const path = resolve(root, 'database/migrations', fileName)
  return readFileSync(path, 'utf-8')
}

describe('Migration 045 (Evidence Core) — INSERT/UPDATE RLS policies', () => {
  const source = readMigration('045_evidence_core.sql')

  it('is synced between database/migrations and supabase/migrations', () => {
    const dbPath = resolve(root, 'database/migrations/045_evidence_core.sql')
    const sbPath = resolve(root, 'supabase/migrations/045_evidence_core.sql')
    expect(existsSync(dbPath)).toBe(true)
    expect(existsSync(sbPath)).toBe(true)
    expect(readFileSync(sbPath, 'utf-8')).toBe(readFileSync(dbPath, 'utf-8'))
  })

  it('enables RLS on all five Evidence Core tables', () => {
    for (const table of ['claims', 'evidence_nodes', 'evidence_relationships', 'right_of_response', 'confidence_state_snapshots']) {
      expect(source).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`)
    }
  })

  it('defines an INSERT policy for claims, org-scoped via organization_memberships', () => {
    expect(source).toMatch(/CREATE POLICY claims_insert_org ON claims\s+FOR INSERT/)
    expect(source).toContain('created_by_org_id = owning_org_id')
  })

  it('defines an INSERT policy for evidence_nodes (append-only — no UPDATE policy)', () => {
    expect(source).toMatch(/CREATE POLICY evidence_nodes_insert_org ON evidence_nodes\s+FOR INSERT/)
    expect(source).not.toMatch(/CREATE POLICY evidence_nodes_update/)
  })

  it('defines an INSERT policy for evidence_relationships requiring org membership on both source and target nodes', () => {
    expect(source).toMatch(/CREATE POLICY evidence_relationships_insert_org ON evidence_relationships\s+FOR INSERT/)
    expect(source).toContain('evidence_relationships.source_node_id')
    expect(source).toContain('evidence_relationships.target_node_id')
  })

  it('defines INSERT and UPDATE policies for right_of_response', () => {
    expect(source).toMatch(/CREATE POLICY right_of_response_insert_org ON right_of_response\s+FOR INSERT/)
    expect(source).toMatch(/CREATE POLICY right_of_response_update_org ON right_of_response\s+FOR UPDATE/)
  })

  it('defines an INSERT policy for confidence_state_snapshots (append-only — no UPDATE policy)', () => {
    expect(source).toMatch(/CREATE POLICY confidence_snapshots_insert_org ON confidence_state_snapshots\s+FOR INSERT/)
    expect(source).not.toMatch(/CREATE POLICY confidence_snapshots_update/)
  })
})

describe('Migrations 046-049 (Discovery) — RLS was completely missing', () => {
  it('046_discovery_core.sql enables RLS on every discovery table it creates', () => {
    const source = readMigration('046_discovery_core.sql')
    for (const table of [
      'discovery_sessions',
      'discovery_runs',
      'discovery_artifacts',
      'discovery_layer1',
      'discovery_candidates',
      'discovery_candidate_artifacts',
      'discovery_transition_events',
    ]) {
      expect(source).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`)
    }
  })

  it('046 org-scopes child tables through discovery_sessions.organization_id', () => {
    const source = readMigration('046_discovery_core.sql')
    expect(source).toContain('JOIN discovery_sessions s ON s.id = r.session_id')
    expect(source).toContain('s.organization_id IN')
  })

  it('047_discovery_preparation.sql enables RLS on discovery_preparation_requests', () => {
    const source = readMigration('047_discovery_preparation.sql')
    expect(source).toContain('ALTER TABLE discovery_preparation_requests ENABLE ROW LEVEL SECURITY;')
    expect(source).toContain('discovery_preparation_requests.discovery_run_id')
  })

  it('048_discovery_agent_outputs.sql enables RLS on discovery_agent_outputs (append-only)', () => {
    const source = readMigration('048_discovery_agent_outputs.sql')
    expect(source).toContain('ALTER TABLE discovery_agent_outputs ENABLE ROW LEVEL SECURITY;')
    expect(source).not.toMatch(/CREATE POLICY discovery_agent_outputs_update/)
  })

  it('049_discovery_curation.sql enables RLS on discovery_curation_events (append-only)', () => {
    const source = readMigration('049_discovery_curation.sql')
    expect(source).toContain('ALTER TABLE discovery_curation_events ENABLE ROW LEVEL SECURITY;')
    expect(source).not.toMatch(/CREATE POLICY discovery_curation_events_update/)
  })

  it('no discovery_* table is left without RLS across 046-049', () => {
    const combined = [
      readMigration('046_discovery_core.sql'),
      readMigration('047_discovery_preparation.sql'),
      readMigration('048_discovery_agent_outputs.sql'),
      readMigration('049_discovery_curation.sql'),
    ].join('\n')

    const createdTables = Array.from(combined.matchAll(/CREATE TABLE IF NOT EXISTS (discovery_\w+)/g)).map(m => m[1])
    expect(createdTables.length).toBeGreaterThan(0)
    for (const table of createdTables) {
      expect(combined).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`)
    }
  })
})
