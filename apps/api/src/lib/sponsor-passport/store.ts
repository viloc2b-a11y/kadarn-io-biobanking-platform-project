/**
 * RC-11.1 — Sponsor Passport store abstraction (RC-10.2 contract boundary).
 *
 * Routes depend on PassportStore, not on mock or Evidence Core directly.
 */

import type {
  InstitutionalPassport,
  PassportClaimProvenanceDetail,
  PassportPortfolioIndexResponse,
} from './types'

export interface PassportStore {
  getPortfolioIndex(sponsorOrgId: string): Promise<PassportPortfolioIndexResponse>

  getInstitutionalPassport(
    sponsorOrgId: string,
    institutionId: string,
  ): Promise<InstitutionalPassport | undefined>

  getClaimProvenanceDetail(
    sponsorOrgId: string,
    institutionId: string,
    claimId: string,
  ): Promise<PassportClaimProvenanceDetail | undefined>

  isInstitutionInPortfolio(sponsorOrgId: string, institutionId: string): Promise<boolean>
}
