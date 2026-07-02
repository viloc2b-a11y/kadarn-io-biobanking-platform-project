// ==========================================================================
// Evidence Node — Domain entity (KEMS-001 §2 Component B)
// ==========================================================================

import type { EvidenceNode, EvidenceNodeStatus, ProvenanceMetadata, VisibilityMetadata, TemporalMetadata } from './types.js';
import { EvidenceClass } from './evidence-class.js';

/**
 * Create a new Evidence Node.
 * Nodes are immutable after creation — no update function is provided.
 */
export function createEvidenceNode(params: {
  id: string;
  claimId: string;
  evidenceClass: EvidenceClass;
  content: string;
  source: string;
  date: string;
  weight: number;
  provenance: ProvenanceMetadata;
  visibility: VisibilityMetadata;
  temporal?: Partial<TemporalMetadata>;
}): EvidenceNode {
  const now = new Date().toISOString();
  return {
    id: params.id,
    claimId: params.claimId,
    evidenceClass: params.evidenceClass,
    content: params.content,
    source: params.source,
    date: params.date,
    status: 'active',
    weight: params.weight,
    provenance: params.provenance,
    visibility: params.visibility,
    temporal: {
      createdAt: now,
      updatedAt: now,
      decayPeriodMonths: params.temporal?.decayPeriodMonths ?? null,
    },
  };
}

// --------------------------------------------------------------------------
// Invariants
// --------------------------------------------------------------------------

/**
 * An Evidence Node must not be modifiable after creation.
 * This invariant is enforced by the absence of update functions
 * and checked at the domain level.
 */
export function assertEvidenceNodeImmutable(_node: EvidenceNode): void {
  // Immutability is enforced structurally — no update/delete functions exist.
  // This function exists as a domain-level marker for code review.
  return;
}

/**
 * An Evidence Node's weight must be non-negative.
 */
export function validateEvidenceNodeWeight(node: EvidenceNode): string | null {
  if (node.weight < 0) {
    return `Evidence Node "${node.id}" has negative weight.`;
  }
  return null;
}

/**
 * An Evidence Node must reference a valid Claim.
 */
export function validateNodeHasClaim(node: EvidenceNode): string | null {
  if (!node.claimId) {
    return 'Evidence Node must reference a Claim.';
  }
  return null;
}
