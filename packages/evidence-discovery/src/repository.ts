// ==========================================================================
// Evidence Discovery — Repository / Persistence Adapter
// ==========================================================================
// Sprint 20A.2. KEMS-002 / KEMS-002A.
// Persists Discovery objects without writing to Evidence Core.
// ==========================================================================

// DbClient interface (local definition — matches @kadarn/evidence-core)
export interface DbClient {
  from(table: string): {
    insert(data: Record<string, unknown> | Record<string, unknown>[]): Promise<{ data: unknown; error: unknown }>;
    select(columns: string): { eq: (col: string, val: unknown) => Promise<{ data: unknown; error: unknown }> };
  };
  rpc(fn: string, params: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

// --------------------------------------------------------------------------
// Discovery Session
// --------------------------------------------------------------------------

export interface CreateSessionInput {
  organizationId: string;
  siteId?: string;
  createdBy: string;
  correlationId: string;
}

export async function createSession(db: DbClient, input: CreateSessionInput): Promise<{ id: string }> {
  const { data, error } = await db.from('discovery_sessions').insert({
    organization_id: input.organizationId,
    site_id: input.siteId ?? null,
    created_by: input.createdBy,
    correlation_id: input.correlationId,
  });
  if (error) throw new Error(`Failed to create session: ${error}`);
  return data as unknown as { id: string };
}

// --------------------------------------------------------------------------
// Discovery Run
// --------------------------------------------------------------------------

export interface CreateRunInput {
  sessionId: string;
  pipelineVersion: string;
}

export async function createRun(db: DbClient, input: CreateRunInput): Promise<{ id: string }> {
  const { data, error } = await db.from('discovery_runs').insert({
    session_id: input.sessionId,
    pipeline_version: input.pipelineVersion,
  });
  if (error) throw new Error(`Failed to create run: ${error}`);
  return data as unknown as { id: string };
}

export async function completeRun(db: DbClient, runId: string, errorMessage?: string): Promise<void> {
  const { error } = await db.from('discovery_runs').insert({
    id: runId,
    status: errorMessage ? 'failed' : 'completed',
    completed_at: new Date().toISOString(),
    error_message: errorMessage ?? null,
  });
  if (error) throw new Error(`Failed to complete run: ${error}`);
}

// --------------------------------------------------------------------------
// Discovery Artifact (Layer 0 — immutable after creation)
// --------------------------------------------------------------------------

export interface CreateArtifactInput {
  runId: string;
  fileName: string;
  artifactType: string;
  sizeBytes: number;
  fileHash: string;
  source: string;
  storageRef: string;
}

export async function createArtifact(db: DbClient, input: CreateArtifactInput): Promise<{ id: string }> {
  const { data, error } = await db.from('discovery_artifacts').insert({
    run_id: input.runId,
    file_name: input.fileName,
    artifact_type: input.artifactType,
    size_bytes: input.sizeBytes,
    file_hash: input.fileHash,
    source: input.source,
    storage_ref: input.storageRef,
  });
  if (error) throw new Error(`Failed to create artifact: ${error}`);
  return data as unknown as { id: string };
}

// --------------------------------------------------------------------------
// Layer 1 — Extracted Representation
// --------------------------------------------------------------------------

export interface CreateLayer1Input {
  artifactId: string;
  markdown: string;
  extractor: string;
  extractorVersion: string;
  originalHash: string;
}

export async function createLayer1(db: DbClient, input: CreateLayer1Input): Promise<{ id: string }> {
  const { data, error } = await db.from('discovery_layer1').insert({
    artifact_id: input.artifactId,
    markdown: input.markdown,
    extractor: input.extractor,
    extractor_version: input.extractorVersion,
    original_hash: input.originalHash,
  });
  if (error) throw new Error(`Failed to create Layer 1: ${error}`);
  return data as unknown as { id: string };
}

// --------------------------------------------------------------------------
// Evidence Candidate
// --------------------------------------------------------------------------

export interface CreateCandidateInput {
  runId: string;
  content: string;
  source: string;
  artifactIds: string[];
  discoveryConfidence?: number;
  proposedEvidenceClass?: string;
}

export async function createCandidate(db: DbClient, input: CreateCandidateInput): Promise<{ id: string }> {
  const { data, error } = await db.from('discovery_candidates').insert({
    run_id: input.runId,
    content: input.content,
    source: input.source,
    discovery_confidence: input.discoveryConfidence ?? 0,
    proposed_evidence_class: input.proposedEvidenceClass ?? null,
  });
  if (error) throw new Error(`Failed to create candidate: ${error}`);

  const candidate = data as unknown as { id: string };

  for (const artifactId of input.artifactIds) {
    await db.from('discovery_candidate_artifacts').insert({
      candidate_id: candidate.id,
      artifact_id: artifactId,
    });
  }

  return candidate;
}

// --------------------------------------------------------------------------
// Transition Event (append-only, immutable)
// --------------------------------------------------------------------------

export interface CreateTransitionEventInput {
  candidateId: string;
  fromState: string;
  toState: string;
  actor: string;
  pipelineVersion: string;
  modelVersion?: string;
  reason: string;
}

export async function createTransitionEvent(db: DbClient, input: CreateTransitionEventInput): Promise<{ id: string }> {
  const { data, error } = await db.from('discovery_transition_events').insert({
    candidate_id: input.candidateId,
    from_state: input.fromState,
    to_state: input.toState,
    actor: input.actor,
    pipeline_version: input.pipelineVersion,
    model_version: input.modelVersion ?? null,
    reason: input.reason,
  });
  if (error) throw new Error(`Failed to create transition event: ${error}`);
  return data as unknown as { id: string };
}

export async function updateCandidateState(db: DbClient, candidateId: string, newState: string): Promise<void> {
  const { error } = await db.from('discovery_candidates').insert({
    id: candidateId,
    current_state: newState,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to update candidate state: ${error}`);
}

// --------------------------------------------------------------------------
// Read operations
// --------------------------------------------------------------------------

export async function getCandidateById(db: DbClient, candidateId: string): Promise<unknown | null> {
  const { data, error } = await db.from('discovery_candidates').select('*').eq('id', candidateId);
  if (error) throw new Error(`Failed to get candidate: ${error}`);
  return (data as unknown as any[])?.at(0) ?? null;
}

export async function getTransitionEvents(db: DbClient, candidateId: string): Promise<unknown[]> {
  const { data, error } = await db.from('discovery_transition_events').select('*').eq('candidate_id', candidateId);
  if (error) throw new Error(`Failed to get transition events: ${error}`);
  return (data as unknown as any[]) ?? [];
}

export async function getCandidatesByRun(db: DbClient, runId: string): Promise<unknown[]> {
  const { data, error } = await db.from('discovery_candidates').select('*').eq('run_id', runId);
  if (error) throw new Error(`Failed to get candidates: ${error}`);
  return (data as unknown as any[]) ?? [];
}
