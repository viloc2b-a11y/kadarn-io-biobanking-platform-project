# KEMS-001 — The Kadarn Confidence Graph Model
## How Kadarn Represents, Evaluates, and Communicates Institutional Evidence
### Version 1.0 | Foundational Document

---

## Preamble

This is not a technical specification for an algorithm. It is the epistemological foundation of Kadarn — the document that defines what it means for Kadarn to "know" something about an institution, and how that knowledge is represented, communicated, and updated over time.

Everything else in Kadarn — Trust Engine, Provenance Graph, Evidence Core, Policy Engine, Intelligence Engines — is an implementation of the principles contained here. If this document changes, the entire system must be reviewed.

This document supersedes any prior formulation of "Trust Score," "Verification," or "Institutional Certification" within Kadarn. Those concepts are retired. The concepts defined here replace them.

---

## First Principle

> **Kadarn never asserts institutional truth. Kadarn represents the current state of evidence supporting institutional claims.**

Kadarn never says: *"This site is excellent."*

Kadarn says: *"This capability is supported by the following evidence, from the following sources, accumulated over the following period of time."*

This single principle eliminates the majority of the philosophical, legal, and architectural problems that arise when a system attempts to "rate" or "certify" institutions. Kadarn does not rate. Kadarn does not certify. Kadarn accumulates, organizes, and represents evidence — and makes that evidence navigable.

---

## 1. The Fundamental Unit: A Claim

The fundamental unit of Kadarn is not a site. It is not an organization. It is not a score.

The fundamental unit is a **Claim** — a specific, bounded assertion about a specific institutional capability.

### What a Claim is

A Claim is a proposition about what an institution can do, has done, or maintains. It is always specific enough to be supported or contradicted by evidence.

**Examples of valid Claims:**
- "Can process PK samples within 30-minute centrifugation window"
- "Maintains -80°C storage with validated monitoring"
- "Has executed Phase I studies with overnight observation requirements"
- "Can recruit Parkinson's disease patients from its catchment area"
- "Processes FFPE tissue samples"
- "Has active GCP-trained staff"

**Examples of invalid Claims (too broad to be evidenced):**
- "Is a high-quality site" — not a Claim, this is a judgment
- "Is reliable" — not a Claim, this is a reputation label
- "Is compliant" — not a Claim, this is a certification statement

Every Claim in Kadarn must be specific enough that evidence can support or contradict it. A Claim that cannot be contradicted by any evidence is not a valid Claim.

### Why Claims, not Sites

The Confidence Graph belongs to a Claim, not to a site. A site does not have a single confidence score. It has many Claims, each with its own evidence graph, each with its own confidence state.

This design choice has three consequences:

1. A sponsor looking for a site that can process PK samples sees the evidence graph for *that specific capability* — not an aggregate score that hides whether the site is good at logistics but bad at complex samples.
2. A site cannot "game" a global score by being very good at some things while hiding weaknesses in others. Each Claim stands on its own evidence.
3. Kadarn can evolve specific Claims without disrupting others. A site's -80°C storage capability remains high-confidence even if a different Claim (overnight PI availability) degrades.

---

## 2. The Confidence Graph

Each Claim has a Confidence Graph. The Confidence Graph has four components.

### Component A: The Claim

A specific, bounded assertion. See Section 1 for definition and examples.

### Component B: Evidence Nodes

The Evidence Nodes are the actual pieces of evidence that support or contradict a Claim. Each Evidence Node is not a document — it is a structured object with the following properties:

| Property | Description |
|---|---|
| **Content** | What the evidence says |
| **Source** | Who produced this evidence |
| **Date** | When this evidence was produced |
| **Type** | The Evidence Class (see Section 3) |
| **Provenance** | How Kadarn received this evidence |
| **Expiration** | Whether this evidence degrades over time |
| **Weight** | The relative contribution of this node to the Claim |

### Component C: Relationships

Evidence Nodes do not simply accumulate — they relate. Some evidence supports a Claim directly. Some evidence supports other evidence. Some evidence contradicts other evidence.

**Example relationship graph for "Can process PK samples":**

```
Equipment Certificate (centrifuge, calibrated 2024)
        │
        supports
        │
        ▼
    PK Sample Processing  ◄────────────────────────────────┐
        ▲                                                   │
        │ supports                                    supports
        │                                                   │
Training Record (PK protocol)              Operational Record (47 PK collections
        │                                  in ClinicalTrials.gov-registered studies)
        supports                                            │
        │                                             Class C Evidence
Temperature Log (within-window processing)
```

This structure allows Kadarn to reason about the *architecture* of evidence, not just its quantity. Many weak pieces of corroborating evidence supporting each other is structurally different from one strong piece of independent evidence. Both matter, but differently.

### Component D: Confidence State

The Confidence State is the observable output of the Confidence Graph. It has three properties:

**Confidence Value:** A number between 0 and 100, representing the current aggregate strength of evidence supporting the Claim. This number is *not* produced by a fixed formula — it is a property emergent from the graph. See Section 5.

**Confidence Level:** A qualitative interpretation of the value: High / Moderate / Low / Insufficient. These thresholds may be adjusted by context (a sponsor with different risk tolerance sees different thresholds, but the underlying value does not change).

**Last Updated:** The timestamp of the most recent evidence change that affected this Confidence State.

---

## 3. Evidence Classes

Not all evidence is equal. Kadarn categorizes evidence into six Evidence Classes, ordered from most to least independently verifiable.

### Class A — Public Independent Evidence

Evidence sourced from public registries and regulatory databases that Kadarn can verify independently without relying on the site or any counterparty.

**Sources:** ClinicalTrials.gov, PubMed, FDA inspection databases, IRB approval records, professional licensing registries.

**Characteristics:** High independence, moderate specificity. Confirms that studies happened and that investigators exist — but rarely confirms operational quality or capability depth.

**Contribution to Confidence:** High weight per node, low requirement for corroboration.

### Class B — Institutional Documentary Evidence

Evidence sourced from the institution itself, in the form of structured documents with internal verifiability characteristics.

**Sources:** SOPs (signed, versioned, dated), calibration certificates, equipment maintenance logs, training records, CAPA documentation, shipping logs, chain of custody records.

**Characteristics:** Moderate independence (Kadarn cannot verify authenticity externally), high specificity. Kadarn can verify internal consistency (dates, signatures, sequences, logical coherence) even without external verification.

**Contribution to Confidence:** Medium weight per node. Multiple Class B nodes from different document types corroborate each other.

### Class C — Operational Evidence

Evidence generated automatically by Vilo Execution Systems as a direct byproduct of operational activity. This is the highest-quality evidence for operational capability claims because it is generated in real time, without deliberate composition, as a side effect of doing the work.

**Sources:** CollectionCompleted events, ShipmentReleased events, TemperatureRecorded events, QCApproved events, ProcessingCompleted events — all generated by Vilo modules during actual execution.

**Characteristics:** High specificity, high integrity (cannot be retroactively composed), directly tied to actual operational execution. Cannot be faked without executing the actual operation.

**Contribution to Confidence:** High weight per node. Class C evidence is the primary mechanism through which Kadarn's confidence in active sites grows over time.

### Class D — Cross-Source Corroboration

Not a primary evidence source, but a structural property of the graph. Cross-Source Corroboration occurs when two or more independent sources from different Classes make claims that are consistent with each other.

**Example:** A site declares "We processed 400 PBMC samples in 2023" (Class B self-declaration). ClinicalTrials.gov shows the site participated in 3 immunology studies in 2023 (Class A). The two are mutually consistent, raising confidence in both.

**Characteristics:** Corroboration is detected by Kadarn automatically. It cannot be manufactured by the site alone because it requires independent agreement from sources outside the site's control.

**Contribution to Confidence:** Corroboration multiplies the weight of the corroborating nodes — it does not add new evidence, but it increases the reliability of existing evidence.

### Class E — Temporal Continuity Evidence

Evidence that a capability has been maintained consistently over time. This Evidence Class is unique because it does not verify a single fact — it verifies that a history is coherent.

**What Kadarn checks:**
- Are the dates of evidence nodes sequentially consistent?
- Is the volume of claimed activity consistent with the declared infrastructure?
- Do certifications and training records show renewal patterns consistent with active use?
- Is the gap between evidence nodes consistent with the declared operational cadence?

**Example of a Temporal Continuity signal:** A site claims to have processed samples for 7 years, but its earliest document has a timestamp of 18 months ago. This is a temporal discontinuity — not proof of fraud, but a signal that the history is incomplete or inconsistent, which Kadarn marks explicitly.

**Contribution to Confidence:** Temporal Continuity evidence does not add to a specific Claim's count — it modulates the weight of all other evidence. A Claim supported by evidence that shows consistent temporal continuity is worth more than the same Claim supported by the same number of evidence nodes all submitted at once.

### Class F — External Confirmation

Evidence provided by an independent third party who confirms a specific capability or event from their own records.

**Sources:** CRO confirmation of study completion, central laboratory confirmation of sample receipt and acceptance rates, IRB confirmation of approval history, sponsor confirmation of study performance.

**Characteristics:** Highest independence, highest specificity. Requires active cooperation from the confirming party.

**Contribution to Confidence:** Highest weight per node. A single Class F confirmation of a specific capability outweighs multiple Class B documentary nodes for that same capability.

**Operational note:** Class F evidence is not required for Kadarn to function. The system is designed so that Classes A through E provide meaningful and usable confidence levels without any external confirmation. Class F is the enhancement layer — it increases precision and reduces residual uncertainty for sponsors who require higher confidence for specific decisions.

---

## 4. Counter Evidence and Confidence Degradation

Confidence is not only additive. Evidence can decrease Confidence.

Kadarn maintains Counter Evidence nodes alongside supporting Evidence nodes. Counter Evidence follows the same structure and Evidence Classes as supporting evidence, but carries negative weight relative to a Claim.

**Examples of Counter Evidence:**

| Counter Evidence Event | Affected Claim | Effect |
|---|---|---|
| Temperature excursion recorded by IoT sensor | Cold Chain Capability | Decreases confidence |
| Calibration certificate expired without renewal | Sample Processing | Decreases confidence |
| CAPA opened for repeated deviation | Protocol Adherence | Decreases confidence |
| Audit finding on delegation log | Regulatory Readiness | Decreases confidence |
| Study withdrawn by site | Completion Reliability | Decreases confidence |

Counter Evidence is not hidden. It is visible to any party with appropriate access permissions (see Section 6). A site may respond to Counter Evidence with additional evidence — a CAPA resolution, a renewed certificate, an auditor's closure confirmation — which constitutes new supporting evidence that moves the Confidence State forward.

The principle of Counter-Provenance applies here: no evidence is deleted. The history of a finding, a CAPA, a resolution, and a sponsor acceptance is preserved in sequence. The full chain is visible to authorized parties. What changes is the Confidence State, not the record.

---

## 5. Confidence as an Emergent Property

Confidence is not calculated by a fixed formula.

This is a deliberate design choice, not an oversight. A fixed formula (e.g., "Class A nodes count 3 points, Class B nodes count 1 point") would be:
- Gameable by sites that learn the formula and optimize evidence submission accordingly
- Brittle to new Evidence Classes that do not fit the original weighting
- Semantically wrong — the appropriate weight of evidence depends on context (a sponsor evaluating overnight capability needs different evidence strength than one evaluating cold chain logistics)

Instead, Confidence is a property emergent from the graph structure. Kadarn's Intelligence Engines evaluate the graph and produce a Confidence Value based on:
- The number and diversity of Evidence Nodes
- The Evidence Classes represented and their independence from each other
- The presence or absence of Cross-Source Corroboration (Class D)
- The Temporal Continuity pattern (Class E)
- The presence and resolution status of Counter Evidence
- The recency of evidence relative to the Claim's natural decay rate

The specific algorithm used by each Intelligence Engine to evaluate this graph may evolve. The graph itself — its structure, its nodes, its relationships — remains stable regardless of how it is evaluated. This separation means that improving Kadarn's intelligence does not require changing the fundamental data model.

---

## 6. Explainability: Every Number Has a "Why"

No Confidence Value in Kadarn is ever presented without its explanation. This is not a feature — it is a requirement.

A Confidence Value of 91 without explanation is equivalent to a black-box rating. A sponsor has no way to determine whether they agree with the 91, whether it reflects the dimensions they care about, or whether it is driven by evidence they consider reliable.

The mandatory explanation format for every Confidence Value is:

```
Capability: PK Sample Processing
Confidence: 91 — High

Supported by:
  ● 4 studies registered in ClinicalTrials.gov in relevant indications
  ● Equipment calibration certificate (centrifuge), current
  ● Equipment calibration certificate (refrigerated centrifuge), current
  ● GCP training records, 3 staff members, current
  ● 47 operational processing records (Vilo Execution, 2022–2024)
  ● No temperature excursions recorded in associated shipments

No contradictions found.
Last evidence update: 14 days ago.
```

The explanation must be navigable — a sponsor or site must be able to click on any item in the explanation and see the underlying Evidence Node, including its source, date, and provenance.

A Confidence Value that cannot be explained at this level of detail is not a valid Confidence Value in Kadarn.

---

## 7. Visibility — Who Sees What

The Confidence Graph is not uniformly visible to all parties. Visibility is governed by policy and by the site's own permissions.

### The Site

The site sees its complete Confidence Graph — all Claims, all Evidence Nodes (including Counter Evidence), all relationships, all Confidence States. The site can:
- Add new evidence to any Claim
- Submit a Right of Response to any Counter Evidence node
- Authorize or restrict sponsor access to specific Claims
- See exactly what any authorized sponsor sees before that sponsor sees it

### The Sponsor

The sponsor sees only what the site has authorized. Within that authorized set, the sponsor sees:
- The Confidence Value and Level for each authorized Claim
- The full explanation (Evidence Node list) for each authorized Claim
- Counter Evidence nodes and their resolution status
- The temporal continuity signal (how long the capability has been maintained)

The sponsor does not see: raw document contents (only their metadata and existence), other sponsors' confirmation data (if any), or Claims the site has not authorized for this relationship.

### Kadarn

Kadarn's systems see the complete graph for all entities, for the purpose of computing Confidence States, detecting internal inconsistencies, and identifying Temporal Continuity patterns. Kadarn does not expose this cross-entity view to any external party.

---

## 8. The Right of Response

Every Counter Evidence node in Kadarn can receive a Right of Response from the institution it concerns.

A Right of Response is a new Evidence Node — it does not modify or delete the Counter Evidence it responds to. It is attached to the Counter Evidence node as a linked response, visible to any party who sees the original Counter Evidence.

**Structure of a Right of Response:**
- Description of the corrective action taken
- Date of resolution
- Supporting evidence for the resolution (CAPA closure, renewed certificate, auditor confirmation)
- Current status (pending, resolved, sponsor-accepted)

A Right of Response that is subsequently confirmed by the original Counter Evidence source (e.g., a CRO confirms that a CAPA was satisfactorily resolved) becomes a Class F External Confirmation attached to the resolution.

The principle is simple: the history is immutable, but the narrative can grow. A finding from 2022 that was resolved in 2022 and confirmed by the sponsor in 2023 is a very different picture than a finding from 2022 with no response. Both are visible. The Confidence State reflects the full chain.

---

## 9. Temporal Decay

Evidence has a natural lifespan. A calibration certificate from 2019 says less about current capability than one from last month. A study completed in 2018 is less relevant than one completed in 2024.

Kadarn applies temporal decay to Evidence Nodes based on their type and the nature of the Claim they support. The decay parameters are:

| Evidence Type | Decay Rate | Rationale |
|---|---|---|
| Equipment calibration certificate | High (12 months) | Certificates expire; capability may have degraded |
| GCP training records | Medium (24 months) | Training requires renewal; knowledge degrades |
| Study participation (Class A) | Low (60 months) | Experience remains relevant longer |
| Operational records (Class C) | Very low — but accumulate | Recent operations are most relevant but old ones still count |
| Counter Evidence (unresolved) | None — does not decay | Unresolved findings remain at full weight until addressed |
| External Confirmations (Class F) | Low (36 months) | Relationships evolve but historical confirmations remain meaningful |

Temporal decay does not delete evidence. It reduces the weight of older evidence in the Confidence calculation. The evidence node remains in the graph, permanently, for the purposes of continuity verification and historical record.

---

## 10. The Closing Principle

> **Confidence is not a judgment. Confidence is the observable consequence of accumulated, explainable, time-aware evidence.**

Kadarn's role is not to tell sponsors which sites to trust. Kadarn's role is to make the evidence that already exists — scattered across documents, systems, public registries, and operational records — navigable, structured, and comparable.

A sponsor who chooses a site based on a Kadarn Confidence Graph is not outsourcing their judgment to a system. They are making the same judgment they always made — but with evidence that is structured, sourced, time-stamped, and explainable, rather than based on a feasibility questionnaire and a personal relationship with a CRA.

That is Kadarn's contribution. Not truth. Navigable evidence.

---

## Appendix A: Terms Retired by This Document

The following terms, used in prior Kadarn documentation, are retired and replaced by the concepts defined in KEMS-001:

| Retired Term | Replacement |
|---|---|
| Trust Score | Confidence State (per Claim) |
| Verified | Supported by Evidence (with Class and source) |
| Certification | External Confirmation (Class F) |
| Trust Level (Gold/Silver/Bronze) | Confidence Level (High/Moderate/Low/Insufficient) |
| Institution Quality | Confidence Graph (set of Claims with evidence) |

---

## Appendix B: Open Questions (Not Resolved by This Document)

The following questions are acknowledged as unresolved and will be addressed in subsequent specifications:

1. **Confidence algorithm specifics:** The exact method by which Intelligence Engines translate graph structure into a Confidence Value is not specified here. This is intentional — the algorithm is implementation-level, not doctrine-level. A separate ADR will govern the first reference implementation.

2. **Derived Signals and Federated Feedback:** Whether and how aggregate signals from Confidence calculations (not raw evidence) can be shared across the network without exposing proprietary models. Identified as a separate design domain in the Semantic Freeze v2.0.

3. **Claim taxonomy:** The canonical list of valid Claims in Kadarn is not defined here. A separate document (Claim Taxonomy v1.0) will enumerate the initial set of Claims for the Biospecimen Execution domain.

4. **Third-party Engine certification:** The governance process by which a third party may build an Intelligence Engine that consumes Kadarn's Confidence Graphs is not defined here. This depends on the Core/Certified/Private Engine governance decision (pending ADR).
