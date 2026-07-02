// ==========================================================================
// Evidence Core — Explainability Framework Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 18.1.
// Tests the explainability domain model invariants.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { createSkeletonEvaluation } from '../src/index.js';
import type { EvaluationResult, Explanation, EvidenceContribution } from '../src/index.js';

// --------------------------------------------------------------------------
// EvaluationResult structure
// --------------------------------------------------------------------------

describe('EvaluationResult', () => {
  it('contains all required fields', () => {
    const result = createSkeletonEvaluation({
      claimId: 'claim-1',
      actorId: 'actor-1',
      correlationId: 'corr-1',
    });

    expect(result.id).toBeDefined();
    expect(result.claimId).toBe('claim-1');
    expect(result.confidenceLevel).toBe('insufficient');
    expect(result.confidenceValue).toBe(0);
    expect(result.evaluatedAt).toBeDefined();
    expect(result.evaluatorVersion).toBe('0.0.0');
    expect(result.hasUnresolvedCounterEvidence).toBe(false);
  });

  it('contains a full Explanation', () => {
    const result = createSkeletonEvaluation({
      claimId: 'claim-1',
      actorId: 'actor-1',
      correlationId: 'corr-1',
    });

    const exp = result.explanation;
    expect(exp.id).toBeDefined();
    expect(exp.claimId).toBe('claim-1');
    expect(exp.evidenceUsed).toEqual([]);
    expect(exp.evidenceOmitted).toEqual([]);
    expect(exp.relationshipsTraversed).toEqual([]);
    expect(exp.counterEvidenceConsidered).toEqual([]);
    expect(exp.responsesConsidered).toEqual([]);
    expect(exp.temporalContinuity).toBeDefined();
    expect(exp.visibilityFilterApplied).toBeDefined();
    expect(exp.provenance).toBeDefined();
    expect(exp.reasoningChain).toBeDefined();
  });

  it('accepts custom evaluator version', () => {
    const result = createSkeletonEvaluation({
      claimId: 'claim-1',
      actorId: 'actor-1',
      correlationId: 'corr-1',
      evaluatorVersion: 'confidence-engine-v1.0.0',
    });
    expect(result.evaluatorVersion).toBe('confidence-engine-v1.0.0');
    expect(result.explanation.provenance.generatedByEvaluatorVersion).toBe('confidence-engine-v1.0.0');
  });
});

// --------------------------------------------------------------------------
// Explanation invariants
// --------------------------------------------------------------------------

describe('Explanation invariants', () => {
  it('every explanation references a Claim', () => {
    const result = createSkeletonEvaluation({
      claimId: 'claim-with-evidence',
      actorId: 'actor-1',
      correlationId: 'corr-2',
    });
    expect(result.explanation.claimId).toBe('claim-with-evidence');
  });

  it('no explanation can exist without provenance', () => {
    const result = createSkeletonEvaluation({
      claimId: 'claim-1',
      actorId: 'actor-1',
      correlationId: 'corr-3',
    });
    const prov = result.explanation.provenance;
    expect(prov.generatedAt).toBeDefined();
    expect(prov.generatedByActorId).toBe('actor-1');
    expect(prov.correlationId).toBe('corr-3');
    expect(prov.generatedByEvaluatorVersion).toBeDefined();
  });

  it('preserves traceability via claimId', () => {
    const result = createSkeletonEvaluation({
      claimId: 'traceable-claim',
      actorId: 'actor-1',
      correlationId: 'corr-4',
    });
    // The evaluation result references the same claim as the explanation
    expect(result.claimId).toBe(result.explanation.claimId);
  });
});

// --------------------------------------------------------------------------
// Contribution types
// --------------------------------------------------------------------------

describe('Contribution types', () => {
  it('EvidenceContribution includes omission reason when not included', () => {
    const omitted: import('../src/explainability.js').OmittedEvidence = {
      evidenceNodeId: 'ev-1',
      reason: 'outdated',
      description: 'Calibration certificate expired 2025-06',
    };
    expect(omitted.reason).toBe('outdated');
    expect(omitted.description).toBeDefined();
  });

  it('CounterEvidenceContribution tracks response status', () => {
    const ce: import('../src/explainability.js').CounterEvidenceContribution = {
      counterEvidenceId: 'ce-1',
      content: 'Temperature excursion detected',
      evidenceClass: 'C' as any,
      hasResponse: true,
      responseId: 'ror-1',
      responseStatus: 'resolved',
      description: 'Temperature excursion resolved via equipment replacement',
      resolved: true,
    };
    expect(ce.hasResponse).toBe(true);
    expect(ce.resolved).toBe(true);
  });

  it('CounterEvidenceContribution can be unresolved', () => {
    const ce: import('../src/explainability.js').CounterEvidenceContribution = {
      counterEvidenceId: 'ce-2',
      content: 'Pending audit finding',
      evidenceClass: 'B' as any,
      hasResponse: false,
      responseId: null,
      description: 'Unresolved counter evidence',
      resolved: false,
    };
    expect(ce.resolved).toBe(false);
  });

  it('RelationshipContribution captures traversal', () => {
    const rel: import('../src/explainability.js').RelationshipContribution = {
      relationshipId: 'rel-1',
      sourceNodeId: 'ev-1',
      targetNodeId: 'ev-2',
      relationshipType: 'supports',
      description: 'SOP v3 supports the processing capability claim',
    };
    expect(rel.relationshipType).toBe('supports');
    expect(rel.description).toBeDefined();
  });

  it('TemporalContribution can report gaps', () => {
    const tc: import('../src/explainability.js').TemporalContribution = {
      evaluatedPeriodStart: '2020-01-01',
      evaluatedPeriodEnd: '2026-07-01',
      evidenceNodeCount: 12,
      continuityDetected: false,
      gaps: ['No evidence between 2022-03 and 2024-01 (22 months)'],
      summary: 'Temporal discontinuity detected: 22-month gap',
    };
    expect(tc.continuityDetected).toBe(false);
    expect(tc.gaps.length).toBeGreaterThan(0);
  });

  it('ResponseContribution tracks resolution', () => {
    const ror: import('../src/explainability.js').ResponseContribution = {
      responseId: 'ror-1',
      counterEvidenceId: 'ce-1',
      description: 'Temperature logger replaced and validated',
      resolutionDate: '2026-06-20',
      status: 'confirmed',
      accepted: true,
    };
    expect(ror.accepted).toBe(true);
    expect(ror.status).toBe('confirmed');
  });
});

// --------------------------------------------------------------------------
// No confidence algorithm
// --------------------------------------------------------------------------

describe('No confidence algorithm', () => {
  it('createSkeletonEvaluation does not compute confidence', () => {
    // The skeleton factory returns placeholder values
    const result = createSkeletonEvaluation({
      claimId: 'claim-1',
      actorId: 'actor-1',
      correlationId: 'corr-5',
    });
    // These are placeholders, not computed values
    expect(result.confidenceValue).toBe(0);
    expect(result.confidenceLevel).toBe('insufficient');
    // There is no weight or scoring happening
    expect(result.explanation.evidenceUsed).toHaveLength(0);
  });

  it('no confidence computation function exists in explainability module', async () => {
    const exp = await import('../src/explainability.js');
    expect((exp as any).computeConfidence).toBeUndefined();
    expect((exp as any).calculateConfidence).toBeUndefined();
    expect((exp as any).scoreInstitution).toBeUndefined();
    expect((exp as any).rankSite).toBeUndefined();
    expect((exp as any).recommendSite).toBeUndefined();
    expect((exp as any).inferCapability).toBeUndefined();
    expect((exp as any).generateJudgment).toBeUndefined();
  });
});

// --------------------------------------------------------------------------
// Terminology scan
// --------------------------------------------------------------------------

describe('Terminology compliance', () => {
  it('contains no retired Trust terminology in source', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../src/explainability.ts'), 'utf-8').toLowerCase();
    const retired = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
      'gold_site', 'silver_site', 'bronze_site'];
    for (const term of retired) {
      expect(source).not.toContain(term);
    }
  });
});
