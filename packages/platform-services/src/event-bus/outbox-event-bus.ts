// ==========================================================================
// Outbox Event Bus — Event Store + Outbox + in-process subscribers
// ==========================================================================

import type {
  DomainEvent,
  KadarnEventType,
  KadarnEventPayload,
} from '@kadarn/domain-events';
import { getEventVersion } from '@kadarn/domain-events';
import type { EventStore, StoredDomainEvent } from '@kadarn/domain-events';
import type { ActorContext } from '../types';
import type { EventHandler, PublishOptions } from './index';

export class OutboxEventBus {
  private handlers = new Map<KadarnEventType, Set<EventHandler>>();

  constructor(private readonly store: EventStore) {}

  async publish<T extends KadarnEventType>(
    type: T,
    payload: KadarnEventPayload<T>,
    context: ActorContext,
    options?: PublishOptions,
  ): Promise<string> {
    const result = await this.store.append({
      eventType: type,
      payload: payload as unknown as Record<string, unknown>,
      actorId: context.userId,
      organizationId: context.organizationId,
      programId: context.programId,
      correlationId: options?.correlationId ?? null,
      idempotencyKey: options?.deduplicationKey ?? null,
      eventVersion: getEventVersion(type),
    });

    if (!result.duplicate) {
      const stored = await this.loadEvent(result.eventId, type, payload, context, options);
      await this.dispatchToHandlers(this.toDomainEvent(stored));
    }

    return result.eventId;
  }

  async subscribe<T extends KadarnEventType>(
    type: T,
    handler: EventHandler<T>,
  ): Promise<() => void> {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(type)?.delete(handler as EventHandler);
    };
  }

  async replayAndDispatch(filter: Parameters<EventStore['replay']>[0]): Promise<number> {
    const events = await this.store.replay(filter);
    for (const stored of events) {
      await this.dispatchToHandlers(this.toDomainEvent(stored));
    }
    return events.length;
  }

  private async loadEvent(
    eventId: string,
    type: KadarnEventType,
    payload: KadarnEventPayload<KadarnEventType>,
    context: ActorContext,
    options?: PublishOptions,
  ): Promise<StoredDomainEvent> {
    const replayed = await this.store.replay({
      from: '1970-01-01T00:00:00.000Z',
      limit: 10_000,
    });
    const found = replayed.find(e => e.id === eventId);
    if (found) return found;

    const now = new Date().toISOString();
    return {
      id: eventId,
      eventType: type,
      eventVersion: getEventVersion(type),
      occurredAt: now,
      recordedAt: now,
      actorId: context.userId,
      organizationId: context.organizationId ?? null,
      programId: context.programId ?? null,
      correlationId: options?.correlationId ?? null,
      causationId: null,
      idempotencyKey: options?.deduplicationKey ?? null,
      payload: payload as unknown as Record<string, unknown>,
      metadata: {},
    };
  }

  private toDomainEvent(stored: StoredDomainEvent): DomainEvent {
    return {
      id: stored.id,
      type: stored.eventType,
      version: stored.eventVersion,
      occurredAt: stored.occurredAt,
      actorId: stored.actorId,
      organizationId: stored.organizationId,
      programId: stored.programId,
      correlationId: stored.correlationId,
      payload: stored.payload,
    };
  }

  private async dispatchToHandlers(event: DomainEvent): Promise<void> {
    const type = event.type as KadarnEventType;
    const handlers = this.handlers.get(type);
    if (!handlers || handlers.size === 0) return;

    await Promise.allSettled(
      Array.from(handlers).map(h =>
        h(event as unknown as DomainEvent<KadarnEventPayload<KadarnEventType>>),
      ),
    );
  }
}
