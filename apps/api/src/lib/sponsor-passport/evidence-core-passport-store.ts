/**
 * RC-11.3 — Evidence Core passport store (claims runtime; other sections stubbed).
 */

import type { DbClient } from '@kadarn/evidence-core'
import { mapClaimsToPassportClaims } from './adapter/map-claim'
import { readInstitutionEvidence } from './adapter/queries'
import type { PassportStore } from './store'
import type {
  InstitutionalPassport,
  PassportClaimProvenanceDetail,
  PassportPortfolioIndexResponse,
  StabilityIndicator,
} from './types'

export const EVIDENCE_CORE_PORTFOLIO_NOT_IMPLEMENTED =
  'EvidenceCorePassportStore portfolio methods not implemented (RC-11.5)'

export const EVIDENCE_CORE_PROVENANCE_NOT_IMPLEMENTED =
  'EvidenceCorePassportStore provenance sub-resource not implemented (RC-11.4)'

const STUB_STABILITY: StabilityIndicator = 'Under Review'

type DbResolver = () => Promise<DbClient>

async function defaultDbResolver(): Promise<DbClient> {
  const { createRouteClient } = await import('@/lib/supabase-server')
  return (await createRouteClient()) as unknown as DbClient
}

function portfolioNotImplemented(): never {
  throw new Error(EVIDENCE_CORE_PORTFOLIO_NOT_IMPLEMENTED)
}

function provenanceNotImplemented(): never {
  throw new Error(EVIDENCE_CORE_PROVENANCE_NOT_IMPLEMENTED)
}

export class EvidenceCorePassportStore implements PassportStore {
  constructor(private readonly resolveDb: DbResolver = defaultDbResolver) {}

  async getPortfolioIndex(_sponsorOrgId: string): Promise<PassportPortfolioIndexResponse> {
    portfolioNotImplemented()
  }

  async getInstitutionalPassport(
    sponsorOrgId: string,
    institutionId: string,
  ): Promise<InstitutionalPassport | undefined> {
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

    return {
      passportId: `passport-${institutionId}`,
      institutionId,
      displayName: institutionId,
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
    _sponsorOrgId: string,
    _institutionId: string,
    _claimId: string,
  ): Promise<PassportClaimProvenanceDetail | undefined> {
    provenanceNotImplemented()
  }

  async isInstitutionInPortfolio(_sponsorOrgId: string, _institutionId: string): Promise<boolean> {
    portfolioNotImplemented()
  }
}
