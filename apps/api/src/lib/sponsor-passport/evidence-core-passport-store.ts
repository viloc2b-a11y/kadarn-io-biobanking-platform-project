/**
 * RC-11.3+ — Evidence Core passport store.
 */

import type { DbClient } from '@kadarn/evidence-core'
import { mapClaimsToPassportClaims } from './adapter/map-claim'
import { mapClaimProvenanceDetail } from './adapter/map-provenance-detail'
import {
  buildPortfolioIndex,
  checkInstitutionInPortfolio,
  resolvePortfolioEntry,
} from './adapter/map-portfolio-index'
import { readInstitutionEvidence } from './adapter/queries'
import type { PassportStore } from './store'
import type {
  InstitutionalPassport,
  PassportClaimProvenanceDetail,
  PassportPortfolioIndexResponse,
  StabilityIndicator,
} from './types'

const STUB_STABILITY: StabilityIndicator = 'Under Review'

type DbResolver = () => Promise<DbClient>

async function defaultDbResolver(): Promise<DbClient> {
  const { createRouteClient } = await import('@/lib/supabase-server')
  return (await createRouteClient()) as unknown as DbClient
}

export class EvidenceCorePassportStore implements PassportStore {
  constructor(private readonly resolveDb: DbResolver = defaultDbResolver) {}

  async getPortfolioIndex(sponsorOrgId: string): Promise<PassportPortfolioIndexResponse> {
    const db = await this.resolveDb()
    return buildPortfolioIndex(db, sponsorOrgId)
  }

  async getInstitutionalPassport(
    sponsorOrgId: string,
    institutionId: string,
  ): Promise<InstitutionalPassport | undefined> {
    if (!(await this.isInstitutionInPortfolio(sponsorOrgId, institutionId))) {
      return undefined
    }

    const db = await this.resolveDb()
    const read = await readInstitutionEvidence(db, institutionId)

    if (read.claims.length === 0) {
      return undefined
    }

    const correlationId = crypto.randomUUID()
    const claims = mapClaimsToPassportClaims({
      claims: read.claims,
      evidenceByClaimId: read.evidenceByClaimId,
      actorId: sponsorOrgId || 'sponsor-passport-adapter',
      correlationId,
    })

    const asOf =
      read.claims
        .map((claim) => claim.temporal.updatedAt)
        .sort()
        .at(-1) ?? new Date().toISOString()

    const entry = resolvePortfolioEntry(sponsorOrgId, institutionId)

    return {
      passportId: `passport-${institutionId}`,
      institutionId,
      displayName: entry?.displayName ?? institutionId,
      stability: STUB_STABILITY,
      asOf,
      identity: { names: [], locations: [], relationships: [] },
      capabilities: [],
      claims,
      recommendations: [],
      history: [],
    }
  }

  async getClaimProvenanceDetail(
    sponsorOrgId: string,
    institutionId: string,
    claimId: string,
  ): Promise<PassportClaimProvenanceDetail | undefined> {
    if (!(await this.isInstitutionInPortfolio(sponsorOrgId, institutionId))) {
      return undefined
    }

    const db = await this.resolveDb()
    const read = await readInstitutionEvidence(db, institutionId)

    return mapClaimProvenanceDetail({
      read,
      institutionId,
      claimId,
      actorId: sponsorOrgId || 'sponsor-passport-adapter',
      correlationId: crypto.randomUUID(),
    })
  }

  async isInstitutionInPortfolio(sponsorOrgId: string, institutionId: string): Promise<boolean> {
    return checkInstitutionInPortfolio(sponsorOrgId, institutionId)
  }
}
