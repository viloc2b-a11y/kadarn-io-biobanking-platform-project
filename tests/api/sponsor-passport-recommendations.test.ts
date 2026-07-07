/**
 * RC-11.8 — Sponsor passport recommendations runtime tests.
 */

import { describe, expect, it } from 'vitest'
import {
  createProvenance,
  insertClaim,
  insertEvidenceNode,
  siteVisibility,
} from '../../packages/evidence-core/src/index.js'
import type { DbClient } from '../../packages/evidence-core/src/db.js'
import { mapRecommendationsFromPassport } from '../../apps/api/src/lib/sponsor-passport/adapter/map-recommendations'
import { mapClaimsToPassportClaims } from '../../apps/api/src/lib/sponsor-passport/adapter/map-claim'
import { readInstitutionEvidence } from '../../apps/api/src/lib/sponsor-passport/adapter/queries'
import { EvidenceCorePassportStore } from '../../apps/api/src/lib/sponsor-passport/evidence-core-passport-store'
import { MockPassportStore } from '../../apps/api/src/lib/sponsor-passport/mock-passport-store'
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

const SPONSOR_ORG = 'org-sponsor-rc118'
const SITE_ORG = 'org-site-rc118'
const REFERENCE_DATE = new Date('2026-07-04T12:00:00.000Z')

async function seedClaimWithEvidence(
  db: DbClient,
  params: {
    claimTypeId: string
    name: string
    description: string
    evidenceDate: string
    decayMonths: number
    counterEvidence?: boolean
  },
): Promise<string> {
  const provenance = createProvenance({
    actorId: 'actor-rc118',
    organizationId: SITE_ORG,
    correlationId: 'corr-rc118',
    summary: 'Seed',
  })

  const claimRow = await insertClaim(db, {
    claimTypeId: params.claimTypeId,
    name: params.name,
    description: params.description,
    organizationId: SITE_ORG,
    domain: 'biospecimen',
    validEvidenceClasses: ['B'] as never,
    requiredEvidenceClasses: ['B'] as never,
    decays: true,
    decayPeriodMonths: params.decayMonths,
    provenance,
  })

  const claimId = (claimRow as { id: string }).id

  if (params.counterEvidence) {
    await insertEvidenceNode(db, {
      claimId,
      evidenceClass: 'B' as never,
      content: 'Counter-evidence excerpt',
      source: 'Audit finding',
      date: params.evidenceDate,
      weight: -0.5,
      provenance,
      visibility: siteVisibility(SITE_ORG),
    })
    return claimId
  }

  await insertEvidenceNode(db, {
    claimId,
    evidenceClass: 'B' as never,
    content: 'Supporting evidence excerpt',
    source: 'Institutional record',
    date: params.evidenceDate,
    weight: 0.5,
    provenance,
    visibility: siteVisibility(SITE_ORG),
  })

  return claimId
}

describe('Sponsor passport recommendations (RC-11.8)', () => {
  it('returns empty recommendations when all claims are adequately supported', async () => {
    const db = createFakeDb()
    await seedClaimWithEvidence(db, {
      claimTypeId: 'experience.oncology.phase_ii',
      name: 'Phase II oncology experience',
      description: 'Phase II oncology trial execution',
      evidenceDate: '2026-05-01',
      decayMonths: 24,
    })

    const read = await readInstitutionEvidence(db, SITE_ORG)
    const passportClaims = mapClaimsToPassportClaims({
      claims: read.claims,
      evidenceByClaimId: read.evidenceByClaimId,
      actorId: SPONSOR_ORG,
      correlationId: 'corr-healthy',
    })

    expect(
      mapRecommendationsFromPassport({
        read,
        passportClaims,
        referenceDate: REFERENCE_DATE,
      }),
    ).toEqual([])
  })

  it('recommends additional evidence for Insufficient claims', async () => {
    const db = createFakeDb()
    const provenance = createProvenance({
      actorId: 'actor-rc118',
      organizationId: SITE_ORG,
      correlationId: 'corr-insufficient',
      summary: 'Seed',
    })

    await insertClaim(db, {
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC processing',
      description: 'On-site PBMC isolation',
      organizationId: SITE_ORG,
      domain: 'biospecimen',
      validEvidenceClasses: ['B'] as never,
      requiredEvidenceClasses: ['B'] as never,
      decays: true,
      decayPeriodMonths: 6,
      provenance,
    })

    const read = await readInstitutionEvidence(db, SITE_ORG)
    const passportClaims = mapClaimsToPassportClaims({
      claims: read.claims,
      evidenceByClaimId: read.evidenceByClaimId,
      actorId: SPONSOR_ORG,
      correlationId: 'corr-insufficient-map',
    })

    const recommendations = mapRecommendationsFromPassport({
      read,
      passportClaims,
      referenceDate: REFERENCE_DATE,
    })

    expect(recommendations).toHaveLength(1)
    expect(recommendations[0]).toMatchObject({
      action: 'Request additional evidence for PBMC processing',
      isNextAction: true,
      supportingClaimIds: [passportClaims[0].id],
    })
  })

  it('recommends review for contested claims', async () => {
    const db = createFakeDb()
    await seedClaimWithEvidence(db, {
      claimTypeId: 'logistics.cold_chain.storage',
      name: 'Cold-chain storage',
      description: 'Monitored cold-chain storage',
      evidenceDate: '2026-05-01',
      decayMonths: 12,
      counterEvidence: true,
    })

    const read = await readInstitutionEvidence(db, SITE_ORG)
    const passportClaims = mapClaimsToPassportClaims({
      claims: read.claims,
      evidenceByClaimId: read.evidenceByClaimId,
      actorId: SPONSOR_ORG,
      correlationId: 'corr-contested',
    })

    expect(passportClaims[0].contested || read.evidenceByClaimId[passportClaims[0].id]?.some((n) => n.weight < 0)).toBe(true)

    const recommendations = mapRecommendationsFromPassport({
      read,
      passportClaims,
      referenceDate: REFERENCE_DATE,
    })

    expect(recommendations).toHaveLength(1)
    expect(recommendations[0].action).toContain('Review contested claim')
    expect(recommendations[0].supportingClaimIds).toEqual([passportClaims[0].id])
  })

  it('recommends refresh for aging or decayed evidence', async () => {
    const db = createFakeDb()
    await seedClaimWithEvidence(db, {
      claimTypeId: 'logistics.cold_chain.storage',
      name: 'Cold-chain storage',
      description: 'Monitored cold-chain storage',
      evidenceDate: '2024-11-02',
      decayMonths: 12,
    })

    const read = await readInstitutionEvidence(db, SITE_ORG)
    const passportClaims = mapClaimsToPassportClaims({
      claims: read.claims,
      evidenceByClaimId: read.evidenceByClaimId,
      actorId: SPONSOR_ORG,
      correlationId: 'corr-refresh',
    })

    const recommendations = mapRecommendationsFromPassport({
      read,
      passportClaims,
      referenceDate: REFERENCE_DATE,
    })

    expect(recommendations).toHaveLength(1)
    expect(recommendations[0].action).toContain('Request refreshed evidence')
    expect(recommendations[0].reason).toContain('decay horizon')
  })

  it('prioritizes contested over insufficient and assigns one isNextAction', async () => {
    const db = createFakeDb()
    const provenance = createProvenance({
      actorId: 'actor-rc118',
      organizationId: SITE_ORG,
      correlationId: 'corr-priority',
      summary: 'Seed',
    })

    const insufficientClaim = await insertClaim(db, {
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC processing',
      description: 'On-site PBMC isolation',
      organizationId: SITE_ORG,
      domain: 'biospecimen',
      validEvidenceClasses: ['B'] as never,
      requiredEvidenceClasses: ['B'] as never,
      decays: true,
      decayPeriodMonths: 6,
      provenance,
    })

    const contestedClaimId = await seedClaimWithEvidence(db, {
      claimTypeId: 'logistics.cold_chain.storage',
      name: 'Cold-chain storage',
      description: 'Monitored cold-chain storage',
      evidenceDate: '2026-05-01',
      decayMonths: 12,
      counterEvidence: true,
    })

    const read = await readInstitutionEvidence(db, SITE_ORG)
    const passportClaims = mapClaimsToPassportClaims({
      claims: read.claims,
      evidenceByClaimId: read.evidenceByClaimId,
      actorId: SPONSOR_ORG,
      correlationId: 'corr-priority-map',
    })

    const recommendations = mapRecommendationsFromPassport({
      read,
      passportClaims,
      referenceDate: REFERENCE_DATE,
    })

    expect(recommendations.length).toBeGreaterThanOrEqual(2)
    expect(recommendations[0].id).toBe(`rec-contested-${contestedClaimId}`)
    expect(recommendations[0].isNextAction).toBe(true)
    expect(recommendations.some((rec) => rec.id === `rec-insufficient-${(insufficientClaim as { id: string }).id}`)).toBe(true)
    expect(recommendations.filter((rec) => rec.isNextAction)).toHaveLength(1)
  })

  it('EvidenceCorePassportStore populates recommendations without affecting other sections', async () => {
    const db = createFakeDb()
    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, [{ institutionId: SITE_ORG }])
    await seedClaimWithEvidence(db, {
      claimTypeId: 'logistics.cold_chain.storage',
      name: 'Cold-chain storage',
      description: 'Monitored cold-chain storage',
      evidenceDate: '2024-11-02',
      decayMonths: 12,
    })

    const store = new EvidenceCorePassportStore(async () => db)
    const passport = await store.getInstitutionalPassport(SPONSOR_ORG, SITE_ORG)

    expect(passport).toBeDefined()
    expect(passport!.recommendations.length).toBeGreaterThan(0)
    expect(passport!.recommendations[0].supportingClaimIds?.length).toBeGreaterThan(0)
    expect(passport!.claims.length).toBeGreaterThan(0)
    expect(passport!.capabilities.length).toBeGreaterThan(0)
    expect(passport!.history).toEqual([])
  })

  it('MockPassportStore recommendations remain unchanged', async () => {
    const store = new MockPassportStore()
    const passport = await store.getInstitutionalPassport(SPONSOR_ORG, 'inst-st-marys')
    expect(passport!.recommendations.length).toBeGreaterThan(0)
    expect(passport!.recommendations[0].action).toContain('calibration')
  })
})
