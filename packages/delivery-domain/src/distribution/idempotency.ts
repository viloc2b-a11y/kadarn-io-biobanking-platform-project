// ==========================================================================
// IdempotencyRegistry — Duplicate delivery prevention (KEMS-007 §F.5)
// ==========================================================================

import type { DeliveryArtifactId, DeliveryChannelId, DeliveryRecipientId } from '../value-objects/ids.js';

export class IdempotencyRegistry {
  private deliveredKeys: Set<string> = new Set();

  /** Build the composite idempotency key */
  static buildKey(
    artifactId: DeliveryArtifactId,
    channelId: DeliveryChannelId,
    recipientId: DeliveryRecipientId,
  ): string {
    return `${artifactId}:${channelId}:${recipientId}`;
  }

  /** Check if a delivery has already been completed */
  isDuplicate(
    artifactId: DeliveryArtifactId,
    channelId: DeliveryChannelId,
    recipientId: DeliveryRecipientId,
  ): boolean {
    const key = IdempotencyRegistry.buildKey(artifactId, channelId, recipientId);
    return this.deliveredKeys.has(key);
  }

  /** Mark a delivery as completed (prevents duplicates) */
  markDelivered(
    artifactId: DeliveryArtifactId,
    channelId: DeliveryChannelId,
    recipientId: DeliveryRecipientId,
  ): void {
    const key = IdempotencyRegistry.buildKey(artifactId, channelId, recipientId);
    this.deliveredKeys.add(key);
  }

  /** Remove a specific key (for replay) */
  removeKey(key: string): void {
    this.deliveredKeys.delete(key);
  }

  /** Number of registered deliveries */
  get size(): number {
    return this.deliveredKeys.size;
  }

  /** Check if a raw key exists */
  has(key: string): boolean {
    return this.deliveredKeys.has(key);
  }

  /** Clear all keys */
  clear(): void {
    this.deliveredKeys.clear();
  }
}
