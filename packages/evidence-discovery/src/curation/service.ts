// ==========================================================================
// Evidence Discovery — Curation Service
// ==========================================================================
// Sprint 20A.6.
//
// Curation is NOT promotion. Curation does NOT write to Evidence Core.
// Every curation action creates an immutable provenance event.
// Human curation is first-class provenance.
// ==========================================================================

import type { CurationRequest, CurationEvent, CurationAction } from './types';
import { CurationError, ALL_CURATION_ACTIONS } from './types';
import type { DbClient } from '../repository.js';
import { insertCurationEvent } from './repository';
import crypto from 'node:crypto';

// --------------------------------------------------------------------------
// Target state machine (state before → allowed curation actions)
// --------------------------------------------------------------------------

const ALLOWED_CURATION_TRANSITIONS: Record<string, CurationAction[]> = {
  PROPOSED: ['ACCEPT', 'REJECT', 'DEFER', 'ARCHIVE'],
  ACCEPTED: ['ENRICH', 'DEFER', 'ARCHIVE'],
  REJECTED: ['ARCHIVE'],
  DEFERRED: ['ACCEPT', 'REJECT', 'ARCHIVE'],
  ENRICHED: ['ACCEPT', 'DEFER', 'ARCHIVE'],
  NEEDS_MORE_EVIDENCE: ['DEFER', 'ARCHIVE'],
};

// --------------------------------------------------------------------------
// Curation Service
// --------------------------------------------------------------------------

export class CurationService {
  constructor(private db: DbClient) {}

  /**
   * Execute a curation action.
   * Creates an immutable provenance event.
   * Does NOT write to Evidence Core.
   */
  async curate(request: CurationRequest): Promise<CurationEvent> {
    this.validateRequest(request);

    // Generate event
    const now = new Date().toISOString();
    const event: CurationEvent = {
      targetType: request.targetType,
      targetId: request.targetId,
      action: request.action,
      actorId: request.actorId,
      actorRole: request.actorRole ?? 'reviewer',
      reason: request.reason ?? null,
      enrichmentPayload: request.enrichmentPayload ?? null,
      previousState: null,
      newState: this.mapActionToNewState(request.action),
      provenanceRef: `curation-${crypto.randomUUID()}`,
      discoveryRunId: '',
      artifactId: null,
      layer1Id: null,
      mergeSourceIds: request.mergeSourceIds ?? null,
      splitChildIds: null,
    };

    // Persist
    const record = await insertCurationEvent(this.db, {
      targetType: event.targetType,
      targetId: event.targetId,
      action: event.action,
      actorId: event.actorId,
      actorRole: event.actorRole,
      reason: event.reason,
      enrichmentPayload: event.enrichmentPayload,
      previousState: event.previousState,
      newState: event.newState,
      provenanceRef: event.provenanceRef,
      discoveryRunId: event.discoveryRunId,
      artifactId: event.artifactId,
      layer1Id: event.layer1Id,
      mergeSourceIds: event.mergeSourceIds,
      splitChildIds: event.splitChildIds,
    });

    return { ...event, id: record.id, createdAt: now };
  }

  /**
   * Validate a curation request before execution.
   */
  private validateRequest(request: CurationRequest): void {
    // Actor required
    if (!request.actorId) {
      throw new CurationError('actorId is required for curation actions.');
    }

    // Target required
    if (!request.targetId) {
      throw new CurationError('targetId is required for curation actions.');
    }

    // Action must be valid
    if (!ALL_CURATION_ACTIONS.includes(request.action)) {
      throw new CurationError(`Invalid curation action: ${request.action}. Allowed: ${ALL_CURATION_ACTIONS.join(', ')}`);
    }

    // Enrich requires payload
    if (request.action === 'ENRICH' && (!request.enrichmentPayload || Object.keys(request.enrichmentPayload).length === 0)) {
      throw new CurationError('ENRICH action requires a non-empty enrichmentPayload.');
    }

    // Merge requires source IDs
    if (request.action === 'MERGE' && (!request.mergeSourceIds || request.mergeSourceIds.length < 1)) {
      throw new CurationError('MERGE action requires at least one mergeSourceId.');
    }

    // Split requires child payloads
    if (request.action === 'SPLIT' && (!request.splitChildPayloads || request.splitChildPayloads.length < 1)) {
      throw new CurationError('SPLIT action requires at least one splitChildPayload.');
    }
  }

  /**
   * Map a curation action to a target's new state.
   */
  private mapActionToNewState(action: CurationAction): string {
    switch (action) {
      case 'ACCEPT': return 'ACCEPTED';
      case 'REJECT': return 'REJECTED';
      case 'ENRICH': return 'ENRICHED';
      case 'DEFER': return 'DEFERRED';
      case 'NEEDS_MORE_EVIDENCE': return 'NEEDS_MORE_EVIDENCE';
      case 'MERGE': return 'MERGED';
      case 'SPLIT': return 'SPLIT';
      case 'ARCHIVE': return 'ARCHIVED';
    }
  }
}
