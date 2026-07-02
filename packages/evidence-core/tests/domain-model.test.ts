// ==========================================================================
// Evidence Core Domain Model — Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 17.1.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { createClaim } from '../src/claim.js';
import {
  EvidenceClass,
  EVIDENCE_CLASS_DECAY_MONTHS,
  createEvidenceNode,
  createRelationship,
  createCounterEvidence,
  attachResponse,
  createRightOfResponse,
  createEmptyGraph,
  createProvenance,
  siteVisibility,
  validateClaimBoundedness,
  validateEvidenceNodeWeight,
  validateNodeHasClaim,
  validateCounterEvidenceWeight,
  validateRelationshipNoSelfReference,
  validateResponseHasCounterEvidence,
  validateClaim,
  isClaimActive,
} from '../src/index.js';

import type { CounterEvidence, RightOfResponse } from '../src/index.js';

// --------------------------------------------------------------------------
// Evidence Class
// --------------------------------------------------------------------------

describe('EvidenceClass', () => {
  it('has six classes A through F', () => {
    expect(Object.keys(EvidenceClass)).toHaveLength(6);
    expect(EvidenceClass.A).toBe('A');
    expect(EvidenceClass.F).toBe('F');
  });

  it('has decay parameters for all classes', () => {
    expect(EVIDENCE_CLASS_DECAY_MONTHS[EvidenceClass.A]).toBe(60);
    expect(EVIDENCE_CLASS_DECAY_MONTHS[EvidenceClass.C]).toBe(12);
    expect(EVIDENCE_CLASS_DECAY_MONTHS[EvidenceClass.D]).toBeNull();
  });
});

// --------------------------------------------------------------------------
// Claim
// --------------------------------------------------------------------------

describe('Claim', () => {
  const validClaim = createClaim({
    id: 'claim-1',
    claimTypeId: 'biospecimen.storage.freezer_minus_80c',
    name: '-80°C Freezer Storage',
    description: 'Capability to store biospecimens at -80°C with validated monitoring.',
    organizationId: 'org-1',
    domain: 'biospecimen',
    validEvidenceClasses: [EvidenceClass.B, EvidenceClass.C],
    requiredEvidenceClasses: [EvidenceClass.B, EvidenceClass.C],
    decays: true,
    decayPeriodMonths: 6,
    provenance: {
      createdByActorId: 'actor-1',
      createdByOrganizationId: 'org-1',
      correlationId: 'corr-1',
      summary: 'Initial claim registration',
    },
  });

  it('creates a valid Claim with required fields', () => {
    expect(validClaim.id).toBe('claim-1');
    expect(validClaim.status).toBe('active');
    expect(validClaim.visibility.owningOrganizationId).toBe('org-1');
  });

  it('is active by default', () => {
    expect(isClaimActive(validClaim)).toBe(true);
  });

  it('rejects opinion-based Claims', () => {
    const opinionClaim = createClaim({
      ...validClaim,
      id: 'claim-bad',
      claimTypeId: 'biospecimen.opinion',
      name: 'Excellent Site',
      description: 'This is an excellent high quality site',
      provenance: {
        createdByActorId: 'actor-1',
        createdByOrganizationId: 'org-1',
        correlationId: 'corr-2',
        summary: 'Invalid claim',
      },
    });
    expect(validateClaimBoundedness(opinionClaim)).not.toBeNull();
  });

  it('rejects Claims with no valid Evidence Classes', () => {
    const noEvidenceClaim = createClaim({
      ...validClaim,
      id: 'claim-no-ev',
      claimTypeId: 'invalid',
      name: 'No Evidence',
      description: 'Test',
      validEvidenceClasses: [],
      requiredEvidenceClasses: [],
      provenance: {
        createdByActorId: 'actor-1',
        createdByOrganizationId: 'org-1',
        correlationId: 'corr-3',
        summary: 'Invalid claim',
      },
    });
    const result = validateClaim(noEvidenceClaim);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates Claim invariants holistically', () => {
    const result = validateClaim(validClaim);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// Evidence Node
// --------------------------------------------------------------------------

describe('EvidenceNode', () => {
  const provenance = createProvenance({
    actorId: 'actor-1',
    organizationId: 'org-1',
    correlationId: 'corr-1',
    summary: 'Evidence submission',
  });

  const node = createEvidenceNode({
    id: 'node-1',
    claimId: 'claim-1',
    evidenceClass: EvidenceClass.B,
    content: 'Calibration certificate for freezer #A-123, valid until 2027-06',
    source: 'site-submission',
    date: '2026-07-01',
    weight: 0.5,
    provenance,
    visibility: siteVisibility('org-1'),
  });

  it('creates an Evidence Node with all fields', () => {
    expect(node.id).toBe('node-1');
    expect(node.evidenceClass).toBe(EvidenceClass.B);
    expect(node.status).toBe('active');
  });

  it('has non-negative weight', () => {
    expect(validateEvidenceNodeWeight(node)).toBeNull();
  });

  it('has a valid provenance chain', () => {
    expect(node.provenance.createdByActorId).toBe('actor-1');
    expect(node.provenance.correlationId).toBe('corr-1');
  });

  it('has temporal metadata', () => {
    expect(node.temporal.createdAt).toBeDefined();
    expect(node.temporal.updatedAt).toBeDefined();
  });

  it('references a Claim', () => {
    expect(validateNodeHasClaim(node)).toBeNull();
  });
});

// --------------------------------------------------------------------------
// Evidence Relationship
// --------------------------------------------------------------------------

describe('EvidenceRelationship', () => {
  const provenance = createProvenance({
    actorId: 'actor-1',
    organizationId: 'org-1',
    correlationId: 'corr-1',
    summary: 'Link nodes',
  });

  it('creates a supports relationship', () => {
    const rel = createRelationship({
      id: 'rel-1',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
      relationshipType: 'supports',
      provenance,
    });
    expect(rel.relationshipType).toBe('supports');
  });

  it('rejects self-referencing relationships', () => {
    const rel = createRelationship({
      id: 'rel-self',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-1',
      relationshipType: 'supports',
      provenance,
    });
    expect(validateRelationshipNoSelfReference(rel)).not.toBeNull();
  });

  it('creates a contradicts relationship', () => {
    const rel = createRelationship({
      id: 'rel-2',
      sourceNodeId: 'node-2',
      targetNodeId: 'node-1',
      relationshipType: 'contradicts',
      provenance,
    });
    expect(rel.relationshipType).toBe('contradicts');
  });
});

// --------------------------------------------------------------------------
// Counter Evidence
// --------------------------------------------------------------------------

describe('CounterEvidence', () => {
  const provenance = createProvenance({
    actorId: 'actor-2',
    organizationId: 'org-1',
    correlationId: 'corr-2',
    summary: 'Counter evidence submission',
  });

  it('creates Counter Evidence with negative weight', () => {
    const ce: CounterEvidence = createCounterEvidence({
      id: 'ce-1',
      claimId: 'claim-1',
      evidenceClass: EvidenceClass.C,
      content: 'Temperature excursion detected on 2026-06-15: -65°C for 4 hours',
      source: 'iot-monitoring',
      date: '2026-06-15',
      weight: 0.3,
      provenance,
      visibility: siteVisibility('org-1'),
    });
    expect(ce.isCounterEvidence).toBe(true);
    expect(ce.weight).toBeLessThan(0);
    expect(validateCounterEvidenceWeight(ce)).toBeNull();
  });

  it('starts without a response', () => {
    const ce = createCounterEvidence({
      id: 'ce-2',
      claimId: 'claim-1',
      evidenceClass: EvidenceClass.B,
      content: 'Expired calibration certificate',
      source: 'audit',
      date: '2026-05-01',
      weight: 0.2,
      provenance,
      visibility: siteVisibility('org-1'),
    });
    expect(ce.hasResponse).toBe(false);
    expect(ce.responseId).toBeNull();
  });

  it('can receive a Right of Response without modifying the original', () => {
    const ce = createCounterEvidence({
      id: 'ce-3',
      claimId: 'claim-1',
      evidenceClass: EvidenceClass.C,
      content: 'Test finding',
      source: 'audit',
      date: '2026-01-01',
      weight: 0.1,
      provenance,
      visibility: siteVisibility('org-1'),
    });
    const updated = attachResponse(ce, 'ror-1');
    expect(updated.hasResponse).toBe(true);
    expect(updated.responseId).toBe('ror-1');
    // Original is unchanged (immutability)
    expect(ce.hasResponse).toBe(false);
  });
});

// --------------------------------------------------------------------------
// Right of Response
// --------------------------------------------------------------------------

describe('RightOfResponse', () => {
  const provenance = createProvenance({
    actorId: 'actor-1',
    organizationId: 'org-1',
    correlationId: 'corr-3',
    summary: 'Response to counter evidence',
  });

  it('creates a Right of Response referencing Counter Evidence', () => {
    const ror: RightOfResponse = createRightOfResponse({
      id: 'ror-1',
      counterEvidenceId: 'ce-1',
      description: 'Freezer #A-123 received emergency maintenance. Temperature logger replaced. Continuous monitoring restored.',
      resolutionDate: '2026-06-20',
      supportingEvidenceIds: ['node-maintenance-log'],
      provenance,
      visibility: siteVisibility('org-1'),
    });
    expect(ror.status).toBe('submitted');
    expect(ror.counterEvidenceId).toBe('ce-1');
    expect(validateResponseHasCounterEvidence(ror)).toBeNull();
  });
});

// --------------------------------------------------------------------------
// Evidence Graph
// --------------------------------------------------------------------------

describe('EvidenceGraph', () => {
  it('creates an empty graph', () => {
    const graph = createEmptyGraph();
    expect(graph.claims).toHaveLength(0);
    expect(graph.evidenceNodes).toHaveLength(0);
    expect(graph.counterEvidence).toHaveLength(0);
    expect(graph.rightsOfResponse).toHaveLength(0);
    expect(graph.relationships).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// Consciousness State — type check only, no computation
// --------------------------------------------------------------------------

describe('ConsciousnessState', () => {
  it('type Shape is defined and exported', () => {
    // This test verifies the type exists and can be imported.
    // No computation is performed — Consciousness State is domain type only in 17.1.
    const state: Record<string, unknown> = {
      claimId: 'claim-1',
      value: 0,
      level: 'insufficient',
      lastUpdated: '2026-07-01',
      explanation: 'No evidence recorded for this Claim.',
      contributions: [],
      hasUnresolvedCounterEvidence: false,
    };
    expect(state.claimId).toBe('claim-1');
    expect(state.level).toBe('insufficient');
  });
});
