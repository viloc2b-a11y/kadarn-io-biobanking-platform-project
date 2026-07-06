# Platform Consolidation Master Plan - PCP-1

**Program:** Kadarn Platform Consolidation Program  
**Phase:** PCP-1, first execution phase after Platform Discovery  
**Inputs:** `docs/platform-discovery/platform-capability-audit.md`, `docs/platform-discovery/knowledge-model.md`, `docs/platform-discovery/canonical-platform-vocabulary.md`, and repository-wide evidence  
**Scope:** Production readiness of the current platform only. No redesign, no speculative features, no new architecture.  
**Constitution:** `docs/platform-discovery/kadarn-platform-constitution-v1.0.md` governs PCP execution.

## Executive Summary

Kadarn is not a greenfield product. The repository already contains substantial implementation across tenancy, organizations, programs, discovery, evidence, provenance, passports, marketplace, operations, observability, and deployment scaffolding. The production problem is not absence of platform code; it is uneven completion across persistence, API, UI, workflow, permission, test, and deployment layers.

The platform should be taken to production by consolidating the implemented source-of-truth chain:

```text
Organization / Institution
  -> Discovery / Evidence / Claims / Provenance
  -> Published Views / Passports / Reports
  -> Operational Workflows / KOC / Marketplace
```

No major capability is fully production-ready end-to-end today. The strongest anchors are Organization and Membership, Evidence Core, Phase 8 lineage/publication, Discovery, Sponsor Passport API/store, and operational KOC/workspace scaffolding. The largest production blockers are discovery-to-evidence promotion, delivery persistence/API, sponsor shell placeholders, stubbed event/provenance integrations, identity resolution, production cutover, and vocabulary drift around Trust, Confidence, Claim, Passport, Profile, Artifact, and Capability.

## Readiness Legend

| Status | Meaning |
|---|---|
| READY | Production path is complete for current scope across persistence, API, UI/workflow when applicable, permissions, tests, and integration evidence. |
| PARTIAL | Substantial implementation exists, but one or more production layers are missing, stubbed, unverified, or divergent. |
| BLOCKED | Existing capability cannot complete its intended production workflow until a missing upstream layer is finished. |
| STUB | Placeholder, scaffold, mock, hardcoded, or demo implementation dominates the capability. |
| DEPRECATED | Legacy or superseded vocabulary/path remains in the repository and must be contained, qualified, or removed after replacement. |

## Part 1 - Capability Readiness

### Capability Matrix

No discovered capability is classified as READY because repository evidence does not prove complete production execution across all required layers. "Tests present" means coverage exists in the repo; it does not mean the production workflow has been certified in this phase.

| Capability | Status | Why incomplete | Missing production layers |
|---|---|---|---|
| Authentication and Session Context | PARTIAL | Login/session and `/me` exist, but account lifecycle, recovery, and production auth flow proof are not evidenced. | UI: recovery/account lifecycle. Workflow: onboarding/session completion. Tests: no full production auth E2E. Integration: Supabase runtime not certified. |
| Organization and Membership Model | PARTIAL | Strong schema/API foundation, but runtime behavior and access context were not revalidated as a production gate. | Workflow: end-to-end org lifecycle. Permissions: RLS/auth guard proof across all routes. Tests: CI execution. Integration: Supabase migration parity. |
| Institution Public Profile / Site Passport | PARTIAL | Public and continuity-backed profile routes exist, but source boundaries and public-read parity remain transitional. | Permissions: public vs member reads. Workflow: published-view cutover. Tests: legacy equivalence execution. Integration: Phase 8 production cutover. |
| Program Management | PARTIAL | Program APIs, UI, and tables exist, but operational workflow execution is not proven end-to-end. | Workflow: participant/milestone/activity completion. Tests: production E2E. Integration: exchange, KPE, logistics linkage. |
| Collection and Specimen Inventory | PARTIAL | Operational twin and inventory records exist, but full specimen lifecycle is unverified. | Workflow: collection-to-sample-to-movement chain. Integration: processing/logistics/marketplace. Tests: runtime lifecycle proof. |
| Processing and Quality Control | PARTIAL | QC writes exist, but provenance recording is explicitly stubbed in the QC route. | Missing provenance integration. Workflow: QC-to-evidence/audit linkage. Tests: provenance assertion. Integration: `provenance-recorder`. |
| Evidence Core Domain Model | PARTIAL | Claims/evidence/relationships are implemented, but runtime DB path and UI completion are not certified. | UI: no direct Evidence Core workspace. Workflow: claim lifecycle through publication. Tests: production DB execution. Integration: discovery and Phase 8 bridge. |
| External Evidence Connectors | PARTIAL | Connector packages exist, but default factories include mock clients and live integrations were not exercised. | APIs: no public connector endpoints. Workflow: ingest-to-evidence. Tests: live/contract tests. Integration: CT.gov, PubMed, FDA, Crossref, OpenAlex, ORCID, ROR. |
| Claim Lifecycle and Review | PARTIAL | Multiple claim generations coexist: Evidence Core, Continuity, Phase 8, and discovery candidates. | Workflow: canonical promotion path. Integration: mapping across claim stores. Tests: end-to-end claim review. Documentation: qualified claim vocabulary. |
| Evidence Lineage and Provenance Reconstruction | PARTIAL | Lineage/provenance packages and routes exist, but claim provenance persistence is distributed and runtime reconstruction is unverified. | Persistence: no single matching claim provenance table. Workflow: reconstruction proof. Integration: evidence pack/passport paths. |
| Append-only Audit and Compliance Events | PARTIAL | Audit tables/triggers/tests exist, but trigger behavior and audit coverage were not production-certified. | Tests: trigger execution. Integration: domain event and passport history linkage. Operational: audit monitoring. |
| Continuity Passport | PARTIAL | Continuity routes/profile/claim workflow exist, but this is a legacy parallel model next to Evidence Core and Phase 8. | Workflow: source-of-truth alignment. UI: continuity/profile language cleanup. Integration: published-view cutover. Vocabulary: Continuity Claim/Passport qualification. |
| Confidence Evaluation and Trust State | PARTIAL | Confidence is implemented as derived evidence support, while legacy trust terms remain in code/docs/UI. | Workflow: confidence recomputation proof. UI: numeric score cleanup. Tests: projection confidence parity. Vocabulary: Trust deprecation. |
| Published Views and Evidence Packs | PARTIAL | Published View engine and evidence pack generators exist, but evidence packs are generated in memory/on demand and production cutover is pending. | Persistence: durable evidence pack boundary absent. Integration: native store parity. Tests: published-view cutover. Deployment: prod flag/config. |
| Evidence Delivery Domain | BLOCKED | Domain package and UI exist, but the workspace is mock-backed and no delivery API persistence layer was found. | Persistence, APIs, UI data wiring, workflow, permissions, tests, integration. |
| Authorization, RLS, Policy Engine, OPA Shadow | PARTIAL | Auth guards, RLS, policy engine, and OPA shadow exist, but enforcement mode and cross-route coverage are not production-certified. | Permissions: enforce-mode validation. Tests: route-by-route authorization. Operational: policy decision observability. |
| Discovery Engine and Dashboard | PARTIAL | Large package/API/UI footprint exists, but curation explicitly does not promote to Evidence Core. | Workflow: promotion path. Integration: live connectors and Evidence Core writes. Tests: institution-to-passport E2E. |
| Document Intake Pipeline | PARTIAL | Package and tests exist, but direct API exposure and production provider execution are incomplete. | APIs: intake endpoint/service boundary. Integration: provider reliability. Tests: live/contract fixtures. |
| Marketplace Search and Requests | PARTIAL | Marketplace routes and UI exist, but some pages are demo-like and request-to-exchange completion is unverified. | UI: form completion. Workflow: request-to-deal. Permissions: visibility and sponsor search. Integration: matching/exchange. |
| Sponsor Workspace Shell | STUB | Most sponsor pages import `SponsorPlaceholder`; Sponsor Passport is the substantive implemented slice. | UI, APIs for non-passport pages, workflow, permissions, tests, integration. |
| Sponsor Passport | PARTIAL | API/store/tests are strong, but mock fallback remains for dev/E2E and UI actions are disabled. | UI: action workflows. Integration: production env and evidence-core source. Tests: production-mode E2E. |
| Sponsor Portfolio | PARTIAL | Portfolio persistence/repository exists, but `/sponsor/portfolio` is placeholder UI. | UI, workflow, tests. Integration: portfolio management APIs beyond read-path consumption. |
| Vendor / Logistics Operations | PARTIAL | Logistics tables/routes/UI exist, but external vendor/courier integrations and event/provenance wiring are incomplete. | Integration: carriers/vendors. Workflow: shipment-to-settlement. Tests: real operational chain. |
| Financial Settlements and Payments | PARTIAL | Settlement calculation and routes exist, but no first-class settlement table or payment gateway integration is evidenced. | Persistence, integration, workflow, tests. |
| Exchange Deals and Requests | PARTIAL | Exchange APIs/tables exist, but helper functions log events/provenance/workflow signals instead of durable side effects. | Integration: events, provenance, workflow engine. Tests: request-to-deal-to-settlement. |
| API Surface and OpenAPI Docs | PARTIAL | Broad route inventory exists, but OpenAPI parity against handlers is unverified. | Documentation/API parity tests, contract generation, route coverage. |
| Workspace Experience | PARTIAL | Workspace routes/pages exist, but surfaces are uneven and delivery is mock-backed. | UI data wiring, workflow completion, E2E tests, permissions. |
| KOC Operations Console | PARTIAL | KOC pages/APIs exist, but runtime freshness is unverified and KOC AI is hardcoded. | UI: AI stub. Operational: live data ingestion. Tests: KOC E2E. |
| Domain Event Runtime | PARTIAL | Event tables and in-memory bus exist, but durable broker/runtime behavior is not validated and publish failure can be silent. | Operational: durable event delivery. Integration: outbox processing. Tests: failure semantics. |
| Platform Services | PARTIAL | Shared interfaces and in-memory/noop defaults exist; production adapters are not broadly present. | Integration: jobs, search, webhooks, locks, scheduling. Operational: adapter observability. |
| Observability, Metrics, Health, Reliability | PARTIAL | Health/ready/metrics, dashboards, alerts, and scripts exist, but runtime ingestion and alerting were not verified. | Deployment: metric pipeline. Operational: alert firing, backup/restore proof. Tests: smoke/performance gates. |
| DevOps, Security Gates, and Local Environment | PARTIAL | CI, devcontainer, Docker, SBOM, scripts, and migrations exist, but execution was not verified. | Deployment: CI green state. Testing: build/typecheck/test/audit gates. Documentation: release runbook use. |
| Knowledge Graph / Graph Query | BLOCKED | Ontology tables and graph-query interfaces exist, but no concrete production adapter or universal graph API is evidenced. | Persistence/adapter, APIs, workflow, integration, tests. |
| AI Layer / KOC AI Insights | STUB | AI layer is rule-based fallback/interface and KOC AI page uses hardcoded insights. | Persistence, APIs, workflow, integration, tests. |

### Deprecated or Legacy Paths To Contain

| Path or concept | Status | Consolidation action |
|---|---|---|
| Continuity claim model as general claim truth | DEPRECATED | Keep for continuity/public legacy reads; qualify as Continuity Claim and do not treat as canonical Evidence Core Claim. |
| Trust Score as product evidence-support language | DEPRECATED | Retain legacy engine/schema terms only when unavoidable; product/API/UI should use Confidence / Confidence State. |
| Sponsor portfolio allowlist pattern | DEPRECATED | Continue replacement with persisted sponsor portfolios and memberships. |
| Legacy Passport adapters as primary read path | DEPRECATED | Keep only as transitional compatibility while Phase 8 Published View production cutover completes. |

## Part 2 - Production Blockers

### Persistence

| Blocker | Severity | Business impact | Technical impact | Estimated effort | Dependencies |
|---|---|---|---|---|---|
| Discovery candidates do not promote to Evidence Core or Phase 8 claim truth through a production API. | Critical | First institution cannot move from discovery findings to evidence-backed passport without manual or legacy paths. | Breaks Institution, Discovery, Evidence, Passport workflows. | Large | Evidence Core, evidence-lineage `promoteToClaim`, Phase 8 claim tables, curation state. |
| Delivery has no production persistence/API layer. | Critical | Evidence delivery/export workflow cannot be sold or operated. | UI remains fixture-backed; delivery-domain cannot persist artifacts/queues/receipts. | Large | `@kadarn/delivery-domain`, Published View, Evidence Pack. |
| Parallel claim stores are unresolved. | High | Operators and sponsors can see inconsistent claim meaning across continuity, evidence-core, and Phase 8. | Mapping complexity and incorrect source-of-truth assumptions. | Large | PD-3 vocabulary, Evidence Core, Phase 8, continuity adapters. |
| Evidence Pack generation is in-memory/on-demand. | High | Export/explainability bundles cannot be audited as stable production artifacts. | No durable evidence pack lifecycle or retrieval boundary. | Medium | Published View, evidence-lineage, provenance. |
| Settlement lacks first-class persistence. | Medium | Vendor/payment workflow cannot support audit-grade settlement operations. | Financial route depends on derived/escrow data only. | Medium | Exchange deals, financial engine, payment integration. |
| Migration trees and Phase 8 parity remain operational risk. | High | Incorrect schema in production blocks cutover. | Drift between `database/` and `supabase/` can invalidate RLS/views. | Medium | Migration parity tests, Phase 8 runbook. |

### API

| Blocker | Severity | Business impact | Technical impact | Estimated effort | Dependencies |
|---|---|---|---|---|---|
| `/v1/evidence-core/identity/resolve` returns 501. | High | Institution identity matching and connector attribution are incomplete. | Blocks cross-source evidence normalization. | Medium | Organization index, external identity links, connectors. |
| No discovery-to-evidence promotion endpoint. | Critical | Discovery cannot become production evidence without engineering intervention. | Curation lifecycle ends before canonical claim write. | Large | Discovery curation, Evidence Core, Phase 8, provenance. |
| Exchange/onboarding/QC integration helpers use console/fake side effects. | High | Audit, workflow, and provenance claims are incomplete. | Domain events, provenance, and workflow signals are not durable. | Medium | `event-runtime`, `provenance-recorder`, workflow engine. |
| Connector factories default to empty mock clients. | High | Live discovery from external evidence sources cannot be trusted. | Production connector execution returns empty or mock results if enabled. | Medium | External APIs and connector configs. |
| OpenAPI parity is unverified. | Medium | External consumers cannot rely on the API contract. | Route handlers may drift from `openapi-v1.yaml`. | Medium | API route inventory, contract tests. |

### UI

| Blocker | Severity | Business impact | Technical impact | Estimated effort | Dependencies |
|---|---|---|---|---|---|
| Sponsor workspace is mostly placeholder UI. | High | Paying sponsor/institution buyers see incomplete sponsor product surfaces. | Pages exist but do not consume implemented APIs. | Medium | Sponsor Passport, sponsor portfolio, marketplace APIs. |
| Delivery workspace is mock-data backed. | Critical | Delivery workflow cannot be demonstrated as production functionality. | UI does not exercise backend state. | Large | Delivery API/persistence. |
| Passport actions are disabled or future-release placeholders. | Medium | Sponsors can inspect but cannot complete downstream actions from passports. | Action workflows are not wired. | Medium | Exchange/request workflows, permissions. |
| KOC AI page is hardcoded. | Medium | Operators may confuse demo insights with runtime intelligence. | No live AI/inference integration. | Medium | AI layer and operational event data. |
| Public/continuity pages use legacy numeric scores and verification labels. | Medium | Product language conflicts with evidence confidence doctrine. | UI surfaces retired vocabulary. | Small | PD-3 normalization backlog. |

### Authorization

| Blocker | Severity | Business impact | Technical impact | Estimated effort | Dependencies |
|---|---|---|---|---|---|
| Sponsor search/visibility boundaries are not fully validated. | High | Cross-tenant exposure risk. | Sponsor marketplace/passport reads may not consistently enforce portfolio/visibility policy. | Medium | Auth guards, RLS, portfolio membership. |
| OPA is shadow/local and enforce mode is not validated. | Medium | Policy engine may not block incorrect access in production. | Policy decisions may be observed but not authoritative. | Medium | Policy engine rollout, route wrappers. |
| Public-read vs member-read Phase 8 grants remain cutover-sensitive. | High | Public passport could expose too much or too little. | RLS/grants need production proof. | Medium | `058_phase8_rls_and_evidence_grants.sql`, cutover smoke tests. |

### Operational

| Blocker | Severity | Business impact | Technical impact | Estimated effort | Dependencies |
|---|---|---|---|---|---|
| Phase 8 production cutover is pending. | Critical | Public and sponsor evidence reads are not proven on final production path. | Legacy and published-view paths remain parallel. | Medium | Cutover runbook, staging report, smoke tests. |
| Event publishing failure can be silent. | High | Operators may believe events are recorded when they are not. | `publishDomainEvent` can return random fallback IDs after RPC failure. | Medium | Event runtime, outbox, observability. |
| Rate limiting is in-memory. | High | Multi-instance production can exceed limits or behave inconsistently. | Per-process store does not scale across replicas. | Small-Medium | Redis/shared store or platform rate limiter. |
| Observability ingestion is unverified. | Medium | Production incidents may not alert correctly. | Dashboards/alerts exist but runtime telemetry path is not proven. | Medium | Instrumentation package, infra dashboards. |
| Platform services use in-memory/noop defaults. | Medium | Background jobs, scheduling, webhooks, locks, and notifications are not production-grade. | Adapter boundaries exist but production adapters are missing or unverified. | Large | Platform services adapters. |

### Testing

| Blocker | Severity | Business impact | Technical impact | Estimated effort | Dependencies |
|---|---|---|---|---|---|
| No certified Institution -> Discovery -> Evidence -> Passport E2E. | Critical | Cannot onboard first paying institution with confidence. | Primary revenue workflow is unproven. | Large | Promotion API, seeded production-like data, auth. |
| Tests were inventoried, not executed, in discovery docs. | High | Current green status is unknown. | Build/typecheck/runtime regressions may exist. | Medium | CI, local Supabase, test orchestration. |
| Connector tests are mostly mock/package-level. | High | Live evidence intake is unproven. | External API contracts may fail. | Medium | Connector configs, fixtures, network policies. |
| Authorization tests are not mapped to every production route. | High | Tenant/evidence leaks can survive. | Route-level guard gaps remain possible. | Medium | API inventory, RLS tests. |

### Deployment

| Blocker | Severity | Business impact | Technical impact | Estimated effort | Dependencies |
|---|---|---|---|---|---|
| CI workflows and gates are present but not certified for this state. | High | Release cannot be trusted. | Branch may fail build/typecheck/test/security/performance gates. | Small-Medium | `.github/workflows/*`, package scripts. |
| Production environment defaults require hardening. | High | Mock/E2E/legacy modes can leak into staging/prod. | Env-driven fallback behavior can diverge by environment. | Small | Env templates, deployment config. |
| Backup/restore and reliability scripts are not proven. | Medium | First paying institution data recovery risk. | Operational scripts exist but may not run successfully. | Medium | Supabase environment, reliability scripts. |

### Documentation

| Blocker | Severity | Business impact | Technical impact | Estimated effort | Dependencies |
|---|---|---|---|---|---|
| Docs and code disagree on routes and maturity labels. | Medium | Sales, ops, and engineering may overpromise incomplete workflows. | Wrong path assumptions in tests/docs/API consumers. | Small-Medium | PDF docs, OpenAPI, route inventory. |
| Production runbooks are spread across OpenSpec docs. | Medium | Cutover execution is harder and riskier. | Operators must reconstruct sequence manually. | Medium | Phase 8 runbook, reliability docs, CI docs. |
| Discovery findings are not yet converted to execution backlog. | High | Platform Discovery cannot drive engineering sequencing. | Teams lack single production roadmap. | Completed by this PCP-1 document | PD-1, PD-2, PD-3. |

### Vocabulary

| Blocker | Severity | Business impact | Technical impact | Estimated effort | Dependencies |
|---|---|---|---|---|---|
| Trust/Trust Score remains product-facing in several places. | High | Conflicts with evidence-support language and sponsor trust posture. | API/UI/docs may expose deprecated semantics. | Medium | PD-3 backlog. |
| Claim vocabulary is overloaded. | High | Engineers may write to or read from the wrong claim model. | Evidence Core, Phase 8, Continuity, and Discovery candidates are conflated. | Large | Claim consolidation tasks. |
| Passport/Profile/Artifact/Capability terms are unqualified. | Medium | Users and engineers confuse projections with source records. | Wrong persistence/API assumptions. | Medium | PD-3 normalization tasks. |
| "Promotion" is ambiguous. | Critical | Teams may assume discovery curation writes evidence truth. | Discovery state `PROMOTED` can be confused with Evidence Core promotion. | Small | Discovery docs/API naming. |

## Part 3 - Operational Workflows

| Workflow | Can complete today? | Missing steps |
|---|---|---|
| Institution | PARTIAL | Organization/membership/profile/discovery surfaces exist. Missing: identity resolve, connector-to-evidence chain, discovery-to-evidence promotion, production public-read cutover, full auth/onboarding E2E. |
| Sponsor | PARTIAL | Sponsor Passport list/detail and portfolio persistence exist. Missing: sponsor shell pages beyond passports, portfolio UI, feasibility/opportunity/risk/notification workflows, production-mode passport E2E, sponsor visibility proof. |
| Vendor | PARTIAL | Logistics, exchange, financial routes and tables exist. Missing: durable exchange events/provenance/workflow, QC provenance, payment gateway/settlement persistence, external carrier/vendor integration, request-to-settlement E2E. |
| Network | PARTIAL | Marketplace/network APIs and KOC network views exist. Missing: production matching engine, concrete graph-query adapter, network relationship workflow, authorization-tested network filtering. |
| Discovery | PARTIAL | Session/run/artifact/candidate/dashboard/report/curation exist. Missing: Evidence Core promotion, live connectors, identity resolution, production curation-to-passport E2E. |
| Delivery | NO | Delivery-domain and workspace UI exist, but UI is fixture-backed and no delivery API/persistence layer is evidenced. Missing: delivery tables, API, permissions, queue/receipt workflow, integration tests. |
| Evidence | PARTIAL | Evidence Core routes/tables/packages and lineage/provenance packages exist. Missing: unified production claim path, discovery promotion, direct UI, live connectors, runtime confidence proof. |
| Passport | PARTIAL | Sponsor Passport, Site/Continuity Passport, institution public profile, Published View adapters exist. Missing: Phase 8 production cutover, source boundary normalization, action workflows, mock fallback elimination in production-like environments. |

## Part 4 - Mock and Stub Elimination

| Location | Type | Purpose today | Replacement path | Priority |
|---|---|---|---|---|
| `apps/api/src/app/api/v1/evidence-core/identity/resolve/route.ts` | stub / 501 API | Explicitly prevents unresolved identity behavior. | Implement org-scoped durable identity resolution using organizations and external identity links. | P0 |
| `apps/api/src/lib/onboarding.ts` | temporary adapter | Logs events/provenance/policy side effects during organization creation. | Wire to `event-runtime`, `provenance-recorder`, and policy evaluation persistence. | P0 |
| `apps/api/src/lib/exchange-helper.ts` | fake event/provenance/workflow adapter | Logs exchange/feasibility events and returns fake provenance/workflow outcomes. | Wire exchange, feasibility, and marketplace request paths to durable events, provenance, and workflow engine. | P0 |
| `apps/api/src/app/api/v1/processing/aliquots/[id]/qc/route.ts` | provenance stub | Persists QC but logs provenance only. | Record QC provenance through `provenance-recorder`. | P0 |
| `apps/api/src/lib/rate-limit.ts` | fallback implementation | In-memory per-process rate limiting. | Shared production rate limit store/config. | P0 |
| `apps/api/src/lib/event-runtime.ts` | fallback implementation | Can return fallback UUID when event publish fails. | Fail visibly or record dead-letter/metric for event publish failure. | P0 |
| `apps/api/src/app/api/v1/published-views/[claimId]/evidence-pack/route.ts` | legacy/synthetic adapter | Generates evidence pack from synthetic legacy claim fields. | Native Published View / Evidence Core claim read path. | P0 |
| `packages/evidence-core/src/connectors/*/client.ts` | mock clients | Default empty mock clients for CT.gov, PubMed, FDA. | Real HTTP clients with contract tests and production config. | P0 |
| `apps/api/src/app/api/v1/financial/settlements/route.ts` | incomplete integration | Settlement route notes no payment gateway integration. | Persisted settlement/payment integration for existing exchange flow. | P0/P1 |
| `apps/web/src/components/sponsor/sponsor-placeholder.tsx` and sponsor pages | placeholder UI | Scaffold sponsor dashboard, feasibility, opportunities, portfolio, risk, notifications. | Wire pages to existing sponsor passport, portfolio, marketplace, exchange, and event APIs. | P1 |
| `apps/web/src/components/delivery/mock-data.ts` and `/workspace/delivery` | hardcoded data | Drives delivery workspace entirely from mock fixtures. | Delivery API/persistence from delivery-domain. | P1 |
| `apps/web/src/components/discovery/sponsor-search.tsx` | hardcoded data | Demo sponsor search results. | Backend search/aggregation endpoint. | P1 |
| `apps/web/src/app/(koc)/koc/ai/page.tsx` | hardcoded insights | Static AI/anomaly cards. | Live operational/AI layer or hide until real data path exists. | P1 |
| `apps/api/src/app/api/v1/workspace/payments/route.ts` | placeholder API | Returns empty org-scoped message. | Financial/settlement read model for workspace payments. | P1 |
| `packages/published-view/src/legacy-adapter.ts` | temporary adapter | Bridges legacy passport/profile data to published-view contract. | Native Published View service path after cutover. | P1 |
| `packages/published-view/src/evidence-pack.ts` | in-memory store | Keeps generated packs in process memory. | Durable evidence pack persistence or deterministic regeneration with audit trail. | P1 |
| `packages/evidence-lineage/src/evidence-pack.ts` | in-memory engine | Builds evidence packs without durable lifecycle. | Persisted lineage/publication pack service. | P1 |
| `packages/ai-layer/src/index.ts` | fallback AI implementation | Rule-based fallback with `fallback: true`. | Real inference integration or explicit non-production containment. | P2 |
| `packages/evidence-core/src/explainability.ts` | skeleton evaluation | Placeholder evaluation output. | Evidence graph-derived explainability engine. | P2 |
| `packages/workflow-engine/src/temporal/activities.ts` | stub activities | Default activity handlers with stub channel. | Injected production handlers for email, DB, notification, and workflow effects. | P2 |
| `packages/evidence-discovery/src/continuous-monitoring/orchestrator.ts` | demo threshold / no rebuild | Demo monitoring semantics and no actual rebuild. | Real change detection and rebuild orchestration if monitoring is part of production scope. | P2 |
| `packages/delivery-domain/src/channels/webhook-adapter.ts` | fake transport/signature | Acknowledges webhook delivery without real transport/signing. | Real HTTP transport and cryptographic signing. | P2 |
| `apps/web/src/lib/koc-api.ts` | fallback error swallowing | Returns `null` on KOC API failure. | Explicit error state and operator-visible failure handling. | P2 |
| `apps/api/src/lib/sponsor-passport/mock-passport-store.ts` and mock data | controlled mock | Local/E2E sponsor passport fallback. | Keep only for tests/dev; require evidence-core data source in staging/prod. | P3 |
| `apps/web/src/lib/e2e/mock-session.ts`, middleware E2E bypass | E2E fallback | Test auth bypass. | Keep only behind test env flags; verify never enabled in prod. | P3 |
| `database/migrations/*seed*`, `scripts/seed-pilot.sql` | demo data | Local/staging/demo seed records. | Clearly separate dev/staging seed execution from production migrations. | P1/P2 |

## Part 5 - Vocabulary Consolidation

Repository normalization backlog using PD-3 canonical vocabulary:

| Term | Drift | Repository backlog |
|---|---|---|
| Trust | Product/API/UI still expose trust or Trust Score in marketplace, KOC KPE, graph-query, policy examples, and older docs. | Qualify as legacy organization trust or replace product-facing evidence support language with Confidence / Confidence State. |
| Confidence | Numeric confidence/score fields remain in continuity/public passport surfaces. | Use Confidence State for evidence support; qualify Continuity Score as continuity-specific and not claim confidence. |
| Organization / Institution | Organization and Institution are used interchangeably without boundary notes. | Use Organization for tenant/source record and Institution for product projection over an organization. Add route/API comments where namespaces differ. |
| Profile | Evidence profile, continuity profile, user profile, and institution profile are overloaded. | Qualify as User Profile, Site Continuity Profile, or Institution Profile Projection. |
| Passport | Sponsor, continuity, site, public, institutional, and feasibility passport labels overlap. | Use audience/source-qualified names: Sponsor Passport, Continuity Passport, Site Passport, Feasibility Passport. |
| Published View | Published View is a canonical read boundary but is nearly invisible in product/operator copy. | Mark public/institution/sponsor read paths as served through Published View where applicable. |
| Capability | Organization Capability, discovery capability, passport capability, and continuity capability are unqualified in UI copy. | Use Organization Capability for persisted abilities; Discovered Capability or Passport Capability for projections. |
| Artifact | Delivery Artifact, Evidence Artifact, and Discovery Artifact are sometimes called only artifact. | Qualify artifact by pipeline. |
| Evidence | Continuity evidence items, operational evidence records, evidence nodes, and evidence artifacts are mixed in copy. | Use Evidence Node for claim-linked evidence; qualify continuity/operational evidence separately. |
| Claim | Evidence Core Claim, Continuity Claim, Claim Candidate, Claim Instance, and Claim Version are conflated. | Prefix claim by bounded context or lifecycle until a specific canonical path is being discussed. |
| Promotion | Discovery curation states can imply promotion even though curation does not write Evidence Core. | Reserve promotion for writes to canonical claim/evidence path; call discovery actions curation unless they persist claims. |

### Highest-Priority Normalization Items

1. Remove or legacy-qualify product-facing Trust Score fields and labels.
2. Rename discovery "evidence claims" to Claim Candidates.
3. Qualify continuity public pages as Continuity Passport / Continuity Claim / Continuity Score.
4. Make Published View visible in API docs and cutover documentation.
5. Qualify Sponsor Passport versus Site/Continuity Passport in UI and OpenAPI copy.

## Part 6 - Refactoring Backlog

Every task belongs to exactly one category. BUILD is used only where no implementation exists for an existing repository-implied production requirement.

| ID | Category | Task | Reason | Repository location | Business value | Risk | Dependencies | Effort |
|---|---|---|---|---|---|---|---|---|
| PCP1-001 | FINISH | Implement discovery-to-evidence promotion path. | Curation currently does not write Evidence Core; first institution workflow cannot complete. | `packages/evidence-discovery`, `apps/api/src/app/api/v1/discovery/*`, `packages/evidence-lineage`, `apps/api/src/app/api/v1/evidence-core/*` | Converts discovery into evidence-backed production knowledge. | High: touches claim truth and provenance. | Evidence Core, Phase 8 claim/version model, provenance. | Large |
| PCP1-002 | FINISH | Complete Phase 8 production cutover. | Staging cutover exists but production cutover remains pending. | `openspec/phase-8-cutover-runbook.md`, `apps/api/src/lib/phase8-cutover-status.ts`, `packages/published-view` | Stabilizes public/passport read path. | High: public-read/RLS risk. | Migration parity, smoke tests, env config. | Medium |
| PCP1-003 | BUILD | Add delivery API and persistence for existing delivery-domain model. | Delivery UI/domain exist, but no production backend path exists. | `packages/delivery-domain`, `apps/web/src/app/(workspace)/workspace/delivery`, `apps/api/src/app/api/v1/*` | Enables evidence delivery workflow. | High: new persistence/API surface from existing domain. | Published View, Evidence Pack, permissions. | Large |
| PCP1-004 | FINISH | Replace delivery workspace mock data with API-backed state. | Workspace currently runs on `MOCK_*` fixtures. | `apps/web/src/components/delivery/mock-data.ts`, delivery page/components | Makes delivery operator-usable. | Medium. | PCP1-003. | Medium |
| PCP1-005 | FINISH | Replace onboarding, exchange, feasibility, and QC console/fake integrations with durable events/provenance/workflow calls. | Production audit trail is incomplete. | `apps/api/src/lib/onboarding.ts`, `apps/api/src/lib/exchange-helper.ts`, QC route, feasibility route | Improves auditability and operational trust. | High: side-effect behavior. | `event-runtime`, `provenance-recorder`, workflow engine. | Medium |
| PCP1-006 | FINISH | Implement identity resolution API. | Current route returns 501. | `apps/api/src/app/api/v1/evidence-core/identity/resolve/route.ts`, `external_identity_links`, `organizations` | Enables connector attribution and institution matching. | Medium. | Organization/external identity model. | Medium |
| PCP1-007 | FINISH | Replace external connector mock factories for production mode. | Default connector factories can return empty mock clients. | `packages/evidence-core/src/connectors/*`, `packages/evidence-discovery/src/connectors/*` | Enables live evidence discovery. | High: external dependencies. | Connector config, API credentials/rate limits. | Medium |
| PCP1-008 | CONSOLIDATE | Define and enforce claim source-of-truth boundaries in code/docs/tests. | Evidence Core, Phase 8, Continuity, and discovery candidates overlap. | `packages/evidence-core`, `packages/types/src/phase8`, continuity routes, discovery package | Prevents wrong claim writes/reads. | High: semantic regression. | PD-3 vocabulary, promotion path. | Large |
| PCP1-009 | RENAME | Normalize Trust/Confidence terminology in product-facing surfaces. | Trust Score is deprecated product vocabulary. | Marketplace org API/UI, KOC KPE, graph-query, docs | Reduces compliance/product confusion. | Medium: API contract changes. | PD-3 backlog. | Medium |
| PCP1-010 | RENAME | Qualify Passport/Profile/Artifact/Capability/Claim labels in UI/OpenAPI/docs. | Projection/source terms are overloaded. | Sponsor UI, site passport, discovery panels, OpenAPI, docs | Improves operator and integrator comprehension. | Low-Medium. | PD-3 backlog. | Medium |
| PCP1-011 | FINISH | Wire sponsor portfolio UI to existing persistence/API path. | Persistence exists; page is placeholder. | `/sponsor/portfolio`, sponsor passport portfolio repository | Makes sponsor portfolio usable. | Medium. | Sponsor auth, portfolio APIs. | Medium |
| PCP1-012 | FINISH | Replace sponsor shell placeholders with implemented API-backed minimum pages. | Sponsor pages exist but are scaffold-only. | `apps/web/src/app/(sponsor)/sponsor/*`, `SponsorPlaceholder` | Makes sponsor workflow credible for first paying institution. | Medium. | Sponsor Passport, marketplace, exchange. | Medium-Large |
| PCP1-013 | FINISH | Replace workspace payments placeholder API with settlement-backed read model. | Payments route returns empty placeholder. | `apps/api/src/app/api/v1/workspace/payments/route.ts`, financial routes | Clarifies vendor/payment state. | Medium. | Settlement model, exchange deals. | Medium |
| PCP1-014 | FINISH | Harden production environment defaults. | Mock/E2E/legacy flags can diverge by environment. | `.env.example`, deployment configs, `factory.ts`, middleware | Prevents accidental mock or test auth in prod. | High if misconfigured. | Deployment config. | Small |
| PCP1-015 | REFACTOR | Replace in-memory rate limiting for production. | Current rate limiter is per-process. | `apps/api/src/lib/rate-limit.ts` | Prevents multi-instance abuse. | Medium. | Shared store or platform limiter. | Small-Medium |
| PCP1-016 | REFACTOR | Make event publish failures observable/fail-safe. | Fallback UUID hides persistence failure. | `apps/api/src/lib/event-runtime.ts` | Prevents invisible audit/event loss. | Medium. | Metrics/logging/dead-letter policy. | Medium |
| PCP1-017 | FINISH | Certify CI gates: build, typecheck, tests, security, performance, architecture. | Workflows exist but current state is unverified. | `.github/workflows/*`, package scripts, tests | Establishes release confidence. | Medium: current failures may surface. | Stable env/test data. | Medium |
| PCP1-018 | FINISH | Create production E2E for Institution -> Discovery -> Evidence -> Passport. | Primary business workflow lacks proof. | `tests/integration`, `tests/web`, discovery/evidence/passport APIs | Validates first paying institution journey. | High. | PCP1-001, PCP1-002, auth. | Large |
| PCP1-019 | CONSOLIDATE | Align OpenAPI with actual route handlers. | API surface is broad and parity unverified. | `apps/api/openapi-v1.yaml`, route handlers | Improves external integration readiness. | Medium. | Route inventory, contract tests. | Medium |
| PCP1-020 | REMOVE | Remove or isolate orphan/demo UI modules after replacement. | Hardcoded discovery sponsor search and unused stub components confuse readiness. | `apps/web/src/components/discovery/sponsor-search.tsx`, KOC/sponsor stubs | Reduces false product surface. | Low. | Replacement pages or confirmation of non-use. | Small |
| PCP1-021 | COMPLETE | Preserve Organization/Membership as production anchor with route-level authorization proof. | Strong foundation needs certification, not redesign. | org APIs, auth guards, RLS tests | Secures tenancy for first customer. | High if skipped. | CI and Supabase test harness. | Medium |
| PCP1-022 | COMPLETE | Preserve Sponsor Passport API/store contract while eliminating production mock reliance. | Strongest sponsor slice; should be production-certified. | sponsor passport API/lib/tests | Enables sponsor-facing institution read model. | Medium. | Env hardening, portfolio data. | Small-Medium |

## Part 7 - Release Planning

Each release must be independently deployable and should leave the platform more production-ready even if later releases are delayed.

### PCP-1.1 - Production Baseline and Safety Gates

Objective: make current behavior measurable, safe to deploy, and free from accidental mock/test modes.

Tasks:

- PCP1-014 Harden production environment defaults.
- PCP1-017 Certify CI/build/typecheck/test/security/performance/architecture gates.
- PCP1-021 Certify Organization/Membership route-level authorization.
- PCP1-016 Make event publish failures observable/fail-safe.
- PCP1-015 Replace or production-contain in-memory rate limiting.
- PCP1-019 Start OpenAPI parity for current production routes.

Deployable outcome: existing platform can be deployed with production-safe env defaults, known CI status, and critical auth/ops guardrails.

### PCP-1.2 - Phase 8 Read Path and Passport Stabilization

Objective: make institution/public/sponsor reads stable on the intended Published View and Sponsor Passport paths.

Tasks:

- PCP1-002 Complete Phase 8 production cutover.
- PCP1-022 Certify Sponsor Passport API/store in production mode.
- PCP1-011 Wire sponsor portfolio UI to existing persistence/API.
- PCP1-009 Normalize Trust/Confidence on product-facing read surfaces.
- PCP1-010 Qualify Passport/Profile/Claim/Capability/Artifact labels for read paths.

Deployable outcome: public and sponsor institution read models are stable, vocabulary-aligned, and production-configured.

### PCP-1.3 - Discovery to Evidence Completion

Objective: complete the core institution onboarding knowledge path.

Tasks:

- PCP1-001 Implement discovery-to-evidence promotion.
- PCP1-006 Implement identity resolution.
- PCP1-007 Replace connector mock factories for production mode.
- PCP1-008 Consolidate claim source-of-truth boundaries.
- PCP1-018 Create Institution -> Discovery -> Evidence -> Passport E2E.

Deployable outcome: discovery findings can become evidence-backed claims and passports through an auditable production workflow.

### PCP-1.4 - Sponsor Minimum Product Completion

Objective: make the sponsor workflow usable without placeholder pages.

Tasks:

- PCP1-012 Replace sponsor shell placeholders with API-backed minimum pages.
- PCP1-013 Replace payments placeholder API with settlement-backed read model where needed for current workflows.
- PCP1-020 Remove or isolate orphan/demo UI modules after replacements.

Deployable outcome: sponsors can navigate a coherent minimum workflow across portfolio, passports, marketplace/request context, and relevant operational state.

### PCP-1.5 - Delivery and Operational Workflow Completion

Objective: complete existing Delivery Domain and harden operational side effects.

Tasks:

- PCP1-003 Add delivery API and persistence.
- PCP1-004 Replace delivery mock UI with API-backed state.
- PCP1-005 Replace onboarding/exchange/feasibility/QC fake integrations with durable side effects.

Deployable outcome: evidence delivery and operational audit trails become production-capable.

## Part 8 - 90-Day Production Plan

Assumption: Kadarn must onboard its first paying institution within 90 days. The plan finishes existing capabilities only.

| Week | Execution focus | Outcomes |
|---|---|---|
| 1 | Freeze scope, certify current branch, harden env defaults. | CI status known; production flags documented; mock/E2E modes barred from prod; release checklist started. |
| 2 | Authorization and tenancy proof. | Organization/membership/RLS route matrix; sponsor/public/member read boundaries tested; critical auth gaps assigned. |
| 3 | Phase 8 cutover readiness. | Migration parity verified; published-view/public-read smoke tests pass in production-like env. |
| 4 | Sponsor Passport production-mode certification. | Sponsor Passport and portfolio reads run against evidence-core/persisted source, not mock; portfolio UI plan locked. |
| 5 | Vocabulary normalization on customer-facing surfaces. | Trust Score removed/qualified; Claim/Passport/Profile/Confidence terms aligned in public/sponsor/KOC surfaces. |
| 6 | Identity resolution and connector production configuration. | Identity resolve route implemented; connector factories no longer default to empty mocks in production mode. |
| 7 | Discovery promotion design locked to existing Evidence Core/Phase 8 model. | No redesign; promotion API contract and provenance requirements defined from existing packages. |
| 8 | Discovery-to-evidence promotion implementation. | Curation/promoted candidate can write canonical claim/evidence/provenance path. |
| 9 | Institution -> Discovery -> Evidence -> Passport E2E. | Primary onboarding journey executes in test/staging with seeded production-like data. |
| 10 | Sponsor minimum UI completion. | Portfolio and core sponsor shell pages no longer show placeholders for first-customer workflow. |
| 11 | Operational side effects hardening. | Onboarding/exchange/feasibility/QC write durable events/provenance/workflow signals where already implied. |
| 12 | Delivery minimum completion or explicit production exclusion. | Delivery API/persistence minimum shipped if required for first institution; otherwise UI hidden/marked out of production scope. |
| 13 | Release candidate hardening. | OpenAPI parity, smoke tests, observability checks, backup/restore proof, cutover rehearsal. |

### 90-Day Minimum Scope

Must finish for first paying institution:

- Production-safe auth, tenancy, RLS, and environment configuration.
- Phase 8 public/sponsor read path.
- Sponsor Passport production-mode source.
- Discovery-to-evidence promotion.
- Identity resolution and production connector configuration.
- Institution -> Discovery -> Evidence -> Passport E2E.
- Customer-facing vocabulary normalization.
- CI/build/typecheck/test/security gates.
- Observability, backup/restore, and cutover smoke proof.

Can remain out of first 90 days if explicitly hidden or marked non-production:

- KOC AI insights.
- Full delivery workflow if not part of first paid onboarding.
- Full vendor settlement/payment automation.
- Full graph-query/knowledge graph productization.
- Non-passport sponsor analytics beyond minimum portfolio/passport/request path.

## Part 9 - Executive Verdict

### What percentage is already implemented?

Approximately **65%** of the platform is implemented as code, schema, APIs, UI shells/components, packages, and tests. This number is high because the repository contains broad domain implementation across organizations, programs, discovery, evidence, lineage, passports, operations, marketplace, observability, and CI.

### What percentage is production-ready?

Approximately **30%** is production-ready enough to rely on without major qualification. The strongest production candidates are Organization/Membership, Evidence Core primitives, Sponsor Passport API/store, Discovery package internals, and Phase 8 read models after cutover. The percentage remains low because end-to-end workflows, mocks/stubs, production env safety, authorization proof, live integrations, and deployment evidence are incomplete.

### 10 Highest-Impact Engineering Tasks

1. Complete Phase 8 production cutover.
2. Implement discovery-to-evidence promotion.
3. Certify Organization/Membership/RLS authorization across production routes.
4. Eliminate production mock/test/legacy fallbacks through environment hardening.
5. Implement identity resolution.
6. Replace fake event/provenance/workflow side effects in onboarding, exchange, feasibility, and QC.
7. Production-configure external evidence connectors.
8. Replace sponsor placeholders with minimum API-backed sponsor workflow.
9. Add Institution -> Discovery -> Evidence -> Passport E2E coverage.
10. Normalize Trust/Confidence/Claim/Passport/Profile vocabulary in product-facing surfaces.

### What Should Not Be Touched Until Production

- Do not redesign the platform architecture or introduce a new source-of-truth model.
- Do not merge Evidence Graph, Provenance Graph, Knowledge Graph, and Graph Query into one generic graph.
- Do not rewrite Sponsor Passport if the current API/store contract can be production-certified.
- Do not replace Organization as the tenancy anchor.
- Do not build speculative AI insights, network intelligence, or analytics before the core onboarding workflow is production-proven.
- Do not expand delivery, settlement, or vendor automation beyond existing workflows until first institution onboarding is stable.
- Do not rename database tables broadly before vocabulary can be normalized at API/UI/docs boundaries.
- Do not remove legacy continuity paths until Phase 8/public-read parity is proven in production.

### CTO Priorities for the Next 90 Days

1. Make production safety non-negotiable: auth, RLS, env flags, CI, observability, backup/restore, and cutover gates first.
2. Finish the first paying institution path: Institution -> Discovery -> Evidence -> Published View -> Passport.
3. Protect the source-of-truth chain: Organization, Evidence Core, Phase 8 claims/lineage, Provenance, Published View.
4. Convert sponsor value into a minimum complete workflow: portfolio, passport, evidence reasoning, and request context without placeholders.
5. Remove or contain every mock/stub that can mislead production users or operators.
6. Normalize vocabulary at the boundaries customers and integrators see.
7. Keep delivery, AI, graph-query, and advanced vendor automation behind clear production scope boundaries until the core platform is stable.

## Final PCP-1 Decision

Kadarn should proceed to production consolidation, not redesign. The repository already contains the platform shape. The next phase must finish the current platform by closing production blockers, proving end-to-end workflows, eliminating mocks/stubs from production paths, and aligning vocabulary so that engineers, operators, sponsors, and institutions understand the same source-of-truth model.
