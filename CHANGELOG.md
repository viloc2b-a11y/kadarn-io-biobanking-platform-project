# Changelog

All notable changes to Kadarn are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and Kadarn follows [Semantic Versioning](https://semver.org/) once it reaches a Public API release (see Stability Policy, Blueprint §22).

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

---

## [1.0.0-beta] — 2026-06-26 — Architecture Crystallization

### Added

- **Architecture Documentation Pack** — 10 new documents:
  - Kadarn Manifesto (canonical `what is Kadarn` statement)
  - Ecosystem Reference Architecture (17 actors, 14 flows, 10 frictions)
  - Architectural Lexicon (30+ terms, changelog)
  - KRM-RAO Reference Model (9 abstractions, 7 layers, 9 engines)
  - KRM-BNO Biospecimen Profile (5 asset types, 5 Twins, 19-phase lifecycle)
  - Event Catalog (62 canonical events, standardized envelope, versioning)
  - Graph-Native Query Layer (cross-graph composition)
  - Traceability Matrix (principle → ADR → module)
  - Current State vs Reference Model (51% completion baseline)
  - v1.0.0-beta Readiness Checklist

- **Architecture Decision Records** — 12 new ADRs (005→016):
  - ADR-005: Architectural Lexicon
  - ADR-006: Ecosystem-First Architecture
  - ADR-007: Platform Principles
  - ADR-008: KRM-RAO Reference Model
  - ADR-009: KRM-BNO Profile
  - ADR-010: Policy Engine
  - ADR-011: Trust Engine
  - ADR-012: Operational Twins
  - ADR-013: Event-First Platform
  - ADR-014: Provenance Graph
  - ADR-015: Knowledge Engine
  - ADR-016: Graph-Native Query Layer

- **Policy Engine** (`packages/policy-engine/`) — ADR-010:
  - JSON expression tree: eq, neq, gt, gte, lt, lte, in, contains, all, any, not
  - evaluate() — recursive condition walker with dot-notation var resolution
  - compose() — deny-wins composition strategy
  - 36 unit tests

- **Trust Engine** (`packages/trust-engine/`) — ADR-011:
  - 4 trust dimensions: operational, regulatory, financial, technical
  - Exponential decay: score × (1 - rate)^days
  - 17 default impact sources with severity multipliers
  - TrustEngineService: recordEvent, getScores (decay on read), getTrajectory, fileChallenge
  - 36 unit tests

- **Operational Twins** (`packages/operational-twins/`) — ADR-012:
  - Hybrid event-sourcing: immutable event store + materialized state table
  - Specimen Twin with 11 event types, typed payloads
  - Status state machine: 7 states with valid transitions
  - reconstructStateAt() — time-travel query
  - 24 unit tests

- **Provenance Graph** (`packages/provenance-graph/`) — ADR-014:
  - DAG lineage: provenance_nodes, provenance_edges, provenance_evidence
  - traceForward / traceBackward / fullLineage
  - Evidence chains linked to lineage nodes
  - 11 unit tests

- **Knowledge Engine** (`packages/knowledge-engine/`) — ADR-015:
  - 6 controlled vocabulary sets with 100+ seed terms
  - Synonym resolution with fuzzy matching (Levenshtein)
  - Query expansion, hierarchy traversal
  - 18 unit tests

- **Graph Query Layer** (`packages/graph-query/`) — ADR-016:
  - Cross-graph query orchestration
  - matchingSuppliers(): Knowledge → Trust → Network composition
  - 8 unit tests

- **Database migrations** — 5 new (013→017):
  - 013: Policy Engine (policies, policy_evaluations)
  - 014: Trust Engine (organization_trust, trust_events, trust_challenges)
  - 015: Operational Twins (twin_events, specimen_twins, apply_twin_event)
  - 016: Provenance Graph (provenance_nodes, provenance_edges, provenance_evidence)
  - 017: Knowledge Engine (ontology_terms, ontology_synonyms, ontology_mappings)

- **CI Scripts** — `scripts/terminology-lint.sh`, `scripts/cross-doc-consistency.sh`

### Changed

- Domain events package updated: standardized envelope, 16 new canonical events (62 total)
- Dependency order established: Manifesto → Ecosystem → KRM-RAO → KRM-BNO → Lexicon

### Engineering

- 259 total tests (86 security + 173 engine unit tests)
- 6 engine packages across 3 P0 capabilities
- 17 database migrations (008→017)
- 16 architecture decision records
- Zero breaking changes to existing v0.11.0 modules

## [1.0.0-beta.2] — 2026-06-26 — Full KRM-RAO Coverage

### Added

- **Workflow Engine 2.0** (`packages/workflow-engine/`) — ADR-017:
  - Dynamic, policy-driven workflow orchestration
  - Policy integration at every decision point (allow/deny/conditional)
  - 16 tests

- **Transaction + Shipment Twins** (migration 019):
  - Full twin tables with event-sourced state
  - Transaction lifecycle: initiated → governance → MTA → fulfillment → settlement
  - Shipment lifecycle: scheduled → picked_up → in_transit → delivered → accepted

- **5 remaining KRM-RAO engines:**
  - Matching Engine (ADR-018): ranked, filtered specimen matching
  - Fulfillment Engine (ADR-019): fulfillment lifecycle orchestration
  - Financial Engine (ADR-020): fee calculation and settlement
  - Intelligence Engine (ADR-021): AI-assisted transversal capability
  - Integration Engine: external system event ingestion with retry

- **Collection + Organization Twins** (migration 020):
  - Collection Twin: protocol enrollment, consent model, status tracking
  - Organization Twin: view combining organizations + trust scores

- **Documentation:** Policy Catalog, Integration Reference

### Engineering

- 9/9 KRM-RAO engines implemented
- 5/5 Operational Twins implemented
- 4/4 Graphs + Query Layer implemented
- 20 ADRs (001-021)
- 13 migrations (008-020)
- 14 packages (incl. apps/api)
- 298 total tests (170 engine + 128 security)

### Added

- **API Layer** (`apps/api/`) — Express REST API exposing Three Experiences:
  - Marketplace routes: /specimens, /network, /services
  - Workspace routes: /profile, /applications, /inventory, /exchange
  - Operations Center routes: /health, /trust, /provenance/:id, /exceptions, /kpe
  - JWT auth middleware, helmet, CORS
  - 6 API integration tests
