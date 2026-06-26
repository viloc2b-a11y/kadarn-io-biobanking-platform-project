// ==========================================================================
// Rate Limiting — Per-organization rate limits
// ==========================================================================

export interface RateLimitRule {
  key: string; // e.g. 'api:organizations:create'
  organizationId?: string;
  maxRequests: number;
  windowMs: number; // sliding window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // timestamp
  retryAfterMs?: number;
}

export interface RateLimitingService {
  /** Check if a request is allowed */
  check(key: string, organizationId: string, maxRequests?: number, windowMs?: number): Promise<RateLimitResult>;

  /** Register a custom rate limit rule */
  registerRule(rule: RateLimitRule): Promise<void>;

  /** Get current rate limit status for a key */
  getStatus(key: string, organizationId: string): Promise<RateLimitResult>;

  /** Reset rate limits for testing */
  reset(key?: string, organizationId?: string): Promise<void>;
}
