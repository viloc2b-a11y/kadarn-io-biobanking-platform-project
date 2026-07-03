// ==========================================================================
// DeliveryRecipientRepository — persistence interface (no implementation)
// ==========================================================================

import type { DeliveryRecipient } from '../entities/delivery-recipient.js';
import type { DeliveryRecipientId } from '../value-objects/ids.js';

export interface DeliveryRecipientRepository {
  /** Persist a new or updated recipient */
  save(recipient: DeliveryRecipient): Promise<void>;

  /** Find by ID */
  findById(id: DeliveryRecipientId): Promise<DeliveryRecipient | null>;

  /** Find all recipients associated with a given channel */
  findByChannel(channelId: string): Promise<DeliveryRecipient[]>;
}
