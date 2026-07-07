/**
 * RC-11.3+ — Evidence Core passport store.
 */

import type { DbClient } from '@kadarn/evidence-core'
import { mapCapabilitiesFromClaims } from './adapter/map-capability'
import { mapClaimsToPassportClaims } from './adapter/map-claim'
import {
  mapOrganizationToPassportIdentity,
  resolveDisplayName,
} from './adapter/map-identity'
import { mapClaimProvenanceDetail } from './adapter/map-provenance-detail'
import {
  buildPortfolioIndex,
  checkInstitutionInPortfolio,
  resolvePortfolioEntry,
} from './adapter/map-portfolio-index'
import { mapAuditEventsToPassportHistory } from './adapter/map-history'
import { mapRecommendationsFromPassport } from './adapter/map-recommendations'
import {
  readInstitutionAuditEvents,
  readInstitutionEvidence,
  readOrganization,
} from './adapter/queries'
import { SupabaseSponsorPortfolioRepository, type SponsorPortfolioRepository } from './portfolio/repository'
import { deriveStabilityIndicatorFromSource } from './stability'
import type { PassportStore } from './store'
import type {
  InstitutionalPassport,
  PassportClaimProvenanceDetail,
  PassportPortfolioIndexResponse,
} from './types'

type DbResolver = () => Promise<DbClient>
type PortfolioRepositoryFactory = (db: DbClient) => SponsorPortfolioRepository

async function defaultDbResolver(): Promise<DbClient> {
  const { createRouteClient } = await import('@/lib/supabase-server')
  return (await createRouteClient()) as unknown as DbClient
}

export class EvidenceCorePassportStore implements PassportStore {
  constructor(
    private readonly resolveDb: DbResolver = defaultDbResolver,
    private readonly createPortfolioRepository: PortfolioRepositoryFactory = (db) =>
      new SupabaseSponsorPortfolioRepository(db),
  ) {}

  async getPortfolioIndex(sponsorOrgId: string): Promise<PassportPortfolioIndexResponse> {
    const db = await this.resolveDb()
    const portfolioRepository = this.createPortfolioRepository(db)
    return buildPortfolioIndex(db, portfolioRepository, sponsorOrgId)
  }

  async getInstitutionalPassport(
    sponsorOrgId: string,
    institutionId: string,
  ): Promise<InstitutionalPassport | undefined> {
    const db = await this.resolveDb()
    const portfolioRepository = this.createPortfolioRepository(db)

    if (!(await checkInstitutionInPortfolio(portfolioRepository, sponsorOrgId, institutionId))) {
      return undefined
    }

    const read = await readInstitutionEvidence(db, institutionId)

    if (read.claims.length === 0) {
      return undefined
    }

    const organization = await readOrganization(db, institutionId)
    const portfolioEntry = await resolvePortfolioEntry(portfolioRepository, sponsorOrgId, institutionId)
    const correlationId = crypto.randomUUID()

    const claims = mapClaimsToPassportClaims({
      claims: read.claims,
      evidenceByClaimId: read.evidenceByClaimId,
      actorId: sponsorOrgId || 'sponsor-passport-adapter',
      correlationId,
    })

    const capabilities = mapCapabilitiesFromClaims({ read, passportClaims: claims })
    const identity = mapOrganizationToPassportIdentity({ organization, portfolioEntry })
    const auditEvents = await readInstitutionAuditEvents(db, institutionId)
    const history = mapAuditEventsToPassportHistory(auditEvents)

    const asOf =
      read.claims
        .map((claim) => claim.temporal.updatedAt)
        .sort()
        .at(-1) ?? new Date().toISOString()

    const recommendations = mapRecommendationsFromPassport({
      read,
      passportClaims: claims,
      referenceDate: new Date(asOf),
    })
    const stability = deriveStabilityIndicatorFromSource({
      read,
      auditEvents,
      actorId: sponsorOrgId || 'sponsor-passport-adapter',
      correlationId,
      referenceDate: new Date(),
    })

    return {
      passportId: `passport-${institutionId}`,
      institutionId,
      displayName: resolveDisplayName({ organization, portfolioEntry, institutionId }),
      stability,
      asOf,
      identity,
      capabilities,
      claims,
      recommendations,
      history,
    }
  }

  async getClaimProvenanceDetail(
    sponsorOrgId: string,
    institutionId: string,
    claimId: string,
  ): Promise<PassportClaimProvenanceDetail | undefined> {
    const db = await this.resolveDb()
    const portfolioRepository = this.createPortfolioRepository(db)

    if (!(await checkInstitutionInPortfolio(portfolioRepository, sponsorOrgId, institutionId))) {
      return undefined
    }

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
    const db = await this.resolveDb()
    const portfolioRepository = this.createPortfolioRepository(db)
    return checkInstitutionInPortfolio(portfolioRepository, sponsorOrgId, institutionId)
  }
}
