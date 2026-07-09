// ==========================================================================
// KTP-1.3 — Hybrid Trial Evaluators Tests
// ==========================================================================
// Tests for the three new evaluators:
//   1. SelfReportCapEvaluator — caps confidence when only self-declared
//   2. EvidenceExpiryEvaluator — degrades confidence for expired evidence
//   3. NotApplicableSkipEvaluator — identifies N/A claims
//
// All tests use pure functions — no database, no Supabase, no side effects.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  selfReportCapEvaluator,
  evidenceExpiryEvaluator,
  notApplicableSkipEvaluator,
} from '@kadarn/readiness-engine';

// --------------------------------------------------------------------------
// Helper: build a minimal GraphStore
// --------------------------------------------------------------------------

interface TestNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
}

interface TestEdge {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  label: string;
}

function makeGraph(nodes: TestNode[] = [], edges: TestEdge[] = []) {
  const nodeMap = new Map<string, any>();
  for (const n of nodes) {
    nodeMap.set(n.id, { ...n });
  }
  const edgeMap = new Map<string, any>();
  for (const e of edges) {
    edgeMap.set(e.id, { ...e });
  }
  return { nodes: nodeMap, edges: edgeMap };
}

function evidenceNode(id: string, evidenceClass: string, date?: string, extra?: Record<string, unknown>): TestNode {
  return {
    id,
    type: 'evidence_node',
    data: { evidenceClass, date: date || new Date().toISOString(), ...extra },
    createdAt: date || new Date().toISOString(),
  };
}

// ==========================================================================
// 1. SelfReportCapEvaluator
// ==========================================================================

describe('SelfReportCapEvaluator', () => {
  it('should apply no cap when no evidence exists', () => {
    const graph = makeGraph();
    const result = selfReportCapEvaluator(graph);
    expect(result.scoreDelta).toBe(0);
    expect(result.summary).toContain('No evidence');
  });

  it('should cap confidence when only Class B evidence is present', () => {
    const graph = makeGraph([
      evidenceNode('e1', 'B'),
      evidenceNode('e2', 'B'),
    ]);
    const result = selfReportCapEvaluator(graph);
    expect(result.scoreDelta).toBe(-25);
    expect(result.summary).toContain('Class B');
    expect(result.summary).toContain('0.40');
  });

  it('should apply moderate cap when only Class B + C evidence is present', () => {
    const graph = makeGraph([
      evidenceNode('e1', 'B'),
      evidenceNode('e2', 'C'),
    ]);
    const result = selfReportCapEvaluator(graph);
    expect(result.scoreDelta).toBe(-10);
    expect(result.summary).toContain('0.65');
  });

  it('should apply no cap when Class A evidence is present', () => {
    const graph = makeGraph([
      evidenceNode('e1', 'B'),
      evidenceNode('e2', 'A'),
    ]);
    const result = selfReportCapEvaluator(graph);
    expect(result.scoreDelta).toBe(0);
    expect(result.summary).toContain('No self-report cap');
  });

  it('should apply no cap when Class F evidence is present', () => {
    const graph = makeGraph([
      evidenceNode('e1', 'B'),
      evidenceNode('e2', 'C'),
      evidenceNode('e3', 'F'),
    ]);
    const result = selfReportCapEvaluator(graph);
    expect(result.scoreDelta).toBe(0);
  });

  it('should apply no cap when Class D evidence is present', () => {
    const graph = makeGraph([
      evidenceNode('e1', 'B'),
      evidenceNode('e2', 'D'),
    ]);
    const result = selfReportCapEvaluator(graph);
    expect(result.scoreDelta).toBe(0);
  });
});

// ==========================================================================
// 2. EvidenceExpiryEvaluator
// ==========================================================================

describe('EvidenceExpiryEvaluator', () => {
  it('should return no degradation when no evidence exists', () => {
    const graph = makeGraph();
    const result = evidenceExpiryEvaluator(graph);
    expect(result.scoreDelta).toBe(0);
    expect(result.summary).toContain('No evidence');
  });

  it('should not degrade current evidence', () => {
    const graph = makeGraph([
      evidenceNode('e1', 'B', new Date().toISOString()),
    ]);
    const result = evidenceExpiryEvaluator(graph);
    expect(result.scoreDelta).toBe(0);
  });

  it('should degrade evidence older than Class B decay (24 months)', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 3); // 36 months ago
    const graph = makeGraph([
      evidenceNode('e1', 'B', oldDate.toISOString()),
    ]);
    const result = evidenceExpiryEvaluator(graph);
    expect(result.scoreDelta).toBeLessThan(0);
    expect(result.summary).toContain('expired');
  });

  it('should degrade evidence older than Class C decay (12 months)', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2); // 24 months ago
    const graph = makeGraph([
      evidenceNode('e1', 'C', oldDate.toISOString()),
    ]);
    const result = evidenceExpiryEvaluator(graph);
    expect(result.scoreDelta).toBeLessThan(0);
  });

  it('should not degrade Class D evidence (no decay)', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 10); // 10 years ago
    const graph = makeGraph([
      evidenceNode('e1', 'D', oldDate.toISOString()),
    ]);
    const result = evidenceExpiryEvaluator(graph);
    expect(result.scoreDelta).toBe(0);
  });

  it('should not degrade Class E evidence (no decay)', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 5);
    const graph = makeGraph([
      evidenceNode('e1', 'E', oldDate.toISOString()),
    ]);
    const result = evidenceExpiryEvaluator(graph);
    expect(result.scoreDelta).toBe(0);
  });

  it('should apply stronger degradation for older evidence', () => {
    const veryOld = new Date();
    veryOld.setFullYear(veryOld.getFullYear() - 10); // 120 months ago
    const somewhatOld = new Date();
    somewhatOld.setFullYear(somewhatOld.getFullYear() - 3); // 36 months ago

    const g1 = makeGraph([evidenceNode('e1', 'B', veryOld.toISOString())]);
    const g2 = makeGraph([evidenceNode('e2', 'B', somewhatOld.toISOString())]);

    const r1 = evidenceExpiryEvaluator(g1);
    const r2 = evidenceExpiryEvaluator(g2);

    // Older evidence should be degraded more
    expect(r1.scoreDelta).toBeLessThan(r2.scoreDelta);
  });
});

// ==========================================================================
// 3. NotApplicableSkipEvaluator
// ==========================================================================

describe('NotApplicableSkipEvaluator', () => {
  it('should return zero score delta — N/A does not affect confidence', () => {
    const graph = makeGraph([
      evidenceNode('e1', 'B', undefined, { notApplicable: true }),
    ]);
    const result = notApplicableSkipEvaluator(graph);
    expect(result.scoreDelta).toBe(0);
  });

  it('should detect N/A evidence nodes', () => {
    const graph = makeGraph([
      evidenceNode('e1', 'B', undefined, { notApplicable: true }),
      evidenceNode('e2', 'C'),
    ]);
    const result = notApplicableSkipEvaluator(graph);
    expect(result.summary).toContain('1 of 2');
    expect(result.summary).toContain('NOT_APPLICABLE');
  });

  it('should return zero detection when no N/A nodes exist', () => {
    const graph = makeGraph([
      evidenceNode('e1', 'B'),
      evidenceNode('e2', 'C'),
    ]);
    const result = notApplicableSkipEvaluator(graph);
    expect(result.summary).toContain('No NOT_APPLICABLE');
  });
});
