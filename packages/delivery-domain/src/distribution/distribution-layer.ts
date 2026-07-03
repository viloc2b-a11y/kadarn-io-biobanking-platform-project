// ==========================================================================
// DistributionLayer — Reliability orchestrator (KEMS-007 §F)
// Queue → Retry → Replay → DLQ → Backoff → Idempotency
// Channel-agnostic — no email, no webhook, no SFTP
// ==========================================================================

import type { DeliveryArtifactId, DeliveryChannelId, DeliveryRecipientId } from '../value-objects/ids.js';
import { DeliveryQueue } from './delivery-queue.js';
import { DeadLetterQueue } from './dead-letter-queue.js';
import { IdempotencyRegistry } from './idempotency.js';
import { ExponentialBackoff, type RetryStrategy } from './retry.js';
import type { QueueEntry, DLQEntry, ProcessResult } from './types.js';

export type FailureInjector = (entry: QueueEntry) => Error | null;

export class DistributionLayer {
  private queue: DeliveryQueue;
  private dlq: DeadLetterQueue;
  private retryStrategy: RetryStrategy;
  private idempotency: IdempotencyRegistry;
  private failureInjector: FailureInjector | null = null;

  constructor(options?: { retryStrategy?: RetryStrategy }) {
    this.queue = new DeliveryQueue();
    this.dlq = new DeadLetterQueue();
    this.retryStrategy = options?.retryStrategy ?? new ExponentialBackoff();
    this.idempotency = new IdempotencyRegistry();
  }

  // --- Public API ---

  /** Enqueue an artifact for delivery */
  enqueue(
    artifactId: DeliveryArtifactId,
    channelId: DeliveryChannelId,
    recipientId: DeliveryRecipientId,
  ): QueueEntry {
    return this.queue.enqueue(artifactId, channelId, recipientId);
  }

  /** Process the next pending entry */
  processNext(): ProcessResult {
    // 1. Dequeue next pending entry
    const entry = this.queue.dequeue();
    if (!entry) {
      return { type: 'empty' };
    }

    // 2. Check idempotency
    if (this.idempotency.isDuplicate(entry.artifactId, entry.channelId, entry.recipientId)) {
      this.queue.markCompleted(entry.id);
      return { type: 'delivered', entry };
    }

    // 3. Simulate delivery (with optional failure injection)
    const injectedError = this.failureInjector ? this.failureInjector(entry) : null;
    if (injectedError) {
      return this.handleFailure(entry, injectedError.message);
    }

    // 4. Success
    this.queue.markCompleted(entry.id);
    this.idempotency.markDelivered(entry.artifactId, entry.channelId, entry.recipientId);
    return { type: 'delivered', entry };
  }

  /** Handle a failed delivery with retry/DLQ logic */
  handleFailure(entry: QueueEntry, error: string): ProcessResult {
    // If max attempts exceeded → move to DLQ
    if (entry.attemptNumber >= this.retryStrategy.maxAttempts) {
      this.dlq.moveToDLQ(entry, error);
      this.queue.remove(entry.id);
      return {
        type: 'failed',
        entry,
        error,
      };
    }

    // Schedule retry with backoff
    const delay = this.retryStrategy.nextDelay(entry.attemptNumber);
    const nextAttemptAt = new Date(Date.now() + delay).toISOString();
    this.queue.markFailed(entry.id, error, nextAttemptAt);

    return {
      type: 'retry',
      entry,
      error,
      nextAttemptAt,
    };
  }

  /** Replay a failed delivery from the DLQ back to the main queue */
  replay(dlqEntryId: string): QueueEntry {
    const dlqEntry = this.dlq.getEntry(dlqEntryId);
    if (!dlqEntry) {
      throw new Error(`DLQ entry not found: ${dlqEntryId}`);
    }

    // Remove from DLQ
    this.dlq.remove(dlqEntryId);

    // Clear idempotency key so delivery can be retried
    const key = IdempotencyRegistry.buildKey(
      dlqEntry.artifactId,
      dlqEntry.channelId,
      dlqEntry.recipientId,
    );
    this.idempotency.removeKey(key);

    // Re-enqueue with fresh state
    const newEntry = this.queue.enqueue(dlqEntry.artifactId, dlqEntry.channelId, dlqEntry.recipientId);
    return newEntry;
  }

  /** Inject failures for testing */
  setFailureInjector(injector: FailureInjector | null): void {
    this.failureInjector = injector;
  }

  // --- Getters ---

  getQueueSize(): number {
    return this.queue.size;
  }

  getDLQSize(): number {
    return this.dlq.size;
  }

  getQueueEntries(): QueueEntry[] {
    return this.queue.listAll();
  }

  getDLQEntries(): DLQEntry[] {
    return this.dlq.listAll();
  }

  getQueue(): DeliveryQueue {
    return this.queue;
  }

  getDLQ(): DeadLetterQueue {
    return this.dlq;
  }

  getIdempotency(): IdempotencyRegistry {
    return this.idempotency;
  }

  getRetryStrategy(): RetryStrategy {
    return this.retryStrategy;
  }
}
