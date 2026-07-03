// ==========================================================================
// ChannelRegistry — centralized adapter registry (KEMS-007 §G)
// ==========================================================================

import type { ChannelAdapter, ChannelDeliveryResult } from './types.js';
import type { ChannelType, DeliveryArtifact, DeliveryChannel, DeliveryRecipient } from '../index.js';

export class ChannelRegistry {
  private adapters: Map<ChannelType, ChannelAdapter> = new Map();

  /** Register a channel adapter */
  register(adapter: ChannelAdapter): void {
    if (this.adapters.has(adapter.channelType)) {
      throw new Error(
        `Channel adapter already registered for type '${adapter.channelType}'`,
      );
    }
    this.adapters.set(adapter.channelType, adapter);
  }

  /** Get an adapter by channel type */
  getAdapter(channelType: ChannelType): ChannelAdapter | undefined {
    return this.adapters.get(channelType);
  }

  /** Check if an adapter is registered for a channel type */
  hasAdapter(channelType: ChannelType): boolean {
    return this.adapters.has(channelType);
  }

  /** List all registered channel types */
  listChannelTypes(): ChannelType[] {
    return Array.from(this.adapters.keys());
  }

  /** Deliver through a specific channel */
  async deliver(
    channelType: ChannelType,
    artifact: DeliveryArtifact,
    recipient: DeliveryRecipient,
    channel: DeliveryChannel,
  ): Promise<ChannelDeliveryResult> {
    const adapter = this.adapters.get(channelType);
    if (!adapter) {
      throw new Error(`No adapter registered for channel type '${channelType}'`);
    }
    return adapter.deliver(artifact, recipient, channel);
  }

  /** Number of registered adapters */
  get size(): number {
    return this.adapters.size;
  }

  /** Clear all adapters (for testing) */
  clear(): void {
    this.adapters.clear();
  }
}
