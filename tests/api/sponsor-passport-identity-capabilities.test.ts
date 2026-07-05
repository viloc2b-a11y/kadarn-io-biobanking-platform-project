/**
 * RC-11.6 — Sponsor passport identity + capabilities runtime tests.
 */

import { afterEach, describe, expect, it } from 'vitest'
import {
  createProvenance,
  insertClaim,
  insertEvidenceNode,
  siteVisibility,
} from '../../packages/evidence-core/src/index.js'
import type { DbClient } from '../../packages/evidence-core/src/db.js'
import { mapCapabilitiesFromClaims, mapCapabilityTemporalState } from '../../apps/api/src/lib/sponsor-passport/adapter/map-capability'
import { mapClaimsToPassportClaims } from '../../apps/api/src/lib/sponsor-passport/adapter/map-claim'
import {
  mapOrganizationToPassportIdentity,
  resolveDisplayName,
} from '../../apps/api/src/lib/sponsor-passport/adapter/map-identity'
import { setPortfolioAllowlistForTests } from '../../apps/api/src/lib/sponsor-passport/adapter/portfolio-allowlist'
import { readInstitutionEvidence, readOrganization } from '../../apps/api/src/lib/sponsor-passport/adapter/queries'
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

async function seedOrganization(
  db: DbClient,
  organizationId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  await db.from('organizations').insert({
    id: organizationId,
    name: fields.name,
    legal_name: fields.legal_name ?? null,
    city: fields.city ?? null,
    region: fields.region ?? null,
    country: fields.country ?? 'US',
    created_by: '00000000-0000-0000-0000-000000000001',
  })
}

const SPONSOR_ORG = 'org-sponsor-rc116'
const SITE_ORG = 'org-site-rc116'

describe('Sponsor passport identity + capabilities (RC-11.6)', () => {
  afterEach(() => {
    setPortfolioAllowlistForTests(null)
  })

  it('maps organization registration data into PassportIdentity without invented relationships', async () => {
    const db = createFakeDb()
    await seedOrganization(db, SITE_ORG, {
      name: "St. Mary's Hospital",
      legal_name: "St. Mary's Hospital NHS Trust",
      city: 'London',
      region: 'England',
      country: 'GB',
    })

    const organization = await readOrganization(db, SITE_ORG)
    const identity = mapOrganizationToPassportIdentity({ organization })

    expect(identity.names).toHaveLength(2)
    expect(identity.names[0].source).toBe('Organization registration')
    expect(identity.locations[0].value).toContain('London')
    expect(identity.relationships).toEqual([])
  })

  it('groups existing claims into capabilities without inferring new taxonomies', async () => {
    const db = createFakeDb()
    const institutionId = SITE_ORG
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: institutionId,
      correlationId: 'corr-cap-1',
      summary: 'Seed',
    })

    for (const [claimTypeId, name] of [
      ['biospecimen.processing.pbmc', 'PBMC processing'],
      ['logistics.cold_chain.storage', 'Cold-chain storage'],
    ] as const) {
      const claimRow = await insertClaim(db, {
        claimTypeId,
        name,
        description: `${name} at this institution`,
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
        content: 'Supporting evidence',
        source: 'Operational SOP',
        date: '2026-06-01',
        weight: 0.5,
        provenance,
        visibility: siteVisibility(institutionId),
      })
    }

    const read = await readInstitutionEvidence(db, institutionId)
    const passportClaims = mapClaimsToPassportClaims({
      claims: read.claims,
      evidenceByClaimId: read.evidenceByClaimId,
      actorId: SPONSOR_ORG,
      correlationId: 'corr-cap-map',
    })

    const capabilities = mapCapabilitiesFromClaims({ read, passportClaims })

    expect(capabilities).toHaveLength(2)
    expect(capabilities.map((cap) => cap.taxonomyId).sort()).toEqual([
      'biospecimen.processing.pbmc',
      'logistics.cold_chain.storage',
    ])
    expect(capabilities.every((cap) => cap.candidateStatement.startsWith('Evidence suggests'))).toBe(true)
    expect(capabilities.every((cap) => cap.supportingClaimIds.length >= 1)).toBe(true)
  })

  it('maps capability temporalState from evidence dates and claim decay', () => {
    const claim = {
      decays: true,
      decayPeriodMonths: 12,
    } as never

    expect(
      mapCapabilityTemporalState({
        claim,
        evidenceNodes: [{ date: '2026-05-01', weight: 0.5 } as never],
        referenceDate: new Date('2026-06-01'),
      }),
    ).toBe('fresh')

    expect(
      mapCapabilityTemporalState({
        claim,
        evidenceNodes: [{ date: '2025-06-01', weight: 0.5 } as never],
        referenceDate: new Date('2026-06-01'),
      }),
    ).toBe('decayed')
  })

  it('EvidenceCorePassportStore populates identity and capabilities sections', async () => {
    setPortfolioAllowlistForTests({
      [SPONSOR_ORG]: [{ institutionId: SITE_ORG }],
    })

    const db = createFakeDb()
    await seedOrganization(db, SITE_ORG, {
      name: 'Barcelona Oncology Research Center',
      city: 'Barcelona',
      region: 'Catalonia',
      country: 'ES',
    })

    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: SITE_ORG,
      correlationId: 'corr-store-116',
      summary: 'Seed',
    })

    const claimRow = await insertClaim(db, {
      claimTypeId: 'experience.oncology.phase_ii',
      name: 'Phase II oncology experience',
      description: 'Phase II oncology trial execution',
      organizationId: SITE_ORG,
      domain: 'experience',
      validEvidenceClasses: ['A'] as never,
      requiredEvidenceClasses: ['A'] as never,
      decays: true,
      decayPeriodMonths: 24,
      provenance,
    })

    await insertEvidenceNode(db, {
      claimId: (claimRow as { id: string }).id,
      evidenceClass: 'A' as never,
      content: 'Close-out letter excerpt',
      source: 'Study close-out letter',
      date: '2025-12-01',
      weight: 0.8,
      provenance,
      visibility: siteVisibility(SITE_ORG),
    })

    const store = new EvidenceCorePassportStore(async () => db)
    const passport = await store.getInstitutionalPassport(SPONSOR_ORG, SITE_ORG)

    expect(passport).toBeDefined()
    expect(passport!.displayName).toBe('Barcelona Oncology Research Center')
    expect(passport!.identity.names.length).toBeGreaterThan(0)
    expect(passport!.identity.relationships).toEqual([])
    expect(passport!.capabilities).toHaveLength(1)
    expect(passport!.capabilities[0].taxonomyId).toBe('experience.oncology.phase_ii')
    expect(passport!.recommendations).toEqual([])
    expect(passport!.history).toEqual([])

    expect(
      resolveDisplayName({
        organization: await readOrganization(db, SITE_ORG),
        institutionId: SITE_ORG,
      }),
    ).toBe('Barcelona Oncology Research Center')
  })
})
