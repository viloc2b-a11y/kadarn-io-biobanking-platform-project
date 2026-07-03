// ==========================================================================
// DeliveryQueue — In-memory FIFO queue with status lifecycle (KEMS-007 §F.2)
// ==========================================================================

import type { DeliveryArtifactId, DeliveryChannelId, DeliveryRecipientId } from '../value-objects/ids.js';
import type { QueueEntry, QueueStatus } from './types.js';
import { createDeliveryArtifactId } from '../value-objects/ids.js';

function uuid(): string {
  // Simple UUID v4 generator — deterministic enough for in-memory use
  const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${hex()}${hex()}-${hex()}-4${hex().substr(0, 3)}-${hex()}-${hex()}${hex()}${hex()}`;
}

// Use crypto.randomUUID when available, fallback to simple generator
function generateId(): string {
  try {
    return (globalThis as unknown as { crypto: { randomUUID: () => string } }).crypto.randomUUID();
  } catch {
    return uuid();
  }
}

export class DeliveryQueue {
  private entries: Map<string, QueueEntry> = new Map();
  private order: string[] = [];

  /** Add an entry to the queue */
  enqueue(
    artifactId: DeliveryArtifactId,
    channelId: DeliveryChannelId,
    recipientId: DeliveryRecipientId,
  ): QueueEntry {
    const id = generateId();
    const entry: QueueEntry = {
      id,
      artifactId,
      channelId,
      recipientId,
      status: 'pending',
      attemptNumber: 1,
      lastAttemptAt: null,
      nextAttemptAt: null,
      lastError: null,
      createdAt: new Date().toISOString(),
    };
    this.entries.set(id, entry);
    this.order.push(id);
    return entry;
  }

  /** Get the next pending entry ready for processing (FIFO) */
  dequeue(): QueueEntry | undefined {
    const now = new Date().toISOString();
    const idx = this.order.findIndex((id) => {
      const entry = this.entries.get(id);
      if (!entry) return false;
      if (entry.status !== 'pending') return false;
      if (entry.nextAttemptAt && entry.nextAttemptAt > now) return false;
      return true;
    });

    if (idx === -1) return undefined;

    const id = this.order[idx];
    const entry = this.entries.get(id)!;
    entry.status = 'processing';
    return entry;
  }

  /** Peek at the next pending entry without dequeueing */
  peek(): QueueEntry | undefined {
    const now = new Date().toISOString();
    for (const id of this.order) {
      const entry = this.entries.get(id);
      if (!entry) continue;
      if (entry.status !== 'pending') continue;
      if (entry.nextAttemptAt && entry.nextAttemptAt > now) continue;
      return entry;
    }
    return undefined;
  }

  /** Mark an entry as completed */
  markCompleted(entryId: string): void {
    const entry = this.entries.get(entryId);
    if (entry) {
      entry.status = 'completed';
    }
  }

  /** Mark an entry as failed, scheduling retry */
  markFailed(entryId: string, error: string, nextAttemptAt: string): void {
    const entry = this.entries.get(entryId);
    if (entry) {
      entry.status = 'pending';
      entry.attemptNumber += 1;
      entry.lastAttemptAt = new Date().toISOString();
      entry.nextAttemptAt = nextAttemptAt;
      entry.lastError = error;
    }
  }

  /** Get an entry by id */
  getEntry(entryId: string): QueueEntry | undefined {
    return this.entries.get(entryId);
  }

  /** Remove an entry from the queue */
  remove(entryId: string): void {
    this.entries.delete(entryId);
    this.order = this.order.filter((id) => id !== entryId);
  }

  /** Number of entries in the queue */
  get size(): number {
    return this.entries.size;
  }

  /** Number of pending entries ready for processing */
  get pendingCount(): number {
    const now = new Date().toISOString();
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.status !== 'pending') continue;
      if (entry.nextAttemptAt && entry.nextAttemptAt > now) continue;
      count++;
    }
    return count;
  }

  /** List all entries */
  listAll(): QueueEntry[] {
    return [...this.entries.values()];
  }

  /** List entries by status */
  listByStatus(status: QueueStatus): QueueEntry[] {
    return [...this.entries.values()].filter((e) => e.status === status);
  }

  /** Clear all entries */
  clear(): void {
    this.entries.clear();
    this.order = [];
  }
}
