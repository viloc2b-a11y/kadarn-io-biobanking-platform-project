/**
 * RC-12.1C - Sponsor Portfolio repository.
 */

import type { DbClient } from '@kadarn/evidence-core'
import { mapMembershipToPortfolioInstitution } from './mapper'
import {
  readActiveSponsorPortfolioMembership,
  readActiveSponsorPortfolioMemberships,
} from './queries'
import type { SponsorPortfolioInstitutionReadModel } from './types'

export interface SponsorPortfolioRepository {
  listActiveInstitutions(sponsorOrgId: string): Promise<SponsorPortfolioInstitutionReadModel[]>
  getActiveInstitution(
    sponsorOrgId: string,
    institutionId: string,
  ): Promise<SponsorPortfolioInstitutionReadModel | undefined>
  hasActiveInstitution(sponsorOrgId: string, institutionId: string): Promise<boolean>
}

export class SupabaseSponsorPortfolioRepository implements SponsorPortfolioRepository {
  constructor(private readonly db: DbClient) {}

  async listActiveInstitutions(
    sponsorOrgId: string,
  ): Promise<SponsorPortfolioInstitutionReadModel[]> {
    const memberships = await readActiveSponsorPortfolioMemberships(this.db, sponsorOrgId)
    return memberships.map(mapMembershipToPortfolioInstitution)
  }

  async getActiveInstitution(
    sponsorOrgId: string,
    institutionId: string,
  ): Promise<SponsorPortfolioInstitutionReadModel | undefined> {
    const membership = await readActiveSponsorPortfolioMembership(this.db, sponsorOrgId, institutionId)
    return membership ? mapMembershipToPortfolioInstitution(membership) : undefined
  }

  async hasActiveInstitution(sponsorOrgId: string, institutionId: string): Promise<boolean> {
    return !!(await this.getActiveInstitution(sponsorOrgId, institutionId))
  }
}
