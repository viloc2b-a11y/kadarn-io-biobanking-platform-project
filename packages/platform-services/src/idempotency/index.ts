// ==========================================================================
// Idempotency Service — Prevent duplicate request processing
// ==========================================================================

export interface IdempotencyService {
  /** Check if a key has been processed. Returns false if already exists. */
  tryProcess(key: string, ttlMs?: number): Promise<boolean>;

  /** Mark a key as processed */
  markProcessed(key: string, ttlMs?: number): Promise<void>;

  /** Check if a key exists without claiming it */
  exists(key: string): Promise<boolean>;

  /** Clear expired keys */
  cleanup(): Promise<void>;
}

/** In-memory implementation (development default) */
export class InMemoryIdempotencyService implements IdempotencyService {
  private store = new Map<string, number>();

  async tryProcess(key: string, ttlMs = 86_400_000): Promise<boolean> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing > now) {
      return false;
    }

    this.store.set(key, now + ttlMs);
    return true;
  }

  async markProcessed(key: string, ttlMs = 86_400_000): Promise<void> {
    this.store.set(key, Date.now() + ttlMs);
  }

  async exists(key: string): Promise<boolean> {
    const expiry = this.store.get(key);
    if (!expiry) return false;
    if (expiry < Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, expiry] of this.store.entries()) {
      if (expiry < now) this.store.delete(key);
    }
  }
}
