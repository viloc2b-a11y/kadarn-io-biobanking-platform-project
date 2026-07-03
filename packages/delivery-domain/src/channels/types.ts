// ==========================================================================
// Channel Adapter Types — transport abstraction for delivery channels
// Sprint 9.8 — Delivery Channels (KEMS-007 §G)
// ==========================================================================

import { z } from 'zod';
import type {
  ArtifactType,
  ChannelType,
  DeliveryArtifact,
  DeliveryChannel,
  DeliveryRecipient,
} from '../index.js';

// --- Transport function — injected for actual I/O ---
export type ChannelTransport = (
  payload: ChannelPayload,
) => Promise<ChannelResponse>;

export interface ChannelPayload {
  artifactId: string;
  artifactType: ArtifactType;
  contentType: string;
  data: string;
  recipient: DeliveryRecipient;
  channel: DeliveryChannel;
  metadata?: Record<string, unknown>;
}

export interface ChannelResponse {
  success: boolean;
  statusCode?: number;
  body?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// --- Channel Adapter interface ---
export interface ChannelAdapter {
  readonly channelType: ChannelType;
  deliver(
    artifact: DeliveryArtifact,
    recipient: DeliveryRecipient,
    channel: DeliveryChannel,
  ): Promise<ChannelDeliveryResult>;
  validateConfig(config: Record<string, unknown>): boolean;
}

// --- Delivery result ---
export interface ChannelDeliveryResult {
  success: boolean;
  receiptId: string;
  channelType: ChannelType;
  artifactId: string;
  recipientId: string;
  error?: string;
  metadata?: Record<string, unknown>;
  deliveredAt: string;
}

export const ChannelDeliveryResultSchema = z.object({
  success: z.boolean(),
  receiptId: z.string().uuid(),
  channelType: z.enum(['email', 'webhook', 'sftp', 'api', 'portal', 's3']),
  artifactId: z.string().uuid(),
  recipientId: z.string().uuid(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  deliveredAt: z.string().datetime(),
});

// --- Factory ---
export function createDeliveryResult(params: {
  success: boolean;
  receiptId: string;
  channelType: ChannelType;
  artifactId: string;
  recipientId: string;
  error?: string;
  metadata?: Record<string, unknown>;
  deliveredAt?: string;
}): ChannelDeliveryResult {
  const result: ChannelDeliveryResult = {
    success: params.success,
    receiptId: params.receiptId,
    channelType: params.channelType,
    artifactId: params.artifactId,
    recipientId: params.recipientId,
    error: params.error,
    metadata: params.metadata,
    deliveredAt: params.deliveredAt ?? new Date().toISOString(),
  };
  ChannelDeliveryResultSchema.parse(result);
  return result;
}
