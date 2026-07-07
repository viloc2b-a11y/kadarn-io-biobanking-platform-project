# Platform Capability Audit — Sprint PD-1

**Task:** Complete Platform Audit  
**Mode:** Discovery only. No implementation or architecture redesign.  
**Repository:** `kadarn-platform`  
**Audit basis:** current repository files only. Tests were inventoried, not executed. The working tree was already dirty when this audit began, so commit history is not used as proof.

## Scope and Evidence Method

Scanned `apps/`, `packages/`, `database/`, `supabase/`, `tests/`, `docs/`, `openspec/`, `infra/`, and `scripts/`, excluding generated/cache artifacts such as `node_modules`, `.next`, Playwright reports, and test results.

Repository inventory found:

- **30** workspace packages under `packages/`
- **119** API route files under `apps/api/src/app/api`
- **64** web pages under `apps/web/src/app`
- **111** unique database entities across `database/migrations` and `supabase/migrations`
- **209** docs/spec files under root docs/OpenSpec sources

Status labels:

- **Complete** — code, API/UI/DB/tests/docs are present for the implemented scope.
- **Partial** — substantial implementation exists, but runtime completeness or one layer is missing/unverified.
- **Stub** — placeholder, mock, or shell-heavy implementation dominates.
- **Planned** — docs/specs only or no implementation found.

Confidence reflects repository evidence strength, **not** production readiness.

## Capability Inventory

### Authentication and Session Context

- **Domain:** Identity
- **Purpose:** Authenticate users, expose current user context, support session providers, and bootstrap active organization context.
- **Current implementation status:** Partial
- **Confidence:** Medium
- **Main packages/modules:** `@kadarn/auth`, `@kadarn/types`, `apps/api/src/lib/auth-guards.ts`, `apps/web/src/components/providers/session-provider.tsx`
- **APIs:** `/me`, `/v1/workspace/active-org`
- **UI:** `/login`
- **Events:** None found
- **Database entities:** `user_profiles`, `identity_providers`, `external_identity_links`
- **Dependencies:** Supabase Auth, `@supabase/supabase-js`, `@supabase/ssr`
- **Consumers:** API auth guards, workspace shell, sponsor shell, KOC shell, web session provider
- **Tests:** `tests/integration/identity-bootstrap.test.ts`, `tests/security/identity.test.ts`, `tests/integration/seed-auth-local.test.ts`
- **Documentation references:** `README.md`, `ARCHITECTURE.md`, `docs/adr/adr-002-multi-tenant-architecture.md`
- **Missing pieces:** Login/session exists, but full account lifecycle and recovery are not evidenced in this audit.

### Organization and Membership Model

- **Domain:** Institution
- **Purpose:** Represent organizations, organization roles, memberships, and capability assignments for multi-tenant operation.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/auth`, `@kadarn/policy-engine`, `apps/api/src/app/api/organizations/*`, `apps/api/src/app/api/v1/organizations/*`
- **APIs:** `/organizations`, `/organizations/:id`, `/organizations/:id/capabilities`, `/organizations/:id/invite`, `/v1/organizations/:id/capabilities`
- **UI:** `/marketplace/organizations`, `/workspace/profile`
- **Events:** `OrganizationCreated`
- **Database entities:** `organizations`, `organization_memberships`, `organization_roles`, `organization_capabilities`, `organization_capability_types`, `organization_trust`, `membership_roles`
- **Dependencies:** PostgreSQL RLS, Supabase, policy shadow wrappers
- **Consumers:** workspace APIs, marketplace APIs, sponsor passport mapping, access-control tests
- **Tests:** `tests/integration/multi-tenant.test.ts`, `tests/api/access-context.test.ts`, `tests/security/authorization.test.ts`
- **Documentation references:** `docs/adr/adr-002-multi-tenant-architecture.md`, `ARCHITECTURE.md`, `docs/architecture/current-state-vs-reference-model.md`
- **Missing pieces:** API/DB coverage exists; current runtime behavior was not tested during this audit.

### Institution Public Profile / Site Passport

- **Domain:** Institution
- **Purpose:** Expose public institution/site profile surfaces by slug and connect public views to published/discovery data.
- **Current implementation status:** Partial
- **Confidence:** Medium
- **Main packages/modules:** `@kadarn/published-view`, `@kadarn/evidence-discovery`, `apps/api/src/app/api/v1/institution/*`
- **APIs:** `/v1/institution/profile`, `/v1/institution/public/:slug`
- **UI:** `/site-passport/:slug`
- **Events:** None found
- **Database entities:** `site_continuity_profiles`, `phase8_published_views`, `organizations`
- **Dependencies:** published-view, evidence-discovery, rate-limit wrappers
- **Consumers:** public profile UI, sponsor discovery/passport consumers
- **Tests:** `tests/phase8/legacy-equivalence/institution.equivalence.test.ts`
- **Documentation references:** `docs/ux/site-experience.md`, `docs/kux/workspaces/public/README.md`, `openspec/phase-8-passport-public-read-decision.md`
- **Missing pieces:** Route and UI exist, but public-read/runtime parity was not executed here.

### Program Management

- **Domain:** Portfolio
- **Purpose:** Manage programs, participants, milestones, activity, exchange linkage, and KPE views.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/kpe-generator`, `@kadarn/domain-events`, `apps/api/src/app/api/programs/*`, `apps/api/src/app/api/v1/programs/*`
- **APIs:** `/programs`, `/programs/:id`, `/programs/:id/milestones`, `/v1/programs/:id/activity`, `/v1/programs/:id/exchange`, `/v1/programs/:id/kpe`, `/v1/programs/:id/milestones`, `/v1/programs/:id/participants`, `/v1/workspace/programs`
- **UI:** `/workspace/programs`, `/workspace/programs/:id`, `/workspace/programs/:id/kpe`, `/koc/programs`, `/report/kpe/:id`
- **Events:** None found
- **Database entities:** `programs`, `program_milestones`, `program_participants`, `program_activity_log`, `program_requirements`, `program_access_policies`
- **Dependencies:** Supabase, KPE generator
- **Consumers:** workspace, KOC, reports, exchange APIs
- **Tests:** `tests/api/programs.test.ts`
- **Documentation references:** `docs/architecture/kadarn-platform-blueprint.md`, `docs/architecture/KPE-INTEGRATION-REVIEW.md`, `openspec/engine-wiring-report-25c.md`
- **Missing pieces:** APIs/DB/tests exist; workflow execution was not verified.

### Collection and Specimen Inventory

- **Domain:** Portfolio
- **Purpose:** Track collections, specimens, samples, storage, supply items, and marketplace specimen discovery.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/operational-twins`, `@kadarn/fulfillment-engine`, collection/specimen/workspace route handlers
- **APIs:** `/v1/collections`, `/v1/specimens`, `/v1/marketplace/specimens`, `/v1/marketplace/supply-items`, `/v1/workspace/collections`, `/v1/workspace/inventory`
- **UI:** `/workspace/collections`, `/workspace/inventory`, `/marketplace/collections`
- **Events:** None found
- **Database entities:** `collection_twins`, `specimen_twins`, `processing_samples`, `storage_locations`, `supply_items`, `sample_movements`
- **Dependencies:** PostgreSQL/Supabase, operational twins
- **Consumers:** marketplace, workspace, logistics, processing
- **Tests:** `tests/integration/sample-lifecycle.test.ts`, `tests/api/processing.test.ts`, `tests/twins/operational-twins.test.ts`
- **Documentation references:** `docs/adr/adr-003-processing-engine-philosophy.md`, `docs/architecture/krm-bno-profile.md`
- **Missing pieces:** Core persistence and routes exist; full lifecycle runtime was not executed.

### Processing and Quality Control

- **Domain:** Portfolio
- **Purpose:** Model processing workflows, workflow steps, aliquots, and QC results.
- **Current implementation status:** Partial
- **Confidence:** Medium
- **Main packages/modules:** `apps/api/src/app/api/v1/processing/aliquots/[id]/qc/route.ts`, workspace processing/QC routes
- **APIs:** `/v1/processing/aliquots/:id/qc`, `/v1/workspace/processing`, `/v1/workspace/qc`
- **UI:** `/workspace/processing`, `/workspace/qc`
- **Events:** None found
- **Database entities:** `processing_workflows`, `processing_workflow_steps`, `processing_samples`, `processing_aliquots`, `quality_control_results`
- **Dependencies:** Supabase, provenance recorder placeholder in QC route
- **Consumers:** workspace, operations, sample lifecycle
- **Tests:** `tests/api/processing.test.ts`, `tests/integration/qc-route.test.ts`
- **Documentation references:** `docs/adr/adr-003-processing-engine-philosophy.md`
- **Missing pieces:** QC route contains an explicit provenance recording stub comment.

### Evidence Core Domain Model

- **Domain:** Evidence
- **Purpose:** Create and validate claims, evidence nodes, counter-evidence, right of response, relationships, visibility, temporal metadata, audit, lifecycle, repository, API contracts, graph traversal, evaluation, and connectors.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/evidence-core`
- **APIs:** `/v1/evidence-core/claims`, `/v1/evidence-core/evidence`, `/v1/evidence-core/counter-evidence`, `/v1/evidence-core/responses`, `/v1/evidence-core/relationships`, `/v1/evidence-core/process-state`, `/v1/evidence-core/identity/resolve`
- **UI:** None found as a direct evidence-core UI
- **Events:** None found as explicit event strings
- **Database entities:** `claims`, `evidence_nodes`, `evidence_relationships`, `evidence_class`, `right_of_response`, `confidence_state_snapshots`
- **Dependencies:** zod, PostgreSQL/Supabase, connector framework
- **Consumers:** sponsor passport store, published views, evidence lineage, discovery
- **Tests:** `packages/evidence-core/tests/*`, `tests/integration/evidence-core-idor.test.ts`
- **Documentation references:** `docs/adr/adr-011-evidence-core-boundary.md`, `docs/kems/KEMS-002_Trustworthy_Evidence_Architecture_v1.1.md`, `openspec/phase-8-evidence-evolution-architecture.md`
- **Missing pieces:** Broad implementation exists; current tests and DB runtime were not executed.

### External Evidence Connectors

- **Domain:** Evidence
- **Purpose:** Ingest and normalize external evidence from ClinicalTrials.gov, PubMed, FDA, Crossref, OpenAlex, ORCID, and ROR.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/evidence-core/src/connectors/*`, `@kadarn/evidence-discovery/src/connectors/*`
- **APIs:** None found as direct public connector endpoints
- **UI:** None found
- **Events:** None found
- **Database entities:** `evidence_sources`, `evidence_source_versions`, `evidence_extraction_runs`, `evidence_extracted_facts`, `external_identity_links`
- **Dependencies:** ClinicalTrials.gov, PubMed, FDA, Crossref, OpenAlex, ORCID, ROR, connector framework
- **Consumers:** evidence ingestion, discovery orchestrator, identity resolution
- **Tests:** `packages/evidence-core/tests/connectors/*`, `packages/evidence-discovery/tests/connector-layer.test.ts`
- **Documentation references:** `docs/domain/integration-reference.md`, `docs/kems/KEMS-006_Systems_Integration_Standard_v1.0.md`
- **Missing pieces:** Live external integrations were not exercised.

### Claim Lifecycle and Review

- **Domain:** Claim
- **Purpose:** Manage claim creation, submission, verification, rejection, promotion, evidence attachments, references, and bounded claim review.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/evidence-core`, `@kadarn/evidence-lineage`, `apps/api/src/lib/continuity-claim-service.ts`
- **APIs:** `/v1/continuity/claims`, `/v1/continuity/claims/:id`, `/v1/continuity/claims/:id/evidence`, `/v1/continuity/claims/:id/references`, `/v1/continuity/claims/:id/submit`, `/v1/continuity/claims/:id/verify`, `/v1/continuity/claims/:id/reject`, `/v1/continuity/claims/:id/promote`, `/v1/evidence-core/claims`
- **UI:** `/workspace/continuity`, `/sponsor/passports/:institutionId`
- **Events:** `evidence_submitted`
- **Database entities:** `claims`, `continuity_experience_claims`, `continuity_evidence_items`, `continuity_evidence_links`, `continuity_references`, `phase8_claim_candidates`, `phase8_claim_instances`, `phase8_claim_versions`
- **Dependencies:** continuity claim service, evidence core, lineage engines
- **Consumers:** continuity passport, sponsor passport, published views
- **Tests:** `tests/events/continuity-verification.test.ts`, `tests/api/sponsor-passport-claims.test.ts`, `packages/evidence-lineage/tests/claim-pipeline.test.ts`
- **Documentation references:** `docs/domain/claim-taxonomy-v1.0.md`, `docs/kems/KEMS-004_Claim_Provenance_Architecture_v1.0.md`, `openspec/drafts/adrs/adr-028-claim-immutability.md`
- **Missing pieces:** Workflow exists; runtime execution not verified in this audit.

### Evidence Lineage and Provenance Reconstruction

- **Domain:** Provenance
- **Purpose:** Track sources, source versions, artifacts, extraction runs, facts, claim provenance, reconstruction, hybrid indexing, and evidence packs.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/evidence-lineage`, `@kadarn/provenance`, `@kadarn/provenance-graph`, `apps/api/src/lib/provenance-recorder.ts`
- **APIs:** `/v1/evidence-lineage/claims/:id/provenance`, `/v1/sponsor/passports/:institutionId/claims/:claimId/provenance`, `/v1/operations/provenance`, `/v1/discovery/provenance`
- **UI:** `/koc/provenance`, sponsor passport provenance panels
- **Events:** None found as explicit event strings
- **Database entities:** `provenance_nodes`, `provenance_edges`, `provenance_evidence`, `evidence_artifacts`, `evidence_extraction_runs`, `evidence_extracted_facts`, `phase8_materialized_edges`
- **Dependencies:** PROV mapping, hybrid indexing, published-view engine
- **Consumers:** sponsor passport, KOC provenance, published evidence pack route
- **Tests:** `tests/provenance/*`, `packages/evidence-lineage/tests/*`, `tests/api/sponsor-passport-provenance.test.ts`
- **Documentation references:** `docs/adr/adr-014-provenance-graph.md`, `docs/domain/provenance-graph.md`, `docs/kems/KEMS-004_Claim_Provenance_Architecture_v1.0.md`
- **Missing pieces:** Implemented route/package/test surface exists; current runtime not revalidated.

### Append-only Audit and Compliance Events

- **Domain:** Provenance
- **Purpose:** Record audit events, compliance state, append-only provenance protections, and operational audit surfaces.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `apps/api/src/lib/audit.ts`, `@kadarn/evidence-core/src/audit.ts`, `@kadarn/delivery-domain/src/audit/*`
- **APIs:** `/audit-events`, `/v1/operations/compliance`
- **UI:** `/koc/compliance`
- **Events:** Audit entries; no single global event string catalog found for audit events
- **Database entities:** `audit_events`, `policy_evaluations`, provenance append-only tables/triggers
- **Dependencies:** PostgreSQL triggers, RLS, audit service
- **Consumers:** security tests, compliance page, delivery audit trail
- **Tests:** `tests/integration/audit-coverage.test.ts`, `tests/provenance/provenance-append-only.test.ts`, `tests/provenance/provenance-append-only-triggers.pgtest.sql`, `tests/security/audit.test.ts`
- **Documentation references:** `docs/audit/KADARN_CLAUDE_CODE_INTEGRITY_REPORT.md`, `openspec/architecture-validation-audit.md`
- **Missing pieces:** Trigger behavior was not executed here.

### Continuity Passport

- **Domain:** Continuity
- **Purpose:** Provide continuity profiles, passport, timeline, score, opportunities, recommendations, admin queue, and continuity claim workflow.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `apps/api/src/lib/continuity-claim-service.ts`, `apps/api/src/app/api/v1/continuity/*`
- **APIs:** `/v1/continuity/admin/queue`, `/v1/continuity/claims/*`, `/v1/continuity/opportunities/match`, `/v1/continuity/passport/:slug`, `/v1/continuity/passport/:slug/opportunities`, `/v1/continuity/passport/:slug/recommendations`, `/v1/continuity/passport/:slug/score`, `/v1/continuity/passport/:slug/timeline`
- **UI:** `/workspace/continuity`
- **Events:** None found
- **Database entities:** `site_continuity_profiles`, `continuity_capabilities`, `continuity_evidence_items`, `continuity_evidence_links`, `continuity_experience_claims`, `continuity_experience_ledger`, `continuity_performance_metrics`, `continuity_references`, `continuity_relationships`, `continuity_timeline_events`
- **Dependencies:** continuity service, evidence core, rate limiting
- **Consumers:** workspace continuity UI, sponsor/institution views
- **Tests:** `tests/events/continuity-verification.test.ts`
- **Documentation references:** `docs/kux/workspaces/sponsor/kux-008-institutional-passport.md`, `openspec/phase-8-passport-public-read-decision.md`
- **Missing pieces:** API and DB exist; full UX path and data lifecycle were not executed.

### Confidence Evaluation and Trust State

- **Domain:** Confidence
- **Purpose:** Represent and evaluate confidence state, trust events, trust challenges, explanation outputs, and score projections.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/evidence-core`, `@kadarn/evidence-lineage`, `@kadarn/trust-engine`
- **APIs:** `/v1/continuity/passport/:slug/score`, sponsor passport confidence fields via `/v1/sponsor/passports/*`
- **UI:** sponsor passport detail/reasoning panels
- **Events:** None found
- **Database entities:** `confidence_state_snapshots`, `trust_events`, `trust_challenges`, `organization_trust`
- **Dependencies:** evidence evaluation policy, trust-engine service
- **Consumers:** sponsor passport, continuity score, published evidence packs
- **Tests:** `packages/evidence-core/tests/evaluation.test.ts`, `packages/evidence-core/tests/explainability.test.ts`, `tests/trust/trust-engine.test.ts`
- **Documentation references:** `docs/kems/KEMS-001_Confidence_Graph_Model_v1.0.md`, `openspec/drafts/adrs/adr-029-confidence-derived.md`
- **Missing pieces:** Evidence-core index marks confidence state as type-only in one layer; runtime scoring was not executed.

### Published Views and Evidence Packs

- **Domain:** Publication
- **Purpose:** Build stable public/authorized views and evidence packs from claims, lineage, and discovery outputs.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/published-view`, `@kadarn/evidence-lineage`
- **APIs:** `/v1/published-views/:claimId/evidence-pack`
- **UI:** `/site-passport/:slug`, sponsor passport evidence/provenance panels
- **Events:** None found as explicit event strings
- **Database entities:** `phase8_published_views`
- **Dependencies:** evidence-lineage, evidence-discovery, `@kadarn/types`
- **Consumers:** public institution profile, sponsor passport, evidence pack route
- **Tests:** `packages/published-view/tests/*`, `tests/phase8/legacy-equivalence/*`
- **Documentation references:** `openspec/phase-8-evidence-evolution-architecture.md`, `openspec/phase-8-legacy-equivalence-gate.md`, `openspec/drafts/adrs/adr-030-published-view-boundary.md`, `openspec/drafts/adrs/adr-031-evidence-pack-contract.md`
- **Missing pieces:** Package/route/tests exist; production distribution is separate.

### Evidence Delivery Domain

- **Domain:** Publication
- **Purpose:** Model delivery artifacts, channels, recipients, policies, templates, receipts, subscriptions, rendering, distribution, retries, dead-letter queue, audit, and integrations.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/delivery-domain`, `apps/web/src/components/delivery/*`
- **APIs:** None found as persistent delivery API endpoints
- **UI:** `/workspace/delivery`
- **Events:** `delivery.artifact.created`, `delivery.artifact.delivered`, `delivery.failed`, `delivery.artifact.lifecycle.delivered`
- **Database entities:** None found for delivery-domain persistence tables
- **Dependencies:** zod, channel adapters for API/dashboard/download/email/REST/webhook
- **Consumers:** workspace delivery UI, future publication/distribution surfaces
- **Tests:** `packages/delivery-domain/tests/*`, `apps/web/e2e/delivery-workspace.spec.ts`
- **Documentation references:** `docs/kems/KEMS-007_Evidence_Delivery_Architecture_v0.1.md`, `openspec/phase-9-evidence-delivery-architecture.md`
- **Missing pieces:** Domain is substantial, but workspace UI imports mock data and no delivery API persistence layer was found.

### Authorization, RLS, Policy Engine, OPA Shadow

- **Domain:** Permission
- **Purpose:** Enforce roles, organization membership, visibility, policy evaluation, and OPA shadow-mode decisions.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/policy-engine`, `@kadarn/auth`, `apps/api/src/lib/auth-guards.ts`, `apps/api/src/lib/rate-limit.ts`
- **APIs:** Most protected API routes via wrappers; `/v1/koc/policy`; `/v1/operations/compliance`
- **UI:** `/koc/policy`, delivery policy tester component
- **Events:** None found
- **Database entities:** `policies`, `policy_evaluations`, `organization_roles`, `membership_roles`, `program_access_policies`, `regulatory_document_access`
- **Dependencies:** PostgreSQL RLS, OPA local/shadow client, auth guards
- **Consumers:** most API routes, workspace, KOC, delivery policies
- **Tests:** `tests/policy/*`, `tests/security/authorization.test.ts`, `tests/integration/rls-coverage-045-049.test.ts`
- **Documentation references:** `docs/adr/adr-010-policy-engine.md`, `docs/domain/policy-catalog.md`, `docs/architecture/kaa/KAA-001-policy-engine.md`
- **Missing pieces:** OPA appears implemented as local/shadow mode; current enforcement tests were not run.

### Discovery Engine and Dashboard

- **Domain:** Discovery
- **Purpose:** Orchestrate discovery sessions/runs/artifacts/candidates, capability detection, claim candidates, curation, validation notes, dashboard, reports, provenance, and productized discovery UX.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/evidence-discovery`, `@kadarn/document-intake`, `apps/web/src/components/discovery/*`
- **APIs:** `/discovery`, `/v1/discovery/session`, `/v1/discovery/dashboard`, `/v1/discovery/pipeline-status`, `/v1/discovery/report`, `/v1/discovery/provenance`, `/v1/discovery/curation`, `/v1/discovery/validation-notes`
- **UI:** `/workspace/discovery`, `/koc/discovery`, discovery dashboard/components
- **Events:** Discovery transition events in DB; no global event string found
- **Database entities:** `discovery_sessions`, `discovery_runs`, `discovery_artifacts`, `discovery_candidate_artifacts`, `discovery_candidates`, `discovery_transition_events`, `discovery_agent_outputs`, `discovery_curation_events`, `discovery_validation_notes`, `discovery_preparation_requests`, `discovery_layer1`
- **Dependencies:** document-intake, connector registry, agent framework, published-view adapter
- **Consumers:** workspace discovery UI, KOC discovery, sponsor readiness, published view
- **Tests:** `packages/evidence-discovery/tests/*`, `tests/api/discovery.test.ts`, `tests/web/discovery-*.test.ts`, `tests/phase8/legacy-equivalence/discovery-*.test.ts`
- **Documentation references:** `docs/engineering/DISCOVERY-INTERACTION-DASHBOARD-REPORT.md`, `openspec/pdf-1.0/pdf-1.2-capability-matrix.md`, `openspec/phase-8-migration-parity.md`
- **Missing pieces:** Large implementation footprint exists; live external discovery execution was not run.

### Document Intake Pipeline

- **Domain:** Discovery
- **Purpose:** Ingest documents through connectors/providers, classify, extract, segment, track provenance, and run pipeline/gateway contracts.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/document-intake`
- **APIs:** None found as standalone route handlers
- **UI:** Discovery components display document inventory/output
- **Events:** None found
- **Database entities:** `discovery_artifacts`, `discovery_candidate_artifacts`, `evidence_extraction_runs`
- **Dependencies:** MarkItDown adapter, connector interfaces
- **Consumers:** evidence-discovery, discovery reports
- **Tests:** `packages/document-intake/tests/*`
- **Documentation references:** discovery docs/OpenSpec references listed above
- **Missing pieces:** Package is implemented and tested; direct API exposure was not found.

### Marketplace Search and Requests

- **Domain:** Discovery
- **Purpose:** Expose marketplace discovery/search of organizations, capabilities, services, specimens, network, requests, access requests, and feasibility requests.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** marketplace API routes, marketplace web pages/components, `@kadarn/matching-engine`
- **APIs:** `/v1/marketplace/capabilities`, `/v1/marketplace/feasibility`, `/v1/marketplace/network`, `/v1/marketplace/organizations`, `/v1/marketplace/requests`, `/v1/marketplace/search`, `/v1/marketplace/services`, `/v1/marketplace/specimens`, `/v1/marketplace/supply-items`
- **UI:** `/marketplace`, `/marketplace/search`, `/marketplace/organizations`, `/marketplace/services`, `/marketplace/collections`, `/marketplace/requests`, `/marketplace/requests/access`, `/marketplace/requests/feasibility`
- **Events:** None found
- **Database entities:** `exchange_requests`, `organization_capabilities`, `supply_items`, `specimen_twins`, `feasibility_assessments`, `feasibility_scores`
- **Dependencies:** matching-engine, Supabase, exchange workflows
- **Consumers:** sponsor opportunity discovery, workspace requests, marketplace users
- **Tests:** `tests/matching/matching-engine.test.ts`, `tests/api/feasibility.test.ts`, `tests/api/exchange.test.ts`
- **Documentation references:** `docs/ux/sponsor-experience.md`, `openspec/phase-5-sponsor-interaction-guide.md`
- **Missing pieces:** Some marketplace pages are form/demo-like; end-to-end workflow not executed.

### Sponsor Workspace Shell

- **Domain:** Sponsor
- **Purpose:** Provide sponsor routes and navigation for feasibility, opportunities, portfolio, passports, risk, and notifications.
- **Current implementation status:** Stub
- **Confidence:** High
- **Main packages/modules:** `apps/web/src/components/sponsor/*`, sponsor app routes
- **APIs:** `/v1/sponsor/search`, `/v1/sponsor/passports/*`
- **UI:** `/sponsor`, `/sponsor/feasibility`, `/sponsor/opportunities`, `/sponsor/portfolio`, `/sponsor/risk`, `/sponsor/notifications`, `/sponsor/passports`, `/sponsor/passports/:institutionId`
- **Events:** None found
- **Database entities:** `sponsor_portfolios`, `sponsor_portfolio_memberships`
- **Dependencies:** SponsorShell, SponsorPlaceholder, sponsor passport components
- **Consumers:** sponsor users
- **Tests:** sponsor passport API tests
- **Documentation references:** `docs/ux/sponsor-experience.md`, `docs/kux/workspaces/sponsor/*`, `openspec/sponsor-platform-architecture-v1.0.md`
- **Missing pieces:** Most sponsor pages import `SponsorPlaceholder`; sponsor passport is the substantive implemented slice.

### Sponsor Passport

- **Domain:** Sponsor
- **Purpose:** Expose sponsor-facing institution passport list/detail, identity, capabilities, claims, history, recommendations, provenance, and stability mapping.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `apps/api/src/lib/sponsor-passport/*`, `apps/web/src/components/sponsor/passport/*`, `@kadarn/evidence-core`
- **APIs:** `/v1/sponsor/passports`, `/v1/sponsor/passports/:institutionId`, `/v1/sponsor/passports/:institutionId/claims/:claimId/provenance`
- **UI:** `/sponsor/passports`, `/sponsor/passports/:institutionId`
- **Events:** None found
- **Database entities:** `sponsor_portfolios`, `sponsor_portfolio_memberships`, `phase8_claim_instances`, `phase8_claim_versions`, `evidence_nodes`, `confidence_state_snapshots`, `provenance_nodes`, `provenance_edges`
- **Dependencies:** evidence-core passport store, portfolio repository, rate limiting, mock fallback for E2E
- **Consumers:** sponsor passport UI, portfolio intelligence
- **Tests:** `tests/api/sponsor-passport-claims.test.ts`, `tests/api/sponsor-passport-history.test.ts`, `tests/api/sponsor-passport-identity-capabilities.test.ts`, `tests/api/sponsor-passport-portfolio.test.ts`, `tests/api/sponsor-passport-provenance.test.ts`, `tests/api/sponsor-passport-recommendations.test.ts`, `tests/api/sponsor-passport-store.test.ts`, `tests/api/sponsor-passport-stability-*.test.ts`
- **Documentation references:** `docs/kux/workspaces/sponsor/kux-008-institutional-passport.md`, `openspec/sponsor-passport-api-contract.md`, `openspec/rc-12.1-design-specification.md`
- **Missing pieces:** API/store/tests are substantial; UI contains E2E mock fallback and runtime was not revalidated here.

### Sponsor Portfolio

- **Domain:** Sponsor
- **Purpose:** Persist sponsor portfolios and portfolio memberships that constrain passport visibility/listing.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `apps/api/src/lib/sponsor-passport/portfolio/*`, `database/migrations/051_sponsor_portfolio.sql`, `supabase/migrations/059_sponsor_portfolio.sql`
- **APIs:** `/v1/sponsor/passports` consumes portfolio membership for listing
- **UI:** `/sponsor/portfolio` [stub]
- **Events:** None found
- **Database entities:** `sponsor_portfolios`, `sponsor_portfolio_memberships`
- **Dependencies:** Supabase, portfolio mapper/repository
- **Consumers:** sponsor passport list/detail
- **Tests:** `tests/api/sponsor-passport-portfolio.test.ts`, `tests/api/sponsor-passport-portfolio-fixtures.ts`
- **Documentation references:** `docs/kux/workspaces/sponsor/kux-007-portfolio-intelligence.md`, `openspec/rc-12.2-design-specification.md`
- **Missing pieces:** Persistence/repository exist; sponsor portfolio page is placeholder.

### Vendor / Logistics Operations

- **Domain:** Vendor
- **Purpose:** Track shipments, carriers, containers, customs docs, telemetry, logistics workspace, KOC logistics, SLA, and operational exceptions.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/fulfillment-engine`, `apps/api/src/lib/logistics-helper.ts`, shipment/logistics/operations route handlers
- **APIs:** `/v1/shipments`, `/v1/shipments/:id`, `/v1/workspace/logistics`, `/v1/koc/logistics`, `/v1/operations/sla`, `/v1/operations/exceptions`, `/v1/operations/exceptions/:id`
- **UI:** `/workspace/logistics`, `/koc/logistics`, `/koc/exceptions`
- **Events:** None found
- **Database entities:** `logistics_shipments`, `logistics_shipment_items`, `logistics_carriers`, `logistics_containers`, `logistics_customs_docs`, `logistics_telemetry`, `shipment_twins`
- **Dependencies:** fulfillment-engine, Supabase
- **Consumers:** workspace logistics, KOC operations, marketplace fulfillment flows
- **Tests:** `tests/api/logistics.test.ts`, `tests/fulfillment/fulfillment-engine.test.ts`
- **Documentation references:** `docs/architecture/kadarn-platform-blueprint.md`, `openspec/engine-wiring-report-25c.md`
- **Missing pieces:** External courier/vendor integrations were not evidenced as complete.

### Financial Settlements and Payments

- **Domain:** Vendor
- **Purpose:** Calculate financial settlements/fees and expose workspace payments/settlements.
- **Current implementation status:** Partial
- **Confidence:** Medium
- **Main packages/modules:** `@kadarn/financial-engine`, financial API routes
- **APIs:** `/v1/financial/settlements`, `/v1/financial/settlements/:id`, `/v1/workspace/payments`
- **UI:** `/workspace/payments`
- **Events:** None found
- **Database entities:** `exchange_escrow`
- **Dependencies:** financial adapter interface
- **Consumers:** workspace payments, exchange/marketplace flows
- **Tests:** `tests/financial/financial-engine.test.ts`, `tests/integration/financial-engine.test.ts`
- **Documentation references:** `docs/architecture/kadarn-platform-blueprint.md`
- **Missing pieces:** Package is minimal and no package-local tests were found; persistence model appears limited.

### Exchange Deals and Requests

- **Domain:** Vendor
- **Purpose:** Support exchange deals, messages, escrow, marketplace requests, program exchange, and request lifecycle.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/workflow-engine`, `@kadarn/financial-engine`, exchange/marketplace routes
- **APIs:** `/exchange`, `/v1/exchange/deals`, `/v1/exchange/deals/:id`, `/v1/programs/:id/exchange`, `/v1/marketplace/requests`, `/v1/workspace/requests`
- **UI:** `/workspace/exchange`, `/workspace/requests`, `/marketplace/requests`
- **Events:** None found
- **Database entities:** `exchange_requests`, `exchange_deals`, `exchange_messages`, `exchange_escrow`
- **Dependencies:** workflow-engine, financial-engine, Supabase
- **Consumers:** marketplace, programs, payments, KOC workflow
- **Tests:** `tests/api/exchange.test.ts`, `tests/workflow/workflow-engine.test.ts`
- **Documentation references:** `docs/architecture/kadarn-platform-blueprint.md`, `docs/architecture/workflows/WORKFLOW-CANDIDATES.md`
- **Missing pieces:** End-to-end negotiation/exchange execution was not verified.

### API Surface and OpenAPI Docs

- **Domain:** API
- **Purpose:** Expose Next.js route handlers, versioned REST API, OpenAPI YAML/docs, SDK, and CLI entrypoints.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `apps/api`, `@kadarn/sdk`, `@kadarn/cli`, `@kadarn/types`
- **APIs:** 119 route files under `apps/api/src/app/api`, `/api/docs`, `/api/docs/openapi.yaml`, `apps/api/openapi.yaml`, `apps/api/openapi-v1.yaml`
- **UI:** None found
- **Events:** Request instrumentation events via instrumentation/telemetry packages
- **Database entities:** None directly; API routes consume domain entities
- **Dependencies:** Next.js App Router, OpenAPI YAML, SDK types
- **Consumers:** web app, CLI, external API consumers
- **Tests:** `tests/api/*.test.ts`, `tests/performance/api-benchmarks.test.ts`
- **Documentation references:** `openspec/af-4.0-api-governance.md`, `openspec/sponsor-passport-api-contract.md`, `docs/domain/integration-reference.md`
- **Missing pieces:** OpenAPI parity against all route handlers was not verified.

### Workspace Experience

- **Domain:** API
- **Purpose:** Provide authenticated workspace shell and overview/profile/navigation/resources across collections, consent, docs, inventory, logistics, payments, processing, programs, QC, regulatory, and requests.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `apps/web/src/components/workspace/workspace-shell.tsx`, `apps/api/src/app/api/v1/workspace/*`
- **APIs:** `/v1/workspace/active-org`, `/v1/workspace/applications`, `/v1/workspace/collections`, `/v1/workspace/consent`, `/v1/workspace/documents`, `/v1/workspace/inventory`, `/v1/workspace/logistics`, `/v1/workspace/navigation`, `/v1/workspace/overview`, `/v1/workspace/payments`, `/v1/workspace/processing`, `/v1/workspace/profile`, `/v1/workspace/programs`, `/v1/workspace/qc`, `/v1/workspace/regulatory`, `/v1/workspace/requests`
- **UI:** `/workspace`, `/workspace/analytics`, `/workspace/collections`, `/workspace/consent`, `/workspace/continuity`, `/workspace/delivery`, `/workspace/discovery`, `/workspace/documents`, `/workspace/exchange`, `/workspace/inventory`, `/workspace/logistics`, `/workspace/payments`, `/workspace/processing`, `/workspace/profile`, `/workspace/programs`, `/workspace/qc`, `/workspace/regulatory`, `/workspace/requests`
- **Events:** None found
- **Database entities:** organization, program, regulatory, processing, logistics, request, and inventory entities
- **Dependencies:** session-provider, workspace API routes, Supabase
- **Consumers:** institution/site users
- **Tests:** `apps/web/e2e/delivery-workspace.spec.ts`, `tests/web/web-architecture-qa.test.ts`
- **Documentation references:** `docs/kux/architecture/kux-004-workspace-shell.md`, `docs/kux/architecture/kux-005-navigation-framework.md`
- **Missing pieces:** Many routes/pages exist; some surfaces are shell/demo-like and were not runtime tested.

### KOC Operations Console

- **Domain:** API
- **Purpose:** Provide Kadarn Operations Console pages/APIs for analytics, ecosystem, events, knowledge, logistics, platform health, policy, twins, workflow, capacity, compliance, exceptions, KPE, provenance, and phase8 cutover.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `apps/web/src/components/koc/*`, `apps/api/src/app/api/v1/koc/*`, `apps/api/src/app/api/v1/operations/*`
- **APIs:** `/v1/koc/analytics`, `/v1/koc/ecosystem`, `/v1/koc/events`, `/v1/koc/knowledge`, `/v1/koc/logistics`, `/v1/koc/platform-health`, `/v1/koc/policy`, `/v1/koc/twins`, `/v1/koc/twins/health`, `/v1/koc/workflow`, `/v1/operations/capacity`, `/v1/operations/compliance`, `/v1/operations/exceptions`, `/v1/operations/health`, `/v1/operations/kpe`, `/v1/operations/kpe/generate`, `/v1/operations/phase8-cutover`, `/v1/operations/provenance`, `/v1/operations/sla`
- **UI:** `/koc`, `/koc/activity`, `/koc/ai`, `/koc/analytics`, `/koc/capacity`, `/koc/command`, `/koc/compliance`, `/koc/discovery`, `/koc/ecosystem`, `/koc/events`, `/koc/exceptions`, `/koc/health`, `/koc/knowledge`, `/koc/kpe`, `/koc/logistics`, `/koc/network`, `/koc/notifications`, `/koc/phase8-cutover`, `/koc/platform-health`, `/koc/policy`, `/koc/programs`, `/koc/provenance`, `/koc/twins`, `/koc/workflow`
- **Events:** domain event store/outbox consumed by KOC events/feed routes
- **Database entities:** `analytics_network_snapshots`, `domain_event_store`, `domain_event_outbox`, `workflow_instances`, `workflow_tasks`, `twin_events`
- **Dependencies:** dashboard engines, event runtime, phase8 cutover status, telemetry
- **Consumers:** Kadarn internal operators
- **Tests:** `tests/phase8/staging-cutover-smoke.ts`, `tests/twins/operational-twins.test.ts`
- **Documentation references:** `openspec/phase-8-cutover-runbook.md`, `openspec/af-4.0-production-operations.md`, `docs/ux/koc-experience.md`
- **Missing pieces:** One KOC AI page is stub; runtime freshness was not verified.

### Domain Event Runtime

- **Domain:** Infrastructure
- **Purpose:** Define domain event contracts/runtime, outbox/store migrations, in-memory event bus, and platform event types.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/domain-events`, `@kadarn/platform-services`, `@kadarn/types/src/events/platform-events.ts`, `apps/api/src/lib/event-runtime.ts`
- **APIs:** KOC events/feed consume event state; no dedicated event-management API found
- **UI:** `/koc/events`
- **Events:** `OrganizationCreated`, `evidence_submitted`, `delivery.artifact.created`, `delivery.artifact.delivered`, `delivery.failed`, `RequestCompleted`, `HealthCheckFailed`
- **Database entities:** `domain_event_outbox`, `domain_event_store`
- **Dependencies:** InMemoryEventBus, PostgreSQL event store/outbox
- **Consumers:** KOC events, platform services, delivery-domain, tests/events
- **Tests:** `tests/events/event-catalog.test.ts`, `tests/events/continuity-verification.test.ts`
- **Documentation references:** `docs/adr/adr-013-event-first-platform.md`, `docs/architecture/event-catalog.md`
- **Missing pieces:** No external broker/durable runtime was validated.

### Platform Services

- **Domain:** Infrastructure
- **Purpose:** Provide shared interfaces/default services for event bus, configuration, idempotency, notification, file service, search, webhooks, API keys, feature flags, observability, rate limiting, distributed locks, scheduling, and background jobs.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/platform-services`
- **APIs:** None found directly
- **UI:** None found
- **Events:** Event bus interface/default implementation
- **Database entities:** None found directly
- **Dependencies:** `@kadarn/domain-events`, Node types
- **Consumers:** instrumentation package, engines, application services
- **Tests:** `packages/platform-services/__tests__/services.test.ts`
- **Documentation references:** `openspec/af-4.0-dev-platform.md`, `openspec/af-4.0-production-operations.md`
- **Missing pieces:** Many services are interfaces or in-memory/noop defaults; production adapters are not broadly present.

### Observability, Metrics, Health, Reliability

- **Domain:** Infrastructure
- **Purpose:** Provide health/ready/metrics endpoints, instrumentation bootstrap, telemetry/tracing, security headers, error taxonomy, alerts, dashboards, and reliability scripts.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** `@kadarn/instrumentation`, `@kadarn/telemetry`, `apps/api/instrumentation.ts`, `infra/observability/*`, `scripts/reliability/*`
- **APIs:** `/health`, `/health/ready`, `/metrics`
- **UI:** `/koc/platform-health`, `/koc/phase8-cutover`
- **Events:** `RequestCompleted`, `HealthCheckFailed`
- **Database entities:** `instrument_runs`
- **Dependencies:** instrumentation bootstrap, telemetry tracer, alert/dashboard config
- **Consumers:** API routes, KOC platform health, operations
- **Tests:** `packages/instrumentation/tests/instrumentation.test.ts`, `tests/instrumentation/error-taxonomy.test.ts`, `tests/performance/api-benchmarks.test.ts`
- **Documentation references:** `openspec/af-4.0-sprint-2-observability.md`, `openspec/af-4.0-reliability-runbook.md`, `openspec/af-4.0-metric-naming.md`
- **Missing pieces:** Deployment/runtime metric ingestion was not verified.

### DevOps, Security Gates, and Local Environment

- **Domain:** Infrastructure
- **Purpose:** Define workspace scripts, Docker/devcontainer/GitHub workflow setup, SBOM/secrets/architecture gates, Supabase migrations, seeds, and local development configuration.
- **Current implementation status:** Partial
- **Confidence:** High
- **Main packages/modules:** root `package.json`, `.github/`, `.devcontainer/`, `docker-compose.dev.yml`, `scripts/*`, `supabase/*`, `database/migrations/*`
- **APIs:** None
- **UI:** None
- **Events:** None
- **Database entities:** all migration-defined entities
- **Dependencies:** npm workspaces, Next.js, Vitest, Supabase CLI, Docker, bash scripts
- **Consumers:** developers, CI/CD, release gates
- **Tests:** root scripts include `build`, `typecheck`, `test`, `audit:deps`, `check:secrets`, `arch:gate`; CI execution was not run here
- **Documentation references:** `CONTRIBUTING.md`, `scripts/README.md`, `docs/ops/SUPABASE-INFRASTRUCTURE-VALIDATION.md`
- **Missing pieces:** Config/scripts exist; CI execution not verified.

## Capability Matrix

| Capability | Domain | Current State | Confidence | Missing Pieces |
|---|---|---:|---:|---|
| Authentication and Session Context | Identity | Partial | Medium | Full account lifecycle/recovery not evidenced. |
| Organization and Membership Model | Institution | Partial | High | Runtime behavior not tested during audit. |
| Institution Public Profile / Site Passport | Institution | Partial | Medium | Public-read/runtime parity not executed. |
| Program Management | Portfolio | Partial | High | Workflow execution not verified. |
| Collection and Specimen Inventory | Portfolio | Partial | High | Full lifecycle runtime not executed. |
| Processing and Quality Control | Portfolio | Partial | Medium | QC provenance recording has explicit stub. |
| Evidence Core Domain Model | Evidence | Partial | High | Tests/DB runtime not executed. |
| External Evidence Connectors | Evidence | Partial | High | Live external integrations not exercised. |
| Claim Lifecycle and Review | Claim | Partial | High | Runtime workflow not verified. |
| Evidence Lineage and Provenance Reconstruction | Provenance | Partial | High | Runtime not revalidated. |
| Append-only Audit and Compliance Events | Provenance | Partial | High | Trigger behavior not executed. |
| Continuity Passport | Continuity | Partial | High | Full UX/data lifecycle not executed. |
| Confidence Evaluation and Trust State | Confidence | Partial | High | Runtime scoring not executed. |
| Published Views and Evidence Packs | Publication | Partial | High | Production distribution is separate. |
| Evidence Delivery Domain | Publication | Partial | High | UI is mock-data-backed; no API persistence found. |
| Authorization, RLS, Policy Engine, OPA Shadow | Permission | Partial | High | OPA appears shadow/local; tests not run. |
| Discovery Engine and Dashboard | Discovery | Partial | High | Live external discovery not run. |
| Document Intake Pipeline | Discovery | Partial | High | Direct API exposure not found. |
| Marketplace Search and Requests | Discovery | Partial | High | End-to-end workflow not executed. |
| Sponsor Workspace Shell | Sponsor | Stub | High | Most sponsor pages use `SponsorPlaceholder`. |
| Sponsor Passport | Sponsor | Partial | High | E2E mock fallback; runtime not revalidated. |
| Sponsor Portfolio | Sponsor | Partial | High | Portfolio page is placeholder. |
| Vendor / Logistics Operations | Vendor | Partial | High | External courier/vendor integrations not complete/evidenced. |
| Financial Settlements and Payments | Vendor | Partial | Medium | Minimal package; limited persistence model. |
| Exchange Deals and Requests | Vendor | Partial | High | End-to-end negotiation/exchange not verified. |
| API Surface and OpenAPI Docs | API | Partial | High | OpenAPI parity not verified. |
| Workspace Experience | API | Partial | High | Some surfaces shell/demo-like. |
| KOC Operations Console | API | Partial | High | AI page stub; runtime freshness not verified. |
| Domain Event Runtime | Infrastructure | Partial | High | No external broker/durable runtime validated. |
| Platform Services | Infrastructure | Partial | High | Many services are interfaces/in-memory/noop defaults. |
| Observability, Metrics, Health, Reliability | Infrastructure | Partial | High | Runtime ingestion/deployment not verified. |
| DevOps, Security Gates, and Local Environment | Infrastructure | Partial | High | CI execution not verified. |

## Domain Coverage Summary

- **Identity:** Authentication and Session Context
- **Institution:** Organization and Membership Model; Institution Public Profile / Site Passport
- **Portfolio:** Program Management; Collection and Specimen Inventory; Processing and Quality Control
- **Evidence:** Evidence Core Domain Model; External Evidence Connectors
- **Claim:** Claim Lifecycle and Review
- **Provenance:** Evidence Lineage and Provenance Reconstruction; Append-only Audit and Compliance Events
- **Continuity:** Continuity Passport
- **Confidence:** Confidence Evaluation and Trust State
- **Publication:** Published Views and Evidence Packs; Evidence Delivery Domain
- **Permission:** Authorization, RLS, Policy Engine, OPA Shadow
- **Discovery:** Discovery Engine and Dashboard; Document Intake Pipeline; Marketplace Search and Requests
- **Sponsor:** Sponsor Workspace Shell; Sponsor Passport; Sponsor Portfolio
- **Vendor:** Vendor / Logistics Operations; Financial Settlements and Payments; Exchange Deals and Requests
- **API:** API Surface and OpenAPI Docs; Workspace Experience; KOC Operations Console
- **Infrastructure:** Domain Event Runtime; Platform Services; Observability, Metrics, Health, Reliability; DevOps, Security Gates, and Local Environment

## Package Inventory

| Package | Path | Source files | Test files | Declared deps |
|---|---|---:|---:|---|
| `@kadarn/ai-layer` | `packages/ai-layer` | 2 | 0 | `typescript` |
| `@kadarn/auth` | `packages/auth` | 1 | 0 | `@kadarn/types`, `@supabase/ssr`, `@supabase/supabase-js` |
| `@kadarn/cli` | `packages/cli` | 1 | 0 | `@kadarn/sdk`, `@types/node`, `typescript` |
| `@kadarn/delivery-domain` | `packages/delivery-domain` | 73 | 14 | `typescript`, `vitest`, `zod` |
| `@kadarn/document-intake` | `packages/document-intake` | 26 | 10 | `typescript`, `vitest` |
| `@kadarn/domain-events` | `packages/domain-events` | 2 | 0 | `typescript` |
| `@kadarn/evidence-core` | `packages/evidence-core` | 56 | 16 | `typescript`, `vitest`, `zod` |
| `@kadarn/evidence-discovery` | `packages/evidence-discovery` | 104 | 36 | `typescript`, `vitest` |
| `@kadarn/evidence-lineage` | `packages/evidence-lineage` | 16 | 5 | `@kadarn/types`, `typescript`, `vitest` |
| `@kadarn/financial-engine` | `packages/financial-engine` | 3 | 0 | `typescript`, `vitest` |
| `@kadarn/fulfillment-engine` | `packages/fulfillment-engine` | 3 | 0 | `typescript`, `vitest` |
| `@kadarn/graph-query` | `packages/graph-query` | 4 | 0 | `typescript`, `vitest` |
| `@kadarn/instrumentation` | `packages/instrumentation` | 10 | 2 | `@kadarn/platform-services`, `@kadarn/telemetry`, `@kadarn/types`, `typescript`, `vitest` |
| `@kadarn/integration-engine` | `packages/integration-engine` | 3 | 0 | `typescript`, `vitest` |
| `@kadarn/intelligence-engine` | `packages/intelligence-engine` | 3 | 0 | `typescript`, `vitest` |
| `@kadarn/knowledge-engine` | `packages/knowledge-engine` | 3 | 0 | `typescript`, `vitest` |
| `@kadarn/kpe-generator` | `packages/kpe-generator` | 1 | 0 | None listed |
| `@kadarn/matching-engine` | `packages/matching-engine` | 3 | 0 | `typescript`, `vitest` |
| `@kadarn/operational-twins` | `packages/operational-twins` | 4 | 0 | `typescript`, `vitest` |
| `@kadarn/platform-services` | `packages/platform-services` | 17 | 1 | `@kadarn/domain-events`, `@types/node`, `typescript`, `vitest` |
| `@kadarn/policy-engine` | `packages/policy-engine` | 10 | 0 | `typescript`, `vitest` |
| `@kadarn/provenance` | `packages/provenance` | 3 | 1 | `typescript`, `vitest` |
| `@kadarn/provenance-graph` | `packages/provenance-graph` | 3 | 0 | `typescript`, `vitest` |
| `@kadarn/published-view` | `packages/published-view` | 9 | 4 | `@kadarn/evidence-discovery`, `@kadarn/evidence-lineage`, `@kadarn/types`, `typescript`, `vitest` |
| `@kadarn/sdk` | `packages/sdk` | 1 | 0 | `@kadarn/types`, `typescript` |
| `@kadarn/telemetry` | `packages/telemetry` | 3 | 1 | `typescript`, `vitest` |
| `@kadarn/trust-engine` | `packages/trust-engine` | 4 | 0 | `typescript`, `vitest` |
| `@kadarn/types` | `packages/types` | 15 | 0 | None listed |
| `@kadarn/ui` | `packages/ui` | 0 | 0 | None listed |
| `@kadarn/workflow-engine` | `packages/workflow-engine` | 7 | 1 | `typescript`, `vitest` |

## API Route Inventory

- **Root/system:** `/`, `/health`, `/health/ready`, `/metrics`, `/docs`, `/docs/openapi.yaml`
- **Legacy/core:** `/audit-events`, `/discovery`, `/exchange`, `/feasibility`, `/me`, `/organizations`, `/organizations/:id`, `/organizations/:id/capabilities`, `/organizations/:id/invite`, `/programs`, `/programs/:id`, `/programs/:id/milestones`
- **Account:** `/v1/account/erasure`
- **Continuity:** `/v1/continuity/admin/queue`, `/v1/continuity/claims`, `/v1/continuity/claims/:id`, `/v1/continuity/claims/:id/evidence`, `/v1/continuity/claims/:id/promote`, `/v1/continuity/claims/:id/references`, `/v1/continuity/claims/:id/reject`, `/v1/continuity/claims/:id/submit`, `/v1/continuity/claims/:id/verify`, `/v1/continuity/opportunities/match`, `/v1/continuity/passport/:slug`, `/v1/continuity/passport/:slug/opportunities`, `/v1/continuity/passport/:slug/recommendations`, `/v1/continuity/passport/:slug/score`, `/v1/continuity/passport/:slug/timeline`
- **Discovery:** `/v1/discovery/curation`, `/v1/discovery/dashboard`, `/v1/discovery/pipeline-status`, `/v1/discovery/provenance`, `/v1/discovery/report`, `/v1/discovery/session`, `/v1/discovery/validation-notes`
- **Evidence core/lineage:** `/v1/evidence-core/claims`, `/v1/evidence-core/counter-evidence`, `/v1/evidence-core/evidence`, `/v1/evidence-core/identity/resolve`, `/v1/evidence-core/process-state`, `/v1/evidence-core/relationships`, `/v1/evidence-core/responses`, `/v1/evidence-lineage/claims/:id/provenance`
- **Exchange/financial:** `/v1/exchange/deals`, `/v1/exchange/deals/:id`, `/v1/financial/settlements`, `/v1/financial/settlements/:id`
- **Institution/publication:** `/v1/institution/profile`, `/v1/institution/public/:slug`, `/v1/published-views/:claimId/evidence-pack`
- **KOC/operations:** `/v1/koc/analytics`, `/v1/koc/ecosystem`, `/v1/koc/events`, `/v1/koc/knowledge`, `/v1/koc/logistics`, `/v1/koc/platform-health`, `/v1/koc/policy`, `/v1/koc/twins`, `/v1/koc/twins/health`, `/v1/koc/workflow`, `/v1/operations/capacity`, `/v1/operations/compliance`, `/v1/operations/exceptions`, `/v1/operations/exceptions/:id`, `/v1/operations/health`, `/v1/operations/kpe`, `/v1/operations/kpe/generate`, `/v1/operations/phase8-cutover`, `/v1/operations/provenance`, `/v1/operations/sla`
- **Marketplace:** `/v1/marketplace/capabilities`, `/v1/marketplace/feasibility`, `/v1/marketplace/network`, `/v1/marketplace/organizations`, `/v1/marketplace/requests`, `/v1/marketplace/search`, `/v1/marketplace/services`, `/v1/marketplace/specimens`, `/v1/marketplace/supply-items`
- **Portfolio/resources:** `/v1/collections`, `/v1/organizations/:id/capabilities`, `/v1/processing/aliquots/:id/qc`, `/v1/programs/:id/activity`, `/v1/programs/:id/exchange`, `/v1/programs/:id/kpe`, `/v1/programs/:id/milestones`, `/v1/programs/:id/participants`, `/v1/search`, `/v1/shipments`, `/v1/shipments/:id`, `/v1/specimens`, `/v1/feed`, `/v1/notifications`
- **Sponsor:** `/v1/sponsor/passports`, `/v1/sponsor/passports/:institutionId`, `/v1/sponsor/passports/:institutionId/claims/:claimId/provenance`, `/v1/sponsor/search`
- **Workspace:** `/v1/workspace/active-org`, `/v1/workspace/applications`, `/v1/workspace/collections`, `/v1/workspace/consent`, `/v1/workspace/documents`, `/v1/workspace/inventory`, `/v1/workspace/logistics`, `/v1/workspace/navigation`, `/v1/workspace/overview`, `/v1/workspace/payments`, `/v1/workspace/processing`, `/v1/workspace/profile`, `/v1/workspace/programs`, `/v1/workspace/qc`, `/v1/workspace/regulatory`, `/v1/workspace/requests`

## UI Route Inventory

- **Root/auth:** `/`, `/login`
- **Workspace:** `/workspace`, `/workspace/analytics`, `/workspace/collections`, `/workspace/consent`, `/workspace/continuity`, `/workspace/delivery`, `/workspace/discovery`, `/workspace/documents`, `/workspace/exchange`, `/workspace/inventory`, `/workspace/logistics`, `/workspace/payments`, `/workspace/processing`, `/workspace/profile`, `/workspace/programs`, `/workspace/programs/:id`, `/workspace/programs/:id/kpe`, `/workspace/qc`, `/workspace/regulatory`, `/workspace/requests`
- **Marketplace:** `/marketplace`, `/marketplace/collections`, `/marketplace/organizations`, `/marketplace/requests`, `/marketplace/requests/access`, `/marketplace/requests/feasibility`, `/marketplace/search`, `/marketplace/services`
- **Sponsor:** `/sponsor` [stub], `/sponsor/feasibility` [stub], `/sponsor/notifications` [stub], `/sponsor/opportunities` [stub], `/sponsor/passports`, `/sponsor/passports/:institutionId`, `/sponsor/portfolio` [stub], `/sponsor/risk` [stub]
- **KOC:** `/koc`, `/koc/activity`, `/koc/ai` [stub], `/koc/analytics`, `/koc/capacity`, `/koc/command`, `/koc/compliance`, `/koc/discovery`, `/koc/ecosystem`, `/koc/events`, `/koc/exceptions`, `/koc/health`, `/koc/knowledge`, `/koc/kpe`, `/koc/logistics`, `/koc/network`, `/koc/notifications`, `/koc/phase8-cutover`, `/koc/platform-health`, `/koc/policy`, `/koc/programs`, `/koc/provenance`, `/koc/twins`, `/koc/workflow`
- **Public/report:** `/site-passport/:slug`, `/report/kpe/:id`

## Database Entity Inventory

Unique entities found across migrations:

`ai_inferences`, `ai_models`, `ai_suggestions`, `ai_training_data`, `analytics_network_snapshots`, `analytics_program_metrics`, `analytics_search_queries`, `analytics_supplier_metrics`, `audit_events`, `claims`, `collection_twins`, `confidence_state_snapshots`, `continuity_capabilities`, `continuity_evidence_items`, `continuity_evidence_links`, `continuity_experience_claims`, `continuity_experience_ledger`, `continuity_performance_metrics`, `continuity_references`, `continuity_relationships`, `continuity_timeline_events`, `discovery_agent_outputs`, `discovery_artifacts`, `discovery_candidate_artifacts`, `discovery_candidates`, `discovery_curation_events`, `discovery_layer1`, `discovery_preparation_requests`, `discovery_runs`, `discovery_sessions`, `discovery_transition_events`, `discovery_validation_notes`, `domain_event_outbox`, `domain_event_store`, `evidence_artifacts`, `evidence_class`, `evidence_extracted_facts`, `evidence_extraction_runs`, `evidence_nodes`, `evidence_relationships`, `evidence_source_versions`, `evidence_sources`, `exchange_deals`, `exchange_escrow`, `exchange_messages`, `exchange_requests`, `external_identity_links`, `feasibility_assessments`, `feasibility_scores`, `identity_providers`, `instrument_runs`, `logistics_carriers`, `logistics_containers`, `logistics_customs_docs`, `logistics_shipment_items`, `logistics_shipments`, `logistics_telemetry`, `membership_roles`, `ontology_mappings`, `ontology_synonyms`, `ontology_terms`, `organization_capabilities`, `organization_capability_types`, `organization_memberships`, `organization_roles`, `organization_trust`, `organizations`, `phase8_claim_candidates`, `phase8_claim_instances`, `phase8_claim_versions`, `phase8_materialized_edges`, `phase8_published_views`, `policies`, `policy_evaluations`, `processing_aliquots`, `processing_samples`, `processing_workflow_steps`, `processing_workflows`, `program_access_policies`, `program_activity_log`, `program_milestones`, `program_participants`, `program_requirements`, `programs`, `provenance_edges`, `provenance_evidence`, `provenance_nodes`, `quality_control_results`, `regulatory_document_access`, `regulatory_documents`, `regulatory_icf_templates`, `regulatory_protocols`, `regulatory_sops`, `regulatory_submissions`, `right_of_response`, `sample_movements`, `shipment_twins`, `site_continuity_profiles`, `specimen_twins`, `sponsor_portfolio_memberships`, `sponsor_portfolios`, `storage_locations`, `supply_items`, `transaction_twins`, `trust_challenges`, `trust_events`, `twin_events`, `user_profiles`, `workflow_definitions`, `workflow_instances`, `workflow_tasks`.

## Explicit Stub / Mock Signals Observed

- Sponsor routes `/sponsor`, `/sponsor/feasibility`, `/sponsor/opportunities`, `/sponsor/portfolio`, `/sponsor/risk`, and `/sponsor/notifications` import `SponsorPlaceholder`.
- Delivery workspace imports `apps/web/src/components/delivery/mock-data.ts`; delivery-domain is implemented as a domain package, but no delivery API persistence surface was found.
- `apps/api/src/app/api/v1/processing/aliquots/[id]/qc/route.ts` contains an explicit provenance recording stub comment.
- Several web components use E2E mock session fallbacks under `apps/web/src/lib/e2e/mock-session.ts`.

## Audit Limits

- This is a repository discovery artifact, not a production-readiness certification.
- Tests were not executed; test paths indicate coverage presence only.
- Documentation references are treated as supporting context only when matching code/API/DB artifacts exist.
