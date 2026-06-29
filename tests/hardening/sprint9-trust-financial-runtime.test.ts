// ==========================================================================
// Sprint 9 — Trust & Financial Runtime: static integration gate
// ==========================================================================

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TrustEngineService,
  InMemoryTrustAdapter,
  computeOverall,
} from '../../packages/trust-engine/src/index';
import {
  validateEscrowTransition,
  processSettlementFinancials,
  reconcileSettlement,
  ESCROW_TRANSITIONS,
} from '../../packages/financial-engine/src/runtime';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const ROOT_PKG = path.join(REPO_ROOT, 'package.json');
const MIGRATION = path.join(REPO_ROOT, 'database/migrations/039_trust_financial_runtime.sql');

describe('Sprint 9 — version and migration', () => {
  it('migration 039 adds financial runtime tables and escrow statuses', () => {
    const sql = fs.readFileSync(MIGRATION, 'utf-8');
    expect(sql).toContain('financial_invoices');
    expect(sql).toContain('financial_payments');
    expect(sql).toContain('financial_reconciliations');
    expect(sql).toContain("'completed'");
    expect(sql).toContain("'cancelled'");
  });
});

describe('Sprint 9 — trust runtime engine', () => {
  it('records evidence events and updates dimension scores with decay on read', async () => {
    const adapter = new InMemoryTrustAdapter();
    const service = new TrustEngineService(adapter);
    const orgId = 'org-trust-s9';

    const recorded = await service.recordEvent({
      organizationId: orgId,
      dimension: 'financial',
      source: 'payment.on_time',
      evidenceRef: 'settlement-1',
    });

    expect(recorded.scoreAfter).toBeGreaterThan(recorded.scoreBefore);

    const scores = await service.getScores(orgId);
    expect(scores.overallScore).toBeGreaterThan(0.5);
    expect(scores.financialScore).toBe(recorded.scoreAfter);
    expect(computeOverall({
      operational: scores.operationalScore,
      regulatory: scores.regulatoryScore,
      financial: scores.financialScore,
      technical: scores.technicalScore,
    })).toBeCloseTo(scores.overallScore, 3);
  });
});

describe('Sprint 9 — financial runtime engine', () => {
  it('validates escrow transitions aligned with settlement API', () => {
    expect(ESCROW_TRANSITIONS.pending).toContain('funded');
    expect(ESCROW_TRANSITIONS.pending).toContain('cancelled');
    expect(ESCROW_TRANSITIONS.released).toContain('completed');
    expect(() => validateEscrowTransition('pending', 'released')).toThrow();
  });

  it('processes settlement: invoice, payment, reconciliation', () => {
    const result = processSettlementFinancials({
      settlementId: 'settle-s9',
      dealId: 'deal-s9',
      organizationId: 'org-a',
      totalValue: 1000,
      correlationId: 'corr-s9',
      feeSchedule: { biobankFee: 50, courierFee: 25, platformFeePercent: 5 },
      escrow: {
        status: 'pending',
        totalAmount: 1000,
        releasedAmount: 0,
        refundedAmount: 0,
      },
      fromStatus: 'pending',
      toStatus: 'funded',
    });

    expect(result.calc.platformFee).toBe(50);
    expect(result.invoice.status).toBe('issued');
    expect(result.payment?.amount).toBe(1000);
    expect(result.reconciliation.status).toBe('balanced');
    expect(result.escrow?.status).toBe('funded');
  });

  it('flags reconciliation discrepancy when paid amount mismatches', () => {
    const recon = reconcileSettlement({
      settlementId: 'settle-x',
      expectedAmount: 500,
      paidAmount: 400,
      releasedAmount: 0,
    });
    expect(recon.status).toBe('discrepancy');
    expect(recon.variance).toBe(100);
  });
});

describe('Sprint 9 — orchestrator wiring', () => {
  it('stage handlers use trust-runtime and financial-runtime (not stubs)', () => {
    const handlers = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/lib/orchestration/stage-handlers.ts'),
      'utf-8',
    );
    expect(handlers).toContain('evaluateTrustForPipeline');
    expect(handlers).toContain('recordTrustFromSettlement');
    expect(handlers).toContain('scheduleFinancialRuntime');
    expect(handlers).not.toContain('getDefaultScore()');
  });

  it('API runtimes exist with Supabase adapters', () => {
    expect(fs.existsSync(path.join(REPO_ROOT, 'apps/api/src/lib/trust-runtime.ts'))).toBe(true);
    expect(fs.existsSync(path.join(REPO_ROOT, 'apps/api/src/lib/financial-runtime.ts'))).toBe(true);
    expect(fs.existsSync(path.join(REPO_ROOT, 'apps/api/src/lib/service-client.ts'))).toBe(true);
  });

  it('domain events include trust and financial runtime events', () => {
    const events = fs.readFileSync(
      path.join(REPO_ROOT, 'packages/domain-events/src/index.ts'),
      'utf-8',
    );
    expect(events).toContain('TrustEventRecorded');
    expect(events).toContain('InvoiceIssued');
    expect(events).toContain('PaymentRecorded');
    expect(events).toContain('SettlementReconciled');
  });
});
