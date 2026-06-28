// ==========================================================================
// Domain Event Runtime — API integration layer
// ==========================================================================
// Replaces console.log stubs with Event Store + Outbox via publish_domain_event RPC,
// falling back to in-memory OutboxEventBus when Postgres is unavailable (tests).
// ==========================================================================

import type { KadarnEventType, KadarnEventPayload } from '@kadarn/domain-events';
import { getEventVersion } from '@kadarn/domain-events';
import { InMemoryEventStore, OutboxEventBus } from '@kadarn/platform-services';
import { createRouteClient } from '@/lib/supabase-server';
import { incrementCounter, METRIC_DOMAIN_EVENTS, logError } from '@kadarn/telemetry';
import { dispatchWorkflowSignal } from '@kadarn/workflow-engine/src/runtime';
import type { WorkflowSignalRequestedPayload } from '@kadarn/domain-events';
import { ingestKnowledgeFromEvent } from '@/lib/knowledge-runtime';
import '@/lib/orchestration/init';

export interface PublishContext {
  actorId: string;
  organizationId?: string | null;
  programId?: string | null;
  correlationId: string;
  idempotencyKey?: string;
}

export interface EmittedEvent {
  type: string;
  payload: Record<string, unknown>;
  actorId: string;
  organizationId: string | null;
  correlationId: string;
}

let outboxBus: OutboxEventBus | null = null;

function getOutboxBus(): OutboxEventBus {
  if (!outboxBus) {
    outboxBus = new OutboxEventBus(new InMemoryEventStore());
  }
  return outboxBus;
}

/** Reset bus (tests only) */
export function resetDomainEventRuntime(): void {
  outboxBus = null;
}

export async function publishDomainEvent<T extends KadarnEventType>(
  type: T,
  payload: KadarnEventPayload<T>,
  ctx: PublishContext,
): Promise<string> {
  try {
    const supabase = await createRouteClient();
    const { data, error } = await supabase.rpc('publish_domain_event', {
      p_event_type: type,
      p_payload: payload,
      p_actor_id: ctx.actorId,
      p_organization_id: ctx.organizationId ?? null,
      p_program_id: ctx.programId ?? null,
      p_correlation_id: ctx.correlationId,
      p_idempotency_key: ctx.idempotencyKey ?? null,
      p_event_version: getEventVersion(type),
    });

    if (!error && data && typeof data === 'object' && 'event_id' in data) {
      return (data as { event_id: string }).event_id;
    }
  } catch (err) {
    console.warn('[domain-events] RPC publish failed, falling back to in-memory store:', err instanceof Error ? err.message : String(err));
  }

  return getOutboxBus().publish(
    type,
    payload,
    {
      userId: ctx.actorId,
      organizationId: ctx.organizationId,
      programId: ctx.programId,
    },
    { correlationId: ctx.correlationId, deduplicationKey: ctx.idempotencyKey },
  );
}

export function publishDomainEventFireAndForget<T extends KadarnEventType>(
  type: T,
  payload: KadarnEventPayload<T>,
  ctx: PublishContext,
): void {
  void publishDomainEvent(type, payload, ctx).catch(err => {
    console.error('[domain-events] publish failed:', err);
  });
}

/** Sync-friendly helper for existing fire-and-forget call sites */
export function publishIntegrationEvent(
  type: KadarnEventType,
  payload: Record<string, unknown>,
  ctx: PublishContext,
): EmittedEvent {
  const emitted: EmittedEvent = {
    type,
    payload,
    actorId: ctx.actorId,
    organizationId: ctx.organizationId ?? null,
    correlationId: ctx.correlationId,
  };

  publishDomainEventFireAndForget(
    type,
    payload as unknown as KadarnEventPayload<KadarnEventType>,
    ctx,
  );

  incrementCounter(METRIC_DOMAIN_EVENTS, { event_type: type });

  if (type === 'WorkflowSignalRequested') {
    const wf = payload as unknown as WorkflowSignalRequestedPayload;
    void dispatchWorkflowSignal({
      workflowType: wf.workflowType,
      signal: wf.signal,
      payload: wf.payload,
      correlationId: ctx.correlationId,
      actorId: ctx.actorId,
      organizationId: ctx.organizationId ?? null,
    }).catch(err => {
      logError('workflow.dispatch.failed', {
        workflowType: wf.workflowType,
        signal: wf.signal,
        correlationId: ctx.correlationId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  if (
    type === 'SupplyItemCreated'
    || type === 'FeasibilityAssessmentCompleted'
    || type === 'CollectionCreated'
    || type === 'QcCompleted'
  ) {
    void ingestKnowledgeFromEvent(type, payload, {
      actorId: ctx.actorId,
      organizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
    }).catch(err => {
      logError('knowledge.ingest.failed', {
        eventType: type,
        correlationId: ctx.correlationId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  return emitted;
}

export async function replayDomainEvents(filter: {
  from: string;
  to?: string | null;
  eventTypes?: string[] | null;
  correlationId?: string | null;
  limit?: number;
}): Promise<number> {
  try {
    const supabase = await createRouteClient();
    const { data, error } = await supabase.rpc('replay_domain_events', {
      p_from: filter.from,
      p_to: filter.to ?? null,
      p_event_types: filter.eventTypes ?? null,
      p_correlation_id: filter.correlationId ?? null,
      p_limit: filter.limit ?? 500,
    });
    if (!error && Array.isArray(data)) {
      return data.length;
    }
  } catch {
    // fall through
  }

  return getOutboxBus().replayAndDispatch(filter);
}
