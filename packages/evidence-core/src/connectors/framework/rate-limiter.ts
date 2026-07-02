// ==========================================================================
// Connector Framework — Rate Limiter
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
// ==========================================================================

export interface RateLimitConfig {
  requestsPerSecond: number;
  burstSize: number;
}

export const SOURCE_RATE_LIMITS: Record<string, RateLimitConfig> = {
  clinicaltrials: { requestsPerSecond: 10, burstSize: 20 },
  pubmed: { requestsPerSecond: 5, burstSize: 10 },
  fda: { requestsPerSecond: 30, burstSize: 50 },
  default: { requestsPerSecond: 10, burstSize: 20 },
};

export class RateLimiter {
  private queue: Array<{ resolve: () => void; timestamp: number }> = [];
  private config: RateLimitConfig;
  private tokens: number;
  private lastRefill: number;

  constructor(source: string) {
    this.config = SOURCE_RATE_LIMITS[source] ?? SOURCE_RATE_LIMITS.default;
    this.tokens = this.config.burstSize;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    return new Promise(resolve => {
      this.queue.push({ resolve, timestamp: Date.now() });
    });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.config.burstSize, this.tokens + elapsed * this.config.requestsPerSecond);
    this.lastRefill = now;

    // Drain queue
    while (this.queue.length > 0 && this.tokens > 0) {
      const item = this.queue.shift()!;
      this.tokens--;
      item.resolve();
    }
  }
}
