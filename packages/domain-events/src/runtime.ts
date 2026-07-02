// ==========================================================================
// Kadarn Domain Events — Runtime Contracts
// ==========================================================================
// Shared types and helpers for the Event Store + Outbox runtime (migration
// 036_domain_events_runtime.sql). This module defines the shape of stored
// events and the event version registry — it does NOT implement a database
// client. Callers persist/replay events through their own RPC/data access
// layer (see apps/api/src/lib/event-runtime.ts) and use these helpers to
// keep the envelope shape and version numbers consistent everywhere.
// ==========================================================================

import type { DomainEvent, KadarnEventMap, KadarnEventType, KadarnEventPayload } from './index.js';

// --------------------------------------------------------------------------
// Event version registry
// --------------------------------------------------------------------------
// Every event type has a schema version. Bump the version here when a
// payload shape changes in a way that is not backward compatible.
// Unlisted event types default to version 1 (see getEventVersion).
// --------------------------------------------------------------------------
export const EVENT_VERSIONS: Partial<Record<KadarnEventType, number>> = {};

/** Resolve the schema version for a given event type (defaults to 1). */
export function getEventVersion(type: KadarnEventType): number {
  return EVENT_VERSIONS[type] ?? 1;
}

// --------------------------------------------------------------------------
// Stored event shape — mirrors public.domain_event_store (migration 036)
// --------------------------------------------------------------------------
export interface StoredDomainEvent<T = Record<string, unknown>> {
  id: string;
  eventType: string;
  eventVersion: number;
  occurredAt: string;
  recordedAt: string;
  actorId: string;
  organizationId: string | null;
  programId: string | null;
  correlationId: string | null;
  causationId: string | null;
  idempotencyKey: string | null;
  payload: T;
  metadata: Record<string, unknown>;
}

/** Envelope returned by publish_domain_event (migration 036 PART 3). */
export interface EventEnvelope {
  eventId: string;
  duplicate: boolean;
  outboxId: string | null;
}

/** Result of an append/publish call — alias of EventEnvelope for call sites
 *  that only care whether the append succeeded and whether it was a dup. */
export interface AppendEventResult {
  eventId: string;
  duplicate: boolean;
}

/** Filter accepted by replay_domain_events (migration 036 PART 5). */
export interface ReplayFilter {
  from: string;
  to?: string | null;
  eventTypes?: string[] | null;
  correlationId?: string | null;
  limit?: number;
}

/** Minimal event store contract — implemented by whatever persistence layer
 *  a caller wires up (Supabase RPC, in-memory fallback, etc.). */
export interface EventStore {
  append<T extends KadarnEventType>(
    type: T,
    payload: KadarnEventPayload<T>,
    context: {
      actorId: string;
      organizationId?: string | null;
      programId?: string | null;
      correlationId?: string | null;
      causationId?: string | null;
      idempotencyKey?: string | null;
      metadata?: Record<string, unknown>;
    },
  ): Promise<AppendEventResult>;

  replay(filter: ReplayFilter): Promise<StoredDomainEvent[]>;
}

/** Convert an RPC-shaped JSON row (snake_case, as returned by Postgres) into
 *  a DomainEvent envelope consumable by in-process subscribers. */
export function toEventEnvelope<T extends KadarnEventType>(
  row: {
    id: string;
    event_type: string;
    event_version?: number;
    occurred_at: string;
    actor_id: string;
    organization_id?: string | null;
    program_id?: string | null;
    correlation_id?: string | null;
    payload: KadarnEventMap[T];
  },
): DomainEvent<KadarnEventMap[T]> {
  return {
    id: row.id,
    type: row.event_type,
    version: row.event_version ?? 1,
    occurredAt: row.occurred_at,
    actorId: row.actor_id,
    organizationId: row.organization_id ?? null,
    programId: row.program_id ?? null,
    correlationId: row.correlation_id ?? null,
    payload: row.payload,
  };
}
