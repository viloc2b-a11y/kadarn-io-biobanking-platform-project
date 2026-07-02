// ==========================================================================
// Discovery Pipeline Status — read-only stage aggregation
// ==========================================================================
// Never writes to Evidence Core. No rerun. No promotion.
// ==========================================================================

export type PipelineStageId =
  | 'layer0_artifact'
  | 'layer1_extraction'
  | 'semantic_requests'
  | 'document_classification'
  | 'entity_extraction'
  | 'relationship_extraction'
  | 'timeline_engine'
  | 'capability_detector'
  | 'claim_candidate_detector'
  | 'gap_detector'
  | 'narrative_engine'
  | 'institutional_profile'
  | 'snapshot'
  | 'curation';

export type PipelineStageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'not_available';

export type PipelineDashboardTab =
  | 'documents'
  | 'entities'
  | 'relationships'
  | 'timeline'
  | 'capabilities'
  | 'claims'
  | 'gaps'
  | 'narrative'
  | 'profile'
  | 'snapshot'
  | 'curation'
  | null;

export interface PipelineStageView {
  id: PipelineStageId;
  label: string;
  status: PipelineStageStatus;
  count: number | null;
  latestAt: string | null;
  warnings: string[];
  errors: string[];
  dashboardTab: PipelineDashboardTab;
}

export interface PipelineStatusData {
  sessionId: string;
  runId: string | null;
  runStatus: string | null;
  pipelineVersion: string | null;
  stages: PipelineStageView[];
}

interface ArtifactRow {
  id: string;
  created_at: string;
}

interface Layer1Row {
  id: string;
  artifact_id: string;
  status: string;
  extracted_at: string;
  error_message: string | null;
}

interface PrepRequestRow {
  request_id: string;
  request_type: string;
  status: string;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  failed_at: string | null;
  updated_at: string;
}

interface AgentOutputRow {
  agent_name: string;
  status: string;
  warnings: unknown;
  created_at: string;
}

interface RunContext {
  hasRun: boolean;
  hasArtifacts: boolean;
  artifactCount: number;
}

function latestTimestamp(...values: (string | null | undefined)[]): string | null {
  const valid = values.filter((v): v is string => Boolean(v));
  if (valid.length === 0) return null;
  return valid.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function aggregateRequestStatuses(requests: PrepRequestRow[]): {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  skipped: number;
  total: number;
  errors: string[];
  latestAt: string | null;
} {
  let pending = 0;
  let running = 0;
  let completed = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];
  const timestamps: string[] = [];

  for (const req of requests) {
    const status = req.status.toUpperCase();
    if (status === 'PENDING') pending += 1;
    else if (status === 'CLAIMED' || status === 'RUNNING') running += 1;
    else if (status === 'COMPLETED') completed += 1;
    else if (status === 'FAILED') {
      failed += 1;
      if (req.error) errors.push(req.error);
    } else if (status === 'SKIPPED') skipped += 1;

    timestamps.push(req.completed_at ?? req.failed_at ?? req.updated_at ?? req.created_at);
  }

  return {
    pending,
    running,
    completed,
    failed,
    skipped,
    total: requests.length,
    errors,
    latestAt: latestTimestamp(...timestamps),
  };
}

function resolveAggregateStatus(
  agg: ReturnType<typeof aggregateRequestStatuses>,
  ctx: RunContext,
  prerequisiteMet: boolean,
): PipelineStageStatus {
  if (!ctx.hasRun) return 'not_available';
  if (agg.total === 0) {
    if (!prerequisiteMet) return 'not_available';
    return 'pending';
  }
  if (agg.failed > 0 && agg.completed === 0) return 'failed';
  if (agg.running > 0 || (agg.pending > 0 && agg.completed > 0)) return 'running';
  if (agg.pending > 0) return 'pending';
  if (agg.skipped === agg.total) return 'skipped';
  if (agg.completed > 0) return 'completed';
  return 'pending';
}

function stageFromRequests(
  id: PipelineStageId,
  label: string,
  dashboardTab: PipelineDashboardTab,
  requests: PrepRequestRow[],
  ctx: RunContext,
  prerequisiteMet: boolean,
): PipelineStageView {
  const agg = aggregateRequestStatuses(requests);
  return {
    id,
    label,
    status: resolveAggregateStatus(agg, ctx, prerequisiteMet),
    count: agg.total > 0 ? agg.total : null,
    latestAt: agg.latestAt,
    warnings: [],
    errors: agg.errors,
    dashboardTab,
  };
}

function stageFromAgentOutputs(
  id: PipelineStageId,
  label: string,
  dashboardTab: PipelineDashboardTab,
  outputs: AgentOutputRow[],
  agentNames: string[],
  ctx: RunContext,
  prerequisiteMet: boolean,
): PipelineStageView {
  const matched = outputs.filter((row) => agentNames.includes(row.agent_name));
  if (matched.length === 0) {
    return {
      id,
      label,
      status: !ctx.hasRun ? 'not_available' : prerequisiteMet ? 'pending' : 'not_available',
      count: null,
      latestAt: null,
      warnings: [],
      errors: [],
      dashboardTab,
    };
  }

  let completed = 0;
  let failed = 0;
  let running = 0;
  let skipped = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const row of matched) {
    const status = row.status.toUpperCase();
    if (status === 'COMPLETED') completed += 1;
    else if (status === 'FAILED') failed += 1;
    else if (status === 'SKIPPED') skipped += 1;
    else running += 1;
    warnings.push(...asStringArray(row.warnings));
  }

  let stageStatus: PipelineStageStatus = 'pending';
  if (failed > 0 && completed === 0) stageStatus = 'failed';
  else if (running > 0) stageStatus = 'running';
  else if (skipped === matched.length) stageStatus = 'skipped';
  else if (completed > 0) stageStatus = 'completed';
  else stageStatus = 'pending';

  return {
    id,
    label,
    status: stageStatus,
    count: matched.length,
    latestAt: latestTimestamp(...matched.map((row) => row.created_at)),
    warnings,
    errors,
    dashboardTab,
  };
}

function mergeStageStatus(primary: PipelineStageView, secondary: PipelineStageView): PipelineStageView {
  const statusPriority: Record<PipelineStageStatus, number> = {
    failed: 6,
    running: 5,
    pending: 4,
    completed: 3,
    skipped: 2,
    not_available: 1,
  };

  const status = statusPriority[primary.status] >= statusPriority[secondary.status]
    ? primary.status
    : secondary.status;

  return {
    ...primary,
    status,
    count: primary.count ?? secondary.count,
    latestAt: latestTimestamp(primary.latestAt, secondary.latestAt),
    warnings: [...primary.warnings, ...secondary.warnings],
    errors: [...primary.errors, ...secondary.errors],
  };
}

export function buildDiscoveryPipelineStatus(input: {
  sessionId: string;
  run: { id: string; status: string; pipeline_version: string } | null;
  artifacts: ArtifactRow[];
  layer1Rows: Layer1Row[];
  prepRequests: PrepRequestRow[];
  agentOutputs: AgentOutputRow[];
  curationEventCount: number;
  latestCurationAt: string | null;
}): PipelineStatusData {
  const ctx: RunContext = {
    hasRun: Boolean(input.run),
    hasArtifacts: input.artifacts.length > 0,
    artifactCount: input.artifacts.length,
  };

  const layer0Latest = latestTimestamp(...input.artifacts.map((a) => a.created_at));
  const layer0Stage: PipelineStageView = {
    id: 'layer0_artifact',
    label: 'Layer 0 Artifact',
    status: !ctx.hasRun
      ? 'not_available'
      : ctx.artifactCount > 0
        ? 'completed'
        : 'pending',
    count: ctx.artifactCount > 0 ? ctx.artifactCount : null,
    latestAt: layer0Latest,
    warnings: [],
    errors: [],
    dashboardTab: 'documents',
  };

  const layer1Failed = input.layer1Rows.filter((row) => row.status === 'failed');
  const layer1Count = input.layer1Rows.length;
  let layer1Status: PipelineStageStatus = 'not_available';
  if (!ctx.hasRun) layer1Status = 'not_available';
  else if (layer1Failed.length > 0 && layer1Count === layer1Failed.length) layer1Status = 'failed';
  else if (ctx.artifactCount === 0) layer1Status = 'not_available';
  else if (layer1Count >= ctx.artifactCount) layer1Status = 'completed';
  else if (layer1Count > 0) layer1Status = 'running';
  else if (ctx.artifactCount > 0) layer1Status = 'pending';

  const layer1Stage: PipelineStageView = {
    id: 'layer1_extraction',
    label: 'Layer 1 Extraction',
    status: layer1Status,
    count: layer1Count > 0 ? layer1Count : null,
    latestAt: latestTimestamp(...input.layer1Rows.map((row) => row.extracted_at)),
    warnings: [],
    errors: layer1Failed.map((row) => row.error_message ?? 'Layer 1 extraction failed').filter(Boolean),
    dashboardTab: 'documents',
  };

  const semanticStage = stageFromRequests(
    'semantic_requests',
    'Semantic Requests',
    null,
    input.prepRequests,
    ctx,
    layer1Count > 0,
  );

  const byType = (type: string) => input.prepRequests.filter((r) => r.request_type === type);

  const documentStage = mergeStageStatus(
    stageFromRequests('document_classification', 'Document Classification', 'documents', byType('DOCUMENT_CLASSIFICATION'), ctx, layer1Count > 0),
    stageFromAgentOutputs('document_classification', 'Document Classification', 'documents', input.agentOutputs, ['document-classifier', 'document_classifier'], ctx, layer1Count > 0),
  );

  const entityStage = mergeStageStatus(
    stageFromRequests('entity_extraction', 'Entity Extraction', 'entities', byType('ENTITY_EXTRACTION'), ctx, layer1Count > 0),
    stageFromAgentOutputs('entity_extraction', 'Entity Extraction', 'entities', input.agentOutputs, ['entity-extractor', 'entity_extractor'], ctx, layer1Count > 0),
  );

  const relationshipStage = mergeStageStatus(
    stageFromRequests('relationship_extraction', 'Relationship Extraction', 'relationships', byType('RELATIONSHIP_EXTRACTION'), ctx, layer1Count > 0),
    stageFromAgentOutputs('relationship_extraction', 'Relationship Extraction', 'relationships', input.agentOutputs, ['relationship-extractor', 'relationship_extractor'], ctx, layer1Count > 0),
  );

  const timelineStage = mergeStageStatus(
    stageFromRequests('timeline_engine', 'Timeline Engine', 'timeline', byType('TIMELINE_RECONSTRUCTION'), ctx, layer1Count > 0),
    stageFromAgentOutputs('timeline_engine', 'Timeline Engine', 'timeline', input.agentOutputs, ['institutional_timeline_engine'], ctx, layer1Count > 0),
  );

  const capabilityStage = stageFromAgentOutputs(
    'capability_detector',
    'Capability Detector',
    'capabilities',
    input.agentOutputs,
    ['capability_detector'],
    ctx,
    layer1Count > 0,
  );

  const claimStage = mergeStageStatus(
    stageFromRequests('claim_candidate_detector', 'Claim Candidate Detector', 'claims', byType('CLAIM_CANDIDATE_DETECTION'), ctx, layer1Count > 0),
    stageFromAgentOutputs('claim_candidate_detector', 'Claim Candidate Detector', 'claims', input.agentOutputs, ['claim_candidate_detector'], ctx, layer1Count > 0),
  );

  const gapStage = mergeStageStatus(
    stageFromRequests('gap_detector', 'Gap Detector', 'gaps', byType('GAP_DETECTION'), ctx, layer1Count > 0),
    stageFromAgentOutputs('gap_detector', 'Gap Detector', 'gaps', input.agentOutputs, ['evidence_gap_detector'], ctx, layer1Count > 0),
  );

  const narrativeStage = stageFromAgentOutputs(
    'narrative_engine',
    'Narrative Engine',
    'narrative',
    input.agentOutputs,
    ['narrative_engine'],
    ctx,
    layer1Count > 0,
  );

  const profileStage = stageFromAgentOutputs(
    'institutional_profile',
    'Institutional Profile',
    'profile',
    input.agentOutputs,
    ['profile_builder', 'institutional_profile'],
    ctx,
    layer1Count > 0,
  );

  const snapshotStage = stageFromAgentOutputs(
    'snapshot',
    'Snapshot',
    'snapshot',
    input.agentOutputs,
    ['evidence_snapshot', 'snapshot_builder'],
    ctx,
    layer1Count > 0,
  );

  const curationStage: PipelineStageView = {
    id: 'curation',
    label: 'Curation',
    status: !ctx.hasRun
      ? 'not_available'
      : input.curationEventCount > 0
        ? 'completed'
        : 'pending',
    count: input.curationEventCount > 0 ? input.curationEventCount : null,
    latestAt: input.latestCurationAt,
    warnings: [],
    errors: [],
    dashboardTab: 'curation',
  };

  if (input.run?.status === 'failed' && input.run) {
    for (const stage of [
      documentStage, entityStage, relationshipStage, timelineStage,
      capabilityStage, claimStage, gapStage, narrativeStage, profileStage, snapshotStage,
    ]) {
      if (stage.status === 'pending') {
        stage.warnings.push(`Run status is ${input.run.status}`);
      }
    }
  }

  return {
    sessionId: input.sessionId,
    runId: input.run?.id ?? null,
    runStatus: input.run?.status ?? null,
    pipelineVersion: input.run?.pipeline_version ?? null,
    stages: [
      layer0Stage,
      layer1Stage,
      semanticStage,
      documentStage,
      entityStage,
      relationshipStage,
      timelineStage,
      capabilityStage,
      claimStage,
      gapStage,
      narrativeStage,
      profileStage,
      snapshotStage,
      curationStage,
    ],
  };
}
