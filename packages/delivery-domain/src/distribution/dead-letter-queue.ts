// ==========================================================================
// DeadLetterQueue — Failed delivery archive (KEMS-007 §F.7)
// ==========================================================================

import type { DLQEntry, QueueEntry } from './types.js';

function generateId(): string {
  try {
    return (globalThis as unknown as { crypto: { randomUUID: () => string } }).crypto.randomUUID();
  } catch {
    const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${hex()}${hex()}-${hex()}-4${hex().substr(0, 3)}-${hex()}-${hex()}${hex()}${hex()}`;
  }
}

export class DeadLetterQueue {
  private entries: Map<string, DLQEntry> = new Map();

  /** Move a failed queue entry to the DLQ */
  moveToDLQ(queueEntry: QueueEntry, failureReason: string): DLQEntry {
    const id = generateId();
    const now = new Date().toISOString();
    const dlqEntry: DLQEntry = {
      id,
      artifactId: queueEntry.artifactId,
      channelId: queueEntry.channelId,
      recipientId: queueEntry.recipientId,
      failureReason,
      failedAt: now,
      attemptNumber: queueEntry.attemptNumber,
      movedToDLQAt: now,
      originalEntryId: queueEntry.id,
    };
    this.entries.set(id, dlqEntry);
    return dlqEntry;
  }

  /** Get all DLQ entries */
  listAll(): DLQEntry[] {
    return [...this.entries.values()];
  }

  /** Get a specific DLQ entry */
  getEntry(entryId: string): DLQEntry | undefined {
    return this.entries.get(entryId);
  }

  /** Remove an entry from the DLQ */
  remove(entryId: string): void {
    this.entries.delete(entryId);
  }

  /** Number of entries in the DLQ */
  get size(): number {
    return this.entries.size;
  }

  /** Clear all entries */
  clear(): void {
    this.entries.clear();
  }
}
