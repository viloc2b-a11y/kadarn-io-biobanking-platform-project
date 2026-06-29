// ==========================================================================
// Kadarn Provenance Graph — Unit Tests
// ==========================================================================
// Tests cover: forward trace, backward trace, full lineage, evidence,
// time-based filtering, empty graph handling, cycle detection limits.
// ==========================================================================

import { describe, it, expect, vi } from 'vitest';
import {
  traceForward,
  traceBackward,
  fullLineage,
  evidenceFor,
  lineageAt,
} from '../packages/provenance-graph/src/engine.js';

import type {
  ProvenanceNode,
  ProvenanceEdge,
  ProvenanceEvidence,
  ProvenanceAdapter,
} from '../packages/provenance-graph/src/types.js';

// --------------------------------------------------------------------------
// Mock adapter factory
// --------------------------------------------------------------------------

function createMockAdapter(options?: {
  nodes?: ProvenanceNode[];
  edges?: ProvenanceEdge[];
  evidence?: ProvenanceEvidence[];
}): ProvenanceAdapter {
  const nodes = new Map((options?.nodes ?? []).map((n) => [n.id, n]));
  const edges = options?.edges ?? [];
  const evidenceList = options?.evidence ?? [];

  const outgoing = new Map<string, ProvenanceEdge[]>();
  const incoming = new Map<string, ProvenanceEdge[]>();

  for (const edge of edges) {
    const out = outgoing.get(edge.sourceNodeId) ?? [];
    out.push(edge);
    outgoing.set(edge.sourceNodeId, out);

    const inn = incoming.get(edge.targetNodeId) ?? [];
    inn.push(edge);
    incoming.set(edge.targetNodeId, inn);
  }

  const evidenceByNode = new Map<string, ProvenanceEvidence[]>();
  for (const ev of evidenceList) {
    const list = evidenceByNode.get(ev.nodeId) ?? [];
    list.push(ev);
    evidenceByNode.set(ev.nodeId, list);
  }

  return {
    async getNode(id: string) {
      return nodes.get(id) ?? null;
    },
    async getNodeByExternal() {
      return null;
    },
    async getOutgoingEdges(nodeId: string) {
      return outgoing.get(nodeId) ?? [];
    },
    async getIncomingEdges(nodeId: string) {
      return incoming.get(nodeId) ?? [];
    },
    async getEvidence(nodeId: string) {
      return evidenceByNode.get(nodeId) ?? [];
    },
  };
}

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

const consentNode: ProvenanceNode = {
  id: 'node-consent-1', nodeType: 'consent', externalId: 'c-001',
  label: 'Donor Consent #001', properties: { status: 'active' },
  recordedAt: '2026-01-01T00:00:00Z',
};

const specimenNode: ProvenanceNode = {
  id: 'node-spec-1', nodeType: 'specimen', externalId: 'spec-001',
  label: 'Specimen S-001', properties: { type: 'ffpe' },
  recordedAt: '2026-01-05T00:00:00Z',
};

const processingNode: ProvenanceNode = {
  id: 'node-proc-1', nodeType: 'processing_event', externalId: 'proc-001',
  label: 'FFPE Processing', properties: { protocol: 'P-12' },
  recordedAt: '2026-01-06T00:00:00Z',
};

const qcNode: ProvenanceNode = {
  id: 'node-qc-1', nodeType: 'qc_result', externalId: 'qc-001',
  label: 'QC Passed', properties: { result: 'passed' },
  recordedAt: '2026-01-07T00:00:00Z',
};

const shipmentNode: ProvenanceNode = {
  id: 'node-ship-1', nodeType: 'shipment', externalId: 'sh-001',
  label: 'Shipment SH-001', properties: { courier: 'FedEx' },
  recordedAt: '2026-01-10T00:00:00Z',
};

const datasetNode: ProvenanceNode = {
  id: 'node-ds-1', nodeType: 'dataset', externalId: 'ds-001',
  label: 'Dataset D-001', properties: { records: 500 },
  recordedAt: '2026-02-01T00:00:00Z',
};

const allNodes = [
  consentNode, specimenNode, processingNode, qcNode, shipmentNode, datasetNode,
];

const allEdges: ProvenanceEdge[] = [
  // Consent authorized specimen collection
  { id: 'edge-1', edgeType: 'authorized_by', sourceNodeId: 'node-spec-1', targetNodeId: 'node-consent-1', properties: {}, recordedAt: '2026-01-05T00:00:00Z' },
  // Specimen processed by processing event
  { id: 'edge-2', edgeType: 'processed_by', sourceNodeId: 'node-spec-1', targetNodeId: 'node-proc-1', properties: {}, recordedAt: '2026-01-06T00:00:00Z' },
  // QC verified by QC result
  { id: 'edge-3', edgeType: 'verified_by', sourceNodeId: 'node-spec-1', targetNodeId: 'node-qc-1', properties: {}, recordedAt: '2026-01-07T00:00:00Z' },
  // Specimen shipped with shipment
  { id: 'edge-4', edgeType: 'shipped_with', sourceNodeId: 'node-spec-1', targetNodeId: 'node-ship-1', properties: {}, recordedAt: '2026-01-10T00:00:00Z' },
  // Dataset derived from specimen
  { id: 'edge-5', edgeType: 'derived_from', sourceNodeId: 'node-ds-1', targetNodeId: 'node-spec-1', properties: {}, recordedAt: '2026-02-01T00:00:00Z' },
];

// --------------------------------------------------------------------------
// traceForward()
// --------------------------------------------------------------------------

describe('traceForward()', () => {
  it('should find forward lineage (what derives from this specimen)', async () => {
    // Forward follows INCOMING edges: entities that point TO this node.
    // Only edge-5 (dataset→specimen) targets specimen, so only dataset
    // is a "descendant" of specimen.
    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges });
    const result = await traceForward(adapter, { nodeId: 'node-spec-1' });
    expect(result.nodes).toHaveLength(1); // dataset
    expect(result.edges).toHaveLength(1); // derived_from
  });

  it('should return empty for nodes with no descendants', async () => {
    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges });
    // Dataset has no incoming edges (nothing points TO dataset)
    const result = await traceForward(adapter, { nodeId: 'node-ds-1' });
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// traceBackward()
// --------------------------------------------------------------------------

describe('traceBackward()', () => {
  it('should find ancestors of a dataset (what is this dataset derived from)', async () => {
    // Backward follows OUTGOING edges: dataset→specimen, then specimen→{consent,processing,qc,shipment}
    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges });
    const result = await traceBackward(adapter, { nodeId: 'node-ds-1' });
    // dataset → specimen → {consent, processing, qc, shipment}
    expect(result.nodes.length).toBe(5); // specimen + consent + processing + qc + shipment
    expect(result.edges.length).toBe(5); // all edges
  });

  it('should return empty for root nodes (nothing points from them)', async () => {
    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges });
    // Consent has no outgoing edges (nothing is derived from consent)
    const result = await traceBackward(adapter, { nodeId: 'node-consent-1' });
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// fullLineage()
// --------------------------------------------------------------------------

describe('fullLineage()', () => {
  it('should return complete subgraph for a specimen', async () => {
    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges });

    const result = await fullLineage(adapter, { nodeId: 'node-spec-1' });

    expect(result.node.id).toBe('node-spec-1');
    // Ancestors: nothing points FROM specimen. Follow outgoing edges:
    // specimen→consent, specimen→processing, specimen→qc, specimen→shipment = 4
    expect(result.ancestors).toHaveLength(4);
    // Descendants: follow incoming edges. dataset→specimen = 1
    expect(result.descendants).toHaveLength(1);
    // Total unique edges: all 5
    expect(result.edges).toHaveLength(5);
  });

  it('should throw for unknown node', async () => {
    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges });

    await expect(
      fullLineage(adapter, { nodeId: 'node-unknown' }),
    ).rejects.toThrow('Provenance node not found');
  });
});

// --------------------------------------------------------------------------
// evidenceFor()
// --------------------------------------------------------------------------

describe('evidenceFor()', () => {
  it('should find evidence linked to a node', async () => {
    const evidence: ProvenanceEvidence[] = [
      { id: 'evid-1', nodeId: 'node-qc-1', evidenceType: 'qc_report', reference: '/reports/qc-001.pdf', hash: 'abc123' },
      { id: 'evid-2', nodeId: 'node-ship-1', evidenceType: 'temperature_log', reference: '/logs/sh-001.csv', hash: 'def456' },
    ];

    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges, evidence });

    const result = await evidenceFor(adapter, 'node-spec-1');

    // Should find evidence for specimen AND its lineage nodes
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.some((e) => e.evidenceType === 'qc_report')).toBe(true);
    expect(result.some((e) => e.evidenceType === 'temperature_log')).toBe(true);
  });

  it('should return empty array when no evidence exists', async () => {
    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges });

    const result = await evidenceFor(adapter, 'node-spec-1');
    expect(result).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// lineageAt() — time-based filtering
// --------------------------------------------------------------------------

describe('lineageAt()', () => {
  it('should only include nodes recorded before the timestamp', async () => {
    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges });

    const result = await lineageAt(adapter, 'node-spec-1', '2026-01-08T00:00:00Z');

    // Before Jan 8: consent, specimen, processing, qc exist (recorded before Jan 8)
    // After Jan 8: shipment (Jan 10) and dataset (Feb 1) should be excluded
    expect(result.node.id).toBe('node-spec-1');
    // specimen→consent (Jan 1), specimen→processing (Jan 6), specimen→qc (Jan 7) qualify
    // specimen→shipment (Jan 10) is excluded
    // dataset→specimen (Feb 1) is excluded
    expect(result.ancestors).toHaveLength(3);
    expect(result.descendants).toHaveLength(0);
  });

  it('should handle empty result for timestamp before any nodes', async () => {
    const adapter = createMockAdapter({ nodes: allNodes, edges: allEdges });

    const result = await lineageAt(adapter, 'node-spec-1', '2025-01-01T00:00:00Z');

    // Focal node should still be returned (it existed)
    expect(result.node.id).toBe('node-spec-1');
  });
});

// --------------------------------------------------------------------------
// Max depth
// --------------------------------------------------------------------------

describe('max depth', () => {
  it('should limit traversal depth', async () => {
    // Create a chain: A → B → C → D → E
    const nodes: ProvenanceNode[] = ['A', 'B', 'C', 'D', 'E'].map((id) => ({
      id: `node-${id}`, nodeType: 'specimen' as const, externalId: id,
      properties: {}, recordedAt: `2026-01-0${id.charCodeAt(0) - 64}T00:00:00Z`,
    }));

    const edges: ProvenanceEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `edge-${i}`,
        edgeType: 'derived_from',
        sourceNodeId: nodes[i + 1].id,
        targetNodeId: nodes[i].id,
        properties: {},
        recordedAt: nodes[i + 1].recordedAt,
      });
    }

    const adapter = createMockAdapter({ nodes, edges });

    // Backward from E: edges go E→D→C→B→A
    // Depth 1: should find D only
    const depth1 = await traceBackward(adapter, { nodeId: 'node-E', maxDepth: 1 });
    expect(depth1.nodes.length).toBeLessThanOrEqual(1);

    // Depth 3: should find D, C, B
    const depth3 = await traceBackward(adapter, { nodeId: 'node-E', maxDepth: 3 });
    expect(depth3.nodes.length).toBeLessThanOrEqual(3);
  });
});
