// ==========================================================================
// Retry Strategies — Exponential, Fixed, NoRetry (KEMS-007 §F.3)
// ==========================================================================

export interface RetryStrategy {
  /** Calculate the delay in milliseconds before the next attempt */
  nextDelay(attemptNumber: number): number;
  /** Maximum number of attempts before moving to DLQ */
  readonly maxAttempts: number;
}

// --- Exponential Backoff ---
// delay = min(baseDelay * multiplier^(attemptNumber - 1), maxDelay)

export class ExponentialBackoff implements RetryStrategy {
  readonly maxAttempts: number;
  private baseDelay: number;
  private multiplier: number;
  private maxDelay: number;

  constructor(options?: {
    maxAttempts?: number;
    baseDelay?: number;
    multiplier?: number;
    maxDelay?: number;
  }) {
    this.maxAttempts = options?.maxAttempts ?? 5;
    this.baseDelay = options?.baseDelay ?? 1000;
    this.multiplier = options?.multiplier ?? 2;
    this.maxDelay = options?.maxDelay ?? 60000;
  }

  nextDelay(attemptNumber: number): number {
    if (attemptNumber < 1) {
      throw new Error(`attemptNumber must be >= 1, got ${attemptNumber}`);
    }
    const delay = this.baseDelay * Math.pow(this.multiplier, attemptNumber - 1);
    return Math.min(delay, this.maxDelay);
  }
}

// --- Fixed Backoff ---
// Always the same delay regardless of attempt number

export class FixedBackoff implements RetryStrategy {
  readonly maxAttempts: number;
  private delay: number;

  constructor(options?: { maxAttempts?: number; delay?: number }) {
    this.maxAttempts = options?.maxAttempts ?? 3;
    this.delay = options?.delay ?? 5000;
  }

  nextDelay(_attemptNumber: number): number {
    return this.delay;
  }
}

// --- No Retry ---
// Fails immediately — single attempt only

export class NoRetry implements RetryStrategy {
  readonly maxAttempts = 1;

  nextDelay(_attemptNumber: number): number {
    return 0;
  }
}
