// ==========================================================================
// Platform Services — Tests
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '../src/event-bus';
import { EnvConfigurationService } from '../src/configuration';
import { InMemoryIdempotencyService } from '../src/idempotency';
import { ConsoleLogger, NoopMetricsService } from '../src/observability';
import type { ActorContext } from '../src/types';

const testContext: ActorContext = {
  userId: '00000000-0000-0000-0000-000000000001',
  organizationId: 'a0000000-0000-0000-0000-000000000001',
};

// -------------------------------------------------------------------------
// Event Bus
// -------------------------------------------------------------------------
describe('InMemoryEventBus', () => {
  let bus: InMemoryEventBus;

  beforeEach(() => {
    bus = new InMemoryEventBus();
  });

  it('publishes an event and returns an ID', async () => {
    const id = await bus.publish('ProgramCreated', {
      programId: 'b0000000-0000-0000-0000-000000000001',
      name: 'Test Program',
      sponsorOrganizationId: 'a0000000-0000-0000-0000-000000000001',
      leadOrganizationId: null,
      createdBy: testContext.userId,
    }, testContext);

    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('delivers events to subscribers', async () => {
    const received: string[] = [];

    await bus.subscribe('ProgramCreated', async (event) => {
      received.push(event.payload.name as string);
    });

    await bus.publish('ProgramCreated', {
      programId: 'b0000000-0000-0000-0000-000000000001',
      name: 'Test Program',
      sponsorOrganizationId: 'a0000000-0000-0000-0000-000000000001',
      leadOrganizationId: null,
      createdBy: testContext.userId,
    }, testContext);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe('Test Program');
  });

  it('allows unsubscribing', async () => {
    const received: string[] = [];
    const handler = async (event: any) => { received.push(event.payload.name); };
    const unsubscribe = await bus.subscribe('ProgramCreated', handler);
    await unsubscribe();

    await bus.publish('ProgramCreated', {
      programId: 'b0000000-0000-0000-0000-000000000001',
      name: 'Should Not Arrive',
      sponsorOrganizationId: 'a0000000-0000-0000-0000-000000000001',
      leadOrganizationId: null,
      createdBy: testContext.userId,
    }, testContext);

    expect(received).toHaveLength(0);
  });

  it('supports subscribeMany', async () => {
    let count = 0;
    const unsubscribe = await bus.subscribeMany(
      ['ProgramCreated', 'OrganizationCreated'],
      async () => { count++; },
    );

    await bus.publish('ProgramCreated', {
      programId: 'b0000000-0000-0000-0000-000000000001',
      name: 'P1', sponsorOrganizationId: 'a0000000-0000-0000-0000-000000000001',
      leadOrganizationId: null, createdBy: testContext.userId,
    }, testContext);
    await bus.publish('OrganizationCreated', {
      organizationId: 'a0000000-0000-0000-0000-000000000001',
      name: 'O1', country: 'US', createdBy: testContext.userId,
    }, testContext);

    expect(count).toBe(2);
    await unsubscribe();
  });
});

// -------------------------------------------------------------------------
// Configuration Service
// -------------------------------------------------------------------------
describe('EnvConfigurationService', () => {
  it('uses KADARN_ prefix for env vars', async () => {
    process.env.KADARN_TEST_KEY = '"test-value"';
    const svc = new EnvConfigurationService('KADARN_');
    const val = await svc.get<string>('test.key');
    expect(val).toBe('test-value');
    delete process.env.KADARN_TEST_KEY;
  });

  it('returns null for missing keys', async () => {
    const svc = new EnvConfigurationService('KADARN_');
    const val = await svc.get('nonexistent.key');
    expect(val).toBeNull();
  });
});

// -------------------------------------------------------------------------
// Idempotency Service
// -------------------------------------------------------------------------
describe('InMemoryIdempotencyService', () => {
  let svc: InMemoryIdempotencyService;

  beforeEach(() => {
    svc = new InMemoryIdempotencyService();
  });

  it('allows first-time processing', async () => {
    const result = await svc.tryProcess('req-123');
    expect(result).toBe(true);
  });

  it('blocks duplicate processing', async () => {
    await svc.tryProcess('req-123');
    const result = await svc.tryProcess('req-123');
    expect(result).toBe(false);
  });

  it('expires keys after TTL', async () => {
    await svc.markProcessed('req-456', 0); // 0ms TTL = immediate expiry
    // Wait a tick for the expiry to pass
    await new Promise(r => setTimeout(r, 10));
    const result = await svc.tryProcess('req-456');
    expect(result).toBe(true);
  });
});

// -------------------------------------------------------------------------
// Observability
// -------------------------------------------------------------------------
describe('ConsoleLogger', () => {
  it('creates a child logger with bound context', () => {
    const parent = new ConsoleLogger({ service: 'test' });
    const child = parent.child({ component: 'sub' });
    expect(child).toBeDefined();
    expect(child).not.toBe(parent);
  });

  it('logs without throwing', () => {
    const logger = new ConsoleLogger({ service: 'test' });
    expect(() => {
      logger.info('test message');
      logger.warn('warning');
      logger.error('error occurred', new Error('test'));
      logger.debug('debug info');
    }).not.toThrow();
  });
});

describe('NoopMetricsService', () => {
  it('does not throw on any operation', () => {
    const svc = new NoopMetricsService();
    expect(() => {
      svc.increment('test.counter');
      svc.gauge('test.gauge', 42);
      svc.timing('test.timing', 100);
      svc.flush();
    }).not.toThrow();
  });
});
