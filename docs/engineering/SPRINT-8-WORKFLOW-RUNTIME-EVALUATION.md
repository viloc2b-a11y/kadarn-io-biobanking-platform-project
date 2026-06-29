# Sprint 8 — Workflow Runtime Evaluation

**Program:** Kadarn v1.0 Hardening  
**Objective:** Decide the execution engine with technical evidence  
**Decision:** See [ADR-022](../adr/adr-022-workflow-runtime-decision.md)

---

## Current state (verified in code)

| Fact | Evidence |
|------|----------|
| No Temporal SDK installed | Zero `@temporalio/*` in `package.json` / lockfile |
| API never imports workflow-engine | `apps/api/package.json` lists dep; zero imports in `apps/api/src` before Sprint 8 |
| Orchestrator emits signals only | `stage-handlers.ts` → `WorkflowSignalRequested`; no consumer |
| Engine 2.0 partially built | `packages/workflow-engine/src/engine.ts` — `startInstance`, `advance`; missing `completeTask`, Postgres adapter |
| DB schema exists | `database/migrations/027_workflow_engine.sql` |
| Exchange PoC tested | `packages/workflow-engine/tests/exchange-request-workflow.test.ts` (~20 tests) |
| Routes bypass workflow | e.g. marketplace PATCH sets `accepted` directly on `exchange_requests` |

**Conclusion:** The gap is **runtime wiring**, not missing Temporal packages.

---

## Candidates evaluated

### 1. Temporal

**What it is:** Durable workflow orchestration with event-sourced history, native timers, signals, retries.

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Fit for multi-day human workflows | 5 | Native signals + timers |
| Fit for Kadarn policy/provenance model | 3 | Activities must wrap engines; OPA boundary already documented in KAA-001 |
| Implementation readiness | 1 | No SDK, no worker, no server |
| Operational cost (pilot) | 2 | Temporal Server (BSL) or Cloud; workers; monitoring |
| Alignment with existing code | 2 | Parallel track to Engine 2.0; duplicates ADR-017 investment |
| License risk | 3 | Server BSL; SDK MIT — acceptable but needs legal review for prod |
| Test/offline gate compatibility | 4 | `@temporalio/testing` works but adds CI complexity |

**Verdict:** Best **long-term** orchestrator for scale. **Wrong time** for Kadarn — would install infrastructure before workflows execute at all.

---

### 2. Kadarn Workflow Engine 2.0 (own runtime on PostgreSQL)

**What it is:** ADR-017 policy-driven engine + `workflow_*` tables + event-driven dispatcher.

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| Fit for multi-day human workflows | 4 | Human tasks + `wait` steps + `next_wake_at` worker |
| Fit for Kadarn policy/provenance model | 5 | `policy_check` in `advance()`; provenance via existing recorders |
| Implementation readiness | 4 | Engine + schema exist; adapter + worker remain |
| Operational cost (pilot) | 5 | Same Supabase Postgres |
| Alignment with existing code | 5 | ADR-017, migrations, tests already present |
| License risk | 5 | Fully owned |
| Test/offline gate compatibility | 5 | In-memory adapter + vitest |

**Verdict:** **Selected.** Completes the architecture already accepted in ADR-017.

---

### 3. Inngest / Trigger.dev (managed workflow SaaS)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Fit | 4 | Good for step functions + waits |
| Readiness | 2 | No integration; vendor lock-in |
| Ops cost | 3 | SaaS billing + data residency for biobank data |
| Alignment | 2 | Bypasses Engine 2.0 and BNOS event model |

**Verdict:** Rejected for pilot — adds external dependency without using Kadarn's workflow schema.

---

### 4. Restate

| Dimension | Score | Notes |
|-----------|-------|-------|
| Fit | 4 | Durable execution, simpler ops than Temporal |
| Readiness | 1 | Greenfield integration |
| Alignment | 2 | Another parallel stack |

**Verdict:** Rejected for now — same timing problem as Temporal, smaller ecosystem.

---

### 5. PostgreSQL cron + status fields only (status quo)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Fit | 2 | No unified instance model; logic in routes |
| Readiness | 5 | Already what routes do ( badly ) |
| Alignment | 1 | Fails ADR-017 and Sprint 6 orchestration intent |

**Verdict:** Rejected — this is the problem Sprint 8 fixes.

---

## Decision matrix (weighted)

| Candidate | Weighted score |
|-----------|----------------|
| **Engine 2.0 + Postgres + event dispatcher** | **4.35** |
| Temporal | 3.05 |
| Inngest/Trigger.dev | 2.40 |
| Restate | 2.15 |
| Status quo | 1.80 |

Weights: implementation readiness 25%, alignment 25%, policy/provenance fit 20%, ops cost 15%, long-running fit 15%.

---

## What we ship (Sprint 8)

```
WorkflowSignalRequested (event bus)
        ↓
dispatchWorkflowSignal()  ← packages/workflow-engine/src/runtime
        ↓
exchange-request handler  ← uses PoC runner (reference impl)
        ↓
(future) Postgres WorkflowAdapter + timer worker
```

**Not shipping:** Temporal Server, `@temporalio/*`, dual orchestration paths.

---

## Re-evaluation triggers for Temporal

Re-open ADR-022 when **≥3** are true:

1. **>500** concurrently running workflow instances across tenants
2. **Timer worker** misses SLO (e.g. >1% wake events late by >5 minutes)
3. **Multi-region** deployment required
4. **Dedicated platform team** for workflow infrastructure (≥0.5 FTE)
5. **Compliance audit** requires immutable workflow event log separate from app DB

Until then, Engine 2.0 + Postgres is the **definitive** runtime.

---

## KAA-002 alignment note

KAA-002 remains valuable for **requirements and boundaries** (OPA vs orchestrator, activity provenance). Its **Temporal-as-owner** assumption is superseded by ADR-022 for the current program phase. Temporal interfaces in `packages/workflow-engine/src/temporal/` are **compatibility shims**, not evidence of Temporal adoption.
