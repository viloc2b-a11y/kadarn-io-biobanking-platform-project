/**
 * Stability domain transitions.
 */

import {
  STABILITY_DOMAIN_STATE,
  STABILITY_REVIEW_STATUS,
  STABILITY_TRANSITION_REASON,
  type StabilityDecision,
  type StabilityDomainEvaluator,
  type StabilityEvaluationPolicy,
  type StabilityKnowledgeSignal,
  type StabilityLifecycleSnapshot,
  type StabilityMovementSignal,
  type StabilityReviewSignal,
  type StabilityTransitionReason,
} from './types'

export const DEFAULT_STABILITY_EVALUATION_POLICY = {
  recentMovementWindowDays: 30,
} as const

function toPolicy(
  policy?: Partial<StabilityEvaluationPolicy>,
): StabilityEvaluationPolicy {
  return {
    referenceDate: policy?.referenceDate ?? new Date(),
    recentMovementWindowDays:
      policy?.recentMovementWindowDays ??
      DEFAULT_STABILITY_EVALUATION_POLICY.recentMovementWindowDays,
  }
}

function assertValidPolicy(policy: StabilityEvaluationPolicy): void {
  if (Number.isNaN(policy.referenceDate.getTime())) {
    throw new Error('Invalid stability evaluation reference date')
  }

  if (!Number.isFinite(policy.recentMovementWindowDays) || policy.recentMovementWindowDays < 0) {
    throw new Error('Invalid stability recent movement window')
  }
}

function openReviews(reviewSignals: StabilityReviewSignal[]): StabilityReviewSignal[] {
  return reviewSignals.filter((signal) => signal.status === STABILITY_REVIEW_STATUS.OPEN)
}

function contestedKnowledge(
  knowledgeSignals: StabilityKnowledgeSignal[],
): StabilityKnowledgeSignal[] {
  return knowledgeSignals.filter((signal) => signal.contested || signal.hasCounterEvidence)
}

function insufficientKnowledge(
  knowledgeSignals: StabilityKnowledgeSignal[],
): StabilityKnowledgeSignal[] {
  return knowledgeSignals.filter((signal) => signal.confidence === 'Insufficient')
}

function unsupportedKnowledge(
  knowledgeSignals: StabilityKnowledgeSignal[],
): StabilityKnowledgeSignal[] {
  return knowledgeSignals.filter((signal) => !signal.hasSupportingEvidence)
}

function decayedKnowledge(
  knowledgeSignals: StabilityKnowledgeSignal[],
): StabilityKnowledgeSignal[] {
  return knowledgeSignals.filter((signal) => signal.temporalState === 'decayed')
}

function agingKnowledge(
  knowledgeSignals: StabilityKnowledgeSignal[],
): StabilityKnowledgeSignal[] {
  return knowledgeSignals.filter((signal) => signal.temporalState === 'aging')
}

function isRecentMovement(
  signal: StabilityMovementSignal,
  policy: StabilityEvaluationPolicy,
): boolean {
  const occurredAt = new Date(signal.occurredAt)
  if (Number.isNaN(occurredAt.getTime())) return false

  const elapsedMs = policy.referenceDate.getTime() - occurredAt.getTime()
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)
  return elapsedDays >= 0 && elapsedDays <= policy.recentMovementWindowDays
}

function recentMovements(
  movementSignals: StabilityMovementSignal[],
  policy: StabilityEvaluationPolicy,
): StabilityMovementSignal[] {
  return movementSignals.filter((signal) => isRecentMovement(signal, policy))
}

function claimIds(signals: StabilityKnowledgeSignal[]): string[] {
  return signals.map((signal) => signal.claimId)
}

function buildDecision(params: {
  snapshot: StabilityLifecycleSnapshot
  policy: StabilityEvaluationPolicy
  state: StabilityDecision['state']
  reason: StabilityTransitionReason
  supportingClaimIds?: string[]
  supportingReviewIds?: string[]
  supportingMovementIds?: string[]
}): StabilityDecision {
  return {
    state: params.state,
    transition: {
      from: params.snapshot.previousState,
      to: params.state,
      reason: params.reason,
    },
    supportingClaimIds: params.supportingClaimIds ?? [],
    supportingReviewIds: params.supportingReviewIds ?? [],
    supportingMovementIds: params.supportingMovementIds ?? [],
    evaluatedAt: params.policy.referenceDate.toISOString(),
  }
}

export function evaluateStabilityDomain(
  snapshot: StabilityLifecycleSnapshot,
  policyInput?: Partial<StabilityEvaluationPolicy>,
): StabilityDecision {
  const policy = toPolicy(policyInput)
  assertValidPolicy(policy)

  const reviews = openReviews(snapshot.reviewSignals)
  if (reviews.length > 0) {
    return buildDecision({
      snapshot,
      policy,
      state: STABILITY_DOMAIN_STATE.UNDER_REVIEW,
      reason: STABILITY_TRANSITION_REASON.OPEN_REVIEW,
      supportingReviewIds: reviews.map((review) => review.id),
    })
  }

  const contested = contestedKnowledge(snapshot.knowledgeSignals)
  if (contested.length > 0) {
    return buildDecision({
      snapshot,
      policy,
      state: STABILITY_DOMAIN_STATE.UNDER_REVIEW,
      reason: STABILITY_TRANSITION_REASON.CONTESTED_KNOWLEDGE,
      supportingClaimIds: claimIds(contested),
    })
  }

  if (snapshot.knowledgeSignals.length === 0) {
    return buildDecision({
      snapshot,
      policy,
      state: STABILITY_DOMAIN_STATE.EVIDENCE_REFRESH_NEEDED,
      reason: STABILITY_TRANSITION_REASON.NO_KNOWLEDGE_SIGNALS,
    })
  }

  const insufficient = insufficientKnowledge(snapshot.knowledgeSignals)
  if (insufficient.length > 0) {
    return buildDecision({
      snapshot,
      policy,
      state: STABILITY_DOMAIN_STATE.EVIDENCE_REFRESH_NEEDED,
      reason: STABILITY_TRANSITION_REASON.INSUFFICIENT_CONFIDENCE,
      supportingClaimIds: claimIds(insufficient),
    })
  }

  const unsupported = unsupportedKnowledge(snapshot.knowledgeSignals)
  if (unsupported.length > 0) {
    return buildDecision({
      snapshot,
      policy,
      state: STABILITY_DOMAIN_STATE.EVIDENCE_REFRESH_NEEDED,
      reason: STABILITY_TRANSITION_REASON.MISSING_SUPPORT,
      supportingClaimIds: claimIds(unsupported),
    })
  }

  const decayed = decayedKnowledge(snapshot.knowledgeSignals)
  if (decayed.length > 0) {
    return buildDecision({
      snapshot,
      policy,
      state: STABILITY_DOMAIN_STATE.EVIDENCE_REFRESH_NEEDED,
      reason: STABILITY_TRANSITION_REASON.DECAYED_EVIDENCE,
      supportingClaimIds: claimIds(decayed),
    })
  }

  const movements = recentMovements(snapshot.movementSignals, policy)
  if (movements.length > 0) {
    return buildDecision({
      snapshot,
      policy,
      state: STABILITY_DOMAIN_STATE.EVOLVING,
      reason: STABILITY_TRANSITION_REASON.RECENT_MOVEMENT,
      supportingMovementIds: movements.map((movement) => movement.id),
    })
  }

  const aging = agingKnowledge(snapshot.knowledgeSignals)
  if (aging.length > 0) {
    return buildDecision({
      snapshot,
      policy,
      state: STABILITY_DOMAIN_STATE.EVOLVING,
      reason: STABILITY_TRANSITION_REASON.AGING_EVIDENCE,
      supportingClaimIds: claimIds(aging),
    })
  }

  return buildDecision({
    snapshot,
    policy,
    state: STABILITY_DOMAIN_STATE.STABLE,
    reason: STABILITY_TRANSITION_REASON.QUIET_CURRENT_KNOWLEDGE,
  })
}

export const stabilityDomainEvaluator: StabilityDomainEvaluator = {
  evaluate: evaluateStabilityDomain,
}
