// ==========================================================================
// Connector Framework — Idempotency Checker
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
// Deduplicates by sourceRecordId across all connectors.
// ==========================================================================

export interface IdempotencyStore {
  isImported(sourceRecordId: string): Promise<boolean>;
  markImported(sourceRecordId: string): Promise<void>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private imported: Set<string> = new Set();

  async isImported(sourceRecordId: string): Promise<boolean> {
    return this.imported.has(sourceRecordId);
  }

  async markImported(sourceRecordId: string): Promise<void> {
    this.imported.add(sourceRecordId);
  }
}
