// ==========================================================================
// Domain Event Runtime - API integration layer
// ==========================================================================
// Publishes domain events via the publish_domain_event RPC, falling back to
// a simple in-memory no-op when Postgres is unavailable (tests/dev).
// ==========================================================================

import type { KadarnEventType, KadarnEventPayload } from '@kadarn/domain-events';
import { getEventVersion } from '@kadarn/domain-events';
import { createRouteClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

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

export class DomainEventPublishError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'DomainEventPublishError'
  }
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}

function isDomainEventFallbackAllowed(): boolean {
  return process.env.KADARN_ALLOW_DOMAIN_EVENT_FALLBACK === 'true'
}

function createFallbackEventId(type: string, ctx: PublishContext, error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (isProductionRuntime() && !isDomainEventFallbackAllowed()) {
    throw new DomainEventPublishError(
      `Domain event publish failed for ${type}; fallback IDs are disabled in production`,
      { cause: error },
    )
  }

  const fallbackEventId = crypto.randomUUID()
  logger.warn('domain_event_publish_fallback', {
    event_type: type,
    fallback_event_id: fallbackEventId,
    correlation_id: ctx.correlationId,
    organization_id: ctx.organizationId ?? null,
    error_code: errorMessage,
  })

  return fallbackEventId
}

/** Reset runtime state (tests only) */
export function resetDomainEventRuntime(): void {
  // no-op for now
}

export async function publishDomainEvent<T extends KadarnEventType>(
  type: T,
  payload: KadarnEventPayload<T>,
  ctx: PublishContext,
): Promise<string> {
  let publishError: unknown = new DomainEventPublishError(`Domain event publish did not return an event id for ${type}`)

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

    if (error) {
      publishError = error
      logger.error('domain_event_publish_rpc_error', {
        event_type: type,
        correlation_id: ctx.correlationId,
        organization_id: ctx.organizationId ?? null,
        error_code: error.message,
      })
      return createFallbackEventId(type, ctx, publishError)
    }

    if (!error && data && typeof data === 'object' && 'event_id' in data) {
      return (data as { event_id: string }).event_id;
    }
  } catch (err: unknown) {
    publishError = err
    logger.error('domain_event_publish_exception', {
      event_type: type,
      correlation_id: ctx.correlationId,
      organization_id: ctx.organizationId ?? null,
      error_code: err instanceof Error ? err.message : String(err),
    })
  }

  return createFallbackEventId(type, ctx, publishError);
}

export function publishDomainEventFireAndForget<T extends KadarnEventType>(
  type: T,
  payload: KadarnEventPayload<T>,
  ctx: PublishContext,
): void {
  void publishDomainEvent(type, payload, ctx).catch((err: unknown) => {
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

  return 0;
}
