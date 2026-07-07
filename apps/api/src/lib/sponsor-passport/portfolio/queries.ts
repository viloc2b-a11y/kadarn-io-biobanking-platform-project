/**
 * RC-12.1C - Persistent Sponsor Portfolio query layer.
 */

import type { DbClient } from '@kadarn/evidence-core'
import {
  SPONSOR_PORTFOLIO_MEMBERSHIP_STATUS,
  type SponsorPortfolioMembershipRecord,
} from './types'

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value)
}

function stringOrToday(value: unknown): string {
  if (value) return String(value).slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

export function mapSponsorPortfolioMembershipRow(
  row: Record<string, unknown>,
): SponsorPortfolioMembershipRecord {
  return {
    institutionId: String(row.institution_org_id),
    status: String(row.status) as SponsorPortfolioMembershipRecord['status'],
    memberSince: stringOrToday(row.member_since),
    displayNameOverride: nullableString(row.display_name_override),
    locationOverride: nullableString(row.location_override),
  }
}

export async function readActiveSponsorPortfolioMemberships(
  db: DbClient,
  sponsorOrgId: string,
): Promise<SponsorPortfolioMembershipRecord[]> {
  const { data, error } = await db
    .from('sponsor_portfolio_memberships')
    .select('*')
    .eq('sponsor_org_id', sponsorOrgId)

  if (error) throw new Error(`Failed to read sponsor portfolio memberships: ${error}`)

  const rows = ((data as Record<string, unknown>[]) ?? []).map(mapSponsorPortfolioMembershipRow)
  return rows.filter((row) => row.status === SPONSOR_PORTFOLIO_MEMBERSHIP_STATUS.ACTIVE)
}

export async function readActiveSponsorPortfolioMembership(
  db: DbClient,
  sponsorOrgId: string,
  institutionId: string,
): Promise<SponsorPortfolioMembershipRecord | undefined> {
  const memberships = await readActiveSponsorPortfolioMemberships(db, sponsorOrgId)
  return memberships.find((membership) => membership.institutionId === institutionId)
}
