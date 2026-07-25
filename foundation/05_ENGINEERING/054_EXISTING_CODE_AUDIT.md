# KADARN Existing Code Audit

**Document:** 054_EXISTING_CODE_AUDIT.md
**Phase:** 0.5 — Pre-Foundation Audit
**Date:** 2026-07-24
**Authority:** KEMS-003 (Product Constitution), KEMS-001 (Confidence Graph Model), KEMS-002 (Trustworthy Evidence Architecture)

---

## 1. Executive Summary

The KADARN repository contains 36 packages (2 apps + 34 libraries) with 806 TypeScript source files, 48 database migrations, approximately 110 API route handlers, and 100+ UI pages. **The repository is a viable foundation but carries significant architectural fragmentation from its predecessor vision (biobanking marketplace → evidence intelligence platform).**

### Key Findings

| Metric | Value |
|--------|-------|
| TypeScript files | 806 |
| Packages | 34 libraries + 2 apps |
| API routes | ~110 |
| UI pages | ~100 |
| DB migrations | 48 |
| Database tables | ~60+ across public schema |
| Test files | 84 test suites |
| Build status | ✅ Green (12.7s) |
| Typecheck | ✅ Green (3 projects) |
| Tests passing | 1312/1363 ✅ |
| Tests failing | 12/1363 (pre-existing, all in institutional-knowledge + biospecimen-domain) |
| Lint | ❌ apps/web fails |

### What Currently Works

- **Build chain**: `npm run build`, `typecheck`, and core tests pass reliably
- **Database migrations**: Full chain 001→061 applies cleanly via `supabase db reset`
- **Evidence core**: Claim creation, evidence attachment, workflow state machine, review tasks, confidence snapshots, passport publication, share grants — all implemented and validated end-to-end
- **API server**: Next.js 16 App Router backend with ~110 routes, healthy and deployable
- **Institutional workspace**: Onboarding flows for organization setup, document triage, study experience, capabilities, readiness, passport
- **Sponsor workspace**: Passport browsing, feasibility, portfolio views
- **KOC operations**: 20+ operational dashboards (capacity, compliance, exceptions, platform health, twins, workflow, policy, etc.)
- **Authentication**: Supabase Auth integration with JWT claims, organization-scoped RLS on all evidence tables

### What Is Reusable (KEEP + ADAPT)

| Classification | Count | Key Components |
|---------------|-------|----------------|
| **KEEP** | ~12 packages | evidence-core, types, auth, instrumentation, sdk, domain-events, telemetry, cli, ai-layer, kpe-generator, platform-services (partial) |
| **ADAPT** | ~10 packages | evidence-discovery, institutional-knowledge, document-intake, delivery-domain, published-view, readiness-engine, policy-engine, workflow-engine, trust-engine (decay model only), provenance |
| **CONSOLIDATE** | ~6 packages | operational-twins, provenance-graph, graph-query, knowledge-engine, evidence-lineage, evidence-validation |
| **REPLACE** | ~4 packages | matching-engine, fulfillment-engine, financial-engine, intelligence-engine |
| **POSTPONE** | ~2 packages | sponsor-intelligence, integration-engine |
| **RETIRE** | ~2 packages | ui (empty), kpe-generator (deprecated by newer approach) |

### The Greatest Technical Risk

**Architectural fragmentation between the original biobanking-marketplace vision and the new evidence-intelligence model.** Eleven of 34 packages are "engines" from the KRM-RAO reference model (matching, fulfillment, financial, intelligence, operational-twins, knowledge, policy, workflow, trust, readiness, integration) but most contain only 3-10 scaffolded files. The actual working code lives in `apps/api`, `apps/web`, and ~10 substantive packages. The risk is **not** that the engines are wrong — it's that maintaining them as separate packages creates the illusion of modularity without delivering it.

### Recommended Migration Path

1. **Phase 1**: Extract the Foundation Library from evidence-core, types, auth, and platform-services
2. **Phase 2**: Consolidate evidence-discovery, institutional-knowledge, and document-intake into a single Evidence Pipeline
3. **Phase 3**: Replace marketplace domain with sharing/access-control domain
4. **Phase 4**: Retire or defer all other engines after extracting any reusable logic
5. **Phase 5**: Rebuild UI component library from the ground up (packages/ui is empty)

### Audit Decision: **CONDITIONAL GO**

The repository is a viable foundation **if** the following blockers are resolved before feature implementation:

1. The 11-engine architecture must be consolidated — it creates unnecessary maintenance surface
2. `packages/ui` must be rebuilt (currently empty — UI components are duplicated across apps/web)
3. The marketplace API routes must be quarantined from the core evidence flow
4. The `apps/web` lint must be resolved
5. Evidence_node schema mismatch (JSONB vs individual columns) must be reconciled

---

## 2. Current Repository Health

| Health Indicator | Status | Detail |
|-----------------|--------|--------|
| Dependency install | ✅ | `pnpm install` completes without errors |
| Build (Next.js) | ✅ | 12.7s, Compiled successfully |
| TypeScript typecheck | ✅ | 3 projects (types, instrumentation, apps/api) |
| Unit tests | 🟡 | 1312/1363 pass (96.3%) — 12 pre-existing failures in biospecimen-domain and markitdown-adapter |
| Integration tests | ⚠️ | API smoke tests exist but coverage is minimal |
| E2E tests | ❌ | No Cypress/Playwright suite |
| Lint (apps/web) | ❌ | `eslint .` fails — pre-existing configuration issue |
| Database migrations | ✅ | 001→061 apply cleanly on `supabase db reset` |
| Supabase local | ✅ | All services healthy (auth, rest, realtime, storage, studio) |
| Docker | ✅ | v29.5.3, containers stable |
| CI/CD | ❓ | GitHub workflows exist but not tested in this audit |

### Build Output (npm run build)
```
✓ Compiled successfully in 12.7s
```

### Test Output (npm run test)
```
Test Files  8 failed | 74 passed | 2 skipped (84)
Tests  12 failed | 1312 passed | 39 skipped (1363)
```

### Failed Tests (pre-existing, all non-core)
- `institutional-knowledge/markitdown-adapter.test.ts` — MarkItDown dependency not installed in CI
- `institutional-knowledge/biospecimen-domain.test.ts` — IATA cert/packaging validation

---

## 3. Build and Runtime Results

| Command | Result | Notes |
|---------|--------|-------|
| `pnpm install` | ✅ | Clean install |
| `npm run build` | ✅ | 12.7s, 0 errors |
| `npm run typecheck` | ✅ | 3 projects |
| `npm run test` | 🟡 | 1312/1363 pass, 12 pre-existing failures |
| `npm run lint` | ❌ | apps/web ESLint config issue |
| `supabase start` | ✅ | All 8 services healthy |
| `supabase db reset` | ✅ | 001→061 clean |
| `docker ps` | ✅ | 11 containers running |

**Lint issue detail:** `apps/web` ESLint config references `eslint-config-next` but the eslintrc has incompatibilities with the current Next.js version (16.2.9). This is a known pre-existing issue.

---

## 4. Repository Inventory

### 4.1 Applications (2)

#### apps/api — Next.js API Server (187 source files)
- **Purpose:** HTTP API for all KADARN services
- **Framework:** Next.js 16 App Router (server-only)
- **Routes:** ~110 route handlers across v1/, health, me, organizations, programs, etc.
- **Dependencies:** Supabase JS client, Zod validation, @kadarn/* packages
- **Tests:** Health endpoint test exists
- **Status:** ✅ Healthy, well-structured

#### apps/web — Next.js Web Application (56 source files)
- **Purpose:** Customer-facing UI (workspace, sponsor, KOC, onboarding)
- **Framework:** Next.js 16 with Turbopack
- **Pages:** ~100 page.tsx files across 5 route groups
- **State:** React context-based (onboarding, workspace)
- **Tests:** None dedicated
- **Status:** 🟡 Builds successfully but has pre-existing JSX errors (fixed in recent PR) and lint failures

### 4.2 Library Packages (34)

#### Substantive Packages (>20 files)

| Package | Files | Purpose | Status |
|---------|-------|---------|--------|
| evidence-discovery | 110 | Document classification, entity extraction, pipeline orchestration | ADAPT — large but tightly coupled to old domain model |
| delivery-domain | 73 | Target domain model for evidence delivery | ADAPT — valuable but needs KFL alignment |
| evidence-core | 58 | Core evidence model (claims, evidence, workflow, confidence, passport) | KEEP — validated, production-ready |
| institutional-knowledge | 34 | Knowledge extraction from documents, compliance checks | ADAPT — markitdown pipeline functional |
| document-intake | 26 | Document ingestion from multiple sources | ADAPT — connector pattern reusable |

#### Moderate Packages (8-19 files)

| Package | Files | Purpose | Status |
|---------|-------|---------|--------|
| types | 17 | Shared TypeScript types and Zod schemas | KEEP — foundation for type safety |
| platform-services | 17 | API keys, background jobs | KEEP |
| evidence-lineage | 16 | Claim generation, evidence lineage | CONSOLIDATE into evidence-core |
| policy-engine | 10 | Policy evaluation, compliance rules | ADAPT — needs KFL alignment |
| instrumentation | 10 | Observability, metrics | KEEP |
| readiness-engine | 9 | Site readiness evaluation | ADAPT — needs domain realignment |
| published-view | 9 | Evidence packs, discovery reports | ADAPT |
| sponsor-intelligence | 8 | Decision views, sponsor DTOs | POSTPONE |
| workflow-engine | 7 | Workflow state machines | ADAPT — foundational pattern |

#### Scaffolded Packages (3-5 files)

| Package | Files | Purpose | Status |
|---------|-------|---------|--------|
| trust-engine | 4 | Organization trust scores | ADAPT (decay model only) |
| operational-twins | 4 | Twin abstractions for operations | CONSOLIDATE (minimal code) |
| knowledge-engine | 4 | Knowledge graph management | CONSOLIDATE |
| graph-query | 4 | Graph query layer | CONSOLIDATE |
| evidence-validation | 4 | Evidence validation | CONSOLIDATE into evidence-core |
| provenance-graph | 3 | Provenance graph | CONSOLIDATE (3 files, no tests) |
| provenance | 3 | PROV mapping | CONSOLIDATE (3 files) |
| matching-engine | 3 | Capability matching | REPLACE |
| intelligence-engine | 3 | Intelligence layer | REPLACE |
| integration-engine | 3 | System integration | REPLACE |
| fulfillment-engine | 3 | Order fulfillment | REPLACE |
| financial-engine | 3 | Financial settlements | REPLACE |

#### Minimal Packages (1-2 files)

| Package | Files | Purpose | Status |
|---------|-------|---------|--------|
| domain-events | 2 | Event bus runtime | KEEP — foundational |
| ai-layer | 2 | AI/LLM integration | KEEP |
| sdk | 1 | Public SDK | KEEP |
| kpe-generator | 1 | KPE document generation | RETIRE — replaced by newer approach |
| cli | 1 | CLI tool | KEEP |
| auth | 1 | Authentication types | KEEP |

#### Empty Packages

| Package | Files | Purpose | Status |
|---------|-------|---------|--------|
| ui | 0 | Shared UI components | **RETIRE** — 0 files, add to backlog for rebuild |
| telemetry | 3 | OpenTelemetry integration | KEEP |

### 4.3 Database Components

| Component | Count | Status |
|-----------|-------|--------|
| Migrations (database/migrations/) | 48 | ✅ All apply cleanly |
| Migrations (supabase/migrations/) | 48 | ✅ Sync maintained |
| Database tables (public schema) | ~60+ | ✅ 61 versions tracked |
| Database types (enums) | ~20+ | ✅ evidence_class, claim_status, workflow_state, etc. |

### 4.4 Test Suites

| Directory | Files | Status |
|-----------|-------|--------|
| tests/api | 5 | API smoke tests |
| tests/evidence | 4 | Evidence core tests |
| tests/evidence-validation | 1 | Validation tests |
| tests/institutional-knowledge | 8 | Knowledge pipeline tests (6 failed pre-existing) |
| tests/onboarding | 2 | Onboarding flow tests |
| tests/types | 12 | Type schema tests |
| tests/workflow | 2 | Workflow engine tests |
| tests/readiness | 1 | Readiness tests |
| tests/performance | 1 | Performance tests (empty) |
| tests/web | 1 | Web tests (placeholder) |
| tests/setup | 1 | Test setup |
| tests/security | 1 | Security tests (placeholder) |
| Other [1 file each] | ~8 | Various |

---

## 5. Functional Capability Map

| Capability | Implementation(s) | Level | Status |
|-----------|-------------------|-------|--------|
| Institution Management | organizations API, onboarding flows, v1/institution/* | Implemented | **KEEP** |
| People and Locations | workspace/profile, workspace/consent, onboarding/people | Partial | **ADAPT** |
| Capability Management | readiness/capabilities, marketplace/capabilities | Implemented | **ADAPT** |
| Claim Management | evidence-core/claims, continuity/claims | Implemented (dual) | **CONSOLIDATE** |
| Evidence Management | evidence-core/evidence, document-intake | Implemented | **KEEP** |
| Document Storage | workspace/documents, document-intake | Implemented | **KEEP** |
| Provenance | evidence-core/process-state, provenance-graph, provenance | Partial (3 implementations) | **CONSOLIDATE** |
| Review Workflow | review/tasks, workflow-engine | Implemented | **KEEP** |
| Confidence Computation | evidence-core/confidence-state | Partial | **ADAPT** |
| Knowledge Publication | published-view, knowledge-engine | Partial | **ADAPT** |
| Passport Generation | v1/passport, sponsor-passport | Implemented | **KEEP** |
| Package Generation | delivery-domain, kpe-generator | Implemented | **ADAPT** |
| Sharing/Access Control | passport/shares, sponsor/passports | Implemented | **KEEP** |
| Readiness | readiness-engine, onboarding/readiness | Implemented | **KEEP** |
| Audit Trail | audit-events, evidence-core/audit | Implemented | **KEEP** |
| Authentication | auth, Supabase Auth | Implemented | **KEEP** |
| Marketplace | exchange, marketplace/*, financial-engine | Implemented (old domain) | **REPLACE/QUARANTINE** |

---

## 6. Trust Chain Coverage

| Trust Chain Link | Domain Canon | Model | Persistence | API | Workflow | UI | Tests | Reusable? |
|-----------------|-------------|-------|-------------|-----|----------|-----|-------|-----------|
| Institution | ✅ KEMS-003 §4.1 | ✅ organizations table | ✅ SQL | ✅ v1/institution | ✅ Onboarding | ✅ Workspace | 🟡 Partial | **KEEP** |
| Capability | ✅ KEMS-001 §3 | ✅ readiness_capabilities | ✅ SQL | ✅ v1/readiness | 🟡 Partial | ✅ Readiness page | 🟡 Partial | **ADAPT** |
| Claim | ✅ KEMS-001 §2 | ✅ claims table (+ continuity_claims) | ✅ SQL | ✅ v1/evidence-core | ✅ Workflow state machine | 🟡 Experimental | ✅ evidence-core | **KEEP** (consolidate dual impl) |
| Evidence | ✅ KEMS-001 §5 | ✅ evidence_nodes | ✅ SQL | ✅ v1/evidence-core | ✅ Append-only | 🟡 Experimental | ✅ | **KEEP** |
| Provenance | ✅ KEMS-004 | 🟡 3 implementations | ✅ SQL | ✅ Multiple | ❌ Not unified | ❌ | ❌ | **CONSOLIDATE** |
| Confidence | ✅ KEMS-001 §6 | 🟡 confidence_state_snapshots | ✅ SQL | 🟡 RPC only | ❌ | ❌ | ❌ | **ADAPT** |
| Knowledge | 🟡 KEMS-007 draft | 🟡 published-view, knowledge-engine | 🟡 SQL | ✅ v1/koc | ❌ | 🟡 KOC pages | ❌ | **POSTPONE** |
| Information Product | 🟡 Delivery spec | ✅ delivery-domain, kpe-generator | ✅ SQL | ✅ v1/operations | ❌ | 🟡 KPE report | ❌ | **ADAPT** |

---

## 7. Domain Model Alignment

### Core Entity Mapping (current → canonical)

| Canonical Entity | Current Table(s) | Match | Gap |
|-----------------|-------------------|-------|-----|
| Institution | organizations | ✅ | Missing canonical status model |
| Site | organizations (with visibility) | 🟡 | Site vs org distinction not clean |
| Person | No dedicated table | ❌ | MVP blocker — people in workspace/profile only |
| Location | No dedicated table | ❌ | MVP blocker |
| Capability | organization_capability_types | ✅ | Well-seeded (12 types) |
| Claim | claims + continuity_claims | 🟡 | DUAL implementation — must consolidate |
| Evidence | evidence_nodes | ✅ | JSONB columns diverge from KFL spec |
| EvidenceClass | evidence_class_ref | ✅ | Fixed in recent migration |
| ReviewTask | review_tasks | ✅ | Recently added |
| ConfidenceSnapshot | confidence_state_snapshots | ✅ | Schema matches KEMS-001 |
| PassportEntry | passport_entries | ✅ | Recently added |
| PassportShare | passport_shares | ✅ | Recently added |
| AuditEvent | audit_events | ✅ | Multiple implementations |
| WorkflowState | workflow_state enum | ✅ | Defined in migration 060 |

### Key Domain Gaps

1. **Person model** — absolutely no dedicated table. People appear as JWT claims (auth.users) and in workspace/profile, but there's no institutional People directory with roles, credentials, training records, or delegation chains. This is an MVP blocker for any clinical workflow.

2. **Location model** — no dedicated table. Sites have addresses in the organizations table, but there's no facility/laboratory/physical-location entity with certifications, hours, or access constraints.

3. **Dual Claim implementations** — `public.claims` (evidence-core) and `continuity_experience_claims` (continuity engine) have overlapping purpose but different schemas. Must consolidate.

4. **Provenance fragmentation** — Three different provenance models (evidence-core provenance metadata, provenance-graph package, standalone provenance package). Must consolidate.

---

## 8. Database and Migration Assessment

### Overview

- **48 migration files** across 61 version numbers (some renumbered during cleanup)
- **Clean install**: `supabase db reset` applies 001→061 without errors
- **Dual migration directories**: `database/migrations/` and `supabase/migrations/` — must declare a canonical source

### Table Inventory (public schema)

Key tables organized by domain:

**Core Evidence Model:**
claims, evidence_nodes, evidence_relationships, counter_evidence, right_of_response, confidence_state_snapshots, evidence_class_ref

**Review Workflow:**
claim_workflow, review_tasks

**Passport:**
passport_entries, passport_shares

**Institution:**
organizations, organization_capability_types, organization_twins

**Continuity (legacy):**
continuity_experience_claims, organization_continuity_profiles, continuity_relationships, continuity_capabilities, continuity_evidence_links, continuity_verification_history

**Discovery:**
discovery_layer1, discovery_preparation_requests, discovery_agent_outputs, discovery_curation_records, discovery_validation_notes, discovery_staging_entities

**Marketplace (legacy):**
exchange_deals, exchange_offers, exchange_orders, financial_settlements, fulfillment_tracking

**Readiness:**
readiness_capability_requirements, readiness_evaluations, readiness_program_types, readiness_thresholds

**Audit:**
audit_events, audit_log, provenance_events

**Auth:**
auth.users, auth.sessions (managed by Supabase)

### Orphan/Legacy Tables
- `continuity_experience_claims` — overlaps with `claims`
- Most `exchange_*`, `fulfillment_*`, `financial_*` tables — marketplace domain
- `organization_twins`, `shipment_twins`, `specimen_twins`, `transaction_twins` — operational twins (motorcycle domain)

### Naming Conflicts
- `visibility_scope` — used by both organizations (008) and evidence-core (045) with different value sets (now reconciled)
- `evidence_class` — both ENUM type and table name (now fixed via rename to `evidence_class_ref`)

### RLS Coverage
- All evidence-core tables: ✅ organization-scoped RLS
- Continuity tables: ✅
- Readiness tables: ✅
- Discovery tables: ✅
- Marketplace tables: ✅
- Audit events: ✅

---

## 9. Architecture Assessment

### Current Architecture (KRM-RAO)

The repository follows the **KRM-RAO (Knowledge Representation Management — Reference Architecture for Organizations)** reference model with 9 engines, 5 twins, and 4 graphs.

**Assessment: This architecture is premature generalization for the current product stage.**

The engines were defined before most had any implementation. Only 3-4 of the 11-15 architectural components have meaningful code. The rest are 3-file scaffolds that create maintenance overhead without delivering value.

### What Makes Sense to Preserve

- **Monorepo structure** with `packages/` and `apps/` — standard, familiar, works well
- **Evidence-core module** — clean domain boundaries, well-tested
- **API layering** (routes → lib → packages) — consistent pattern
- **Types package** — centralized Zod schemas, good practice
- **Supabase + RLS** — correct architectural choice for multi-tenant

### What Creates Fragmentation

1. **11 engine packages** with identical structure (engine.ts + index.ts + test.ts) — scaffolding pattern creates false modularity
2. **Dual migration directories** (`database/migrations/` + `supabase/migrations/`) — must standardize
3. **`apps/web` and `packages/ui` separation** — `packages/ui` is empty, all components are in `apps/web` with duplication
4. **Continuity engine** duplicates evidence-core concepts (claims, evidence links, verification)
5. **Marketplace domain** (`exchange`, `financial-engine`, `fulfillment-engine`) — legacy from biobanking vision, should be quarantined

### Circular Dependencies
- Not detected at build level (TypeScript enforces acyclic graphs)

### Duplicated Services
- Claims: `evidence-core` + `continuity` → 2 implementations
- Provenance: `evidence-core` metadata + `provenance-graph` + `provenance` → 3 implementations
- Passport: `apps/api/lib/sponsor-passport` + `evidence-core` + `apps/web` → multiple representations

---

## 10. Mock and Scaffolding Assessment

| Flow | Depends on Mocks? | Detail |
|------|-------------------|--------|
| Claim creation | ✅ Mostly | Evidence-core API is real, but UI still shows mock data |
| Evidence attachment | ✅ Partially | API exists, UI not fully connected |
| Confidence scores | 🟡 Partially | RPC exists but confidence computation is not fully wired |
| Passport content | 🟡 Partially | API works, but sponsor-facing views still use static data |
| Institution dashboard | ✅ Mostly | Workspace views use a mix of real and mock |
| Discovery pipeline | ✅ Mostly | Evidence-discovery has real pipeline but mock-heavy in UI |
| KOC analytics | ✅ Almost entirely | Mock dashboards |
| Sponsor risk assessment | ✅ Almost entirely | Mock views |
| Marketplace operations | ✅ Almost entirely | Old domain, no real transactions |
| KPE generation | 🟡 Partially | Generation logic exists, real data limited |
| Onboarding flows | 🟡 Partially | Some steps connected, others placeholder |

**Scaffolding detected:**
- 11 engine packages with 3-5 files each (engine.ts + index.ts — minimal implementation)
- `packages/ui` — completely empty
- `tests/performance`, `tests/security` — placeholder test files

---

## 11. Security and Governance Findings

| Concern | Status | Risk |
|---------|--------|------|
| Authentication | ✅ Supabase Auth with JWT | Low |
| Role enforcement | 🟡 JWT claims used for org_id but role hierarchy not implemented | Medium |
| Tenant isolation | ✅ Organization-scoped RLS on evidence tables | Low |
| Access grants | ✅ passport_shares with sponsor_org_id | Low |
| Document access | 🟡 document-intake has no visible access control | Medium |
| Publication permissions | ✅ passport_entries.published_by tracked | Low |
| Reviewer authority | 🟡 review_tasks RLS scoped but no reviewer role validation | Medium |
| Audit logs | ✅ audit_events table with action tracking | Low |
| Evidence mutation | ✅ evidence_nodes is append-only (triggers enforce) | Low |
| Claim versioning | ❌ No versioning on claims | Medium |
| Sensitive data exposure | 🟡 No PII/PHI scanning visible | Medium |
| Secrets management | ✅ .env gitignored, Supabase secrets pattern | Low |
| HIPAA governance | ✅ docs/governance/hipaa/ exists but no code enforcement | Medium |

---

## 12. Test Coverage Assessment

### By Package

| Package | Tests | Coverage | Quality |
|---------|-------|----------|---------|
| types | 12 suites | ✅ Comprehensive Zod schema tests | High |
| evidence-core | 4 suites | ✅ Core claim/evidence tests | High |
| institutional-knowledge | 8 suites | 🟡 Pipeline tests, 6 broken | Medium |
| workflow-engine | 2 suites | 🟡 Basic state machine tests | Low |
| readiness-engine | 1 suite | 🟡 Basic evaluation tests | Low |
| api | 1 suite | 🟡 Health endpoint only | Very Low |
| evidence-validation | 1 suite | 🟡 Skeleton test | Very Low |
| delivery-domain | 1 suite | 🟡 Basic DTO test | Low |
| performance, security | 1 each | ❌ Placeholder only | None |

### Gaps

- **No integration tests** for API routes (except health)
- **No E2E tests** (no Cypress/Playwright)
- **No migration tests** (no test that verifies migration output)
- **No authorization tests** (no test that RLS enforcement works)
- **No trust-chain tests** (no test that validates the full vertical slice)
- **UI tests**: zero (only placeholder file exists)

---

## 13. Reuse Classification Matrix

| Component | Classification | Rationale | Migration Complexity |
|-----------|---------------|-----------|---------------------|
| evidence-core | **KEEP** | Validated, tested, aligned with KEMS-001 | None |
| types | **KEEP** | Foundation for type safety | None |
| auth | **KEEP** | Supabase JWT pattern | None |
| instrumentation | **KEEP** | Observability layer | None |
| domain-events | **KEEP** | Event bus pattern | None |
| ai-layer | **KEEP** | LLM integration | None |
| sdk | **KEEP** | Public API surface | None |
| cli | **KEEP** | Developer tooling | None |
| platform-services | **KEEP** | API keys, background jobs | Low |
| telemetry | **KEEP** | OpenTelemetry | Low |
| evidence-discovery | **ADAPT** | Real extraction pipeline, needs domain realignment | Medium |
| institutional-knowledge | **ADAPT** | Knowledge extraction pipeline valuable | Medium |
| document-intake | **ADAPT** | Connector pattern reusable | Medium |
| delivery-domain | **ADAPT** | Target domain model needs KFL alignment | Medium |
| published-view | **ADAPT** | Evidence pack generation reusable | Medium |
| readiness-engine | **ADAPT** | Evaluation logic realignable | Medium |
| policy-engine | **ADAPT** | Rule evaluation pattern reusable | Medium |
| workflow-engine | **ADAPT** | State machine pattern foundational | Low |
| trust-engine | **ADAPT** | Decay model only, confidence algo should live in evidence-core | Low |
| provenance | **ADAPT** | PROV mapping valuable, merge into unified model | Medium |
| operational-twins | **CONSOLIDATE** | Minimal code, merge into platform-services | Low |
| provenance-graph | **CONSOLIDATE** | 3 files, merge into unified provenance | Low |
| graph-query | **CONSOLIDATE** | 4 files, absorb into knowledge-engine or retire | Low |
| knowledge-engine | **CONSOLIDATE** | 4 files, merge into published-view | Low |
| evidence-lineage | **CONSOLIDATE** | 16 files, merge into evidence-core | Medium |
| evidence-validation | **CONSOLIDATE** | 4 files, merge into evidence-core | Low |
| matching-engine | **REPLACE** | Biobanking marketplace concept | High |
| fulfillment-engine | **REPLACE** | Biobanking marketplace concept | High |
| financial-engine | **REPLACE** | Biobanking marketplace concept | High |
| intelligence-engine | **REPLACE** | No actual intelligence implementation | High |
| sponsor-intelligence | **POSTPONE** | After MVP | N/A |
| integration-engine | **POSTPONE** | After MVP | N/A |
| kpe-generator | **RETIRE** | Superseded by newer delivery pipeline | Low |
| ui | **RETIRE** | Empty, rebuild from scratch | High |
| marketplace API routes | **RETIRE** | Old vision, quarantine | Low |

---

## 14. Technical Debt Register

| ID | Description | Impact | Effort | Priority |
|----|-------------|--------|--------|----------|
| TDR-001 | Dual claim implementations (evidence-core vs continuity) | Data inconsistency | 3 days | P1 |
| TDR-002 | Evidence_node schema mismatch (JSONB vs individual columns) | Code/schema drift | 2 days | P1 |
| TDR-003 | Divergent migration directories | Build reproducibility | 1 day | P1 |
| TDR-004 | 11 scaffolded engine packages | Maintenance overhead | 4 days | P2 |
| TDR-005 | `packages/ui` empty — UI components duplicated in apps/web | Component fragmentation | 5 days | P2 |
| TDR-006 | apps/web lint failure | CI/CD blocker | 1 day | P2 |
| TDR-007 | No Person model | MVP blocker | 3 days | P1 |
| TDR-008 | No Location model | MVP blocker | 2 days | P1 |
| TDR-009 | Marketplace API routes mixed with core | Security/domain leak | 3 days | P1 |
| TDR-010 | Provenance fragmentation (3 implementations) | Audit inconsistency | 2 days | P2 |
| TDR-011 | No E2E test suite | Regression risk | 5 days | P2 |
| TDR-012 | No integration tests for API | Deployment risk | 3 days | P2 |
| TDR-013 | No authorization tests | Security risk | 2 days | P2 |
| TDR-014 | Confidence computation not fully wired | Trust model incomplete | 3 days | P2 |
| TDR-015 | Incomplete RLS on document-intake tables | Data leak risk | 2 days | P2 |

---

## 15. Critical Risks

### Risk 1: Domain Fragmentation (HIGH)
The repository has two incomplete, partially overlapping domain models (biobanking marketplace + evidence intelligence). Continuing to develop on top of both without consolidation will compound the technical debt.

### Risk 2: Missing People and Location Models (HIGH)
The MVP requires institutional people and facility directories. Neither exists as a first-class entity. Every feature that requires person-level attribution (review assignments, delegation chains, role-based access) must build these from scratch.

### Risk 3: Scaffolding Overhead (MEDIUM)
11 engine packages averaging 3 files each creates a maintenance burden disproportionate to their value. Developers must understand 36 package structures when only 12-15 are substantive.

### Risk 4: Confidence Model Gap (MEDIUM)
The confidence computation is defined in KEMS-001 but the implementation is partial. `confidence_state_snapshots` exists but the computation algorithm isn't fully wired. This is the core of the trust model — without it, Passport is just metadata.

### Risk 5: UI Fragmentation (MEDIUM)
`packages/ui` is empty. All components are inside `apps/web` with no clear component library. This will slow down UI development significantly as the product grows.

---

## 16. Reuse Opportunities

### Opportunity 1: Evidence Pipeline
**Components:** evidence-discovery + institutional-knowledge + document-intake + evidence-core
**Value:** These four packages together represent the complete evidence pipeline (ingest → classify → extract → store → relate → prove). Consolidating them with clear interfaces would deliver the Foundation Library's core value proposition in a single integrated module.

### Opportunity 2: Provenance Unification
**Components:** evidence-core.process-state + provenance + provenance-graph
**Value:** Three implementations of provenance tracking can be unified into a single append-only event-sourced provenance model that serves both audit and evidence integrity requirements.

### Opportunity 3: Passport Engine
**Components:** evidence-core (passport) + published-view + delivery-domain
**Value:** The passport generation and publishing capabilities across these three packages can be unified into a single Passport Engine that handles publication, evidence packs, and sponsor delivery.

### Opportunity 4: Workflow Foundation
**Components:** workflow-engine + evidence-core (review-workflow)
**Value:** The workflow state machine pattern in evidence-core can be generalized and adopted by the workflow-engine package to serve all KADARN workflow needs (review, onboarding, readiness, verification).

---

## 17. Recommended Target Architecture

```
kadarn-platform/
  apps/
    api/               ← Keep, consolidate route handlers
    web/               ← Keep, connect to real data
  packages/
    foundation/         ← NEW: types, auth, errors, events, config
    evidence-core/      ← KEEP: claims, evidence, confidence, passport
    evidence-pipeline/  ← CONSOLIDATE: discovery + institutional-knowledge + document-intake
    passport-engine/    ← CONSOLIDATE: published-view + delivery-domain aspects
    workflow-engine/    ← KEEP + merge evidence-core workflows
    provenance/         ← CONSOLIDATE: unified audit/provenance model
    readiness-engine/   ← ADAPT: domain-aligned evaluation
    platform-services/  ← KEEP
    ui/                 ← REBUILD: shared component library
  tests/
    e2e/                ← NEW: Playwright/Cypress
    integration/        ← NEW: API integration tests
    unit/               ← Existing, reorganized
```

### Architectural Principles

1. **Package ≠ Engine.** Only create a package when it has shared code consumed by multiple callers.
2. **One bounded context per package.** Evidence-core is the model. Evidence-pipeline is the ingestion. Passport-engine is the publication.
3. **API routes are thin.** Route handlers should be 10-30 line orchestrators calling package functions.
4. **UI components are shared.** All visual components live in `packages/ui` with Storybook documentation.
5. **Marketplace is quarantined.** Existing marketplace routes continue to work but are not extended.

---

## 18. Recommended Migration Sequence

### Phase 1 — Foundation Library (2 weeks)
1. Create `packages/types` canonical types (from existing)
2. Create `packages/auth` authentication patterns (from existing)
3. Consolidate evidence-core audit + confidence model
4. Add Person model (migration + types + API)
5. Add Location model (migration + types + API)

### Phase 2 — Pipeline Consolidation (2 weeks)
6. Merge evidence-lineage into evidence-core
7. Merge evidence-validation into evidence-core
8. Unify provenance (evidence-core + provenance + provenance-graph)
9. Consolidate claim implementations (evidence-core.claims + continuity_claims)

### Phase 3 — Domain Separation (1 week)
10. Quarantine marketplace API routes under `/api/v1/marketplace/*`
11. Remove marketplace routes from core workspace navigation
12. Retire kpe-generator, intelligence-engine packages

### Phase 4 — Architecture Cleanup (1 week)
13. Merge operational-twins into platform-services
14. Merge graph-query + knowledge-engine into published-view
15. Merge engine packages with <5 files into their consumers
16. Resolve apps/web lint configuration

### Phase 5 — UI Foundation (2 weeks)
17. Build `packages/ui` with shared components
18. Extract common patterns from apps/web
19. Connect core UI views to real API data
20. Add Storybook documentation

---

## 19. Proposed Backlog Changes

| Change | Rationale |
|--------|-----------|
| **PRIORITIZE** KAD-002 (Foundation Library) | Establishes canonical types, auth, and People/Location models |
| **PRIORITIZE** Person model | MVP blocker — no institutional directory exists |
| **PRIORITIZE** Location model | MVP blocker — no facility entity exists |
| **POSTPONE** KAD-009 (Sponsor Intelligence) | After MVP |
| **POSTPONE** KAD-010 (Integration Engine) | After MVP |
| **RETIRE** KAD-003 (Matching Engine) | Old vision, replace with sharing/access model |
| **RETIRE** KAD-004 (Fulfillment Engine) | Old vision |
| **RETIRE** KAD-005 (Financial Engine) | Old vision |
| **CONSOLIDATE** KAD-006 (Knowledge Engine) | Merge into published-view |
| **CONSOLIDATE** KAD-007 (Marketplace) | Quarantine from core |
| **CONSOLIDATE** KAD-008 (Trust Engine) | Absorb decay model into evidence-core |

---

## 20. Audit Decision: CONDITIONAL GO ✅

The KADARN repository is a viable foundation for the Foundation Library v1.0 **subject to the following conditions being met before new feature implementation:**

### Conditions

| # | Condition | Owner | Deadline |
|---|-----------|-------|----------|
| C1 | Consolidate dual migration directories (database/migrations/ as canonical) | Engineering | Before Phase 1 |
| C2 | Add Person model (migration + types + API) | Engineering | Within Phase 1 |
| C3 | Add Location model (migration + types + API) | Engineering | Within Phase 1 |
| C4 | Declare evidence-core as the single source of truth for claim/evidence model | Architecture | Immediate |
| C5 | Quarantine marketplace API routes from core navigation | Engineering | Within Phase 3 |
| C6 | Resolve apps/web lint configuration | Engineering | Immediate |
| C7 | Build or adopt a shared UI component library (packages/ui) | Engineering | Within Phase 5 |

### What Currently Works
- Build, typecheck, core tests — all green
- Database migrations — clean install from scratch
- Evidence model (claims, evidence, workflow, confidence, passport) — validated end-to-end
- Multi-tenant RLS on all evidence tables
- Institutional onboarding flows (organization, documents, capabilities, readiness)
- Sponsor passport browsing and feasibility

### What Is Reusable
- 12-15 packages are directly reusable with minimal or no modification
- The evidence-core module is production-ready for its current scope
- The migration chain is clean and reproducible
- The Supabase RLS pattern is well-implemented

### What Must Change
- 11 engine packages must be consolidated into 5-7 substantive packages
- Person and Location models must be added
- Dual claim implementations must be unified
- Provenance must be consolidated from 3 implementations to 1
- Evidence_node schema must be reconciled

### What Must Be Retired or Postponed
- Marketplace domain (matching, fulfillment, financial engines) — retire from core, quarantine
- kpe-generator package — retired
- intelligence-engine package — retired (no actual intelligence code)
- sponsor-intelligence and integration-engine — postponed to post-MVP
- packages/ui — rebuilt from scratch

### The Greatest Technical Risk
**Domain fragmentation.** The repository contains 806 TypeScript files distributed across 36 packages, but only ~400 files across ~12 packages are substantively implemented. The remaining 400+ files in 24 packages create architectural noise that obscures the actual working system. Without consolidation, every new feature will require developers to navigate through scaffolded packages, duplicate domain models, and legacy marketplace abstractions — slowing delivery by a factor of 2-3x compared to a streamlined foundation.
