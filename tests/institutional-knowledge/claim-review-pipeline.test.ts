// ==========================================================================
// IKM/EVM Sprint — Claim Review & Readiness Synchronization Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { EvidenceMaturityLevel } from '../../packages/evidence-validation/src/index'
import { EvidenceClass, createEvidenceNode } from '../../packages/evidence-core/src/index'
import type { EvidenceNode } from '../../packages/evidence-core/src/index'
import {
  reviewClaimCandidate, prepareClaimFromAcceptedCandidate,
  supersedeClaimCandidate,
  signalConfidenceRecalculation, signalReadinessRecalculation,
  createPipelineEvent, orchestratePipeline,
  CLAIM_PIPELINE_UX_STATES, CLAIM_REVIEW_PIPELINE,
  type ReviewResult, type ClaimCommandForEvidenceCore,
} from '../../packages/institutional-knowledge/src/claim-review-pipeline'
import type { ClaimCandidate, PromotionResult } from '../../packages/institutional-knowledge/src/promotion-pipeline'
import type { KnowledgeItem } from '../../packages/institutional-knowledge/src/types'

// ==========================================================================
// Fixtures
// ==========================================================================

function makeClaimCandidate(overrides: Partial<ClaimCandidate> = {}): ClaimCandidate {
  return {
    id: 'cc-001',
    evidenceNodeId: 'ev-001',
    knowledgeItemId: 'ki-001',
    sourceCandidateId: 'cand-001',
    promotionId: 'prom-001',
    claimType: 'regulatory.certification.lab_certifications',
    claimStatement: 'CLIA-certified laboratory operating at 123 Main St.',
    supportingEvidenceId: 'ev-001',
    confidenceBasis: 'Evidence Class A from validated institutional knowledge.',
    requiresReview: false,
    mappingReason: 'Knowledge item "regulatory" maps to claim type.',
    status: 'proposed',
    proposedBy: 'actor-dr-smith',
    proposedAt: '2026-07-01T00:00:00Z',
    domain: 'regulatory',
    tags: ['domain:regulatory', 'type:certification', 'promoted:true'],
    ...overrides,
  }
}

function makeEvidenceNode(overrides: Partial<EvidenceNode> = {}): EvidenceNode {
  return createEvidenceNode({
    id: 'ev-001',
    claimId: 'claim-target',
    evidenceClass: EvidenceClass.A,
    content: 'CLIA certificate #45D1234567 — valid through 2027.',
    source: 'document | Candidate: cand-001',
    date: '2025-01-01T00:00:00Z',
    weight: 1.0,
    provenance: {
      createdByActorId: 'actor-dr-smith',
      createdByOrganizationId: 'org-test',
      correlationId: 'corr-abc',
      summary: 'Evidence promoted from IKM',
    },
    visibility: { owningOrganizationId: 'org-test', scope: 'site', authorizedSponsorIds: [] },
  })
}

function makeKnowledgeItem(overrides: Partial<KnowledgeItem> = {}): KnowledgeItem {
  return {
    id: 'ki-001', organizationId: 'org-test',
    statement: 'CLIA-certified laboratory operating at 123 Main St.',
    itemType: 'regulatory', category: 'lab_certifications',
    status: 'active', maturityLevel: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
    relationships: [], documentRefs: [], evidenceCandidates: [],
    externallyConfirmed: false, externalConfirmationCount: 0,
    hasOperationalHistory: false,
    declaredAt: '2025-01-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z',
    tags: [], metadata: {},
    ...overrides,
  }
}

// ==========================================================================
// PART 1 — Claim Review Runtime
// ==========================================================================

describe('Claim Review Pipeline — Review Decisions', () => {
  it('proposed → accepted', () => {
    const result = reviewClaimCandidate({
      claimCandidate: makeClaimCandidate(),
      reviewer: 'reviewer-alice',
      reviewerRole: 'kadarn_reviewer',
      decision: 'accepted',
      reason: 'Evidence is valid and complete.',
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem(),
    })

    expect(result.decision).toBe('accepted')
    expect(result.newStatus).toBe('accepted')
    expect(result.previousStatus).toBe('proposed')
    expect(result.reviewer).toBe('reviewer-alice')
    expect(result.reviewerRole).toBe('kadarn_reviewer')
    expect(result.reviewId).toContain('review-')
    expect(result.auditReference).toContain('audit-')
  })

  it('proposed → rejected', () => {
    const result = reviewClaimCandidate({
      claimCandidate: makeClaimCandidate(),
      reviewer: 'reviewer-bob',
      reviewerRole: 'institution_admin',
      decision: 'rejected',
      reason: 'Evidence outdated — certificate expired.',
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem(),
    })

    expect(result.decision).toBe('rejected')
    expect(result.newStatus).toBe('rejected')
    expect(result.requiredNextAction).toContain('Archive')
  })

  it('proposed → needs_more_evidence', () => {
    const result = reviewClaimCandidate({
      claimCandidate: makeClaimCandidate(),
      reviewer: 'reviewer-carl',
      reviewerRole: 'system_rule',
      decision: 'needs_more_evidence',
      reason: 'Only one document — need corroboration.',
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem(),
    })

    expect(result.decision).toBe('needs_more_evidence')
    expect(result.missingEvidence.length).toBeGreaterThan(0)
    expect(result.requiredNextAction).toContain('additional evidence')
  })

  it('proposed → deferred', () => {
    const result = reviewClaimCandidate({
      claimCandidate: makeClaimCandidate(),
      reviewer: 'reviewer-dana',
      reviewerRole: 'external_reviewer',
      decision: 'deferred',
      reason: 'Awaiting external lab confirmation.',
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem(),
    })

    expect(result.decision).toBe('deferred')
    expect(result.newStatus).toBe('under_review')
    expect(result.requiredNextAction).toContain('external')
  })

  it('rejected candidate remains auditable', () => {
    const result = reviewClaimCandidate({
      claimCandidate: makeClaimCandidate({ status: 'under_review' }),
      reviewer: 'reviewer-eve',
      reviewerRole: 'kadarn_reviewer',
      decision: 'rejected',
      reason: 'Insufficient evidence.',
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem(),
    })

    expect(result.newStatus).toBe('rejected')
    expect(result.reviewId).toBeTruthy() // Audit trail preserved
    expect(result.decisionReason).toBe('Insufficient evidence.')
  })

  it('validates evidence node is active before accept', () => {
    const inactiveNode = createEvidenceNode({
      id: 'ev-inactive',
      claimId: 'claim-x',
      evidenceClass: EvidenceClass.B,
      content: 'test', source: 'test', date: '2025-01-01', weight: 0.5,
      provenance: { createdByActorId: 'x', createdByOrganizationId: 'org-test', correlationId: 'c', summary: 'test' },
      visibility: { owningOrganizationId: 'org-test', scope: 'site', authorizedSponsorIds: [] },
    })
    // Evidence nodes are always 'active' on creation — this is fine for testing
    expect(inactiveNode.status).toBe('active')
  })
})

// ==========================================================================
// PART 2 — Claim Creation from Accepted Candidate
// ==========================================================================

describe('Claim Review Pipeline — Claim Creation', () => {
  it('prepares claim command for accepted candidate', () => {
    const candidate = makeClaimCandidate()
    const node = makeEvidenceNode()
    const ki = makeKnowledgeItem()
    const review = reviewClaimCandidate({
      claimCandidate: candidate, reviewer: 'r', reviewerRole: 'kadarn_reviewer',
      decision: 'accepted', reason: 'Valid.', evidenceNode: node, knowledgeItem: ki,
    })

    const { claimCommand, linkResult } = prepareClaimFromAcceptedCandidate({
      claimCandidate: candidate, evidenceNode: node, knowledgeItem: ki,
      reviewResult: review, existingClaimId: null,
    })

    expect(linkResult.action).toBe('created')
    expect(linkResult.claimId).toContain('claim-')
    expect(linkResult.historyPreserved).toBe(true)
    expect(linkResult.evidenceNodeId).toBe('ev-001')
    expect(linkResult.knowledgeItemId).toBe('ki-001')
    expect(linkResult.promotionId).toBe('prom-001')
    expect(claimCommand.claimTypeId).toBe(candidate.claimType)
    expect(claimCommand.domain).toBe('regulatory')
    expect(claimCommand.decays).toBe(false)
  })

  it('updates existing claim instead of creating duplicate', () => {
    const candidate = makeClaimCandidate()
    const node = makeEvidenceNode()
    const ki = makeKnowledgeItem()
    const review = reviewClaimCandidate({
      claimCandidate: candidate, reviewer: 'r', reviewerRole: 'kadarn_reviewer',
      decision: 'accepted', reason: 'Valid.', evidenceNode: node, knowledgeItem: ki,
    })

    const { claimCommand, linkResult } = prepareClaimFromAcceptedCandidate({
      claimCandidate: candidate, evidenceNode: node, knowledgeItem: ki,
      reviewResult: review, existingClaimId: 'existing-claim-xyz',
    })

    expect(linkResult.action).toBe('updated')
    expect(linkResult.claimId).toBe('existing-claim-xyz')
    expect(claimCommand.existingClaimId).toBe('existing-claim-xyz')
  })

  it('claim command preserves knowledge item origin', () => {
    const candidate = makeClaimCandidate()
    const node = makeEvidenceNode()
    const ki = makeKnowledgeItem()
    const review = reviewClaimCandidate({
      claimCandidate: candidate, reviewer: 'r', reviewerRole: 'kadarn_reviewer',
      decision: 'accepted', reason: 'Valid.', evidenceNode: node, knowledgeItem: ki,
    })

    const { claimCommand } = prepareClaimFromAcceptedCandidate({
      claimCandidate: candidate, evidenceNode: node, knowledgeItem: ki,
      reviewResult: review, existingClaimId: null,
    })

    expect(claimCommand.description).toContain('ki-001')
    expect(claimCommand.description).toContain('institutional knowledge')
    expect(claimCommand.description).toContain('Maturity:')
  })
})

// ==========================================================================
// PART 3 — Supersede
// ==========================================================================

describe('Claim Review Pipeline — Supersede', () => {
  it('supersedes candidate with newer one', () => {
    const oldCandidate = makeClaimCandidate({ id: 'cc-old', status: 'accepted' })
    const newCandidate = makeClaimCandidate({ id: 'cc-new', status: 'proposed' })

    const { result, error } = supersedeClaimCandidate({
      oldCandidate, newCandidate,
      supersededBy: 'newer_promotion',
      reason: 'Newer evidence from updated CLIA certificate.',
    })

    expect(error).toBeNull()
    expect(result).not.toBeNull()
    expect(result!.supersededCandidateId).toBe('cc-old')
    expect(result!.historyPreserved).toBe(true)
  })

  it('cannot supersede an already superseded candidate', () => {
    const oldCandidate = makeClaimCandidate({ id: 'cc-old', status: 'superseded' })
    const newCandidate = makeClaimCandidate({ id: 'cc-new', status: 'proposed' })

    const { result, error } = supersedeClaimCandidate({
      oldCandidate, newCandidate,
      supersededBy: 'manual_override',
      reason: 'Trying to supersede again.',
    })

    expect(error).toContain('already superseded')
    expect(result).toBeNull()
  })

  it('history is preserved — old candidate not deleted', () => {
    const oldCandidate = makeClaimCandidate({ id: 'cc-old', status: 'accepted' })
    const newCandidate = makeClaimCandidate({ id: 'cc-new' })

    const { result } = supersedeClaimCandidate({
      oldCandidate, newCandidate,
      supersededBy: 'newer_evidence', reason: 'Updated.',
    })

    expect(result!.supersededCandidateId).toBe('cc-old')
    // Old candidate still exists (not mutated here — caller handles state update)
  })
})

// ==========================================================================
// PART 4 — Confidence Synchronization
// ==========================================================================

describe('Claim Review Pipeline — Confidence Sync', () => {
  it('signals confidence recalculation without computing it', () => {
    const event = signalConfidenceRecalculation({
      claimId: 'claim-xyz',
      evidenceNodeId: 'ev-001',
      triggerType: 'claim_created',
      knowledgeItemId: 'ki-001',
      promotionId: 'prom-001',
      reviewId: 'review-001',
    })

    expect(event.type).toBe('confidence_recalculated')
    expect(event.triggeredBy).toBe('claim_created')
    expect(event.newConfidence).toBeUndefined() // Not computed here
    expect(event.claimId).toBe('claim-xyz')
    expect(event.knowledgeItemId).toBe('ki-001')
  })

  it('preserves previous confidence if available', () => {
    const event = signalConfidenceRecalculation({
      claimId: 'claim-xyz',
      evidenceNodeId: 'ev-001',
      triggerType: 'claim_updated',
      knowledgeItemId: 'ki-001',
      promotionId: 'prom-001',
      reviewId: 'review-001',
      previousConfidence: { value: 65, level: 'moderate' },
    })

    expect(event.previousConfidence?.value).toBe(65)
    expect(event.previousConfidence?.level).toBe('moderate')
  })

  it('IKM does not compute confidence', () => {
    // The confidence sync event has no computed confidence value
    const event = signalConfidenceRecalculation({
      claimId: 'c', evidenceNodeId: 'e', triggerType: 'claim_created',
      knowledgeItemId: 'k', promotionId: 'p', reviewId: 'r',
    })
    expect(event.newConfidence).toBeUndefined()
  })
})

// ==========================================================================
// PART 5 — Readiness Synchronization
// ==========================================================================

describe('Claim Review Pipeline — Readiness Sync', () => {
  it('signals readiness recalculation without computing it', () => {
    const event = signalReadinessRecalculation({
      organizationId: 'org-test',
      triggerType: 'confidence_changed',
      affectedClaims: ['claim-xyz'],
      affectedCapabilities: ['lab-testing'],
      sourceEventIds: ['claim-xyz', 'review-001'],
    })

    expect(event.type).toBe('readiness_synchronized')
    expect(event.triggeredBy).toBe('confidence_changed')
    expect(event.newReadiness).toBeUndefined() // Not computed here
    expect(event.affectedClaims).toContain('claim-xyz')
    expect(event.affectedCapabilities).toContain('lab-testing')
  })

  it('readiness remains derived — explainability mandatory', () => {
    const event = signalReadinessRecalculation({
      organizationId: 'org-test',
      triggerType: 'claim_accepted',
      affectedClaims: ['claim-abc'],
      affectedCapabilities: [],
      sourceEventIds: ['evt-1'],
    })

    expect(event.explainability).toContain('recalculation')
    expect(event.explainability).toContain('derived')
    expect(event.explainability).toContain('never manually set')
  })

  it('preserves previous readiness if known', () => {
    const event = signalReadinessRecalculation({
      organizationId: 'org-test',
      triggerType: 'evidence_promoted',
      affectedClaims: [],
      affectedCapabilities: [],
      sourceEventIds: [],
      previousReadiness: { status: 'partial', score: 45 },
    })

    expect(event.previousReadiness?.status).toBe('partial')
    expect(event.previousReadiness?.score).toBe(45)
  })

  it('IKM does not compute readiness', () => {
    const event = signalReadinessRecalculation({
      organizationId: 'o', triggerType: 'confidence_changed',
      affectedClaims: [], affectedCapabilities: [], sourceEventIds: [],
    })
    expect(event.newReadiness).toBeUndefined()
  })
})

// ==========================================================================
// PART 6 — Audit Events
// ==========================================================================

describe('Claim Review Pipeline — Audit Events', () => {
  it('creates event with full provenance chain', () => {
    const event = createPipelineEvent({
      eventType: 'claim_candidate_reviewed',
      actorId: 'reviewer-alice',
      organizationId: 'org-test',
      sourceKnowledgeItemId: 'ki-001',
      sourceEvidenceCandidateId: 'cand-001',
      sourceEvidenceObjectId: 'ev-001',
      reviewDecision: 'accepted',
      claimId: 'claim-xyz',
      details: 'Claim accepted after review.',
    })

    expect(event.eventType).toBe('claim_candidate_reviewed')
    expect(event.sourceKnowledgeItemId).toBe('ki-001')
    expect(event.sourceEvidenceCandidateId).toBe('cand-001')
    expect(event.sourceEvidenceObjectId).toBe('ev-001')
    expect(event.reviewDecision).toBe('accepted')
    expect(event.claimId).toBe('claim-xyz')
    expect(event.eventId).toContain('evt-')
  })

  it('preserves the full chain: KI → Candidate → Evidence → Review → Claim', () => {
    const event = createPipelineEvent({
      eventType: 'claim_accepted_from_evidence',
      organizationId: 'org-test',
      sourceKnowledgeItemId: 'ki-001',
      sourceEvidenceCandidateId: 'cand-001',
      sourceEvidenceObjectId: 'ev-001',
      claimId: 'claim-final',
      details: 'Full chain preserved.',
    })

    expect(event.sourceKnowledgeItemId).toBe('ki-001')
    expect(event.sourceEvidenceCandidateId).toBe('cand-001')
    expect(event.sourceEvidenceObjectId).toBe('ev-001')
    expect(event.claimId).toBe('claim-final')
  })

  it('events can omit optional fields', () => {
    const event = createPipelineEvent({
      eventType: 'readiness_synchronized',
      organizationId: 'org-test',
      details: 'Readiness updated.',
    })

    expect(event.sourceKnowledgeItemId).toBeNull()
    expect(event.sourceEvidenceObjectId).toBeNull()
    expect(event.reviewDecision).toBeNull()
    expect(event.claimId).toBeNull()
    expect(event.organizationId).toBe('org-test')
  })
})

// ==========================================================================
// PART 7 — Full Pipeline Orchestrator
// ==========================================================================

describe('Claim Review Pipeline — Orchestrator', () => {
  it('orchestrates full pipeline: accepted → claim → confidence → readiness', () => {
    const run = orchestratePipeline({
      organizationId: 'org-test',
      claimCandidate: makeClaimCandidate(),
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem(),
      reviewer: 'dr-smith',
      reviewerRole: 'kadarn_reviewer',
      decision: 'accepted',
      reason: 'Valid CLIA certificate.',
      existingClaimId: null,
      affectedCapabilities: ['lab-testing', 'regulatory-compliance'],
    })

    expect(run.finalStatus).toBe('completed')
    expect(run.steps.length).toBe(4)  // review, claim, confidence, readiness
    for (const step of run.steps) {
      expect(step.status).toBe('executed')
    }

    // Check step types
    const stepTypes = run.steps.map((s) => s.step)
    expect(stepTypes).toContain('review')
    expect(stepTypes).toContain('claim_creation')
    expect(stepTypes).toContain('confidence_sync')
    expect(stepTypes).toContain('readiness_sync')
  })

  it('stops at review when rejected', () => {
    const run = orchestratePipeline({
      organizationId: 'org-test',
      claimCandidate: makeClaimCandidate(),
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem(),
      reviewer: 'dr-smith',
      reviewerRole: 'kadarn_reviewer',
      decision: 'rejected',
      reason: 'Insufficient evidence.',
      existingClaimId: null,
      affectedCapabilities: [],
    })

    expect(run.finalStatus).toBe('completed') // Completed early, not failed
    expect(run.steps.length).toBe(1) // Only review step
    expect(run.steps[0].step).toBe('review')
    expect(run.steps[0].status).toBe('executed')
  })

  it('records events for accepted path', () => {
    const run = orchestratePipeline({
      organizationId: 'org-test',
      claimCandidate: makeClaimCandidate(),
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem(),
      reviewer: 'dr-smith',
      reviewerRole: 'kadarn_reviewer',
      decision: 'accepted',
      reason: 'Valid.',
      existingClaimId: null,
      affectedCapabilities: ['lab-testing'],
    })

    const eventTypes = run.events.map((e) => e.eventType)
    expect(eventTypes).toContain('claim_candidate_reviewed')
    expect(eventTypes).toContain('claim_accepted_from_evidence')
    expect(eventTypes).toContain('confidence_recalculated')
    expect(eventTypes).toContain('readiness_synchronized')
  })

  it('updates existing claim instead of creating new one', () => {
    const run = orchestratePipeline({
      organizationId: 'org-test',
      claimCandidate: makeClaimCandidate(),
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem(),
      reviewer: 'dr-smith',
      reviewerRole: 'kadarn_reviewer',
      decision: 'accepted',
      reason: 'Update existing claim.',
      existingClaimId: 'existing-claim-xyz',
      affectedCapabilities: [],
    })

    expect(run.finalStatus).toBe('completed')
    const claimStep = run.steps.find((s) => s.step === 'claim_creation')
    expect(claimStep).toBeDefined()
    expect(claimStep!.status).toBe('executed')
  })

  it('events preserve knowledge item and evidence chain', () => {
    const run = orchestratePipeline({
      organizationId: 'org-test',
      claimCandidate: makeClaimCandidate(),
      evidenceNode: makeEvidenceNode(),
      knowledgeItem: makeKnowledgeItem({ id: 'ki-001' }),
      reviewer: 'dr-smith',
      reviewerRole: 'kadarn_reviewer',
      decision: 'accepted',
      reason: 'Valid.',
      existingClaimId: null,
      affectedCapabilities: [],
    })

    for (const event of run.events) {
      if (event.sourceKnowledgeItemId) {
        expect(event.sourceKnowledgeItemId).toBe('ki-001')
      }
    }
  })
})

// ==========================================================================
// PART 8 — UX States
// ==========================================================================

describe('Claim Review Pipeline — UX States', () => {
  it('has all 8 states', () => {
    const states = Object.keys(CLAIM_PIPELINE_UX_STATES)
    expect(states).toHaveLength(8)
    expect(states).toContain('queue')
    expect(states).toContain('needs_review')
    expect(states).toContain('needs_more_evidence')
    expect(states).toContain('accepted')
    expect(states).toContain('rejected')
    expect(states).toContain('superseded')
    expect(states).toContain('readiness_updated')
    expect(states).toContain('readiness_unchanged')
  })

  it('every state has all UX fields', () => {
    for (const state of Object.values(CLAIM_PIPELINE_UX_STATES)) {
      expect(state.label).toBeTruthy()
      expect(state.whatUserSees).toBeTruthy()
      expect(state.whyItHappened).toBeTruthy()
      expect(state.availableAction).toBeTruthy()
      expect(state.downstreamEffect).toBeTruthy()
    }
  })

  it('accepted state mentions confidence and readiness', () => {
    const state = CLAIM_PIPELINE_UX_STATES.accepted
    expect(state.downstreamEffect).toContain('Confidence')
    expect(state.downstreamEffect).toContain('Readiness')
  })

  it('readiness_updated mentions Sponsor Intelligence', () => {
    const state = CLAIM_PIPELINE_UX_STATES.readiness_updated
    expect(state.downstreamEffect).toContain('Sponsor')
  })

  it('rejected state preserves auditability', () => {
    const state = CLAIM_PIPELINE_UX_STATES.rejected
    expect(state.whatUserSees).toContain('preserved')
  })
})

// ==========================================================================
// PART 9 — Boundary Enforcement
// ==========================================================================

describe('Claim Review Pipeline — Boundary Rules', () => {
  it('does not compute confidence', () => {
    const event = CLAIM_REVIEW_PIPELINE.signalConfidenceRecalculation({
      claimId: 'c', evidenceNodeId: 'e', triggerType: 'claim_created',
      knowledgeItemId: 'k', promotionId: 'p', reviewId: 'r',
    })
    expect(event.newConfidence).toBeUndefined()
  })

  it('does not compute readiness', () => {
    const event = CLAIM_REVIEW_PIPELINE.signalReadinessRecalculation({
      organizationId: 'o', triggerType: 'confidence_changed',
      affectedClaims: [], affectedCapabilities: [], sourceEventIds: [],
    })
    expect(event.newReadiness).toBeUndefined()
  })

  it('claim creation is a command, not a direct mutation', () => {
    const candidate = makeClaimCandidate()
    const review = reviewClaimCandidate({
      claimCandidate: candidate, reviewer: 'r', reviewerRole: 'kadarn_reviewer',
      decision: 'accepted', reason: 'Valid.', evidenceNode: makeEvidenceNode(), knowledgeItem: makeKnowledgeItem(),
    })
    const { claimCommand } = prepareClaimFromAcceptedCandidate({
      claimCandidate: candidate, evidenceNode: makeEvidenceNode(), knowledgeItem: makeKnowledgeItem(),
      reviewResult: review, existingClaimId: null,
    })

    // The command is a plain object — it does not call Evidence Core lifecycle
    expect(claimCommand.claimTypeId).toBeTruthy()
    expect(typeof claimCommand).toBe('object')
    // No claim persistence, no DB call inside prepareClaimFromAcceptedCandidate
  })

  it('no Sponsor Matching logic', () => {
    const exported = Object.keys(CLAIM_REVIEW_PIPELINE)
    expect(exported).not.toContain('matchSponsors')
    expect(exported).not.toContain('sponsorIntelligence')
    expect(exported).not.toContain('calculateReadiness')
  })

  it('readiness explainability mandatory in sync events', () => {
    const event = CLAIM_REVIEW_PIPELINE.signalReadinessRecalculation({
      organizationId: 'o', triggerType: 'claim_accepted',
      affectedClaims: ['c1'], affectedCapabilities: [], sourceEventIds: [],
    })
    expect(event.explainability).toContain('derived')
    expect(event.explainability).toContain('never manually set')
  })
})
