// ==========================================================================
// Evidence Relationship (KEMS-001 §2 Component C)
// ==========================================================================

import type { EvidenceRelationship, RelationshipType, ProvenanceMetadata, TemporalMetadata } from './types.js';

/**
 * Create a relationship between two Evidence Nodes.
 */
export function createRelationship(params: {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: RelationshipType;
  provenance: ProvenanceMetadata;
  temporal?: Partial<TemporalMetadata>;
}): EvidenceRelationship {
  const now = new Date().toISOString();
  return {
    id: params.id,
    sourceNodeId: params.sourceNodeId,
    targetNodeId: params.targetNodeId,
    relationshipType: params.relationshipType,
    provenance: params.provenance,
    temporal: {
      createdAt: now,
      updatedAt: now,
      decayPeriodMonths: null,
      ...params.temporal,
    },
  };
}

// --------------------------------------------------------------------------
// Invariants
// --------------------------------------------------------------------------

/**
 * A relationship must not relate a node to itself.
 */
export function validateRelationshipNoSelfReference(rel: EvidenceRelationship): string | null {
  if (rel.sourceNodeId === rel.targetNodeId) {
    return `Relationship "${rel.id}" references the same node (${rel.sourceNodeId}). Self-references are not allowed.`;
  }
  return null;
}
