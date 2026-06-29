# KPE Integration Review

**Status:** Final  
**Sprint:** KPE-10  
**Date:** 2026-06-27  
**Total tests:** 294 passing (228 main suite + 29 provenance + 17 telemetry + 20 workflow-engine)

---

## Summary

| Status | Count | Sprints |
|---|---|---|
| ✅ Implemented & Tested | 8 | PR-001, KPE-01, KPE-04, KPE-05, KPE-06, KPE-07, KPE-08, KPE-09 |
| 🔲 Analyzed Only (Deferred) | 2 | KPE-02 (Policy Persistence), KPE-03 (OPA HTTP Adapter) |
| ❌ Rejected | 0 | — |

---

## 1. Implemented

### PR-001 — PROV Append-Only Enforcement (✅ Verified before KPE kickoff)

**Commit:** `ea352b4` (baseline), extended by `7cf038e` (KPE-04)
**What:** Database-level append-only triggers on `provenance_nodes`, `provenance_edges`, `provenance_evidence`. Correction pattern via `wasRevisionOf`. Integrity status computed by STABLE function.
**Files:** `database/migrations/032_provenance_append_only.sql`, `packages/provenance-graph/`
**Tests:** 16 append-only tests in `tests/provenance/provenance-append-only.test.ts` + SQL trigger verification file.

---

### KPE-01 — OPA Shadow Mode Foundation

**Status:** ✅ Baseline existed, `mode` field added  
**Commits:** `2eef7b1` (baseline), `489b949` (fix: add mode field)

**Deliverables:**

| Artifact | Status |
|---|---|
| `packages/policy-engine/` engine + types | ✅ Included in baseline |
| OPA shadow mode runner | ✅ `opa/shadow-mode.ts` — parallel, non-blocking |
| Feature flags (`OPA_SHADOW_MODE`, `OPA_ENFORCEMENT`) | ✅ `opa/config.ts` — defaults: off, off |
| `withPolicyShadow` middleware | ✅ `opa/with-policy-shadow.ts` — wraps route handlers |
| Two shadow policies | ✅ `organization.membership`, `program.visibility` |
| Integration point | ✅ `organizations/route.ts` GET wrapped |
| `PolicyDecision.mode` field | ✅ Added `mode: 'shadow' \| 'enforce'` |
| Tests | ✅ 36 engine tests + 24 shadow mode tests |

**Verification:** 228 tests pass, typecheck OK, build OK.

---

### KPE-04 — PROV Runtime Validation

**Commit:** `7cf038e`
**What:** Extended append-only test coverage with offline tests:

| Test | Proof |
|---|---|
| `ensure_provenance_node` — duplicate insert no mutation | 4 tests |
| API route exports only GET and POST | 1 test |
| `integrity_status` from DB function | 2 tests |
| SQL trigger verification file | `provenance-append-only-triggers.pgtest.sql` |

---

### KPE-05 — PROV Semantic Mapping Layer

**Commit:** `bcac010`
**Package:** `packages/provenance/`
**What:** W3C PROV semantic mapping without data movement.

| Module | Purpose |
|---|---|
| `src/prov-types.ts` | PROV-DM types: Entity, Activity, Agent, 7 relations, Document |
| `src/prov-mapping.ts` | NODE_TYPE_MAPPINGS, EDGE_TYPE_MAPPINGS, `toProvEntity/Activity/Agent/Node/Relation/Document` |
| `tests/` | 29 tests proving all 6 required scenarios + E2E chain |

**Mapping registry:**

| Kadarn node_type | PROV Category | PROV Type |
|---|---|---|
| `specimen`, `aliquot`, `qc_result`, `consent`, `document`, `dataset`, `receipt` | Entity | `kadarn:specimen`, etc. |
| `processing_event`, `shipment`, `access_request`, `protocol`, `program`, `temperature_log` | Activity | `kadarn:processingEvent`, etc. |
| `organization` | Agent | `prov:Organization` |

**Edge mapping:** `derived_from` → `wasDerivedFrom`, `generated_from` → `wasGeneratedBy`, `processed_by` → `wasAssociatedWith`, `owned_by` → `wasAttributedTo`, correction (`derived_from` + `wasRevisionOf`) → `wasRevisionOf`.

---

### KPE-06 — Temporal Readiness Map

**Commit:** `83b287a`
**Document:** `docs/architecture/workflows/WORKFLOW-CANDIDATES.md`

**Candidates inventoried (7):**

| # | Candidate | Verdict |
|---|---|---|
| 1 | Exchange Request | **🥇 PoC** — existing table, clear timeout risk |
| 2 | Exchange Deal | Strong — phase 2 |
| 3 | Logistics Shipment | Strong — phase 3 (high complexity) |
| 4 | Program Milestone | Moderate — better as signal collector |
| 5 | Processing Workflow | Moderate — physical process semantics |
| 6 | Organization Onboarding | Near-PoC — no existing table |
| 7 | Settlement | **Premature** — Financial Engine is stub |

---

### KPE-07 — Temporal PoC Foundation

**Commit:** `b4bbf80`
**Location:** `packages/workflow-engine/src/temporal/`
**What:** Temporal-compatible workflow structure without Temporal SDK.

| Module | Purpose |
|---|---|
| `src/temporal/types.ts` | TemporalWorkflow, TemporalActivity, TemporalSignal, TemporalTimer |
| `src/temporal/activities.ts` | 5 activity stubs: `notify_reviewer`, `update_request_status`, `notify_parties`, `assess_request_timeout`, `log_activity` |
| `src/temporal/exchange-request-workflow.ts` | 8-step Exchange Request workflow with signal handling and timeout enforcement |
| `tests/` | 20 tests: signal processing, activity execution, full happy/declined/withdrawn paths |

**Design rules:** Activities are the only I/O layer. Workflows are deterministic state machines. No DB access from workflow logic. OPA evaluation gate before high-impact steps.

---

### KPE-08 — OpenTelemetry Baseline

**Commit:** `ef5563d`
**Package:** `packages/telemetry/`
**What:** Minimal tracing abstraction with no-op default.

| Module | Purpose |
|---|---|
| `src/types.ts` | Span, Tracer, TraceContext — OTel-compatible interfaces |
| `src/tracer.ts` | NoopTracer (zero overhead), `withTracing()`/`withAsyncTracing()` HOFs |
| `src/index.ts` | 5 predefined span names |
| `tests/` | 17 tests proving instrumentation never alters behavior |

**Core invariant:** `withTracing(fn, name)` returns a function that for ANY input produces EXACTLY the same output as `fn`. Tested with values, errors, null, undefined, references, variadic args, async.

**Span constants:** `kadarn.api.request`, `kadarn.policy.evaluation`, `kadarn.provenance.correction`, `kadarn.provenance.integrity`, `kadarn.workflow.activity`.

---

### KPE-09 — FHIR Mapping Readiness

**Commit:** `2078f3c`
**Document:** `docs/architecture/fhir/FHIR-MAPPING.md`

**5 resource mappings:**

| FHIR Resource | Source | Readiness |
|---|---|---|
| Organization | `organizations` | High |
| Specimen | `provenance_nodes` WHERE `node_type = 'specimen'` | Medium |
| ResearchStudy | `programs` + `program_milestones` | Medium |
| DocumentReference | `provenance_evidence` | High |
| Observation | `processing_aliquots.qc_status` | Medium |

Each mapping includes: source fields, FHIR elements, cardinality, gaps, status mapping tables.

---

## 2. Deferred (Analyzed, Not Executed)

### KPE-02 — Policy Decision Persistence

**Status:** 🔲 Analyzed — approach agreed, not implemented  
**Goal:** Persist OPA Shadow Mode decisions in `policy_evaluations` table  
**Approach agreed:** Use existing `context` (JSONB) column to store full `PolicyDecision` record. No ALTER TABLE, no schema changes. Map `policy_id`, `outcome`, `evaluated_by`, `organization_id`, `evaluated_at` to existing columns.  
**Why deferred:** Dependencies — needed a stable `policy-engine` first (KPE-01 baseline was still being verified). Ready to implement.

### KPE-03 — OPA External Adapter

**Status:** 🔲 Analyzed — approach agreed, not implemented  
**Goal:** `HttpOpaClient` with timeout and failure handling  
**Approach agreed:** Add `HttpOpaClient` class to existing `OpaClient` interface. No renaming. `LocalOpaClient` unchanged. Tests for timeout and failure in shadow mode never block.  
**Why deferred:** Not needed until OPA server is running. `LocalOpaClient` is sufficient for shadow mode.

---

## 3. Verification Infrastructure

```
npm test              → 16 test files, 228 tests passed
npx tsc --noEmit      → 0 errors
npm run build -w apps  → Build OK (70+ API routes, web app)

Package-level tests:
  packages/provenance      → 29 tests
  packages/telemetry       → 17 tests
  packages/workflow-engine → 20 tests
  ─────────────────────────────────
  TOTAL                   → 294 tests passing
```

---

## 4. Architecture Decisions Confirmed

| Decision | Source | Status |
|---|---|---|
| IMPLEMENTATION-MAP.md replaces floating context | User | ✅ In use |
| KAA documents are read, not rewritten | Rule | ✅ All 3 read |
| Sprint scope is narrow and bounded | Rule | ✅ Verified each sprint |
| No Temporal SDK dependency in PoC | KPE-07 | ✅ Interfaces propias |
| No OpenTelemetry SDK dependency in baseline | KPE-08 | ✅ Interfaces propias |
| No FHIR API exposure yet | KPE-09 | ✅ Document only |
| Shadow mode never blocks | KPE-01 | ✅ Invariant tested |
| Append-only enforced at DB level | PR-001 | ✅ 6 triggers |
| PROV mapping does not move data | KPE-05 | ✅ Pure functions |

---

## 5. Risks

| Risk | Level | Mitigation |
|---|---|---|
| KPE-02 (Policy Persistence) not implemented | Low | Console logging works for shadow mode. DB persistence is nice-to-have until enforcement is enabled. |
| KPE-03 (OPA HTTP Adapter) not implemented | Low | `LocalOpaClient` works for all current use cases. OPA server not deployed. |
| Temporal SDK integration pending | Low | Workflow types defined, activities stubbed. Real Temporal requires: (1) install `@temporalio/*`, (2) worker setup, (3) `TemporalEngine` implementation. |
| OpenTelemetry not wired to routes yet | Low | `withTracing` HOF exists. Wiring is a mechanical pass: wrap route handlers and policy calls. |
| FHIR API not exposed | Low | Mapping is documented. Implementation requires: (1) create `packages/fhir-adapter/`, (2) implement mapping functions, (3) optionally expose as FHIR endpoints. |
| Financial Engine is stub | Medium | Settlement/premature workflows cannot be designed. Requires engine implementation first. |
| 3 duplicate `program` entries in provenance types | Low | NODE_TYPE_MAPPINGS has `program` as Activity. KPE-05 `prov-mapping.ts` had duplicate (now fixed). Edge case: `program` may need both Activity and Agent roles depending on context. |

---

## 6. Next Production Priorities

### Immediate (Next Sprint)

**KPE-02 — Policy Decision Persistence**
- Implement `PolicyDecisionRecorder` that writes to `policy_evaluations` table
- Use `context` JSONB column — no schema changes
- Add test proving failed logging does not block

### Short-term

**KPE-03 — OPA External Adapter**
- Implement `HttpOpaClient` with configurable timeout
- Test: HTTP failure in shadow mode never blocks

**Wire OpenTelemetry to existing routes**
- Wrap `organizations/route.ts` GET with `withTracing`
- Wrap `ShadowModeRunner.evaluate` with `SPAN_POLICY_EVALUATION`
- Wrap provenance correction and integrity resolution

### Medium-term

**Temporal SDK integration**
- Install `@temporalio/workflow`, `@temporalio/activity`
- Connect `ExchangeRequestWorkflow` to real Temporal types
- Create `TemporalEngine` implementation

**FHIR adapter**
- Create `packages/fhir-adapter/` with mapping functions
- First exposure: `Organization` → FHIR `Organization` (highest readiness)

### Long-term

- Exchange Deal Workflow
- Logistics Shipment Workflow
- Financial Engine implementation
- Real OPA server deployment with policy authoring
- FHIR API endpoint exposure

---

## 7. Repository Health

```
Git log (KPE sprints only):
  2078f3c feat: KPE-09 — FHIR Mapping Readiness
  ef5563d feat: KPE-08 — OpenTelemetry Baseline
  b4bbf80 feat: KPE-07 — Temporal PoC Foundation
  83b287a feat: KPE-06 — Temporal Readiness Map
  bcac010 feat: KPE-05 — PROV Semantic Mapping Layer
  7cf038e feat: KPE-04 — PROV append-only runtime validation tests
  489b949 fix: add mode field to PolicyDecision for KPE-01 compliance
  2eef7b1 feat: policy engine integration — route hardening, RLS fixes...
  7e031fc chore: add .gitignore
  ea352b4 Integrate Kadarn Lexicon v1.1... (pre-KPE baseline)

New packages created:
  packages/policy-engine/          (OPA shadow mode, pre-existing)
  packages/provenance/             (KPE-05 — PROV semantic mapping)
  packages/telemetry/              (KPE-08 — tracing abstraction)
  packages/workflow-engine/        (KPE-07 — Temporal PoC)

New docs created:
  docs/architecture/workflows/WORKFLOW-CANDIDATES.md   (KPE-06)
  docs/architecture/fhir/FHIR-MAPPING.md               (KPE-09)

Working tree: CLEAN
```
