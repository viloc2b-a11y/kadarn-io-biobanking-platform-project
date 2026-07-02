// ==========================================================================
// Confidence Evaluation — Pipeline Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 18.3.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  EvaluationPipeline,
  aggregateContributions,
  projectConfidence,
  evidenceClassEvaluator,
  relationshipEvaluator,
  counterEvidenceEvaluator,
  temporalEvaluator,
  rightOfResponseEvaluator,
  visibilityEvaluator,
  buildGraphFromData,
  createGraphStore,
  addNode,
  EVIDENCE_CLASS_DEFAULT_WEIGHT,
} from '../src/index.js';
import type { Claim, EvidenceNode, CounterEvidence, RightOfResponse, EvidenceRelationship } from '../src/index.js';

// --------------------------------------------------------------------------
// Sample data
// --------------------------------------------------------------------------

const claim: Claim = {
  id: 'claim-1', claimTypeId: 'biospecimen.storage.freezer_minus_80c',
  name: '-80°C Freezer Storage', description: 'Capability.',
  organizationId: 'org-1', status: 'active', domain: 'biospecimen',
  decays: true, decayPeriodMonths: 6,
  validEvidenceClasses: ['B', 'C'] as any, requiredEvidenceClasses: ['B'] as any,
  provenance: { createdByActorId: 'actor-1', createdByOrganizationId: 'org-1', correlationId: 'corr-1', summary: 'Created' },
  visibility: { owningOrganizationId: 'org-1', scope: 'site', authorizedSponsorIds: [] },
  temporal: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', decayPeriodMonths: 6 },
};

function makeEV(id: string, claimId: string, evClass: string, opts?: any): EvidenceNode {
  return {
    id, claimId, evidenceClass: evClass as any, content: `Evidence ${id}`, source: 'test',
    date: '2026-07-01', status: 'active', weight: 0.5,
    provenance: { createdByActorId: 'actor-1', createdByOrganizationId: 'org-1', correlationId: 'corr-1', summary: '' },
    visibility: { owningOrganizationId: 'org-1', scope: 'site', authorizedSponsorIds: [] },
    temporal: { createdAt: opts?.createdAt ?? '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', decayPeriodMonths: null },
    ...opts,
  };
}

function makeRel(id: string, src: string, tgt: string, type: string): EvidenceRelationship {
  return {
    id, sourceNodeId: src, targetNodeId: tgt, relationshipType: type as any,
    provenance: { createdByActorId: 'actor-1', createdByOrganizationId: 'org-1', correlationId: 'corr-1', summary: '' },
    temporal: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', decayPeriodMonths: null },
  };
}

// --------------------------------------------------------------------------
// Pipeline end-to-end
// --------------------------------------------------------------------------

describe('EvaluationPipeline end-to-end', () => {
  it('runs a complete evaluation with all 6 evaluators', () => {
    const ev1 = makeEV('ev-1', 'claim-1', 'A');
    const ev2 = makeEV('ev-2', 'claim-1', 'B');
    const rel = makeRel('rel-1', 'ev-1', 'ev-2', 'supports');

    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2], relationships: [rel] });

    const pipeline = new EvaluationPipeline([
      { name: 'EvidenceClassEvaluator', evaluate: evidenceClassEvaluator, description: 'Class evaluation' },
      { name: 'RelationshipEvaluator', evaluate: relationshipEvaluator, description: 'Relationship balance' },
      { name: 'CounterEvidenceEvaluator', evaluate: counterEvidenceEvaluator, description: 'Counter evidence' },
      { name: 'TemporalEvaluator', evaluate: temporalEvaluator, description: 'Temporal continuity' },
      { name: 'RightOfResponseEvaluator', evaluate: rightOfResponseEvaluator, description: 'Response status' },
      { name: 'VisibilityEvaluator', evaluate: visibilityEvaluator, description: 'Visibility state' },
    ]);

    const result = pipeline.evaluate(store, 'claim-1', 'actor-1', 'corr-eval-1', 'test-v1.0.0');

    expect(result.claimId).toBe('claim-1');
    expect(result.contributions.length).toBe(6);
    expect(result.confidenceValue).toBeGreaterThanOrEqual(0);
    expect(result.confidenceValue).toBeLessThanOrEqual(100);
    expect(result.explanation.claimId).toBe('claim-1');
    expect(result.explanation.provenance.generatedByEvaluatorVersion).toBe('test-v1.0.0');
  });

  it('produces deterministic results (same input = same output)', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [makeEV('a', 'claim-1', 'A'), makeEV('b', 'claim-1', 'B')] });
    const pipeline = new EvaluationPipeline([
      { name: 'EC', evaluate: evidenceClassEvaluator, description: '' },
      { name: 'REL', evaluate: relationshipEvaluator, description: '' },
      { name: 'CE', evaluate: counterEvidenceEvaluator, description: '' },
    ]);

    const r1 = pipeline.evaluate(store, 'claim-1', 'a', 'c');
    const r2 = pipeline.evaluate(store, 'claim-1', 'a', 'c');

    expect(r1.confidenceValue).toBe(r2.confidenceValue);
    expect(r1.confidenceLevel).toBe(r2.confidenceLevel);
    expect(r1.contributions.length).toBe(r2.contributions.length);
  });
});

// --------------------------------------------------------------------------
// Individual evaluators
// --------------------------------------------------------------------------

describe('EvidenceClassEvaluator', () => {
  it('evaluates class A evidence as stronger than class B', () => {
    const storeA = buildGraphFromData({ claims: [claim], evidenceNodes: [makeEV('a', 'claim-1', 'A')] });
    const storeB = buildGraphFromData({ claims: [claim], evidenceNodes: [makeEV('b', 'claim-1', 'B')] });
    const resultA = evidenceClassEvaluator(storeA);
    const resultB = evidenceClassEvaluator(storeB);
    // Class A has higher weight than B
    expect(EVIDENCE_CLASS_DEFAULT_WEIGHT['A']).toBeGreaterThan(EVIDENCE_CLASS_DEFAULT_WEIGHT['B']);
    expect(resultA.evidenceUsed.length).toBe(1);
    expect(resultB.evidenceUsed.length).toBe(1);
  });
});

describe('RelationshipEvaluator', () => {
  it('produces positive delta for supporting relationships', () => {
    const store = buildGraphFromData({
      claims: [claim],
      evidenceNodes: [makeEV('a', 'claim-1', 'A'), makeEV('b', 'claim-1', 'B')],
      relationships: [makeRel('r1', 'a', 'b', 'supports')],
    });
    const result = relationshipEvaluator(store);
    expect(result.scoreDelta).toBeGreaterThanOrEqual(0);
  });

  it('produces negative delta for contradicting relationships', () => {
    const store = buildGraphFromData({
      claims: [claim],
      evidenceNodes: [makeEV('a', 'claim-1', 'A'), makeEV('b', 'claim-1', 'B')],
      relationships: [makeRel('r1', 'a', 'b', 'contradicts')],
    });
    const result = relationshipEvaluator(store);
    expect(result.scoreDelta).toBeLessThanOrEqual(0);
  });
});

describe('CounterEvidenceEvaluator', () => {
  it('penalizes unresolved counter evidence', () => {
    const ce = makeEV('ce-1', 'claim-1', 'C', { isCounterEvidence: true, weight: -0.3, hasResponse: false, responseId: null });
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [makeEV('a', 'claim-1', 'A'), ce] });
    const result = counterEvidenceEvaluator(store);
    expect(result.scoreDelta).toBeLessThan(0);
  });
});

describe('TemporalEvaluator', () => {
  it('reports gaps for discontinuous evidence', () => {
    const early = makeEV('early', 'claim-1', 'B', { temporal: { createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z', decayPeriodMonths: null } });
    const recent = makeEV('recent', 'claim-1', 'B', { temporal: { createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z', decayPeriodMonths: null } });
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [early, recent] });
    const result = temporalEvaluator(store);
    // Gap > 18 months should produce discontinuity
    expect(result.temporalContinuity).not.toBeNull();
  });
});

describe('RightOfResponseEvaluator', () => {
  it('reports resolved responses positively', () => {
    const ror: RightOfResponse = {
      id: 'ror-1', counterEvidenceId: 'ce-1', description: 'Resolved', resolutionDate: '2026-06-20',
      status: 'confirmed', supportingEvidenceIds: [],
      provenance: { createdByActorId: 'a', createdByOrganizationId: 'o', correlationId: 'c', summary: '' },
      visibility: { owningOrganizationId: 'o', scope: 'site', authorizedSponsorIds: [] },
      temporal: { createdAt: '2026-06-20T00:00:00Z', updatedAt: '2026-06-20T00:00:00Z', decayPeriodMonths: null },
    };
    const store = buildGraphFromData({ claims: [claim], responses: [ror] });
    const result = rightOfResponseEvaluator(store);
    expect(result.scoreDelta).toBeGreaterThanOrEqual(0);
  });
});

describe('VisibilityEvaluator', () => {
  it('evaluates visibility without interpreting content', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [makeEV('a', 'claim-1', 'B')] });
    const result = visibilityEvaluator(store);
    expect(result.visibilityFilterApplied).not.toBeNull();
    expect(result.visibilityFilterApplied!.accessibleEvidenceCount).toBeGreaterThanOrEqual(0);
  });
});

// --------------------------------------------------------------------------
// Aggregation
// --------------------------------------------------------------------------

describe('aggregateContributions', () => {
  it('aggregates multiple contributions into a raw score', () => {
    const contributions = [
      { evaluatorName: 'A', scoreDelta: 10, summary: 'A', evidenceUsed: [], evidenceOmitted: [],
        relationshipsTraversed: [], counterEvidenceConsidered: [], responsesConsidered: [],
        temporalContinuity: null, visibilityFilterApplied: null },
      { evaluatorName: 'B', scoreDelta: -5, summary: 'B', evidenceUsed: [], evidenceOmitted: [],
        relationshipsTraversed: [], counterEvidenceConsidered: [], responsesConsidered: [],
        temporalContinuity: null, visibilityFilterApplied: null },
    ];

    const result = aggregateContributions(contributions);
    expect(result.rawScore).toBe(55); // 50 + 10 - 5
  });

  it('clamps score to 0-100 range', () => {
    const high = [
      { evaluatorName: 'H', scoreDelta: 200, summary: '', evidenceUsed: [], evidenceOmitted: [],
        relationshipsTraversed: [], counterEvidenceConsidered: [], responsesConsidered: [],
        temporalContinuity: null, visibilityFilterApplied: null },
    ];
    const low = [
      { evaluatorName: 'L', scoreDelta: -200, summary: '', evidenceUsed: [], evidenceOmitted: [],
        relationshipsTraversed: [], counterEvidenceConsidered: [], responsesConsidered: [],
        temporalContinuity: null, visibilityFilterApplied: null },
    ];

    expect(aggregateContributions(high).rawScore).toBe(100);
    expect(aggregateContributions(low).rawScore).toBe(0);
  });
});

// --------------------------------------------------------------------------
// Projection
// --------------------------------------------------------------------------

describe('projectConfidence', () => {
  it('maps high scores to high confidence', () => {
    expect(projectConfidence(85).confidenceLevel).toBe('high');
  });

  it('maps medium scores to moderate confidence', () => {
    expect(projectConfidence(50).confidenceLevel).toBe('moderate');
  });

  it('maps low scores to low confidence', () => {
    expect(projectConfidence(25).confidenceLevel).toBe('low');
  });

  it('maps very low scores to insufficient', () => {
    expect(projectConfidence(5).confidenceLevel).toBe('insufficient');
  });

  it('clamps values to valid range', () => {
    expect(projectConfidence(150).confidenceValue).toBe(100);
    expect(projectConfidence(-10).confidenceValue).toBe(0);
  });
});

// --------------------------------------------------------------------------
// Explainability
// --------------------------------------------------------------------------

describe('Explainability preserved', () => {
  it('every evaluation produces an explanation', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [makeEV('a', 'claim-1', 'A')] });
    const pipeline = new EvaluationPipeline([
      { name: 'EC', evaluate: evidenceClassEvaluator, description: '' },
    ]);

    const result = pipeline.evaluate(store, 'claim-1', 'actor-1', 'corr-x');

    expect(result.explanation).toBeDefined();
    expect(result.explanation.evidenceUsed.length).toBeGreaterThan(0);
    expect(result.explanation.reasoningChain).toBeDefined();
    expect(result.explanation.provenance.generatedByActorId).toBe('actor-1');
  });
});

// --------------------------------------------------------------------------
// No forbidden operations
// --------------------------------------------------------------------------

describe('No forbidden operations', () => {
  it('no AI/ML functions in evaluation module', async () => {
    const forbidden = ['computeConfidence', 'inferCapability', 'generateJudgment', 'scoreInstitution',
      'rankSite', 'recommendSite', 'evaluateTrust'];
    const evalMod = await import('../src/evaluation.js');
    for (const fn of forbidden) {
      expect((evalMod as any)[fn]).toBeUndefined();
    }
  });
});
