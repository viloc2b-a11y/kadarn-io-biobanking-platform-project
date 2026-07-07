// ==========================================================================
// IKM/EVM Sprint — Evidence Promotion Pipeline Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { EvidenceMaturityLevel } from '../../packages/evidence-validation/src/index'
import { EvidenceClass } from '../../packages/evidence-core/src/index'
import {
  evaluatePromotionEligibility, promoteCandidateToEvidence,
  createClaimCandidate, linkDocumentToEvidence,
  createPromotionHistory, recordPromotionEvent,
  PROMOTION_UX_STATES, PROMOTION_PIPELINE,
  type PromotionCommand, type EligibilityResult,
} from '../../packages/institutional-knowledge/src/promotion-pipeline'
import type { EvidenceCandidate, KnowledgeItem } from '../../packages/institutional-knowledge/src/types'

// ==========================================================================
// Test fixtures
// ==========================================================================

function makeCandidate(overrides: Partial<EvidenceCandidate> = {}): EvidenceCandidate {
  return {
    id: 'cand-001',
    knowledgeItemId: 'ki-001',
    candidateType: 'certification',
    source: 'document',
    supportingDocumentIds: ['doc-cert-001'],
    validationStatus: 'ready_for_evidence',
    missingRequirements: [],
    recommendedActions: [],
    proposedEvidenceClass: 'B',
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2025-06-15T00:00:00Z',
    ...overrides,
  }
}

function makeKnowledgeItem(overrides: Partial<KnowledgeItem> = {}): KnowledgeItem {
  return {
    id: 'ki-001',
    organizationId: 'org-test',
    statement: 'CLIA-certified laboratory operating at 123 Main St.',
    itemType: 'regulatory',
    category: 'lab_certifications',
    status: 'active',
    maturityLevel: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
    relationships: [],
    documentRefs: [],
    evidenceCandidates: [],
    externallyConfirmed: false,
    externalConfirmationCount: 0,
    hasOperationalHistory: false,
    declaredAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
    tags: [],
    metadata: {},
    ...overrides,
  }
}

function makePromotionCommand(overrides: Partial<PromotionCommand> = {}): PromotionCommand {
  return {
    candidate: makeCandidate(),
    knowledgeItem: makeKnowledgeItem(),
    targetClaimId: 'claim-cert-clia',
    actorId: 'actor-dr-smith',
    organizationId: 'org-test',
    correlationId: 'corr-abc123',
    ...overrides,
  }
}

// ==========================================================================
// PART 1 — Promotion Eligibility
// ==========================================================================

describe('Promotion Pipeline — Eligibility', () => {
  it('eligible: EM2, documents present, no conflicts, provenance complete', () => {
    const result = evaluatePromotionEligibility({
      candidate: makeCandidate(),
      knowledgeItem: makeKnowledgeItem(),
      maturityLevel: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScore: 2,
      hasConflicts: false,
      hasRequiredDocuments: true,
      hasOwner: true,
      provenanceComplete: true,
      evidenceAgeDays: 30,
      freshnessThresholdDays: 365,
    })
    expect(result.decision).toBe('eligible')
    expect(result.blockingItems).toHaveLength(0)
  })

  it('blocked: EM0 — not documented', () => {
    const result = evaluatePromotionEligibility({
      candidate: makeCandidate(),
      knowledgeItem: makeKnowledgeItem(),
      maturityLevel: EvidenceMaturityLevel.EM0_NOT_DOCUMENTED,
      maturityScore: 0,
      hasConflicts: false,
      hasRequiredDocuments: false,
      hasOwner: false,
      provenanceComplete: false,
      evidenceAgeDays: 0,
      freshnessThresholdDays: 365,
    })
    expect(result.decision).toBe('blocked')
    const fatalBlocks = result.blockingItems.filter((b) => b.severity === 'fatal')
    expect(fatalBlocks.length).toBeGreaterThan(0)
  })

  it('blocked: EM1 — self-reported only', () => {
    const result = evaluatePromotionEligibility({
      candidate: makeCandidate(),
      knowledgeItem: makeKnowledgeItem(),
      maturityLevel: EvidenceMaturityLevel.EM1_SELF_REPORTED,
      maturityScore: 1,
      hasConflicts: false,
      hasRequiredDocuments: true,
      hasOwner: true,
      provenanceComplete: true,
      evidenceAgeDays: 10,
      freshnessThresholdDays: 365,
    })
    expect(result.decision).toBe('blocked')
    expect(result.blockingItems.some((b) => b.category === 'maturity')).toBe(true)
  })

  it('blocked: missing required documents', () => {
    const result = evaluatePromotionEligibility({
      candidate: makeCandidate(),
      knowledgeItem: makeKnowledgeItem(),
      maturityLevel: EvidenceMaturityLevel.EM3_INTERNALLY_CORROBORATED,
      maturityScore: 3,
      hasConflicts: false,
      hasRequiredDocuments: false,
      hasOwner: true,
      provenanceComplete: true,
      evidenceAgeDays: 30,
      freshnessThresholdDays: 365,
    })
    expect(result.decision).toBe('blocked')
    expect(result.blockingItems.some((b) => b.category === 'document')).toBe(true)
  })

  it('blocked: provenance incomplete', () => {
    const result = evaluatePromotionEligibility({
      candidate: makeCandidate(),
      knowledgeItem: makeKnowledgeItem(),
      maturityLevel: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScore: 2,
      hasConflicts: false,
      hasRequiredDocuments: true,
      hasOwner: true,
      provenanceComplete: false,
      evidenceAgeDays: 30,
      freshnessThresholdDays: 365,
    })
    expect(result.decision).toBe('blocked')
    expect(result.blockingItems.some((b) => b.category === 'provenance')).toBe(true)
  })

  it('needs_review: minor conflict with documents present', () => {
    const result = evaluatePromotionEligibility({
      candidate: makeCandidate(),
      knowledgeItem: makeKnowledgeItem(),
      maturityLevel: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScore: 2,
      hasConflicts: true,
      conflictSeverity: 'minor',
      hasRequiredDocuments: true,
      hasOwner: true,
      provenanceComplete: true,
      evidenceAgeDays: 30,
      freshnessThresholdDays: 365,
    })
    expect(result.decision).toBe('needs_review')
    expect(result.blockingItems.some((b) => b.category === 'conflict')).toBe(true)
  })

  it('blocked: major conflict is fatal', () => {
    const result = evaluatePromotionEligibility({
      candidate: makeCandidate(),
      knowledgeItem: makeKnowledgeItem(),
      maturityLevel: EvidenceMaturityLevel.EM3_INTERNALLY_CORROBORATED,
      maturityScore: 3,
      hasConflicts: true,
      conflictSeverity: 'major',
      hasRequiredDocuments: true,
      hasOwner: true,
      provenanceComplete: true,
      evidenceAgeDays: 30,
      freshnessThresholdDays: 365,
    })
    expect(result.decision).toBe('blocked')
  })

  it('needs_review: stale evidence with warnings', () => {
    const result = evaluatePromotionEligibility({
      candidate: makeCandidate(),
      knowledgeItem: makeKnowledgeItem(),
      maturityLevel: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScore: 2,
      hasConflicts: false,
      hasRequiredDocuments: true,
      hasOwner: true,
      provenanceComplete: true,
      evidenceAgeDays: 400,
      freshnessThresholdDays: 365,
    })
    expect(result.decision).toBe('needs_review')
    expect(result.blockingItems.some((b) => b.category === 'freshness')).toBe(true)
  })

  it('not_eligible: candidate marked invalid with otherwise valid conditions', () => {
    const candidate = makeCandidate({ validationStatus: 'needs_document' })
    const knowledgeItem = makeKnowledgeItem()
    const result = evaluatePromotionEligibility({
      candidate,
      knowledgeItem,
      maturityLevel: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScore: 2,
      hasConflicts: false,
      hasRequiredDocuments: true,
      hasOwner: true,
      provenanceComplete: true,
      evidenceAgeDays: 10,
      freshnessThresholdDays: 365,
    })
    expect(result.decision).toBe('not_eligible')
  })

  it('includes recommended actions for each blocking item', () => {
    const result = evaluatePromotionEligibility({
      candidate: makeCandidate(),
      knowledgeItem: makeKnowledgeItem(),
      maturityLevel: EvidenceMaturityLevel.EM0_NOT_DOCUMENTED,
      maturityScore: 0,
      hasConflicts: false,
      hasRequiredDocuments: false,
      hasOwner: false,
      provenanceComplete: false,
      evidenceAgeDays: 0,
      freshnessThresholdDays: 365,
    })
    expect(result.recommendedActions.length).toBeGreaterThan(0)
  })
})

// ==========================================================================
// PART 2 — Evidence Promotion
// ==========================================================================

describe('Promotion Pipeline — Promote Candidate', () => {
  it('promotes eligible candidate to evidence object', () => {
    const cmd = makePromotionCommand()
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    const { result, error } = promoteCandidateToEvidence(cmd, eligibility)
    expect(error).toBeNull()
    expect(result).not.toBeNull()
    expect(result!.evidenceNode).toBeDefined()
    expect(result!.evidenceNode.id).toContain('ev-cand-001')
    expect(result!.knowledgeItemPreserved).toBe(true)
    expect(result!.candidateRetained).toBe(true)
  })

  it('returns error when candidate is not eligible', () => {
    const cmd = makePromotionCommand()
    const eligibility: EligibilityResult = {
      decision: 'blocked',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: ['Blocked by EM0'],
      blockingItems: [{ category: 'maturity', description: 'EM0', severity: 'fatal' }],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM0_NOT_DOCUMENTED,
      maturityScoreAtEvaluation: 0,
    }

    const { result, error } = promoteCandidateToEvidence(cmd, eligibility)
    expect(result).toBeNull()
    expect(error).toContain('not eligible')
  })

  it('promotion creates ClaimCandidate', () => {
    const cmd = makePromotionCommand()
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    const { result } = promoteCandidateToEvidence(cmd, eligibility)
    expect(result!.claimCandidateId).toBeTruthy()
  })

  it('preserves knowledge item — does not mutate', () => {
    const ki = makeKnowledgeItem()
    const originalStatement = ki.statement
    const cmd = makePromotionCommand({ knowledgeItem: ki })
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    promoteCandidateToEvidence(cmd, eligibility)
    // Original knowledge item must be unchanged
    expect(ki.statement).toBe(originalStatement)
    expect(ki.id).toBe('ki-001')
  })

  it('preserves candidate — does not delete', () => {
    const cand = makeCandidate()
    const originalId = cand.id
    const cmd = makePromotionCommand({ candidate: cand })
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    promoteCandidateToEvidence(cmd, eligibility)
    expect(cand.id).toBe(originalId)
  })

  it('maps certification to EvidenceClass A', () => {
    const cmd = makePromotionCommand({ candidate: makeCandidate({ candidateType: 'certification', proposedEvidenceClass: 'A' }) })
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    const { result } = promoteCandidateToEvidence(cmd, eligibility)
    expect(result!.evidenceNode.evidenceClass).toBe(EvidenceClass.A)
  })

  it('maps license to EvidenceClass A', () => {
    const cmd = makePromotionCommand({ candidate: makeCandidate({ candidateType: 'license', proposedEvidenceClass: 'A' }) })
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    const { result } = promoteCandidateToEvidence(cmd, eligibility)
    expect(result!.evidenceNode.evidenceClass).toBe(EvidenceClass.A)
  })
})

// ==========================================================================
// PART 3 — Claim Candidate
// ==========================================================================

describe('Promotion Pipeline — Claim Candidate', () => {
  it('creates claim candidate with proposed status', () => {
    const cmd = makePromotionCommand()
    const { result } = promoteCandidateToEvidence(cmd, {
      decision: 'eligible', candidateId: cmd.candidate.id, candidateLabel: 'test',
      reasons: [], blockingItems: [], recommendedActions: [],
      evaluatedAt: new Date().toISOString(), evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED, maturityScoreAtEvaluation: 2,
    })

    const cc = createClaimCandidate({
      evidenceNode: result!.evidenceNode,
      knowledgeItem: cmd.knowledgeItem,
      candidate: cmd.candidate,
      promotionId: result!.promotionId,
    })

    expect(cc.status).toBe('proposed')
    expect(cc.claimType).toBeTruthy()
    expect(cc.claimStatement).toBe(cmd.knowledgeItem.statement)
    expect(cc.evidenceNodeId).toBe(result!.evidenceNode.id)
    expect(cc.supportingEvidenceId).toBe(result!.evidenceNode.id)
  })

  it('claim candidate does NOT create a Claim', () => {
    const cmd = makePromotionCommand()
    const { result } = promoteCandidateToEvidence(cmd, {
      decision: 'eligible', candidateId: cmd.candidate.id, candidateLabel: 'test',
      reasons: [], blockingItems: [], recommendedActions: [],
      evaluatedAt: new Date().toISOString(), evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED, maturityScoreAtEvaluation: 2,
    })

    const cc = createClaimCandidate({
      evidenceNode: result!.evidenceNode,
      knowledgeItem: cmd.knowledgeItem,
      candidate: cmd.candidate,
      promotionId: result!.promotionId,
    })

    expect(cc.status).not.toBe('accepted')
    expect(cc.status).toBe('proposed')
  })

  it('infers claim type from domain', () => {
    const ki = makeKnowledgeItem({ category: 'quality', itemType: 'process' })
    const cmd = makePromotionCommand({ knowledgeItem: ki, candidate: makeCandidate({ candidateType: 'sop' }) })
    const { result } = promoteCandidateToEvidence(cmd, {
      decision: 'eligible', candidateId: cmd.candidate.id, candidateLabel: 'test',
      reasons: [], blockingItems: [], recommendedActions: [],
      evaluatedAt: new Date().toISOString(), evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED, maturityScoreAtEvaluation: 2,
    })

    const cc = createClaimCandidate({
      evidenceNode: result!.evidenceNode,
      knowledgeItem: ki,
      candidate: cmd.candidate,
      promotionId: result!.promotionId,
    })

    expect(cc.claimType).toContain('quality')
  })

  it('lab certification maps to regulatory domain claim', () => {
    const ki = makeKnowledgeItem({ category: 'lab_certifications', itemType: 'certification' })
    const cmd = makePromotionCommand({ knowledgeItem: ki, candidate: makeCandidate({ candidateType: 'certification' }) })
    const { result } = promoteCandidateToEvidence(cmd, {
      decision: 'eligible', candidateId: cmd.candidate.id, candidateLabel: 'test',
      reasons: [], blockingItems: [], recommendedActions: [],
      evaluatedAt: new Date().toISOString(), evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED, maturityScoreAtEvaluation: 2,
    })

    const cc = createClaimCandidate({
      evidenceNode: result!.evidenceNode,
      knowledgeItem: ki,
      candidate: cmd.candidate,
      promotionId: result!.promotionId,
    })

    expect(cc.claimType).toContain('regulatory')
  })
})

// ==========================================================================
// PART 4 — Document Promotion
// ==========================================================================

describe('Promotion Pipeline — Document Links', () => {
  it('links valid document to evidence', () => {
    const link = linkDocumentToEvidence({
      documentKey: 'clia_certificate_doc',
      evidenceNodeId: 'ev-001',
      documentExpiryDate: '2030-01-01T00:00:00Z',
      extractFacts: true,
    })

    expect(link.evidenceNodeId).toBe('ev-001')
    expect(link.expirationStatus).toBe('valid')
    expect(link.extractedFactsGenerated).toBe(true)
    expect(link.ikmReferencePreserved).toBe(true)
  })

  it('detects expiring document', () => {
    const future30 = new Date()
    future30.setDate(future30.getDate() + 30)

    const link = linkDocumentToEvidence({
      documentKey: 'license_doc',
      evidenceNodeId: 'ev-002',
      documentExpiryDate: future30.toISOString(),
      extractFacts: true,
    })

    expect(link.expirationStatus).toBe('expiring_soon')
  })

  it('detects expired document — no fact extraction', () => {
    const link = linkDocumentToEvidence({
      documentKey: 'expired_doc',
      evidenceNodeId: 'ev-003',
      documentExpiryDate: '2024-01-01T00:00:00Z',
      extractFacts: true,
    })

    expect(link.expirationStatus).toBe('expired')
    expect(link.extractedFactsGenerated).toBe(false)
  })

  it('document lifecycle stays in IKM', () => {
    const link = linkDocumentToEvidence({
      documentKey: 'sop_master_list',
      evidenceNodeId: 'ev-004',
      extractFacts: false,
    })

    expect(link.ikmReferencePreserved).toBe(true)
    // No document lifecycle mutation — just a reference link
  })
})

// ==========================================================================
// PART 5 — Promotion History & Audit
// ==========================================================================

describe('Promotion Pipeline — Audit History', () => {
  it('records promotion with all required fields', () => {
    const cmd = makePromotionCommand()
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: ['All conditions met.'],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    const history = createPromotionHistory({
      promotionId: 'prom-001',
      candidate: cmd.candidate,
      knowledgeItem: cmd.knowledgeItem,
      eligibilityResult: eligibility,
      evidenceNodeId: 'ev-001',
      promotedBy: 'actor-dr-smith',
      promotedAt: '2026-07-06T00:00:00Z',
    })

    expect(history.promotionId).toBe('prom-001')
    expect(history.candidateId).toBe('cand-001')
    expect(history.knowledgeItemId).toBe('ki-001')
    expect(history.maturityLevelAtPromotion).toBe(EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED)
    expect(history.eligibilityDecision).toBe('eligible')
    expect(history.knowledgeItemPreserved).toBe(true)
    expect(history.candidateRetained).toBe(true)
    expect(history.events.length).toBeGreaterThanOrEqual(2)
  })

  it('records both evaluation and creation events', () => {
    const cmd = makePromotionCommand()
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    const history = createPromotionHistory({
      promotionId: 'prom-002',
      candidate: cmd.candidate,
      knowledgeItem: cmd.knowledgeItem,
      eligibilityResult: eligibility,
      evidenceNodeId: 'ev-002',
      promotedBy: 'actor-jane',
      promotedAt: '2026-07-06T00:00:00Z',
    })

    const evaluated = history.events.find((e) => e.event === 'promotion.evaluated')
    const created = history.events.find((e) => e.event === 'promotion.created')

    expect(evaluated).toBeDefined()
    expect(created).toBeDefined()
  })

  it('can append events to history', () => {
    const cmd = makePromotionCommand()
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    const history = createPromotionHistory({
      promotionId: 'prom-003',
      candidate: cmd.candidate,
      knowledgeItem: cmd.knowledgeItem,
      eligibilityResult: eligibility,
      evidenceNodeId: 'ev-003',
      promotedBy: 'actor-bob',
      promotedAt: '2026-07-06T00:00:00Z',
    })

    const originalEventCount = history.events.length
    const updated = recordPromotionEvent(history, {
      timestamp: '2026-07-07T00:00:00Z',
      event: 'promotion.reviewed',
      details: 'Claim candidate reviewed and accepted.',
      actorId: 'reviewer-alice',
    })

    expect(updated.events.length).toBe(originalEventCount + 1)
    expect(updated.events[updated.events.length - 1].event).toBe('promotion.reviewed')
  })
})

// ==========================================================================
// PART 6 — UX States
// ==========================================================================

describe('Promotion Pipeline — UX States', () => {
  it('has all 6 states', () => {
    const states = Object.keys(PROMOTION_UX_STATES)
    expect(states).toHaveLength(6)
    expect(states).toContain('ready_for_promotion')
    expect(states).toContain('needs_review')
    expect(states).toContain('blocked')
    expect(states).toContain('promoted')
    expect(states).toContain('rejected')
    expect(states).toContain('superseded')
  })

  it('every state has all UX fields', () => {
    for (const state of Object.values(PROMOTION_UX_STATES)) {
      expect(state.label).toBeTruthy()
      expect(state.whatUserSees).toBeTruthy()
      expect(state.whyItHappened).toBeTruthy()
      expect(state.availableAction).toBeTruthy()
      expect(state.downstreamEffect).toBeTruthy()
    }
  })

  it('promoted state mentions Evidence Core', () => {
    const promoted = PROMOTION_UX_STATES.promoted
    expect(promoted.whatUserSees).toContain('Evidence')
    expect(promoted.downstreamEffect).toContain('Evidence')
  })

  it('blocked state has disabled promote button', () => {
    const blocked = PROMOTION_UX_STATES.blocked
    expect(blocked.whatUserSees).toContain('disabled')
  })
})

// ==========================================================================
// PART 7 — Boundary Rules
// ==========================================================================

describe('Promotion Pipeline — Boundary Enforcement', () => {
  it('does not modify Evidence Core logic', () => {
    // The pipeline uses Evidence Core's factory function (createEvidenceNode)
    // but does NOT implement storage, claim creation, or confidence computation
    const cmd = makePromotionCommand()
    const eligibility: EligibilityResult = {
      decision: 'eligible',
      candidateId: cmd.candidate.id,
      candidateLabel: 'test',
      reasons: [],
      blockingItems: [],
      recommendedActions: [],
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
      maturityScoreAtEvaluation: 2,
    }

    const { result } = promoteCandidateToEvidence(cmd, eligibility)
    // Evidence node was created using Evidence Core's factory
    expect(result!.evidenceNode.status).toBe('active') // Evidence Core default
    // Pipeline does NOT compute confidence, readiness, or sponsor matching
  })

  it('ClaimCandidate is NOT a Claim', () => {
    const cmd = makePromotionCommand()
    const { result } = promoteCandidateToEvidence(cmd, {
      decision: 'eligible', candidateId: cmd.candidate.id, candidateLabel: 'test',
      reasons: [], blockingItems: [], recommendedActions: [],
      evaluatedAt: new Date().toISOString(), evaluatedBy: 'system',
      maturityAtEvaluation: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED, maturityScoreAtEvaluation: 2,
    })

    const cc = createClaimCandidate({
      evidenceNode: result!.evidenceNode,
      knowledgeItem: cmd.knowledgeItem,
      candidate: cmd.candidate,
      promotionId: result!.promotionId,
    })

    // A ClaimCandidate is a proposal — it does NOT have claim-level properties
    expect(cc.status).toBe('proposed')
    // No Claim creation, no Evidence Core claim storage
  })

  it('no Readiness calculation', () => {
    // The pipeline does not import or use readiness-engine
    const exported = Object.keys(PROMOTION_PIPELINE)
    expect(exported).not.toContain('calculateReadiness')
    expect(exported).not.toContain('evaluateClaim')
  })

  it('no Sponsor Matching', () => {
    const exported = Object.keys(PROMOTION_PIPELINE)
    expect(exported).not.toContain('matchSponsors')
    expect(exported).not.toContain('sponsorIntelligence')
  })
})
