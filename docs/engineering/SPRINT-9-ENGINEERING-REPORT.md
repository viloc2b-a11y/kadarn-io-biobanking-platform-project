# Sprint 9 — Trust & Financial Runtime Engineering Report

**Version:** `1.0.0-hardening.9`  
**Date:** 2026-06-28  
**Gate:** `npm run verify`

---

## Objective

Convert partially implemented Trust and Financial engines into real runtimes wired through the orchestrator, with persistence, domain events, and settlement lifecycle support.

---

## Trust Runtime

### Pure engine (existing)

- `packages/trust-engine/` — decay, impact, evidence sources, trajectory
- `TrustEngineService` — record events, get scores (decay on read), challenges

### New runtime layer

| Component | Path | Role |
|-----------|------|------|
| In-memory adapter | `packages/trust-engine/src/adapters/memory-adapter.ts` | Tests + offline fallback |
| Supabase adapter | `apps/api/src/lib/trust-runtime.ts` | `organization_trust`, `trust_events`, `trust_challenges` |
| Service client | `apps/api/src/lib/service-client.ts` | Server-side Supabase with service role |

### Orchestrator integration

- `runTrustStage()` calls `evaluateTrustForPipeline()` — dynamic scores with decay
- Settlement updates call `recordTrustFromSettlement()` — maps status → trust evidence (`payment.on_time`, `fulfillment.completed`, etc.)
- Emits `TrustScoreEvaluated` and `TrustEventRecorded`

### Reputation

Platform lexicon uses **Trust** (evidence-based dimensions). Reputation is surfaced via `overall_score` + dimension scores + trajectory — no separate reputation engine.

---

## Financial Runtime

### Pure engine (expanded)

| Module | Path | Capability |
|--------|------|------------|
| Escrow | `packages/financial-engine/src/runtime/escrow.ts` | State machine, transitions |
| Invoice | `packages/financial-engine/src/runtime/invoice.ts` | Invoice draft/issue |
| Payment | `packages/financial-engine/src/runtime/payment.ts` | Payment capture/refund |
| Reconciliation | `packages/financial-engine/src/runtime/reconciliation.ts` | Expected vs paid variance |
| Settlement | `packages/financial-engine/src/runtime/settlement.ts` | Orchestrates full flow |

### API runtime

- `apps/api/src/lib/financial-runtime.ts` — `scheduleFinancialRuntime()` publishes events + persists to DB
- `runFinancialStage()` delegates to financial runtime (replaces fee-calc-only stub)

### Domain events (new)

- `InvoiceIssued`
- `PaymentRecorded`
- `SettlementReconciled`
- `TrustEventRecorded`

---

## Database (Migration 039)

- `escrow_status` — adds `completed`, `cancelled` (aligns with settlement API)
- `financial_invoices` — settlement fee invoices
- `financial_payments` — escrow payment captures
- `financial_reconciliations` — reconciliation ledger

Mirrored to `supabase/migrations/039_trust_financial_runtime.sql`.

---

## Fixes

- **Operations exceptions** — trust challenges query aligned to `023_trust_engine.sql` schema (`dimension`, `reason`, `filed`/`under_review`/`escalated`)
- **Settlement PATCH** — pipeline payload includes `fromStatus`, `dealId`, released/refunded amounts

---

## Gate Tests

- `tests/hardening/sprint9-trust-financial-runtime.test.ts`

---

## Verification

```bash
npm run verify
```

Expected: typecheck + build + all tests PASS.
