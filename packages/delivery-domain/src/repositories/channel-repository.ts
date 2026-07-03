// ==========================================================================
// DeliveryChannelRepository — persistence interface (no implementation)
// ==========================================================================

import type { DeliveryChannel } from '../entities/delivery-channel.js';
import type { DeliveryChannelId } from '../value-objects/ids.js';
import type { ChannelType } from '../value-objects/channel-type.js';

export interface DeliveryChannelRepository {
  /** Persist a new or updated channel */
  save(channel: DeliveryChannel): Promise<void>;

  /** Find by ID */
  findById(id: DeliveryChannelId): Promise<DeliveryChannel | null>;

  /** Find all active channels */
  findActive(): Promise<DeliveryChannel[]>;

  /** Find channels by type */
  findByType(channelType: ChannelType): Promise<DeliveryChannel[]>;
}
