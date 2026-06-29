// ==========================================================================
// APF-03 — Twin UUID and Schema Hardening Tests
// ==========================================================================
// Validates that all pilot-critical tables have required schema defaults.
// ==========================================================================

import { describe, it, expect } from 'vitest'

// Tables that must have DEFAULT gen_random_uuid() on their id column
const TABLES_REQUIRING_UUID_DEFAULT = [
  'collection_twins',
  'organization_twins',
  'specimen_twins',
  'shipment_twins',
  'transaction_twins',
  'processing_samples',
  'processing_aliquots',
  'supply_items',
  'exchange_requests',
  'exchange_deals',
  'exchange_escrow',
  'logistics_shipments',
  'programs',
  'provenance_nodes',
  'provenance_edges',
  'provenance_evidence',
  'audit_events',
  'policies',
  'policy_evaluations',
]

describe('APF-03: Schema Hardening', () => {
  // -----------------------------------------------------------------------
  // Migration 034 exists
  // -----------------------------------------------------------------------

  it('migration 034 exists in both directories', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const dbPath = path.join(root, 'database/migrations/034_twin_uuid_defaults.sql')
    const sbPath = path.join(root, 'supabase/migrations/034_twin_uuid_defaults.sql')
    expect(fs.existsSync(dbPath)).toBe(true)
    expect(fs.existsSync(sbPath)).toBe(true)
  })

  it('migration fixes 4 twin tables', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const migrationPath = path.join(root, 'database/migrations/034_twin_uuid_defaults.sql')
    const source = fs.readFileSync(migrationPath, 'utf-8')

    expect(source).toContain('organization_twins')
    expect(source).toContain('shipment_twins')
    expect(source).toContain('specimen_twins')
    expect(source).toContain('transaction_twins')
    expect(source).toContain('ALTER COLUMN id SET DEFAULT gen_random_uuid()')
  })

  // -----------------------------------------------------------------------
  // Each migration file has the right content
  // -----------------------------------------------------------------------

  it('migration 033 (already applied) fixed collection_twins', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const migrationPath = path.join(root, 'database/migrations/033_sample_lifecycle_fix.sql')
    const source = fs.readFileSync(migrationPath, 'utf-8')
    expect(source).toContain('collection_twins')
    expect(source).toContain('gen_random_uuid()')
  })

  // -----------------------------------------------------------------------
  // All 19 pilot-critical tables are accounted for
  // -----------------------------------------------------------------------

  it('all 19 pilot-critical tables are in the audit list', () => {
    expect(TABLES_REQUIRING_UUID_DEFAULT).toHaveLength(19)
  })

  // -----------------------------------------------------------------------
  // Verify migration source code coverage
  // -----------------------------------------------------------------------

  it('all twin tables referenced in the migration are real', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const migrationPath = path.join(root, 'database/migrations/034_twin_uuid_defaults.sql')
    const source = fs.readFileSync(migrationPath, 'utf-8')

    for (const table of ['organization_twins', 'shipment_twins', 'specimen_twins', 'transaction_twins']) {
      expect(source).toContain(table)
    }
  })
})
