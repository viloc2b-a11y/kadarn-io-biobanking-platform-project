/**
 * RC-11.5 — Portfolio index mapping from allowlist + Evidence Core reads.
 */

import type { Claim, DbClient } from '@kadarn/evidence-core'
import type { PassportInstitutionSummary, PassportPortfolioIndexResponse, StabilityIndicator } from '../types'
import {
  getAllowedInstitutions,
  getAllowlistEntry,
  isInstitutionInPortfolioAllowlist,
  type PortfolioAllowlistEntry,
} from './portfolio-allowlist'
import { readInstitutionEvidence } from './queries'

const DEFAULT_STABILITY: StabilityIndicator = 'Under Review'

function formatMemberSince(claim: Claim | undefined, entry?: PortfolioAllowlistEntry): string {
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
  sponsorOrgId: string,
): Promise<PassportPortfolioIndexResponse> {
  const allowed = getAllowedInstitutions(sponsorOrgId)
  const items: PassportInstitutionSummary[] = []

  for (const entry of allowed) {
    const read = await readInstitutionEvidence(db, entry.institutionId)
    if (read.claims.length === 0) continue

    const primaryClaim = read.claims[0]
    items.push({
      institutionId: entry.institutionId,
      passportId: `passport-${entry.institutionId}`,
      displayName: entry.displayName ?? entry.institutionId,
      location: entry.location ?? '',
      stability: DEFAULT_STABILITY,
      memberSince: formatMemberSince(primaryClaim, entry),
      summary: buildPortfolioSummary(read.claims),
    })
  }

  return { items }
}

export async function checkInstitutionInPortfolio(
  sponsorOrgId: string,
  institutionId: string,
): Promise<boolean> {
  return isInstitutionInPortfolioAllowlist(sponsorOrgId, institutionId)
}

export function resolvePortfolioEntry(
  sponsorOrgId: string,
  institutionId: string,
): PortfolioAllowlistEntry | undefined {
  return getAllowlistEntry(sponsorOrgId, institutionId)
}
