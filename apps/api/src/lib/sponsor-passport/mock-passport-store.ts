/**
 * RC-11.1 — In-memory sponsor passport store (mock only, no DB).
 *
 * Formerly mock-store.ts (RC-10.3).
 */

import type { PassportStore } from './store'
import type {
  InstitutionalPassport,
  PassportClaimProvenanceDetail,
  PassportInstitutionSummary,
  PassportPortfolioIndexResponse,
} from './types'
import { getPassportByInstitutionId, getPortfolioInstitutions } from './mock-data'

export class MockPassportStore implements PassportStore {
  async getPortfolioIndex(_sponsorOrgId: string): Promise<PassportPortfolioIndexResponse> {
    return { items: getPortfolioInstitutions() }
  }

  async getInstitutionalPassport(
    _sponsorOrgId: string,
    institutionId: string,
  ): Promise<InstitutionalPassport | undefined> {
    return getPassportByInstitutionId(institutionId)
  }

  async getClaimProvenanceDetail(
    _sponsorOrgId: string,
    institutionId: string,
    claimId: string,
  ): Promise<PassportClaimProvenanceDetail | undefined> {
    const passport = getPassportByInstitutionId(institutionId)
    if (!passport) return undefined

    const claim = passport.claims.find((c) => c.id === claimId)
    if (!claim) return undefined

    const sourceDocId = `doc-${claim.id}`
    const supportingNodeId = `evidence-${claim.id}-support`

    const detail: PassportClaimProvenanceDetail = {
      claimId: claim.id,
      institutionId,
      statement: claim.statement,
      confidence: claim.confidence,
      confidenceExplanation: claim.confidenceExplanation,
      contested: claim.contested,
      asOf: claim.asOf,
      minimal: claim.provenance,
      sourceDocuments: [
        {
          id: sourceDocId,
          title: claim.provenance.documentTitle,
          documentDate: claim.provenance.documentDate,
          evidenceClass: claim.provenance.evidenceClass,
        },
      ],
      evidenceNodes: [
        {
          id: supportingNodeId,
          evidenceClass: claim.provenance.evidenceClass,
          label: claim.provenance.documentTitle,
          sourceDocumentId: sourceDocId,
          supportsClaim: true,
          excerpt: claim.provenance.excerpt,
        },
      ],
    }

    if (claim.contested) {
      const contradictId = `evidence-${claim.id}-contradict`
      detail.evidenceNodes.push({
        id: contradictId,
        evidenceClass: 'Class C — maintenance record',
        label: 'Counter-evidence excerpt',
        supportsClaim: false,
        excerpt: 'Conflicting calibration timeline noted; resolution pending.',
      })
      detail.contradictingNodeIds = [contradictId]
    }

    return detail
  }

  async isInstitutionInPortfolio(_sponsorOrgId: string, institutionId: string): Promise<boolean> {
    return listInstitutionIds().includes(institutionId)
  }
}

/** Test helper — portfolio institution ids from mock fixtures. */
export function listInstitutionIds(): string[] {
  return getPortfolioInstitutions().map((i: PassportInstitutionSummary) => i.institutionId)
}
