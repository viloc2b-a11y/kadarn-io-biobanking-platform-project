// ==========================================================================
// Kadarn Provenance Graph — Query Engine
// ==========================================================================
// Traversal logic for forward/backward lineage, evidence chains, and
// subgraph reconstruction.
//
// Edge direction semantics:
//   Edge direction: child → parent (e.g., dataset → specimen for "derived_from")
//   traceForward:  "what derives from this?" → follow INCOMING edges
//   traceBackward: "what is this derived from?" → follow OUTGOING edges
// ==========================================================================

import type {
  ProvenanceNode,
  ProvenanceEdge,
  ProvenanceEvidence,
  LineageResult,
  ProvenanceAdapter,
  TraceQuery,
} from './types.js';

// --------------------------------------------------------------------------
// bfsTraverse — shared BFS traversal for provenance graph
// --------------------------------------------------------------------------
// Generic BFS that accepts an edge-fetching callback and a node selector
// to handle both forward and backward traversal with a single implementation.
// --------------------------------------------------------------------------

type BfsEdgeFetcher = (nodeId: string) => Promise<ProvenanceEdge[]>;
type BfsNodeSelector = (edge: ProvenanceEdge) => { nodeId: string; node: ProvenanceNode | undefined };

async function bfsTraverse(
  adapter: ProvenanceAdapter,
  query: TraceQuery,
  getEdges: BfsEdgeFetcher,
  selectNode: BfsNodeSelector,
): Promise<{ nodes: ProvenanceNode[]; edges: ProvenanceEdge[] }> {
  const visited = new Set<string>();
  const nodes: ProvenanceNode[] = [];
  const edges: ProvenanceEdge[] = [];
  const queue: Array<{ nodeId: string; depth: number }> = [
    { nodeId: query.nodeId, depth: 0 },
  ];

  const maxDepth = query.maxDepth ?? 10;

  while (queue.length > 0) {
    const entry = queue.shift() as { nodeId: string; depth: number };
    const { nodeId, depth } = entry;
    if (visited.has(nodeId)) continue;
    if (depth >= maxDepth) continue;
    visited.add(nodeId);

    const fetchedEdges = await getEdges(nodeId);
    for (const edge of fetchedEdges) {
      edges.push(edge);
      const { nodeId: adjacentId, node: adjacentNode } = selectNode(edge);
      if (!visited.has(adjacentId)) {
        const resolvedNode = adjacentNode ?? (await adapter.getNode(adjacentId));
        if (resolvedNode) {
          nodes.push(resolvedNode);
          queue.push({ nodeId: adjacentId, depth: depth + 1 });
        }
      }
    }
  }

  return { nodes, edges };
}

// --------------------------------------------------------------------------
// traceForward — find all descendants (what derives from this node)
// --------------------------------------------------------------------------
// Follow INCOMING edges: entities that point TO this node.
// If dataset → specimen (derived_from), then from specimen we follow
// incoming edges to find dataset.
// --------------------------------------------------------------------------

export function traceForward(
  adapter: ProvenanceAdapter,
  query: TraceQuery,
): Promise<{ nodes: ProvenanceNode[]; edges: ProvenanceEdge[] }> {
  return bfsTraverse(
    adapter,
    query,
    (nodeId) => adapter.getIncomingEdges(nodeId),
    (edge) => ({ nodeId: edge.sourceNodeId, node: edge.sourceNode }),
  );
}

// --------------------------------------------------------------------------
// traceBackward — find all ancestors (what this node is derived from)
// --------------------------------------------------------------------------
// Follow OUTGOING edges: entities this node points TO.
// If dataset → specimen (derived_from), then from dataset we follow
// outgoing edges to find specimen.
// --------------------------------------------------------------------------

export function traceBackward(
  adapter: ProvenanceAdapter,
  query: TraceQuery,
): Promise<{ nodes: ProvenanceNode[]; edges: ProvenanceEdge[] }> {
  return bfsTraverse(
    adapter,
    query,
    (nodeId) => adapter.getOutgoingEdges(nodeId),
    (edge) => ({ nodeId: edge.targetNodeId, node: edge.targetNode }),
  );
}

// --------------------------------------------------------------------------
// fullLineage — get complete subgraph (ancestors + descendants)
// --------------------------------------------------------------------------

export async function fullLineage(
  adapter: ProvenanceAdapter,
  query: TraceQuery,
): Promise<LineageResult> {
  const focalNode = await adapter.getNode(query.nodeId);
  if (!focalNode) {
    throw new Error(`Provenance node not found: ${query.nodeId}`);
  }

  const [forward, backward] = await Promise.all([
    traceForward(adapter, query),
    traceBackward(adapter, query),
  ]);

  const edgeMap = new Map<string, ProvenanceEdge>();
  for (const edge of [...forward.edges, ...backward.edges]) {
    edgeMap.set(edge.id, edge);
  }

  const nodeMap = new Map<string, ProvenanceNode>();
  for (const node of [...forward.nodes, ...backward.nodes]) {
    nodeMap.set(node.id, node);
  }

  const allNodeIds = [query.nodeId, ...nodeMap.keys()];
  const evidenceResults = await Promise.all(
    allNodeIds.map((nid) => adapter.getEvidence(nid)),
  );
  const evidence = evidenceResults.flat();

  return {
    node: focalNode,
    ancestors: backward.nodes,
    descendants: forward.nodes,
    edges: Array.from(edgeMap.values()),
    evidence,
  };
}

// --------------------------------------------------------------------------
// evidenceFor — get all evidence linked to a node and its lineage
// --------------------------------------------------------------------------

export async function evidenceFor(
  adapter: ProvenanceAdapter,
  nodeId: string,
): Promise<ProvenanceEvidence[]> {
  const lineage = await fullLineage(adapter, { nodeId });
  return lineage.evidence;
}

// --------------------------------------------------------------------------
// lineageAt — get lineage as it existed at a point in time
// --------------------------------------------------------------------------

export async function lineageAt(
  adapter: ProvenanceAdapter,
  nodeId: string,
  timestamp: string,
): Promise<LineageResult> {
  const result = await fullLineage(adapter, { nodeId });

  const filteredAncestors = result.ancestors.filter(
    (n) => n.recordedAt <= timestamp,
  );
  const filteredDescendants = result.descendants.filter(
    (n) => n.recordedAt <= timestamp,
  );

  const allFiltered = [result.node, ...filteredAncestors, ...filteredDescendants];
  const filteredIds = new Set(allFiltered.map((n) => n.id));

  return {
    node: result.node,
    ancestors: filteredAncestors,
    descendants: filteredDescendants,
    edges: result.edges.filter(
      (e) => filteredIds.has(e.sourceNodeId) && filteredIds.has(e.targetNodeId),
    ),
    evidence: result.evidence,
  };
}
