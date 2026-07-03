// ==========================================================================
// RecipientType — valid recipient categories
// ==========================================================================

import { z } from 'zod';

export const RECIPIENT_TYPES = ['person', 'system', 'organization'] as const;

export const RecipientTypeSchema = z.enum(RECIPIENT_TYPES);

export type RecipientType = z.infer<typeof RecipientTypeSchema>;

/** Check if a string is a valid RecipientType */
export function isRecipientType(value: string): value is RecipientType {
  return RECIPIENT_TYPES.includes(value as RecipientType);
}
