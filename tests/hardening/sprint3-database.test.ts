// ==========================================================================
// Sprint 3 — Database & Compliance Hardening: static source gate
// ==========================================================================
// Runs in default `npm test` (no Supabase required).
// ==========================================================================

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')

const APPEND_ONLY_TABLES = [
  'audit_events',
  'policy_evaluations',
  'trust_events',
  'twin_events',
  'regulatory_submission_events',
  'provenance_nodes',
  'provenance_edges',
  'provenance_evidence',
]

function readMigration(name: string): string {
  return fs.readFileSync(
    path.join(REPO_ROOT, 'database/migrations', name),
    'utf-8',
  )
}

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

describe('Sprint 3 — migration 035 compliance hardening', () => {
  const migration = readMigration('035_compliance_append_only.sql')

  it('migration 035 exists in both directories', () => {
    const dbPath = path.join(REPO_ROOT, 'database/migrations/035_compliance_append_only.sql')
    const sbPath = path.join(REPO_ROOT, 'supabase/migrations/035_compliance_append_only.sql')
    expect(fs.existsSync(dbPath)).toBe(true)
    expect(fs.existsSync(sbPath)).toBe(true)
    expect(sha256(fs.readFileSync(dbPath, 'utf-8'))).toBe(sha256(fs.readFileSync(sbPath, 'utf-8')))
  })

  it('defines generic append-only trigger helpers', () => {
    expect(migration).toContain('reject_append_only_update')
    expect(migration).toContain('reject_append_only_delete')
    expect(migration).toContain('apply_append_only_triggers')
  })

  for (const table of APPEND_ONLY_TABLES.filter(t => !t.startsWith('provenance'))) {
    it(`applies append-only triggers to ${table}`, () => {
      expect(migration).toContain(`'public.${table}'`)
    })
  }

  it('creates regulatory_submission_events append-only audit trail', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.regulatory_submission_events')
    expect(migration).toContain('trg_regulatory_submissions_audit')
  })

  it('adds policy_evaluations schema compatibility columns', () => {
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS result TEXT')
    expect(migration).toContain('GENERATED ALWAYS AS (outcome::text) STORED')
    expect(migration).toContain('GENERATED ALWAYS AS (evaluated_at) STORED')
  })

  it('revokes UPDATE/DELETE on append-only tables from client roles', () => {
    expect(migration).toContain('REVOKE UPDATE, DELETE ON public.audit_events')
    expect(migration).toContain('REVOKE UPDATE, DELETE ON public.policy_evaluations')
    expect(migration).toContain('REVOKE UPDATE, DELETE ON public.regulatory_submission_events')
  })

  it('includes self-verification block', () => {
    expect(migration).toContain('Expected at least 10 compliance append-only triggers')
  })
})

describe('Sprint 3 — migration parity (database vs supabase)', () => {
  const dbDir = path.join(REPO_ROOT, 'database/migrations')
  const sbDir = path.join(REPO_ROOT, 'supabase/migrations')

  it('database and supabase migration sets are identical', () => {
    const dbFiles = fs.readdirSync(dbDir).filter(f => f.endsWith('.sql')).sort()
    const sbFiles = fs.readdirSync(sbDir).filter(f => f.endsWith('.sql')).sort()
    expect(dbFiles).toEqual(sbFiles)
  })

  it('every migration file has identical content in both directories', () => {
    const dbFiles = fs.readdirSync(dbDir).filter(f => f.endsWith('.sql'))
    const mismatches: string[] = []
    for (const file of dbFiles) {
      const db = fs.readFileSync(path.join(dbDir, file), 'utf-8')
      const sb = fs.readFileSync(path.join(sbDir, file), 'utf-8')
      if (sha256(db) !== sha256(sb)) {
        mismatches.push(file)
      }
    }
    expect(mismatches, mismatches.join('\n')).toEqual([])
  })
})

describe('Sprint 3 — pgTAP compliance test file', () => {
  it('append-only-triggers.pgtest.sql covers compliance tables', () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'tests/compliance/append-only-triggers.pgtest.sql'),
      'utf-8',
    )
    expect(source).toContain('audit_events')
    expect(source).toContain('policy_evaluations')
    expect(source).toContain('trust_events')
    expect(source).toContain('regulatory_submission_events')
    expect(source).toContain("SELECT plan(10)")
  })
})

describe('Sprint 3 — provenance append-only (migration 032) still present', () => {
  const migration = readMigration('032_provenance_append_only.sql')

  it('provenance tables retain 6 append-only triggers', () => {
    expect(migration).toContain('provenance_nodes_no_update')
    expect(migration).toContain('provenance_edges_no_delete')
    expect(migration).toContain('Expected 6 provenance append-only triggers')
  })
})
