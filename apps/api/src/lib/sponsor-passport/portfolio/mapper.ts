/**
 * RC-12.1C - Persistent membership row -> portfolio read model.
 */

import type {
  SponsorPortfolioInstitutionReadModel,
  SponsorPortfolioMembershipRecord,
} from './types'

export function mapMembershipToPortfolioInstitution(
  membership: SponsorPortfolioMembershipRecord,
): SponsorPortfolioInstitutionReadModel {
  return {
    institutionId: membership.institutionId,
    displayName: membership.displayNameOverride ?? undefined,
    location: membership.locationOverride ?? undefined,
    memberSince: membership.memberSince,
  }
}
