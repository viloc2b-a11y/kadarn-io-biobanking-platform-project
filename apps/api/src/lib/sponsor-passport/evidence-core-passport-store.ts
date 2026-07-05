/**
 * RC-11.1 — Evidence Core passport store (RC-11.2 reads / RC-11.3 DTO wiring).
 *
 * PassportStore methods remain unimplemented until RC-11.3.
 * Repository reads: adapter/queries.ts + @kadarn/evidence-core repository.
 */

import type { PassportStore } from './store'
import type {
  InstitutionalPassport,
  PassportClaimProvenanceDetail,
  PassportPortfolioIndexResponse,
} from './types'

export const EVIDENCE_CORE_STORE_NOT_IMPLEMENTED =
  'EvidenceCorePassportStore PassportStore methods not implemented (RC-11.3)'

function notImplemented(): never {
  throw new Error(EVIDENCE_CORE_STORE_NOT_IMPLEMENTED)
}

export class EvidenceCorePassportStore implements PassportStore {
  async getPortfolioIndex(_sponsorOrgId: string): Promise<PassportPortfolioIndexResponse> {
    notImplemented()
  }

  async getInstitutionalPassport(
    _sponsorOrgId: string,
    _institutionId: string,
  ): Promise<InstitutionalPassport | undefined> {
    notImplemented()
  }

  async getClaimProvenanceDetail(
    _sponsorOrgId: string,
    _institutionId: string,
    _claimId: string,
  ): Promise<PassportClaimProvenanceDetail | undefined> {
    notImplemented()
  }

  async isInstitutionInPortfolio(_sponsorOrgId: string, _institutionId: string): Promise<boolean> {
    notImplemented()
  }
}
