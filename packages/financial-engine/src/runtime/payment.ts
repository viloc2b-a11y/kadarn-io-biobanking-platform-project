// ==========================================================================
// Financial Engine — Payment capture
// ==========================================================================

export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded';

export interface PaymentRecord {
  settlementId: string;
  invoiceId: string | null;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  recordedAt: string;
  correlationId: string | null;
}

export function recordPaymentIntent(input: {
  settlementId: string;
  invoiceId?: string | null;
  amount: number;
  paymentMethod?: string;
  correlationId?: string | null;
  status?: PaymentStatus;
}): PaymentRecord {
  if (input.amount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  return {
    settlementId: input.settlementId,
    invoiceId: input.invoiceId ?? null,
    amount: input.amount,
    status: input.status ?? 'captured',
    paymentMethod: input.paymentMethod ?? 'escrow',
    recordedAt: new Date().toISOString(),
    correlationId: input.correlationId ?? null,
  };
}

export function refundPayment(payment: PaymentRecord): PaymentRecord {
  return { ...payment, status: 'refunded', recordedAt: new Date().toISOString() };
}
