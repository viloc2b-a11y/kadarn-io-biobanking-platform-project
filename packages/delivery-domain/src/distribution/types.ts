// ==========================================================================
// Distribution Layer — Core types (KEMS-007 §F)
// Queue, Retry, DLQ, Idempotency — channel-agnostic reliability infrastructure
// ==========================================================================

import type { DeliveryArtifactId, DeliveryChannelId, DeliveryRecipientId } from '../value-objects/ids.js';

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueueEntry {
  readonly id: string;
  readonly artifactId: DeliveryArtifactId;
  readonly channelId: DeliveryChannelId;
  readonly recipientId: DeliveryRecipientId;
  status: QueueStatus;
  attemptNumber: number;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface DLQEntry {
  readonly id: string;
  readonly artifactId: DeliveryArtifactId;
  readonly channelId: DeliveryChannelId;
  readonly recipientId: DeliveryRecipientId;
  readonly failureReason: string;
  readonly failedAt: string;
  readonly attemptNumber: number;
  readonly movedToDLQAt: string;
  readonly originalEntryId: string;
}

export interface ProcessResult {
  type: 'delivered' | 'failed' | 'empty' | 'retry';
  entry?: QueueEntry;
  error?: string;
  nextAttemptAt?: string;
}

export interface IdempotencyKey {
  artifactId: DeliveryArtifactId;
  channelId: DeliveryChannelId;
  recipientId: DeliveryRecipientId;
}
