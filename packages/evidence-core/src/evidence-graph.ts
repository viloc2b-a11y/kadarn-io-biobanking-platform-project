// ==========================================================================
// Evidence Graph — Domain structure (KEMS-001 §2)
// ==========================================================================
// The Evidence Graph is the complete set of Claims, Evidence Nodes,
// and Relationships. Defined as a domain structure only.
// No traversal or computation logic — see Provenance Engine for that.
// ==========================================================================

import type { Claim } from './types.js';
import type { EvidenceNode } from './types.js';
import type { EvidenceRelationship } from './types.js';
import type { CounterEvidence } from './types.js';
import type { RightOfResponse } from './types.js';

/**
 * The complete Evidence Graph for a set of Claims.
 * Per KEMS-001 §2: Claims + Evidence Nodes + Relationships + Confidence State.
 *
 * Confidence State is not included here — it is computed by an Engine.
 * This structure represents the raw data, not the computed output.
 */
export interface EvidenceGraph {
  /** Claims in this graph */
  claims: Claim[];
  /** All Evidence Nodes (including Counter Evidence) */
  evidenceNodes: EvidenceNode[];
  /** Relationships between nodes */
  relationships: EvidenceRelationship[];
  /** Counter Evidence nodes */
  counterEvidence: CounterEvidence[];
  /** Rights of Response */
  rightsOfResponse: RightOfResponse[];
}

/**
 * Create an empty Evidence Graph.
 */
export function createEmptyGraph(): EvidenceGraph {
  return {
    claims: [],
    evidenceNodes: [],
    relationships: [],
    counterEvidence: [],
    rightsOfResponse: [],
  };
}
