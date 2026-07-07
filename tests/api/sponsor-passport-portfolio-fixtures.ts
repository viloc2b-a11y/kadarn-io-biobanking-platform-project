import type { DbClient } from '../../packages/evidence-core/src/db.js'

export interface SponsorPortfolioTestEntry {
  institutionId: string
  displayName?: string
  location?: string
  memberSince?: string
}

export async function seedSponsorPortfolioMemberships(
  db: DbClient,
  sponsorOrgId: string,
  entries: SponsorPortfolioTestEntry[],
): Promise<void> {
  const portfolioId = `portfolio-${sponsorOrgId}`

  await db.from('sponsor_portfolios').insert({
    id: portfolioId,
    sponsor_org_id: sponsorOrgId,
    name: 'Test Sponsor Portfolio',
    status: 'active',
    version: 1,
    created_at: '2026-07-05T00:00:00.000Z',
    updated_at: '2026-07-05T00:00:00.000Z',
    metadata: {},
  })

  for (const entry of entries) {
    await db.from('sponsor_portfolio_memberships').insert({
      id: `membership-${sponsorOrgId}-${entry.institutionId}`,
      portfolio_id: portfolioId,
      sponsor_org_id: sponsorOrgId,
      institution_org_id: entry.institutionId,
      status: 'active',
      member_since: entry.memberSince ?? '2026-07-05',
      display_name_override: entry.displayName ?? null,
      location_override: entry.location ?? null,
      version: 1,
      created_at: '2026-07-05T00:00:00.000Z',
      updated_at: '2026-07-05T00:00:00.000Z',
      metadata: {},
    })
  }
}
