# Changelog

All notable changes to Kadarn are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and Kadarn follows [Semantic Versioning](https://semver.org/) once it reaches a Public API release (see Stability Policy, Blueprint §22).

---

---

---

---

## [1.0.0-hardening.11] — 2026-06-28 — Sprint 11: External Integrations Evaluation

### Added

- **ADR-023** — value-based integration decisions (integrate OPA shadow + Realtime; defer Stripe/FHIR/OpenSpecimen; reject BBMRI for sprint scope)
- **HttpOpaClient** — optional OPA HTTP evaluation with LocalOpaClient fallback
- **Integration registry** — `packages/integration-engine/src/registry.ts`
- **Supabase Realtime** — `useSupabaseRealtime` hook + KOC notifications wiring
- **Migration 041** — Realtime publication for `audit_events`, `workflow_tasks`
- **OPA sidecar artifact** — `integrations/opa/docker-compose.yml` (optional dev)
- **Gate tests** — `tests/hardening/sprint11-external-integrations.test.ts`

### Explicit non-actions

- No Stripe SDK
- No FHIR server
- No OpenSpecimen code import
- OPA enforce mode remains off

---

## [1.0.0-hardening.10] — 2026-06-28 — Sprint 10: Knowledge Fabric

### Added

- **Knowledge runtime** — `apps/api/src/lib/knowledge-runtime.ts` (Postgres adapter, auto-ingestion, semantic search)
- **Graph fabric runtime** — `apps/api/src/lib/graph-fabric-runtime.ts` (Knowledge + Trust + Provenance cross-graph)
- **KnowledgeService** — `@kadarn/knowledge-engine` service layer + `mapToExternal` + hierarchy expansion
- **Migration 040** — `knowledge_entity_links`, `ontology_term_candidates`, `discovery_search_semantic`
- **Domain events** — `TermNormalizationRecorded`, `KnowledgeEntityLinked`
- **Gate tests** — `tests/hardening/sprint10-knowledge-fabric.test.ts`

### Changed

- Orchestrator discovery/knowledge stages use real DB-backed fabric (no empty ontology stubs)
- Domain events auto-feed knowledge (`SupplyItemCreated`, feasibility, collection, QC)
- Discovery API uses semantic search with knowledge-expanded terms
- Operational twins pipelines enrich specimen/collection terms via knowledge fabric
- KOC knowledge dashboard aligned to ontology schema

---

## [1.0.0-hardening.9] — 2026-06-28 — Sprint 9: Trust & Financial Runtime

### Added

- **Trust runtime** — Supabase adapter + `apps/api/src/lib/trust-runtime.ts` (dynamic scores, decay on read, evidence recording)
- **Financial runtime** — escrow/settlement/invoice/payment/reconciliation in `@kadarn/financial-engine/src/runtime/`
- **API financial runtime** — `apps/api/src/lib/financial-runtime.ts` with DB persistence
- **Migration 039** — `financial_invoices`, `financial_payments`, `financial_reconciliations`; escrow `completed`/`cancelled`
- **Domain events** — `TrustEventRecorded`, `InvoiceIssued`, `PaymentRecorded`, `SettlementReconciled`
- **Gate tests** — `tests/hardening/sprint9-trust-financial-runtime.test.ts`

### Changed

- Orchestrator `runTrustStage` / `runFinancialStage` use real runtimes (no fixed 0.5 trust stub)
- Settlement status changes record trust evidence and full financial lifecycle
- Operations exceptions route aligned to trust challenge schema

---

## [1.0.0-hardening.8] — 2026-06-28 — Sprint 8: Workflow Runtime Decision

### Added

- **ADR-022** — definitive runtime: Workflow Engine 2.0 + PostgreSQL + event dispatcher; Temporal deferred
- **Runtime dispatcher** — `packages/workflow-engine/src/runtime/` connects `WorkflowSignalRequested` → execution
- **Migration 038** — `next_wake_at` on instances + seed `exchange-request` definition
- **Evaluation doc** — `docs/engineering/SPRINT-8-WORKFLOW-RUNTIME-EVALUATION.md` (Temporal vs Engine 2.0 vs alternatives)
- **Gate tests** — `tests/hardening/sprint8-workflow-runtime.test.ts`, `tests/integration/workflow-runtime.test.ts`

### Changed

- `event-runtime.ts` dispatches `WorkflowSignalRequested` to `dispatchWorkflowSignal()`
- `@kadarn/workflow-engine` exports runtime API from package index

### Explicit non-actions

- No `@temporalio/*` packages added
- No Temporal Server deployment

---

## [1.0.0-hardening.7] — 2026-06-28 — Sprint 7: Observability

### Added

- **Structured JSON logger** — `@kadarn/telemetry` Loki-ready stdout logs with correlationId/traceId
- **Prometheus metrics** — in-process registry + `GET /api/metrics` exposition
- **Recording tracer** — OTel-compatible tracing when `KADARN_TRACING=enabled`
- **Readiness probe** — `GET /api/health/ready` (database + event runtime checks)
- **Observability stack artifacts** — optional Prometheus/Grafana compose, alert rules, dashboard JSON
- **Technology evaluation** — `observability/EVALUATION.md` (OTel, Grafana, Loki, Tempo, Prometheus)
- **Static regression gate** — `tests/hardening/sprint7-observability.test.ts`
- **Engineering report** — `docs/engineering/SPRINT-7-ENGINEERING-REPORT.md`

### Changed

- Health endpoint includes uptime and observability status
- Pipeline orchestrator records stage duration histograms and run counters
- Domain event publish increments `kadarn_domain_events_published_total`
- KOC platform-health includes metrics snapshot

---

## [1.0.0-hardening.6] — 2026-06-28 — Sprint 6: Engine Orchestration

### Added

- **Engine orchestrator** — `apps/api/src/lib/engine-orchestrator.ts` with 13 named pipelines and 11 canonical stages
- **Stage handlers** — connect Discovery, Exchange, Policy, Workflow, Provenance, Trust, Financial, Analytics, Knowledge, Twins, Telemetry
- **New domain events** — `PipelineStageCompleted`, `AnalyticsProjectionRequested`, `DiscoveryContextEnriched`
- **Static regression gate** — `tests/hardening/sprint6-engine-orchestration.test.ts` (43 tests)
- **Integration tests** — `tests/integration/engine-pipeline.test.ts`
- **Engineering report** — `docs/engineering/SPRINT-6-ENGINEERING-REPORT.md`

### Changed

- All 14 critical mutating routes delegate to `runPipeline()` instead of direct helper calls
- Sprint 5 provenance gate updated: provenance recorded via orchestrator stage handlers
- API `next.config.ts`: `transpilePackages` + monorepo turbopack root for engine packages
- Engine package imports: removed `.js` extensions for Next.js bundler compatibility

### Fixed

- Isolated engine calls in route handlers (Sprint 6 gate violation)
- Next.js build failures when importing `@kadarn/*-engine` packages

---

## [1.0.0-hardening.5] — 2026-06-28 — Sprint 5: Provenance Everywhere

### Added

- **Central provenance recorder** — `apps/api/src/lib/provenance-recorder.ts` (event + `upsert_provenance_node` persistence)
- **Migration 037** — extends `provenance_node_type` enum for exchange, workflow, settlement, twin events
- **New recorders** — workflow, deal updates, access decisions, shipment status, twin sync, specimen twin, policy evaluation
- **Static regression gate** — `tests/hardening/sprint5-provenance.test.ts` (25 tests)
- **Engineering report** — `docs/engineering/SPRINT-5-ENGINEERING-REPORT.md`

### Fixed

- Provenance events were emitted but never persisted to `provenance_nodes`
- Invalid helper node types (`collection_twin`, `discovery_search`) incompatible with DB enum
- Critical gaps: deal PATCH, request approve/reject, shipment status, marketplace feasibility POST, specimen twin POST

### Changed

- Helpers delegate to `provenance-recorder`; all recorders require `actorId`
- Policy shadow bridge also writes `policy_evaluation` provenance nodes
- Removed provenance stubs from read-only discovery GET routes
- Health endpoint version → `1.0.0-hardening.5`
- Sprint 2 health gate test accepts any `1.0.0-hardening.N` version

### Verification

```
npm run verify                                   PASS
database/migrations ↔ supabase/migrations          37/37 identical
tests/hardening/sprint5-provenance.test.ts       25 tests PASS
Total offline gate                               470 passed
```

---

## [1.0.0-hardening.4] — 2026-06-28 — Sprint 4: Domain Events Runtime

### Added

- **Migration 036** — `036_domain_events_runtime.sql`: `domain_event_store`, `domain_event_outbox`, `publish_domain_event`, `process_domain_event_outbox`, `replay_domain_events`
- **Domain events runtime** — `apps/api/src/lib/event-runtime.ts` (Postgres RPC + in-memory `OutboxEventBus` fallback)
- **Platform services** — `InMemoryEventStore`, `OutboxEventBus` with idempotency and replay
- **Event versioning** — `EVENT_VERSIONS` map in `@kadarn/domain-events`
- **Integration events** — `WorkflowSignalRequested`, `PolicyShadowEvaluated`, `TrustScoreEvaluated`, `ProvenanceRecordRequested`, `DataErasureRequested`
- **Policy shadow bridge** — `policy-shadow-bridge.ts` wires OPA shadow to domain events (replaces stdout logging)
- **Static regression gate** — `tests/hardening/sprint4-domain-events.test.ts`
- **Outbox unit tests** — `packages/platform-services/__tests__/outbox-event-bus.test.ts`
- **Engineering report** — `docs/engineering/SPRINT-4-ENGINEERING-REPORT.md`

### Fixed

- All API cross-engine hooks used `console.log(JSON.stringify({ type: 'domain_event'…}))` — replaced with typed domain event publish
- `ConsoleDecisionRecorder` in policy-engine logged shadow decisions to stdout
- Broken `event-runtime.ts` interface and TypeScript cast errors in outbox bus

### Changed

- Helpers (`onboarding`, `exchange-helper`, `logistics-helper`, `audit`) publish via `publishIntegrationEvent`
- Health endpoint version → `1.0.0-hardening.4`
- Vitest alias `@/` → `apps/api/src` for integration tests importing API helpers

### Verification

```
npm run verify                                    PASS
database/migrations ↔ supabase/migrations           36/36 identical
tests/hardening/sprint4-domain-events.test.ts      14 tests PASS
npm run test -w @kadarn/platform-services         16 tests PASS
Total offline gate                                445 passed
```

---

## [1.0.0-hardening.3] — 2026-06-28 — Sprint 3: Database & Compliance Hardening

### Added

- **Migration 035** — `035_compliance_append_only.sql`: DB-level append-only triggers for `audit_events`, `policy_evaluations`, `trust_events`, `twin_events`
- **Regulatory audit trail** — `regulatory_submission_events` (append-only) + auto-logging on submission status changes
- **Generic trigger helpers** — `apply_append_only_triggers()`, `reject_append_only_update/delete()`
- **Schema compatibility** — `policy_evaluations.result`/`created_at` generated columns; `policies.policy_type`/`severity`
- **pgTAP tests** — `tests/compliance/append-only-triggers.pgtest.sql`
- **Static regression gate** — `tests/hardening/sprint3-database.test.ts` (migration parity SHA-256)
- **Engineering report** — `docs/engineering/SPRINT-3-ENGINEERING-REPORT.md`

### Fixed

- Append-only documented but not enforced on compliance tables (only provenance had triggers)
- API/schema drift on `policy_evaluations` (`outcome` vs `result`) and `policies` columns
- `operations/compliance` queried non-existent `authority` column on `regulatory_submissions`

### Changed

- `REVOKE UPDATE, DELETE` on all append-only tables from `anon` and `authenticated` roles
- Health endpoint version → `1.0.0-hardening.3`

### Verification

```
npm run verify                          PASS
database/migrations ↔ supabase/migrations  35/35 identical
tests/hardening/sprint3-database.test.ts   17 tests PASS
```

---

## [1.0.0-hardening.2] — 2026-06-28 — Sprint 2: API Production Hardening

### Added

- **Workspace real queries** — 14 `/api/v1/workspace/*` routes backed by Supabase (inventory, collections, qc, processing, logistics, programs, requests, consent, regulatory, documents, payments, applications, exchange, analytics)
- **Org context helper** — `apps/api/src/lib/workspace.ts` with `requireActiveOrg()` (422 if no active org)
- **Rate limiting** — `apps/api/src/lib/rate-limit.ts` + global middleware (120 req/min/IP)
- **Legacy redirects** — all `/api/*` routes (except health) → 308 to `/api/v1/*`
- **v1 canonical routes** — programs, exchange, discovery, feasibility, organizations, account/me, audit-events
- **Sprint 2 regression gate** — `tests/hardening/sprint2-api.test.ts`
- **Engineering report** — `docs/engineering/SPRINT-2-ENGINEERING-REPORT.md`

### Fixed

- **11 workspace stubs** — removed `x-org-id ?? 'org-default'` and hardcoded `items: []`
- **Fake KOC compliance** — now queries `policies` / `policy_evaluations`
- **Fake KPE generate** — Zod + redirect to real `/api/v1/programs/:id/kpe`
- **Health version** — reports `1.0.0-hardening.2` and `api_version: v1`
- **Integration tests** — audit-coverage, multi-tenant, onboarding updated for v1 paths

### Changed

- Legacy `/api/programs`, `/api/exchange`, `/api/discovery`, `/api/feasibility`, `/api/organizations`, `/api/me`, `/api/audit-events` are redirect-only
- API middleware adds `X-Kadarn-Api-Version: v1` and `Deprecation` on legacy paths

### Verification

```
npm run verify       PASS (typecheck + build + 416 tests + secrets)
grep org-default     0 matches in apps/api
grep readyForAudit   0 matches in apps/api
```

---

## [1.0.0-hardening.1] — 2026-06-28 — Sprint 1: Repository Integrity

### Added

- **CI workflow** — `.github/workflows/ci.yml` runs typecheck, build, unit tests, secret scan on every PR
- **Test matrix** — `docs/engineering/TEST-MATRIX.md` documents all official and extended commands
- **Engineering report** — `docs/engineering/SPRINT-1-ENGINEERING-REPORT.md`
- **Cross-platform secret scanner** — `scripts/check-secrets.mjs` (replaces bash-only gate on Windows)
- **`npm run verify`** — single gate: typecheck + build + test + check:secrets
- **Monorepo typecheck** — all 23 apps/packages expose `typecheck`; root runs `--workspaces --if-present`
- **Build env fallbacks** — `apps/web/next.config.ts` for CI/local builds without `.env.local`

### Fixed

- **Broken Next.js install** — root `npm ci` restores `next/dist/bin/next`; removed nested lockfiles
- **Web build** — Suspense boundaries for `useSearchParams` (login, feasibility, access pages)
- **Middleware types** — explicit `CookieOptions` typing
- **Package type errors** — knowledge-engine, platform-services, trust-engine, `@kadarn/ui`
- **Orphan dependency** — `platform-services` → `@kadarn/domain-events: "*"`

### Changed

- Root `build` now builds **web + api**
- Root `test` remains offline unit gate; integration tests via `npm run test:integration`
- README rewritten for current repo state (no longer "pending" apps)

### Verification

```
npm ci               Clean install
npm run verify       PASS (typecheck + build + 406 tests + secrets)
```

---

## [v1.0.0-alpha.2] — 2026-06-28 — Pilot Readiness Validated

### Added

- **APF-01 Identity Bootstrap** — `scripts/seed-pilot-users.ts` creates 7 pilot users in Supabase Auth with profiles and memberships. Idempotent, no passwords committed, production safety guard.
- **APF-02 Sample Lifecycle Schema Fix** — Migration 033: `ALTER TABLE collection_twins ALTER COLUMN id SET DEFAULT gen_random_uuid()`. Resolves pilot blocker where collection inserts failed without explicit UUID.
- **APF-03 Twin UUID Hardening** — Migration 034: Added `DEFAULT gen_random_uuid()` to 4 twin tables (organization_twins, shipment_twins, specimen_twins, transaction_twins). Schema audit of 19 pilot-critical tables completed.
- **APF-04 Pilot Re-run** — Full 10-step pilot flow executed successfully (0 errors, score 9/10).
- **ALPHA-PILOT-01 Production Seed** — `scripts/seed-pilot.sql` with realistic pilot data (6 orgs, 2 programs, exchange flow, shipments, provenance).
- **ALPHA-PILOT-02 Operational Runbook** — Complete 30-day pilot runbook with success/failure criteria, recovery/rollback procedures.
- **ALPHA-PILOT-03 Pilot Execution** — First pilot run identified 8 issues (3 critical). Score: 4.3/10.
- **SIT-01 Supabase Integration Gate** — 38 tests validating connection, migrations, RLS, provenance, RPCs, key tables.
- **Audit coverage completion** — Centralized `emitAuditEvent()`. 23/25 state-changing routes verified.

### Fixed

- **collection_twins.id** now auto-generates UUID (Migration 033)
- **4 twin tables** now auto-generate UUIDs (Migration 034)
- **check-secrets.sh** exclusions updated for documentation files

### Changed

- `.env.example` — Created for all app directories with placeholders only
- `scripts/check-secrets.sh` — Improved exclusion patterns
- `docs/ops/SUPABASE-SECRETS-SETUP.md` — Secret classification and rotation procedures

### Known Limitations

- Real external biobank not yet onboarded
- Production Supabase not yet validated
- Stripe / payment gateway not integrated
- OPA external adapter (KPE-03) deferred
- Policy decision persistence (KPE-02) deferred
- Temporal SDK not installed
- FHIR adapter not implemented

### Verification

```
npm test             415 passed (30 files)
npx tsc --noEmit     0 errors
npm run build        Build OK
bash check-secrets   All clear
```

---

## [0.1.0] — 2026-06-26 — Foundation Validated

### Added

- **Trust & Security Foundation** — 86 security tests passing across 7 suites:
  - Identity (19 tests): JWT login, memberships, multi-org users
  - Authorization (17 tests): RLS isolation, program access, role checks
  - Audit (6 tests): audit triggers, immutability, actor tracking
  - Threat (13 tests): JWT tampering, org spoofing, privilege escalation
  - Compliance (19 tests): timestamp consistency, data integrity, immutability
  - Concurrency (14 tests): unique constraints, race conditions, idempotency
  - Performance (8 tests): baseline metrics for login and queries
- **ADR-003** — Processing Engine Philosophy: bounded LIMS integration
- **ADR-004** — Platform Boundaries: explicit scope of what Kadarn does/doesn't do
- **Kadarn Processing Engine** — Blueprint §12: sample lifecycle, workflows, QC, storage, custody, instrument runs, LIMS connectors
- **Domain events package** — `packages/domain-events/` with 17 typed event contracts + EventBus interface
- **Stability policy** — Blueprint §22: Experimental / Stable / Public levels
- **Repository governance** — `CONTRIBUTING.md`, `ARCHITECTURE.md`, `CHANGELOG.md`

### Changed

- **Blueprint restructured** — Sections renumbered 12→22 to accommodate Processing Engine
- **Sprint roadmap updated** — Processing Engine sprint added; Sprint 0 marked ✅ Committed
- **Migrations moved** — `apps/backend/migrations/` → `database/migrations/`

### Fixed

- **PostgREST permissions** — Base-level grants for `authenticated` role restored after DROP/CREATE cycle
- **Audit trigger table mapping** — Plural table names (`programs` → `'program'`) now correctly map to singular enum values
- **RLS detection in tests** — `tryDelete`/`tryUpdate` now detect when PostgREST returns 204 with 0 affected rows
- **User creation** — `admin_create_user` SQL function replaced by `seed-users.ts` using Auth API (SQL-only creation didn't produce login-capable users)
- **JWT claims** — `sync_profile_to_auth_meta` trigger now merges instead of overwriting `raw_app_meta_data`

### Security

- All RLS policies verified against real JWT contexts
- Threat validation confirms: JWT tampering blocked, org ID spoofing blocked, privilege escalation blocked
- Audit immutability confirmed: no UPDATE or DELETE policies on `audit_events`

---

## [0.0.1] — 2026-06-25 — Sprint 0 Foundation

### Added

- Initial blueprint — 20 sections covering architecture, principles, engines, roadmap
- ADR-001: Platform Core vs. Service Layer Separation
- ADR-002: Multi-Tenant Architecture & Organization Model
- Strategic positioning document
- Salvage review: prototype → clean platform classification
- Database migrations 008-012:
  - 008: Organizations, capabilities, memberships, roles, identity providers
  - 009: RLS helper functions + policies for all Sprint 0 tables
  - 010: Audit events, programs, program participants, access policies
  - 011: Seed data (7 orgs, 8 users, 2 programs)
  - 012: Structural smoke tests (53 tests)

### Changed

- Prototype archived as `archive/pre-kadarn-platform-prototype`
- Vilo-specific code removed from all migrations

---

## Future Releases

| Version | Sprint | Focus |
|---------|--------|-------|
| 0.2.0 | 1B | Core API |
| 0.3.0 | 2 | Platform Services |
| 0.4.0 | 3 | Discovery Engine |
| 0.5.0 | 4 | Feasibility Engine |
| 0.6.0 | 5 | Program Engine |
| 0.7.0 | 6 | Exchange Engine |
| 0.8.0 | 7 | Fulfillment / Chain |
| 0.9.0 | 8 | Regulatory |
| 0.10.0 | 9 | Processing Marketplace |
| 0.11.0 | 10 | Analytics |
| 0.12.0 | 11 | AI Layer |
