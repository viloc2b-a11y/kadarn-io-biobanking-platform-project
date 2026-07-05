/**
 * RC-11.2 — Sponsor passport Evidence Core read adapter tests (no HTTP, no DB).
 */

import { describe, expect, it } from 'vitest'
import {
  createProvenance,
  insertClaim,
  insertEvidenceNode,
  siteVisibility,
} from '../../packages/evidence-core/src/index.js'
import type { DbClient } from '../../packages/evidence-core/src/db.js'
import { readInstitutionEvidence } from '../../apps/api/src/lib/sponsor-passport/adapter/queries'

function createFakeDb(): DbClient {
  const tables: Record<string, Record<string, Record<string, unknown>>> = {}

  return {
    from(table: string) {
      if (!tables[table]) tables[table] = {}
      const rows = tables[table]

      return {
        async insert(data) {
          const record = Array.isArray(data) ? data[0] : data
          const id = (record.id as string) ?? crypto.randomUUID()
          rows[id] = { ...record, id }
          return { data: rows[id], error: null }
        },
        select(_columns: string) {
          return {
            async eq(col: string, val: unknown) {
              const results = Object.values(rows).filter((r) => r[col] === val)
              return { data: results, error: null }
            },
          }
        },
      }
    },
    async rpc(_fn: string, _params: Record<string, unknown>) {
      return { data: null, error: null }
    },
  }
}

describe('Sponsor passport readInstitutionEvidence (RC-11.2)', () => {
  it('loads claims and evidence grouped by claim for institutionId = organization_id', async () => {
    const db = createFakeDb()
    const institutionId = 'org-site-uuid-1'
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: institutionId,
      correlationId: 'corr-adapter-1',
      summary: 'Seed',
    })

    const claimA = await insertClaim(db, {
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC processing',
      description: 'On-site PBMC isolation',
      organizationId: institutionId,
      domain: 'biospecimen',
      validEvidenceClasses: ['B'] as never,
      requiredEvidenceClasses: ['B'] as never,
      decays: true,
      decayPeriodMonths: 6,
      provenance,
    })

    const claimB = await insertClaim(db, {
      claimTypeId: 'logistics.cold_chain.storage',
      name: 'Cold-chain storage',
      description: 'Monitored storage',
      organizationId: institutionId,
      domain: 'logistics',
      validEvidenceClasses: ['B'] as never,
      requiredEvidenceClasses: ['B'] as never,
      decays: true,
      decayPeriodMonths: 12,
      provenance: { ...provenance, correlationId: 'corr-adapter-2' },
    })

    const claimAId = (claimA as { id: string }).id
    const claimBId = (claimB as { id: string }).id

    await insertEvidenceNode(db, {
      claimId: claimAId,
      evidenceClass: 'B' as never,
      content: 'PBMC SOP excerpt',
      source: 'site-submission',
      date: '2026-07-01',
      weight: 0.5,
      provenance,
      visibility: siteVisibility(institutionId),
    })

    await insertEvidenceNode(db, {
      claimId: claimBId,
      evidenceClass: 'C' as never,
      content: 'Calibration log',
      source: 'maintenance',
      date: '2026-06-15',
      weight: 0.4,
      provenance,
      visibility: siteVisibility(institutionId),
    })

    const read = await readInstitutionEvidence(db, institutionId)

    expect(read.institutionId).toBe(institutionId)
    expect(read.claims).toHaveLength(2)
    expect(read.evidenceNodes).toHaveLength(2)
    expect(read.evidenceByClaimId[claimAId]).toHaveLength(1)
    expect(read.evidenceByClaimId[claimBId]).toHaveLength(1)
    expect(read.evidenceByClaimId[claimAId][0].content).toBe('PBMC SOP excerpt')
  })

  it('returns empty bundles for unknown institution', async () => {
    const db = createFakeDb()
    const read = await readInstitutionEvidence(db, 'org-unknown')

    expect(read.claims).toEqual([])
    expect(read.evidenceNodes).toEqual([])
    expect(read.evidenceByClaimId).toEqual({})
  })
})
