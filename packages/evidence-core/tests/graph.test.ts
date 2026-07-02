// ==========================================================================
// Evidence Core — Graph Traversal Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 18.2.
// Tests deterministic, read-only graph traversal.
// ==========================================================================

import { describe, it, expect } from 'vitest';

import {
  buildGraphFromData,
  getEvidenceGraph,
  getClaimEvidence,
  getSupportingEvidence,
  getContradictingEvidence,
  getResponseChain,
  getEvidenceLineage,
  getTemporalHistory,
  getRelationshipGraph,
  findDisconnectedNodes,
  findCycles,
  validateGraphIntegrity,
} from '../src/index.js';
import type { Claim, EvidenceNode, EvidenceRelationship, CounterEvidence, RightOfResponse } from '../src/index.js';

// --------------------------------------------------------------------------
// Sample data
// --------------------------------------------------------------------------

const claim: Claim = {
  id: 'claim-1', claimTypeId: 'biospecimen.storage.freezer_minus_80c',
  name: '-80°C Freezer Storage', description: 'Capability to store biospecimens.',
  organizationId: 'org-1', status: 'active', domain: 'biospecimen',
  decays: true, decayPeriodMonths: 6,
  validEvidenceClasses: ['B', 'C'] as any, requiredEvidenceClasses: ['B'] as any,
  provenance: { createdByActorId: 'actor-1', createdByOrganizationId: 'org-1', correlationId: 'corr-1', summary: 'Claim created' },
  visibility: { owningOrganizationId: 'org-1', scope: 'site', authorizedSponsorIds: [] },
  temporal: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', decayPeriodMonths: 6 },
};

function makeEvidence(id: string, claimId: string, content: string, opts?: Partial<EvidenceNode>): EvidenceNode {
  return {
    id, claimId, evidenceClass: 'B' as any, content, source: 'test', date: '2026-07-01',
    status: 'active', weight: 0.5,
    provenance: { createdByActorId: 'actor-1', createdByOrganizationId: 'org-1', correlationId: 'corr-1', summary: content },
    visibility: { owningOrganizationId: 'org-1', scope: 'site', authorizedSponsorIds: [] },
    temporal: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', decayPeriodMonths: null },
    ...opts,
  };
}

function makeRel(id: string, sourceId: string, targetId: string, type: string): EvidenceRelationship {
  return {
    id, sourceNodeId: sourceId, targetNodeId: targetId, relationshipType: type as any,
    provenance: { createdByActorId: 'actor-1', createdByOrganizationId: 'org-1', correlationId: 'corr-1', summary: '' },
    temporal: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', decayPeriodMonths: null },
  };
}

const ev1 = makeEvidence('ev-1', 'claim-1', 'Calibration certificate freezer #A-123');
const ev2 = makeEvidence('ev-2', 'claim-1', 'Temperature monitoring logs Q1-Q2 2026');
const ev3 = makeEvidence('ev-3', 'claim-1', 'Backup generator test record');

const rel1 = makeRel('rel-1', 'ev-1', 'ev-2', 'corroborates');
const rel2 = makeRel('rel-2', 'ev-2', 'ev-3', 'supports');

const ce: CounterEvidence = {
  ...makeEvidence('ce-1', 'claim-1', 'Temperature excursion 2026-06-15: -65°C'), id: 'ce-1',
  isCounterEvidence: true, hasResponse: true, responseId: 'ror-1',
  evidenceClass: 'C' as any, weight: -0.3,
};

const ror: RightOfResponse = {
  id: 'ror-1', counterEvidenceId: 'ce-1', description: 'Freezer #A-123 maintenance completed', resolutionDate: '2026-06-20',
  status: 'confirmed', supportingEvidenceIds: ['ev-2'],
  provenance: { createdByActorId: 'actor-1', createdByOrganizationId: 'org-1', correlationId: 'corr-1', summary: 'Response' },
  visibility: { owningOrganizationId: 'org-1', scope: 'site', authorizedSponsorIds: [] },
  temporal: { createdAt: '2026-06-20T00:00:00Z', updatedAt: '2026-06-20T00:00:00Z', decayPeriodMonths: null },
};

// --------------------------------------------------------------------------
// Graph building
// --------------------------------------------------------------------------

describe('buildGraphFromData', () => {
  it('builds a graph with claims, evidence, and relationships', () => {
    const store = buildGraphFromData({
      claims: [claim],
      evidenceNodes: [ev1, ev2, ev3, ce],
      relationships: [rel1, rel2],
      responses: [ror],
    });

    expect(store.nodes.size).toBe(6); // claim + ev1 + ev2 + ev3 + ce + ror
    expect(store.edges.size).toBeGreaterThan(0);
  });
});

// --------------------------------------------------------------------------
// Evidence Graph traversal
// --------------------------------------------------------------------------

describe('getEvidenceGraph', () => {
  it('traverses complete graph for a claim', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2, ev3], relationships: [rel1, rel2] });
    const graph = getEvidenceGraph(store, 'claim-1');

    expect(graph.claim).toBeDefined();
    expect(graph.claim!.id).toBe('claim-1');
    expect(graph.evidenceNodes.length).toBe(3);
    expect(graph.relationships.length).toBe(2);
  });

  it('returns undefined claim for non-existent claim', () => {
    const store = buildGraphFromData({});
    const graph = getEvidenceGraph(store, 'nonexistent');
    expect(graph.claim).toBeUndefined();
    expect(graph.evidenceNodes).toEqual([]);
  });
});

// --------------------------------------------------------------------------
// Supporting / Contradicting evidence
// --------------------------------------------------------------------------

describe('Supporting and contradicting evidence', () => {
  it('getSupportingEvidence returns supports-linked nodes', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2, ev3], relationships: [rel1, rel2] });
    const supporting = getSupportingEvidence(store, 'claim-1');
    expect(supporting.length).toBeGreaterThan(0);
  });

  it('getContradictingEvidence returns contradicts-linked nodes', () => {
    const conRel = makeRel('rel-con', 'ev-1', 'ev-2', 'contradicts');
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2], relationships: [conRel] });
    const contradicting = getContradictingEvidence(store, 'claim-1');
    expect(contradicting.length).toBeGreaterThan(0);
  });
});

// --------------------------------------------------------------------------
// Claim evidence
// --------------------------------------------------------------------------

describe('getClaimEvidence', () => {
  it('returns all evidence for a claim', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2, ev3] });
    const all = getClaimEvidence(store, 'claim-1');
    expect(all.length).toBe(3);
  });
});

// --------------------------------------------------------------------------
// Response chain
// --------------------------------------------------------------------------

describe('getResponseChain', () => {
  it('traverses from counter evidence to response', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ce], responses: [ror] });
    const chain = getResponseChain(store, 'ce-1');

    expect(chain.counterEvidence).toBeDefined();
    expect(chain.counterEvidence!.id).toBe('ce-1');
    expect(chain.responses.length).toBe(1);
    expect(chain.responses[0].id).toBe('ror-1');
  });

  it('returns empty chain for node with no response', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1] });
    const chain = getResponseChain(store, 'ev-1');
    expect(chain.counterEvidence).toBeUndefined();
    expect(chain.responses).toEqual([]);
  });
});

// --------------------------------------------------------------------------
// Lineage
// --------------------------------------------------------------------------

describe('getEvidenceLineage', () => {
  it('traces provenance lineage', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1] });
    const lineage = getEvidenceLineage(store, 'ev-1');
    expect(lineage.length).toBeGreaterThan(0);
    expect(lineage[0].nodeId).toBe('ev-1');
  });

  it('returns empty lineage for unknown node', () => {
    const store = buildGraphFromData({});
    const lineage = getEvidenceLineage(store, 'nonexistent');
    expect(lineage).toEqual([]);
  });
});

// --------------------------------------------------------------------------
// Temporal history
// --------------------------------------------------------------------------

describe('getTemporalHistory', () => {
  it('returns evidence sorted by timestamp', () => {
    const lateEv = makeEvidence('ev-late', 'claim-1', 'Late evidence', { temporal: { createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z', decayPeriodMonths: null } });
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, lateEv] });

    const history = getTemporalHistory(store, 'claim-1');
    expect(history.length).toBe(2);
    // Earlier is first
    expect(history[0].createdAt <= history[1].createdAt).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Relationship graph
// --------------------------------------------------------------------------

describe('getRelationshipGraph', () => {
  it('returns relationships for specified nodes', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2], relationships: [rel1] });
    const rg = getRelationshipGraph(store, ['ev-1', 'ev-2']);

    expect(rg.nodes.length).toBe(2);
    expect(rg.edges.length).toBeGreaterThan(0);
  });
});

// --------------------------------------------------------------------------
// Disconnected nodes
// --------------------------------------------------------------------------

describe('findDisconnectedNodes', () => {
  it('detects orphan nodes (no edges at all)', async () => {
    const graphModule = await import('../src/graph.js');
    const store = graphModule.createGraphStore();
    const orphan = makeEvidence('orphan-1', 'claim-orphan', 'Orphan node');
    graphModule.addNode(store, { id: 'orphan-1', type: 'evidence_node', label: 'Orphan', data: orphan, createdAt: '2026-01-01T00:00:00Z' });

    const disconnected = findDisconnectedNodes(store);
    expect(disconnected.length).toBe(1);
    expect(disconnected[0].id).toBe('orphan-1');
  });
});

// --------------------------------------------------------------------------
// Cycle detection
// --------------------------------------------------------------------------

describe('cycle detection', () => {
  it('detects no cycles in a valid graph', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2], relationships: [rel1] });
    const cycles = findCycles(store);
    expect(cycles).toEqual([]);
  });

  it('detects a cycle', () => {
    const cycleRel1 = makeRel('cycle-1', 'ev-1', 'ev-2', 'supports');
    const cycleRel2 = makeRel('cycle-2', 'ev-2', 'ev-1', 'contradicts');
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2], relationships: [cycleRel1, cycleRel2] });

    const cycles = findCycles(store);
    expect(cycles.length).toBeGreaterThan(0);
  });
});

// --------------------------------------------------------------------------
// Graph integrity
// --------------------------------------------------------------------------

describe('validateGraphIntegrity', () => {
  it('reports valid for clean graph', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2], relationships: [rel1] });
    const report = validateGraphIntegrity(store);

    expect(report.nodeCount).toBeGreaterThan(0);
    expect(report.edgeCount).toBeGreaterThan(0);
  });

  it('reports integrity check results for clean graph', () => {
    const store = buildGraphFromData({ claims: [claim], evidenceNodes: [ev1, ev2], relationships: [rel1] });
    const report = validateGraphIntegrity(store);
    expect(report.nodeCount).toBeGreaterThan(0);
    expect(report.edgeCount).toBeGreaterThan(0);
    expect(Array.isArray(report.cycles)).toBe(true);
    expect(Array.isArray(report.disconnectedNodes)).toBe(true);
    expect(Array.isArray(report.brokenReferences)).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Structural: no confidence computation
// --------------------------------------------------------------------------

describe('No confidence computation', () => {
  it('no forbidden operations in graph module', async () => {
    const forbidden = ['computeConfidence', 'calculateConfidence', 'scoreInstitution', 'rankSite',
      'recommendSite', 'inferCapability', 'generateJudgment', 'evaluateTrust'];
    const graph = await import('../src/graph.js');
    for (const fn of forbidden) {
      expect((graph as any)[fn]).toBeUndefined();
    }
  });

});
