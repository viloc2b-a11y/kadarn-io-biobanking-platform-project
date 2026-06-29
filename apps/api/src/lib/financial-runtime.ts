// ==========================================================================
// Financial Runtime — persistence + domain events for settlement lifecycle
// ==========================================================================

import {
  processSettlementFinancials,
  type EscrowStatus,
  type SettlementRuntimeResult,
} from '@kadarn/financial-engine';
import type { FeeSchedule } from '@kadarn/financial-engine';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/service-client';
import { publishIntegrationEvent } from '@/lib/event-runtime';

export const DEFAULT_FEE_SCHEDULE: FeeSchedule = {
  biobankFee: 0,
  courierFee: 0,
  platformFeePercent: 5,
};

export interface FinancialPipelineContext {
  actorId: string;
  organizationId?: string | null;
  correlationId: string;
}

export interface FinancialPipelinePayload {
  settlementId?: string;
  dealId?: string;
  totalValue?: number;
  amount?: number;
  currency?: string;
  statusChange?: string;
  fromStatus?: string;
  releasedAmount?: number;
  refundedAmount?: number;
}

export function runFinancialRuntimeSync(
  ctx: FinancialPipelineContext,
  payload: FinancialPipelinePayload,
): SettlementRuntimeResult | null {
  const totalValue = Number(payload.totalValue ?? payload.amount ?? 0);
  const settlementId = String(payload.settlementId ?? '');
  const dealId = String(payload.dealId ?? settlementId);

  if (!totalValue || !settlementId) return null;

  const fromStatus = payload.fromStatus as EscrowStatus | undefined;
  const toStatus = payload.statusChange as EscrowStatus | undefined;

  return processSettlementFinancials({
    settlementId,
    dealId,
    organizationId: ctx.organizationId,
    totalValue,
    currency: payload.currency,
    correlationId: ctx.correlationId,
    feeSchedule: DEFAULT_FEE_SCHEDULE,
    escrow: fromStatus
      ? {
          status: fromStatus,
          totalAmount: totalValue,
          releasedAmount: Number(payload.releasedAmount ?? 0),
          refundedAmount: Number(payload.refundedAmount ?? 0),
        }
      : undefined,
    fromStatus,
    toStatus,
    transitionAmount: payload.amount,
  });
}

export function scheduleFinancialRuntime(
  ctx: FinancialPipelineContext,
  payload: FinancialPipelinePayload,
): void {
  const result = runFinancialRuntimeSync(ctx, payload);
  if (!result) return;

  const settlementId = String(payload.settlementId ?? '');

  publishIntegrationEvent(
    'AnalyticsProjectionRequested',
    {
      projectionType: 'financial-settlement',
      entityType: 'settlement',
      entityId: settlementId,
      organizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
      platformFee: result.calc.platformFee,
      biobankPayout: result.calc.biobankPayout,
      courierPayout: result.calc.courierPayout,
      totalValue: result.calc.totalValue,
      reconciliationStatus: result.reconciliation.status,
    },
    {
      actorId: ctx.actorId,
      organizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
      idempotencyKey: `FinancialCalc:${ctx.correlationId}`,
    },
  );

  publishIntegrationEvent(
    'InvoiceIssued',
    {
      settlementId,
      dealId: result.invoice.dealId,
      invoiceNumber: result.invoice.invoiceNumber,
      totalAmount: result.invoice.totalAmount,
      status: result.invoice.status,
      organizationId: ctx.organizationId,
    },
    {
      actorId: ctx.actorId,
      organizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
      idempotencyKey: `InvoiceIssued:${settlementId}:${ctx.correlationId}`,
    },
  );

  if (result.payment) {
    publishIntegrationEvent(
      'PaymentRecorded',
      {
        settlementId,
        amount: result.payment.amount,
        status: result.payment.status,
        paymentMethod: result.payment.paymentMethod,
        organizationId: ctx.organizationId,
      },
      {
        actorId: ctx.actorId,
        organizationId: ctx.organizationId,
        correlationId: ctx.correlationId,
        idempotencyKey: `PaymentRecorded:${settlementId}:${result.payment.status}:${ctx.correlationId}`,
      },
    );
  }

  publishIntegrationEvent(
    'SettlementReconciled',
    {
      settlementId,
      expectedAmount: result.reconciliation.expectedAmount,
      paidAmount: result.reconciliation.paidAmount,
      releasedAmount: result.reconciliation.releasedAmount,
      variance: result.reconciliation.variance,
      status: result.reconciliation.status,
      organizationId: ctx.organizationId,
    },
    {
      actorId: ctx.actorId,
      organizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
      idempotencyKey: `SettlementReconciled:${settlementId}:${ctx.correlationId}`,
    },
  );

  void persistFinancialRecords(createServiceClient(), settlementId, result, ctx).catch(err => {
    console.error('[financial-runtime] persist failed:', err);
  });
}

async function persistFinancialRecords(
  client: SupabaseClient | null,
  settlementId: string,
  result: SettlementRuntimeResult,
  ctx: FinancialPipelineContext,
): Promise<void> {
  if (!client) return;

  const invoiceRow = {
    settlement_id: settlementId,
    deal_id: result.invoice.dealId,
    organization_id: result.invoice.organizationId,
    invoice_number: result.invoice.invoiceNumber,
    status: result.invoice.status,
    total_amount: result.invoice.totalAmount,
    platform_fee: result.invoice.platformFee,
    biobank_payout: result.invoice.biobankPayout,
    courier_payout: result.invoice.courierPayout,
    currency: result.invoice.currency,
    issued_at: result.invoice.issuedAt,
    due_at: result.invoice.dueAt,
    correlation_id: ctx.correlationId,
  };

  const { data: invoiceData, error: invoiceError } = await client
    .from('financial_invoices')
    .upsert(invoiceRow, { onConflict: 'settlement_id,invoice_number' })
    .select('id')
    .single();

  if (invoiceError) throw new Error(invoiceError.message);

  if (result.payment) {
    const { error: paymentError } = await client.from('financial_payments').insert({
      settlement_id: settlementId,
      invoice_id: invoiceData?.id ?? null,
      amount: result.payment.amount,
      status: result.payment.status,
      payment_method: result.payment.paymentMethod,
      recorded_at: result.payment.recordedAt,
      correlation_id: ctx.correlationId,
    });
    if (paymentError) throw new Error(paymentError.message);
  }

  const { error: reconError } = await client.from('financial_reconciliations').upsert(
    {
      settlement_id: settlementId,
      expected_amount: result.reconciliation.expectedAmount,
      paid_amount: result.reconciliation.paidAmount,
      released_amount: result.reconciliation.releasedAmount,
      variance: result.reconciliation.variance,
      status: result.reconciliation.status,
      reconciled_at: result.reconciliation.reconciledAt,
      correlation_id: ctx.correlationId,
    },
    { onConflict: 'settlement_id' },
  );

  if (reconError) throw new Error(reconError.message);
}

export function handleSettlementStatusChanged(payload: {
  settlementId: string;
  dealId: string;
  fromStatus: string;
  toStatus: string;
  amount: number;
  organizationId: string | null;
  changedBy: string;
  correlationId: string;
}): void {
  scheduleFinancialRuntime(
    {
      actorId: payload.changedBy,
      organizationId: payload.organizationId,
      correlationId: payload.correlationId,
    },
    {
      settlementId: payload.settlementId,
      dealId: payload.dealId,
      totalValue: payload.amount,
      statusChange: payload.toStatus,
      fromStatus: payload.fromStatus,
      amount: payload.amount,
    },
  );
}
