// ==========================================================================
// Evidence Discovery — Semantic Extraction Request Repository
// ==========================================================================
// Sprint 20A.3B.
//
// Persists and manages SemanticExtractionRequest lifecycle.
// No AI agents. No Evidence Core writes.
// ==========================================================================

import type { DbClient } from '../repository.js';
import type { SemanticExtractionRequest, SemanticRequestType, SemanticRequestStatus } from './types.js';

export interface CreateRequestRecord {
  requestId: string;
  discoveryRunId: string;
  artifactId: string;
  layer1Id: string;
  requestType: string;
  status: string;
  priority: string;
  pipelineVersion: string;
  inputHash: string;
  createdAt: string;
}

export async function insertRequest(db: DbClient, input: CreateRequestRecord): Promise<void> {
  const { error } = await db.from('discovery_preparation_requests').insert({
    request_id: input.requestId,
    discovery_run_id: input.discoveryRunId,
    artifact_id: input.artifactId,
    layer1_id: input.layer1Id,
    request_type: input.requestType,
    status: input.status,
    priority: input.priority,
    pipeline_version: input.pipelineVersion,
    input_hash: input.inputHash,
    created_at: input.createdAt,
  });
  if (error && !String(error).includes('duplicate')) {
    throw new Error(`Failed to create request: ${error}`);
  }
  if (error && String(error).includes('duplicate')) {
    throw new Error(`Duplicate active request for layer1Id=${input.layer1Id}, requestType=${input.requestType}`);
  }
}

export async function updateRequestStatus(
  db: DbClient,
  requestId: string,
  status: string,
  params?: { agentVersion?: string; modelVersion?: string; outputRef?: string; error?: string },
): Promise<void> {
  const update: Record<string, unknown> = {
    request_id: requestId,
    status,
    updated_at: new Date().toISOString(),
  };

  if (params?.agentVersion) update.agent_version = params.agentVersion;
  if (params?.modelVersion) update.model_version = params.modelVersion;
  if (params?.outputRef) update.output_ref = params.outputRef;
  if (params?.error) update.error = params.error;

  if (status === 'CLAIMED') update.claimed_at = new Date().toISOString();
  if (status === 'COMPLETED') update.completed_at = new Date().toISOString();
  if (status === 'FAILED') {
    update.failed_at = new Date().toISOString();
    update.error = params?.error ?? null;
  }

  const { error } = await db.from('discovery_preparation_requests').insert(update);
  if (error) throw new Error(`Failed to update request status: ${error}`);
}

export async function getPendingRequests(
  db: DbClient,
  requestType?: string,
  limit = 10,
): Promise<SemanticExtractionRequest[]> {
  const { data, error } = await db.from('discovery_preparation_requests')
    .select('*')
    .eq('status', requestType ? 'PENDING' : 'PENDING');
  if (error) throw new Error(`Failed to get pending requests: ${error}`);
  return ((data as any[]) ?? [])
    .filter(r => !requestType || r.request_type === requestType)
    .slice(0, limit);
}

export async function getRequestById(db: DbClient, requestId: string): Promise<SemanticExtractionRequest | null> {
  const { data, error } = await db.from('discovery_preparation_requests').select('*').eq('request_id', requestId);
  if (error) throw new Error(`Failed to get request: ${error}`);
  return ((data as any[]) ?? [])[0] ?? null;
}

export async function getRequestsByRun(db: DbClient, discoveryRunId: string): Promise<SemanticExtractionRequest[]> {
  const { data, error } = await db.from('discovery_preparation_requests').select('*').eq('discovery_run_id', discoveryRunId);
  if (error) throw new Error(`Failed to get requests by run: ${error}`);
  return (data as any[]) ?? [];
}
