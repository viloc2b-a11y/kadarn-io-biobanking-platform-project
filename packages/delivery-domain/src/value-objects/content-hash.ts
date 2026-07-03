// ==========================================================================
// ContentHash — SHA-256 content integrity hash for delivery artifacts
// ==========================================================================

import { z } from 'zod';

const SHA256_HEX_REGEX = /^[a-fA-F0-9]{64}$/;

export const ContentHashSchema = z.string().regex(SHA256_HEX_REGEX, 'ContentHash must be a 64-character hex string (SHA-256)');

export type ContentHash = z.infer<typeof ContentHashSchema>;

/** Generate a SHA-256 hash from content */
export async function generateContentHash(content: string | Uint8Array): Promise<ContentHash> {
  const data = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const bytes = new Uint8Array(hashBuffer);
  const hashHex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex as ContentHash;
}

/** Validate a ContentHash string */
export function validateContentHash(value: string): ContentHash {
  return ContentHashSchema.parse(value);
}

/** Check if a string is a valid ContentHash */
export function isContentHash(value: string): value is ContentHash {
  return ContentHashSchema.safeParse(value).success;
}
