// ==========================================================================
// Evidence Discovery — Curation Domain Types
// ==========================================================================
// Sprint 20A.6.
//
// Curation is NOT promotion. Curation does NOT write to Evidence Core.
// Every curation action creates an immutable provenance event.
// ==========================================================================

export type CurationAction =
  | 'ACCEPT'
  | 'REJECT'
  | 'ENRICH'
  | 'DEFER'
  | 'NEEDS_MORE_EVIDENCE'
  | 'MERGE'
  | 'SPLIT'
  | 'ARCHIVE';

export type CurationTargetType =
  | 'EVIDENCE_CANDIDATE'
  | 'CLASSIFICATION'
  | 'ENTITY'
  | 'RELATIONSHIP'
  | 'SNAPSHOT_ITEM';

export const ALL_CURATION_ACTIONS: CurationAction[] = [
  'ACCEPT', 'REJECT', 'ENRICH', 'DEFER',
  'NEEDS_MORE_EVIDENCE', 'MERGE', 'SPLIT', 'ARCHIVE',
];

// --------------------------------------------------------------------------
// CurationEvent — immutable record of a curation action
// --------------------------------------------------------------------------

export interface CurationEvent {
  id?: string;
  targetType: CurationTargetType;
  targetId: string;
  action: CurationAction;
  actorId: string;
  actorRole: string;
  reason: string | null;
  enrichmentPayload: Record<string, unknown> | null;
  previousState: string | null;
  newState: string | null;
  provenanceRef: string;
  discoveryRunId: string;
  artifactId: string | null;
  layer1Id: string | null;
  mergeSourceIds: string[] | null;
  splitChildIds: string[] | null;
  createdAt?: string;
}

// --------------------------------------------------------------------------
// Curation request
// --------------------------------------------------------------------------

export interface CurationRequest {
  targetType: CurationTargetType;
  targetId: string;
  action: CurationAction;
  actorId: string;
  actorRole?: string;
  reason?: string;
  enrichmentPayload?: Record<string, unknown>;
  mergeSourceIds?: string[];
  splitChildPayloads?: Record<string, unknown>[];
}

// --------------------------------------------------------------------------
// Curation errors
// --------------------------------------------------------------------------

export class CurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CurationError';
  }
}
