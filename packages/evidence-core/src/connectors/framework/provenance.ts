// ==========================================================================
// Connector Framework — Provenance Builder
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
//
// Standardized provenance construction for all connectors.
// Every EvidenceNode produced by any connector gets the same provenance shape.
// ==========================================================================

export interface ProvenanceInput {
  sourceRecordId: string;
  source: string;
  actorId: string;
  organizationId: string;
  correlationId: string;
  summary: string;
}

export interface BuiltProvenance {
  createdByActorId: string;
  createdByOrganizationId: string;
  correlationId: string;
  summary: string;
}

export function buildProvenance(input: ProvenanceInput): BuiltProvenance {
  return {
    createdByActorId: input.actorId,
    createdByOrganizationId: input.organizationId,
    correlationId: input.correlationId,
    summary: `[${input.source}] ${input.summary.slice(0, 200)}`,
  };
}
