/**
 * RC-11.4 — Sponsor passport provenance sub-resource unit tests (no HTTP, no DB).
 */

import { describe, expect, it } from 'vitest'
import {
  createProvenance,
  insertClaim,
  insertCounterEvidence,
  insertEvidenceNode,
  siteVisibility,
} from '../../packages/evidence-core/src/index.js'
import type { DbClient } from '../../packages/evidence-core/src/db.js'
import { mapClaimProvenanceDetail } from '../../apps/api/src/lib/sponsor-passport/adapter/map-provenance-detail'
import { readInstitutionEvidence } from '../../apps/api/src/lib/sponsor-passport/adapter/queries'
import { EvidenceCorePassportStore } from '../../apps/api/src/lib/sponsor-passport/evidence-core-passport-store'

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

describe('Sponsor passport provenance mapping (RC-11.4)', () => {
  it('returns undefined when claim is not found for institution', async () => {
    const db = createFakeDb()
    const read = await readInstitutionEvidence(db, 'org-empty')

    expect(
      mapClaimProvenanceDetail({
        read,
        institutionId: 'org-empty',
        claimId: 'claim-missing',
        actorId: 'org-sponsor',
        correlationId: 'corr-missing',
      }),
    ).toBeUndefined()
  })

  it('builds PassportClaimProvenanceDetail from evidence-core graph reads', async () => {
    const db = createFakeDb()
    const institutionId = 'org-site-prov-1'
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: institutionId,
      correlationId: 'corr-prov-1',
      summary: 'Seed',
    })

    const claimRow = await insertClaim(db, {
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC processing',
      description: 'On-site PBMC isolation with same-day processing windows',
      organizationId: institutionId,
      domain: 'biospecimen',
      validEvidenceClasses: ['B'] as never,
      requiredEvidenceClasses: ['B'] as never,
      decays: true,
      decayPeriodMonths: 6,
      provenance,
    })

    const claimId = (claimRow as { id: string }).id

    await insertEvidenceNode(db, {
      claimId,
      evidenceClass: 'B' as never,
      content: 'Processing window documented as within 4 hours of draw.',
      source: 'SOP: PBMC Isolation v3.2',
      date: '2025-09-14',
      weight: 0.5,
      provenance,
      visibility: siteVisibility(institutionId),
    })

    const read = await readInstitutionEvidence(db, institutionId)
    const detail = mapClaimProvenanceDetail({
      read,
      institutionId,
      claimId,
      actorId: 'org-sponsor',
      correlationId: 'corr-prov-detail',
    })

    expect(detail).toBeDefined()
    expect(detail!.claimId).toBe(claimId)
    expect(detail!.institutionId).toBe(institutionId)
    expect(detail!.statement).toMatch(/^Evidence suggests/)
    expect(['High', 'Moderate', 'Low', 'Insufficient']).toContain(detail!.confidence)
    expect(detail!.confidenceExplanation.length).toBeGreaterThan(0)
    expect(detail!.minimal.excerpt).toContain('Processing window')
    expect(detail!.evidenceNodes.length).toBeGreaterThanOrEqual(1)
    expect(detail!.sourceDocuments.length).toBeGreaterThanOrEqual(1)
    expect(detail!.evidenceNodes.every((node) => node.supportsClaim)).toBe(true)
    expect(detail!.contradictingNodeIds).toBeUndefined()

    const serialized = JSON.stringify(detail)
    expect(serialized).not.toContain('confidenceValue')
    expect(serialized).not.toContain('confidence_score')
  })

  it('includes contradictingNodeIds for counter-evidence nodes', async () => {
    const db = createFakeDb()
    const institutionId = 'org-site-prov-contested'
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: institutionId,
      correlationId: 'corr-prov-contested',
      summary: 'Seed',
    })

    const claimRow = await insertClaim(db, {
      claimTypeId: 'logistics.cold_chain.storage',
      name: 'Cold-chain storage',
      description: 'Monitored cold-chain storage for biospecimens',
      organizationId: institutionId,
      domain: 'logistics',
      validEvidenceClasses: ['B', 'C'] as never,
      requiredEvidenceClasses: ['B'] as never,
      decays: true,
      decayPeriodMonths: 12,
      provenance,
    })

    const claimId = (claimRow as { id: string }).id

    await insertEvidenceNode(db, {
      claimId,
      evidenceClass: 'C' as never,
      content: 'Calibration log excerpt',
      source: 'Equipment maintenance log',
      date: '2024-11-02',
      weight: 0.4,
      provenance,
      visibility: siteVisibility(institutionId),
    })

    const counterRow = await insertCounterEvidence(db, {
      claimId,
      evidenceClass: 'C' as never,
      content: 'Conflicting calibration timeline noted; resolution pending.',
      source: 'Counter-evidence excerpt',
      date: '2024-12-01',
      weight: 0.3,
      provenance,
      visibility: siteVisibility(institutionId),
    })

    const counterId = (counterRow as { id: string }).id
    const read = await readInstitutionEvidence(db, institutionId)
    const detail = mapClaimProvenanceDetail({
      read,
      institutionId,
      claimId,
      actorId: 'org-sponsor',
      correlationId: 'corr-prov-contested-detail',
    })

    expect(detail!.contested).toBe(true)
    expect(detail!.contradictingNodeIds).toContain(counterId)
    expect(detail!.evidenceNodes.some((node) => !node.supportsClaim)).toBe(true)
  })

  it('EvidenceCorePassportStore.getClaimProvenanceDetail delegates to adapter', async () => {
    const db = createFakeDb()
    const institutionId = 'org-site-store-prov'
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: institutionId,
      correlationId: 'corr-store-prov',
      summary: 'Seed',
    })

    const claimRow = await insertClaim(db, {
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

    const claimId = (claimRow as { id: string }).id

    await insertEvidenceNode(db, {
      claimId,
      evidenceClass: 'B' as never,
      content: 'SOP excerpt',
      source: 'SOP: PBMC Isolation v3.2',
      date: '2025-09-14',
      weight: 0.5,
      provenance,
      visibility: siteVisibility(institutionId),
    })

    const store = new EvidenceCorePassportStore(async () => db)
    const detail = await store.getClaimProvenanceDetail('org-sponsor', institutionId, claimId)

    expect(detail).toBeDefined()
    expect(detail!.claimId).toBe(claimId)
    expect(detail!.evidenceNodes.length).toBeGreaterThanOrEqual(1)
  })
})
