// ==========================================================================
// Provenance metadata helpers (KEMS-001 §2 Component B)
// ==========================================================================

import type { ProvenanceMetadata } from './types.js';

/**
 * Create provenance metadata for a new entity.
 */
export function createProvenance(params: {
  actorId: string;
  organizationId: string;
  correlationId: string;
  summary: string;
  sourceEventId?: string;
}): ProvenanceMetadata {
  return {
    createdByActorId: params.actorId,
    createdByOrganizationId: params.organizationId,
    correlationId: params.correlationId,
    summary: params.summary,
    sourceEventId: params.sourceEventId,
  };
}
