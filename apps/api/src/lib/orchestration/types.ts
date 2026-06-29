// ==========================================================================
// Engine Orchestration — Types
// ==========================================================================

/** Canonical pipeline stages (Sprint 6 order) */
export type PipelineStage =
  | 'discovery'
  | 'exchange'
  | 'policy'
  | 'workflow'
  | 'provenance'
  | 'trust'
  | 'financial'
  | 'analytics'
  | 'knowledge'
  | 'twins'
  | 'telemetry';

export type PipelineName =
  | 'exchange-request'
  | 'exchange-request-decision'
  | 'exchange-deal'
  | 'exchange-deal-update'
  | 'feasibility'
  | 'settlement'
  | 'settlement-update'
  | 'shipment'
  | 'shipment-status'
  | 'qc'
  | 'collection-twin'
  | 'specimen-twin'
  | 'organization-onboard';

export interface PipelineContext {
  correlationId: string;
  actorId: string;
  organizationId: string | null;
  programId?: string | null;
  actorRole?: string;
}

export type PipelinePayload = Record<string, unknown>;

export interface PipelineResult {
  pipeline: PipelineName;
  correlationId: string;
  stagesCompleted: PipelineStage[];
}

/** All stages — every engine must appear in at least one pipeline */
export const ALL_PIPELINE_STAGES: PipelineStage[] = [
  'discovery',
  'exchange',
  'policy',
  'workflow',
  'provenance',
  'trust',
  'financial',
  'analytics',
  'knowledge',
  'twins',
  'telemetry',
];
