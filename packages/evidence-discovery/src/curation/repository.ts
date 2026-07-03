// ==========================================================================
// Evidence Discovery — Curation Repository
// ==========================================================================
// Sprint 20A.6.
// ==========================================================================

import type { DbClient } from '../repository.js';
import type { CurationEvent, CurationAction, CurationTargetType } from './types';

export interface CreateCurationEventInput {
  targetType: string;
  targetId: string;
  action: string;
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
}

export async function insertCurationEvent(db: DbClient, input: CreateCurationEventInput): Promise<{ id: string }> {
  const { data, error } = await db.from('discovery_curation_events').insert({
    target_type: input.targetType,
    target_id: input.targetId,
    action: input.action,
    actor_id: input.actorId,
    actor_role: input.actorRole,
    reason: input.reason,
    enrichment_payload: input.enrichmentPayload,
    previous_state: input.previousState,
    new_state: input.newState,
    provenance_ref: input.provenanceRef,
    discovery_run_id: input.discoveryRunId,
    artifact_id: input.artifactId,
    layer1_id: input.layer1Id,
    merge_source_ids: input.mergeSourceIds,
    split_child_ids: input.splitChildIds,
  });
  if (error) throw new Error(`Failed to create curation event: ${error}`);
  return data as unknown as { id: string };
}

export async function getCurationEvents(
  db: DbClient,
  targetType: string,
  targetId: string,
): Promise<CurationEvent[]> {
  const { data, error } = await db.from('discovery_curation_events')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId);
  if (error) throw new Error(`Failed to get curation events: ${error}`);
  return (data as unknown as CurationEvent[]) ?? [];
}
