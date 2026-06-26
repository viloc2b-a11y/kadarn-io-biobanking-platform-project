# Kadarn Platform Blueprint

> **Kadarn is the operating system for biospecimen and clinical data programs.**

---

## Blueprint Status

**Status:** ✅ Approved for Sprint 0 implementation.
**Date:** 2026-06-26

### Hard Gates

- No frontend, marketplace, discovery UI, or AI features may start before Sprint 0A–0D are complete.
- No prototype SQL may be reused unless explicitly adapted to this blueprint (see Salvage Map, Section 17).
- All migrations must be idempotent, RLS-enabled, and audited.
- Multi-tenant isolation must be verified by smoke tests before any service-layer code.

---

## Table of Contents

## 1. Kadarn Definition

Kadarn is a **multi-tenant infrastructure platform** that enables organizations to discover, negotiate, execute, and govern biospecimen and clinical data programs across a distributed network.

### What Kadarn Is

- An **operating system** for biospecimen and clinical data programs
- A **network infrastructure** that connects sites, labs, biobanks, sponsors, CROs, and IRBs
- A **capability marketplace** where organizations publish what they can do
- An **orchestration engine** that transforms research needs into executable programs
- A **regulatory accelerator** with reusable templates and workflows
- An **operational data platform** that improves with every program

### What Kadarn Is Not

| Role | Kadarn's position |
|------|-------------------|
| CRO | Does not execute trials. Enables trial execution. |
| Broker | Does not intermediate manually. Orchestrates algorithmically. |
| LIMS | Does not manage lab operations. Integrates with LIMS. |
| CTMS | Does not replace clinical trial management. Connects to it. |
| Biobank | Does not own samples. Connects sample owners with researchers. |
| Marketplace | Does not just list items. Orchestrates programs end-to-end. |
| EHR / EMR | Does not store patient records. Consumes de-identified data. |

### Core Value Proposition

Kadarn reduces the time, cost, and friction of biospecimen programs by:

1. **Standardizing capabilities** so researchers can find what they need instantly
2. **Reusing regulatory frameworks** so programs start faster
3. **Orchestrating fulfillment** so quality and timelines are predictable
4. **Accumulating operational data** so the network gets smarter over time

---

## 2. Platform Principles

### 2.1 Platform Neutrality (Core vs Service Layer)

Every capability must answer: **Could a competitor use this?**

| ✅ Platform Core (neutral) | ❌ Service Layer (specific) |
|---|---|
| Organization registry | Preferred provider lists |
| Capability vocabulary | Pricing models |
| Search/filter engine | Curated search results |
| Workflow engine | Specific SOP content |
| Payment rail | Fee structures |
| Audit pipeline | Compliance decisions |
| Document exchange | Document templates |

### 2.2 Technology ≠ Service Execution

The platform is neutral infrastructure. A technology decision (PostgreSQL, Next.js, Supabase) does not imply a service offering.

### 2.3 Multi-Tenant by Default

Every row knows which organization owns it. Every query respects visibility scope. Isolation is enforced at the database level, not the application level.

### 2.4 Audit from Sprint 0

No audit trail = no action. Every significant state change emits an immutable audit event.

### 2.5 Open by Design

- Open API first, UI second
- Webhook-ready event system
- OIDC-ready identity (not locked into Supabase Auth)
- Interoperable data models (BBMRI MIABIS, DUO, ICD-10, SNOMED, UBERON)

### 2.6 Program-Centric

The **Program** is the central object. Everything else (organizations, capabilities, samples, requests, deals, analytics) exists in service of programs.

---

## 3. Core Architecture

### 3.1 Layer Model

```
┌──────────────────────────────────────────────────────────────┐
│                        CHANNELS                               │
│     Web App (Next.js)  │  API (REST/GraphQL)  │  Webhooks     │
├──────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                             │
│  Discovery │ Feasibility │ Exchange │ Fulfillment │ Analytics  │
│  Regulatory │ Payments │ Logistics │ Processing │ AI          │
├──────────────────────────────────────────────────────────────┤
│                      CORE LAYER                                │
│  Organizations  │  Capabilities  │  Programs  │  Memberships  │
│  Audit  │  Identity  │  Notifications  │  Documents          │
├──────────────────────────────────────────────────────────────┤
│                   PERSISTENCE LAYER                            │
│  PostgreSQL 17  │  Supabase Auth  │  Storage  │  Realtime     │
│  Row-Level Security  │  Migrations  │  Seed Data              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | Next.js 16 (App Router) | SSR, API routes, React Server Components |
| UI | Tailwind CSS v4 + Shadcn UI | Design system without lock-in |
| Database | PostgreSQL 17 | JSONB, GIN indexes, RLS, partitioning |
| Auth | Supabase Auth | JWT, RLS integration, OIDC-ready abstraction |
| ORM/API | PostgREST (via Supabase) | REST from database, RLS-aware |
| Queue | pgmq or similar | PostgreSQL-native message queue (future) |
| Storage | Supabase Storage / S3 | Document and file management (future) |
| Search | PostgreSQL FTS + GIN | Start simple; migrate to Meilisearch/Typesense at scale |

### 3.3 Module Dependency Graph

```
organizations ─┬─ capabilities
               ├─ memberships
               └─ roles

programs ─┬─ program_participants
          ├─ program_access_policies
          └─ audit_events

discovery ─── supply_items ─── collections ─── samples ─── donors

feasibility ─── program_scenarios ─── capacity_estimates

exchange ─── access_requests ─── deals ─── escrow

fulfillment ─── chain_telemetry ─── logistics_events

regulatory ─── protocol_templates ─── submission_tracking

analytics ─── operational_metrics ─── network_intelligence
```

---

## 4. Tenant / RLS Model

### 4.1 Isolation Strategy

**Shared database with Row-Level Security.**

Not per-tenant database. Not per-tenant schema. Shared tables with `organization_id` and `visibility_scope` on every row.

### 4.2 Visibility Scopes

| Scope | Meaning | Example |
|-------|---------|---------|
| `organization` | Visible only to members of the owning org | Internal SOPs, pricing |
| `program` | Visible to all participants of the program | Program-specific data |
| `network` | Visible to all authenticated Kadarn users | Organization profile, capabilities |
| `public` | Visible to the world (unauthenticated) | Published collections (future) |

### 4.3 RLS Architecture

```
auth.users ──> JWT (app_metadata) ──> RLS Helper Functions ──> Row Policies
                    │
                    ▼
          organization_memberships ──> roles ──> capabilities
```

**Fast path:** JWT claims for frequent checks (org membership, primary role).
**Slow path:** Database queries for complex checks (program access, capability resolution).

### 4.4 RLS Helper Functions

All defined in Sprint 0B:

| Function | Purpose | Performance |
|----------|---------|-------------|
| `current_user_id()` | Shorthand for `auth.uid()` | JWT (fast) |
| `is_org_member(org_id)` | Active membership check | DB query |
| `has_org_capability(org_id, key)` | Capability check | DB query |
| `has_org_role(org_id, key)` | Role check within org | DB query |
| `is_org_admin(org_id)` | Admin check | DB query |
| `can_access_program(program_id)` | Program access | DB query |
| `check_visibility(org_id, scope)` | Visibility scope check | Hybrid |

---

## 5. Organization-Capability Model

### 5.1 Model

- **Organizations** are legal entities (hospitals, biobanks, CROs, labs, IRBs).
- **Capabilities** describe what an organization can do within Kadarn.
- An organization can have **multiple capabilities** (a hospital can also be a biobank and a lab).

### 5.2 Capability Types

| Key | Category | Description |
|-----|----------|-------------|
| `sponsor` | Research | Funds and oversees research programs |
| `cro` | Research | Contract Research Organization |
| `biobank` | Clinical | Biospecimen repository |
| `clinical_site` | Clinical | Patient-facing research site |
| `processing_lab` | Clinical | Biospecimen processing |
| `storage_facility` | Clinical | Long-term storage |
| `logistics_vendor` | Logistics | Cold-chain transport |
| `irb` | Regulatory | Ethics review board |
| `regulatory_body` | Regulatory | Government agency |
| `diagnostic_lab` | Clinical | Clinical diagnostics |
| `data_processor` | Technology | Data analysis/curation |
| `technology_provider` | Technology | Software/platform provider |

### 5.3 Organization Roles

| Key | Priority | Description |
|-----|----------|-------------|
| `org_admin` | 100 | Full administrative access |
| `org_member` | 50 | Standard member |
| `biobank_tech` | 60 | Biospecimen management |
| `irb_chair` | 70 | Ethics review oversight |
| `data_steward` | 65 | Data sharing policy management |
| `readonly` | 10 | Read-only access |

### 5.4 Tables (from Sprint 0A)

```
organizations
organization_capability_types  (controlled vocabulary)
organization_capabilities      (org → capability, many-to-many)
organization_roles             (role definitions)
organization_memberships       (user → org)
membership_roles               (membership → roles, many-to-many)
user_profiles                  (Kadarn identity)
identity_providers             (SSO providers)
external_identity_links        (multi-SSO per user)
```

---

## 6. Program Engine

### 6.1 Concept

The **Program** is Kadarn's central object. A program represents a cross-organization collaboration around a biospecimen and/or clinical data need.

Examples:
- "Multi-center retrospective study on triple-negative breast cancer — 500 FFPE blocks + clinical data from 3 sites"
- "Prospective collection: 200 liquid biopsy samples from Stage IV NSCLC patients across 5 clinical sites in Brazil"
- "Validation cohort: 1,000 plasma samples with matched genomic data for IVD development"

### 6.2 Program Lifecycle

```
Draft ──> Active ──> Paused ──> Completed ──> Archived
                    │                              │
                    └──> Cancelled <────────────────┘
```

### 6.3 Program Structure

| Field | Description |
|-------|-------------|
| Identity | name, short_name, description, program_identifier |
| Classification | program_type[], therapeutic_areas[], diseases[] |
| Timeline | start_date, end_date, status |
| Governance | sponsor_org_id, lead_org_id |
| Data defaults | default_data_scope, allow_commercial_use, require_ethics_approval |
| Visibility | visibility_scope |
| Participants | Which orgs participate and in what role |

### 6.4 Participant Roles

| Role | Description |
|------|-------------|
| `sponsor` | Funds the program |
| `lead` | Leads/coordinates the program |
| `contributor` | Contributes data or samples |
| `consumer` | Consumes data or samples |
| `processor` | Processes samples or data |
| `reviewer` | Reviews access requests |
| `observer` | Read-only access |

### 6.5 Data Sharing Scopes

| Scope | What's visible |
|-------|---------------|
| `no_sharing` | Coordination only |
| `metadata_only` | Catalog-level metadata |
| `aggregate_only` | Counts and summaries |
| `de_identified` | De-identified individual data |
| `pseudonymized` | Pseudonymized data (Multi-PID) |
| `identified` | Fully identified (limited, audited) |
| `full_access` | Unrestricted within program |

### 6.6 Tables (from Sprint 0C)

```
programs
program_participants           (org → program with role)
program_access_policies        (data sharing rules)
audit_events                   (unified trail)
```

---

## 7. Discovery Engine

### 7.1 Concept

The Discovery Engine enables researchers to **find biospecimens and data** across the Kadarn network. It is the primary interface for researchers.

### 7.2 Supply Items (searchable objects)

Every discoverable resource is a `supply_item` — a polymorphic type with 7 categories:

| Type | Example |
|------|---------|
| `existing_collection` | Archived breast cancer tissue cohort |
| `prospective_collection` | Planned liquid biopsy collection |
| `laboratory_service` | IHC staining, NGS sequencing |
| `clinical_service` | Pathology review, radiology read |
| `data_resource` | Genomic dataset, imaging archive |
| `storage_logistics` | Cryo-storage, cold-chain transport |
| `equipment_capability` | Digital pathology scanner capacity |

### 7.3 Search Capabilities

- Full-text search across titles and descriptions
- Faceted filtering: disease (ICD-10), sample type, storage condition, geography
- Capability-based matching: which orgs can fulfill the request
- Geographic radius search (future)
- Availability filtering: existing vs prospective

### 7.4 Relation to Prototype

The prototype's `locator-search.tsx`, `directory-search.tsx`, and `/api/locator/` routes are the reference implementation. The blueprint will define a cleaner version that works with `supply_items` + `programs` + multi-tenant RLS.

---

## 8. Feasibility Engine

### 8.1 Concept

The Feasibility Engine answers the question: **"Can this program succeed?"** before a researcher commits time and resources.

### 8.2 Feasibility Dimensions

| Dimension | Question |
|-----------|----------|
| Capacity | Does the network have enough sites with the right capabilities? |
| Timeline | Can the program meet the required timeline based on historical data? |
| Quality | Do candidate sites meet the required quality standards and certifications? |
| Regulatory | What IRB/ethics approvals are needed? Are master protocols available? |
| Cost | What is the estimated cost range based on similar programs? |
| Risk | What is the probability of successful completion? |

### 8.3 Output

A feasibility assessment includes:
- Candidate site list with capability fit scores
- Estimated timeline with confidence intervals
- Regulatory pathway overview
- Cost estimate range
- Risk factors and mitigations

### 8.4 Data Dependency

Feasibility improves over time as operational data accumulates (Asset 5). Initially, feasibility estimates may be coarse. After 20+ programs, they become statistically meaningful.

---

## 9. Exchange / Commercial Engine

### 9.1 Concept

The Exchange Engine manages the **commercial and contractual layer** between researchers and providers. It transforms a discovery interest into a negotiated agreement.

### 9.2 Exchange Lifecycle

```
Interest ──> Negotiation ──> Agreement ──> Fulfillment ──> Settlement
```

- **Interest**: Researcher submits access request for specific supply items
- **Negotiation**: Multi-party messaging, MTA terms, pricing, scope
- **Agreement**: Signed MTA, escrow funded, deal active
- **Fulfillment**: Samples shipped, services rendered, data delivered
- **Settlement**: Payment released, program milestone recorded

### 9.3 Relation to Prototype

The prototype's `access_requests`, `negotiation_messages`, `kadarn_exchange_deals`, and webhook state machine are the reference. The blueprint version needs multi-tenant program context.

---

## 10. Fulfillment / Chain Engine

### 10.1 Concept

The Chain Engine monitors the **physical movement and condition** of biospecimens from collection site to processing lab to storage to destination.

### 10.2 Chain Capabilities

| Capability | Description |
|------------|-------------|
| Telemetry | Temperature, location, battery monitoring |
| Breach Detection | Real-time alert on thermal excursion |
| Chain of Custody | Digital handoff tracking at each transfer |
| SLA Monitoring | Compare actual vs committed conditions |
| Analytics | Failure patterns, carrier performance, route optimization |

### 10.3 Relation to Prototype

The prototype's `kadarn_chain_telemetry` table and breach detection function are the reference. The blueprint version adds program context, multi-tenant RLS, and logistics event tracking.

---

## 11. Regulatory Engine

### 11.1 Concept

The Regulatory Engine **accelerates program starts** by providing reusable regulatory frameworks, templates, and submission tracking.

### 11.2 Components

| Component | Description |
|-----------|-------------|
| Protocol Library | Reusable master protocols by indication and sample type |
| ICF Templates | Informed Consent Form templates by region and study type |
| SOP Library | Standard Operating Procedures for collection, processing, shipping |
| Submission Tracker | IRB/ethics submission status across sites |
| Document Exchange | Secure document sharing with audit trail |

### 11.3 Key Insight (Asset 2)

The regulatory library is a **compounding asset**. Each program adds templates, each template makes the next program faster. After 10+ programs in the same indication, a new program can start in weeks instead of months.

---

## 12. Processing Marketplace

### 12.1 Concept

The Processing Marketplace enables laboratories to **offer processing services** to the network and researchers to **find and book** those services.

### 12.2 Service Types

- Nucleic acid extraction (DNA, RNA, cfDNA)
- Tissue processing (FFPE, frozen section, H&E, IHC)
- Genomic analysis (NGS, WES, WGS, panel, qPCR)
- Proteomic analysis (mass spec, ELISA, Luminex)
- Cell isolation (PBMC, cell sorting, culture)
- Pathology services (review, scoring, digital pathology)

### 12.3 Integration Pattern

Kadarn does not replace the lab's systems. It provides:
- Capability publishing (what the lab can do, with what SLA)
- Order intake (structured requests from researchers)
- Result delivery (structured data back to researcher)
- Quality tracking (SLA adherence, QC metrics)

---

## 13. Logistics Engine

### 13.1 Concept

The Logistics Engine manages the **physical movement** of biospecimens across the network, integrated with the Chain Engine for condition monitoring.

### 13.2 Logistics Components

| Component | Description |
|-----------|-------------|
| Carrier Integration | FedEx, DHL, World Courier, Marken APIs |
| Dry Ice / LN2 | Shipper preparation and monitoring |
| Customs Documentation | International shipping paperwork generation |
| Chain of Custody | Digital handoff at each transfer point |
| Temperature Monitoring | Real-time telemetry integration |

### 13.3 Scope Note

Logistics is **orchestration, not operations**. Kadarn does not own couriers or shippers. It connects logistics vendors to programs and provides tracking/quality visibility.

---

## 14. Payments Engine

### 14.1 Concept

The Payments Engine handles the **financial layer** of biospecimen programs: milestone-based payments, escrow, reconciliation, and settlement.

### 14.2 Payment Flows

| Flow | Description |
|------|-------------|
| Escrow | Sponsor deposits funds before program starts |
| Milestone | Funds released at predefined milestones (collection, processing, delivery) |
| Reconciliation | Automated matching of services rendered to payments |
| Settlement | Final payment and program financial close |
| Analytics | Cost tracking, budget vs actual, profitability |

### 14.3 Relation to Prototype

The prototype's escrow fields and MTA tracking are the reference. The blueprint version needs full escrow lifecycle with third-party integration readiness.

---

## 15. Analytics Engine

### 15.1 Concept

The Analytics Engine transforms **operational data** into **network intelligence** (Asset 5). It is both a product for users and the feedback loop that improves every other engine.

### 15.2 Analytics Dimensions

| Dimension | Questions Answered |
|-----------|-------------------|
| Network Health | Which orgs are active? What capabilities are available? |
| Program Performance | Which programs completed on time? On budget? |
| Supplier Quality | Which sites deliver highest quality? Fastest turnaround? |
| Capacity Trends | Where is capacity growing? Where are gaps? |
| Financial | Program costs, payment velocity, escrow utilization |
| Predictive | Probability of success, optimal site selection, timeline forecasting |

### 15.3 Data Sources

- Program lifecycle events (audit_events)
- Supply item views and search queries
- Exchange negotiation timelines
- Chain telemetry data
- Payment milestones

---

## 16. AI Layer

### 16.1 Concept

The AI Layer sits above all engines to provide **intelligent assistance** across the platform.

### 16.2 AI Capabilities (Phase 2+)

| Capability | Engine | Description |
|------------|--------|-------------|
| Natural Language Search | Discovery | "Find breast cancer samples from Hispanic donors under 40" |
| Capability Matching | Feasibility | Algorithmic org selection based on program requirements |
| Timeline Prediction | Feasibility | ML model predicting program duration from historical data |
| Anomaly Detection | Chain | Unsupervised breach detection beyond fixed thresholds |
| Document Generation | Regulatory | AI-assisted protocol and ICF drafting |
| Smart Negotiation | Exchange | Suggested terms based on similar completed deals |

### 16.3 Principle

AI is a **layer**, not a separate product. Every AI feature sits within an engine and serves that engine's users.

---

## 17. Prototype Salvage Map

### Classification Guide

| Category | Action | Count |
|----------|--------|-------|
| ✅ Reuse directly | Copy verbatim | ~8 |
| 🔧 Adapt manually | Rewrite with new patterns | ~20 |
| 📖 Reference only | Don't copy, learn from | ~6 |
| ❌ Discard | Ignore or delete | ~5 |

### By Layer

#### Database

| Asset | Verdict | Plan |
|-------|---------|------|
| `organizations` table (prototype) | 🔧 Adapt | Use capability model, remove `type` enum, add `visibility_scope` |
| `biobanks` table | ❌ Discard | Vilo-specific. Kadarn uses orgs + capabilities |
| `collections` table | 🔧 Adapt | Add program_id, multi-tenant columns |
| `supply_items` table | 🔧 Adapt | Add organization_id, program_id, audit columns |
| `supply_item_type` enum | ✅ Reuse | 7 types are correct |
| `sample_type` enum | ✅ Reuse | BBMRI-compatible |
| `duo_permission` enum | ✅ Reuse | DUO standard |
| `kadarn_chain_telemetry` | 🔧 Adapt | Add multi-tenant columns |
| `kadarn_exchange_deals` | 🔧 Adapt | Add program context |
| `sample_events` | 🔧 Adapt | Valid provenance concept |
| `donors` table | 🔧 Adapt | Add tenant isolation + program scoping |
| `samples` table | 🔧 Adapt | Universal biospecimen model |

#### Auth & RLS

| Asset | Verdict | Plan |
|-------|---------|------|
| `current_vilo_role()` | ❌ Discard | Vilo naming. Replace with Kadarn helpers |
| `current_vilo_organization_id()` | ❌ Discard | Same |
| `user_profiles` table | 🔧 Adapt | Add identity provider abstraction |
| JWT claim injection pattern | ✅ Reuse | Signup trigger → profile → app_metadata is correct |
| RLS policy patterns | ✅ Reuse | `USING (auth.jwt() ->> 'claim')` pattern is correct |

#### API Routes

| Asset | Verdict | Plan |
|-------|---------|------|
| `POST /api/locator/search` | 🔧 Adapt | Multi-tenant + supply_items |
| `GET /api/locator/supply` | 🔧 Adapt | Same |
| `POST /api/negotiator/requests` | 🔧 Adapt | Multi-tenant + program context |
| `POST /api/exchange/webhook` | 🔧 Adapt | State machine concept is valid |
| `POST /api/chain/telemetry` | 🔧 Adapt | Multi-tenant + program context |

#### Frontend

| Asset | Verdict | Plan |
|-------|---------|------|
| Dashboard sidebar layout | 🔧 Adapt | Add org selector |
| DirectorySearch component | 🔧 Adapt | Add program context |
| NegotiatorRequestModal | 🔧 Adapt | Add supply_item support |
| KadarnConnectDashboard | 🔧 Adapt | Multi-tenant metrics |
| Login page | 🔧 Adapt | Organization-aware login |
| Shadcn UI setup | ✅ Reuse | Framework-agnostic |
| Tailwind CSS config | ✅ Reuse | Framework-agnostic |
| `@supabase/ssr` client pattern | ✅ Reuse | Standard pattern |

#### Architecture Docs

| Asset | Verdict | Plan |
|-------|---------|------|
| `architecture-v2.md` | 📖 Reference | Vision valid, domain model prototype-specific |
| `domain-scout-bbmri-eric.md` | ✅ Reuse | BBMRI research independent of implementation |
| `blueprint-gap-analysis.md` | 📖 Reference | Useful for context |
| `schema-design.md` | 📖 Reference | Prototype-specific |
| ADR-001 | ✅ Reuse | Already in kadarn-platform |

---

## 18. Sprint Roadmap

### Sprint 0 — Foundation (Current)

| Sprint | Migration | Tables | Status |
|--------|-----------|--------|--------|
| 0A | Core Identity | organizations, capability_types, capabilities, roles, memberships, membership_roles, user_profiles, identity_providers | ⬜ Planned |
| 0B | RLS Foundation | RLS helper functions + policies for all Sprint 0A tables | ⬜ Planned |
| 0C | Audit + Programs | audit_events, programs, program_participants, program_access_policies | ⬜ Planned |
| 0D | Seeds + Smoke Tests | Seed data, RLS isolation tests, multi-tenant verification | ⬜ Planned |

### Sprint 1 — Domain Model

| Migration | Tables |
|-----------|--------|
| Supply Domain | supply_items (adapted from prototype), supply_item_categories |
| Collections | collections (refactored, multi-tenant, program-aware) |
| Biospecimens | donors, samples, sample_events (refactored, Multi-PID) |
| Ontologies | ICD-10, SNOMED, UBERON, DUO reference data |

### Sprint 2 — Discovery + Exchange

| Migration/Feature | Description |
|-------------------|-------------|
| Discovery API | search, filter, facet endpoints over supply_items |
| Negotiator | access_requests, messaging, state machine (multi-tenant) |
| Exchange Deals | deal creation, MTA tracking, escrow (multi-tenant) |

### Sprint 3 — Chain + Fulfillment

| Migration/Feature | Description |
|-------------------|-------------|
| Chain Telemetry | Multi-tenant telemetry + breach detection |
| Logistics Events | Chain of custody, shipment tracking |
| Fulfillment Dashboard | Program-level fulfillment view |

### Sprint 4 — Regulatory + Payments

| Migration/Feature | Description |
|-------------------|-------------|
| Protocol Library | Reusable protocol templates |
| Submission Tracker | IRB submission tracking across sites |
| Escrow Engine | Full escrow lifecycle |
| Payment Milestones | Milestone definition and tracking |

### Sprint 5 — Frontend v1

| Feature | Description |
|---------|-------------|
| Researcher Dashboard | Discovery, feasibility, program overview |
| Site Dashboard | Commercial enablement, opportunity pipeline |
| Admin Dashboard | Network management, analytics |
| Organization Selector | Multi-org user experience |

### Sprint 6 — Analytics + AI

| Feature | Description |
|---------|-------------|
| Operational Dashboards | Network health, program performance, supplier quality |
| Predictive Feasibility | ML-based timeline and cost estimation |
| Natural Language Search | AI-assisted supply item discovery |
| Anomaly Detection | ML-based chain breach detection |

---

## 19. Cursor Execution Rules

### 19.1 Development Order

1. **Architecture first** — This blueprint must be approved before any code
2. **Core before services** — Organizations, capabilities, programs before discovery, exchange
3. **Database before API** — Migrations before API routes
4. **API before UI** — Endpoints before frontend components
5. **Multi-tenant from day one** — Every table has organization_id or visibility_scope

### 19.2 Migration Rules

- Every migration must be **idempotent** (`IF NOT EXISTS`, `CREATE OR REPLACE`)
- Every migration must include **RLS enable + policies** for new tables
- Every migration must include **updated_at triggers**
- No migration may reference a table from a later migration
- Seed data goes in a separate migration, not mixed with DDL

### 19.3 Code Reuse Rules

- Nothing from the `Kadarn/` prototype may be used without salvage classification
- "Reference only" (📖) assets may inform design but not be copied
- "Adapt" (🔧) assets must be rewritten for multi-tenant architecture
- "Reuse" (✅) assets may be copied verbatim
- "Discard" (❌) assets must not appear in kadarn-platform code

### 19.4 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `organization_memberships` |
| Columns | snake_case | `visibility_scope` |
| Functions | snake_case | `is_org_member()` |
| Policies | `{table}_{operation}` | `organizations_select` |
| API Routes | kebab-case | `/api/locator/search` |
| Frontend Components | kebab-case | `directory-search.tsx` |
| Types/Interfaces | PascalCase | `OrganizationProfile` |
| Enums | snake_case | `visibility_scope` |

### 19.5 Testing Rules

- Every RLS policy must have a corresponding test
- Tests must verify: user sees own data, user does not see other org's data
- Admin tests must verify: admin sees all, admin can modify
- Multi-tenant isolation is the most important test category

---

## 20. Acceptance Criteria

### 20.1 Sprint 0 Completion

- [ ] `008_organizations_capabilities.sql` applied: 9 tables created
- [ ] `009_rls_foundation.sql` applied: all helper functions + RLS policies
- [ ] `010_audit_programs.sql` applied: audit_events, programs, program_participants, program_access_policies
- [ ] `011_seed_data.sql` applied: demo organizations, capability types, roles
- [ ] RLS isolation verified: Org A user cannot see Org B data
- [ ] RLS admin verified: Org admin can manage their org
- [ ] RLS self-service verified: User can see own profile
- [ ] Audit events capturing on program create/update/delete
- [ ] Smoke test: multi-tenant isolation passes

### 20.2 Sprint 1 Completion

- [ ] Supply items searchable with faceted filters
- [ ] Collections linked to programs
- [ ] Donors and samples with Multi-PID protection
- [ ] Ontology reference data loaded
- [ ] RLS: researcher sees public items, coordinator sees org items
- [ ] RLS: local_ids protected from researcher view

### 20.3 General Platform Criteria

- [ ] Every sensitive table has `organization_id` or `visibility_scope`
- [ ] Every table with RLS has explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies
- [ ] Every mutation emits an audit event
- [ ] No table allows `DELETE` for non-admin roles by default
- [ ] JWT app_metadata contains minimal claims for fast RLS checks
- [ ] All migrations are idempotent
- [ ] Seed data includes at least 3 organizations with different capabilities
- [ ] Seed data includes at least 2 programs with participants

---

## Appendix A: Change Log

| Date | Change |
|------|--------|
| 2026-06-26 | Initial blueprint — Sprint 0 planning phase |

## Appendix B: References

- ADR-001: Platform Core vs. Service Layer Separation (`./adr/adr-001-platform-core-vs-service-layer.md`)
- ADR-002: Multi-Tenant Architecture & Organization Model (`./adr/adr-002-multi-tenant-architecture.md`)
- Salvage Review (`./architecture/salvage-review.md`)
- Strategic Positioning (`../positioning/README.md`)
- Prototype repo: `../Kadarn/` (tagged `archive/pre-kadarn-platform-prototype`)
