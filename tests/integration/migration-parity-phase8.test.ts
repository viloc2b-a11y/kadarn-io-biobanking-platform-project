// ==========================================================================
// Phase 8 migration parity — supabase vs database reference tree
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..', '..')
const SUPABASE = join(ROOT, 'supabase', 'migrations')
const DATABASE = join(ROOT, 'database', 'migrations')

function read(name: string, dir: string): string {
  return readFileSync(join(dir, name), 'utf8')
}

describe('Phase 8 migration parity', () => {
  it('045_evidence_core.sql is byte-identical in both trees', () => {
    const a = read('045_evidence_core.sql', SUPABASE)
    const b = read('045_evidence_core.sql', DATABASE)
    expect(a).toBe(b)
  })

  it('supabase has Phase 8 DDL 046-048', () => {
    expect(existsSync(join(SUPABASE, '046_evidence_lineage.sql'))).toBe(true)
    expect(existsSync(join(SUPABASE, '047_phase8_claims_and_views.sql'))).toBe(true)
    expect(existsSync(join(SUPABASE, '048_phase8_hybrid_index.sql'))).toBe(true)
  })

  it('supabase has remediation migrations 056-057', () => {
    for (const v of ['056_phase8_public_read_grants.sql', '057_gotrue_seed_compat.sql']) {
      expect(existsSync(join(SUPABASE, v))).toBe(true)
    }
  })

  it('058 was intentionally deleted (table evidence_class renamed to evidence_class_ref in 045)', () => {
    // Commit 05751139 deleted 058_phase8_rls_and_evidence_grants.sql because
    // evidence_class was renamed to evidence_class_ref in migration 045, and 058's
    // GRANT referencing evidence_class became invalid. The RLS/grants were handled
    // directly in 045 (see evidence_class_ref rename) and 056-057.
    expect(existsSync(join(SUPABASE, '058_phase8_rls_and_evidence_grants.sql'))).toBe(false)
  })

  it('database 046 is discovery_core (not Phase 8 lineage)', () => {
    const sql = read('046_discovery_core.sql', DATABASE)
    expect(sql).toContain('discovery_sessions')
    expect(sql).not.toContain('evidence_sources')
  })

  it('parity doc exists', () => {
    expect(existsSync(join(ROOT, 'openspec', 'phase-8-migration-parity.md'))).toBe(true)
  })
})
