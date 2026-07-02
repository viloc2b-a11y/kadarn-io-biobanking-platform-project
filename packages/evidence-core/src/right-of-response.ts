// ==========================================================================
// Right of Response (KEMS-001 §8)
// ==========================================================================

import type { RightOfResponse, ProvenanceMetadata, VisibilityMetadata, TemporalMetadata } from './types.js';

/**
 * Create a Right of Response attached to a Counter Evidence node.
 * Does not modify the Counter Evidence.
 */
export function createRightOfResponse(params: {
  id: string;
  counterEvidenceId: string;
  description: string;
  resolutionDate: string;
  supportingEvidenceIds?: string[];
  provenance: ProvenanceMetadata;
  visibility: VisibilityMetadata;
}): RightOfResponse {
  const now = new Date().toISOString();
  return {
    id: params.id,
    counterEvidenceId: params.counterEvidenceId,
    description: params.description,
    resolutionDate: params.resolutionDate,
    status: 'submitted',
    supportingEvidenceIds: params.supportingEvidenceIds ?? [],
    provenance: params.provenance,
    visibility: params.visibility,
    temporal: {
      createdAt: now,
      updatedAt: now,
      decayPeriodMonths: null,
    },
  };
}

// --------------------------------------------------------------------------
// Invariants
// --------------------------------------------------------------------------

/**
 * A Right of Response must reference a Counter Evidence node.
 */
export function validateResponseHasCounterEvidence(response: RightOfResponse): string | null {
  if (!response.counterEvidenceId) {
    return 'Right of Response must reference a Counter Evidence node.';
  }
  return null;
}
