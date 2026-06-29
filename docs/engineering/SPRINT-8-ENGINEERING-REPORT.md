# Sprint 8 — Engineering Report

**Program:** Kadarn v1.0 Hardening  
**Sprint:** Workflow Runtime  
**Version:** `1.0.0-hardening.8`  
**Date:** 2026-06-28  
**Gate status:** PASS (`npm run verify`)

---

## Objective

Decide definitively the workflow execution engine — Temporal vs own runtime vs alternatives — with technical justification, not audit momentum.

**Gate:** ADR accepted, evaluation documented, signals execute via runtime dispatcher, Temporal SDK absent.

---

## Decision

**Kadarn Workflow Runtime = Workflow Engine 2.0 + PostgreSQL + Domain Event Dispatcher**

Temporal **deferred** until re-evaluation triggers in evaluation doc (≥3 of 5 scale/ops criteria).

See: [ADR-022](../adr/adr-022-workflow-runtime-decision.md)

---

## Why not Temporal now

| Evidence | Implication |
|----------|-------------|
| Zero `@temporalio/*` in repo | Installing SDK is net-new infra, not "finishing" work |
| `WorkflowSignalRequested` had no consumer | Problem is wiring, not orchestrator brand |
| ADR-017 + migration 027 already accepted | Engine 2.0 is the architectural commitment |
| Pilot scale | Supabase + timer worker sufficient for first 5 pilots |
| BSL Temporal Server | Legal/ops cost without proven workflow volume |

KAA-002 remains valid for **requirements**; its Temporal-as-owner assumption is superseded for this phase.

---

## What shipped

```
publishIntegrationEvent('WorkflowSignalRequested')
  → dispatchWorkflowSignal()
      → exchange-request-workflow handler
          → PoC runner (reference impl, in-memory state)
```

- Migration 038: `next_wake_at`, seeded definition
- Future: Postgres `WorkflowAdapter`, timer worker, route handlers stop bypassing workflow state

---

## Verification

```bash
npm run verify
```

Static gate confirms: ADR-022, no Temporal packages, dispatcher registered, migration parity.
