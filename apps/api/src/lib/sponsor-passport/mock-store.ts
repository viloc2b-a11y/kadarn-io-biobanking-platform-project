/**
 * RC-10.3 — In-memory sponsor passport store (mock only, no DB).
 */

import type {
  InstitutionalPassport,
  PassportClaimProvenanceDetail,
  PassportInstitutionSummary,
  PassportPortfolioIndexResponse,
} from './types'
import { getPassportByInstitutionId, getPortfolioInstitutions } from './mock-data'

export function getPortfolioIndex(): PassportPortfolioIndexResponse {
  return { items: getPortfolioInstitutions() }
}

export function getInstitutionalPassport(institutionId: string): InstitutionalPassport | undefined {
  return getPassportByInstitutionId(institutionId)
}

export function getClaimProvenanceDetail(
  institutionId: string,
  claimId: string,
): PassportClaimProvenanceDetail | undefined {
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

export function listInstitutionIds(): string[] {
  return getPortfolioInstitutions().map((i: PassportInstitutionSummary) => i.institutionId)
}
