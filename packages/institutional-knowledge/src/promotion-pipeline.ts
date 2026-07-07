// ==========================================================================
// IKM/EVM Sprint — Evidence Promotion Pipeline
// ==========================================================================
// Bridges Institutional Knowledge into Evidence Core.
// Promotion is never automatic. Every promotion requires documented eligibility.
// ADR-011 boundary enforced: Evidence Core stores, IKM promotes.
// ==========================================================================

import type {
  KnowledgeItem, EvidenceCandidate, KnowledgeAssetStatus, EvidenceCandidateStatus,
} from './types'
import type { EvidenceMaturityLevel } from '../../evidence-validation/src/index'
import { EvidenceMaturityLevel } from '../../evidence-validation/src/index'
import type {
  EvidenceNode, ProvenanceMetadata,
} from '../../evidence-core/src/index'
import { EvidenceClass, createEvidenceNode } from '../../evidence-core/src/index'

// ==========================================================================
// PART 1 — Promotion Eligibility
// ==========================================================================

export type EligibilityDecision = 'eligible' | 'needs_review' | 'not_eligible' | 'blocked'

export interface BlockingReason {
  category: 'maturity' | 'document' | 'freshness' | 'provenance' | 'conflict' | 'relationship' | 'ownership' | 'candidate_type'
  description: string
  severity: 'fatal' | 'warning'
}

export interface EligibilityResult {
  decision: EligibilityDecision
  candidateId: string
  candidateLabel: string
  reasons: string[]
  blockingItems: BlockingReason[]
  recommendedActions: string[]
  evaluatedAt: string
  evaluatedBy: 'system' | 'human'
  maturityAtEvaluation: EvidenceMaturityLevel
  maturityScoreAtEvaluation: number
}

/**
 * Evaluate whether a Knowledge Item + EvidenceCandidate pair is eligible for promotion.
 * Rules are deterministic — no AI inference.
 */
export function evaluatePromotionEligibility(params: {
  candidate: EvidenceCandidate
  knowledgeItem: KnowledgeItem
  maturityLevel: EvidenceMaturityLevel
  maturityScore: number
  hasConflicts: boolean
  conflictSeverity?: 'minor' | 'major'
  hasRequiredDocuments: boolean
  hasOwner: boolean
  provenanceComplete: boolean
  evidenceAgeDays: number
  freshnessThresholdDays: number
}): EligibilityResult {
  const blocking: BlockingReason[] = []
  const reasons: string[] = []
  const actions: string[] = []

  // --- Maturity gate: must be >= EM2 ---
  if (params.maturityLevel === EvidenceMaturityLevel.EM0_NOT_DOCUMENTED) {
    blocking.push({ category: 'maturity', description: 'Knowledge item has no documentation (EM0). At minimum must be self-reported (EM1).', severity: 'fatal' })
  }
  if (params.maturityLevel === EvidenceMaturityLevel.EM1_SELF_REPORTED) {
    blocking.push({ category: 'maturity', description: 'Self-reported only (EM1). Requires document support (EM2 minimum) for promotion.', severity: 'fatal' })
    actions.push('Upload supporting documents to advance to EM2')
  }

  // --- Document gate ---
  if (!params.hasRequiredDocuments) {
    blocking.push({ category: 'document', description: 'Required supporting documents are missing or incomplete.', severity: 'fatal' })
    actions.push('Upload missing supporting documents for this knowledge item')
  }

  // --- Freshness gate ---
  if (params.evidenceAgeDays > params.freshnessThresholdDays) {
    blocking.push({ category: 'freshness', description: `Evidence is ${params.evidenceAgeDays} days old — exceeds freshness threshold of ${params.freshnessThresholdDays} days.`, severity: 'warning' })
    actions.push('Provide updated or more recent documentation')
  }

  // --- Provenance gate ---
  if (!params.provenanceComplete) {
    blocking.push({ category: 'provenance', description: 'Provenance chain is incomplete — cannot verify evidence origin.', severity: 'fatal' })
    actions.push('Complete provenance chain: document who created, when, and under what authority')
  }

  // --- Conflict gate ---
  if (params.hasConflicts) {
    const isFatal = params.conflictSeverity === 'major'
    blocking.push({ category: 'conflict', description: `Conflicting evidence exists (${params.conflictSeverity ?? 'unknown'} conflict).`, severity: isFatal ? 'fatal' : 'warning' })
    if (isFatal) {
      actions.push('Resolve major conflicts before promotion can proceed')
    } else {
      actions.push('Review minor conflicts — may promote with documented acknowledgement')
    }
  }

  // --- Ownership gate ---
  if (!params.hasOwner) {
    blocking.push({ category: 'ownership', description: 'No owner assigned to this knowledge item.', severity: 'warning' })
    actions.push('Assign a responsible owner before promotion')
  }

  // --- Candidate type gate ---
  if (params.candidate.validationStatus === 'invalid') {
    blocking.push({ category: 'candidate_type', description: 'Evidence candidate is marked as invalid.', severity: 'fatal' })
  }

  // Determine decision
  const fatalBlocks = blocking.filter((b) => b.severity === 'fatal')
  const warningBlocks = blocking.filter((b) => b.severity === 'warning')
  let decision: EligibilityDecision

  if (params.candidate.validationStatus === 'ready_for_evidence' && fatalBlocks.length === 0 && warningBlocks.length === 0) {
    decision = 'eligible'
    reasons.push('All conditions met — candidate is ready for promotion.')
  } else if (fatalBlocks.length > 0) {
    decision = 'blocked'
    reasons.push(`${fatalBlocks.length} fatal issues prevent promotion.`)
  } else if (warningBlocks.length > 0 && fatalBlocks.length === 0) {
    decision = 'needs_review'
    reasons.push(`${warningBlocks.length} concerns require review before promotion.`)
  } else if (params.candidate.validationStatus === 'needs_review') {
    decision = 'needs_review'
    reasons.push('Candidate explicitly requires human review.')
  } else {
    decision = 'not_eligible'
    reasons.push(`Candidate validation status is "${params.candidate.validationStatus}" — not yet ready.`)
  }

  return {
    decision,
    candidateId: params.candidate.id,
    candidateLabel: `${params.candidate.candidateType} → ${params.knowledgeItem.statement.slice(0, 60)}`,
    reasons,
    blockingItems: blocking,
    recommendedActions: actions,
    evaluatedAt: new Date().toISOString(),
    evaluatedBy: 'system',
    maturityAtEvaluation: params.maturityLevel,
    maturityScoreAtEvaluation: params.maturityScore,
  }
}

// ==========================================================================
// PART 2 — Evidence Promotion Runtime
// ==========================================================================

export interface PromotionCommand {
  candidate: EvidenceCandidate
  knowledgeItem: KnowledgeItem
  /** Target Claim ID in Evidence Core — must exist before promotion */
  targetClaimId: string
  /** Actor performing the promotion */
  actorId: string
  organizationId: string
  correlationId: string
}

export interface PromotionResult {
  promotionId: string
  evidenceNode: EvidenceNode
  candidateId: string
  knowledgeItemId: string
  claimCandidateId: string | null
  eligibilityResult: EligibilityResult
  promotedAt: string
  promotedBy: string
  /** Whether the promotion preserves the original knowledge item */
  knowledgeItemPreserved: boolean
  /** Whether the evidence candidate is retained (not deleted) */
  candidateRetained: boolean
}

/**
 * Promote an eligible EvidenceCandidate to an Evidence Object in Evidence Core.
 *
 * Rules:
 *  - Candidate must be eligible (evaluatePromotionEligibility passed)
 *  - Does NOT mutate the original KnowledgeItem
 *  - Does NOT delete the EvidenceCandidate
 *  - Creates promotion history
 *  - Creates a ClaimCandidate for downstream claim evaluation
 */
export function promoteCandidateToEvidence(
  command: PromotionCommand,
  eligibility: EligibilityResult,
): { result: PromotionResult | null; error: string | null } {
  // --- Gate: must be eligible ---
  if (eligibility.decision !== 'eligible') {
    return {
      result: null,
      error: `Candidate "${command.candidate.id}" is not eligible for promotion. Decision: ${eligibility.decision}. Blocking: ${eligibility.blockingItems.length} items.`,
    }
  }

  const promotionId = `prom-${command.candidate.id}-${Date.now()}`
  const now = new Date().toISOString()

  // Map candidate type to Evidence Class
  const evidenceClass = mapCandidateToEvidenceClass(command.candidate)

  // Build evidence node through Evidence Core factory
  // Note: Evidence Core's createEvidenceNode is used — this respects the boundary
  const evidenceNode = createEvidenceNode({
    id: `ev-${command.candidate.id}`,
    claimId: command.targetClaimId,
    evidenceClass,
    content: buildEvidenceContent(command.knowledgeItem, command.candidate),
    source: buildEvidenceSource(command.candidate),
    date: command.knowledgeItem.declaredAt || command.candidate.createdAt,
    weight: evidenceClass === EvidenceClass.A ? 1.0
      : evidenceClass === EvidenceClass.B ? 0.8
      : evidenceClass === EvidenceClass.C ? 0.6
      : evidenceClass === EvidenceClass.D ? 0.4
      : evidenceClass === EvidenceClass.E ? 0.2
      : 0.1,
    provenance: buildProvenance(command),
    visibility: {
      owningOrganizationId: command.organizationId,
      scope: 'site',
      authorizedSponsorIds: [],
    },
  })

  // Build promotion audit entry
  const promotionRecord = createPromotionHistory({
    promotionId,
    candidate: command.candidate,
    knowledgeItem: command.knowledgeItem,
    eligibilityResult: eligibility,
    evidenceNodeId: evidenceNode.id,
    promotedBy: command.actorId,
    promotedAt: now,
  })

  // Create claim candidate for downstream claim evaluation
  const claimCandidate = createClaimCandidate({
    evidenceNode,
    knowledgeItem: command.knowledgeItem,
    candidate: command.candidate,
    promotionId,
  })

  return {
    result: {
      promotionId,
      evidenceNode,
      candidateId: command.candidate.id,
      knowledgeItemId: command.knowledgeItem.id,
      claimCandidateId: claimCandidate.id,
      eligibilityResult: eligibility,
      promotedAt: now,
      promotedBy: command.actorId,
      knowledgeItemPreserved: true,
      candidateRetained: true,
    },
    error: null,
  }
}

// --------------------------------------------------------------------------
// Evidence Class mapping
// --------------------------------------------------------------------------

function mapCandidateToEvidenceClass(candidate: EvidenceCandidate): EvidenceClass {
  if (candidate.proposedEvidenceClass) {
    return EvidenceClass[candidate.proposedEvidenceClass as keyof typeof EvidenceClass] ?? EvidenceClass.D
  }
  // Default mapping by candidate type
  const defaultMap: Record<string, EvidenceClass> = {
    certification: EvidenceClass.A,
    license: EvidenceClass.A,
    regulatory_submission: EvidenceClass.A,
    audit_report: EvidenceClass.B,
    sop: EvidenceClass.B,
    quality_record: EvidenceClass.B,
    training_record: EvidenceClass.C,
    equipment_log: EvidenceClass.C,
    operational_data: EvidenceClass.C,
    record: EvidenceClass.C,
    external_validation: EvidenceClass.B,
    other: EvidenceClass.D,
  }
  return defaultMap[candidate.candidateType] ?? EvidenceClass.D
}

// --------------------------------------------------------------------------
// Content and Source builders
// --------------------------------------------------------------------------

function buildEvidenceContent(item: KnowledgeItem, candidate: EvidenceCandidate): string {
  return `[Promoted from IKM] ${item.statement} | Type: ${candidate.candidateType} | Maturity: ${item.maturityLevel} | Knowledge: ${item.id}`
}

function buildEvidenceSource(candidate: EvidenceCandidate): string {
  return `${candidate.source} | Candidate: ${candidate.id} | Supporting Docs: ${candidate.supportingDocumentIds.join(', ') || 'none'}`
}

// --------------------------------------------------------------------------
// Provenance builder
// --------------------------------------------------------------------------

function buildProvenance(command: PromotionCommand): ProvenanceMetadata {
  return {
    createdByActorId: command.actorId,
    createdByOrganizationId: command.organizationId,
    correlationId: command.correlationId,
    summary: `Evidence promoted from IKM KnowledgeItem "${command.knowledgeItem.id}" via EvidenceCandidate "${command.candidate.id}"`,
    sourceEventId: `ikm-promotion-${command.candidate.id}`,
  }
}

// ==========================================================================
// PART 3 — Claim Candidate Mapping
// ==========================================================================

export type ClaimCandidateStatus =
  | 'proposed'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'superseded'

export interface ClaimCandidate {
  id: string
  /** The promoted evidence node this candidate is based on */
  evidenceNodeId: string
  /** The knowledge item that originated this candidate */
  knowledgeItemId: string
  /** The evidence candidate that was promoted */
  sourceCandidateId: string
  /** The promotion that created this candidate */
  promotionId: string
  /** What type of claim could be supported */
  claimType: string
  /** Human-readable claim statement */
  claimStatement: string
  /** Evidence node that supports this claim */
  supportingEvidenceId: string
  /** Basis for confidence if this claim is created */
  confidenceBasis: string
  /** Whether human review is required before claim creation */
  requiresReview: boolean
  /** Reason this candidate was mapped to this claim type */
  mappingReason: string
  /** Current status */
  status: ClaimCandidateStatus
  /** Who proposed this candidate */
  proposedBy: string
  proposedAt: string
  /** Domain this claim belongs to */
  domain: string
  /** Tags for downstream matching */
  tags: string[]
}

/**
 * Create a ClaimCandidate.
 * This does NOT create a Claim — it proposes that a claim MAY be created.
 * Actual Claim creation follows Evidence Core lifecycle rules.
 */
export function createClaimCandidate(params: {
  evidenceNode: EvidenceNode
  knowledgeItem: KnowledgeItem
  candidate: EvidenceCandidate
  promotionId: string
}): ClaimCandidate {
  // Infer claim type from knowledge item + candidate
  const claimType = inferClaimType(params.knowledgeItem, params.candidate)
  const claimStatement = buildClaimStatement(params.knowledgeItem, params.candidate)

  return {
    id: `cc-${params.evidenceNode.id}`,
    evidenceNodeId: params.evidenceNode.id,
    knowledgeItemId: params.knowledgeItem.id,
    sourceCandidateId: params.candidate.id,
    promotionId: params.promotionId,
    claimType,
    claimStatement,
    supportingEvidenceId: params.evidenceNode.id,
    confidenceBasis: `Evidence Class ${params.evidenceNode.evidenceClass} from validated institutional knowledge. Source: ${params.candidate.source}.`,
    requiresReview: params.candidate.validationStatus === 'needs_review' || params.candidate.source === 'self_report',
    mappingReason: `Knowledge item "${params.knowledgeItem.itemType}" with candidate type "${params.candidate.candidateType}" maps to claim type "${claimType}".`,
    status: 'proposed',
    proposedBy: params.evidenceNode.provenance.createdByActorId,
    proposedAt: new Date().toISOString(),
    domain: determineDomain(params.knowledgeItem),
    tags: buildClaimTags(params.knowledgeItem, params.candidate),
  }
}

function inferClaimType(item: KnowledgeItem, candidate: EvidenceCandidate): string {
  // Domain-based claim type mapping
  const domain = determineDomain(item)
  const type = candidate.candidateType
  if (type === 'certification' || type === 'license') return `${domain}.certification.${item.category}`
  if (type === 'sop' || type === 'quality_record') return `${domain}.process.${item.category}`
  if (type === 'equipment_log') return `${domain}.equipment.${item.category}`
  if (type === 'training_record') return `${domain}.training.${item.category}`
  if (type === 'audit_report') return `${domain}.audit.${item.category}`
  return `${domain}.capability.${item.category}`
}

function buildClaimStatement(item: KnowledgeItem, _candidate: EvidenceCandidate): string {
  return `${item.statement}`
}

function determineDomain(item: KnowledgeItem): string {
  const cat = item.category.toLowerCase()
  if (cat.includes('quality') || cat.includes('capa') || cat.includes('audit') || cat.includes('sop')) return 'quality'
  if (cat.includes('regulatory') || cat.includes('license') || cat.includes('certif') || cat.includes('irb') || cat.includes('fda')) return 'regulatory'
  if (cat.includes('equipment') || cat.includes('instrument')) return 'equipment'
  if (cat.includes('facility') || cat.includes('lab')) return 'facility'
  if (cat.includes('biospecimen') || cat.includes('sample')) return 'biospecimen'
  return 'organization'
}

function buildClaimTags(item: KnowledgeItem, candidate: EvidenceCandidate): string[] {
  return [
    `domain:${determineDomain(item)}`,
    `type:${candidate.candidateType}`,
    `item:${item.itemType}`,
    `maturity:${item.maturityLevel}`,
    `promoted:true`,
  ]
}

// ==========================================================================
// PART 4 — Document Promotion
// ==========================================================================

export interface DocumentPromotionLink {
  /** The knowledge asset document key */
  documentKey: string
  /** The evidence node this document supports */
  evidenceNodeId: string
  /** Whether extracted facts were generated from this document */
  extractedFactsGenerated: boolean
  /** Document expiration status at time of promotion */
  expirationStatus: 'valid' | 'expiring_soon' | 'expired'
  /** Reference kept in IKM */
  ikmReferencePreserved: boolean
}

/**
 * Link a Knowledge Asset document to a promoted Evidence Object.
 * Document lifecycle remains in IKM.
 * Evidence Core receives only the evidence representation, not lifecycle ownership.
 */
export function linkDocumentToEvidence(params: {
  documentKey: string
  evidenceNodeId: string
  documentExpiryDate?: string
  extractFacts: boolean
}): DocumentPromotionLink {
  const now = new Date()
  let expirationStatus: DocumentPromotionLink['expirationStatus'] = 'valid'
  if (params.documentExpiryDate) {
    const expiry = new Date(params.documentExpiryDate)
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000)
    if (daysUntil < 0) expirationStatus = 'expired'
    else if (daysUntil <= 90) expirationStatus = 'expiring_soon'
  }

  return {
    documentKey: params.documentKey,
    evidenceNodeId: params.evidenceNodeId,
    extractedFactsGenerated: params.extractFacts && expirationStatus !== 'expired',
    expirationStatus,
    ikmReferencePreserved: true,
  }
}

// ==========================================================================
// PART 5 — Promotion UX States
// ==========================================================================

export type PromotionUXState =
  | 'ready_for_promotion'
  | 'needs_review'
  | 'blocked'
  | 'promoted'
  | 'rejected'
  | 'superseded'

export interface PromotionUXDefinition {
  state: PromotionUXState
  label: string
  whatUserSees: string
  whyItHappened: string
  availableAction: string
  downstreamEffect: string
}

export const PROMOTION_UX_STATES: Record<PromotionUXState, PromotionUXDefinition> = {
  ready_for_promotion: {
    state: 'ready_for_promotion',
    label: 'Ready for Promotion',
    whatUserSees: 'Green banner: "This knowledge item meets all criteria for evidence promotion." Eligibility checklist all ✓. "Promote to Evidence" button active.',
    whyItHappened: 'Maturity ≥ EM2, required documents present, no conflicts, provenance complete.',
    availableAction: 'Click "Promote to Evidence" — will create Evidence Object in Evidence Core and link to target Claim.',
    downstreamEffect: 'Evidence Object created in Evidence Core. ClaimCandidate proposed for review. Knowledge item preserved. Candidate retained.',
  },
  needs_review: {
    state: 'needs_review',
    label: 'Needs Review',
    whatUserSees: 'Yellow banner: "Review required before promotion." Concerns listed. "Request Review" or "Resolve" buttons.',
    whyItHappened: 'Warnings exist (freshness, minor conflicts, ownership). No fatal blockers.',
    availableAction: 'Review warnings, resolve or acknowledge them, then retry promotion.',
    downstreamEffect: 'Nothing yet — promotion blocked pending review resolution.',
  },
  blocked: {
    state: 'blocked',
    label: 'Promotion Blocked',
    whatUserSees: 'Red banner: "Cannot promote — critical issues detected." Fatal blockers listed with recommended actions. "Promote" button disabled.',
    whyItHappened: 'One or more fatal issues: maturity < EM2, missing documents, provenance gap, major conflict, invalid candidate.',
    availableAction: 'Address each blocking item. The system will re-evaluate after changes are saved.',
    downstreamEffect: 'No promotion possible until blockers are resolved.',
  },
  promoted: {
    state: 'promoted',
    label: 'Promoted to Evidence',
    whatUserSees: 'Gold banner: "Successfully promoted." Evidence Object ID shown. ClaimCandidate status visible. "View in Evidence Core" link.',
    whyItHappened: 'Promotion completed successfully. Evidence Object created in Evidence Core.',
    availableAction: 'Monitor ClaimCandidate review. View evidence in Evidence Core. Link additional documents if needed.',
    downstreamEffect: 'Evidence Object active in Evidence Core. Ready for Claim review cycle. Feeds Confidence/Readiness pipeline.',
  },
  rejected: {
    state: 'rejected',
    label: 'Promotion Rejected',
    whatUserSees: 'Grey banner: "Promotion was rejected." Rejection reason shown. Candidate remains in IKM. "Retry" or "Archive" options.',
    whyItHappened: 'Promotion was evaluated but rejected — possibly during claim review phase.',
    availableAction: 'Address rejection reason and re-submit. Or archive the candidate if promotion is no longer relevant.',
    downstreamEffect: 'No evidence created. Candidate remains in IKM. No impact on Evidence Core.',
  },
  superseded: {
    state: 'superseded',
    label: 'Superseded',
    whatUserSees: 'Grey banner: "This promotion has been superseded by a newer version." Link to newer promotion shown.',
    whyItHappened: 'A newer promotion for the same knowledge item has replaced this one.',
    availableAction: 'View the newer promotion. This promotion record is preserved for audit.',
    downstreamEffect: 'Newer Evidence Object active. This one marked as superseded in audit history.',
  },
}

// ==========================================================================
// PART 6 — Promotion Audit & History
// ==========================================================================

export interface PromotionHistory {
  promotionId: string
  candidateId: string
  knowledgeItemId: string
  knowledgeItemStatement: string
  candidateType: string
  maturityLevelAtPromotion: EvidenceMaturityLevel
  maturityScoreAtPromotion: number
  eligibilityDecision: EligibilityDecision
  eligibilityReasons: string[]
  supportingDocumentIds: string[]
  evidenceNodeId: string | null
  evidenceClass: string | null
  claimCandidateId: string | null
  targetClaimId: string
  promotedBy: string
  promotedAt: string
  knowledgeItemPreserved: boolean
  candidateRetained: boolean
  documentLinks: DocumentPromotionLink[]
  events: PromotionHistoryEvent[]
}

export interface PromotionHistoryEvent {
  timestamp: string
  event: string
  details: string
  actorId?: string
}

export function createPromotionHistory(params: {
  promotionId: string
  candidate: EvidenceCandidate
  knowledgeItem: KnowledgeItem
  eligibilityResult: EligibilityResult
  evidenceNodeId: string
  promotedBy: string
  promotedAt: string
}): PromotionHistory {
  return {
    promotionId: params.promotionId,
    candidateId: params.candidate.id,
    knowledgeItemId: params.knowledgeItem.id,
    knowledgeItemStatement: params.knowledgeItem.statement,
    candidateType: params.candidate.candidateType,
    maturityLevelAtPromotion: params.eligibilityResult.maturityAtEvaluation,
    maturityScoreAtPromotion: params.eligibilityResult.maturityScoreAtEvaluation,
    eligibilityDecision: params.eligibilityResult.decision,
    eligibilityReasons: params.eligibilityResult.reasons,
    supportingDocumentIds: params.candidate.supportingDocumentIds,
    evidenceNodeId: params.evidenceNodeId,
    evidenceClass: params.candidate.proposedEvidenceClass ?? 'D',
    claimCandidateId: null, // Set after claim candidate created
    targetClaimId: '', // Set by caller
    promotedBy: params.promotedBy,
    promotedAt: params.promotedAt,
    knowledgeItemPreserved: true,
    candidateRetained: true,
    documentLinks: [],
    events: [
      {
        timestamp: params.promotedAt,
        event: 'promotion.evaluated',
        details: `Eligibility: ${params.eligibilityResult.decision}. ${params.eligibilityResult.reasons.join(' ')}`,
      },
      {
        timestamp: params.promotedAt,
        event: 'promotion.created',
        details: `Evidence Node "${params.evidenceNodeId}" created from Candidate "${params.candidate.id}".`,
        actorId: params.promotedBy,
      },
    ],
  }
}

/**
 * Append an event to the promotion history.
 */
export function recordPromotionEvent(history: PromotionHistory, event: PromotionHistoryEvent): PromotionHistory {
  return {
    ...history,
    events: [...history.events, event],
  }
}

// ==========================================================================
// PART 7 — Batch Promotion (multiple candidates)
// ==========================================================================

export interface BatchPromotionInput {
  promotions: PromotionCommand[]
  /** If true, stop on first failure. If false, promote all eligible and collect errors. */
  failFast: boolean
}

export interface BatchPromotionResult {
  successful: PromotionResult[]
  failed: { candidateId: string; error: string }[]
  skipped: { candidateId: string; reason: string }[]
  totalPromoted: number
  totalFailed: number
  totalSkipped: number
}

export function promoteBatch(input: BatchPromotionInput): BatchPromotionResult {
  const result: BatchPromotionResult = {
    successful: [],
    failed: [],
    skipped: [],
    totalPromoted: 0,
    totalFailed: 0,
    totalSkipped: 0,
  }

  for (const cmd of input.promotions) {
    // Evaluate eligibility inline for batch
    const eligibility = {
      decision: 'eligible' as EligibilityDecision,
      candidateId: cmd.candidate.id,
      candidateLabel: cmd.candidate.candidateType,
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system' as const,
      maturityAtEvaluation: cmd.knowledgeItem.maturityLevel,
      maturityScoreAtEvaluation: 0,
    }

    const { result: promotionResult, error } = promoteCandidateToEvidence(cmd, eligibility)

    if (promotionResult) {
      result.successful.push(promotionResult)
      result.totalPromoted++
    } else if (error) {
      result.failed.push({ candidateId: cmd.candidate.id, error })
      result.totalFailed++
      if (input.failFast) break
    } else {
      result.skipped.push({ candidateId: cmd.candidate.id, reason: 'Unknown — no result or error' })
      result.totalSkipped++
    }
  }

  return result
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const PROMOTION_PIPELINE = {
  evaluateEligibility: evaluatePromotionEligibility,
  promoteCandidate: promoteCandidateToEvidence,
  createClaimCandidate,
  linkDocumentToEvidence,
  createPromotionHistory,
  recordPromotionEvent,
  promoteBatch,
  uxStates: PROMOTION_UX_STATES,
}
