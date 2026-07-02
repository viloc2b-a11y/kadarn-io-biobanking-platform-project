// ==========================================================================
// Evidence Core — Graph Traversal Services
// ==========================================================================
// Baseline AF-1.0. Sprint 18.2.
//
// Deterministic, read-only traversal of the Evidence Graph.
// No confidence computation. No interpretation. No AI.
//
// Every traversal service returns stored data as-is.
// The graph is navigable but never modified.
// ==========================================================================

import type { Claim, EvidenceNode, EvidenceRelationship, CounterEvidence, RightOfResponse } from './types.js';

// --------------------------------------------------------------------------
// Graph data structures
// --------------------------------------------------------------------------

export type GraphNodeType = 'claim' | 'evidence_node' | 'counter_evidence' | 'right_of_response';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  data: Claim | EvidenceNode | CounterEvidence | RightOfResponse;
  createdAt: string;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  label: string;
}

export interface GraphStore {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

export function createGraphStore(): GraphStore {
  return { nodes: new Map(), edges: new Map() };
}

export function addNode(store: GraphStore, node: GraphNode): void {
  store.nodes.set(node.id, node);
}

export function addEdge(store: GraphStore, edge: GraphEdge): void {
  store.edges.set(edge.id, edge);
}

// --------------------------------------------------------------------------
// Graph building helpers
// --------------------------------------------------------------------------

export function buildGraphFromData(params: {
  claims?: Claim[];
  evidenceNodes?: EvidenceNode[];
  relationships?: EvidenceRelationship[];
  counterEvidence?: CounterEvidence[];
  responses?: RightOfResponse[];
}): GraphStore {
  const store = createGraphStore();

  // Add claims
  for (const claim of params.claims ?? []) {
    addNode(store, {
      id: claim.id,
      type: 'claim',
      label: claim.name,
      data: claim,
      createdAt: claim.temporal.createdAt,
    });
  }

  // Add evidence nodes
  for (const node of params.evidenceNodes ?? []) {
    addNode(store, {
      id: node.id,
      type: (node as any).isCounterEvidence ? 'counter_evidence' : 'evidence_node',
      label: node.content.slice(0, 80),
      data: node,
      createdAt: node.temporal.createdAt,
    });
    // Link evidence node to its claim
    addEdge(store, {
      id: `edge-ev-${node.id}-${node.claimId}`,
      sourceId: node.id,
      targetId: node.claimId,
      type: 'belongs_to',
      label: 'Evidence Node → Claim',
    });
  }

  // Add relationships
  for (const rel of params.relationships ?? []) {
    addEdge(store, {
      id: rel.id,
      sourceId: rel.sourceNodeId,
      targetId: rel.targetNodeId,
      type: rel.relationshipType ?? 'supports',
      label: `Relationship: ${rel.relationshipType}`,
    });
  }

  // Add counter evidence links
  for (const ce of params.counterEvidence ?? []) {
    if (ce.responseId) {
      addEdge(store, {
        id: `edge-ce-${ce.id}-${ce.responseId}`,
        sourceId: ce.id,
        targetId: ce.responseId,
        type: 'has_response',
        label: 'Counter Evidence → Right of Response',
      });
    }
  }

  // Add response nodes
  for (const ror of params.responses ?? []) {
    addNode(store, {
      id: ror.id,
      type: 'right_of_response',
      label: ror.description.slice(0, 80),
      data: ror,
      createdAt: ror.temporal.createdAt,
    });
  }

  // Add response links
  for (const ror of params.responses ?? []) {
    addEdge(store, {
      id: `edge-ror-${ror.id}-${ror.counterEvidenceId}`,
      sourceId: ror.id,
      targetId: ror.counterEvidenceId,
      type: 'responds_to',
      label: 'Right of Response → Counter Evidence',
    });
  }

  return store;
}

// --------------------------------------------------------------------------
// Traversal: Claim → Evidence
// --------------------------------------------------------------------------

export function getEvidenceGraph(store: GraphStore, claimId: string): {
  claim: GraphNode | undefined;
  evidenceNodes: GraphNode[];
  relationships: GraphEdge[];
  counterEvidence: GraphNode[];
  responses: GraphNode[];
} {
  const claim = store.nodes.get(claimId);

  // Find all evidence nodes linked to this claim via 'belongs_to' edges
  const evidenceIds = new Set<string>();
  const evidenceNodes: GraphNode[] = [];
  const counterEvidence: GraphNode[] = [];
  for (const edge of store.edges.values()) {
    if (edge.type === 'belongs_to' && edge.targetId === claimId) {
      evidenceIds.add(edge.sourceId);
      const node = store.nodes.get(edge.sourceId);
      if (node) {
        if (node.type === 'counter_evidence') {
          counterEvidence.push(node);
        } else {
          evidenceNodes.push(node);
        }
      }
    }
  }

  // Find all relationships involving these evidence nodes
  const relationships: GraphEdge[] = [];
  for (const edge of store.edges.values()) {
    if (edge.type !== 'belongs_to' && edge.type !== 'has_response' && edge.type !== 'responds_to') {
      if (evidenceIds.has(edge.sourceId) || evidenceIds.has(edge.targetId)) {
        relationships.push(edge);
      }
    }
  }

  // Find responses linked to counter evidence
  const responses: GraphNode[] = [];
  for (const ceNode of counterEvidence) {
    const ceData = ceNode.data as CounterEvidence;
    if (ceData.responseId) {
      const rorNode = store.nodes.get(ceData.responseId);
      if (rorNode) responses.push(rorNode);
    }
  }

  return { claim, evidenceNodes, relationships, counterEvidence, responses };
}

// --------------------------------------------------------------------------
// Traversal: Evidence by relationship type
// --------------------------------------------------------------------------

function getEvidenceByRelationship(store: GraphStore, claimId: string, relationshipType: string): GraphNode[] {
  const claimEvidence = getEvidenceGraph(store, claimId);
  const relatedNodeIds = new Set<string>();

  for (const rel of claimEvidence.relationships) {
    if (rel.type === relationshipType) {
      relatedNodeIds.add(rel.sourceId);
      relatedNodeIds.add(rel.targetId);
    }
  }

  return [...(store.nodes.values())].filter(n =>
    relatedNodeIds.has(n.id) &&
    (n.type === 'evidence_node' || n.type === 'counter_evidence'),
  );
}

export function getSupportingEvidence(store: GraphStore, claimId: string): GraphNode[] {
  return getEvidenceByRelationship(store, claimId, 'supports');
}

export function getContradictingEvidence(store: GraphStore, claimId: string): GraphNode[] {
  return getEvidenceByRelationship(store, claimId, 'contradicts');
}

// --------------------------------------------------------------------------
// Traversal: Claim evidence (all)
// --------------------------------------------------------------------------

export function getClaimEvidence(store: GraphStore, claimId: string): GraphNode[] {
  const graph = getEvidenceGraph(store, claimId);
  return [...graph.evidenceNodes, ...graph.counterEvidence];
}

// --------------------------------------------------------------------------
// Traversal: Response chain
// --------------------------------------------------------------------------

export function getResponseChain(store: GraphStore, nodeId: string): {
  counterEvidence: GraphNode | undefined;
  responses: GraphNode[];
} {
  const node = store.nodes.get(nodeId);
  if (!node) return { counterEvidence: undefined, responses: [] };

  const responses: GraphNode[] = [];

  // If this is a counter evidence node, find its responses
  if (node.type === 'counter_evidence') {
    const ceData = node.data as CounterEvidence;
    if (ceData.responseId) {
      const rorNode = store.nodes.get(ceData.responseId);
      if (rorNode) responses.push(rorNode);
    }
  }

  // If this is a right of response, find its counter evidence
  if (node.type === 'right_of_response') {
    const rorData = node.data as RightOfResponse;
    const ceNode = store.nodes.get(rorData.counterEvidenceId);
    return { counterEvidence: ceNode, responses: [] };
  }

  return { counterEvidence: node.type === 'counter_evidence' ? node : undefined, responses };
}

// --------------------------------------------------------------------------
// Traversal: Lineage
// --------------------------------------------------------------------------

export interface LineageEntry {
  nodeId: string;
  nodeType: GraphNodeType;
  label: string;
  createdByActorId: string;
  createdAt: string;
}

export function getEvidenceLineage(store: GraphStore, nodeId: string): LineageEntry[] {
  const node = store.nodes.get(nodeId);
  if (!node) return [];

  const entry: LineageEntry = {
    nodeId: node.id,
    nodeType: node.type,
    label: node.label,
    createdByActorId: '',
    createdAt: node.createdAt,
  };

  // Extract provenance from node data
  const data = node.data as any;
  if (data.provenance?.createdByActorId) {
    entry.createdByActorId = data.provenance.createdByActorId;
  } else if (data.provenance_summary) {
    entry.createdByActorId = data.created_by_actor_id ?? '';
  }

  // Trace backward through provenance chain
  const chain: LineageEntry[] = [entry];
  const visited = new Set<string>([nodeId]);

  let currentId = nodeId;
  let maxDepth = 20;

  while (maxDepth > 0) {
    maxDepth--;
    const currentNode = store.nodes.get(currentId);
    if (!currentNode) break;

    // Find the parent via belongs_to or responds_to edges
    let parentId: string | undefined;
    for (const edge of store.edges.values()) {
      if (edge.sourceId === currentId && (edge.type === 'belongs_to' || edge.type === 'responds_to')) {
        parentId = edge.targetId;
        break;
      }
    }

    if (!parentId || visited.has(parentId)) break;
    visited.add(parentId);

    const parentNode = store.nodes.get(parentId);
    if (!parentNode) break;

    const parentEntry: LineageEntry = {
      nodeId: parentNode.id,
      nodeType: parentNode.type,
      label: parentNode.label,
      createdByActorId: '',
      createdAt: parentNode.createdAt,
    };

    const parentData = parentNode.data as any;
    if (parentData.provenance?.createdByActorId) {
      parentEntry.createdByActorId = parentData.provenance.createdByActorId;
    }

    chain.push(parentEntry);
    currentId = parentId;
  }

  return chain;
}

// --------------------------------------------------------------------------
// Traversal: Temporal history
// --------------------------------------------------------------------------

export function getTemporalHistory(store: GraphStore, claimId: string): GraphNode[] {
  const evidence = getClaimEvidence(store, claimId);
  return evidence.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// --------------------------------------------------------------------------
// Traversal: Relationship graph
// --------------------------------------------------------------------------

export function getRelationshipGraph(store: GraphStore, nodeIds: string[]): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [];
  const nodeSet = new Set(nodeIds);
  const edges: GraphEdge[] = [];

  for (const id of nodeIds) {
    const node = store.nodes.get(id);
    if (node) nodes.push(node);
  }

  for (const edge of store.edges.values()) {
    if (nodeSet.has(edge.sourceId) || nodeSet.has(edge.targetId)) {
      if (edge.type !== 'belongs_to') {
        edges.push(edge);
      }
    }
  }

  return { nodes, edges };
}

// --------------------------------------------------------------------------
// Integrity: Find disconnected nodes (orphans)
// --------------------------------------------------------------------------

export function findDisconnectedNodes(store: GraphStore): GraphNode[] {
  const connectedIds = new Set<string>();

  for (const edge of store.edges.values()) {
    connectedIds.add(edge.sourceId);
    connectedIds.add(edge.targetId);
  }

  const disconnected: GraphNode[] = [];
  for (const node of store.nodes.values()) {
    if (!connectedIds.has(node.id)) {
      disconnected.push(node);
    }
  }

  return disconnected;
}

// --------------------------------------------------------------------------
// Integrity: Cycle detection
// --------------------------------------------------------------------------

export function findCycles(store: GraphStore): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const edge of store.edges.values()) {
    if (!adjacency.has(edge.sourceId)) adjacency.set(edge.sourceId, []);
    adjacency.get(edge.sourceId)!.push(edge.targetId);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];
  let path: string[] = [];

  function dfs(nodeId: string) {
    if (inStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      if (cycleStart >= 0) {
        cycles.push(path.slice(cycleStart).concat(nodeId));
      }
      return;
    }
    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      dfs(neighbor);
    }

    path.pop();
    inStack.delete(nodeId);
  }

  for (const nodeId of store.nodes.keys()) {
    if (!visited.has(nodeId)) {
      path = [];
      dfs(nodeId);
    }
  }

  return cycles;
}

// --------------------------------------------------------------------------
// Integrity: Broken reference detection
// --------------------------------------------------------------------------

export function findBrokenReferences(store: GraphStore): { edgeId: string; sourceId: string; targetId: string; reason: string }[] {
  const broken: { edgeId: string; sourceId: string; targetId: string; reason: string }[] = [];

  for (const edge of store.edges.values()) {
    if (!store.nodes.has(edge.sourceId)) {
      broken.push({ edgeId: edge.id, sourceId: edge.sourceId, targetId: edge.targetId, reason: `Source node ${edge.sourceId} not found` });
    }
    if (!store.nodes.has(edge.targetId)) {
      broken.push({ edgeId: edge.id, sourceId: edge.sourceId, targetId: edge.targetId, reason: `Target node ${edge.targetId} not found` });
    }
  }

  return broken;
}

// --------------------------------------------------------------------------
// Integrity: Full graph validation
// --------------------------------------------------------------------------

export interface GraphIntegrityReport {
  valid: boolean;
  nodeCount: number;
  edgeCount: number;
  cycles: string[][];
  disconnectedNodes: GraphNode[];
  brokenReferences: { edgeId: string; sourceId: string; targetId: string; reason: string }[];
}

export function validateGraphIntegrity(store: GraphStore): GraphIntegrityReport {
  const cycles = findCycles(store);
  const disconnectedNodes = findDisconnectedNodes(store);
  const brokenReferences = findBrokenReferences(store);

  return {
    valid: cycles.length === 0 && disconnectedNodes.length === 0 && brokenReferences.length === 0,
    nodeCount: store.nodes.size,
    edgeCount: store.edges.size,
    cycles,
    disconnectedNodes,
    brokenReferences,
  };
}
