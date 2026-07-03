// ==========================================================================
// ChannelType — valid delivery channel types
// ==========================================================================

import { z } from 'zod';

export const CHANNEL_TYPES = ['email', 'webhook', 'sftp', 'api', 'portal', 's3'] as const;

export const ChannelTypeSchema = z.enum(CHANNEL_TYPES);

export type ChannelType = z.infer<typeof ChannelTypeSchema>;

/** Check if a string is a valid ChannelType */
export function isChannelType(value: string): value is ChannelType {
  return CHANNEL_TYPES.includes(value as ChannelType);
}
