/**
 * RC-11.2 — Sponsor passport Evidence Core read queries.
 *
 * institutionId (RC-10.2 wire) maps to site organization_id in Evidence Core.
 * No DTO mapping or confidence evaluation — RC-11.3+.
 */

import type { Claim, DbClient, EvidenceNode } from '@kadarn/evidence-core'
import { getOrganizationEvidenceRead } from '@kadarn/evidence-core'

export interface InstitutionEvidenceRead {
  /** Site organization UUID — RC-10.2 institutionId in production */
  institutionId: string
  claims: Claim[]
  evidenceNodes: EvidenceNode[]
  evidenceByClaimId: Record<string, EvidenceNode[]>
}

export async function readInstitutionEvidence(
  db: DbClient,
  institutionId: string,
): Promise<InstitutionEvidenceRead> {
  const { claims, evidenceNodes } = await getOrganizationEvidenceRead(db, institutionId)

  const evidenceByClaimId: Record<string, EvidenceNode[]> = {}
  for (const claim of claims) {
    evidenceByClaimId[claim.id] = []
  }
  for (const node of evidenceNodes) {
    if (!evidenceByClaimId[node.claimId]) {
      evidenceByClaimId[node.claimId] = []
    }
    evidenceByClaimId[node.claimId].push(node)
  }

  return {
    institutionId,
    claims,
    evidenceNodes,
    evidenceByClaimId,
  }
}
