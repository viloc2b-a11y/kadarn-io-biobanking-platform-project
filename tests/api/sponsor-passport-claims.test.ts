/**
 * RC-11.3 — Sponsor passport claim mapping unit tests (no HTTP, no DB).
 */

import { describe, expect, it } from 'vitest'
import {
  createProvenance,
  insertClaim,
  insertEvidenceNode,
  siteVisibility,
} from '../../packages/evidence-core/src/index.js'
import type { DbClient } from '../../packages/evidence-core/src/db.js'
import { mapClaimToPassportClaim, mapClaimsToPassportClaims } from '../../apps/api/src/lib/sponsor-passport/adapter/map-claim'
import { mapConfidenceLevel } from '../../apps/api/src/lib/sponsor-passport/adapter/map-confidence'
import { toCandidateStatement } from '../../apps/api/src/lib/sponsor-passport/adapter/map-statement'
import { readInstitutionEvidence } from '../../apps/api/src/lib/sponsor-passport/adapter/queries'
import { EvidenceCorePassportStore } from '../../apps/api/src/lib/sponsor-passport/evidence-core-passport-store'
import { seedSponsorPortfolioMemberships } from './sponsor-passport-portfolio-fixtures'

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

describe('Sponsor passport claim mapping (RC-11.3)', () => {
  const storeSponsorOrg = 'org-sponsor-claims-test'
  it('maps core confidence levels to passport enum without numeric scores', () => {
    expect(mapConfidenceLevel('high')).toBe('High')
    expect(mapConfidenceLevel('moderate')).toBe('Moderate')
    expect(mapConfidenceLevel('low')).toBe('Low')
    expect(mapConfidenceLevel('insufficient')).toBe('Insufficient')
  })

  it('prefixes statements with candidate register language', () => {
    expect(toCandidateStatement('On-site PBMC isolation')).toBe(
      'Evidence suggests on-site PBMC isolation',
    )
    expect(toCandidateStatement('Evidence suggests existing phrasing')).toBe(
      'Evidence suggests existing phrasing',
    )
  })

  it('maps claim + evidence into PassportClaim via evaluateClaim', async () => {
    const db = createFakeDb()
    const institutionId = 'org-site-claims-1'
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: institutionId,
      correlationId: 'corr-claims-1',
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
    const claim = read.claims[0]
    const passportClaim = mapClaimToPassportClaim({
      claim,
      claimEvidenceNodes: read.evidenceByClaimId[claimId],
      actorId: 'org-sponsor-1',
      correlationId: 'corr-eval-1',
    })

    expect(passportClaim.id).toBe(claimId)
    expect(passportClaim.taxonomyId).toBe('biospecimen.processing.pbmc')
    expect(passportClaim.statement).toMatch(/^Evidence suggests/)
    expect(['High', 'Moderate', 'Low', 'Insufficient']).toContain(passportClaim.confidence)
    expect(passportClaim.confidenceExplanation.length).toBeGreaterThan(0)
    expect(passportClaim.contested).toBe(false)
    expect(passportClaim.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(passportClaim.provenance.documentTitle).toBe('SOP: PBMC Isolation v3.2')
    expect(passportClaim.provenance.excerpt).toContain('Processing window')

    const serialized = JSON.stringify(passportClaim)
    expect(serialized).not.toContain('confidenceValue')
    expect(serialized).not.toContain('confidence_score')
  })

  it('EvidenceCorePassportStore returns claims-only passport with stubbed sections', async () => {
    const db = createFakeDb()
    const institutionId = 'org-site-store-1'
    await seedSponsorPortfolioMemberships(db, storeSponsorOrg, [
      { institutionId, displayName: 'Cold-chain Site' },
    ])
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: institutionId,
      correlationId: 'corr-store-1',
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

    await insertEvidenceNode(db, {
      claimId: (claimRow as { id: string }).id,
      evidenceClass: 'C' as never,
      content: 'Calibration log excerpt',
      source: 'Equipment maintenance log',
      date: '2026-04-01',
      weight: 0.4,
      provenance,
      visibility: siteVisibility(institutionId),
    })

    const store = new EvidenceCorePassportStore(async () => db)
    const passport = await store.getInstitutionalPassport(storeSponsorOrg, institutionId)

    expect(passport).toBeDefined()
    expect(passport!.claims).toHaveLength(1)
    expect(passport!.claims[0].statement).toMatch(/^Evidence suggests/)
    expect(passport!.identity.names.length).toBeGreaterThan(0)
    expect(passport!.identity.relationships).toEqual([])
    expect(passport!.capabilities.length).toBeGreaterThan(0)
    expect(passport!.recommendations).toEqual([])
    expect(passport!.history).toEqual([])
  })

  it('mapClaimsToPassportClaims preserves claim order', async () => {
    const db = createFakeDb()
    const institutionId = 'org-site-order'
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: institutionId,
      correlationId: 'corr-order',
      summary: 'Seed',
    })

    for (const claimTypeId of ['alpha.claim', 'beta.claim']) {
      await insertClaim(db, {
        claimTypeId,
        name: claimTypeId,
        description: `${claimTypeId} description`,
        organizationId: institutionId,
        domain: 'test',
        validEvidenceClasses: ['B'] as never,
        requiredEvidenceClasses: ['B'] as never,
        decays: false,
        decayPeriodMonths: null,
        provenance,
      })
    }

    const read = await readInstitutionEvidence(db, institutionId)
    const mapped = mapClaimsToPassportClaims({
      claims: read.claims,
      evidenceByClaimId: read.evidenceByClaimId,
      actorId: 'org-sponsor',
      correlationId: 'corr-map-all',
    })

    expect(mapped).toHaveLength(2)
    expect(mapped.map((c) => c.taxonomyId)).toEqual(['alpha.claim', 'beta.claim'])
  })
})
