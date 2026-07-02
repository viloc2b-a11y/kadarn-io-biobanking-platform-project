// ==========================================================================
// Engine Orchestrator — generic cross-engine hook for route handlers
// ==========================================================================
// Thin, fire-and-forget adapter used by route handlers to signal that a
// mutation completed and downstream Engines (Workflow, Knowledge, Analytics,
// etc.) MAY react to it. Per ADR-011/ADR-012, this module does not implement
// Engine logic itself — it only publishes a PipelineStageCompleted domain
// event that Engines can subscribe to independently. It never blocks the
// request path and never throws.
// ==========================================================================

import { publishIntegrationEvent } from '@/lib/event-runtime';

export interface PipelineContext {
  correlationId: string;
  actorId: string;
  organizationId: string | null;
  programId?: string | null;
}

export interface CreatePipelineContextInput {
  correlationId: string;
  actorId: string;
  organizationId?: string | null;
  programId?: string | null;
}

/** Builds a PipelineContext from route-level identifiers. */
export function createPipelineContext(input: CreatePipelineContextInput): PipelineContext {
  return {
    correlationId: input.correlationId,
    actorId: input.actorId,
    organizationId: input.organizationId ?? null,
    programId: input.programId ?? null,
  };
}

/**
 * Signals that a named pipeline stage has completed for a given entity.
 * Fire-and-forget: publishes a PipelineStageCompleted domain event carrying
 * the stage name and payload as event metadata. Does not await, does not
 * throw — failures are logged by the underlying event runtime.
 */
export function runPipeline(
  stage: string,
  context: PipelineContext,
  payload: Record<string, unknown>,
): void {
  publishIntegrationEvent(
    'PipelineStageCompleted',
    {
      pipeline: stage,
      stage,
      organizationId: context.organizationId,
      ...payload,
    },
    {
      actorId: context.actorId,
      organizationId: context.organizationId,
      programId: context.programId ?? null,
      correlationId: context.correlationId,
      idempotencyKey: `PipelineStageCompleted:${stage}:${context.correlationId}`,
    },
  );
}
