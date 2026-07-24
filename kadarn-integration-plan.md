# KADARN — Baseline Report & Integration Plan

**Branch:** `feat/ui-evidence-integration` | **Base:** `master`
**Date:** 2026-07-24 | **HEAD:** `1734a09f`

---

## 1. Baseline Verification Results

| Gate | Status | Details |
|------|--------|---------|
| `npm install` | ✅ | 0 errors, audit warnings (non-blocking) |
| `npm run typecheck` | ✅ | 3 projects: types, instrumentation, apps/api |
| `npm run build` (web) | ⚠️ | Next.js build fails: JSX parsing in 2 onboarding pages (pre-existing) |
| `npm run test` | ✅ | 75/84 passed (89%), 1313/1363 passed (96%) |
| API structure | ✅ | 28 API route groups under `/api/v1/` |
| Migrations | ✅ | 55 migrations (008–055), evidence-core on 045 |
| `.env` config | ✅ | `.env.local` present, Supabase URL configured (not running) |

**Pre-existing test failures (7 files, 11 tests):**
All in web/onboarding — depend on Supabase/MarkItDown runtime. Not structural issues.

---

## 2. Implementation-Status Matrix

| Entity | Domain Type | Repository | DB Table | Migration | Service | API Endpoint | Tests | UI Consumer | Missing Work |
|--------|-------------|------------|----------|-----------|---------|-------------|-------|-------------|--------------|
| **Institution** | `Claim.organizationId` (ref) | `organizations` table | `organizations` | 008 | `requireValidatedActiveOrg` | `GET /api/v1/institution/profile` | ✅ | Overview | Basic profile exists, needs capability expansion |
| **Person** | `institutional-knowledge` domain | `people` domain in `institutional-knowledge` | — | — | `people-intelligence.ts` | — | ❌ | People view | **Not persisted** — only domain logic, no table/api |
| **Location** | `institutional-knowledge` domain | `facilities` domain in `institutional-knowledge` | — | — | — | — | ❌ | Locations view | **Not persisted** — domain logic only |
| **Claim** | `Claim` (evidence-core types) | `repository.ts` — `insertClaim`, `getClaimById`, `getClaimsByOrganizationId` | `claims` | 045 | `lifecycle.ts` — `createClaim` | `POST/GET /api/v1/evidence-core/claims` | ✅ 13 files | Claims table, Claim Drawer | Status limited to `active`/`archived`/`deprecated`. Needs workflow states |
| **EvidenceNode** | `EvidenceNode` (evidence-core types) | `repository.ts` — `insertEvidenceNode`, `getEvidenceNodesByClaim` | `evidence_nodes` | 045 | `lifecycle.ts` — `submitEvidence` | `POST/GET /api/v1/evidence-core/evidence` | ✅ | Evidence Inbox, Drawer | Pipeline status (uploaded/classified/extracted) not modeled |
| **ClaimEvidenceLink** | `EvidenceRelationship` (evidence-core types) | `repository.ts` — `insertRelationship` | `evidence_relationships` | 045 | `lifecycle.ts` — `linkEvidenceToClaim` | `POST /api/v1/evidence-core/relationships` | ✅ | Claim Drawer (evidence graph) | Supports/contradicts only — corroborates exists but unused |
| **ConfidenceState** | `ConfidenceState` (evidence-core types) | Computed, not stored | `confidence_assessments` | — | `readiness-engine` — `evaluateClaim` | `POST /api/v1/readiness/evaluate` | ✅ | Claim Drawer, Overview | **Not persisted** — computed on-the-fly only |
| **ReviewTask** | ❌ Not modeled | — | — | — | — | — | ❌ | Evidence Inbox | **Not implemented** — no review workflow entity |
| **ReadinessAssessment** | `ReadinessEvaluationResult` (readiness-engine) | `readiness-engine` — `persistReadinessEvaluation` | `readiness_evaluations` | 054 | `readiness-engine` — `evaluateReadiness` | `POST /api/v1/readiness/evaluate` | ✅ | Readiness Matrix, Passport | Exists for program-type readiness. Needs protocol-scoped evaluation |
| **PublishedView** | `PublishedView` (published-view) | `published-view` engine | — | — | `published-view` — `engine.ts` | `GET /api/v1/published-views/[claimId]` | ✅ | Passport | **Basic implementation** — needs evidence pack assembly |
| **Passport** | No standalone entity | Part of published-view + readiness | — | — | `published-view` — `engine.ts` | `GET /api/v1/published-views/` | ✅ | Passport view | Exists as published-view. Needs full passport aggregation |
| **Package** | `EvidencePack` (published-view) | `published-view` — `evidence-pack.ts` | — | — | `published-view` — `engine.ts` | — | ✅ | Packages | Exists in code. No API endpoint yet |
| **ShareGrant** | `VisibilityMetadata` + `delivery-domain` policies | `delivery-domain` — policies/visibility | — | — | `delivery-domain` — ABAC/RBAC | — | ✅ | Sharing | Visibility model exists. ShareGrant entity not explicit |

### Legend
✅ = Exists and tested | 🟡 = Exists partially | ❌ = Missing | — = Not applicable

---

## 3. Claim Lifecycle — Five State Dimensions

The UI prototype uses a single `lifecycle` field. Master's evidence-core uses `Claim.status` (active/archived/deprecated) which is insufficient. The canonical decomposition:

### Dimension 1: Entity Status (evidence-core `Claim.status`)
```
active → archived → deprecated
```
What it means: "Does this claim exist in the system?" Not a workflow state.

### Dimension 2: Workflow State (missing — needs `ReviewTask`)
```
draft → declared → pending_evidence → under_review → published
```
What it means: "Where is this claim in the human review process?"
**Not implemented in master.** Needs `review_tasks` table.

### Dimension 3: Evidence State (computed by readiness-engine)
```
none → partial → sufficient → stale
```
What it means: "How much evidence supports this claim relative to requirements?"
**Computed** from evidence_nodes per claim. Not a stored field.

### Dimension 4: Publication State (published-view)
```
draft → published → restricted → withdrawn
```
What it means: "Has this claim been disclosed to sponsors?"
**Partially implemented** in `published-view`. No explicit state enum.

### Dimension 5: Dispute State (evidence-core `CounterEvidence`)
```
none → filed → under_review → resolved → escalated
```
What it means: "Is this claim being contested?"
**Implemented** via `CounterEvidence` + `RightOfResponse`.

### Mapping: UI Prototype → Canonical States

| UI `lifecycle` | Entity Status | Workflow State | Evidence State | Publication State | Dispute State |
|----------------|---------------|----------------|----------------|-------------------|---------------|
| published | active | published | sufficient | published | none |
| declared | active | declared | none | draft | none |
| pending_evidence | active | pending_evidence | none/partial | draft | none |
| under_review | active | under_review | partial | draft | filed |
| disputed | active | under_review | partial | restricted | under_review |
| archived | archived | — | — | withdrawn | resolved |

### What to build

1. **Entity Status** — ✅ Already in evidence-core. No change needed.
2. **Workflow State** — ❌ New: `review_tasks` table + state machine. These are the UI's `lifecycle` values.
3. **Evidence State** — 🟡 Computable. Add helper function to readiness-engine.
4. **Publication State** — 🟡 Add enum + field to `passport_entries` table.
5. **Dispute State** — ✅ Already in evidence-core. No change needed.

---

## 4. Branch Diff Classification — feat/architecture-expansion commits

37 commits exclusive to `feat/architecture-expansion` (merge-base: `24ce4b5`):

| Commit | Classification | Action |
|--------|---------------|--------|
| `81c60a9` chore: add Gentle AI model config | 🔄 **Superseded** | Master has `.pi/gentle-ai/` already |
| `d506108` chore: configure Gentle AI SDD | 🔄 **Superseded** | Master has SDD config |
| `c6ff151` refactor: scout code quality findings | 🔄 **Superseded** | Scout already run on master |
| `9e195a6` refactor: scout code quality fixes | 🔄 **Superseded** | Same |
| `52f957c` chore(tests): update test infra | 🔄 **Superseded** | Master has richer test infra (84 suites) |
| `7e64d4b` feat(api): backend scaffolding + Express | ❌ **Discard** | Master uses Next.js API routes, not Express |
| `c1eb7b8` feat: stub engines (matching, etc.) | ❌ **Freeze** | Stub engines — not in scope |
| `ca7486c` feat(graph-query): graph-native query | 🔄 **Superseded** | Master has `packages/provenance-graph` already expanded |
| `777592c` feat(workflow-engine) | 🟡 **Cherry-pick** | Workflow orchestration may be reusable for review workflow |
| `d2e6d90` feat(knowledge-engine) | 🔄 **Superseded** | Master has more complete version |
| `cb60e33` feat(provenance-graph) | 🔄 **Superseded** | Master has expanded provenance |
| `ade25a7` feat(operational-twins) | ❌ **Freeze** | Specimen/transaction domain |
| `b7b7d20` feat(trust-engine) | 🟡 **Cherry-pick** | Decay model may be reusable for confidence decay |
| `a56341f` feat(policy-engine) | 🔄 **Superseded** | Master has policy-engine |
| `df910be` test(domain-events) | 🔄 **Superseded** | Master has expanded domain-events |
| `2bdc691` feat(domain-events) | 🔄 **Superseded** | Same |
| `258b317` feat(migrations): 019 — Transaction/Shipment | ❌ **Freeze** | Legacy domain |
| `3ad4fd3` feat(migrations): 016 — Provenance Graph | 🔄 **Superseded** | Migration 025 in master |
| `ed61e0a` feat(migrations): 015 — Operational Twins | ❌ **Freeze** | Migration 024 in master |
| `74f9a40` feat(migrations): 014 — Trust Engine | 🟡 **Cherry-pick** | Trust table design may inform confidence_assessments |
| `8959e8c` → `f96de43` docs (16 commits) | 🔄 **Superseded** | Master has ADRs + docs already |

**Summary:**
- ❌ Discard: 1 (Express scaffolding)
- ❌ Freeze: 5 (operational-twins, matching/fulfillment/financial/intelligence stubs, 3 migrations)
- 🔄 Superseded: 27 (master already has equivalent or better)
- 🟡 Cherry-pick: 3 (workflow-engine patterns, trust-engine decay model, trust migration design)
- 🟢 Manually port: 1 (operational-gate adapters — WIP relevant to review workflow)

---

## 5. API Contract (Evidence Core — Existing + New)

### Existing Endpoints (verified in master)

```typescript
// === EVIDENCE CORE ===
POST   /api/v1/evidence-core/claims
       Body: { claimTypeId, name, description, domain, validEvidenceClasses, requiredEvidenceClasses, decays, decayPeriodMonths }
       Returns: Claim

GET    /api/v1/evidence-core/claims?claimId=<id>&organizationId=<id>
       Returns: Claim

POST   /api/v1/evidence-core/evidence
       Body: { claimId, content, source, date, evidenceClass?, weight? }
       Returns: EvidenceNode

GET    /api/v1/evidence-core/evidence?claimId=<id>
       Returns: EvidenceNode[]

POST   /api/v1/evidence-core/relationships
       Body: { sourceNodeId, targetNodeId, relationshipType }
       Returns: EvidenceRelationship

POST   /api/v1/evidence-core/counter-evidence
       Body: { claimId, content, source, date }
       Returns: CounterEvidence

POST   /api/v1/evidence-core/responses
       Body: { counterEvidenceId, description, resolutionDate }
       Returns: RightOfResponse

POST   /api/v1/evidence-core/process-state
       Body: { entityType, entityId, newStatus, reason }
       Returns: void

GET    /api/v1/evidence-core/identity/resolve
       Query: { name, siteName?, city?, state? }
       Returns: IdentityResolution[]

// === READINESS ===
POST   /api/v1/readiness/evaluate
       Body: { organizationId, programType, source? }
       Returns: ReadinessEvaluation

GET    /api/v1/readiness/capabilities?programType=<id>
       Returns: CapabilitySummary[]

// === INSTITUTION ===
GET    /api/v1/institution/profile
       Returns: InstitutionProfile

// === PUBLISHED VIEWS ===
GET    /api/v1/published-views/:claimId
       Returns: PublishedView
```

### New Endpoints Required

```typescript
// === REVIEW WORKFLOW ===
POST   /api/v1/review/tasks
       Body: { claimId?, evidenceNodeId?, taskType, assignedTo? }
       Returns: ReviewTask

GET    /api/v1/review/tasks?organizationId=<id>&status=<status>
       Returns: ReviewTask[]

PATCH  /api/v1/review/tasks/:id
       Body: { status, notes? }
       Returns: ReviewTask

// === PASSPORT ===
POST   /api/v1/passport/publish
       Body: { organizationId, claimIds[], visibility, authorizedSponsorIds[] }
       Returns: PassportEntry[]

GET    /api/v1/passport?organizationId=<id>
       Returns: Passport (aggregated: claims + confidence + published-views)

// === PEOPLE & LOCATIONS (lightweight) ===
GET    /api/v1/people?organizationId=<id>
       Returns: Person[]

GET    /api/v1/locations?organizationId=<id>
       Returns: Location[]
```

---

## 6. Migrations Required

| Migration | Purpose | Tables |
|-----------|---------|--------|
| 056 | Review Workflow | `evidence_core.review_tasks`, `evidence_core.workflow_states` |
| 057 | Passport Publication | `evidence_core.passport_entries`, `evidence_core.passport_shares` |
| 058 | People & Locations | `evidence_core.people`, `evidence_core.locations` |
| 059 | Confidence Persistence | `evidence_core.confidence_assessments` (snapshot table) |

No changes to existing evidence-core schema (045). These are additive.

---

## 7. Vertical Slice Implemented

I'll now implement the first vertical slice over `master` with:
- Review workflow (review_tasks table + domain logic)
- Passport publication endpoint
- People & Locations lightweight API
- Wire the UI prototype to use the existing evidence-core API

Let me build the migrations, domain logic, and API routes.

