# OCP-0 — Existing Infrastructure Inventory

**Program:** Onboarding Completion Program (OCP)
**Phase:** Pre-flight audit
**Date:** 2026-07-07
**Status:** Read-only inventory. No code changes.

---

## 1. Executive Summary

Kadarn has substantial onboarding infrastructure already built. The onboarding wizard, canonical object model, derived read models, document intake pipeline, institutional knowledge engine, evidence core, and readiness engine are all in various states of completion. The key gap is **completion detection** — nothing currently signals when an institution has provided "enough" information to generate a useful Passport, Readiness, or Capability report.

**Total onboarding-related code:** ~49,000 lines across packages + ~4,300 lines in web onboarding modules + ~2,100 lines derived read models.

---

## 2. Existing Onboarding Architecture

### 2.1 Onboarding Wizard (Web)

**Location:** `apps/web/src/app/(onboarding)/`

| Page | File | Status |
|------|------|--------|
| Onboarding landing | `onboarding/page.tsx` | ✅ READY |
| Organization | `onboarding/organization/page.tsx` | ✅ READY |
| People | `onboarding/people/page.tsx` | ✅ READY |
| Infrastructure | `onboarding/infrastructure/page.tsx` | ✅ READY |
| Documents | `onboarding/documents/page.tsx` | ✅ READY |
| Capabilities | `onboarding/capabilities/page.tsx` | ✅ READY (derived) |
| Readiness | `onboarding/readiness/page.tsx` | ✅ READY (derived) |
| Passport | `onboarding/passport/page.tsx` | ✅ READY (derived) |
| Roadmap | `onboarding/roadmap/page.tsx` | ✅ READY (derived) |
| Memory | `onboarding/memory/page.tsx` | ✅ READY (derived) |
| Sidebar nav | `components/onboarding-sidebar.tsx` | ✅ READY |
| Domain header | `components/domain-header.tsx` | ✅ READY |
| Layout | `layout.tsx` | ✅ READY |

**Inference:** All 10 onboarding pages exist and are functional. 4 of 10 pages are derived (Capabilities, Readiness, Passport, Roadmap) — they consume read models, not collect user input.

### 2.2 Onboarding State Management

**Location:** `apps/web/src/lib/onboarding/`

| Module | Lines | Purpose |
|--------|-------|---------|
| `onboarding-context.tsx` | ~355 | React context + `withDerivedAnswers` + `useDerivedReadModel` hook |
| `onboarding-journey.ts` | N/A | Journey definition (22 steps, 4 derived domains) |
| `onboarding-progress.ts` | N/A | Progress tracking |
| `fast-track.ts` | N/A | Fast-track progress computation |
| `interview-engine.ts` | N/A | Conditional interview logic |
| `canonical-ownership.ts` | ~85 | 21 canonical keys, 28 legacy flat keys, ownership mapping |

### 2.3 Canonical Object Types

| Module | Purpose |
|--------|---------|
| `institutional-locations.ts` | `InstitutionalLocation` type |
| `location-infrastructure.ts` | `LocationInfrastructure` type |
| `research-team.ts` | `ResearchTeamMember`, `StaffCertification` types |
| `institutional-memory.ts` | `InstitutionalMemoryEvent` type |
| `document-taxonomy.ts` | Document classification (A/B/C/D evidence classes) |
| `operational-footprint-taxonomy.ts` | Geographic reach mapping |
| `research-focus-taxonomy.ts` | Research focus taxonomy |
| `research-experience-taxonomy.ts` | Research experience taxonomy |

---

## 3. Existing Document Intake Infrastructure

### 3.1 Document Intake Package

**Location:** `packages/document-intake/` (~4,000 lines)

| Module | Purpose |
|--------|---------|
| `engine.ts` | Document intake orchestration |
| `gateway.ts` | Document gateway (upload, validation) |
| `classification/` | Document classification engine |
| `extraction/` | Content extraction |
| `pipeline/` | Intake pipeline stages |
| `provenance/` | Document provenance tracking |
| `segmentation/` | Document segmentation |
| `providers/markitdown/` | MarkItDown adapter for document conversion |
| `adapters/` | Format-specific adapters |
| `contracts.ts` | Type contracts |

### 3.2 Web Document Intake

| Component | Location | Purpose |
|-----------|----------|---------|
| Documents page | `apps/web/src/app/(onboarding)/onboarding/documents/page.tsx` | Document upload UI |
| Convert API | `apps/web/src/app/api/onboarding/documents/convert/route.ts` | Server-side document conversion |
| MarkItDown adapter | `apps/web/src/lib/documents/markitdown-adapter.ts` | Browser-side adapter |

### 3.3 Document API

- `POST /api/onboarding/documents/convert` — Document text extraction via MarkItDown

### 3.4 Classification

There is no automated document classification in the onboarding flow. The `document-taxonomy.ts` defines evidence classes (A/B/C/D) but classification is manual (user selects label).

---

## 4. Existing Claim / Evidence Infrastructure

### 4.1 Evidence Core (packages/evidence-core, ~7,000 lines)

The most mature package. Full claim lifecycle, evidence graph, confidence state, provenance, evaluation, audit trail.

| Module | Purpose |
|--------|---------|
| `claim.ts` | Claim CRUD and lifecycle |
| `evidence-graph.ts` | Evidence relationship graph |
| `evidence-node.ts` | Evidence node operations |
| `confidence-state.ts` | Confidence computation |
| `provenance.ts` | Provenance tracking |
| `evaluation.ts` | Claim evaluation |
| `evaluators.ts` | Evaluation strategies |
| `output.ts` | Explainable output (deprecated — moved to readiness-engine) |
| `boundary.ts` | Core/Engine boundary enforcement |
| `lifecycle.ts` | Claim lifecycle state machine |
| `right-of-response.ts` | Right of response workflow |
| `audit.ts` | Audit trail |
| `types.ts` | Core types |

### 4.2 Evidence Discovery (packages/evidence-discovery, ~14,700 lines)

Discovery, gap detection, capability intelligence, claim candidate detection.

| Module | Purpose |
|--------|---------|
| `capability-intelligence/` | Capability matrix, gaps, interpretation, fit, recommendations, sponsor view |
| `claim-candidate/` | Claim candidate detection from capabilities |
| `gap-detection/` | Evidence gap detection |
| `governance/` | Governance engine with provenance chains |
| `recommendation-engine/` | Recommendation generation |
| `sponsor-readiness/` | Sponsor readiness assessment |
| `continuous-monitoring/` | Continuous evidence monitoring |

### 4.3 Evidence Validation (packages/evidence-validation, ~430 lines)

Lightweight validation rules engine.

### 4.4 Evidence Lineage (packages/evidence-lineage)

| Module | Purpose |
|--------|---------|
| `published-view.ts` | ADR-030: canonical claim projection with audience filtering |
| `reconstruct.ts` | Provenance reconstruction |
| `review-lifecycle.ts` | Review lifecycle engine |
| `confidence-state.ts` | Confidence state engine |
| `evidence-pack.ts` | Evidence pack generation |

### 4.5 Institutional Knowledge (packages/institutional-knowledge, ~14,300 lines)

| Domain | Purpose |
|--------|---------|
| `organization.ts` | Organization domain |
| `organization-structure.ts` | Org structure |
| `people.ts` | People/team domain |
| `laboratory.ts` | Lab domain |
| `equipment.ts` | Equipment domain |
| `facilities.ts` | Facilities domain |
| `biospecimen.ts` | Biospecimen domain |
| `quality.ts` | Quality domain |
| `regulatory.ts` | Regulatory domain |
| `research-capability.ts` | Research capability |
| `research-experience.ts` | Research experience |
| `program-catalog.ts` | Program catalog |
| Other modules | institution-os, institution-twin, knowledge-explorer, questionnaire-engine, guided-acquisition, promotion-pipeline, claim-review-pipeline, document-intelligence, compliance-ecosystem |

**Key observation:** The institutional-knowledge package is the largest package (14,300 lines) and has comprehensive domain models, but the onboarding wizard does NOT directly consume it. The wizard uses simpler typed objects (`ResearchTeamMember`, `InstitutionalLocation`, etc.) defined in the web onboarding lib.

### 4.6 Claim / Evidence Gap

**There is no Claim Engine or Evidence Engine integrated into the onboarding flow.** The packages exist but the onboarding wizard does not call them. Claims and evidence are extension points (`KnowledgeContext`) in the read models, reserved for future integration (ORP-1.5+).

---

## 5. Existing Passport Infrastructure

### 5.1 Passport Assembler (legacy)

**Location:** `apps/web/src/lib/passport/passport-assembler.ts`
**Status:** STABLE but deprecated for new code. Retained as reference.

### 5.2 Derived Passport Read Model (new)

**Location:** `apps/web/src/lib/onboarding/derived-read-models/passport-read-model.ts` (526 lines)
**Status:** ✅ READY. FROZEN (ORP-1.6).

### 5.3 Sponsor Passport (API-side)

**Location:** `apps/api/src/lib/sponsor-passport/` (~2,460 lines)

| Module | Purpose |
|--------|---------|
| `evidence-core-passport-store.ts` | Passport store backed by Evidence Core |
| `mock-passport-store.ts` | Mock store for local/demo |
| `factory.ts` | PassportStore factory with DI |
| `store.ts` | PassportStore interface |
| `portfolio/` | Portfolio repository (mapper, queries, repository, types) |
| `stability/` | Stability engine (adapter, domain, source, types) |
| `adapter/map-identity.ts` | Identity mapping |
| `adapter/map-portfolio-index.ts` | Portfolio index mapping |

### 5.4 Passport API Routes

- `GET /api/v1/sponsor/passports` — Portfolio index via PassportStore
- `GET /api/v1/sponsor/passports/:institutionId` — Passport detail
- `GET /api/v1/sponsor/passports/:institutionId/claims/:claimId/provenance` — Claim provenance

---

## 6. Existing Historical Acquisition Infrastructure

### 6.1 Institutional Memory

**Location:** `apps/web/src/lib/onboarding/institutional-memory.ts`
**Purpose:** `InstitutionalMemoryEvent` type and event derivation.

The memory page (`onboarding/memory/page.tsx`) derives institutional memory events from canonical objects + passport, but does NOT persist them as historical records. Memory events are derived projections, not persisted history.

### 6.2 Evidence Lineage Provenance

**Location:** `packages/evidence-lineage/src/reconstruct.ts`
**Purpose:** Provenance reconstruction from claims and evidence.

### 6.3 Gap Analysis

No formal historical acquisition pipeline exists. The roadmap read model detects gaps from current state, but there is no historical comparison ("what changed since last assessment?").

---

## 7. Existing Completion / Readiness Infrastructure

### 7.1 Readiness Engine (packages/readiness-engine, ~1,500 lines)

| Module | Purpose |
|--------|---------|
| `readiness-evaluation.ts` | Core readiness evaluation |
| `evaluation.ts` | Evaluation logic |
| `evaluators.ts` | Evaluation strategies |
| `dto.ts` | Data transfer objects |
| `projection.ts` | Readiness projection/report |
| `output.ts` | Output formatting |

### 7.2 Derived Readiness Read Model

**Location:** `apps/web/src/lib/onboarding/derived-read-models/readiness-read-model.ts` (459 lines)
**Status:** ✅ READY. FROZEN (ORP-1.6).

### 7.3 Fast-Track Progress

**Location:** `apps/web/src/lib/onboarding/fast-track.ts`
**Purpose:** Computes progress toward completion. Tracks critical questions answered vs total.

### 7.4 Completion Engine Gap

**There is no completion detection engine.** The onboarding wizard has progress tracking (`fast-track.ts`, `onboarding-progress.ts`) that counts answered questions and uploaded documents, but there is no signal that says "you are done — proceed to Passport review."

---

## 8. Existing APIs and Routes

### 8.1 Onboarding Provisioning (API)

- `POST /api/v1/onboarding/organization` — Create organization from onboarding data

### 8.2 Readiness API (API)

| Route | Purpose |
|-------|---------|
| `GET /api/v1/readiness/program-types` | List program types |
| `GET /api/v1/readiness/program-types/:typeKey` | Program type detail |
| `GET /api/v1/readiness/capabilities` | Capability list |
| `GET /api/v1/readiness/capabilities/:capabilityId` | Capability detail |
| `POST /api/v1/readiness/evaluate` | Trigger evaluation |
| `POST /api/v1/readiness/recalculate` | Recalculate readiness |

### 8.3 Institution Readiness API

- `GET /api/v1/institutions/:id/readiness` — Institution readiness
- `GET /api/v1/institutions/:id/readiness/:programTypeKey` — Per-program readiness

### 8.4 Onboarding Document API (Web)

- `POST /api/onboarding/documents/convert` — Document text extraction

### 8.5 Health / Metrics / Docs

- `GET /api/health` — Liveness check (instrumented)
- `GET /api/health/ready` — Readiness check
- `GET /api/metrics` — Metrics endpoint
- `GET /api/docs` — OpenAPI docs

---

## 9. Existing Read Models

**Location:** `apps/web/src/lib/onboarding/derived-read-models/`
**Status:** ✅ FROZEN (ORP-1.6). Contracts stable.

| Read Model | Lines | Contract |
|-----------|-------|----------|
| `derivePassportReadModel` | 526 | `PassportReadModelInput → PassportData` |
| `deriveCapabilityReadModel` | 355 | `CapabilityReadModelInput → PassportCapability[]` |
| `deriveReadinessReadModel` | 459 | `ReadinessReadModelInput → PassportReadiness` |
| `deriveRoadmapReadModel` | 579 | `RoadmapReadModelInput → InstitutionRoadmap` |
| `types.ts` | 206 | `KnowledgeContext` (FROZEN), reference types |
| `index.ts` | 32 | Public API barrel |

**Guarantees:** Pure, deterministic, stateless, non-persistent, idempotent. 31 tests.

---

## 10. Existing UI Components / Pages

### 10.1 Onboarding Pages: 14 files

All onboarding wizard pages exist and are functional.

### 10.2 Workspace Pages

- `apps/web/src/app/(workspace)/settings/members/` — Workspace member management
- `apps/web/src/app/(workspace)/workspace/documents/` — Workspace documents

### 10.3 Auth Pages

- `apps/web/src/app/(auth)/login/` — Login page
- `apps/web/src/app/(auth)/forgot-password/` — Password reset
- `apps/web/src/app/(auth)/join/` — Organization registration + actor selection
- `apps/web/src/components/auth/organization-registration-form.tsx` — Registration form

### 10.4 Shell Components

- `apps/web/src/components/shell/application-shell.tsx` — Shared shell frame
- `apps/web/src/components/workspace/workspace-shell.tsx` — Workspace shell
- `apps/web/src/components/koc/koc-shell.tsx` — KOC shell
- `apps/web/src/components/sponsor/sponsor-shell.tsx` — Sponsor shell

---

## 11. Existing Tests

| Test Area | Files | Tests |
|-----------|-------|-------|
| Read models | `tests/onboarding/derived-read-models.test.ts` | 31 |
| Onboarding validation | `tests/web/mvp-onboarding-validation.test.ts` | 20 |
| Canonical ownership | `tests/web/onboarding-canonical-ownership.test.ts` | ~5 |
| Document conversion | `tests/web/onboarding-documents-conversion.test.ts` | 4 |
| Integration flow | `tests/integration/onboarding-flow.test.ts` | N/A |
| Readiness event chain | `tests/integration/readiness-event-chain.test.ts` | N/A |
| Readiness runtime | `tests/integration/readiness-runtime-pipeline.test.ts` | N/A |
| Provisioning API | `tests/api/onboarding-provisioning-api.test.ts` | N/A |
| Provisioning plan | `tests/api/onboarding-provisioning-plan.test.ts` | N/A |
| Readiness API | `tests/api/readiness-api.test.ts` | N/A |
| Sponsor passport (18 test files) | `tests/api/sponsor-passport-*.test.ts` | 76+ |
| Institutional knowledge | `tests/institutional-knowledge/` (28 files) | N/A |
| Phase 8 equivalence | `tests/phase8/` (passport, institution, discovery) | 37 |
| Document intake | `packages/document-intake/tests/` | N/A |

**Total onboarding-related tests:** ~31 read model + 20 MVP validation + 76 sponsor passport + 37 phase8 + 28 institutional knowledge = ~192+ tests across multiple domains.

---

## 12. What Is Already Sufficient for MVP Pilot

| Capability | Classification | Evidence |
|-----------|---------------|----------|
| Onboarding wizard (10 pages) | ✅ READY | All pages functional, state management complete |
| Canonical object model (7 types) | ✅ READY | Typed, ownership-mapped, legacy-free |
| Derived Passport read model | ✅ READY | 526 lines, 31 tests, FROZEN |
| Derived Capabilities read model | ✅ READY | 355 lines, FROZEN |
| Derived Readiness read model | ✅ READY | 459 lines, FROZEN |
| Derived Roadmap read model | ✅ READY | 579 lines, FROZEN |
| Document upload UI | ✅ READY | Functional upload + conversion |
| Document intake package | ✅ READY | 4,000 lines, MarkItDown integration |
| Auth (login, join, registration) | ✅ READY | Full auth flow |
| KnowledgeContext enrichment contract | ✅ READY | FROZEN (ORP-1.5) |
| Progress tracking (fast-track) | ✅ READY | Question counting, critical path |
| Onboarding journey definition | ✅ READY | 22 steps, 4 derived domains |
| Readiness API routes | ✅ READY | 6 routes for evaluation |
| Sponsor Passport (API-side) | ✅ READY | Full store, portfolio, stability engine |

---

## 13. What Is Partially Complete

| Capability | Classification | Gap |
|-----------|---------------|-----|
| Document classification | ⚠️ PARTIAL | Manual only. No automated A/B/C/D classification from content. |
| Completion detection | ⚠️ PARTIAL | Progress tracking exists but no "you are done" signal. |
| Institutional memory | ⚠️ PARTIAL | Events derived but not compared historically. |
| Onboarding → organization provisioning | ⚠️ PARTIAL | API route exists but integration with full onboarding flow unclear. |
| Readiness evaluation | ⚠️ PARTIAL | Engine exists (~1,500 lines) but not wired to onboarding wizard. |
| Workspace member management | ⚠️ PARTIAL | Settings/members page exists but RBAC integration unclear. |
| Document evidence pipeline | ⚠️ PARTIAL | Intake works but auto-classification + claim creation missing. |

---

## 14. What Is Missing

| Capability | Classification | Notes |
|-----------|---------------|-------|
| Completion signal / gate | ❌ MISSING | Nothing tells user "onboarding complete — proceed to review." |
| Evidence Engine integration | ❌ MISSING | `KnowledgeContext.evidence` is reserved but not populated. |
| Claim Engine integration | ❌ MISSING | `KnowledgeContext.claims` is reserved but not populated. |
| Confidence Engine integration | ❌ MISSING | `KnowledgeContext.confidence` is reserved but not populated. |
| Auto-classification of documents | ❌ MISSING | Documents classified manually by label matching. |
| Historical comparison ("since last time") | ❌ MISSING | No delta/progress-over-time tracking. |
| Guided acquisition flow | ❌ MISSING | Institutional-knowledge has it but not wired to onboarding. |
| Review/approval workflow | ❌ MISSING | No review step between onboarding completion and Passport publication. |
| Onboarding → workspace handoff | ❌ MISSING | Onboarding creates local state. No clear path to "activate workspace." |
| Quality assessment | ❌ MISSING | `KnowledgeContext.quality` is reserved but not populated. |
| Limitation surfacing | ❌ MISSING | `KnowledgeContext.limitations` is reserved but not populated. |

---

## 15. What Should NOT Be Rebuilt

| Artifact | Reason |
|----------|--------|
| Derived read models (ORP-1.3–1.6) | FROZEN. Contracts stable. 31 tests. |
| Canonical ownership model (ORP-1.2) | Ownership mapped, legacy keys blocked. |
| Onboarding wizard pages | All functional. Only need wiring, not new UI. |
| Passport assembler (legacy) | Retained as reference. Do not modify. |
| `withDerivedAnswers` compatibility bridge | Required for legacy consumers until migration complete. |
| Document intake pipeline (`packages/document-intake`) | 4,000 lines. Mature. Use as-is. |
| Sponsor Passport store + stability engine | Mature. Use as-is. |
| Evidence Core (`packages/evidence-core`) | 7,000 lines. Mature. Use as-is. |
| Evidence Discovery (`packages/evidence-discovery`) | 14,700 lines. Mature. Use as-is. |
| Institutional Knowledge (`packages/institutional-knowledge`) | 14,300 lines. Mature. Use as-is. |
| Readiness Engine (`packages/readiness-engine`) | 1,500 lines. Use as-is. |
| Auth flow (login, join, registration) | Complete. Do not rebuild. |

---

## 16. Recommended Next Sprint Order

Based on the inventory, the Onboarding Completion Program should proceed in this order:

| Sprint | What | Why |
|--------|------|-----|
| **OCP-1** | Completion Gate | Add a signal/check that determines when onboarding is "complete enough" to generate a meaningful Passport. Builds on fast-track progress. Highest impact, lowest effort. |
| **OCP-2** | Document Auto-Classification | Wire `packages/document-intake/classification` to the onboarding documents page. Auto-suggest evidence class (A/B/C/D) and proves relationships. |
| **OCP-3** | Readiness Wiring | Wire `packages/readiness-engine` to the onboarding flow. Replace local readiness scoring with engine-backed evaluation. |
| **OCP-4** | Onboarding → Workspace Handoff | Pipeline from onboarding completion → organization provisioning → workspace activation. |
| **OCP-5** | Claim Engine Integration | Populate `KnowledgeContext.claims` from Evidence Core. First real enrichment of read models. |
| **OCP-6** | Evidence Engine Integration | Populate `KnowledgeContext.evidence`. Second enrichment layer. |
| **OCP-7** | Historical Acquisition | Delta tracking: "what changed since last completion?" |
| **OCP-8** | Review Workflow | Human review step between completion and publication. |
| **OCP-9+** | Confidence, Quality, Limitations | Populate reserved KnowledgeContext slots as engines mature. |

---

## 17. Capability Classification Summary

| # | Capability | Status |
|---|-----------|--------|
| 1 | Onboarding wizard UI | ✅ READY |
| 2 | Canonical object model | ✅ READY |
| 3 | Derived Passport | ✅ READY |
| 4 | Derived Capabilities | ✅ READY |
| 5 | Derived Readiness | ✅ READY |
| 6 | Derived Roadmap | ✅ READY |
| 7 | Document upload | ✅ READY |
| 8 | Document conversion (MarkItDown) | ✅ READY |
| 9 | Auth (login, join, registration) | ✅ READY |
| 10 | Progress tracking | ✅ READY |
| 11 | KnowledgeContext contract | ✅ READY |
| 12 | Readiness API | ✅ READY |
| 13 | Sponsor Passport API | ✅ READY |
| 14 | Document classification (auto) | ⚠️ PARTIAL |
| 15 | Completion gate / signal | ⚠️ PARTIAL |
| 16 | Institutional memory | ⚠️ PARTIAL |
| 17 | Onboarding → org provisioning | ⚠️ PARTIAL |
| 18 | Readiness wiring to wizard | ⚠️ PARTIAL |
| 19 | Read model inventory doc | 📄 DOCS ONLY |
| 20 | ORP-1.0 through ORP-1.9 docs | 📄 DOCS ONLY |
| 21 | ORP-1.6 inventory | 📄 DOCS ONLY |
| 22 | PCP-1.x docs | 📄 DOCS ONLY |
| 23 | PCP-2.x docs | 📄 DOCS ONLY |
| 24 | Evidence Engine integration | ❌ MISSING |
| 25 | Claim Engine integration | ❌ MISSING |
| 26 | Confidence Engine integration | ❌ MISSING |
| 27 | Historical comparison | ❌ MISSING |
| 28 | Review/approval workflow | ❌ MISSING |
| 29 | Onboarding → workspace handoff | ❌ MISSING |
| 30 | Quality assessment | ❌ MISSING |
| 31 | Limitation surfacing | ❌ MISSING |
| 32 | Sponsor Portal | 🔄 DEFERRED POST-PILOT |
| 33 | Marketplace | 🔄 DEFERRED POST-PILOT |
| 34 | Digital Twin | 🔄 DEFERRED POST-PILOT |
| 35 | Delivery API | 🔄 DEFERRED POST-PILOT |
| 36 | Sharing Engine | 🔄 DEFERRED POST-PILOT |
| 37 | FHIR exports | 🔄 DEFERRED POST-PILOT |
| 38 | Publication & Delivery Domain (A10) | 🔄 DEFERRED POST-PILOT |

---

**Inventory complete.** OCP-0 confirms: onboarding infrastructure is substantially built. The gap is in completion signaling and engine integration, not in missing UI or data models. The recommended OCP-1 through OCP-5 sprints address the highest-impact gaps in dependency order.
