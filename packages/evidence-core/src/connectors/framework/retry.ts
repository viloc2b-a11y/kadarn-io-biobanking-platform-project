// ==========================================================================
// Connector Framework — Retry Policy
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
// ==========================================================================

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', '429', '503', '502'],
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isRetryable = policy.retryableErrors.some(e => errMsg.includes(e));

      if (!isRetryable || attempt === policy.maxRetries) {
        throw err;
      }

      const delay = Math.min(policy.baseDelayMs * Math.pow(2, attempt), policy.maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
