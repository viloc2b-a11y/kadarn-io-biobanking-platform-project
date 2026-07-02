// ==========================================================================
// Explainable Confidence Output — Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 18.4.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  evaluateClaim,
  evaluateEvidenceGraph,
  buildGraphFromData,
  createGraphStore,
  addNode,
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

function makeEV(id: string, evClass: string, opts?: any): EvidenceNode {
  return {
    id, claimId: 'claim-1', evidenceClass: evClass as any, content: `Evidence ${id}`, source: 'test',
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
    provenance: { createdByActorId: 'a', createdByOrganizationId: 'o', correlationId: 'c', summary: '' },
    temporal: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', decayPeriodMonths: null },
  };
}

// --------------------------------------------------------------------------
// evaluateClaim
// --------------------------------------------------------------------------

describe('evaluateClaim', () => {
  it('produces a complete ConfidenceReport for a valid Claim', () => {
    const ev1 = makeEV('ev-1', 'A');
    const ev2 = makeEV('ev-2', 'B');
    const ev3 = makeEV('ev-3', 'C');
    const rel = makeRel('rel-1', 'ev-1', 'ev-2', 'supports');

    const report = evaluateClaim({
      claimId: 'claim-1',
      claims: [claim],
      evidenceNodes: [ev1, ev2, ev3],
      relationships: [rel],
      actorId: 'actor-1',
      correlationId: 'corr-out-1',
      evaluatorVersion: 'test-v1.0.0',
    });

    expect(report.reportId).toBeDefined();
    expect(report.claimId).toBe('claim-1');
    expect(report.confidenceValue).toBeGreaterThanOrEqual(0);
    expect(report.confidenceValue).toBeLessThanOrEqual(100);
    expect(report.confidenceLevel).toBeDefined();
    expect(report.explanation).toBeDefined();
    expect(report.contributionBreakdown.length).toBeGreaterThan(0);
  });

  it('report contains full explanation with evidence used', () => {
    const report = evaluateClaim({
      claimId: 'claim-1',
      claims: [claim],
      evidenceNodes: [makeEV('a', 'A'), makeEV('b', 'B')],
      actorId: 'actor-1',
      correlationId: 'corr-out-2',
    });

    expect(report.explanation.evidenceUsed.length).toBeGreaterThan(0);
    expect(report.explanation.reasoningChain).toBeDefined();
    expect(report.explanation.provenance.generatedByActorId).toBe('actor-1');
  });

  it('output is deterministic for the same input', () => {
    const input = {
      claimId: 'claim-1',
      claims: [claim],
      evidenceNodes: [makeEV('a', 'A')],
      actorId: 'actor-1',
      correlationId: 'corr-det',
    };

    const r1 = evaluateClaim(input);
    const r2 = evaluateClaim(input);

    expect(r1.confidenceValue).toBe(r2.confidenceValue);
    expect(r1.confidenceLevel).toBe(r2.confidenceLevel);
    expect(r1.contributionBreakdown.length).toBe(r2.contributionBreakdown.length);
    expect(r1.contributionBreakdown[0].scoreDelta).toBe(r2.contributionBreakdown[0].scoreDelta);
  });
});

// --------------------------------------------------------------------------
// evaluateEvidenceGraph
// --------------------------------------------------------------------------

describe('evaluateEvidenceGraph', () => {
  it('produces a report from a pre-built graph', () => {
    const store = buildGraphFromData({
      claims: [claim],
      evidenceNodes: [makeEV('a', 'A'), makeEV('b', 'B')],
    });

    const report = evaluateEvidenceGraph({
      graph: store,
      claimId: 'claim-1',
      actorId: 'actor-1',
      correlationId: 'corr-graph-1',
    });

    expect(report.confidenceValue).toBeGreaterThanOrEqual(0);
    expect(report.explanation.evidenceUsed.length).toBe(2);
  });

  it('handles a graph with no evidence', () => {
    const emptyStore = createGraphStore();

    const report = evaluateEvidenceGraph({
      graph: emptyStore,
      claimId: 'claim-none',
      actorId: 'actor-1',
      correlationId: 'corr-empty',
    });

    expect(report.confidenceValue).toBeGreaterThanOrEqual(0);
    expect(report.contributionBreakdown.length).toBe(6);
  });
});

// --------------------------------------------------------------------------
// Report completeness
// --------------------------------------------------------------------------

describe('Report completeness', () => {
  it('includes contribution breakdown', () => {
    const report = evaluateClaim({
      claimId: 'claim-1', claims: [claim],
      evidenceNodes: [makeEV('a', 'A')],
      actorId: 'a', correlationId: 'c',
    });

    expect(report.contributionBreakdown.length).toBe(6); // 6 evaluators
    for (const item of report.contributionBreakdown) {
      expect(item.evaluatorName).toBeDefined();
      expect(typeof item.scoreDelta).toBe('number');
      expect(item.summary).toBeDefined();
    }
  });

  it('includes evaluator version metadata', () => {
    const report = evaluateClaim({
      claimId: 'claim-1', claims: [claim],
      evidenceNodes: [makeEV('a', 'A')],
      actorId: 'a', correlationId: 'c',
      evaluatorVersion: 'evidence-core-v2.0.0',
    });

    expect(report.evaluatorVersion).toBe('evidence-core-v2.0.0');
    expect(report.explanation.provenance.generatedByEvaluatorVersion).toBe('evidence-core-v2.0.0');
  });

  it('reports unresolved counter evidence', () => {
    const ce = makeEV('ce-1', 'C', { isCounterEvidence: true, weight: -0.3, hasResponse: false, responseId: null });
    const report = evaluateClaim({
      claimId: 'claim-1', claims: [claim],
      evidenceNodes: [ce],
      actorId: 'a', correlationId: 'c',
    });

    expect(report.hasUnresolvedCounterEvidence).toBe(true);
    expect(report.explanation.counterEvidenceConsidered.length).toBeGreaterThan(0);
  });
});

// --------------------------------------------------------------------------
// Traceability
// --------------------------------------------------------------------------

describe('Traceability', () => {
  it('every evidence contribution references an existing node', () => {
    const report = evaluateClaim({
      claimId: 'claim-1', claims: [claim],
      evidenceNodes: [makeEV('ev-trace', 'B')],
      actorId: 'a', correlationId: 'c',
    });

    for (const ev of report.explanation.evidenceUsed) {
      expect(ev.evidenceNodeId).toBeDefined();
      expect(ev.evidenceClass).toBeDefined();
    }
  });

  it('counter evidence is traceable', () => {
    const ce = makeEV('ce-trace', 'C', { isCounterEvidence: true, weight: -0.3, hasResponse: false, responseId: null });
    const report = evaluateClaim({
      claimId: 'claim-1', claims: [claim],
      evidenceNodes: [ce],
      actorId: 'a', correlationId: 'c',
    });

    expect(report.explanation.counterEvidenceConsidered.length).toBeGreaterThan(0);
    for (const ceItem of report.explanation.counterEvidenceConsidered) {
      expect(ceItem.counterEvidenceId).toBeDefined();
    }
  });
});

// --------------------------------------------------------------------------
// No forbidden operations
// --------------------------------------------------------------------------

describe('No forbidden operations', () => {
  it('output module has no AI/ML functions', async () => {
    const output = await import('../src/output.js');
    const forbidden = ['computeConfidence', 'inferCapability', 'generateJudgment', 'scoreInstitution',
      'rankSite', 'recommendSite', 'evaluateTrust'];
    for (const fn of forbidden) {
      expect((output as any)[fn]).toBeUndefined();
    }
  });
});
