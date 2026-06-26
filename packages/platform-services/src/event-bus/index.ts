// ==========================================================================
// Event Bus — Domain event publishing and subscription
// ==========================================================================
// All engines emit and consume domain events through this bus.
// Currently in-memory; can be backed by pgmq, RabbitMQ, Kafka, or NATS.
// ==========================================================================

import type { DomainEvent, KadarnEventType, KadarnEventPayload } from '@kadarn/domain-events';
import type { ActorContext, CorrelationId } from '../types';

/** Subscription handler for domain events */
export type EventHandler<T extends KadarnEventType = KadarnEventType> = (
  event: DomainEvent<KadarnEventPayload<T>>,
) => Promise<void>;

/** Event bus options for publish */
export interface PublishOptions {
  correlationId?: CorrelationId;
  delayMs?: number;
  deduplicationKey?: string;
}

/** Event bus interface */
export interface EventBus {
  /** Publish a domain event */
  publish<T extends KadarnEventType>(
    type: T,
    payload: KadarnEventPayload<T>,
    context: ActorContext,
    options?: PublishOptions,
  ): Promise<string>; // returns event ID

  /** Subscribe to a domain event type */
  subscribe<T extends KadarnEventType>(
    type: T,
    handler: EventHandler<T>,
  ): Promise<() => void>; // returns unsubscribe function

  /** Subscribe to multiple event types with one handler */
  subscribeMany(
    types: KadarnEventType[],
    handler: EventHandler,
  ): Promise<() => void>;
}

// ---------------------------------------------------------------------------
// In-Memory implementation (development default)
// ---------------------------------------------------------------------------
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<KadarnEventType, Set<EventHandler>>();
  private published: string[] = [];

  async publish<T extends KadarnEventType>(
    type: T,
    payload: KadarnEventPayload<T>,
    context: ActorContext,
    _options?: PublishOptions,
  ): Promise<string> {
    const eventId = crypto.randomUUID();
    const event: DomainEvent<KadarnEventPayload<T>> = {
      id: eventId,
      type: type as string,
      version: 1,
      occurredAt: new Date().toISOString(),
      actorId: context.userId,
      organizationId: context.organizationId ?? null,
      programId: context.programId ?? null,
      payload,
    };

    this.published.push(eventId);

    const handlers = this.handlers.get(type);
    if (handlers) {
      await Promise.allSettled(
        Array.from(handlers).map(h => h(event as any)),
      );
    }

    return eventId;
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

  async subscribeMany(
    types: KadarnEventType[],
    handler: EventHandler,
  ): Promise<() => void> {
    const unsubs = await Promise.all(
      types.map(t => this.subscribe(t, handler)),
    );
    return () => unsubs.forEach(u => u());
  }

  /** Get published event IDs (for testing) */
  getPublishedEvents(): string[] {
    return [...this.published];
  }

  /** Clear all handlers and history */
  reset(): void {
    this.handlers.clear();
    this.published = [];
  }
}
