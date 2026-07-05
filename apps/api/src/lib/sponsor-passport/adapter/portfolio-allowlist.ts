/**
 * RC-11.5 — Temporary sponsor portfolio allowlist (no DB table).
 *
 * institutionId = site organization_id (Evidence Core).
 * Replace with durable portfolio membership in RC-11.5b+.
 *
 * Configure via SPONSOR_PASSPORT_PORTFOLIO_JSON:
 * {
 *   "sponsor-org-uuid": [
 *     {
 *       "institutionId": "site-org-uuid",
 *       "displayName": "St. Mary's Hospital",
 *       "location": "London, United Kingdom",
 *       "memberSince": "2024-03-12"
 *     }
 *   ]
 * }
 */

export interface PortfolioAllowlistEntry {
  institutionId: string
  displayName?: string
  location?: string
  memberSince?: string
}

export type PortfolioAllowlist = Record<string, PortfolioAllowlistEntry[]>

let testOverride: PortfolioAllowlist | null = null

export function setPortfolioAllowlistForTests(allowlist: PortfolioAllowlist | null): void {
  testOverride = allowlist
}

function parsePortfolioAllowlistFromEnv(): PortfolioAllowlist {
  const raw = process.env.SPONSOR_PASSPORT_PORTFOLIO_JSON
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const allowlist: PortfolioAllowlist = {}
    for (const [sponsorOrgId, entries] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(entries)) continue
      allowlist[sponsorOrgId] = entries
        .filter((entry): entry is PortfolioAllowlistEntry => {
          return (
            !!entry &&
            typeof entry === 'object' &&
            typeof (entry as PortfolioAllowlistEntry).institutionId === 'string'
          )
        })
        .map((entry) => ({
          institutionId: entry.institutionId,
          displayName: entry.displayName,
          location: entry.location,
          memberSince: entry.memberSince,
        }))
    }
    return allowlist
  } catch {
    return {}
  }
}

export function getPortfolioAllowlist(): PortfolioAllowlist {
  return testOverride ?? parsePortfolioAllowlistFromEnv()
}

export function getAllowedInstitutions(sponsorOrgId: string): PortfolioAllowlistEntry[] {
  return getPortfolioAllowlist()[sponsorOrgId] ?? []
}

export function isInstitutionInPortfolioAllowlist(
  sponsorOrgId: string,
  institutionId: string,
): boolean {
  return getAllowedInstitutions(sponsorOrgId).some((entry) => entry.institutionId === institutionId)
}

export function getAllowlistEntry(
  sponsorOrgId: string,
  institutionId: string,
): PortfolioAllowlistEntry | undefined {
  return getAllowedInstitutions(sponsorOrgId).find((entry) => entry.institutionId === institutionId)
}
