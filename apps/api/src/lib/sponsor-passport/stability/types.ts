/**
 * RC-12.2B - Stability Domain Model.
 *
 * Internal domain types only. These do not change the RC-10.2 wire contract.
 */

import type {
  CapabilityTemporalState,
  ConfidenceLevel,
  StabilityIndicator,
} from '../types'

export const STABILITY_DOMAIN_STATE = {
  STABLE: 'Stable',
  EVOLVING: 'Evolving',
  UNDER_REVIEW: 'Under Review',
  EVIDENCE_REFRESH_NEEDED: 'Evidence Refresh Needed',
} as const satisfies Record<string, StabilityIndicator>

export type StabilityDomainState =
  (typeof STABILITY_DOMAIN_STATE)[keyof typeof STABILITY_DOMAIN_STATE]

export const STABILITY_REVIEW_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const

export type StabilityReviewStatus =
  (typeof STABILITY_REVIEW_STATUS)[keyof typeof STABILITY_REVIEW_STATUS]

export const STABILITY_TRANSITION_REASON = {
  OPEN_REVIEW: 'open_review',
  CONTESTED_KNOWLEDGE: 'contested_knowledge',
  NO_KNOWLEDGE_SIGNALS: 'no_knowledge_signals',
  INSUFFICIENT_CONFIDENCE: 'insufficient_confidence',
  MISSING_SUPPORT: 'missing_support',
  DECAYED_EVIDENCE: 'decayed_evidence',
  RECENT_MOVEMENT: 'recent_movement',
  AGING_EVIDENCE: 'aging_evidence',
  QUIET_CURRENT_KNOWLEDGE: 'quiet_current_knowledge',
} as const

export type StabilityTransitionReason =
  (typeof STABILITY_TRANSITION_REASON)[keyof typeof STABILITY_TRANSITION_REASON]

export interface StabilityKnowledgeSignal {
  claimId: string
  confidence: ConfidenceLevel
  temporalState: CapabilityTemporalState
  hasSupportingEvidence: boolean
  hasCounterEvidence: boolean
  contested: boolean
}

export interface StabilityReviewSignal {
  id: string
  subjectId: string
  status: StabilityReviewStatus
}

export interface StabilityMovementSignal {
  id: string
  occurredAt: string
}

export interface StabilityEvaluationPolicy {
  referenceDate: Date
  recentMovementWindowDays: number
}

export interface StabilityLifecycleSnapshot {
  institutionId: string
  knowledgeSignals: StabilityKnowledgeSignal[]
  reviewSignals: StabilityReviewSignal[]
  movementSignals: StabilityMovementSignal[]
  previousState?: StabilityDomainState
}

export interface StabilityTransition {
  from?: StabilityDomainState
  to: StabilityDomainState
  reason: StabilityTransitionReason
}

export interface StabilityDecision {
  state: StabilityDomainState
  transition: StabilityTransition
  supportingClaimIds: string[]
  supportingReviewIds: string[]
  supportingMovementIds: string[]
  evaluatedAt: string
}

export interface StabilityDomainEvaluator {
  evaluate(
    snapshot: StabilityLifecycleSnapshot,
    policy?: Partial<StabilityEvaluationPolicy>,
  ): StabilityDecision
}
