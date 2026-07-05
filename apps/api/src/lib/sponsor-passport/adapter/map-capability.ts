/**
 * RC-11.6 — Group existing claims into PassportCapability (no inference).
 */

import type { Claim, EvidenceNode } from '@kadarn/evidence-core'
import type {
  CapabilityTemporalState,
  ConfidenceLevel,
  PassportCapability,
  PassportClaim,
} from '../types'
import type { InstitutionEvidenceRead } from './queries'
import { toCandidateStatement } from './map-statement'

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  Insufficient: 1,
  Low: 2,
  Moderate: 3,
  High: 4,
}

function humanizeTaxonomyId(taxonomyId: string): string {
  const segment = taxonomyId.split('.').pop() ?? taxonomyId
  return segment.replace(/_/g, ' ')
}

function capabilityIdForTaxonomy(taxonomyId: string): string {
  return `cap-${taxonomyId.replace(/\./g, '-')}`
}

function lowestConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  return levels.reduce((current, level) =>
    CONFIDENCE_RANK[level] < CONFIDENCE_RANK[current] ? level : current,
  )
}

function parseEvidenceDate(value: string): Date | null {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function mapCapabilityTemporalState(params: {
  claim: Claim
  evidenceNodes: EvidenceNode[]
  referenceDate?: Date
}): CapabilityTemporalState {
  const { claim, evidenceNodes, referenceDate = new Date() } = params
  const supportingNodes = evidenceNodes.filter((node) => node.weight >= 0)

  if (supportingNodes.length === 0) {
    return 'aging'
  }

  const latestEvidenceDate = supportingNodes.reduce<Date | null>((latest, node) => {
    const parsed = parseEvidenceDate(node.date)
    if (!parsed) return latest
    if (!latest || parsed > latest) return parsed
    return latest
  }, null)

  if (!latestEvidenceDate) {
    return 'aging'
  }

  if (!claim.decays || claim.decayPeriodMonths == null) {
    return 'fresh'
  }

  const elapsedMs = referenceDate.getTime() - latestEvidenceDate.getTime()
  const elapsedMonths = elapsedMs / (1000 * 60 * 60 * 24 * 30)

  if (elapsedMonths >= claim.decayPeriodMonths) {
    return 'decayed'
  }

  if (elapsedMonths >= claim.decayPeriodMonths * 0.7) {
    return 'aging'
  }

  return 'fresh'
}

export function mapCapabilitiesFromClaims(params: {
  read: InstitutionEvidenceRead
  passportClaims: PassportClaim[]
}): PassportCapability[] {
  const claimsByTaxonomy = new Map<string, { claims: Claim[]; passportClaims: PassportClaim[] }>()

  for (const claim of params.read.claims) {
    const existing = claimsByTaxonomy.get(claim.claimTypeId) ?? { claims: [], passportClaims: [] }
    existing.claims.push(claim)
    claimsByTaxonomy.set(claim.claimTypeId, existing)
  }

  for (const passportClaim of params.passportClaims) {
    const existing = claimsByTaxonomy.get(passportClaim.taxonomyId)
    if (existing) {
      existing.passportClaims.push(passportClaim)
    }
  }

  const capabilities: PassportCapability[] = []

  for (const [taxonomyId, group] of claimsByTaxonomy.entries()) {
    const primaryClaim = group.claims[0]
    const label = primaryClaim.name || humanizeTaxonomyId(taxonomyId)
    const capabilityLabel = label.replace(/^evidence suggests\s+/i, '')

    const groupedEvidence = group.claims.flatMap(
      (claim) => params.read.evidenceByClaimId[claim.id] ?? [],
    )

    const temporalState = mapCapabilityTemporalState({
      claim: primaryClaim,
      evidenceNodes: groupedEvidence,
    })

    const confidenceLevels = group.passportClaims.map((claim) => claim.confidence)
    const confidence =
      confidenceLevels.length > 0 ? lowestConfidence(confidenceLevels) : ('Insufficient' as ConfidenceLevel)

    capabilities.push({
      id: capabilityIdForTaxonomy(taxonomyId),
      taxonomyId,
      label,
      candidateStatement: toCandidateStatement(`${capabilityLabel} capability at this institution`),
      confidence,
      temporalState,
      supportingClaimIds: group.passportClaims.map((claim) => claim.id),
    })
  }

  return capabilities.sort((a, b) => a.taxonomyId.localeCompare(b.taxonomyId))
}
