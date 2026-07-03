// ==========================================================================
// DeliveryReceipt — proof of delivery (KEMS-007 §F)
// ==========================================================================

import { z } from 'zod';
import type { DeliveryReceiptId } from '../value-objects/ids.js';
import { ReceiptStatusSchema, type ReceiptStatus } from '../value-objects/receipt-status.js';

// --- Type ---
export interface DeliveryReceipt {
  readonly id: DeliveryReceiptId;
  readonly artifactId: string;
  readonly channelId: string;
  readonly recipientId: string;
  readonly sentAt: string;      // ISO 8601
  readonly deliveredAt: string | null; // ISO 8601
  readonly status: ReceiptStatus;
  readonly attemptNumber: number;
  readonly error: string | null;
}

// --- Schema ---
export const DeliveryReceiptSchema = z.object({
  id: z.string().uuid(),
  artifactId: z.string().uuid(),
  channelId: z.string().uuid(),
  recipientId: z.string().uuid(),
  sentAt: z.string().datetime(),
  deliveredAt: z.string().datetime().nullable(),
  status: ReceiptStatusSchema,
  attemptNumber: z.number().int().positive(),
  error: z.string().nullable().default(null),
});

// --- Factory ---
export function createDeliveryReceipt(params: {
  id: DeliveryReceiptId;
  artifactId: string;
  channelId: string;
  recipientId: string;
  sentAt?: string;
  deliveredAt?: string | null;
  status?: ReceiptStatus;
  attemptNumber?: number;
  error?: string | null;
}): DeliveryReceipt {
  const receipt: DeliveryReceipt = {
    id: params.id,
    artifactId: params.artifactId,
    channelId: params.channelId,
    recipientId: params.recipientId,
    sentAt: params.sentAt ?? new Date().toISOString(),
    deliveredAt: params.deliveredAt ?? null,
    status: params.status ?? 'sent',
    attemptNumber: params.attemptNumber ?? 1,
    error: params.error ?? null,
  };
  DeliveryReceiptSchema.parse(receipt);
  return receipt;
}
