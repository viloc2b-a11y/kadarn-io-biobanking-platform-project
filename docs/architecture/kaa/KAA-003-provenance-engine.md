# KAA-003 — Provenance Engine
## Kadarn Provenance Engine Architecture — W3C PROV Adoption Assessment

**Status:** Draft  
**Version:** 1.0

---

## 1. Why This Capability Exists

Biospecimen research operates on a fundamental premise: the value of a sample is
inseparable from its history. A tumor biopsy without documented collection
conditions, consent provenance, and chain of custody is not a research asset — it
is an unverifiable object. Regulatory frameworks (21 CFR Part 11, GDPR, HIPAA,
GCP) do not just recommend provenance tracking; they require it as a condition of
scientific validity and legal defensibility.

Kadarn currently stores provenance data across three tables: `provenance_nodes`,
`provenance_edges`, and `provenance_evidence`. The schema is present. The problem
is what it lacks: a semantic model. A `provenance_node` with `node_type = 'specimen'`
has no formal relationship to the concept of an Entity in the W3C PROV sense. An
edge connecting two nodes has no machine-readable meaning. The graph exists, but
it cannot answer the questions that regulators, sponsors, and auditors actually ask:

- Who collected this sample, under what consent, at what time?
- What transformations has this aliquot undergone since collection?
- Was every step in this chain performed by a certified actor?
- Can I trace this dataset back to the original donor consent?

Without a standard model, provenance data cannot be validated, cannot be exchanged
with external systems, and cannot be used as legal evidence. With W3C PROV, it can
do all three.

---

## 2. Responsibility Stack

| Layer | Owner | Question it answers |
|---|---|---|
| Identity | Auth (Supabase JWT) | Who is this actor? |
| Policy | Policy Engine (OPA) | Can this actor perform this action? |
| Workflow Orchestration | Workflow Engine (Temporal) | What steps run, in what order, with what guarantees? |
| **Provenance** | **Provenance Engine (W3C PROV)** | **What is the complete, verifiable history of this entity?** |
| Data Authorization | PostgreSQL RLS | Can this actor see these rows? |
| Business Logic | Kadarn Engines | What does the system do within each step? |
| Persistence | PostgreSQL | Where do the data live? |
| Audit | Audit Engine | What business actions occurred? |
| Events | Event Bus | What changed in system state? |

The Provenance Engine sits alongside the execution stack, not inside it. It records
what happened — it does not decide what should happen, and it does not control the
flow of execution.

---

## 3. Why Not Build It Ourselves?

The alternative of maintaining a proprietary graph model in `provenance_nodes` and
`provenance_edges` without a semantic standard was evaluated and rejected.

**Interoperability.** Biospecimen research is an ecosystem, not an island. Sponsors,
CROs, IRBs, regulatory bodies, and partner institutions all need to exchange
provenance records. A proprietary format requires custom integrations with every
partner. W3C PROV is an international standard with implementations in every major
language and recognized by FDA, EMA, and the broader research computing community.

**Legal defensibility.** Regulatory submissions require provenance chains to be
expressed in a format that auditors can validate with independent tools. A
proprietary JSON schema is not independently validatable. A W3C PROV document is.

**Semantic precision.** W3C PROV defines three entity types — Entity, Activity,
Agent — and a fixed set of relations between them. This precision prevents the
ambiguity that plagues custom provenance schemas: "was this node the thing that
was acted on, or the thing that acted?" In PROV, that question has an exact answer.

**Query completeness.** PROV's model supports backward tracing (what is the full
history of this entity?) and forward tracing (what was derived from this entity?)
without ambiguity. Building equivalent query semantics on a custom graph model
requires solving the same problems PROV already solved.

**Focus.** Kadarn's problem is not designing a provenance data model. It is
recording the chain of custody for biological material in a way that satisfies
scientific, regulatory, and legal requirements. W3C PROV solves the first;
Kadarn applies it to the second.

---

## 4. Scope of Authority

**The Provenance Engine may:**
- Record that an Entity exists (a specimen, an aliquot, a dataset, a consent document)
- Record that an Activity occurred (a collection, a processing step, a transfer, an
  analysis)
- Record that an Agent was responsible (a person, an organization, a system)
- Record the relationships between them: `wasGeneratedBy`, `used`, `wasAttributedTo`,
  `wasDerivedFrom`, `wasAssociatedWith`, `actedOnBehalfOf`
- Validate that a provenance chain is complete and internally consistent
- Expose the provenance graph for query, audit, and external exchange

**The Provenance Engine never:**
- Decides whether an action is authorized (that is OPA)
- Executes or orchestrates steps (that is Temporal)
- Modifies the business state of a specimen, shipment, or program
- Enforces chain-of-custody rules (it records them; OPA enforces them)
- Replaces the Audit Engine (audit records business events; PROV records entity
  history)

---

## 5. Technology Selected: W3C PROV

W3C PROV is not a software library — it is a data model and a family of serialization
formats (PROV-DM, PROV-O, PROV-JSON, PROV-XML). Kadarn adopts the conceptual model
universally, and PROV-JSON as the serialization format for storage and exchange.

The existing `provenance_nodes` and `provenance_edges` tables are re-mapped to PROV
semantics without schema migration. The mapping is a semantic layer, not a data move.

```
Kadarn Engine executes an action
    │
    ├─ Action completes successfully
    │        │
    │   Provenance Engine records:
    │   ├─ Entity (the thing that was produced or used)
    │   ├─ Activity (what happened)
    │   ├─ Agent (who was responsible)
    │   └─ Relations between them
    │        │
    │   Provenance node written to provenance_nodes
    │   Provenance edges written to provenance_edges
    │   Evidence written to provenance_evidence
    │        │
    └─ Domain event emitted (ProvenanceNodeRecorded)
```

Provenance is always recorded after the fact — it describes what happened, never
prescribes what should happen.

---

## 6. Core Concepts

**Entity.** A thing that has provenance — a specimen, an aliquot, a QC result, a
consent document, a dataset, a policy evaluation record. In Kadarn's schema,
Entities map to `provenance_nodes` with node types: `specimen`, `aliquot`,
`qc_result`, `consent`, `document`, `dataset`.

**Activity.** Something that happened over a period of time and acted upon or
generated Entities — a collection procedure, a processing step, a shipment, an
access request, a program milestone. In Kadarn's schema, Activities map to
`provenance_nodes` with node types: `shipment`, `access_request`, `protocol`,
`program`.

**Agent.** Something that bears responsibility for an Activity — a person, an
organization, or a software system. In Kadarn, Agents are Organizations and Users,
referenced via `organization_id` in provenance nodes.

**Relations.** The typed edges that connect Entities, Activities, and Agents:

| Relation | Meaning in Kadarn |
|---|---|
| `wasGeneratedBy` | This aliquot was generated by this processing activity |
| `used` | This processing activity used this specimen |
| `wasAttributedTo` | This consent document was attributed to this donor organization |
| `wasDerivedFrom` | This dataset was derived from these aliquots |
| `wasAssociatedWith` | This collection activity was associated with this clinical site |
| `actedOnBehalfOf` | This CRO acted on behalf of this sponsor |

---

## 7. Interaction with Kadarn Data

The Provenance Engine reads from and writes to three existing tables:

```
provenance_nodes        — Entities and Activities
provenance_edges        — Relations between nodes (PROV relations)
provenance_evidence     — Supporting evidence for nodes (hash, reference, type)
```

The semantic mapping applied to existing node types:

| node_type | PROV Type | Domain |
|---|---|---|
| specimen | Entity | Asset |
| aliquot | Entity | Asset |
| qc_result | Entity | Asset |
| consent | Entity | Consent |
| document | Entity | Consent / Governance |
| dataset | Entity | Settlement / Analytics |
| shipment | Activity | Logistics |
| access_request | Activity | Exchange |
| protocol | Entity | Governance |
| program | Entity | Governance |
| policy_evaluation | Entity | Governance |

RLS governs what provenance records each actor can read. The Provenance Engine does
not bypass RLS — provenance queries run under the actor's session context.

The Provenance Engine does not write to business tables (`specimens`,
`logistics_shipments`, `programs`, etc.). It only writes to its own three tables.
The business state and the provenance record are maintained separately.

---

## 8. Interaction with Other Engines

**OPA (Policy Engine):** OPA evaluates whether an actor can query the provenance
graph for a given entity (`processing.chain_of_custody` policy). OPA also uses
provenance evidence as context input during policy evaluation — a chain-of-custody
check may require verifying that a PROV chain is complete. Policy decisions
themselves are recorded as provenance nodes (`node_type = 'policy_evaluation'`),
creating a provenance record of governance decisions.

**Temporal (Workflow Engine):** Each Activity in a Temporal workflow that produces
or modifies material triggers a provenance recording. The Temporal `workflowId` is
stored in the provenance node's `properties` field, creating a bidirectional link
between the workflow execution history and the provenance graph. Temporal captures
the process; PROV captures the material chain of custody.

**Audit Engine:** `audit_events` records that a user performed an action (a
`org_admin` approved a shipment at timestamp T). `provenance_nodes` records that
a shipment Activity occurred and what Entities it used and generated. These are
different records answering different questions — audit answers "what did the actor
do?" and PROV answers "what is the verifiable history of this material?"

**Event Bus:** `ProvenanceNodeRecorded` events notify downstream consumers when a
new node is added to the graph. The KOC Provenance Feed subscribes to these events
for real-time display. The Trust Engine can use provenance completeness as an input
to trust score calculation.

**Exchange Engine:** When a deal closes and a dataset is transferred, the Exchange
Engine records a PROV chain connecting the dataset (`wasDerivedFrom` aliquots,
`wasAttributedTo` the donor organization, `wasAssociatedWith` the exchange activity).
The receiving party receives the PROV chain alongside the dataset.

**KPE (Kadarn Proof of Execution):** The provenance dimension of KPE scoring reads
directly from `provenance_nodes` and `provenance_evidence`. A program with complete
provenance chains scores higher on the provenance KPE dimension than one with
missing evidence or broken chains.

---

## 9. Ownership Boundaries

The Provenance Engine records provenance for every Engine in Kadarn. Recording
ownership follows the Engine that performed the action.

| Provenance Record | Recording Owner | Subject Entity / Activity |
|---|---|---|
| Specimen collection node | Processing Engine | `specimen` Entity |
| Aliquot derivation | Processing Engine | `aliquot` Entity, `wasDerivedFrom` relation |
| QC result | Processing Engine | `qc_result` Entity |
| Consent document | Governance Engine | `consent` Entity |
| Shipment activity | Logistics Engine | `shipment` Activity |
| Access request | Exchange Engine | `access_request` Activity |
| Dataset settlement | Exchange Engine | `dataset` Entity, `wasDerivedFrom` chain |
| Protocol record | Governance Engine | `protocol` Entity |
| Policy evaluation | Policy Engine (OPA) | `policy_evaluation` Entity |
| Program milestone | Program Engine | `program` Activity |

The Provenance Engine provides the recording infrastructure. The owning Engine
is responsible for calling it at the right moment and with the correct data.

---

## 10. Granularity

**Deserves a provenance node if:**
- The thing has a legal or regulatory identity (specimen, consent, dataset)
- The action has chain-of-custody implications (collection, processing, transfer)
- The record may need to be presented to an external auditor, IRB, or regulator
- The entity or activity is referenced in a KPE dimension

**Does not deserve a provenance node:**
- Internal system state changes with no material or legal implication
- Transient computation results (scores computed on the fly, not persisted)
- User interface interactions with no downstream provenance consequence
- Duplicate recording of what the Audit Engine already captures adequately

**Wrong:** recording a provenance node every time a user views a specimen page.
That is an audit event, not a provenance record.

**Right:** recording a provenance node when a specimen is divided into aliquots,
with `wasDerivedFrom` edges connecting each aliquot to the source specimen and a
`wasAssociatedWith` edge linking the division activity to the processing technician.

---

## 11. Provenance Taxonomy

**Material Provenance** — the chain of custody of physical biological material.
- Specimen collection → aliquot derivation → QC → storage → shipment → processing
- Critical for regulatory compliance and scientific reproducibility

**Consent Provenance** — the documented authorization from donors.
- Consent given → consent scope → consent version → re-consent events
- Critical for GDPR, HIPAA, and research ethics compliance

**Data Provenance** — the lineage of digital artifacts derived from material.
- Aliquots → analysis → dataset → derived dataset
- Critical for scientific reproducibility and data sharing agreements

**Exchange Provenance** — the chain of agreements that authorized a transfer.
- MTA signing → transfer authorization → delivery → dataset receipt
- Critical for IP protection and legal defensibility

**Governance Provenance** — the record of decisions and approvals.
- IRB approval → protocol version → program activation → milestone approval
- Critical for regulatory submissions and audit trails

**Policy Provenance** — the record of policy decisions made by OPA.
- Policy evaluation → decision record → enforcement event
- Critical for demonstrating due diligence in access control

---

## 12. Compensation and Failure Handling

Provenance records are append-only by design. They are never deleted, never updated,
and never rolled back. This is not a technical constraint — it is a regulatory one.
A chain of custody that can be retroactively modified is not a chain of custody.

**Handling incorrect provenance records:**

*A provenance node was recorded with incorrect data.* A correction node is appended
with `node_type = 'correction'`, referencing the incorrect node via a
`wasRevisionOf` edge and documenting what was wrong and who made the correction.
The original node is preserved.

*A specimen was later found to be mislabeled.* A `Retraction` Activity node is
recorded, `wasAssociatedWith` the correction actor, linking via `invalidated` edge
to the affected nodes. The provenance chain now includes the retraction as part of
the authoritative history.

*A workflow was compensated and a shipment was cancelled.* The cancellation is a
new Activity node in the provenance graph. The shipment Activity node is not
deleted — its terminal state is part of the material's history.

**Failure during provenance recording:**

If the provenance write fails, the business action that preceded it does not roll
back. Provenance recording is a side effect, not a precondition. The failure is
logged as a `provenance_recording_error` domain event, and the recording is retried
asynchronously. The gap in the chain is visible to the KOC Provenance Feed and is
flagged with `integrity_status = 'missing_evidence'`.

---

## 13. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Provenance graph grows unbounded over years | High | Medium | Partition `provenance_nodes` by `recorded_at`; archive old partitions to cold storage |
| Engines forget to record provenance for critical actions | High | High | Provenance recording checklist in Engine development guide; KPE scoring creates audit pressure |
| Incorrect PROV relations recorded (wrong edge types) | Medium | High | PROV relation validator in the recording API; test coverage per relation type |
| Provenance records become out of sync with business state | Medium | High | `integrity_status` field surfaces gaps; KOC Provenance Feed monitors chains |
| External parties cannot consume PROV-JSON output | Low | Medium | PROV-JSON is an international standard; provide validation endpoint for partners |
| Retroactive modification requests from partners | Low | High | Policy: provenance is append-only; corrections use `wasRevisionOf` pattern |

---

## 14. Exit Strategy

**What belongs to Kadarn and survives a replacement:**
- All provenance data in `provenance_nodes`, `provenance_edges`, and
  `provenance_evidence` belongs to Kadarn's PostgreSQL database. It is not stored
  in any external service.
- The PROV data model is an open international standard. Every record written in
  PROV semantics can be read, validated, and exported using any PROV-compatible
  tool, regardless of whether Kadarn's implementation layer changes.
- The provenance taxonomy (material, consent, data, exchange, governance, policy)
  is a Kadarn architecture decision, not a W3C PROV concept.
- The `integrity_status` logic and the KPE provenance dimension scoring are Kadarn
  intellectual property.

**What is coupled to W3C PROV:**
- The semantic model: Entity, Activity, Agent, and the six standard relations. If
  Kadarn adopts a different provenance standard, the existing records remain valid
  as W3C PROV documents — they do not become invalid, they become the migration
  source.
- The PROV-JSON serialization format used for external exchange. This is a
  serialization choice, not a storage dependency.

**Migration path if replacement is needed:**
1. `provenance_nodes` and `provenance_edges` remain in PostgreSQL. No data
   migration is needed.
2. The semantic mapping (node_type → PROV type, edge_type → PROV relation) is
   expressed in the Provenance Engine's recording layer. Remapping to a new
   standard modifies that layer, not the data.
3. External partners who received PROV-JSON documents retain valid records under
   the W3C PROV standard independently of Kadarn's internal changes.

**Acceptable coupling:** The W3C PROV data model is an open international standard
maintained by the W3C Provenance Working Group. It is not a vendor technology.
Adopting it creates no commercial dependency. The coupling is to a stable,
open specification — the most durable form of coupling available.

---

## 15. Future Capabilities

| Domain | Future capabilities |
|---|---|
| Material | Automated chain-of-custody gap detection with regulatory alert |
| Consent | Cross-jurisdictional consent validity verification |
| Data | Re-identification risk scoring from data lineage graph |
| Exchange | Multi-hop transfer chain with full PROV documentation per hop |
| Governance | Automated regulatory submission package generation from PROV graph |
| Policy | Policy decision provenance linked to regulatory framework citations |
| AI | Training data lineage — what data was used to train which model version |
| Analytics | Reproducibility verification — can this result be derived from this PROV chain? |
| Trust | Trust score contribution from provenance completeness per organization |

---

## 16. Future Integrations

```
                    ┌─────────────────────────────┐
                    │   W3C PROV Provenance Engine  │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
    ┌────▼────┐              ┌─────▼─────┐            ┌──────▼──────┐
    │OPA      │              │Temporal   │            │KPE          │
    │Policy   │              │Workflow   │            │Scoring      │
    │Engine   │              │Engine     │            │Engine       │
    └────┬────┘              └─────┬─────┘            └──────┬──────┘
         │                         │                         │
    ┌────▼────┐              ┌─────▼─────┐            ┌──────▼──────┐
    │Exchange │              │Event Bus  │            │OpenTelemetry│
    │Engine   │              │Domain     │            │Observability│
    └─────────┘              └─────┬─────┘            └─────────────┘
                                   │
                            ┌──────▼──────┐
                            │FHIR Layer   │
                            │(Future)     │
                            └─────────────┘
```

- **OPA:** Provenance completeness is input context for chain-of-custody policies.
  Policy decisions are recorded as provenance nodes. The two engines are mutually
  informing without either controlling the other.
- **Temporal:** Each Temporal Activity that produces or modifies material triggers
  provenance recording. The `workflowId` links the execution history to the
  provenance graph bidirectionally.
- **KPE Scoring:** The provenance dimension of KPE reads directly from the graph.
  Provenance completeness is a quantifiable, auditable input to program scores.
- **Event Bus:** `ProvenanceNodeRecorded` events notify the KOC Feed, the Trust
  Engine, and any external subscriber in real time.
- **FHIR (future):** Biospecimen provenance expressed in W3C PROV can be mapped
  to FHIR Provenance resources for interoperability with clinical systems. The
  semantic overlap between PROV and FHIR Provenance is substantial — the mapping
  is straightforward when both are in use.
- **OpenTelemetry:** Provenance recording operations emit trace spans. Recording
  latency, graph size growth, and integrity check duration are visible in the
  observability dashboard.

---

## 17. Architectural Decision

W3C PROV is adopted as **the semantic model and data standard for Kadarn's
Provenance Engine**. It does not replace PostgreSQL as the storage layer, does not
replace the Audit Engine, and does not control the execution of any business process.

W3C PROV gives Kadarn the ability to express the chain of custody for biological
material, consent, data, and governance decisions in an internationally recognized,
legally defensible, and externally interoperable format — something a proprietary
schema cannot provide.

**Non-negotiable constraints:**
- Provenance records are append-only — no deletions, no in-place updates
- Corrections use the `wasRevisionOf` pattern, never overwrites
- Provenance recording is a side effect of business actions, never a precondition
- The Provenance Engine does not write to business tables
- Every Engine that produces or modifies material is responsible for triggering
  provenance recording at the correct moment

The detailed technical design — PROV-JSON serialization, recording API, graph query
layer, integrity validation, KPE integration, external exchange format — is the
subject of KAA-003-B: Provenance Engine Technical Design.
