// ==========================================================================
// Financial Engine — Settlement reconciliation
// ==========================================================================

export type ReconciliationStatus = 'pending' | 'balanced' | 'discrepancy';

export interface ReconciliationRecord {
  settlementId: string;
  expectedAmount: number;
  paidAmount: number;
  releasedAmount: number;
  variance: number;
  status: ReconciliationStatus;
  reconciledAt: string | null;
  correlationId: string | null;
}

const VARIANCE_TOLERANCE = 0.01;

export function reconcileSettlement(input: {
  settlementId: string;
  expectedAmount: number;
  paidAmount: number;
  releasedAmount: number;
  correlationId?: string | null;
}): ReconciliationRecord {
  const variance = roundMoney(input.expectedAmount - input.paidAmount);
  const balanced =
    Math.abs(variance) <= VARIANCE_TOLERANCE &&
    input.releasedAmount <= input.paidAmount + VARIANCE_TOLERANCE;

  return {
    settlementId: input.settlementId,
    expectedAmount: input.expectedAmount,
    paidAmount: input.paidAmount,
    releasedAmount: input.releasedAmount,
    variance,
    status: balanced ? 'balanced' : 'discrepancy',
    reconciledAt: balanced ? new Date().toISOString() : null,
    correlationId: input.correlationId ?? null,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
