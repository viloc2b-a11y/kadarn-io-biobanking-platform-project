// ==========================================================================
// Financial Engine — Settlement runtime orchestration (pure)
// ==========================================================================

import { calculate } from '../engine';
import type { FeeSchedule, SettlementCalc } from '../types';
import {
  applyEscrowTransition,
  type EscrowState,
  type EscrowStatus,
  validateEscrowTransition,
} from './escrow';
import { buildSettlementInvoice, type InvoiceDraft } from './invoice';
import { recordPaymentIntent, type PaymentRecord } from './payment';
import { reconcileSettlement, type ReconciliationRecord } from './reconciliation';

export interface SettlementRuntimeInput {
  settlementId: string;
  dealId: string;
  organizationId?: string | null;
  totalValue: number;
  currency?: string;
  correlationId?: string | null;
  feeSchedule: FeeSchedule;
  escrow?: EscrowState;
  fromStatus?: EscrowStatus;
  toStatus?: EscrowStatus;
  transitionAmount?: number;
}

export interface SettlementRuntimeResult {
  calc: SettlementCalc;
  invoice: InvoiceDraft;
  payment: PaymentRecord | null;
  reconciliation: ReconciliationRecord;
  escrow: EscrowState | null;
}

export function processSettlementFinancials(input: SettlementRuntimeInput): SettlementRuntimeResult {
  const calc = calculate(input.totalValue, input.feeSchedule);

  let escrow: EscrowState | null = input.escrow ?? null;
  if (input.escrow && input.fromStatus && input.toStatus) {
    validateEscrowTransition(input.fromStatus, input.toStatus);
    escrow = applyEscrowTransition(input.escrow, input.toStatus, input.transitionAmount);
  }

  const issueNow = input.toStatus === 'funded' || input.toStatus === 'released';
  const invoice = buildSettlementInvoice({
    settlementId: input.settlementId,
    dealId: input.dealId,
    organizationId: input.organizationId,
    calc,
    currency: input.currency,
    correlationId: input.correlationId,
    issueNow,
  });

  let payment: PaymentRecord | null = null;
  if (input.toStatus === 'funded') {
    payment = recordPaymentIntent({
      settlementId: input.settlementId,
      amount: input.totalValue,
      correlationId: input.correlationId,
    });
  } else if (input.toStatus === 'refunded') {
    payment = recordPaymentIntent({
      settlementId: input.settlementId,
      amount: input.totalValue,
      status: 'refunded',
      correlationId: input.correlationId,
    });
  }

  const paidAmount =
    payment?.status === 'captured' ? payment.amount : escrow?.refundedAmount ?? 0;

  const reconciliation = reconcileSettlement({
    settlementId: input.settlementId,
    expectedAmount: input.totalValue,
    paidAmount,
    releasedAmount: escrow?.releasedAmount ?? 0,
    correlationId: input.correlationId,
  });

  return { calc, invoice, payment, reconciliation, escrow };
}
