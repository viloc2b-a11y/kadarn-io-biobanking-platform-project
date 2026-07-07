/**
 * RC-12.1C - Persistent Sponsor Portfolio read model.
 *
 * Portfolio membership is access scope. Evidence Core remains the source of
 * truth for claims, evidence, and provenance.
 */

export const SPONSOR_PORTFOLIO_MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  REMOVED: 'removed',
} as const

export type SponsorPortfolioMembershipStatus =
  (typeof SPONSOR_PORTFOLIO_MEMBERSHIP_STATUS)[keyof typeof SPONSOR_PORTFOLIO_MEMBERSHIP_STATUS]

export interface SponsorPortfolioMembershipRecord {
  institutionId: string
  status: SponsorPortfolioMembershipStatus
  memberSince: string
  displayNameOverride: string | null
  locationOverride: string | null
}

export interface SponsorPortfolioInstitutionReadModel {
  institutionId: string
  displayName?: string
  location?: string
  memberSince: string
}
