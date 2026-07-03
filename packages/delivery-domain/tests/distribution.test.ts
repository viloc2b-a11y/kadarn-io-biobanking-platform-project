// ==========================================================================
// Sprint 9.7 — Distribution Layer Tests
// Queue, Retry, DLQ, Idempotency, DistributionLayer — Failure Simulation
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DeliveryQueue,
  DeadLetterQueue,
  IdempotencyRegistry,
  ExponentialBackoff,
  FixedBackoff,
  NoRetry,
  DistributionLayer,
} from '../src/distribution/index.js';
import { createDeliveryArtifactId, createDeliveryChannelId, createDeliveryRecipientId } from '../src/value-objects/ids.js';
import type { QueueEntry, DLQEntry } from '../src/distribution/types.js';

// --- Helpers ---
const makeArtifactId = () => createDeliveryArtifactId();
const makeChannelId = () => createDeliveryChannelId();
const makeRecipientId = () => createDeliveryRecipientId();

// ==========================================================================
// DeliveryQueue
// ==========================================================================
describe('DeliveryQueue', () => {
  let queue: DeliveryQueue;

  beforeEach(() => {
    queue = new DeliveryQueue();
  });

  it('enqueue creates entry with status pending', () => {
    const entry = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    expect(entry.status).toBe('pending');
    expect(entry.attemptNumber).toBe(1);
    expect(entry.id).toBeTruthy();
    expect(entry.createdAt).toBeTruthy();
    expect(entry.lastAttemptAt).toBeNull();
    expect(entry.nextAttemptAt).toBeNull();
    expect(entry.lastError).toBeNull();
  });

  it('enqueue adds to FIFO order', () => {
    const e1 = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const e2 = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const e3 = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());

    const d1 = queue.dequeue();
    const d2 = queue.dequeue();
    const d3 = queue.dequeue();

    expect(d1!.id).toBe(e1.id);
    expect(d2!.id).toBe(e2.id);
    expect(d3!.id).toBe(e3.id);
  });

  it('dequeue returns first pending entry', () => {
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const entry = queue.dequeue();
    expect(entry).toBeDefined();
    expect(entry!.status).toBe('processing');
  });

  it('dequeue changes status to processing', () => {
    const e = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const dequeued = queue.dequeue();
    expect(dequeued!.status).toBe('processing');
    // Verify original entry was mutated
    expect(queue.getEntry(e.id)!.status).toBe('processing');
  });

  it('dequeue returns undefined when empty', () => {
    expect(queue.dequeue()).toBeUndefined();
  });

  it('dequeue skips entries with future nextAttemptAt', () => {
    const future = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
    const e = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    // Manually set the nextAttemptAt to future — we bypass markFailed for direct mutation
    e.nextAttemptAt = future;

    // Dequeue should skip it
    expect(queue.dequeue()).toBeUndefined();

    // Clear nextAttemptAt and should dequeue
    e.nextAttemptAt = null;
    const d = queue.dequeue();
    expect(d!.id).toBe(e.id);
  });

  it('peek returns entry without changing status', () => {
    const e = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const peeked = queue.peek();
    expect(peeked!.id).toBe(e.id);
    expect(queue.getEntry(e.id)!.status).toBe('pending');
  });

  it('peek returns undefined when empty', () => {
    expect(queue.peek()).toBeUndefined();
  });

  it('markCompleted sets status to completed', () => {
    const e = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    queue.markCompleted(e.id);
    expect(queue.getEntry(e.id)!.status).toBe('completed');
  });

  it('markFailed increments attemptNumber and sets nextAttemptAt', () => {
    const e = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const nextAttempt = new Date(Date.now() + 2000).toISOString();
    queue.markFailed(e.id, 'test error', nextAttempt);
    const updated = queue.getEntry(e.id)!;
    expect(updated.attemptNumber).toBe(2);
    expect(updated.lastError).toBe('test error');
    expect(updated.nextAttemptAt).toBe(nextAttempt);
    expect(updated.status).toBe('pending'); // ready for retry
    expect(updated.lastAttemptAt).toBeTruthy();
  });

  it('size returns correct count', () => {
    expect(queue.size).toBe(0);
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    expect(queue.size).toBe(2);
  });

  it('pendingCount returns correct count', () => {
    expect(queue.pendingCount).toBe(0);
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    expect(queue.pendingCount).toBe(2);

    // Dequeue one → processing, not pending
    queue.dequeue();
    expect(queue.pendingCount).toBe(1);
  });

  it('pendingCount skips entries with future nextAttemptAt', () => {
    const e = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const future = new Date(Date.now() + 3600000).toISOString();
    queue.markFailed(e.id, 'error', future);
    // The entry is now 'pending' but has future nextAttemptAt
    expect(queue.pendingCount).toBe(0);
  });

  it('getEntry returns correct entry', () => {
    const e = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const found = queue.getEntry(e.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(e.id);
  });

  it('getEntry returns undefined for unknown id', () => {
    expect(queue.getEntry('nonexistent')).toBeUndefined();
  });

  it('remove deletes entry', () => {
    const e = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    expect(queue.size).toBe(1);
    queue.remove(e.id);
    expect(queue.size).toBe(0);
    expect(queue.getEntry(e.id)).toBeUndefined();
  });

  it('listAll returns all entries', () => {
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    expect(queue.listAll()).toHaveLength(2);
  });

  it('listByStatus filters correctly', () => {
    const e1 = queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    queue.markCompleted(e1.id);

    expect(queue.listByStatus('pending')).toHaveLength(1);
    expect(queue.listByStatus('completed')).toHaveLength(1);
    expect(queue.listByStatus('processing')).toHaveLength(0);
  });

  it('clear removes all entries', () => {
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    queue.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    queue.clear();
    expect(queue.size).toBe(0);
    expect(queue.dequeue()).toBeUndefined();
  });
});

// ==========================================================================
// DeadLetterQueue
// ==========================================================================
describe('DeadLetterQueue', () => {
  let dlq: DeadLetterQueue;

  beforeEach(() => {
    dlq = new DeadLetterQueue();
  });

  it('moveToDLQ preserves original entry data', () => {
    const qEntry: QueueEntry = {
      id: 'qe-1',
      artifactId: makeArtifactId(),
      channelId: makeChannelId(),
      recipientId: makeRecipientId(),
      status: 'failed',
      attemptNumber: 3,
      lastAttemptAt: new Date().toISOString(),
      nextAttemptAt: null,
      lastError: 'connection refused',
      createdAt: new Date().toISOString(),
    };

    const dlqEntry = dlq.moveToDLQ(qEntry, 'max retries exceeded');
    expect(dlqEntry.artifactId).toBe(qEntry.artifactId);
    expect(dlqEntry.channelId).toBe(qEntry.channelId);
    expect(dlqEntry.recipientId).toBe(qEntry.recipientId);
    expect(dlqEntry.originalEntryId).toBe(qEntry.id);
    expect(dlqEntry.attemptNumber).toBe(3);
  });

  it('moveToDLQ sets failureReason and timestamps', () => {
    const qEntry: QueueEntry = {
      id: 'qe-2',
      artifactId: makeArtifactId(),
      channelId: makeChannelId(),
      recipientId: makeRecipientId(),
      status: 'failed',
      attemptNumber: 5,
      lastAttemptAt: new Date().toISOString(),
      nextAttemptAt: null,
      lastError: 'timeout',
      createdAt: new Date().toISOString(),
    };

    const dlqEntry = dlq.moveToDLQ(qEntry, 'all retries exhausted');
    expect(dlqEntry.failureReason).toBe('all retries exhausted');
    expect(dlqEntry.movedToDLQAt).toBeTruthy();
    expect(dlqEntry.failedAt).toBeTruthy();
  });

  it('listAll returns all DLQ entries', () => {
    const qEntry: QueueEntry = {
      id: 'qe-3',
      artifactId: makeArtifactId(),
      channelId: makeChannelId(),
      recipientId: makeRecipientId(),
      status: 'failed',
      attemptNumber: 5,
      lastAttemptAt: new Date().toISOString(),
      nextAttemptAt: null,
      lastError: 'timeout',
      createdAt: new Date().toISOString(),
    };

    dlq.moveToDLQ(qEntry, 'fail 1');
    dlq.moveToDLQ(qEntry, 'fail 2');
    expect(dlq.listAll()).toHaveLength(2);
  });

  it('getEntry returns correct DLQ entry', () => {
    const qEntry: QueueEntry = {
      id: 'qe-4',
      artifactId: makeArtifactId(),
      channelId: makeChannelId(),
      recipientId: makeRecipientId(),
      status: 'failed',
      attemptNumber: 2,
      lastAttemptAt: new Date().toISOString(),
      nextAttemptAt: null,
      lastError: 'error',
      createdAt: new Date().toISOString(),
    };

    const dlqEntry = dlq.moveToDLQ(qEntry, 'test');
    const found = dlq.getEntry(dlqEntry.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(dlqEntry.id);
  });

  it('getEntry returns undefined for unknown id', () => {
    expect(dlq.getEntry('unknown')).toBeUndefined();
  });

  it('remove removes entry', () => {
    const qEntry: QueueEntry = {
      id: 'qe-5',
      artifactId: makeArtifactId(),
      channelId: makeChannelId(),
      recipientId: makeRecipientId(),
      status: 'failed',
      attemptNumber: 3,
      lastAttemptAt: new Date().toISOString(),
      nextAttemptAt: null,
      lastError: 'error',
      createdAt: new Date().toISOString(),
    };

    const dlqEntry = dlq.moveToDLQ(qEntry, 'test');
    expect(dlq.size).toBe(1);
    dlq.remove(dlqEntry.id);
    expect(dlq.size).toBe(0);
  });

  it('size reflects correct count', () => {
    const qEntry: QueueEntry = {
      id: 'qe-6',
      artifactId: makeArtifactId(),
      channelId: makeChannelId(),
      recipientId: makeRecipientId(),
      status: 'failed',
      attemptNumber: 1,
      lastAttemptAt: null,
      nextAttemptAt: null,
      lastError: null,
      createdAt: new Date().toISOString(),
    };

    expect(dlq.size).toBe(0);
    dlq.moveToDLQ(qEntry, 'fail');
    expect(dlq.size).toBe(1);
  });

  it('clear removes all entries', () => {
    const qEntry: QueueEntry = {
      id: 'qe-7',
      artifactId: makeArtifactId(),
      channelId: makeChannelId(),
      recipientId: makeRecipientId(),
      status: 'failed',
      attemptNumber: 1,
      lastAttemptAt: null,
      nextAttemptAt: null,
      lastError: null,
      createdAt: new Date().toISOString(),
    };

    dlq.moveToDLQ(qEntry, 'fail');
    dlq.moveToDLQ(qEntry, 'fail');
    dlq.clear();
    expect(dlq.size).toBe(0);
  });
});

// ==========================================================================
// Retry Strategies
// ==========================================================================
describe('ExponentialBackoff', () => {
  it('attempt 1 → baseDelay', () => {
    const backoff = new ExponentialBackoff({ baseDelay: 1000, multiplier: 2, maxAttempts: 5 });
    expect(backoff.nextDelay(1)).toBe(1000);
  });

  it('attempt 2 → baseDelay * multiplier', () => {
    const backoff = new ExponentialBackoff({ baseDelay: 1000, multiplier: 2, maxAttempts: 5 });
    expect(backoff.nextDelay(2)).toBe(2000);
  });

  it('attempt 3 → baseDelay * multiplier^2', () => {
    const backoff = new ExponentialBackoff({ baseDelay: 1000, multiplier: 2, maxAttempts: 5 });
    expect(backoff.nextDelay(3)).toBe(4000);
  });

  it('attempt 4 → baseDelay * multiplier^3', () => {
    const backoff = new ExponentialBackoff({ baseDelay: 1000, multiplier: 2, maxAttempts: 5 });
    expect(backoff.nextDelay(4)).toBe(8000);
  });

  it('attempt 5 → baseDelay * multiplier^4', () => {
    const backoff = new ExponentialBackoff({ baseDelay: 1000, multiplier: 2, maxAttempts: 5 });
    expect(backoff.nextDelay(5)).toBe(16000);
  });

  it('capped at maxDelay', () => {
    const backoff = new ExponentialBackoff({ baseDelay: 50000, multiplier: 2, maxDelay: 60000, maxAttempts: 3 });
    expect(backoff.nextDelay(2)).toBe(60000); // 50000 * 2 = 100000 → capped at 60000
  });

  it('custom multiplier works', () => {
    const backoff = new ExponentialBackoff({ baseDelay: 500, multiplier: 3, maxAttempts: 3 });
    expect(backoff.nextDelay(1)).toBe(500);
    expect(backoff.nextDelay(2)).toBe(1500);
    expect(backoff.nextDelay(3)).toBe(4500);
  });

  it('custom maxAttempts stored', () => {
    const backoff = new ExponentialBackoff({ maxAttempts: 3 });
    expect(backoff.maxAttempts).toBe(3);
  });

  it('throws on attemptNumber < 1', () => {
    const backoff = new ExponentialBackoff();
    expect(() => backoff.nextDelay(0)).toThrow('attemptNumber must be >= 1');
    expect(() => backoff.nextDelay(-1)).toThrow('attemptNumber must be >= 1');
  });
});

describe('FixedBackoff', () => {
  it('always returns same delay', () => {
    const backoff = new FixedBackoff({ delay: 5000, maxAttempts: 3 });
    expect(backoff.nextDelay(1)).toBe(5000);
    expect(backoff.nextDelay(2)).toBe(5000);
    expect(backoff.nextDelay(3)).toBe(5000);
  });

  it('default delay is 5000ms', () => {
    const backoff = new FixedBackoff();
    expect(backoff.nextDelay(1)).toBe(5000);
  });

  it('default maxAttempts is 3', () => {
    const backoff = new FixedBackoff();
    expect(backoff.maxAttempts).toBe(3);
  });
});

describe('NoRetry', () => {
  it('maxAttempts = 1', () => {
    const backoff = new NoRetry();
    expect(backoff.maxAttempts).toBe(1);
  });

  it('delay is 0', () => {
    const backoff = new NoRetry();
    expect(backoff.nextDelay(1)).toBe(0);
  });
});

// ==========================================================================
// IdempotencyRegistry
// ==========================================================================
describe('IdempotencyRegistry', () => {
  let registry: IdempotencyRegistry;

  beforeEach(() => {
    registry = new IdempotencyRegistry();
  });

  it('isDuplicate returns false for new key', () => {
    expect(registry.isDuplicate(makeArtifactId(), makeChannelId(), makeRecipientId())).toBe(false);
  });

  it('isDuplicate returns true after markDelivered', () => {
    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    expect(registry.isDuplicate(aid, cid, rid)).toBe(false);
    registry.markDelivered(aid, cid, rid);
    expect(registry.isDuplicate(aid, cid, rid)).toBe(true);
  });

  it('markDelivered adds key', () => {
    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    registry.markDelivered(aid, cid, rid);
    const key = IdempotencyRegistry.buildKey(aid, cid, rid);
    expect(registry.has(key)).toBe(true);
  });

  it('removeKey removes key', () => {
    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    registry.markDelivered(aid, cid, rid);
    const key = IdempotencyRegistry.buildKey(aid, cid, rid);
    registry.removeKey(key);
    expect(registry.has(key)).toBe(false);
    expect(registry.isDuplicate(aid, cid, rid)).toBe(false);
  });

  it('has returns correct value', () => {
    expect(registry.has('some-key')).toBe(false);
    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();
    registry.markDelivered(aid, cid, rid);
    const key = IdempotencyRegistry.buildKey(aid, cid, rid);
    expect(registry.has(key)).toBe(true);
  });

  it('different artifact/channel/recipient combinations are distinct keys', () => {
    const aid1 = makeArtifactId();
    const aid2 = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    registry.markDelivered(aid1, cid, rid);
    expect(registry.isDuplicate(aid1, cid, rid)).toBe(true);
    expect(registry.isDuplicate(aid2, cid, rid)).toBe(false);
  });

  it('size reflects count', () => {
    expect(registry.size).toBe(0);
    registry.markDelivered(makeArtifactId(), makeChannelId(), makeRecipientId());
    expect(registry.size).toBe(1);
    registry.markDelivered(makeArtifactId(), makeChannelId(), makeRecipientId());
    expect(registry.size).toBe(2);
  });

  it('clear removes all keys', () => {
    registry.markDelivered(makeArtifactId(), makeChannelId(), makeRecipientId());
    registry.markDelivered(makeArtifactId(), makeChannelId(), makeRecipientId());
    registry.clear();
    expect(registry.size).toBe(0);
  });
});

// ==========================================================================
// DistributionLayer — Integration & Failure Simulation
// ==========================================================================
describe('DistributionLayer', () => {
  let layer: DistributionLayer;

  beforeEach(() => {
    layer = new DistributionLayer();
  });

  // --- Basic operations ---
  it('processNext with empty queue → empty', () => {
    const result = layer.processNext();
    expect(result.type).toBe('empty');
  });

  it('processNext delivers entry when no failure injected', () => {
    layer.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const result = layer.processNext();
    expect(result.type).toBe('delivered');
    expect(result.entry).toBeDefined();
    expect(layer.getQueueSize()).toBe(1); // entry stays (completed), not removed
  });

  it('processNext marks entry as completed after delivery', () => {
    const entry = layer.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    layer.processNext();
    const qEntry = layer.getQueue().getEntry(entry.id)!;
    expect(qEntry.status).toBe('completed');
  });

  // --- Idempotency ---
  it('idempotency: second delivery of same combination detected as duplicate', () => {
    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    layer.enqueue(aid, cid, rid);
    layer.processNext(); // first delivery

    layer.enqueue(aid, cid, rid);
    const result = layer.processNext(); // duplicate detected
    expect(result.type).toBe('delivered'); // not an error, just skipped
  });

  // --- Failure injection ---
  it('failure injector: entry fails → retry scheduled', () => {
    layer.setFailureInjector(() => new Error('connection refused'));

    const entry = layer.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const result = layer.processNext();

    expect(result.type).toBe('retry');
    expect(result.error).toContain('connection refused');
    expect(result.nextAttemptAt).toBeTruthy();

    // Entry should be back to 'pending' with incremented attempt
    const updated = layer.getQueue().getEntry(entry.id)!;
    expect(updated.status).toBe('pending');
    expect(updated.attemptNumber).toBe(2);
  });

  it('retry: failed entry gets nextAttemptAt in the future', () => {
    layer.setFailureInjector(() => new Error('fail'));

    layer.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const result = layer.processNext();

    expect(result.nextAttemptAt).toBeTruthy();
    const nextAttempt = new Date(result.nextAttemptAt!).getTime();
    const now = Date.now();
    expect(nextAttempt).toBeGreaterThanOrEqual(now); // should be in the future
  });

  it('max attempts exceeded → entry moves to DLQ', () => {
    const backoff = new ExponentialBackoff({ maxAttempts: 3, baseDelay: 10 });
    const layer2 = new DistributionLayer({ retryStrategy: backoff });
    layer2.setFailureInjector(() => new Error('persistent failure'));

    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    layer2.enqueue(aid, cid, rid);

    // Attempt 1
    const r1 = layer2.processNext();
    expect(r1.type).toBe('retry');

    // Attempt 2 — need to wait for nextAttemptAt to pass (should be small delay)
    // Force dequeue by making the entry's nextAttemptAt null
    const entries = layer2.getQueueEntries();
    entries[0].nextAttemptAt = null;

    const r2 = layer2.processNext();
    expect(r2.type).toBe('retry');

    // Attempt 3 (max) — should move to DLQ
    entries[0].nextAttemptAt = null;
    const r3 = layer2.processNext();
    expect(r3.type).toBe('failed');
    expect(layer2.getDLQSize()).toBe(1);
    expect(layer2.getQueueSize()).toBe(0); // removed from main queue
  });

  it('DLQ entry has failureReason and attempt history', () => {
    layer.setFailureInjector(() => new Error('network timeout'));

    layer.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());

    // Process through all 5 retries (default ExponentialBackoff)
    for (let i = 0; i < 5; i++) {
      const entries = layer.getQueueEntries();
      if (entries.length === 0) break;
      entries[0].nextAttemptAt = null;
      layer.processNext();
    }

    const dlqEntries = layer.getDLQEntries();
    expect(dlqEntries).toHaveLength(1);
    expect(dlqEntries[0].failureReason).toContain('network timeout');
    expect(dlqEntries[0].attemptNumber).toBeGreaterThanOrEqual(5);
    expect(dlqEntries[0].movedToDLQAt).toBeTruthy();
    expect(dlqEntries[0].originalEntryId).toBeTruthy();
  });

  it('replay from DLQ: entry moves back to main queue with reset attempts', () => {
    layer.setFailureInjector(() => new Error('fail'));

    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    layer.enqueue(aid, cid, rid);

    // Exhaust retries to move to DLQ
    for (let i = 0; i < 5; i++) {
      const entries = layer.getQueueEntries();
      if (entries.length === 0) break;
      entries[0].nextAttemptAt = null;
      layer.processNext();
    }

    expect(layer.getDLQSize()).toBe(1);

    const dlqEntries = layer.getDLQEntries();
    const newEntry = layer.replay(dlqEntries[0].id);

    // Should be back in main queue
    expect(layer.getDLQSize()).toBe(0);
    expect(layer.getQueueSize()).toBe(1);
    expect(newEntry.attemptNumber).toBe(1); // reset
    expect(newEntry.artifactId).toBe(aid);
    expect(newEntry.channelId).toBe(cid);
    expect(newEntry.recipientId).toBe(rid);
  });

  it('replay clears idempotency key', () => {
    layer.setFailureInjector(() => new Error('fail'));

    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    layer.enqueue(aid, cid, rid);

    // Exhaust retries to move to DLQ
    for (let i = 0; i < 5; i++) {
      const entries = layer.getQueueEntries();
      if (entries.length === 0) break;
      entries[0].nextAttemptAt = null;
      layer.processNext();
    }

    // Before replay, idempotency should NOT be set (delivery failed)
    // After replay and successful delivery, idempotency should be set
    const dlqEntries = layer.getDLQEntries();
    layer.replay(dlqEntries[0].id);

    // Remove failure injector and process
    layer.setFailureInjector(null);
    layer.processNext();

    expect(layer.getIdempotency().isDuplicate(aid, cid, rid)).toBe(true);
  });

  it('replaying non-existent DLQ entry throws', () => {
    expect(() => layer.replay('nonexistent')).toThrow('DLQ entry not found');
  });

  it('multiple entries processed in FIFO order', () => {
    const e1 = layer.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const e2 = layer.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    const e3 = layer.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());

    const r1 = layer.processNext();
    const r2 = layer.processNext();
    const r3 = layer.processNext();

    expect(r1.entry!.id).toBe(e1.id);
    expect(r2.entry!.id).toBe(e2.id);
    expect(r3.entry!.id).toBe(e3.id);
  });

  it('queue and DLQ sizes reflect state correctly', () => {
    expect(layer.getQueueSize()).toBe(0);
    expect(layer.getDLQSize()).toBe(0);

    layer.enqueue(makeArtifactId(), makeChannelId(), makeRecipientId());
    expect(layer.getQueueSize()).toBe(1);

    layer.processNext();
    expect(layer.getQueueSize()).toBe(1); // completed, not removed
    expect(layer.getDLQSize()).toBe(0);
  });

  // --- Full Failure Simulation Walkthrough ---
  it('full walkthrough: enqueue → fail retries → DLQ → replay → deliver', () => {
    const backoff = new ExponentialBackoff({ maxAttempts: 3, baseDelay: 10 });
    const simLayer = new DistributionLayer({ retryStrategy: backoff });
    simLayer.setFailureInjector(() => new Error('network error'));

    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    // 1. Enqueue
    const entry = simLayer.enqueue(aid, cid, rid);
    expect(simLayer.getQueueSize()).toBe(1);
    expect(entry.status).toBe('pending');

    // 2. Process → fail → retry (x3 until DLQ)
    for (let i = 0; i < 3; i++) {
      const entries = simLayer.getQueueEntries();
      if (entries.length === 0) break;
      entries[0].nextAttemptAt = null;
      simLayer.processNext();
    }

    // 3. Should be in DLQ now
    expect(simLayer.getDLQSize()).toBe(1);
    expect(simLayer.getQueueSize()).toBe(0);

    const dlqEntry = simLayer.getDLQEntries()[0];
    expect(dlqEntry.failureReason).toContain('network error');
    expect(dlqEntry.attemptNumber).toBeGreaterThanOrEqual(3);

    // 4. Replay from DLQ
    const newEntry = simLayer.replay(dlqEntry.id);
    expect(simLayer.getDLQSize()).toBe(0);
    expect(simLayer.getQueueSize()).toBe(1);
    expect(newEntry.attemptNumber).toBe(1);

    // 5. Remove failure injector and deliver
    simLayer.setFailureInjector(null);
    const result = simLayer.processNext();
    expect(result.type).toBe('delivered');

    // 6. Verify idempotency
    expect(simLayer.getIdempotency().isDuplicate(aid, cid, rid)).toBe(true);
  });

  it('edge case: empty DLQ size is 0', () => {
    expect(layer.getDLQSize()).toBe(0);
  });

  it('edge case: failed entry preserves original artifactId/channelId/recipientId in DLQ', () => {
    layer.setFailureInjector(() => new Error('fail'));

    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    layer.enqueue(aid, cid, rid);

    // Exhaust retries
    for (let i = 0; i < 5; i++) {
      const entries = layer.getQueueEntries();
      if (entries.length === 0) break;
      entries[0].nextAttemptAt = null;
      layer.processNext();
    }

    const dlqEntry = layer.getDLQEntries()[0];
    expect(dlqEntry.artifactId).toBe(aid);
    expect(dlqEntry.channelId).toBe(cid);
    expect(dlqEntry.recipientId).toBe(rid);
  });

  it('getRetryStrategy returns the strategy', () => {
    const backoff = new FixedBackoff({ maxAttempts: 3, delay: 2000 });
    const layer2 = new DistributionLayer({ retryStrategy: backoff });
    expect(layer2.getRetryStrategy()).toBe(backoff);
  });

  it('default retry strategy is ExponentialBackoff', () => {
    const strat = layer.getRetryStrategy();
    expect(strat).toBeInstanceOf(ExponentialBackoff);
    expect(strat.maxAttempts).toBe(5);
  });

  it('processNext skips entry when idempotency registered and still processes it as delivered', () => {
    const aid = makeArtifactId();
    const cid = makeChannelId();
    const rid = makeRecipientId();

    // Pre-register idempotency
    layer.getIdempotency().markDelivered(aid, cid, rid);

    layer.enqueue(aid, cid, rid);
    const result = layer.processNext();
    expect(result.type).toBe('delivered'); // treated as duplicate, marks completed
  });
});
