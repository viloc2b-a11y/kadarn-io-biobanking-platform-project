# Sprint 6 — Engineering Report

**Program:** Kadarn v1.0 Hardening  
**Sprint:** Engine Orchestration  
**Version:** `1.0.0-hardening.6`  
**Date:** 2026-06-28  
**Gate status:** PASS (`npm run verify` — 517 tests)

---

## Objective

Connect all Kadarn engines through a single orchestration pipeline. No isolated engines.

**Canonical flow:**

```
Discovery → Exchange → Policy → Workflow → Provenance → Trust
  → Financial → Analytics → Knowledge → Operational Twins → Telemetry
```

**Gate:** Critical mutating routes delegate to `runPipeline()`; cross-engine integration lives in stage handlers, not route files.

---

## Architecture

```
Route (mutation success)
  → runPipeline(name, ctx, payload)
      → executeStage() for each pipeline stage
          ├─ discovery      @kadarn/matching-engine
          ├─ knowledge      @kadarn/knowledge-engine
          ├─ exchange       exchange-helper / onboarding (domain events)
          ├─ policy         @kadarn/policy-engine
          ├─ workflow       exchange-helper (WorkflowSignalRequested)
          ├─ provenance     provenance-recorder via helpers
          ├─ trust          @kadarn/trust-engine
          ├─ financial      @kadarn/financial-engine
          ├─ analytics      AnalyticsProjectionRequested events
          ├─ twins          @kadarn/operational-twins
          └─ telemetry      PipelineStageCompleted + span constants
      → publishIntegrationEvent('PipelineStageCompleted') per stage
```

**Entry point:** `apps/api/src/lib/engine-orchestrator.ts`  
**Stage registry:** `apps/api/src/lib/orchestration/pipelines.ts` (13 named pipelines)  
**Init:** `apps/api/src/lib/orchestration/init.ts` (policy-shadow-bridge side-effect)

---

## Pipelines

| Pipeline | Stages | Trigger routes |
|----------|--------|----------------|
| `exchange-request` | Full 11-stage chain | POST exchange, POST marketplace/requests |
| `exchange-request-decision` | 7 stages | PATCH marketplace/requests |
| `exchange-deal` | 8 stages | POST exchange/deals |
| `exchange-deal-update` | 6 stages | PATCH exchange/deals/[id] |
| `feasibility` | 7 stages | POST feasibility, POST marketplace/feasibility |
| `settlement` | 7 stages | POST financial/settlements |
| `settlement-update` | 6 stages | PATCH financial/settlements/[id] |
| `shipment` | 8 stages | POST shipments |
| `shipment-status` | 6 stages | PATCH shipments/[id] |
| `qc` | 6 stages | PATCH processing/aliquots/[id]/qc |
| `collection-twin` | 5 stages | POST collections |
| `specimen-twin` | 6 stages | POST specimens |
| `organization-onboard` | 6 stages | POST organizations |

---

## New domain events

- `PipelineStageCompleted`
- `AnalyticsProjectionRequested`
- `DiscoveryContextEnriched`

---

## Build / bundling fixes

Engine packages (`trust-engine`, `financial-engine`, `matching-engine`, `knowledge-engine`, `operational-twins`) used `.js` extension imports incompatible with Next.js Turbopack. Imports normalized to extensionless paths (matching `policy-engine` convention).

`apps/api/next.config.ts` updated with `transpilePackages` and monorepo `turbopack.root`.

---

## Tests

| Suite | Tests | Purpose |
|-------|-------|---------|
| `tests/hardening/sprint6-engine-orchestration.test.ts` | 43 | Orchestrator exists, all engines wired, routes use `runPipeline`, no direct helper calls in routes |
| `tests/integration/engine-pipeline.test.ts` | 4 | In-memory pipeline execution, correlationId, stage ordering |
| Updated Sprint 5 / audit / onboarding / financial / QC tests | — | Accept orchestrator delegation pattern |

---

## Deferred (future sprints)

- Async outbox worker for stage side-effects (Sprint 4 deferred)
- Full Temporal worker for workflow stage (currently signals + PoC events only)
- OPA shadow on every pipeline (policy stage uses in-process `evaluate()` governance check)

---

## Verification

```bash
npm run verify
# typecheck ✓ | build ✓ | 517 tests ✓ | check:secrets ✓
```

Health endpoint reports `1.0.0-hardening.6`.
