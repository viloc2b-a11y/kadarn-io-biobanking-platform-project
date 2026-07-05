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

export interface OrganizationRecord {
  id: string
  name: string
  legalName: string | null
  city: string | null
  region: string | null
  country: string
}

function mapOrganizationRow(row: Record<string, unknown>): OrganizationRecord {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    legalName: row.legal_name ? String(row.legal_name) : null,
    city: row.city ? String(row.city) : null,
    region: row.region ? String(row.region) : null,
    country: String(row.country ?? ''),
  }
}

export async function readOrganization(
  db: DbClient,
  organizationId: string,
): Promise<OrganizationRecord | null> {
  const { data, error } = await db.from('organizations').select('*').eq('id', organizationId)
  if (error) throw new Error(`Failed to read organization: ${error}`)

  const row = (data as Record<string, unknown>[])?.[0]
  return row ? mapOrganizationRow(row) : null
}
