// ==========================================================================
// Financial Engine — Invoice generation
// ==========================================================================

import type { SettlementCalc } from '../types';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';

export interface InvoiceDraft {
  settlementId: string;
  dealId: string;
  organizationId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: number;
  platformFee: number;
  biobankPayout: number;
  courierPayout: number;
  currency: string;
  issuedAt: string | null;
  dueAt: string | null;
  correlationId: string | null;
}

export function buildInvoiceNumber(settlementId: string, sequence = 1): string {
  const suffix = settlementId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `INV-${suffix}-${String(sequence).padStart(3, '0')}`;
}

export function buildSettlementInvoice(input: {
  settlementId: string;
  dealId: string;
  organizationId?: string | null;
  calc: SettlementCalc;
  currency?: string;
  correlationId?: string | null;
  issueNow?: boolean;
}): InvoiceDraft {
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 30);

  return {
    settlementId: input.settlementId,
    dealId: input.dealId,
    organizationId: input.organizationId ?? null,
    invoiceNumber: buildInvoiceNumber(input.settlementId),
    status: input.issueNow ? 'issued' : 'draft',
    totalAmount: input.calc.totalValue,
    platformFee: input.calc.platformFee,
    biobankPayout: input.calc.biobankPayout,
    courierPayout: input.calc.courierPayout,
    currency: input.currency ?? 'USD',
    issuedAt: input.issueNow ? now.toISOString() : null,
    dueAt: due.toISOString(),
    correlationId: input.correlationId ?? null,
  };
}

export function markInvoicePaid(invoice: InvoiceDraft): InvoiceDraft {
  return { ...invoice, status: 'paid' };
}
