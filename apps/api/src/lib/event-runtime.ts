// ==========================================================================
// Domain Event Runtime — API integration layer
// ==========================================================================
// Publishes domain events via the publish_domain_event RPC, falling back to
// a simple in-memory no-op when Postgres is unavailable (tests/dev).
// ==========================================================================

import type { KadarnEventType, KadarnEventPayload } from '@kadarn/domain-events';
import { getEventVersion } from '@kadarn/domain-events';
import { createRouteClient } from '@/lib/supabase-server';

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

/** Reset runtime state (tests only) */
export function resetDomainEventRuntime(): void {
  // no-op for now
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
  } catch (_err: unknown) {
    const msg = _err instanceof Error ? _err.message : String(_err);
    console.warn('[domain-events] RPC publish failed:', msg);
  }

  return crypto.randomUUID();
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
