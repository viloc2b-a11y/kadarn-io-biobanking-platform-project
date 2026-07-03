// ==========================================================================
// Distribution Layer — barrel export (KEMS-007 §F)
// ==========================================================================

export type {
  QueueStatus,
  QueueEntry,
  DLQEntry,
  ProcessResult,
  IdempotencyKey,
} from './types.js';

export type {
  RetryStrategy,
} from './retry.js';

export {
  ExponentialBackoff,
  FixedBackoff,
  NoRetry,
} from './retry.js';

export { DeliveryQueue } from './delivery-queue.js';
export { DeadLetterQueue } from './dead-letter-queue.js';
export { IdempotencyRegistry } from './idempotency.js';
export { DistributionLayer, type FailureInjector } from './distribution-layer.js';
