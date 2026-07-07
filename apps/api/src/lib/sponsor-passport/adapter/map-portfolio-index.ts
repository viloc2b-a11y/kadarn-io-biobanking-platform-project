import type { Claim, DbClient } from '@kadarn/evidence-core'
import type { PassportInstitutionSummary, PassportPortfolioIndexResponse } from '../types'
import type { SponsorPortfolioRepository } from '../portfolio/repository'
import type { SponsorPortfolioInstitutionReadModel } from '../portfolio/types'
import { deriveStabilityIndicatorFromSource } from '../stability'
import { readInstitutionAuditEvents, readInstitutionEvidence } from './queries'

function formatMemberSince(
  claim: Claim | undefined,
  entry?: SponsorPortfolioInstitutionReadModel,
): string {
  if (entry?.memberSince) return entry.memberSince
  if (claim?.temporal.createdAt) return claim.temporal.createdAt.slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

function buildPortfolioSummary(claims: Claim[]): string {
  if (claims.length === 0) {
    return 'Evidence suggests institutional capability data is not yet available for this site.'
  }

  const domains = [...new Set(claims.map((claim) => claim.domain))]
  const domainText = domains.length === 1 ? domains[0] : domains.join(', ')
  const claimText = claims.length === 1 ? '1 active claim' : `${claims.length} active claims`

  return `Evidence suggests ${claimText} on file across ${domainText}.`
}

export async function buildPortfolioIndex(
  db: DbClient,
  repository: SponsorPortfolioRepository,
  sponsorOrgId: string,
): Promise<PassportPortfolioIndexResponse> {
  const memberships = await repository.listActiveInstitutions(sponsorOrgId)
  const items: PassportInstitutionSummary[] = []
  const referenceDate = new Date()

  for (const entry of memberships) {
    const read = await readInstitutionEvidence(db, entry.institutionId)
    if (read.claims.length === 0) continue

    const primaryClaim = read.claims[0]
    const auditEvents = await readInstitutionAuditEvents(db, entry.institutionId)
    const stability = deriveStabilityIndicatorFromSource({
      read,
      auditEvents,
      actorId: sponsorOrgId || 'sponsor-passport-adapter',
      correlationId: `portfolio-index-${entry.institutionId}`,
      referenceDate,
    })

    items.push({
      institutionId: entry.institutionId,
      passportId: `passport-${entry.institutionId}`,
      displayName: entry.displayName ?? entry.institutionId,
      location: entry.location ?? '',
      stability,
      memberSince: formatMemberSince(primaryClaim, entry),
      summary: buildPortfolioSummary(read.claims),
    })
  }

  return { items }
}

export async function checkInstitutionInPortfolio(
  repository: SponsorPortfolioRepository,
  sponsorOrgId: string,
  institutionId: string,
): Promise<boolean> {
  return repository.hasActiveInstitution(sponsorOrgId, institutionId)
}

export async function resolvePortfolioEntry(
  repository: SponsorPortfolioRepository,
  sponsorOrgId: string,
  institutionId: string,
): Promise<SponsorPortfolioInstitutionReadModel | undefined> {
  return repository.getActiveInstitution(sponsorOrgId, institutionId)
}
