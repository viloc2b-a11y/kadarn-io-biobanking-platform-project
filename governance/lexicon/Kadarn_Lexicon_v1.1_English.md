# Kadarn — Foundational Architectural Documentation
### Lexicon v1.1 · Manifesto v1.1 · KRM-RAO v1.1 · KRM-BNO v1.1
*(Editorial and consistency revision of v1.0)*

---

## Revision Note

This version fully preserves the technical content and architectural decisions of v1.0. The changes are **consistency, precision, and completeness** changes, not substantive ones. They are flagged at the end in the *"Changes from v1.0"* section so the team can validate them before adopting them as canonical.

---

## 1. Kadarn Architectural Lexicon (v1.1)

### 1.1 Purpose

This lexicon defines the canonical meaning of the core terms used across Kadarn. Its purpose is to align product, engineering, compliance, operations, and strategy around a shared vocabulary.

### 1.2 Principles

1. Terms are defined for architectural consistency, not marketing language.
2. If a term's meaning changes, the lexicon must be updated **before** any downstream document.
3. Every later document in the Kadarn documentation hierarchy must use these definitions without exception.

### 1.3 Core Terms

| Term | Definition |
|---|---|
| **Research Asset** | A scientific entity with identity, lifecycle, governance, and traceability requirements. Includes, among others: biospecimens, datasets, images, cell lines, organoids, protocols, consent artifacts, and derived results. |
| **Operational Twin** | A persistent digital representation of a real-world operational asset, whose current state is derived from events and governed by policies. |
| **Specimen Twin** | An Operational Twin that represents a physical biospecimen and its lifecycle. |
| **Transaction Twin** | An Operational Twin that represents a scientific request, negotiation, approval, fulfillment, and settlement process. |
| **Provenance** | The verifiable history of origin, transformation, movement, derivation, and contextual use of a Research Asset. |
| **Trust** | An operational measure derived from verifiable evidence about quality, compliance, reliability, performance, and risk. |
| **Policy** | A declarative rule that governs platform behavior without requiring hardcoded business logic. |
| **Workflow** | A coordinated sequence of activities controlled by policies, events, and state transitions. |
| **Evidence** | Any verifiable artifact that supports a decision, event, state change, or claim. |
| **Network** | The set of organizations, people, systems, and relationships participating in Research Asset orchestration. |
| **Ecosystem** | The broader environment in which the Network operates, including external systems, standards, regulators, logistics, and data infrastructure. |
| **Event** | A significant domain occurrence that reflects a meaningful change in state or context. |
| **State** | The current operational condition of an asset, transaction, or process at a given time. |
| **Engine** | A decision-making capability that evaluates inputs and produces outputs, actions, or updated states. |
| **Service** | A reusable platform capability that executes a specific supporting function. |
| **Fabric** | A connective layer that links systems, data, or trust domains under a shared governance model. |
| **Knowledge Graph** | The semantic representation of domain concepts, relationships, standards, and mappings. |
| **Network Graph** | The structural representation of actors and their relationships. |
| **Provenance Graph** | The representation of how a Research Asset and its derivatives evolved over time. |
| **Trust Graph** | The representation of accumulated trust, reliability, compliance, and risk over time. |
| **Knowledge Engine** | The Engine responsible for semantic understanding, standard mapping, ontology resolution, and controlled vocabulary logic. |
| **Identity Fabric** | The Fabric responsible for identity, authentication, authorization, and role continuity across systems. |
| **Data Fabric** | The Fabric responsible for structured data movement, normalization, and interoperability. |
| **Trust Fabric** | The Fabric responsible for trust propagation and trust-aware orchestration across participants. |
| **Governance Fabric** | The Fabric responsible for policy consistency, permissions, and decision control across the ecosystem. |
| **Integration Fabric** | The Fabric responsible for interoperability with external platforms and services. |

> **Consistency note (v1.1):** *Network* and *Ecosystem* were added to this table; in v1.0 they were defined in prose but not visually distinguishable from the rest by row structure — no content change, presentation only.

### 1.4 Canonical Usage Rules

- Use **Research Asset** when referring to the broad domain object.
- Use **Specimen Twin** only when the object is specifically a biospecimen.
- Use **Transaction Twin** only when describing a scientific request lifecycle.
- Use **Provenance** for origin and transformation history; use **Evidence** for artifacts that support a claim or decision.
- Use **Trust** for computed operational reliability; do not use it as a subjective reputation label.
- Use **Policy** for declarative rules; do not use it to mean procedural guidance.
- Use **Workflow** for orchestrated execution; do not use it to mean a static checklist.
- Use **Fabric** only for the five connective layers listed (Identity, Data, Trust, Governance, Integration); do not coin new "fabrics" without going through language governance (§1.5).
- Use **Engine** only for the decision-making capabilities listed in KRM-RAO §7; an Engine never owns tables or user interfaces.

### 1.5 Language Governance

- New terms require approval before becoming canonical.
- Synonyms should be minimized.
- If two terms overlap, one must be chosen as canonical and the other marked as **deprecated**, noting in which document and version the deprecation occurred.

---

## 2. Kadarn Manifesto (v1.1)

### 2.1 Why Kadarn Exists

Kadarn exists because scientific asset orchestration is fragmented across people, systems, policies, and institutions. The domain needs a coherent platform that can coordinate Research Assets with trust, governance, provenance, and interoperability.

### 2.2 The Problem

Today, scientific networks rely on disconnected tools for discovery, approvals, compliance, logistics, evidence, and financial settlement. That fragmentation creates operational delay, weak traceability, inconsistent policy enforcement, and poor network visibility.

### 2.3 What Kadarn Is

Kadarn is **execution infrastructure for biospecimen and Research Asset programs**, built around a platform for **Research Asset Orchestration**. It is not merely a marketplace, a database, or a document repository, and it is not a discovery tool that stops at matching supply with demand. It is a coordination layer for discovery, feasibility, governance, fulfillment, logistics, regulatory compliance, analytics, and intelligence across the full lifecycle of a Research Asset program — from initial discovery through settlement.

> **Provenance of this statement:** Kadarn began as a platform to find biospecimens (a discovery-centric framing). As Program Engine, Exchange, Processing, Logistics, Regulatory, Analytics, and AI matured into first-class architectural layers (see KRM-RAO §3.4), the platform's actual scope outgrew that original framing. This paragraph records that as a deliberate scope expansion — consistent with the Operational Twin and Workflow models already defined in KRM-RAO — rather than as scope creep. It supersedes any earlier "discovery platform" framing found in prior versions of this Manifesto or in external materials, and should be treated as the canonical statement of what Kadarn is going forward. See the Kadarn Readiness & Governance Pack §1.4 for the full scope decision record.

### 2.4 What Kadarn Is Not

- Not a generic workflow tool.
- Not a simple directory of providers.
- Not a monolithic replacement for all external systems.
- Not a set of disconnected features without architectural continuity.

### 2.5 Principles That Must Not Change

1. Policy over hardcode.
2. Events over mutable assumptions.
3. Trust over declarations.
4. Evidence over claims.
5. Federation over forced centralization.
6. Interoperability over replacement.
7. Human-in-the-loop where governance requires it.
8. Auditability by design.
9. Semantic consistency across the platform.

### 2.6 The Promise

Kadarn will make it possible to orchestrate scientific assets across a fragmented ecosystem without losing provenance, trust, or governance control.

### 2.7 The Commitment

Kadarn will evolve, but its architectural principles will remain stable. The platform may change in implementation, not in identity.

---

## 3. KRM-RAO — Kadarn Reference Model for Research Asset Orchestration (v1.1)

### 3.1 Purpose

KRM-RAO defines the reference architecture for Research Asset Orchestration. It is the internal model that ensures Kadarn remains coherent as it evolves across domains, modules, and implementations.

### 3.2 Scope

This model applies to the orchestration of scientific assets, including but not limited to biospecimens, datasets, images, cell lines, protocols, consent artifacts, derived results, and future research objects.

### 3.3 Architecture Philosophy

Kadarn integrates established disciplines rather than inventing new ones. The model draws from Enterprise Architecture, Domain-Driven Design, Event-Driven Architecture, Knowledge Graphs, FAIR Data, provenance standards, Zero Trust, digital twins, workflow orchestration, policy-as-code, and network science.

### 3.4 Architectural Layers

| Layer | Description |
|---|---|
| **4.1 Applications** | The visible user-facing experiences: Discovery, Exchange, Governance, Analytics, Administration, and Network Console. |
| **4.2 Engines** | Decision-making capabilities: Identity, Discovery, Feasibility, Knowledge, Policy, Trust, Workflow, Fulfillment, Financial, Intelligence, and Integration. |
| **4.3 Services** | Reusable capabilities: Audit, Notification, Document, Signature, Search, and Identity Support. |
| **4.4 Operational Twins** | Persistent representations of real-world objects, with state derived from events. |
| **4.5 Graphs** | Network Graph, Provenance Graph, Trust Graph, and Knowledge Graph. |
| **4.6 Fabrics** | Identity Fabric, Data Fabric, Trust Fabric, Governance Fabric, and Integration Fabric. |
| **4.7 Infrastructure** | Cloud, compute, storage, observability, security, identity providers, external APIs, and runtime environments. |

### 3.5 Core Graphs

- **Network Graph** — actors, institutions, roles, and relationships.
- **Provenance Graph** — origin, transformation, derivation, versioning, and lineage of Research Assets.
- **Trust Graph** — accumulated operational trust, quality, compliance, and reliability signals.
- **Knowledge Graph** — controlled terminology, ontologies, standard mappings, and semantic relationships.

### 3.6 Operational Twin Model

Operational Twins are the primary stateful objects of Kadarn. They represent the present condition of a real-world asset, object, or process.

**Examples** (aligned with KRM-BNO §4 to avoid divergence between profiles):

- Research Asset Twin
- Specimen Twin
- Aliquot Twin
- Dataset Twin
- Image Twin
- Cell Line Twin
- Collection Twin
- Shipment Twin
- Transaction Twin
- Organization Twin

> **Change in v1.1:** *Aliquot Twin* was added to this list. In v1.0 it appeared in KRM-BNO §4 but not in KRM-RAO's own general model in §6, creating an inconsistency between the base model and its specialized profile.

### 3.7 Engines as Capabilities

Engines do not own tables or interfaces. They own decisions.

**Capability Sequence:**

1. **Knowledge Engine** — understands the domain.
2. **Trust Engine** — evaluates trust and risk.
3. **Policy Engine** — determines allowed behavior.
4. **Workflow Engine** — coordinates execution.
5. **Fulfillment Engine** — executes operational steps.
6. **Financial Engine** — manages settlement logic.
7. **Intelligence Engine** — learns from performance and patterns.

> **Note:** KRM-RAO §4.2 additionally lists *Identity, Discovery, Feasibility,* and *Integration* as Engines within the Applications/Engines layer, none of which appear in this capability sequence. Before fixing v1.1 as canonical, it is recommended to decide whether the "Capability Sequence" should include them, or whether it intentionally describes only the core transactional orchestration loop. This is flagged as a pending decision, not resolved unilaterally in this revision.

### 3.8 Event Model

The platform is event-driven. Events are first-class domain signals.

**Examples:** `AssetRegistered`, `ConsentVerified`, `GovernanceApproved`, `ReservationCreated`, `CollectionStarted`, `ProcessingCompleted`, `ShipmentDispatched`, `TemperatureExcursionDetected`, `ReceiptConfirmed`, `QCCompleted`, `DatasetLinked`, `SettlementReleased`.

### 3.9 Policy Model

Policies are declarative and versioned. They are evaluated against context, asset type, jurisdiction, actor role, and use case.

### 3.10 Trust Model

Trust is not subjective. It is computed from evidence across quality, compliance, performance, integrity, and reliability dimensions.

### 3.11 Interoperability Model

The platform must coexist with external systems, not replace them. Interoperability is a design principle, not a future enhancement.

### 3.12 Security Model

Kadarn is designed with Zero Trust principles, role-based access, evidence retention, auditability, and least-privilege access.

### 3.13 Evolution Boundary

The reference model is stable. Modules, APIs, connectors, UIs, analytics, and deployments may change without violating the architecture.

---

## 4. KRM-BNO — Kadarn Reference Model for Biospecimen Network Orchestration (v1.1)

### 4.1 Purpose

KRM-BNO is the biospecimen-specific profile of KRM-RAO. It specializes the broader Research Asset Orchestration model for biospecimen networks.

### 4.2 Scope

This profile applies to biospecimen ecosystems involving sponsors, CROs, sites, biobanks, pathology, laboratories, couriers, IRBs, regulators, and downstream research users.

### 4.3 Core Biospecimen Lifecycle

1. Discovery
2. Feasibility
3. Consent verification
4. IRB review
5. Regulatory package assembly
6. Reservation
7. Collection
8. Processing
9. QC
10. Shipment
11. Temperature monitoring
12. Receipt
13. Acceptance
14. Data linkage
15. Settlement

### 4.4 Biospecimen Twins

- Specimen Twin
- Aliquot Twin
- Collection Twin
- Shipment Twin
- Transaction Twin
- Organization Twin

### 4.5 Biospecimen Events

`SpecimenReserved`, `ConsentVerified`, `IRBApproved`, `CollectionStarted`, `CollectionCompleted`, `AliquotCreated`, `QCCompleted`, `ShipmentDispatched`, `ShipmentReceived`, `TemperatureExcursionDetected`, `AccessGranted`, `DatasetLinked`, `SettlementReleased`.

### 4.6 Biospecimen Trust Domains

Organization Trust · Operational Trust · Regulatory Trust · Specimen Trust · Shipment Trust · Data Trust · Financial Trust.

### 4.7 Biospecimen Knowledge Domains

Specimen taxonomies · preservation types · consent frameworks · IRB requirements · MTA/DUA logic · metadata standards · controlled vocabularies.

### 4.8 Biospecimen Application Set

Discovery · Exchange · Governance · Logistics · Analytics · Administration · Network Console.

### 4.9 Evolution Boundary

KRM-BNO must remain compatible with KRM-RAO. It is a profile, not a separate architecture.

---

## 5. Changes from v1.0 (summary for validation)

Purely editorial changes (no meaning altered):
- Consistent table and heading formatting across all four documents.
- Unified section numbering (previously inconsistent styles across documents).

Content changes — **require Language Governance approval (Lexicon §1.5) before adoption**:
1. Added *Aliquot Twin* to the Operational Twin example list in KRM-RAO §3.6, to remove the inconsistency with KRM-BNO §4.4.
2. Flagged (without resolving) the discrepancy between the Engines listed in KRM-RAO §4.2 (which include Identity, Discovery, Feasibility, Integration) and the "Capability Sequence" in §3.7 (which omits them). Recommendation: explicitly decide the intended scope of the sequence.
3. Suggested adding canonical usage rules for *Fabric* and *Engine* to the Lexicon (§1.4), since v1.0 did not explicitly cover them despite their being central architectural categories.

No term was renamed, removed, or redefined. None of the §3.7/§1.4 items were imposed as decisions — they are documented as pending recommendations, per the Lexicon's own rule that meaning changes require prior approval.
