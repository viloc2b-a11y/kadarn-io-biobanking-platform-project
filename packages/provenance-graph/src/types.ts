// ==========================================================================
// Kadarn Provenance Graph — Type Definitions
// ==========================================================================
// ADR-014: Provenance Graph — Cross-Entity Lineage
// KRM-RAO §2.6 (Provenance), §4.2 (Provenance Graph)
// ==========================================================================

export type ProvenanceNodeType =
  | 'specimen' | 'aliquot' | 'consent' | 'protocol'
  | 'processing_event' | 'qc_result' | 'shipment'
  | 'temperature_log' | 'receipt' | 'dataset' | 'document'
  | 'organization' | 'program' | 'access_request' | 'policy_evaluation';

export type ProvenanceEdgeType =
  | 'derived_from' | 'authorized_by' | 'processed_by'
  | 'verified_by' | 'shipped_with' | 'linked_to'
  | 'generated_from' | 'requested_by' | 'approved_by' | 'owned_by';

// --------------------------------------------------------------------------
// Node
// --------------------------------------------------------------------------

export interface ProvenanceNode {
  id: string;
  nodeType: ProvenanceNodeType;
  externalId: string;
  label?: string;
  properties: Record<string, unknown>;
  organizationId?: string;
  recordedAt: string;
}

// --------------------------------------------------------------------------
// Edge
// --------------------------------------------------------------------------

export interface ProvenanceEdge {
  id: string;
  edgeType: ProvenanceEdgeType;
  sourceNodeId: string;
  targetNodeId: string;
  properties: Record<string, unknown>;
  recordedAt: string;

  // Resolved nodes (populated on query)
  sourceNode?: ProvenanceNode;
  targetNode?: ProvenanceNode;
}

// --------------------------------------------------------------------------
// Evidence
// --------------------------------------------------------------------------

export interface ProvenanceEvidence {
  id: string;
  nodeId: string;
  evidenceType: string;
  reference: string;
  hash?: string;
  description?: string;
}

// --------------------------------------------------------------------------
// Lineage result
// --------------------------------------------------------------------------

export interface LineageResult {
  /** The focal node */
  node: ProvenanceNode;
  /** All ancestor nodes (backward trace) */
  ancestors: ProvenanceNode[];
  /** All descendant nodes (forward trace) */
  descendants: ProvenanceNode[];
  /** Edges connecting all nodes in the lineage */
  edges: ProvenanceEdge[];
  /** Evidence linked to any node in the lineage */
  evidence: ProvenanceEvidence[];
}

// --------------------------------------------------------------------------
// Graph adapter interface
// --------------------------------------------------------------------------

export interface ProvenanceAdapter {
  getNode(id: string): Promise<ProvenanceNode | null>;
  getNodeByExternal(nodeType: ProvenanceNodeType, externalId: string): Promise<ProvenanceNode | null>;
  getOutgoingEdges(nodeId: string): Promise<ProvenanceEdge[]>;
  getIncomingEdges(nodeId: string): Promise<ProvenanceEdge[]>;
  getEvidence(nodeId: string): Promise<ProvenanceEvidence[]>;
}

// --------------------------------------------------------------------------
// Query input
// --------------------------------------------------------------------------

export interface TraceQuery {
  nodeId: string;
  maxDepth?: number; // default: 10
}
