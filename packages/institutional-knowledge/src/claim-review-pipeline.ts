// ==========================================================================
// IKM/EVM Sprint — Claim Review & Readiness Synchronization
// ==========================================================================
// Closes the pipeline: ClaimCandidate → Review → Claim → Confidence → Readiness.
// No automatic claim creation. Every decision is audited. Readiness remains derived.
// ==========================================================================

import type { EvidenceNode } from '../../evidence-core/src/index'
import type {
  ClaimCandidate, ClaimCandidateStatus,
} from './promotion-pipeline'
import type { KnowledgeItem } from './types'

// ==========================================================================
// PART 1 — Review Types
// ==========================================================================

export type ReviewerRole =
  | 'system_rule'
  | 'kadarn_reviewer'
  | 'institution_admin'
  | 'external_reviewer'

export type ReviewDecision =
  | 'accepted'
  | 'rejected'
  | 'needs_more_evidence'
  | 'deferred'

export interface ReviewResult {
  reviewId: string
  claimCandidateId: string
  reviewer: string
  reviewerRole: ReviewerRole
  decision: ReviewDecision
  decisionReason: string
  reviewedAt: string
  supportingEvidenceIds: string[]
  missingEvidence: string[]
  requiredNextAction: string | null
  auditReference: string
  previousStatus: ClaimCandidateStatus
  newStatus: ClaimCandidateStatus
}

export interface ReviewCommand {
  claimCandidate: ClaimCandidate
  reviewer: string
  reviewerRole: ReviewerRole
  decision: ReviewDecision
  reason: string
  evidenceNode: EvidenceNode
  knowledgeItem: KnowledgeItem
}

// ==========================================================================
// PART 2 — Claim Review Runtime
// ==========================================================================

/**
 * Apply a review decision to a ClaimCandidate.
 *
 * Transitions:
 *   proposed → under_review (implicit, before review)
 *   under_review → accepted | rejected | needs_more_evidence | deferred
 *   needs_more_evidence → under_review → accepted | rejected
 *   accepted → superseded (if newer evidence supersedes)
 */
export function reviewClaimCandidate(command: ReviewCommand): ReviewResult {
  const previousStatus = command.claimCandidate.status
  let newStatus: ClaimCandidateStatus

  switch (command.decision) {
    case 'accepted':
      newStatus = 'accepted'
      validateAcceptEligibility(command)
      break
    case 'rejected':
      newStatus = 'rejected'
      break
    case 'needs_more_evidence':
      newStatus = 'needs_more_evidence' as ClaimCandidateStatus // will be set in candidate
      break
    case 'deferred':
      newStatus = 'under_review'
      break
    default:
      throw new Error(`Unknown review decision: ${command.decision}`)
  }

  const reviewId = `review-${command.claimCandidate.id}-${Date.now()}`
  const now = new Date().toISOString()

  const result: ReviewResult = {
    reviewId,
    claimCandidateId: command.claimCandidate.id,
    reviewer: command.reviewer,
    reviewerRole: command.reviewerRole,
    decision: command.decision,
    decisionReason: command.reason,
    reviewedAt: now,
    supportingEvidenceIds: [command.evidenceNode.id],
    missingEvidence: command.decision === 'needs_more_evidence'
      ? identifyMissingEvidence(command.claimCandidate, command.evidenceNode)
      : [],
    requiredNextAction: determineNextAction(command.decision, command.claimCandidate),
    auditReference: `audit-${reviewId}`,
    previousStatus,
    newStatus,
  }

  return result
}

function validateAcceptEligibility(command: ReviewCommand): void {
  if (!command.evidenceNode) {
    throw new Error('Cannot accept claim candidate without linked evidence node.')
  }
  if (command.evidenceNode.status !== 'active') {
    throw new Error(`Evidence node is not active (status: ${command.evidenceNode.status}). Cannot accept.`)
  }
}

function identifyMissingEvidence(candidate: ClaimCandidate, _node: EvidenceNode): string[] {
  const missing: string[] = []
  if (!candidate.supportingEvidenceId) missing.push('No supporting evidence object linked')
  if (candidate.requiresReview) missing.push('Human review required — not yet completed')
  // Always provide at least one actionable gap for needs_more_evidence
  if (missing.length === 0) missing.push('Additional corroborating evidence recommended')
  return missing
}

function determineNextAction(decision: ReviewDecision, _candidate: ClaimCandidate): string | null {
  switch (decision) {
    case 'accepted': return 'Proceed to claim creation in Evidence Core'
    case 'rejected': return 'Archive candidate or address rejection reason'
    case 'needs_more_evidence': return 'Collect additional evidence and re-submit for review'
    case 'deferred': return 'Await external input before final decision'
    default: return null
  }
}

// ==========================================================================
// PART 3 — Claim Creation / Update on Acceptance
// ==========================================================================

export interface ClaimCreationFromCandidate {
  /** The Claim ID created or updated in Evidence Core */
  claimId: string
  /** Whether this created a new Claim or updated an existing one */
  action: 'created' | 'updated' | 'linked'
  /** The ClaimCandidate that triggered this */
  claimCandidateId: string
  /** The Evidence Object that supports this claim */
  evidenceNodeId: string
  /** The KnowledgeItem that originated this evidence */
  knowledgeItemId: string
  /** The promotion that promoted this evidence */
  promotionId: string
  /** Maturity level at time of claim creation */
  maturityAtCreation: string
  /** Review that accepted this */
  reviewId: string
  /** When the claim was created/updated */
  executedAt: string
  /** Whether prior claim history was preserved */
  historyPreserved: boolean
}

/**
 * Create or update a Claim from an accepted ClaimCandidate.
 *
 * This function PREPARES the command for Evidence Core lifecycle.createClaim.
 * It does NOT execute the claim creation — that remains Evidence Core's responsibility.
 * The caller must pass the result to Evidence Core.
 */
export function prepareClaimFromAcceptedCandidate(params: {
  claimCandidate: ClaimCandidate
  evidenceNode: EvidenceNode
  knowledgeItem: KnowledgeItem
  reviewResult: ReviewResult
  existingClaimId: string | null
}): { claimCommand: ClaimCommandForEvidenceCore; linkResult: ClaimCreationFromCandidate } {
  const now = new Date().toISOString()
  const action: ClaimCreationFromCandidate['action'] = params.existingClaimId ? 'updated' : 'created'

  const claimCommand: ClaimCommandForEvidenceCore = {
    claimTypeId: params.claimCandidate.claimType,
    name: params.claimCandidate.claimStatement.slice(0, 100),
    description: `Claim derived from institutional knowledge. Source: KnowledgeItem "${params.knowledgeItem.id}", EvidenceCandidate "${params.claimCandidate.sourceCandidateId}". Maturity: ${params.knowledgeItem.maturityLevel}.`,
    domain: params.claimCandidate.domain,
    validEvidenceClasses: [params.evidenceNode.evidenceClass],
    requiredEvidenceClasses: [params.evidenceNode.evidenceClass],
    decays: false,
    decayPeriodMonths: null,
    existingClaimId: params.existingClaimId,
  }

  const linkResult: ClaimCreationFromCandidate = {
    claimId: params.existingClaimId ?? `claim-${params.claimCandidate.id}`,
    action,
    claimCandidateId: params.claimCandidate.id,
    evidenceNodeId: params.evidenceNode.id,
    knowledgeItemId: params.knowledgeItem.id,
    promotionId: params.claimCandidate.promotionId,
    maturityAtCreation: params.knowledgeItem.maturityLevel,
    reviewId: params.reviewResult.reviewId,
    executedAt: now,
    historyPreserved: true,
  }

  return { claimCommand, linkResult }
}

/**
 * Command shape that Evidence Core lifecycle expects.
 * This is the bridge contract — do NOT modify Evidence Core to match this.
 */
export interface ClaimCommandForEvidenceCore {
  claimTypeId: string
  name: string
  description: string
  domain: string
  validEvidenceClasses: string[]
  requiredEvidenceClasses: string[]
  decays: boolean
  decayPeriodMonths: number | null
  existingClaimId: string | null
}

// ==========================================================================
// PART 4 — Supersede Candidate
// ==========================================================================

export interface SupersedeResult {
  supersededCandidateId: string
  supersedingCandidateId: string
  supersededBy: 'newer_promotion' | 'newer_evidence' | 'manual_override'
  supersededAt: string
  reason: string
  historyPreserved: boolean
}

/**
 * Supersede a ClaimCandidate with a newer one.
 * Preserves history — old candidate is NOT deleted.
 */
export function supersedeClaimCandidate(params: {
  oldCandidate: ClaimCandidate
  newCandidate: ClaimCandidate
  supersededBy: SupersedeResult['supersededBy']
  reason: string
}): SuperResult {
  if (params.oldCandidate.status === 'superseded') {
    return { result: null, error: `Candidate "${params.oldCandidate.id}" is already superseded.` }
  }

  const result: SupersedeResult = {
    supersededCandidateId: params.oldCandidate.id,
    supersedingCandidateId: params.newCandidate.id,
    supersededBy: params.supersededBy,
    supersededAt: new Date().toISOString(),
    reason: params.reason,
    historyPreserved: true,
  }

  return { result, error: null }
}

// ==========================================================================
// PART 5 — Confidence Synchronization Hook
// ==========================================================================

export interface ConfidenceSyncEvent {
  type: 'confidence_recalculated'
  triggeredBy: 'claim_created' | 'claim_updated' | 'claim_rejected' | 'evidence_added'
  claimId: string
  evidenceNodeId: string
  previousConfidence?: { value: number; level: string }
  newConfidence?: { value: number; level: string }
  syncedAt: string
  knowledgeItemId: string
  promotionId: string
  reviewId: string
}

/**
 * Hook: signal that confidence must be recalculated.
 *
 * This does NOT compute confidence — that belongs to the Readiness Engine.
 * It emits a sync event that downstream systems consume.
 */
export function signalConfidenceRecalculation(params: {
  claimId: string
  evidenceNodeId: string
  triggerType: ConfidenceSyncEvent['triggeredBy']
  knowledgeItemId: string
  promotionId: string
  reviewId: string
  previousConfidence?: { value: number; level: string }
}): ConfidenceSyncEvent {
  return {
    type: 'confidence_recalculated',
    triggeredBy: params.triggerType,
    claimId: params.claimId,
    evidenceNodeId: params.evidenceNodeId,
    previousConfidence: params.previousConfidence,
    newConfidence: undefined, // Computed by Readiness Engine — not here
    syncedAt: new Date().toISOString(),
    knowledgeItemId: params.knowledgeItemId,
    promotionId: params.promotionId,
    reviewId: params.reviewId,
  }
}

// ==========================================================================
// PART 6 — Readiness Synchronization Hook
// ==========================================================================

export interface ReadinessSyncEvent {
  type: 'readiness_synchronized'
  triggeredBy: 'confidence_changed' | 'claim_accepted' | 'claim_rejected' | 'evidence_promoted'
  organizationId: string
  affectedCapabilities: string[]
  affectedClaims: string[]
  previousReadiness?: { status: string; score: number }
  newReadiness?: { status: string; score: number }
  syncedAt: string
  explainability: string
  sourceEventIds: string[]
}

/**
 * Hook: signal that readiness must be recalculated.
 *
 * This does NOT compute readiness — that belongs to the Readiness Engine.
 * It emits a sync event. Readiness remains derived.
 * Every sync must include an explainability trace.
 */
export function signalReadinessRecalculation(params: {
  organizationId: string
  triggerType: ReadinessSyncEvent['triggeredBy']
  affectedClaims: string[]
  affectedCapabilities: string[]
  sourceEventIds: string[]
  previousReadiness?: { status: string; score: number }
}): ReadinessSyncEvent {
  return {
    type: 'readiness_synchronized',
    triggeredBy: params.triggerType,
    organizationId: params.organizationId,
    affectedCapabilities: params.affectedCapabilities,
    affectedClaims: params.affectedClaims,
    previousReadiness: params.previousReadiness,
    newReadiness: undefined, // Computed by Readiness Engine — not here
    syncedAt: new Date().toISOString(),
    explainability: `Readiness recalculation triggered by ${params.triggerType}. Affected claims: ${params.affectedClaims.join(', ') || 'none'}. Readiness remains derived — never manually set.`,
    sourceEventIds: params.sourceEventIds,
  }
}

// ==========================================================================
// PART 7 — Audit Events
// ==========================================================================

export type PipelineEventType =
  | 'claim_candidate_created'
  | 'claim_candidate_reviewed'
  | 'claim_accepted_from_evidence'
  | 'claim_rejected_from_evidence'
  | 'confidence_recalculated'
  | 'readiness_synchronized'
  | 'candidate_superseded'

export interface PipelineEvent {
  eventId: string
  eventType: PipelineEventType
  timestamp: string
  actorId: string | null
  organizationId: string
  sourceKnowledgeItemId: string | null
  sourceEvidenceCandidateId: string | null
  sourceEvidenceObjectId: string | null
  reviewDecision: ReviewDecision | null
  claimId: string | null
  details: string
  metadata: Record<string, unknown>
}

/**
 * Create a pipeline audit event.
 * Every event must preserve the full chain: KnowledgeItem → Candidate → Evidence → Review.
 */
export function createPipelineEvent(params: {
  eventType: PipelineEventType
  actorId?: string
  organizationId: string
  sourceKnowledgeItemId?: string
  sourceEvidenceCandidateId?: string
  sourceEvidenceObjectId?: string
  reviewDecision?: ReviewDecision
  claimId?: string
  details: string
  metadata?: Record<string, unknown>
}): PipelineEvent {
  return {
    eventId: `evt-${params.eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventType: params.eventType,
    timestamp: new Date().toISOString(),
    actorId: params.actorId ?? null,
    organizationId: params.organizationId,
    sourceKnowledgeItemId: params.sourceKnowledgeItemId ?? null,
    sourceEvidenceCandidateId: params.sourceEvidenceCandidateId ?? null,
    sourceEvidenceObjectId: params.sourceEvidenceObjectId ?? null,
    reviewDecision: params.reviewDecision ?? null,
    claimId: params.claimId ?? null,
    details: params.details,
    metadata: params.metadata ?? {},
  }
}

// ==========================================================================
// PART 8 — Full Pipeline Orchestrator
// ==========================================================================

export interface PipelineStep {
  step: 'review' | 'claim_creation' | 'confidence_sync' | 'readiness_sync'
  status: 'pending' | 'executed' | 'failed'
  result: ReviewResult | ClaimCreationFromCandidate | ConfidenceSyncEvent | ReadinessSyncEvent | null
  error: string | null
  events: PipelineEvent[]
}

export interface PipelineRun {
  runId: string
  claimCandidateId: string
  organizationId: string
  startedAt: string
  completedAt: string | null
  steps: PipelineStep[]
  events: PipelineEvent[]
  finalStatus: 'completed' | 'failed' | 'partial'
}

/**
 * Orchestrate the full pipeline: Review → Claim → Confidence → Readiness.
 *
 * This orchestrator sequences the steps but does NOT implement:
 *   - Confidence computation (Readiness Engine)
 *   - Readiness evaluation (Readiness Engine)
 *   - Evidence storage (Evidence Core)
 *   - Claim persistence (Evidence Core lifecycle)
 *
 * It produces the commands and sync events that CALLERS must execute.
 */
export function orchestratePipeline(params: {
  organizationId: string
  claimCandidate: ClaimCandidate
  evidenceNode: EvidenceNode
  knowledgeItem: KnowledgeItem
  reviewer: string
  reviewerRole: ReviewerRole
  decision: ReviewDecision
  reason: string
  existingClaimId: string | null
  previousConfidence?: { value: number; level: string }
  previousReadiness?: { status: string; score: number }
  affectedCapabilities: string[]
}): PipelineRun {
  const runId = `run-${params.claimCandidate.id}-${Date.now()}`
  const now = new Date().toISOString()
  const steps: PipelineStep[] = []
  const events: PipelineEvent[] = []

  // Step 1: Review
  const reviewCmd: ReviewCommand = {
    claimCandidate: params.claimCandidate,
    reviewer: params.reviewer,
    reviewerRole: params.reviewerRole,
    decision: params.decision,
    reason: params.reason,
    evidenceNode: params.evidenceNode,
    knowledgeItem: params.knowledgeItem,
  }

  let reviewResult: ReviewResult
  try {
    reviewResult = reviewClaimCandidate(reviewCmd)
    steps.push({ step: 'review', status: 'executed', result: reviewResult, error: null, events: [] })
    events.push(createPipelineEvent({
      eventType: 'claim_candidate_reviewed',
      actorId: params.reviewer,
      organizationId: params.organizationId,
      sourceKnowledgeItemId: params.knowledgeItem.id,
      sourceEvidenceCandidateId: params.claimCandidate.id,
      sourceEvidenceObjectId: params.evidenceNode.id,
      reviewDecision: params.decision,
      details: `Claim candidate reviewed: ${params.decision} by ${params.reviewer} (${params.reviewerRole}). Reason: ${params.reason}`,
    }))
  } catch (err) {
    steps.push({ step: 'review', status: 'failed', result: null, error: String(err), events: [] })
    return wrapRun(runId, params.claimCandidate.id, params.organizationId, now, steps, events, 'failed')
  }

  // If not accepted, stop here
  if (params.decision !== 'accepted') {
    events.push(createPipelineEvent({
      eventType: 'claim_rejected_from_evidence',
      actorId: params.reviewer,
      organizationId: params.organizationId,
      sourceKnowledgeItemId: params.knowledgeItem.id,
      sourceEvidenceCandidateId: params.claimCandidate.id,
      sourceEvidenceObjectId: params.evidenceNode.id,
      reviewDecision: params.decision,
      details: `Claim candidate rejected: ${params.reason}`,
    }))
    return wrapRun(runId, params.claimCandidate.id, params.organizationId, now, steps, events, 'completed')
  }

  // Step 2: Claim Creation
  let claimResult: ClaimCreationFromCandidate
  try {
    const { claimCommand: _cmd, linkResult } = prepareClaimFromAcceptedCandidate({
      claimCandidate: params.claimCandidate,
      evidenceNode: params.evidenceNode,
      knowledgeItem: params.knowledgeItem,
      reviewResult,
      existingClaimId: params.existingClaimId,
    })
    claimResult = linkResult
    steps.push({ step: 'claim_creation', status: 'executed', result: claimResult, error: null, events: [] })
    events.push(createPipelineEvent({
      eventType: 'claim_accepted_from_evidence',
      actorId: params.reviewer,
      organizationId: params.organizationId,
      sourceKnowledgeItemId: params.knowledgeItem.id,
      sourceEvidenceCandidateId: params.claimCandidate.id,
      sourceEvidenceObjectId: params.evidenceNode.id,
      claimId: claimResult.claimId,
      reviewDecision: 'accepted',
      details: `Claim ${claimResult.action}: ${claimResult.claimId} from evidence ${params.evidenceNode.id}. History preserved.`,
    }))
  } catch (err) {
    steps.push({ step: 'claim_creation', status: 'failed', result: null, error: String(err), events: [] })
    return wrapRun(runId, params.claimCandidate.id, params.organizationId, now, steps, events, 'partial')
  }

  // Step 3: Confidence Sync
  let confEvent: ConfidenceSyncEvent
  try {
    confEvent = signalConfidenceRecalculation({
      claimId: claimResult.claimId,
      evidenceNodeId: params.evidenceNode.id,
      triggerType: 'claim_created',
      knowledgeItemId: params.knowledgeItem.id,
      promotionId: params.claimCandidate.promotionId,
      reviewId: reviewResult.reviewId,
      previousConfidence: params.previousConfidence,
    })
    steps.push({ step: 'confidence_sync', status: 'executed', result: confEvent, error: null, events: [] })
    events.push(createPipelineEvent({
      eventType: 'confidence_recalculated',
      organizationId: params.organizationId,
      sourceKnowledgeItemId: params.knowledgeItem.id,
      sourceEvidenceObjectId: params.evidenceNode.id,
      claimId: claimResult.claimId,
      details: 'Confidence recalculation triggered after claim creation.',
    }))
  } catch (err) {
    steps.push({ step: 'confidence_sync', status: 'failed', result: null, error: String(err), events: [] })
    return wrapRun(runId, params.claimCandidate.id, params.organizationId, now, steps, events, 'partial')
  }

  // Step 4: Readiness Sync
  let readyEvent: ReadinessSyncEvent
  try {
    readyEvent = signalReadinessRecalculation({
      organizationId: params.organizationId,
      triggerType: 'confidence_changed',
      affectedClaims: [claimResult.claimId],
      affectedCapabilities: params.affectedCapabilities,
      sourceEventIds: [confEvent.claimId, reviewResult.reviewId],
      previousReadiness: params.previousReadiness,
    })
    steps.push({ step: 'readiness_sync', status: 'executed', result: readyEvent, error: null, events: [] })
    events.push(createPipelineEvent({
      eventType: 'readiness_synchronized',
      organizationId: params.organizationId,
      sourceKnowledgeItemId: params.knowledgeItem.id,
      sourceEvidenceObjectId: params.evidenceNode.id,
      details: 'Readiness recalculation triggered after confidence change.',
      metadata: { affectedCapabilities: params.affectedCapabilities },
    }))
  } catch (err) {
    steps.push({ step: 'readiness_sync', status: 'failed', result: null, error: String(err), events: [] })
    return wrapRun(runId, params.claimCandidate.id, params.organizationId, now, steps, events, 'partial')
  }

  return wrapRun(runId, params.claimCandidate.id, params.organizationId, now, steps, events, 'completed')
}

function wrapRun(
  runId: string, candidateId: string, orgId: string,
  startedAt: string, steps: PipelineStep[], events: PipelineEvent[],
  finalStatus: PipelineRun['finalStatus'],
): PipelineRun {
  return {
    runId, claimCandidateId: candidateId, organizationId: orgId,
    startedAt, completedAt: new Date().toISOString(),
    steps, events, finalStatus,
  }
}

// ==========================================================================
// PART 9 — UX States
// ==========================================================================

export type ClaimPipelineUXState =
  | 'queue'
  | 'needs_review'
  | 'needs_more_evidence'
  | 'accepted'
  | 'rejected'
  | 'superseded'
  | 'readiness_updated'
  | 'readiness_unchanged'

export interface ClaimPipelineUXDefinition {
  state: ClaimPipelineUXState
  label: string
  whatUserSees: string
  whyItHappened: string
  availableAction: string
  downstreamEffect: string
}

export const CLAIM_PIPELINE_UX_STATES: Record<ClaimPipelineUXState, ClaimPipelineUXDefinition> = {
  queue: {
    state: 'queue',
    label: 'In Queue',
    whatUserSees: 'List of ClaimCandidates awaiting review. Status: "Proposed". "Start Review" button available.',
    whyItHappened: 'Evidence was promoted. A ClaimCandidate was automatically proposed. Now waiting for review.',
    availableAction: 'Review the evidence and candidate details. Click "Start Review" to begin.',
    downstreamEffect: 'Nothing yet — claim is proposed but not reviewed. No confidence or readiness impact.',
  },
  needs_review: {
    state: 'needs_review',
    label: 'Needs Review',
    whatUserSees: 'ClaimCandidate in review queue. Evidence summary visible. "Accept", "Reject", "Request More Evidence" buttons active.',
    whyItHappened: 'Candidate was moved to review. System or human reviewer must make a decision.',
    availableAction: 'Examine evidence, review claim statement, make decision.',
    downstreamEffect: 'Decision will trigger claim creation (if accepted) or archive (if rejected).',
  },
  needs_more_evidence: {
    state: 'needs_more_evidence',
    label: 'Needs More Evidence',
    whatUserSees: 'Yellow banner: "Additional evidence required." Missing items listed. "Provide Evidence" or "Resubmit" buttons.',
    whyItHappened: 'Reviewer determined current evidence is insufficient for claim acceptance.',
    availableAction: 'Upload missing evidence, link additional documents, or provide external confirmations.',
    downstreamEffect: 'After evidence is added, candidate returns to review queue.',
  },
  accepted: {
    state: 'accepted',
    label: 'Claim Accepted',
    whatUserSees: 'Green banner: "Claim accepted." Claim ID displayed. Confidence and Readiness updates in progress. "View Claim" link.',
    whyItHappened: 'Reviewer accepted the claim candidate. Evidence was sufficient.',
    availableAction: 'Monitor confidence recalculation and readiness synchronization. View the created claim.',
    downstreamEffect: 'Claim created in Evidence Core. Confidence recalculated. Readiness synchronized. Pipeline complete.',
  },
  rejected: {
    state: 'rejected',
    label: 'Claim Rejected',
    whatUserSees: 'Grey banner: "Claim rejected." Rejection reason displayed. Candidate preserved for audit. "Archive" or "Resubmit" options.',
    whyItHappened: 'Reviewer rejected the claim. Evidence was insufficient or claim was invalid.',
    availableAction: 'Archive candidate or address rejection reason and resubmit with new evidence.',
    downstreamEffect: 'No claim created. No confidence or readiness impact. Candidate auditable.',
  },
  superseded: {
    state: 'superseded',
    label: 'Superseded',
    whatUserSees: 'Grey banner: "This claim candidate has been superseded." Link to newer candidate shown. History preserved.',
    whyItHappened: 'A newer evidence promotion produced a more current candidate for the same claim.',
    availableAction: 'Review the newer candidate. This record is preserved for audit.',
    downstreamEffect: 'Newer claim may be created. This candidate remains in audit history.',
  },
  readiness_updated: {
    state: 'readiness_updated',
    label: 'Readiness Updated',
    whatUserSees: 'Green notification: "Program Readiness has been updated." Changed capabilities highlighted. Score delta shown.',
    whyItHappened: 'Claim acceptance and confidence change triggered readiness recalculation that altered readiness status.',
    availableAction: 'Review readiness changes. Check which capabilities improved or declined. Share with sponsors if authorized.',
    downstreamEffect: 'Updated readiness feeds Sponsor Intelligence (when available). Institution can demonstrate improved capability.',
  },
  readiness_unchanged: {
    state: 'readiness_unchanged',
    label: 'Readiness Unchanged',
    whatUserSees: 'Subtle notification: "Readiness recalculated — no changes." Status remains the same.',
    whyItHappened: 'Confidence changed but did not cross any readiness threshold.',
    availableAction: 'Review the claim and evidence. Continue building institutional knowledge.',
    downstreamEffect: 'Readiness snapshot updated but status unchanged. Audit trail preserved.',
  },
}

// ==========================================================================
// PART 10 — Supersede Result (used in supersedeClaimCandidate)
// ==========================================================================

interface SuperResult {
  result: SupersedeResult | null
  error: string | null
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const CLAIM_REVIEW_PIPELINE = {
  reviewClaimCandidate,
  prepareClaimFromAcceptedCandidate,
  supersedeClaimCandidate,
  signalConfidenceRecalculation,
  signalReadinessRecalculation,
  createPipelineEvent,
  orchestratePipeline,
  uxStates: CLAIM_PIPELINE_UX_STATES,
}
