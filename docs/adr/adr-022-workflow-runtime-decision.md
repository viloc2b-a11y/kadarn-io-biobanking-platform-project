# ADR-022: Workflow Runtime — Execution Engine Decision

**Status:** Accepted  
**Date:** 2026-06-28  
**Deciders:** Kadarn Architecture (Sprint 8)  
**Supersedes (for runtime selection):** KAA-002 §2–§4 assumption that Temporal is the orchestration owner  

---

## Context

Kadarn has **two workflow tracks** that were never connected to production:

1. **Workflow Engine 2.0** (ADR-017) — policy-driven state machine with PostgreSQL schema (`027_workflow_engine.sql`) and partial `engine.ts` implementation.
2. **Temporal PoC** (KPE-07) — in-memory exchange-request lifecycle with Temporal-*compatible* interfaces but **no `@temporalio/*` dependency**.

Production API routes (Sprint 6 orchestrator) emit `WorkflowSignalRequested` domain events but **no worker executes them**. Routes also mutate domain tables directly, bypassing workflow state machines.

KAA-002 assessed Temporal adoption as Draft. Audits and integration reviews repeatedly list "install Temporal SDK" as a gap. **That is a hypothesis, not a decision.**

Sprint 8 gate: **decide the execution engine on evidence**, not audit mentions.

---

## Decision

**Adopt Kadarn Workflow Runtime = Workflow Engine 2.0 + PostgreSQL + Domain Event Dispatcher**

| Layer | Choice |
|-------|--------|
| **Execution model** | Engine 2.0 (`startInstance`, `advance`, lifecycle) |
| **Persistence** | PostgreSQL `workflow_*` tables (existing migration 027) |
| **Triggering** | `WorkflowSignalRequested` → in-process `dispatchWorkflowSignal()` |
| **Timers** | `workflow_instances.next_wake_at` + scheduled worker (migration 038) |
| **Reference runner** | Exchange-request PoC logic (`temporal/exchange-request-workflow.ts`) runs inside runtime handlers until migrated to Engine 2.0 definitions |

**Temporal is deferred**, not rejected. Re-evaluate when **all** trigger conditions in `docs/engineering/SPRINT-8-WORKFLOW-RUNTIME-EVALUATION.md` §Re-evaluation are met.

---

## Rationale (summary)

| Criterion | Engine 2.0 + Postgres | Temporal |
|-----------|----------------------|----------|
| Already in repo | Schema + engine + tests | Interfaces + PoC only |
| Operational cost at pilot scale | Low (existing Supabase) | High (cluster + workers + BSL server) |
| Policy integration | Native in `advance()` | Requires activity wrappers |
| Provenance / event bus | Same Postgres + outbox | Additional wiring |
| Long-running timers | `next_wake_at` + worker (good enough for pilots) | Native (superior at scale) |
| Team focus | Domain workflows | Infrastructure + domain |

Temporal wins on durability guarantees at **large scale**. Kadarn is not there yet — workflows are not even **executing** in production.

---

## Consequences

### Positive

- Closes the Sprint 6 gap: signals → execution
- Aligns with ADR-017 and existing DB schema
- No new infrastructure for pilots
- Temporal PoC code remains as **reference implementation**, not dead code
- Clear re-evaluation criteria for Temporal

### Negative

- Must implement Postgres `WorkflowAdapter` and timer worker (Sprint 8+ follow-up)
- Timer semantics less mature than Temporal until worker is production-hardened
- KAA-002 must be updated to reflect "Engine 2.0 owner, Temporal candidate"

### Explicit non-actions (Sprint 8)

- **Do NOT** add `@temporalio/workflow`, `@temporalio/worker`, or Temporal Server to the repo
- **Do NOT** rename PoC folder to imply Temporal is installed
- **Do NOT** block pilots on Temporal adoption

---

## Implementation (Sprint 8)

- `packages/workflow-engine/src/runtime/` — `dispatchWorkflowSignal()`, exchange-request handler
- `apps/api/src/lib/event-runtime.ts` — dispatch on `WorkflowSignalRequested`
- Migration `038_workflow_runtime.sql` — `next_wake_at`, seed exchange-request definition
- Gate test: `tests/hardening/sprint8-workflow-runtime.test.ts`
