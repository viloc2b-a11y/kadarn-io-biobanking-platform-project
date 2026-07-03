// ==========================================================================
// ReceiptStatus — delivery receipt status values
// ==========================================================================

import { z } from 'zod';

export const RECEIPT_STATUSES = ['sent', 'delivered', 'failed', 'bounced'] as const;

export const ReceiptStatusSchema = z.enum(RECEIPT_STATUSES);

export type ReceiptStatus = z.infer<typeof ReceiptStatusSchema>;

/**
 * Valid receipt status transitions.
 * sent → delivered | failed | bounced
 * delivered is terminal
 * failed → sent (retry)
 * bounced is terminal
 */
const VALID_RECEIPT_TRANSITIONS: Record<ReceiptStatus, ReceiptStatus[]> = {
  sent: ['delivered', 'failed', 'bounced'],
  delivered: [],
  failed: ['sent'],   // retry
  bounced: [],
};

/** Check if a receipt transition is valid */
export function isValidReceiptTransition(from: ReceiptStatus, to: ReceiptStatus): boolean {
  return VALID_RECEIPT_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Transition a receipt status */
export function transitionReceiptStatus(from: ReceiptStatus, to: ReceiptStatus): ReceiptStatus {
  if (!isValidReceiptTransition(from, to)) {
    throw new Error(`Invalid receipt status transition: ${from} → ${to}`);
  }
  return to;
}

/** Check if a receipt status is terminal */
export function isTerminalReceiptStatus(status: ReceiptStatus): boolean {
  return VALID_RECEIPT_TRANSITIONS[status]?.length === 0;
}
