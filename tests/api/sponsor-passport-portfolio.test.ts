/**
 * RC-12.1C - Sponsor passport portfolio repository runtime tests (no HTTP).
 */

import { describe, expect, it } from 'vitest'
import {
  createProvenance,
  insertClaim,
  insertEvidenceNode,
  siteVisibility,
} from '../../packages/evidence-core/src/index.js'
import type { DbClient } from '../../packages/evidence-core/src/db.js'
import { buildPortfolioIndex, checkInstitutionInPortfolio } from '../../apps/api/src/lib/sponsor-passport/adapter/map-portfolio-index'
import { EvidenceCorePassportStore } from '../../apps/api/src/lib/sponsor-passport/evidence-core-passport-store'
import { SupabaseSponsorPortfolioRepository } from '../../apps/api/src/lib/sponsor-passport/portfolio/repository'
import {
  seedSponsorPortfolioMemberships,
  type SponsorPortfolioTestEntry,
} from './sponsor-passport-portfolio-fixtures'

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

const SPONSOR_ORG = 'org-sponsor-rc115'
const SITE_A = 'org-site-a'
const SITE_B = 'org-site-b'

const TEST_PORTFOLIO_ENTRIES: SponsorPortfolioTestEntry[] = [
  {
    institutionId: SITE_A,
    displayName: "St. Mary's Hospital",
    location: 'London, United Kingdom',
    memberSince: '2024-03-12',
  },
  {
    institutionId: SITE_B,
    displayName: 'Barcelona Oncology Research Center',
    location: 'Barcelona, Spain',
    memberSince: '2023-11-08',
  },
]

async function seedSiteClaims(db: DbClient, institutionId: string, claimTypeId: string): Promise<void> {
  const provenance = createProvenance({
    actorId: 'actor-1',
    organizationId: institutionId,
    correlationId: `corr-${institutionId}`,
    summary: 'Seed',
  })

  const claimRow = await insertClaim(db, {
    claimTypeId,
    name: 'Capability claim',
    description: 'Evidence-backed capability claim',
    organizationId: institutionId,
    domain: 'biospecimen',
    validEvidenceClasses: ['B'] as never,
    requiredEvidenceClasses: ['B'] as never,
    decays: true,
    decayPeriodMonths: 6,
    provenance,
  })

  await insertEvidenceNode(db, {
    claimId: (claimRow as { id: string }).id,
    evidenceClass: 'B' as never,
    content: 'Supporting evidence excerpt',
    source: 'Operational SOP',
    date: '2025-09-14',
    weight: 0.5,
    provenance,
    visibility: siteVisibility(institutionId),
  })
}

describe('Sponsor passport portfolio runtime (RC-12.1C)', () => {
  it('isInstitutionInPortfolio uses persistent memberships', async () => {
    const db = createFakeDb()
    const repository = new SupabaseSponsorPortfolioRepository(db)
    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, TEST_PORTFOLIO_ENTRIES)

    expect(await checkInstitutionInPortfolio(repository, SPONSOR_ORG, SITE_A)).toBe(true)
    expect(await checkInstitutionInPortfolio(repository, SPONSOR_ORG, SITE_B)).toBe(true)
    expect(await checkInstitutionInPortfolio(repository, SPONSOR_ORG, 'org-unknown')).toBe(false)
    expect(await checkInstitutionInPortfolio(repository, 'org-other-sponsor', SITE_A)).toBe(false)
  })

  it('getPortfolioIndex returns portfolio institutions with evidence-backed summaries', async () => {
    const db = createFakeDb()
    const repository = new SupabaseSponsorPortfolioRepository(db)
    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, TEST_PORTFOLIO_ENTRIES)

    await seedSiteClaims(db, SITE_A, 'biospecimen.processing.pbmc')
    await seedSiteClaims(db, SITE_B, 'experience.oncology.phase_ii')

    const index = await buildPortfolioIndex(db, repository, SPONSOR_ORG)

    expect(index.items).toHaveLength(2)
    expect(index.items.map((item) => item.institutionId).sort()).toEqual([SITE_A, SITE_B].sort())
    expect(index.items[0].summary).toMatch(/^Evidence suggests/)
    expect(index.items[0].displayName).toBeTruthy()
    expect(index.items.every((item) => !('score' in item))).toBe(true)
    expect(index.items.every((item) => !('rank' in item))).toBe(true)
  })

  it('getPortfolioIndex omits portfolio institutions without claims', async () => {
    const db = createFakeDb()
    const repository = new SupabaseSponsorPortfolioRepository(db)
    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, TEST_PORTFOLIO_ENTRIES)

    await seedSiteClaims(db, SITE_A, 'biospecimen.processing.pbmc')

    const index = await buildPortfolioIndex(db, repository, SPONSOR_ORG)
    expect(index.items).toHaveLength(1)
    expect(index.items[0].institutionId).toBe(SITE_A)
  })

  it('EvidenceCorePassportStore blocks detail for institutions outside portfolio', async () => {
    const db = createFakeDb()
    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, TEST_PORTFOLIO_ENTRIES)
    await seedSiteClaims(db, SITE_A, 'biospecimen.processing.pbmc')

    const store = new EvidenceCorePassportStore(async () => db)

    expect(await store.isInstitutionInPortfolio(SPONSOR_ORG, SITE_A)).toBe(true)
    expect(await store.getInstitutionalPassport(SPONSOR_ORG, SITE_A)).toBeDefined()
    expect(await store.getInstitutionalPassport(SPONSOR_ORG, 'org-unknown')).toBeUndefined()
  })

  it('EvidenceCorePassportStore getPortfolioIndex returns empty list for unknown sponsor', async () => {
    const db = createFakeDb()
    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, TEST_PORTFOLIO_ENTRIES)
    await seedSiteClaims(db, SITE_A, 'biospecimen.processing.pbmc')

    const store = new EvidenceCorePassportStore(async () => db)
    const index = await store.getPortfolioIndex('org-unknown-sponsor')

    expect(index.items).toEqual([])
  })
})
