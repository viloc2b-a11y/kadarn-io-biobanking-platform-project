> **Superseded Notice**
>
> This document contains pre-AF-2.0 terminology and is superseded by:
> - KEMS-001 Confidence Graph Model
> - KEMS-002 Trustworthy Evidence Architecture
> - KEMS-003 Kadarn Product Constitution
> - AF-2.0 / AF-2.1 Architecture Freeze
>
> Runtime implementations must not use retired Trust / Verified terminology.

# Kadarn Architectural Lexicon

**Version:** 1.0  
**Status:** Accepted  
**Supersedes:** All prior informal usage of these terms  

This lexicon defines the canonical vocabulary of the Kadarn platform. Every
technical decision, document, module, and communication MUST use these
definitions. When a term appears in code, configuration, or documentation,
its meaning is bound to this entry.

---

## Core Abstractions

### Research Asset

**Definition:** The atomic unit of orchestration. Anything that can be
discovered, requested, governed, transferred, and accounted for.

**Source:** KRM-RAO §2.1

**Kadarn example:** A biospecimen collection, a dataset, an aliquot, a
tissue slide, a shipment batch. A Research Asset is the generalization
that allows Kadarn to treat biological, digital, and composite entities
through a uniform orchestration model.

**Boundary:** A Research Asset must be identifiable, traceable, and
governable. If an entity cannot be assigned to a program, tracked through
a lifecycle, or subjected to policy, it is not a Research Asset.

---

### Biospecimen

**Definition:** A biological sample collected from a living organism for
research purposes. The primary physical asset class in Kadarn.

**Source:** KRM-BNO §3.1

**Kadarn example:** FFPE tissue block, whole blood vial, plasma aliquot,
DNA extract, urine sample.

**Boundary:** A Biospecimen is a concrete subtype of Research Asset. It has
physical properties (collection method, preservation type, storage
temperature) that digital-only assets do not.

---

### Operational Twin

**Definition:** A persistent, event-sourced digital representation of a
real-world entity that reflects its current state and can be queried,
reconstructed, and simulated without accessing the physical entity.

**Source:** KRM-RAO §2.2

**Kadarn example:** A Specimen Twin for a blood vial that tracks every
event — collection, processing, aliquoting, QC, freeze-thaw, shipment —
and can report current location, temperature exposure, and remaining
aliquots without querying a LIMS or freezer.

**Key distinction:** An Operational Twin is not a cache. It is an
independent, authoritative digital entity whose state is derived from
events.

---

### Specimen Twin

**Definition:** The Operational Twin of a single Biospecimen or aliquot.

**Source:** KRM-RAO §2.2 (subtype), KRM-BNO §4.1

**Kadarn example:** A plasma aliquot twin that records every
freeze-thaw cycle, volume change, QC result, and transfer. It can
answer "has this aliquot ever exceeded -50°C?" from its event stream.

---

### Transaction Twin

**Definition:** The Operational Twin of a fulfillment or exchange
transaction.

**Source:** KRM-RAO §2.2 (subtype), KRM-BNO §4.2

**Kadarn example:** A Material Transfer Agreement (MTA) twin that
tracks the full lifecycle: request → review → approval → fulfillment →
receipt → acceptance → closure. Each state transition is an event.

---

### Organization Twin

**Definition:** The Operational Twin of a participating organization in
the Kadarn network.

**Source:** KRM-RAO §2.2 (subtype), KRM-BNO §4.3

**Kadarn example:** A biobank twin that tracks accreditation status,
active collections, trust score, regulatory certifications (CAP/CLIA,
ISO 20387), and current agreements. It is the single source of truth
for "what is this organization's current operational state?"

---

### Shipment Twin

**Definition:** The Operational Twin of a physical shipment of biospecimens.

**Source:** KRM-RAO §2.2 (subtype), KRM-BNO §4.4

**Kadarn example:** A dry shipper twin that tracks departure, current
location via GPS, internal temperature every 5 minutes, chain of custody
events, delivery confirmation, and acceptance. If temperature breaches
-50°C (UN 3373 Category B), the twin autonomously raises a dispute.

---

### Aliquot Twin

**Definition:** The Operational Twin of a single aliquot derived from a
parent biospecimen. Tracks volume, freeze-thaw cycles, QC results, and
usage history at the aliquot granularity.

**Source:** KRM-RAO §2.2 (subtype — Specimen Twin covers aliquot-granular
tracking natively; no separate subtype needed in the base model)

**Kadarn example:** A 1.5 mL plasma aliquot twin that records each volume
reduction (250 µL withdrawn for Assay A-7), freeze-thaw event, and QC
result. It answers "how many µL remain and has this aliquot ever been
thawed more than twice?"

---

### Collection Twin

**Definition:** The Operational Twin of a collection protocol with its
enrolled donors and collected specimens.

**Source:** KRM-RAO §2.2 (subtype), KRM-BNO §4.5

**Kadarn example:** A multi-site breast cancer collection twin that
tracks enrollment vs. target, specimens collected per protocol, consent
version per donor, and governance rule changes.

---

### Event

**Definition:** An immutable, timestamped record of something that happened
in the Kadarn system. Events are the single source of truth for all state.

**Source:** KRM-RAO §2.3

**Kadarn example:** `SpecimenCollected`, `AliquotCreated`, `ShipmentDispatched`,
`TemperatureBreachDetected`, `MTAApproved`, `ConsentVerified`,
`PaymentSettled`.

**Key property:** Events are append-only. They are never modified or deleted.
State is derived by replaying events.

---

### Policy

**Definition:** A declarative rule or set of rules that governs system
behavior. Policies are evaluated at decision points and can produce
allow, deny, or conditional outcomes.

**Source:** KRM-RAO §2.4

**Kadarn example:** "A specimen collected under IRB #2024-05 may only be
used for oncology research" is a Governance Policy. "Shipments exceeding
$10,000 value require dual authorization" is a Financial Policy.

**Key distinction:** Policies are evaluated, not executed. They are
separate from workflow logic.

---

### Workflow

**Definition:** A sequence of steps that orchestrates human and automated
activities to achieve a defined outcome. Workflows are directed by
policies but executed by the Workflow Engine.

**Source:** KRM-RAO §2.4 (contrast), KRM-RAO §5.3

**Kadarn example:** The Access Request workflow: submit → governance
review → IRB check → MTA sign → fulfillment → receipt confirmation.
Each step may invoke policy evaluation.

---

### Evidence

**Definition:** A verifiable piece of information that supports a claim
about an entity, event, or process. Evidence is the currency of the
Provenance Graph.

**Source:** KRM-RAO §2.5

**Kadarn example:** A signed MTA PDF, a temperature log from a shipment,
a CAP accreditation certificate, a consent form hash, a QC result.

---

### Provenance

**Definition:** The complete, verifiable history of an entity — every
transformation, transfer, and decision that affected it, with supporting
evidence.

**Source:** KRM-RAO §2.6

**Kadarn example:** The provenance of a research dataset includes: which
specimens were used, which lab performed the assay, which protocol was
followed, which QC thresholds were applied, who reviewed the output, and
the raw data links. Provenance answers "can this result be trusted?"

---

### State

**Definition:** A derived projection of an entity's current condition at a
point in time, computed from its event stream. State is never stored
directly — it is always a function of the event history.

**Source:** KRM-RAO §2.3 (Event/State pairing), Architectural Invariant #2

**Kadarn example:** A Specimen Twin's state at time T includes: location,
temperature exposure count, remaining volume, current consent status — all
computed by replaying events up to T.

**Key rule:** State is never mutated directly. Only new events change
state. This is the core of the "Events over Mutable State" principle.

---

### Network

**Definition:** The set of organizations, systems, and relationships that
constitute the Kadarn ecosystem. The Network is what Kadarn orchestrates
across.

**Source:** Ecosystem Reference Architecture §2 (actors)

**Kadarn example:** The Kadarn network includes 17 actor types (Sponsors,
CROs, Biobanks, Labs, Couriers, etc.) connected through collaborations,
agreements, and trust relationships.

**Boundary:** The Network is the subset of the Ecosystem that Kadarn
orchestrates. The Ecosystem includes everything outside Kadarn's control
(regulatory bodies, existing systems, market dynamics).

---

### Ecosystem

**Definition:** The broader biomedical research environment within which
the Kadarn network operates — including actors, existing systems, flows,
frictions, regulations, and market dynamics.

**Source:** Ecosystem Reference Architecture §1 (framing)

**Kadarn example:** The 17 actor types, 14 major flows, and 10 ecosystem
frictions documented in the Ecosystem Reference Architecture.

**Boundary:** The Ecosystem is larger than the Network. The Ecosystem
includes regulatory bodies, data repositories, and existing systems (LIMS,
CTMS, EHR, ERP) that Kadarn integrates with but does not control.

---

### Network Graph

**Definition:** The graph of all organizations in the Kadarn ecosystem and
their relationships — collaborations, agreements, delegations,
accreditations.

**Kadarn example:** Sponsor A → CRO B → Site C → Biobank D → Lab E, with
edges annotated by active MTAs, IRB approvals, and trust scores.

---

### Provenance Graph

**Definition:** A directed acyclic graph (DAG) where nodes are entities
(Research Assets, Events, Agents) and edges are causal relationships.
Supports tracing lineage from any node back to origin.

**Source:** KRM-RAO §4.2

**Kadarn example:** Starting from a published dataset, trace back through
assay runs → QC events → processing steps → collection events → donor →
consent record.

---

### Knowledge Graph

**Definition:** A semantic graph that connects domain concepts — ontologies,
terminologies, classifications — and maps them to Kadarn entities.

**Source:** KRM-RAO §4.3

**Kadarn example:** A Specimen of type `Blood` is linked to NCIt concept
`C16490` (Blood), LOINC codes for collected analytes, SNOMED CT for
diagnosis codes, and MONDO for disease ontology terms. The Knowledge
Graph enables semantic discovery: "find all specimens with BRAF V600E
mutation" across biobanks.

---

### Trust Graph

**Definition:** A graph where nodes are organizations or entities and edges
represent computed trust scores derived from evidence, behavior, and
attestations.

**Source:** KRM-RAO §4.4

**Kadarn example:** Biobank D has Trust Score 0.92 based on: ISO 20387
certification (verified), 47 successful shipments without breach, 100%
QC pass rate, no compliance incidents in 24 months, current CAP
accreditation. The Trust Graph enables risk-based routing: "route my
specimens only to labs with Trust > 0.85."

---

## Platform Components

### Engine

**Definition:** A self-contained subsystem that encapsulates a specific
computational capability. Engines are the active units of platform logic.

**Source:** KRM-RAO §3.2

**Key property:** Engines are stateless — all persistent state lives in
Twins and Graphs. Engines compute, evaluate, and decide.

**KRM-RAO defines nine Engines** (see KRM-RAO §5, Capability Sequence §6):

---

### Knowledge Engine

**Definition:** The Engine responsible for semantic query, ontology
mapping, and concept resolution across the Knowledge Graph.

**Source:** KRM-RAO §5.1

**Kadarn example:** A query for "specimens with BRAF mutation" is
resolved by the Knowledge Engine across biobanks that code diagnoses
using different terminologies (SNOMED CT, ICD-10, NCIt).

---

### Policy Engine

**Definition:** The Engine responsible for declarative policy evaluation
at platform decision points — produce allow, deny, or conditional
outcomes.

**Source:** KRM-RAO §5.2

**Kadarn example:** When a sponsor requests oncology specimens, the
Policy Engine evaluates: IRB scope, consent terms, MTA restrictions,
and export controls before allowing the request to proceed.

---

### Workflow Engine

**Definition:** The Engine responsible for dynamic, policy-driven
workflow orchestration — executing multi-step processes, routing to
human actors at risk-critical points, and persisting workflow state.

**Source:** KRM-RAO §5.3

**Kadarn example:** The Access Request workflow: submit → Policy
Engine evaluation → IRB human check → MTA signing → fulfillment →
receipt confirmation. Each transition is driven by the Workflow Engine.

---

### Trust Engine

**Definition:** The Engine responsible for computing, updating, and
decaying trust scores from evidence across all trust dimensions.

**Source:** KRM-RAO §5.4

**Kadarn example:** After each successful fulfillment, the Trust Engine
recomputes the biobank's Operational Trust score. A temperature breach
triggers immediate score reduction.

---

### Matching Engine

**Definition:** The Engine responsible for matching requests to available
Research Assets across governance boundaries, applying policy and trust
filters.

**Source:** KRM-RAO §5.5

**Kadarn example:** A sponsor needs 200 FFPE slides from stage III breast
cancer cases. The Matching Engine queries available collections, filters
by governance and trust, and returns ranked matches.

---

### Fulfillment Engine

**Definition:** The Engine responsible for driving the complete
fulfillment lifecycle from request to settlement.

**Source:** KRM-RAO §5.6

**Kadarn example:** After matching, the Fulfillment Engine manages:
reservation, collection, processing, QC, logistics, receipt, acceptance,
and triggers settlement upon completion.

---

### Financial Engine

**Definition:** The Engine responsible for fee calculation, multi-party
payment distribution, escrow management, and settlement records.

**Source:** KRM-RAO §5.7

**Kadarn example:** After acceptance, the Financial Engine calculates
$50/slide × 200 slides = $10,000 to biobank, $500 courier fee, 3%
platform fee, and distributes $10,815 from escrow.

---

### Intelligence Engine

**Definition:** The Engine responsible for AI-assisted capabilities
across all platform layers — classification, anomaly detection, natural
language query, and prediction.

**Source:** KRM-RAO §5.8, Capability Sequence §6.2 (transversal)

**Kadarn example:** The Intelligence Engine classifies ambiguous consent
terms when the Policy Engine encounters an edge case, or predicts
feasibility assessment outcomes based on historical patterns.

---

### Integration Engine

**Definition:** The Engine responsible for external system connectivity,
event ingestion, identifier mapping, and integration health monitoring.

**Source:** KRM-RAO §5.9

**Kadarn example:** When a biobank LIMS sends a `SpecimenCollected`
event via webhook, the Integration Engine transforms it to Kadarn's
event format, maps identifiers, and publishes it to the event queue.

---

### Service

**Definition:** An API-addressable capability that may delegate to Engines
and Operational Twins. Services are the integration boundary of the
platform.

**Kadarn example:** Discovery Service, Exchange Service, Logistics
Service, Regulatory Service, Analytics Service.

---

### Transversal

**Definition:** A capability that operates across all platform layers
rather than being confined to a single layer or position in an execution
sequence.

**Source:** KRM-RAO §6 (Capability Sequence) — the Intelligence Engine
is transversal, not a sequential step.

**Kadarn example:** The Intelligence Engine is transversal — it may be
invoked by the Policy Engine (classify ambiguous consent), the Knowledge
Engine (suggest ontology mappings), or the Workflow Engine (predict next
human task) at any point in the Capability Sequence.

**Boundary:** A transversal capability is not "everything connected to
everything." It has a defined scope but is available to all layers on
demand.

---

### Fabric

**Definition:** A foundational layer that provides a cross-cutting
capability to all platform components. Fabrics are the infrastructure
of orchestration.

**Source:** KRM-RAO §3.6

**KRM-RAO defines five Fabrics:**

---

### Identity Fabric

**Definition:** The Fabric providing authentication, authorization,
organization hierarchy, role management, delegation, and capability-based
access control.

**Source:** KRM-RAO §3.6 (Fabric #1)

**Kadarn example:** When a CRO coordinator accesses the Sponsor Portal,
the Identity Fabric verifies their JWT, checks organization membership,
resolves delegated permissions, and enforces capability boundaries.

---

### Data Fabric

**Definition:** The Fabric providing unified storage, query, search, and
catalog across all Engines, Twins, and Graphs, with multi-tenant
isolation via RLS.

**Source:** KRM-RAO §3.6 (Fabric #2)

**Kadarn example:** A discovery query searches across biobank collections;
the Data Fabric ensures each biobank sees only its own specimens while
the sponsor sees only what policies allow.

---

### Trust Fabric

**Definition:** The Fabric providing computed trust score storage, decay
scheduling, attestation verification, and risk model execution.

**Source:** KRM-RAO §3.6 (Fabric #3)

**Kadarn example:** The Trust Fabric stores each organization's Trust
Score per dimension, schedules decay recomputation every 30 days, and
records attestation evidence hashes.

---

### Governance Fabric

**Definition:** The Fabric providing declarative policy definition
storage, evaluation context assembly, compliance check scheduling, and
audit trail persistence.

**Source:** KRM-RAO §3.6 (Fabric #4)

**Kadarn example:** When an access request is submitted, the Governance
Fabric assembles all applicable policies (IRB scope, consent terms,
regulatory jurisdiction) and delivers them to the Policy Engine.

---

### Integration Fabric

**Definition:** The Fabric providing external system connectivity:
webhook management, event ingestion, identifier mapping across systems,
retry/dead-letter logic, and integration health monitoring.

**Source:** KRM-RAO §3.6 (Fabric #5)

**Kadarn example:** The Integration Fabric manages a webhook endpoint
for Biobank A's LIMS. When the LIMS publishes a `QCPassed` event, the
Fabric transforms it, maps specimen IDs, and delivers it to the
Specimen Twin event stream.

---

### Application (singular) / Applications (plural)

**Definition** (singular): A user-facing interface that composes multiple
Services and Engines into a coherent workflow for a specific actor role.

**Definition** (KRM-RAO category label, plural): The top layer of the
KRM-RAO component stack — role-specific interfaces (Sponsor Portal,
Biobank Console, CRO Dashboard).

**Source:** KRM-RAO §3.1

**Usage note:** The singular term *Application* and the KRM-RAO component
label *Applications* refer to the same concept at two register levels.
Use *Application* for a specific instance, *Applications* for the
category.

**Kadarn example:** The Sponsor Portal is an **Application** that
composes the Discovery Service, Exchange Service, and Policy Engine
into a unified workflow for sponsors.

---

## Governance & Compliance

### Governance

**Definition:** The system of policies, roles, and review processes that
control how Research Assets are accessed, used, and transferred within
and across programs.

**Source:** Ecosystem Reference Architecture §4.4 (Governance Review)

**Kadarn example:** A program's governance model defines: who can request
specimens, what materials can be collected, which IRB applies, what MTA
terms are required, how consent is verified, and what happens at study
closeout.

---

### Compliance

**Definition:** The state of conforming to applicable regulations,
policies, and agreements. Compliance is continuously verified, not
point-in-time certified.

**Source:** Kadarn Manifesto (Scope Boundary)

**Kadarn example:** A shipment is compliant if: HIPAA Business Associate
Agreement is active, IRB approval covers the material, MTA is signed,
temperature logs are within range, and chain of custody is complete.
Compliance failures trigger alerts and may hold shipments.

---

### Trust

**Definition:** A computed, evidence-based assessment of reliability for
an organization, entity, or transaction. Trust is quantifiable and
decays over time without new evidence.

**Source:** KRM-RAO §2.7, Kadarn Manifesto (Permanent Principles)

**Kadarn example:** An organization's Trust Score starts at 0.5 (neutral)
and increases with each successful fulfillment, verified accreditation,
and positive QC record. A shipment breach or compliance incident reduces
the score.

---

## Economy

### Fulfillment

**Definition:** The complete lifecycle of delivering a Research Asset from
request to acceptance, including governance review, logistics, and
evidence collection.

**Source:** Ecosystem Reference Architecture §4.12 (Acceptance)

**Kadarn example:** A fulfillment begins when a sponsor requests 200
FFPE slides from a biobank, proceeds through MTA, collection, QC,
shipment, and ends when the sponsor confirms receipt and QC acceptance.

---

### Settlement

**Definition:** The financial completion of a fulfillment — payment
processing, fee calculation, and funds distribution among participants.

**Source:** Ecosystem Reference Architecture §4.14 (Settlement), KRM-RAO §5.7

**Kadarn example:** After a fulfillment is accepted, Kadarn calculates:
biobank fee ($50/slide × 200 slides = $10,000), courier fee ($500),
platform fee (3% = $315), and distributes $10,815 from escrow.

---

## Terms Not to Confuse

### Audit Trail vs Provenance

| Dimension | Audit Trail | Provenance |
|-----------|-------------|------------|
| Purpose | Who did what, when | How did this entity come to be |
| Granularity | User actions | Entity lifecycle with evidence |
| Structure | Flat log | Directed acyclic graph |
| Query | "Who accessed this record?" | "What is the complete history of this result?" |
| Kadarn example | `user_442 viewed specimen S-003 at 14:32` | `Specimen S-003 was collected → processed with protocol P-12 → QC passed (report R-88) → data derived at Assay A-7 → published as Dataset D-3` |

**Audit trail** answers accountability questions. **Provenance** answers
trust and reproducibility questions. Kadarn needs both.

---

### Workflow vs Policy

| Dimension | Workflow | Policy |
|-----------|----------|--------|
| Nature | Procedural | Declarative |
| Question | "What steps happen?" | "Is this allowed?" |
| State | Sequential state machine | Evaluation context |
| Change frequency | When process changes | When rules change |
| Kadarn example | Access Request workflow: Submit → Review → Approve → Fulfill | Policy: "Samples from IRB #2024-05 may only be used for oncology" |

**Workflows** orchestrate steps. **Policies** constrain decisions.
Workflows invoke policy evaluation at decision points.

---

### Sample Lifecycle vs Specimen Twin

| Dimension | Sample Lifecycle | Specimen Twin |
|-----------|------------------|---------------|
| State management | Status field | Event-sourced reconstruction |
| History | Last known state | Full provenance |
| Query capability | Current status | Current state, state at any point in time, simulation |
| Kadarn example | `specimens.status = 'shipped'` | Specimen Twin replays events: Collected → Aliquoted → QC Passed → Packed → Shipped → In Transit → Delivered |

**Sample Lifecycle** is a status tracker. **Specimen Twin** is an
event-sourced digital counterpart that can answer questions about any
point in its history.

---

### Document Vault vs Evidence Graph

| Dimension | Document Vault | Evidence Graph |
|-----------|----------------|----------------|
| Content | Stored documents | Structured evidence with relationships |
| Query | Search by metadata | Graph traversal: "what evidence supports this claim?" |
| Integrity | File hash | Immutable, linked, verifiable chain |
| Kadarn example | MTA_PDF_442.pdf stored in S3 | MTA_PDF_442 → signed by Org Director → references IRB #2024-05 → covers Specimens S-001 through S-200 → linked to Shipment SH-88 |

**Document Vault** stores files. **Evidence Graph** connects evidence to
entities and decisions, making it traversable and verifiable.

---

### AI Layer vs AI-Assisted Platform

| Dimension | AI Layer | AI-Assisted Platform |
|-----------|----------|---------------------|
| Architecture | Vertical module | Horizontal capability |
| Integration | API calls to a model | Embedded in every engine |
| Use case | "Ask AI to analyze this dataset" | "Policy Engine uses AI to classify ambiguous consent terms" |
| Kadarn change | Add `ai-layer/` package | AI assists Knowledge Engine, Policy Engine, Trust Engine, Matching Engine, and user interfaces |

**AI Layer** is a module. **AI-Assisted Platform** is an architectural
property where AI capabilities are available to all components. Kadarn
moves from the former to the latter.

---

### Governance vs Policy

| Dimension | Governance | Policy |
|-----------|------------|--------|
| Nature | Organizational capability | Declarative rule |
| Scope | Who decides, how review works | What is allowed or denied |
| Output | A governance framework | Individual policy rules |
| Kadarn example | The program's IRB + MTA + consent framework | `"IRB #2024-05 specimens may only be used for oncology"` |

**Governance** is the organizational capability and control function.
**Policy** is the declarative rule that Governance produces and the
Policy Engine executes. Governance determines *who decides*; Policy
determines *what is decided*.

---

### Compliance vs Trust

| Dimension | Compliance | Trust |
|-----------|------------|-------|
| Nature | Conformance to external obligation | Internally computed metric |
| Question | "Is this within the rules?" | "Can I rely on this partner?" |
| Source | Regulations, contracts, agreements | Evidence from past behavior |
| Kadarn example | HIPAA BAA active, IRB valid, MTA signed | Trust Score 0.92 from 47 successful shipments |

**Compliance** is conformance to an external obligation (regulatory,
contractual). **Trust** is the internally computed operational metric.
Compliance evidence can feed Trust scoring, but the two terms are not
interchangeable. An organization can be compliant but untrusted (e.g.,
newly certified but no track record).

---

### Trust vs Reputation

| Dimension | Trust | Reputation |
|-----------|-------|------------|
| Nature | Computed from verifiable evidence | Perception based on opinion |
| Quantifiability | Numeric score (0.0-1.0) | Not a Kadarn concept |
| Verifiability | Every score is traceable to evidence | Subjective |
| Kadarn status | Core platform concept | Excluded — not a system primitive |

**Trust** is a Kadarn platform concept — computed from verifiable
evidence, transparent, and actionable. **Reputation** is not a Kadarn
system concept and should not appear in product or contractual language.
Ratings, reviews, and subjective opinions are not trust inputs.

---

### Settlement vs Fulfillment

| Dimension | Fulfillment | Settlement |
|-----------|-------------|------------|
| Nature | Operational execution of a transaction | Financial closing of that transaction |
| Completeness | Can be complete without settlement | Must not close before fulfillment |
| State | FulfillmentAccepted, FulfillmentDisputed | SettlementInitiated, PaymentDistributed |
| Kadarn rule | Fulfillment can be complete while settlement is pending | Settlement closing before fulfillment is a data integrity violation |

**Fulfillment** is the operational execution of a transaction — all the
steps from request to acceptance. **Settlement** is specifically the
financial closing step. A fulfillment can be complete without settlement
(e.g., payment pending). A settlement must never close before its
fulfillment is complete — any data state showing this is an integrity
violation, not a valid lifecycle.
