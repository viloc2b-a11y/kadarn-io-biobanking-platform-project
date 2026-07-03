// ==========================================================================
// DeliveryRecipient — who receives a delivery (KEMS-007 §C)
// ==========================================================================

import { z } from 'zod';
import type { DeliveryRecipientId } from '../value-objects/ids.js';
import type { RecipientType } from '../value-objects/recipient-type.js';

// --- Type ---
export interface DeliveryRecipient {
  readonly id: DeliveryRecipientId;
  readonly recipientType: RecipientType;
  readonly identifier: string; // email, webhook url, org slug, etc.
  readonly displayName: string;
  readonly channelIds: string[];
}

// --- Schema ---
export const DeliveryRecipientSchema = z.object({
  id: z.string().uuid(),
  recipientType: z.enum(['person', 'system', 'organization']),
  identifier: z.string().min(1),
  displayName: z.string().min(1),
  channelIds: z.array(z.string().uuid()),
});

// --- Factory ---
export function createDeliveryRecipient(params: {
  id: DeliveryRecipientId;
  recipientType: RecipientType;
  identifier: string;
  displayName: string;
  channelIds?: string[];
}): DeliveryRecipient {
  const recipient: DeliveryRecipient = {
    id: params.id,
    recipientType: params.recipientType,
    identifier: params.identifier,
    displayName: params.displayName,
    channelIds: params.channelIds ?? [],
  };
  DeliveryRecipientSchema.parse(recipient);
  return recipient;
}
