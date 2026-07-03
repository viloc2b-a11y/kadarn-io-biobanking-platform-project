> **Superseded Notice**
>
> This document contains pre-AF-2.0 terminology and is superseded by:
> - KEMS-001 Confidence Graph Model
> - KEMS-002 Trustworthy Evidence Architecture
> - KEMS-003 Kadarn Product Constitution
> - AF-2.0 / AF-2.1 Architecture Freeze
>
> Runtime implementations must not use retired Trust / Verified terminology.

# KRM-RAO: Kadarn Reference Model for Research Asset Orchestration

**Version:** 1.0  
**Status:** Accepted  
**Canonical URL:** `docs/architecture/krm-rao.md`

---

## 1. Introduction

KRM-RAO is the abstract reference model for the Kadarn platform. It
defines the core abstractions, component categories, and architectural
patterns that govern all Kadarn subsystems.

KRM-RAO is intentionally **domain-agnostic**. It describes Research Asset
Orchestration as a general capability. The biospecimen specialization is
defined in the companion profile KRM-BNO (Kadarn Reference Model for
Biospecimen Network Orchestration).

### 1.1 What is Research Asset Orchestration?

Research Asset Orchestration is the coordinated management of discover,
access, governance, movement, transformation, and settlement of research-
related assets across organizational boundaries.

It answers four fundamental questions:

1. **What exists?** — Discovery, catalog, availability
2. **What is allowed?** — Governance, policy, consent, regulation
3. **What happened?** — Provenance, events, evidence, lineage
4. **What is reliable?** — Trust, accreditation, compliance, risk

### Framing

This reference model is framed by the Kadarn Manifesto's canonical statement:

> **Kadarn is the orchestration infrastructure for biospecimen research — a platform that connects biobanks, sponsors, CROs, laboratories, and couriers into a unified network where specimens are discoverable, governable, traceable, and fulfillable under computable trust.**

(Kadarn Manifesto v1.0, `manifesto-statement: v1.0` — quoted verbatim. Do not paraphrase.)

KRM-RAO is the abstract model that makes *discoverable, governable, traceable, fulfillable, and computable trust* architecturally real. Each engine, graph, twin, and fabric in this model maps to one or more elements of that canonical sentence.

---

## 2. Core Abstractions

KRM-RAO defines nine core abstractions. Every Kadarn component maps to
one or more of these.

```
┌─────────────────────────────────────────────────────────┐
│                    KRM-RAO Abstractions                   │
├────────────┬──────────┬──────────┬──────────────────────┤
│  Research   │Operational│  Event   │       Policy        │
│   Asset     │   Twin   │          │                      │
├────────────┼──────────┼──────────┼──────────────────────┤
│  Evidence   │Provenance│  Trust   │       Graph          │
├────────────┴──────────┴──────────┴──────────────────────┤
│                        Fabric                             │
└──────────────────────────────────────────────────────────┘
```

### 2.1 Research Asset

**Definition:** The atomic unit of orchestration. Anything that can be
discovered, requested, governed, transferred, and accounted for.

**Properties:**
- **Identity:** Globally unique, persistent identifier
- **Type:** Classification (specimen, dataset, aliquot, shipment, etc.)
- **State:** Current lifecycle stage (available, reserved, collected,
  shipped, consumed, destroyed)
- **Owner:** The controlling organization
- **Governance:** Applicable policies, consents, agreements

### 2.2 Operational Twin

**Definition:** A persistent, event-sourced digital representation of a
real-world entity that reflects its current state and can be queried,
reconstructed, and simulated.

**Properties:**
- **Event-sourced:** State is derived from replaying an event stream
- **Persistent:** Twins survive beyond any single session or transaction
- **Queryable:** Current state, historical state, and state at any point
  in time
- **Simulable:** What-if scenarios can be run without affecting the real
  entity

**Subtypes:** Specimen Twin, Transaction Twin, Organization Twin, Shipment
Twin, Collection Twin

### 2.3 Event

**Definition:** An immutable, timestamped record of something that happened.
Events are the single source of truth in Kadarn.

**Properties:**
- **Immutable:** Events are never modified or deleted
- **Timestamped:** Each event carries a monotonic timestamp
- **Typed:** Each event has a type that defines its schema
- **Causal:** Events may reference parent events (causality)
- **Evidence-linked:** Events may reference supporting evidence

### 2.4 Policy

**Definition:** A declarative rule or set of rules evaluated at decision
points. Policies produce allow, deny, or conditional outcomes.

**Properties:**
- **Declarative:** Policies state what is allowed, not how to enforce it
- **Evaluable:** Policies can be evaluated without side effects
- **Composable:** Policies can be combined (AND, OR, priority)
- **Versioned:** Policy changes are tracked
- **Traceable:** Each evaluation records which policies produced the
  outcome

### 2.5 Evidence

**Definition:** A verifiable piece of information supporting a claim about
an entity, event, or process.

**Properties:**
- **Verifiable:** Evidence can be independently checked
- **Immuatable:** Evidence content is integrity-protected (hash)
- **Linked:** Evidence references the entity, event, or claim it supports
- **Provenanced:** Evidence itself has provenance (who created it, when,
  under what authority)

### 2.6 Provenance

**Definition:** The complete, verifiable history of an entity — every
transformation, transfer, and decision that affected it, with supporting
evidence.

**Properties:**
- **Complete:** All ancestors and transformations are recorded
- **Verifiable:** Each step can be confirmed against evidence
- **Acyclic:** Causal relationships form a DAG
- **Reproducible:** Starting from origin events, the current state can be
  reproduced

### 2.7 Trust

**Definition:** A computed, evidence-based assessment of reliability that
decays without new evidence.

**Properties:**
- **Computed:** Trust is an output of the Trust Engine, not an input
- **Multidimensional:** Separate scores for different dimensions
  (operational, regulatory, financial, technical)
- **Decaying:** Trust decreases over time without reinforcement
- **Revocable:** Significant adverse events can trigger immediate
  recomputation
- **Transparent:** The contributing factors to a trust score are visible

### 2.8 Graph

**Definition:** A network of nodes (entities) and edges (relationships)
that enables complex queries across the orchestration space.

KRM-RAO defines four canonical graphs:

| Graph | Nodes | Edges | Purpose |
|-------|-------|-------|---------|
| Network Graph | Organizations | Collaborations, agreements | Who works with whom |
| Provenance Graph | Entities, Events | Causal relationships | How did this come to be |
| Knowledge Graph | Concepts, Entities | Semantic mappings | What does this mean |
| Trust Graph | Organizations | Trust scores | Who is reliable |

### 2.9 Fabric

**Definition:** A foundational cross-cutting layer that provides a specific
capability to all platform components.

| Fabric | Capability |
|--------|------------|
| Identity Fabric | Authentication, authorization, organizations, roles, delegations |
| Data Fabric | Storage, query, search, catalog |
| Trust Fabric | Trust scores, attestations, risk models |
| Governance Fabric | Policy evaluation, compliance checks |
| Integration Fabric | External system connectivity, event ingestion |

---

## 3. Platform Component Categories

KRM-RAO organizes Kadarn into seven component categories arranged in
layers:

```
         ┌─────────────────────────────────────┐
         │           Applications               │
         │  Sponsor │ Biobank │ CRO │ Admin      │
         └────────────────┬────────────────────┘
                          │
         ┌────────────────┴────────────────────┐
         │              Engines                  │
         │ Knowledge │ Policy │ Workflow │ Trust │
         │ Matching │ Fulfillment │ Financial    │
         │ Intelligence │ Integration            │
         └────────────────┬────────────────────┘
                          │
         ┌────────────────┴────────────────────┐
         │             Services                  │
         │ Discovery │ Exchange │ Logistics       │
         │ Regulatory │ Analytics                 │
         └────────────────┬────────────────────┘
                          │
         ┌────────────────┴────────────────────┐
         │          Operational Twins            │
         │ Specimen │ Transaction │ Organization │
         │ Shipment │ Collection                  │
         └────────────────┬────────────────────┘
                          │
         ┌────────────────┴────────────────────┐
         │              Graphs                   │
         │ Network │ Provenance │ Knowledge      │
         │ Trust                                  │
         └────────────────┬────────────────────┘
                          │
         ┌────────────────┴────────────────────┐
         │             Fabrics                   │
         │ Identity │ Data │ Trust │ Governance  │
         │ Integration                           │
         └────────────────┬────────────────────┘
                          │
         ┌────────────────┴────────────────────┐
         │           Infrastructure              │
         │ Database │ Queue │ Storage │ Compute  │
         └──────────────────────────────────────┘

         AI ──── transversal across all layers ────►
```

### 3.1 Applications

User-facing interfaces that compose Engines and Services into role-specific
workflows.

**Characteristics:**
- Role-specific views (sponsor, biobank, CRO, admin)
- Compose multiple Services and Engines
- Provide human-in-the-loop decision points
- Handle presentation, not business logic

### 3.2 Engines

Self-contained subsystems that encapsulate specific computational
capabilities. Engines are the active units of platform logic.

**Characteristics:**
- Stateless (state lives in Twins and Graphs)
- Highly cohesive (single responsibility)
- Policy-evaluated (decisions go through Policy Engine)
- Event-producing (all actions produce events)

### 3.3 Services

API-addressable capabilities that may delegate to Engines and Operational
Twins. Services are the integration boundary of the platform.

**Characteristics:**
- External-facing API surface
- Orchestrate Engine and Twin calls
- Handle cross-cutting concerns (auth, rate limiting, logging)
- Versioned and documented

### 3.4 Operational Twins

Persistent, event-sourced digital representations of real-world entities.

**Characteristics:**
- Own their event stream
- Provide state reconstruction at any point in time
- Emit events for state changes
- Support simulation (what-if queries)

### 3.5 Graphs

Queryable networks of entities and relationships that cross individual
Twins and Services.

**Characteristics:**
- Cross-entity queries (across Twin types)
- Relationship traversal
- Semantic reasoning (Knowledge Graph)
- Trust-weighted routing (Trust Graph)

### 3.6 Fabrics

Foundational cross-cutting layers that provide capabilities to all other
layers.

**Characteristics:**
- No business logic
- Provided to all layers above
- Configurable per organization or program
- Infrastructure-aware (multi-region, multi-tenant)

**The five fabrics:**

1. **Identity Fabric** — Authentication, authorization, organization hierarchy, role management, delegation, and capability-based access control for all platform components.
2. **Data Fabric** — Unified storage, query, search, and catalog across all engines, twins, and graphs, with multi-tenant isolation via RLS.
3. **Trust Fabric** — Computed trust score storage, decay scheduling, attestation verification, and risk model execution for the Trust Engine.
4. **Governance Fabric** — Declarative policy definition storage, evaluation context assembly, compliance check scheduling, and audit trail persistence for the Policy Engine.
5. **Integration Fabric** — External system connectivity: webhook management, event ingestion, identifier mapping across systems, retry/dead-letter logic, and integration health monitoring.

### 3.7 Infrastructure

The physical and logical substrate: databases, message queues, object
storage, compute, networking.

**Characteristics:**
- PostgreSQL (primary data store)
- Event queue (for async event processing)
- Object storage (evidence, documents, files)
- Compute (engines and services)

---

## 4. The Four Graphs

### 4.1 Network Graph

**Purpose:** Answer "who participates in the ecosystem and how are they
connected?"

**Node types:** Organizations, organizational units

**Edge types:**
- `collaborates_with` — active partnership
- `delegates_to` — authority delegation
- `accredited_by` — certification/accreditation
- `contracts_with` — active MTA/DUA
- `supplies_to` — specimen provision relationship
- `audited_by` — regulatory oversight relationship

**Query examples:**
- "Which biobanks have active agreements with Sponsor A?"
- "What is the shortest path from Sponsor A to a CAP-accredited lab?"
- "Which organizations are under FDA oversight?"

### 4.2 Provenance Graph

**Purpose:** Answer "what is the complete history of this entity?"

**Node types:** Research Assets, Events, Agents (users, organizations,
systems)

**Edge types:**
- `generated` — an event produced an entity
- `used` — an entity was consumed by an event
- `was_associated_with` — an agent was involved in an event
- `was_informed_by` — an event references a prior event
- `derived_from` — an entity was derived from another entity

**Query examples:**
- "Trace the complete lineage of Dataset D-88 back to donor consent."
- "Which events touched Specimen S-003 between collection and shipment?"
- "Show all agents who handled this shipment."

### 4.3 Knowledge Graph

**Purpose:** Answer "what does this entity mean in domain terms?"

**Node types:** Domain concepts (ontologies, terminologies), Kadarn
entities, mapping relationships

**Edge types:**
- `is_a` — subclass relationship
- `maps_to` — entity-to-ontology mapping
- `related_to` — semantic relationship
- `has_property` — attribute mapping
- `translates_to` — cross-ontology mapping

**Supported ontologies:** ICD-10/11, SNOMED CT, LOINC, NCIt, MONDO,
FAIR principles, FHIR resources, GA4GH data model

**Query examples:**
- "Find all specimens with a diagnosis that maps to ICD-10 C50 (breast
  cancer) regardless of how the site coded it."
- "Show me the LOINC codes associated with this collection protocol."
- "What is the FHIR resource representation of this specimen?"

### 4.4 Trust Graph

**Purpose:** Answer "which organizations can be trusted for a given type of
operation?"

**Node types:** Organizations, organizational units, trust dimensions

**Edge types:**
- `trust_score` — computed trust value (0.0-1.0)
- `attested_by` — evidence supporting a trust score
- `challenged_by` — challenge to a trust score
- `decayed_from` — prior trust score before decay

**Trust dimensions:**
- **Operational Trust:** Successful fulfillments, on-time delivery,
  temperature compliance, QC pass rates
- **Regulatory Trust:** Valid accreditations (CAP, CLIA, ISO 20387),
  audit outcomes, regulatory history
- **Financial Trust:** Payment history, invoice accuracy, settlement
  timeliness
- **Technical Trust:** System reliability, data quality, integration
  stability

**Query examples:**
- "Route my specimens only to labs with Operational Trust > 0.85."
- "Show trust score trajectory for Biobank D over the past 12 months."
- "Which organizations have had a trust challenge in the last 90 days?"

---

## 5. Engine Roles

### 5.1 Knowledge Engine

**Purpose:** Semantic query, ontology mapping, and concept resolution.

**Responsibilities:**
- Maintain ontology mappings (ICD, SNOMED, LOINC, NCIt, MONDO)
- Resolve synonyms and cross-system terminology
- Support semantic search across the Knowledge Graph
- Map entity properties to ontology terms
- Validate ontological consistency

### 5.2 Policy Engine

**Purpose:** Declarative policy evaluation at decision points.

**Responsibilities:**
- Evaluate policies against request context
- Support allow, deny, and conditional outcomes
- Compose multiple policies (AND, OR, priority, override)
- Record evaluation trace for audit
- Support policy versioning and rollout

### 5.3 Workflow Engine

**Purpose:** Dynamic, policy-driven workflow orchestration.

**Responsibilities:**
- Execute multi-step workflows
- Invoke Policy Engine at decision points
- Route tasks to human actors when needed
- Support workflow versioning
- Handle workflow state persistence

### 5.4 Trust Engine

**Purpose:** Compute, update, and decay trust scores.

**Responsibilities:**
- Ingest trust-relevant events (fulfillments, incidents, audits)
- Compute trust scores per dimension
- Apply decay functions over time
- Support trust challenges and recomputation
- Expose trust score contributions transparently

### 5.5 Matching Engine

**Purpose:** Match requests to available assets.

**Responsibilities:**
- Query available assets across governance boundaries
- Apply policy and trust filters
- Rank matches by relevance and trust
- Support partial and incremental matching
- Record match provenance

### 5.6 Fulfillment Engine

**Purpose:** Drive fulfillment from request to settlement.

**Responsibilities:**
- Manage fulfillment lifecycle
- Coordinate with Logistics, Governance, and Financial engines
- Track fulfillment state through Operational Twins
- Handle partial fulfillment, disputes, and exceptions
- Trigger settlement on completion

### 5.7 Financial Engine

**Purpose:** Calculate fees, distribute payments, manage escrow.

**Responsibilities:**
- Fee calculation against fulfillment data
- Multi-party payment distribution
- Escrow management for high-value transactions
- Currency and jurisdiction handling
- Settlement record generation for audit

### 5.8 Intelligence Engine

**Purpose:** AI-assisted capabilities across all platform layers.

**Responsibilities:**
- Classify ambiguous consent terms
- Suggest policy rules from historical decisions
- Detect anomalies in shipments and transactions
- Natural language query over platform data
- Predictive availability and feasibility

### 5.9 Integration Engine

**Purpose:** External system connectivity and event ingestion.

**Responsibilities:**
- Manage webhook and API endpoints
- Transform external system events to Kadarn events
- Map identifiers across systems
- Handle retry, error, and dead-letter logic
- Monitor integration health

---

## 6. Capability Sequence

The nine engines defined in §5 do not operate in isolation. Their execution
order — the **Capability Sequence** — defines how a request flows through
Kadarn's computational layer.

### 6.1 Primary Sequence (Orchestration Path)

This is the canonical execution order for a fulfillment request from
initial discovery through settlement:

```
1. Integration Engine      (receive external request / event)
       ↓
2. Policy Engine           (evaluate authorization and governance)
       ↓
3. Knowledge Engine        (resolve terminology, map identifiers)
       ↓
4. Matching Engine         (find available assets)
       ↓
5. Workflow Engine         (orchestrate multi-step process)
       ↓
6. Fulfillment Engine      (drive fulfillment lifecycle)
       ↓
7. Financial Engine        (settle and distribute)
       ↓
8. Trust Engine            (update trust scores from outcome)
```

### 6.2 Intelligence Engine — Transversal

The **Intelligence Engine** does not appear as a step in the primary
sequence because it is **transversal**: it may be invoked at any step
where AI assistance is needed.

| Step | Possible Intelligence Engine invocation |
|------|----------------------------------------|
| 2 (Policy) | Classify ambiguous consent terms |
| 3 (Knowledge) | Suggest ontology mappings |
| 4 (Matching) | Rank results by relevance |
| 5 (Workflow) | Predict next human task |
| 6 (Fulfillment) | Detect anomalous delays |
| 8 (Trust) | Analyze trust decay patterns |

### 6.3 Exclusion & Sequencing Rationale

| Engine | Position / Exclusion | Reason |
|--------|---------------------|--------|
| Integration | Step 1 | Must be first — all external input enters through it |
| Policy | Step 2 | Must be early — no downstream work should proceed before authorization |
| Knowledge | Step 3 | Policy has already determined *if*; Knowledge now resolves *what* |
| Matching | Step 4 | Requires Knowledge resolution to match semantically |
| Workflow | Step 5 | Orchestrates the multi-step process after matching |
| Fulfillment | Step 6 | Workflow Engine delegates execution to Fulfillment Engine |
| Financial | Step 7 | Fulfillment must complete before settlement |
| Trust | Step 8 | Trust is updated from outcomes, not prerequisites |
| Intelligence | Transversal | Not a sequential step; invoked on demand by any other engine |

### 6.4 Non-Linear Paths

Not all requests follow the full primary sequence:

| Request type | Sequence |
|-------------|----------|
| Pure discovery query | Integration → Policy → Knowledge → Matching (stops) |
| Feasibility assessment | Integration → Policy → Knowledge → Matching → Intelligence |
| Governance-only check | Integration → Policy (stops, returns decision) |
| Trust score query | Integration → Policy → Trust Engine (skips middle) |
| Event ingestion only | Integration (forwards to Twin/Graph) |

---

## 7. Existing Module Mapping

Every Kadarn module from v0.11.0 maps to one or more KRM-RAO components.

| Module | KRM-RAO Category | Notes |
|--------|-------------------|-------|
| Foundation | Identity Fabric + Data Fabric | Auth, RLS, multi-tenant foundation |
| Core API | Services (baseline) | REST API surface |
| Platform Services | Services | Existing service contracts (17) |
| Discovery | Service → Matching Engine | Currently a service; should delegate to Matching Engine |
| Feasibility | Service → Intelligence Engine | Currently manual; should use Intelligence Engine |
| Program Engine | Service + Workflow Engine | Program lifecycle management |
| Exchange | Service | Exchange transaction management |
| Processing | Service | Processing order management |
| Logistics | Service + Shipment Twin | Currently a service; Shipment Twin is new |
| Regulatory | Service → Governance Fabric | Compliance and regulatory tracking |
| Analytics | Service → Intelligence Engine | Reporting and dashboards |
| AI Layer | Intelligence Engine (transversal) | Currently isolated; should become Intelligence Engine |

### Gap Summary

| Missing | KRM-RAO Component | Notes |
|---------|-------------------|-------|
| Policy Engine | Engine | Highest priority — enables policy-driven orchestration |
| Trust Engine | Engine | Core differentiator |
| Knowledge Engine | Engine | Required for semantic interoperability |
| Operational Twins | Twins | Specimen, Transaction, Organization, Shipment |
| Provenance Graph | Graph | Cross-entity provenance tracing |
| Knowledge Graph | Graph | Semantic mapping |
| Trust Graph | Graph | Trust computation storage |
| Network Graph | Graph | Organization relationship mapping |
| Workflow Engine 2.0 | Engine | Dynamic, policy-driven workflows |
| Intelligence Engine | Engine | AI as transversal capability |

---

## 8. Layer Interaction Patterns

### 8.1 Request Flow (Application → Engine → Twin)

```
1. Application receives user request
2. Application calls Service
3. Service invokes Policy Engine for authorization
4. Service calls Engine for computation
5. Engine queries Operational Twin for state
6. Engine produces result and emits event
7. Twin updates state from event
8. Service returns response to Application
```

### 8.2 Event Flow (External → Integration → Engine → Twin → Graph)

```
1. External system sends webhook
2. Integration Engine transforms to Kadarn event
3. Event is emitted to queue
4. Engine consumes event and computes
5. Engine updates Twin state
6. Twin state change propagates to Graphs
7. Graphs update relationships and scores
```

### 8.3 Policy Decision Flow

```
1. Decision point reached (e.g., access request)
2. Policy Engine receives decision context
3. Policy Engine loads applicable policies
4. Policy Engine evaluates each policy
5. Policy Engine composes outcomes (allow/deny/conditional)
6. Policy Engine returns decision with trace
7. Workflow Engine acts on decision
```

---

## 9. Architectural Invariants

These rules must hold across all Kadarn implementations:

1. **Events are append-only.** No event is ever modified, deleted, or
   retroactively inserted.
2. **State is derived.** Current state is always a projection of the
   event stream.
3. **Engines are stateless.** All persistent state lives in Twins and
   Graphs.
4. **Policies are declarative.** No business rules are hardcoded in
   Engine logic.
5. **Trust is computed.** No manual trust assignments.
6. **Boundaries are explicit.** Kadarn orchestrates across organizations
   but does not replace within-organization systems.
7. **Provenance is complete.** Every entity's complete history must be
   traceable.
8. **Evidence is required.** Every trust-affecting claim must be supported
   by evidence.
