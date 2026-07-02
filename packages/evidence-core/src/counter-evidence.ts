// ==========================================================================
// Counter Evidence (KEMS-001 §4)
// ==========================================================================

import type { CounterEvidence, EvidenceNode, ProvenanceMetadata, VisibilityMetadata } from './types.js';
import { createEvidenceNode } from './evidence-node.js';
import { EvidenceClass } from './evidence-class.js';

/**
 * Create a Counter Evidence node.
 * Counter Evidence follows the same structure as Evidence Node
 * but is explicitly marked and cannot be deleted.
 */
export function createCounterEvidence(params: {
  id: string;
  claimId: string;
  evidenceClass: EvidenceClass;
  content: string;
  source: string;
  date: string;
  weight: number;
  provenance: ProvenanceMetadata;
  visibility: VisibilityMetadata;
}): CounterEvidence {
  const base = createEvidenceNode({ ...params, weight: -Math.abs(params.weight) });
  return {
    ...base,
    isCounterEvidence: true,
    hasResponse: false,
    responseId: null,
  };
}

/**
 * Link a Right of Response to this Counter Evidence.
 * Returns a new CounterEvidence with updated state.
 * The original Counter Evidence is not modified (immutability).
 */
export function attachResponse(counterEvidence: CounterEvidence, responseId: string): CounterEvidence {
  return {
    ...counterEvidence,
    hasResponse: true,
    responseId,
  };
}

// --------------------------------------------------------------------------
// Invariants
// --------------------------------------------------------------------------

/**
 * Counter Evidence must have negative weight.
 */
export function validateCounterEvidenceWeight(ce: CounterEvidence): string | null {
  if (ce.weight >= 0) {
    return `Counter Evidence "${ce.id}" has non-negative weight. Counter Evidence must carry negative weight.`;
  }
  return null;
}

/**
 * Counter Evidence must not be deleted (enforced structurally — no delete functions).
 */
export function assertCounterEvidenceIsImmutable(_ce: CounterEvidence): void {
  // Immutability is enforced by the absence of delete/update functions.
  // This function exists as a domain-level marker.
}
