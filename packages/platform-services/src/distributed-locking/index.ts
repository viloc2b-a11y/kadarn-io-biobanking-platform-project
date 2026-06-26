// ==========================================================================
// Distributed Locking — Prevent concurrent resource conflicts
// ==========================================================================

export interface LockOptions {
  ttlMs: number; // time-to-live for the lock
  retryDelayMs?: number;
  maxRetries?: number;
}

export interface DistributedLockingService {
  /** Acquire a lock. Returns a releaser function. */
  acquire(resource: string, owner: string, options?: LockOptions): Promise<() => Promise<void>>;

  /** Try to acquire a lock without blocking. Returns null if not acquired. */
  tryAcquire(resource: string, owner: string, ttlMs: number): Promise<(() => Promise<void>) | null>;

  /** Check if a resource is locked */
  isLocked(resource: string): Promise<boolean>;

  /** Force release a lock (admin only) */
  forceRelease(resource: string): Promise<void>;
}
