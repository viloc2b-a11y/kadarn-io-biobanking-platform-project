// ==========================================================================
// DeliveryChannel — target for artifact delivery (KEMS-007 §D)
// ==========================================================================

import { z } from 'zod';
import type { DeliveryChannelId } from '../value-objects/ids.js';
import type { ChannelType } from '../value-objects/channel-type.js';

// --- Retry policy ---
export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

const RetryPolicySchema = z.object({
  maxAttempts: z.number().int().min(0).max(10),
  backoffMs: z.number().int().min(0),
});

// --- Channel config ---
export interface ChannelConfig {
  endpoint?: string;
  auth?: Record<string, string>;
  headers?: Record<string, string>;
  // Adapter-specific extensions (Sprint 9.8)
  method?: string;
  url?: string;
  secret?: string;
  from?: string;
  authType?: string;
  credentials?: Record<string, unknown>;
  notificationEnabled?: boolean;
  workspaceId?: string;
  expirySeconds?: number;
  bucket?: string;
  [key: string]: unknown;
}

const ChannelConfigSchema = z.object({
  endpoint: z.string().optional(),
  auth: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
}).passthrough();

// --- Type ---
export interface DeliveryChannel {
  readonly id: DeliveryChannelId;
  readonly channelType: ChannelType;
  readonly config: ChannelConfig;
  readonly retryPolicy: RetryPolicy;
  readonly isActive: boolean;
}

// --- Schema ---
export const DeliveryChannelSchema = z.object({
  id: z.string().uuid(),
  channelType: z.enum(['email', 'webhook', 'sftp', 'api', 'portal', 's3']),
  config: ChannelConfigSchema.default({}),
  retryPolicy: RetryPolicySchema.default({ maxAttempts: 3, backoffMs: 1000 }),
  isActive: z.boolean(),
});

// --- Factory ---
export function createDeliveryChannel(params: {
  id: DeliveryChannelId;
  channelType: ChannelType;
  config?: ChannelConfig;
  retryPolicy?: RetryPolicy;
  isActive?: boolean;
}): DeliveryChannel {
  const channel: DeliveryChannel = {
    id: params.id,
    channelType: params.channelType,
    config: params.config ?? {},
    retryPolicy: params.retryPolicy ?? { maxAttempts: 3, backoffMs: 1000 },
    isActive: params.isActive ?? true,
  };
  DeliveryChannelSchema.parse(channel);
  return channel;
}
