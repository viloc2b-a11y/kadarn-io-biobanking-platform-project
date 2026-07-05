/**
 * RC-11.8 — Conservative adapter recommendations from claim/evidence state.
 *
 * No AI. Only supported sponsor actions derived from evaluated claims.
 */

import type { EvidenceNode } from '@kadarn/evidence-core'
import type { PassportClaim, PassportRecommendation } from '../types'
import { mapCapabilityTemporalState } from './map-capability'
import type { InstitutionEvidenceRead } from './queries'

type RecommendationKind = 'contested' | 'insufficient' | 'refresh'

const KIND_PRIORITY: Record<RecommendationKind, number> = {
  contested: 0,
  insufficient: 1,
  refresh: 2,
}

interface DraftRecommendation {
  kind: RecommendationKind
  id: string
  action: string
  reason: string
  expectedImpact: string
  supportingClaimIds: string[]
}

function hasSupportingEvidence(nodes: EvidenceNode[]): boolean {
  return nodes.some((node) => node.weight >= 0)
}

function hasCounterEvidence(nodes: EvidenceNode[]): boolean {
  return nodes.some((node) => node.weight < 0)
}

function buildDraftForClaim(params: {
  read: InstitutionEvidenceRead
  passportClaim: PassportClaim
  referenceDate: Date
}): DraftRecommendation | null {
  const { read, passportClaim, referenceDate } = params
  const coreClaim = read.claims.find((claim) => claim.id === passportClaim.id)
  if (!coreClaim) return null

  const evidenceNodes = read.evidenceByClaimId[passportClaim.id] ?? []
  const supportingEvidence = hasSupportingEvidence(evidenceNodes)
  const contested = passportClaim.contested || hasCounterEvidence(evidenceNodes)
  const temporalState = mapCapabilityTemporalState({
    claim: coreClaim,
    evidenceNodes,
    referenceDate,
  })

  if (contested) {
    return {
      kind: 'contested',
      id: `rec-contested-${passportClaim.id}`,
      action: `Review contested claim: ${coreClaim.name}`,
      reason: `Unresolved counter-evidence affects ${coreClaim.name}`,
      expectedImpact:
        'Clarifies contested status before sponsor reliance on this claim',
      supportingClaimIds: [passportClaim.id],
    }
  }

  if (passportClaim.confidence === 'Insufficient' || !supportingEvidence) {
    return {
      kind: 'insufficient',
      id: `rec-insufficient-${passportClaim.id}`,
      action: `Request additional evidence for ${coreClaim.name}`,
      reason: `${coreClaim.name} currently has insufficient supporting evidence`,
      expectedImpact:
        'May raise claim confidence once qualifying evidence is submitted',
      supportingClaimIds: [passportClaim.id],
    }
  }

  if (supportingEvidence && (temporalState === 'aging' || temporalState === 'decayed')) {
    const horizon =
      temporalState === 'decayed'
        ? 'past the decay horizon'
        : 'approaching the decay horizon'

    return {
      kind: 'refresh',
      id: `rec-refresh-${passportClaim.id}`,
      action: `Request refreshed evidence for ${coreClaim.name}`,
      reason: `Supporting evidence for ${coreClaim.name} is ${horizon}`,
      expectedImpact: 'May restore claim confidence after evidence refresh',
      supportingClaimIds: [passportClaim.id],
    }
  }

  return null
}

export function mapRecommendationsFromPassport(params: {
  read: InstitutionEvidenceRead
  passportClaims: PassportClaim[]
  referenceDate?: Date
}): PassportRecommendation[] {
  const referenceDate = params.referenceDate ?? new Date()
  const drafts: DraftRecommendation[] = []

  for (const passportClaim of params.passportClaims) {
    const draft = buildDraftForClaim({
      read: params.read,
      passportClaim,
      referenceDate,
    })
    if (draft) drafts.push(draft)
  }

  drafts.sort((a, b) => {
    const byKind = KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]
    if (byKind !== 0) return byKind
    return a.id.localeCompare(b.id)
  })

  return drafts.map((draft, index) => ({
    id: draft.id,
    action: draft.action,
    reason: draft.reason,
    expectedImpact: draft.expectedImpact,
    isNextAction: index === 0,
    supportingClaimIds: draft.supportingClaimIds,
  }))
}
