/**
 * RC-12.2D - Sponsor Passport Stability Adapter Integration tests.
 */

import { describe, expect, it } from 'vitest'
import {
  createProvenance,
  insertClaim,
  insertEvidenceNode,
  siteVisibility,
} from '../../packages/evidence-core/src/index.js'
import type { DbClient } from '../../packages/evidence-core/src/db.js'
import { buildPortfolioIndex } from '../../apps/api/src/lib/sponsor-passport/adapter/map-portfolio-index'
import { EvidenceCorePassportStore } from '../../apps/api/src/lib/sponsor-passport/evidence-core-passport-store'
import { SupabaseSponsorPortfolioRepository } from '../../apps/api/src/lib/sponsor-passport/portfolio/repository'
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

async function seedOrganization(db: DbClient, organizationId: string, name: string): Promise<void> {
  await db.from('organizations').insert({
    id: organizationId,
    name,
    legal_name: null,
    city: null,
    region: null,
    country: 'US',
    created_by: '00000000-0000-0000-0000-000000000001',
  })
}

async function seedClaim(params: {
  db: DbClient
  institutionId: string
  claimTypeId: string
  withEvidence: boolean
  decays?: boolean
  decayPeriodMonths?: number | null
  evidenceDate?: string
}): Promise<string> {
  const provenance = createProvenance({
    actorId: 'actor-rc122d',
    organizationId: params.institutionId,
    correlationId: `corr-${params.institutionId}`,
    summary: 'Seed',
  })

  const claimRow = await insertClaim(params.db, {
    claimTypeId: params.claimTypeId,
    name: 'Adapter stability claim',
    description: 'Evidence-backed adapter stability claim',
    organizationId: params.institutionId,
    domain: 'stability',
    validEvidenceClasses: ['B'] as never,
    requiredEvidenceClasses: ['B'] as never,
    decays: params.decays ?? false,
    decayPeriodMonths: params.decayPeriodMonths ?? null,
    provenance,
  })
  const claimId = (claimRow as { id: string }).id

  if (params.withEvidence) {
    await insertEvidenceNode(params.db, {
      claimId,
      evidenceClass: 'B' as never,
      content: 'Supporting evidence excerpt',
      source: 'Institutional record',
      date: params.evidenceDate ?? '2026-06-01',
      weight: 0.5,
      provenance,
      visibility: siteVisibility(params.institutionId),
    })
  }

  return claimId
}

async function seedAuditEvent(
  db: DbClient,
  fields: Record<string, unknown>,
): Promise<void> {
  await db.from('audit_events').insert({
    action: fields.action,
    actor_id: fields.actor_id ?? 'actor-rc122d',
    actor_email: fields.actor_email ?? null,
    organization_id: fields.organization_id,
    resource_type: fields.resource_type ?? 'evidence_core',
    resource_id: fields.resource_id ?? crypto.randomUUID(),
    summary: fields.summary ?? 'Stability audit event',
    created_at: fields.created_at ?? new Date().toISOString(),
  })
}

const SPONSOR_ORG = 'org-sponsor-rc122d'
const SITE_STABLE = 'org-site-stable-rc122d'
const SITE_REFRESH = 'org-site-refresh-rc122d'
const SITE_REVIEW = 'org-site-review-rc122d'

describe('Sponsor Passport Stability Adapter Integration (RC-12.2D)', () => {
  it('derives portfolio index stability from Evidence Core source state', async () => {
    const db = createFakeDb()
    const repository = new SupabaseSponsorPortfolioRepository(db)

    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, [
      { institutionId: SITE_STABLE, displayName: 'Stable Site' },
      { institutionId: SITE_REFRESH, displayName: 'Refresh Site' },
    ])
    await seedClaim({
      db,
      institutionId: SITE_STABLE,
      claimTypeId: 'stability.stable',
      withEvidence: true,
      decays: false,
    })
    await seedClaim({
      db,
      institutionId: SITE_REFRESH,
      claimTypeId: 'stability.refresh',
      withEvidence: false,
      decays: true,
      decayPeriodMonths: 12,
    })

    const index = await buildPortfolioIndex(db, repository, SPONSOR_ORG)
    const byInstitution = new Map(index.items.map((item) => [item.institutionId, item]))

    expect(byInstitution.get(SITE_STABLE)?.stability).toBe('Stable')
    expect(byInstitution.get(SITE_REFRESH)?.stability).toBe('Evidence Refresh Needed')
    expect(index.items.every((item) => item.stability !== 'Under Review')).toBe(true)
  })

  it('derives passport detail stability from Evidence Core source state', async () => {
    const db = createFakeDb()
    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, [
      { institutionId: SITE_STABLE, displayName: 'Stable Site' },
    ])
    await seedOrganization(db, SITE_STABLE, 'Stable Site')
    await seedClaim({
      db,
      institutionId: SITE_STABLE,
      claimTypeId: 'stability.detail.stable',
      withEvidence: true,
      decays: false,
    })

    const store = new EvidenceCorePassportStore(async () => db)
    const passport = await store.getInstitutionalPassport(SPONSOR_ORG, SITE_STABLE)

    expect(passport).toBeDefined()
    expect(passport!.stability).toBe('Stable')
    expect(JSON.stringify(passport)).not.toContain('stabilityScore')
  })

  it('derives passport detail refresh state without falling back to Under Review', async () => {
    const db = createFakeDb()
    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, [
      { institutionId: SITE_REFRESH, displayName: 'Refresh Site' },
    ])
    await seedOrganization(db, SITE_REFRESH, 'Refresh Site')
    await seedClaim({
      db,
      institutionId: SITE_REFRESH,
      claimTypeId: 'stability.detail.refresh',
      withEvidence: false,
      decays: true,
      decayPeriodMonths: 12,
    })

    const store = new EvidenceCorePassportStore(async () => db)
    const passport = await store.getInstitutionalPassport(SPONSOR_ORG, SITE_REFRESH)

    expect(passport).toBeDefined()
    expect(passport!.stability).toBe('Evidence Refresh Needed')
  })

  it('preserves Under Review for real review-source signals', async () => {
    const db = createFakeDb()
    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, [
      { institutionId: SITE_REVIEW, displayName: 'Review Site' },
    ])
    await seedOrganization(db, SITE_REVIEW, 'Review Site')
    const claimId = await seedClaim({
      db,
      institutionId: SITE_REVIEW,
      claimTypeId: 'stability.detail.review',
      withEvidence: true,
      decays: false,
    })
    await seedAuditEvent(db, {
      action: 'process_state.updated',
      organization_id: SITE_REVIEW,
      resource_id: claimId,
      created_at: '2026-07-01T00:00:00.000Z',
    })

    const store = new EvidenceCorePassportStore(async () => db)
    const passport = await store.getInstitutionalPassport(SPONSOR_ORG, SITE_REVIEW)

    expect(passport).toBeDefined()
    expect(passport!.stability).toBe('Under Review')
  })

  it('preserves portfolio index Under Review only for real review-source signals', async () => {
    const db = createFakeDb()
    const repository = new SupabaseSponsorPortfolioRepository(db)

    await seedSponsorPortfolioMemberships(db, SPONSOR_ORG, [
      { institutionId: SITE_REVIEW, displayName: 'Review Site' },
    ])
    const claimId = await seedClaim({
      db,
      institutionId: SITE_REVIEW,
      claimTypeId: 'stability.index.review',
      withEvidence: true,
      decays: false,
    })
    await seedAuditEvent(db, {
      action: 'process_state.updated',
      organization_id: SITE_REVIEW,
      resource_id: claimId,
      created_at: '2026-07-01T00:00:00.000Z',
    })

    const index = await buildPortfolioIndex(db, repository, SPONSOR_ORG)

    expect(index.items).toHaveLength(1)
    expect(index.items[0].stability).toBe('Under Review')
  })
})
