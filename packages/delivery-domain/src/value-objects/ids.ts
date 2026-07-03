// ==========================================================================
// Branded ID types — type-safe identifiers for the Delivery Domain
// ==========================================================================

import { z } from 'zod';

// --- UUID schema ---
const uuidSchema = z.string().uuid();

// --- Branded types ---
export type DeliveryArtifactId = string & { readonly __brand: 'DeliveryArtifactId' };
export type DeliveryChannelId = string & { readonly __brand: 'DeliveryChannelId' };
export type DeliveryRecipientId = string & { readonly __brand: 'DeliveryRecipientId' };
export type DeliveryPolicyId = string & { readonly __brand: 'DeliveryPolicyId' };
export type DeliveryTemplateId = string & { readonly __brand: 'DeliveryTemplateId' };
export type DeliveryReceiptId = string & { readonly __brand: 'DeliveryReceiptId' };

// --- Factory functions ---

export function createDeliveryArtifactId(id?: string): DeliveryArtifactId {
  const value = id ?? crypto.randomUUID();
  uuidSchema.parse(value);
  return value as DeliveryArtifactId;
}

export function createDeliveryChannelId(id?: string): DeliveryChannelId {
  const value = id ?? crypto.randomUUID();
  uuidSchema.parse(value);
  return value as DeliveryChannelId;
}

export function createDeliveryRecipientId(id?: string): DeliveryRecipientId {
  const value = id ?? crypto.randomUUID();
  uuidSchema.parse(value);
  return value as DeliveryRecipientId;
}

export function createDeliveryPolicyId(id?: string): DeliveryPolicyId {
  const value = id ?? crypto.randomUUID();
  uuidSchema.parse(value);
  return value as DeliveryPolicyId;
}

export function createDeliveryTemplateId(id?: string): DeliveryTemplateId {
  const value = id ?? crypto.randomUUID();
  uuidSchema.parse(value);
  return value as DeliveryTemplateId;
}

export function createDeliveryReceiptId(id?: string): DeliveryReceiptId {
  const value = id ?? crypto.randomUUID();
  uuidSchema.parse(value);
  return value as DeliveryReceiptId;
}
