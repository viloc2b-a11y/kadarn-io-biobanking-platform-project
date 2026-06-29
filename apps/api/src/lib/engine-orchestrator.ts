// ==========================================================================
// Engine Orchestrator — connects all Kadarn engines via staged pipelines
// ==========================================================================

import { PIPELINE_STAGES } from './orchestration/pipelines';
import { executeStage } from './orchestration/stage-handlers';
import type {
  PipelineContext,
  PipelineName,
  PipelinePayload,
  PipelineResult,
  PipelineStage,
} from './orchestration/types';
import { ALL_PIPELINE_STAGES } from './orchestration/types';
import { incrementCounter, METRIC_PIPELINE_RUNS } from '@kadarn/telemetry';

export type {
  PipelineContext,
  PipelineName,
  PipelinePayload,
  PipelineResult,
  PipelineStage,
} from './orchestration/types';

export { ALL_PIPELINE_STAGES, PIPELINE_STAGES };

/**
 * Run a named pipeline — executes each stage in order with shared correlationId.
 * All cross-engine integration MUST go through this entry point (Sprint 6 gate).
 */
export function runPipeline(
  pipeline: PipelineName,
  ctx: PipelineContext,
  payload: PipelinePayload,
): PipelineResult {
  const stages = PIPELINE_STAGES[pipeline];
  const completed: PipelineStage[] = [];

  for (const stage of stages) {
    executeStage(stage, pipeline, ctx, payload);
    completed.push(stage);
  }

  incrementCounter(METRIC_PIPELINE_RUNS, { pipeline, status: 'ok' });

  return {
    pipeline,
    correlationId: ctx.correlationId,
    stagesCompleted: completed,
  };
}

export function createPipelineContext(input: {
  correlationId: string;
  actorId: string;
  organizationId: string | null;
  programId?: string | null;
  actorRole?: string;
}): PipelineContext {
  return {
    correlationId: input.correlationId,
    actorId: input.actorId,
    organizationId: input.organizationId,
    programId: input.programId ?? null,
    actorRole: input.actorRole,
  };
}
