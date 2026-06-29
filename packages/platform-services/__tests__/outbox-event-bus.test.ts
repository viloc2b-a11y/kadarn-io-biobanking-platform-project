import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventStore, OutboxEventBus } from '../src';
import type { ActorContext } from '../src/types';

const ctx: ActorContext = {
  userId: '00000000-0000-0000-0000-000000000001',
  organizationId: 'a0000000-0000-0000-0000-000000000001',
};

describe('OutboxEventBus', () => {
  let store: InMemoryEventStore;
  let bus: OutboxEventBus;

  beforeEach(() => {
    store = new InMemoryEventStore();
    bus = new OutboxEventBus(store);
  });

  it('persists events to the store on publish', async () => {
    await bus.publish('ProgramCreated', {
      programId: 'b0000000-0000-0000-0000-000000000001',
      name: 'Test',
      sponsorOrganizationId: ctx.organizationId!,
      leadOrganizationId: null,
      createdBy: ctx.userId,
    }, ctx);

    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].eventType).toBe('ProgramCreated');
  });

  it('deduplicates by idempotency key', async () => {
    const options = { deduplicationKey: 'idem-001', correlationId: 'corr-001' };

    const first = await bus.publish('OrganizationCreated', {
      organizationId: 'org-1',
      name: 'A',
      country: 'US',
      createdBy: ctx.userId,
    }, ctx, options);

    const second = await bus.publish('OrganizationCreated', {
      organizationId: 'org-1',
      name: 'A',
      country: 'US',
      createdBy: ctx.userId,
    }, ctx, options);

    expect(first).toBe(second);
    expect(store.getAll()).toHaveLength(1);
  });

  it('dispatches to subscribers', async () => {
    const received: string[] = [];
    await bus.subscribe('ProgramCreated', async (event) => {
      received.push(event.payload.name as string);
    });

    await bus.publish('ProgramCreated', {
      programId: 'b0000000-0000-0000-0000-000000000001',
      name: 'Replay Me',
      sponsorOrganizationId: ctx.organizationId!,
      leadOrganizationId: null,
      createdBy: ctx.userId,
    }, ctx);

    expect(received).toEqual(['Replay Me']);
  });

  it('replays stored events', async () => {
    await bus.publish('ProgramCreated', {
      programId: 'b0000000-0000-0000-0000-000000000001',
      name: 'One',
      sponsorOrganizationId: ctx.organizationId!,
      leadOrganizationId: null,
      createdBy: ctx.userId,
    }, ctx);

    const replayed: string[] = [];
    const replayBus = new OutboxEventBus(store);
    await replayBus.subscribe('ProgramCreated', async (event) => {
      replayed.push(event.payload.name as string);
    });

    const count = await replayBus.replayAndDispatch({
      from: '1970-01-01T00:00:00.000Z',
    });

    expect(count).toBe(1);
    expect(replayed).toEqual(['One']);
  });
});
