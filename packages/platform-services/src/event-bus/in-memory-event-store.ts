// ==========================================================================
// Event Store — In-memory implementation (tests + offline fallback)
// ==========================================================================

import type {
  AppendEventResult,
  EventStore,
  ReplayFilter,
  StoredDomainEvent,
} from '@kadarn/domain-events';
import { getEventVersion as resolveEventVersion } from '@kadarn/domain-events';

export class InMemoryEventStore implements EventStore {
  private events = new Map<string, StoredDomainEvent>();
  private idempotencyIndex = new Map<string, string>();

  async append(input: {
    eventType: string;
    payload: Record<string, unknown>;
    actorId: string;
    organizationId?: string | null;
    programId?: string | null;
    correlationId?: string | null;
    causationId?: string | null;
    idempotencyKey?: string | null;
    eventVersion?: number;
    metadata?: Record<string, unknown>;
  }): Promise<AppendEventResult> {
    if (input.idempotencyKey) {
      const existing = this.idempotencyIndex.get(input.idempotencyKey);
      if (existing) {
        return { eventId: existing, duplicate: true, outboxId: null };
      }
    }

    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();
    const stored: StoredDomainEvent = {
      id: eventId,
      eventType: input.eventType,
      eventVersion: input.eventVersion ?? resolveEventVersion(input.eventType),
      occurredAt: now,
      recordedAt: now,
      actorId: input.actorId,
      organizationId: input.organizationId ?? null,
      programId: input.programId ?? null,
      correlationId: input.correlationId ?? null,
      causationId: input.causationId ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      payload: input.payload,
      metadata: input.metadata ?? {},
    };

    this.events.set(eventId, stored);
    if (input.idempotencyKey) {
      this.idempotencyIndex.set(input.idempotencyKey, eventId);
    }

    return { eventId, duplicate: false, outboxId: crypto.randomUUID() };
  }

  async replay(filter: ReplayFilter): Promise<StoredDomainEvent[]> {
    const fromMs = Date.parse(filter.from);
    const toMs = filter.to ? Date.parse(filter.to) : Number.POSITIVE_INFINITY;
    const limit = filter.limit ?? 500;

    return [...this.events.values()]
      .filter(e => {
        const t = Date.parse(e.occurredAt);
        if (t < fromMs || t > toMs) return false;
        if (filter.eventTypes && !filter.eventTypes.includes(e.eventType)) return false;
        if (filter.correlationId && e.correlationId !== filter.correlationId) return false;
        return true;
      })
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
      .slice(0, limit);
  }

  getAll(): StoredDomainEvent[] {
    return [...this.events.values()];
  }

  reset(): void {
    this.events.clear();
    this.idempotencyIndex.clear();
  }
}
