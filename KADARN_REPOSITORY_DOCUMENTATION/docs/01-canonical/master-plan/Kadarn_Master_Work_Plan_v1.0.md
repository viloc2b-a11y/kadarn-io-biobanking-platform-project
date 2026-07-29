# KADARN — Master Work Plan v1.0
### Comprehensive Implementation Plan Following Strategic Session
### Prepared for: Engineering, Architecture, and Strategy Alignment

---

## How to Read This Document

This plan is the result of an extended strategic session that covered competitive analysis, architectural refinement, business model design, and epistemological foundations. It is structured in four parts:

**Part 1 — What to Modify:** existing documents and architectural decisions that need to change.
**Part 2 — What to Add:** new artifacts, modules, and capabilities to build.
**Part 3 — What to Archive:** concepts, terminology, and approaches formally retired.
**Part 4 — Implementation Sequence:** ordered execution plan with dependencies and success criteria.

This document covers Kadarn only. Vilo OS is a separate product with its own work plan. The relationship between them is defined in §2.8 but the implementation of Vilo OS is not covered here.

---

# PART 1 — WHAT TO MODIFY

## 1.1 Manifesto v1.1 → v1.2

**File:** `docs/architecture/kadarn-manifesto.md`

**Changes required:**

**§2.3 "What Kadarn Is" — already updated, confirm canonical statement:**
> "Kadarn is execution infrastructure for biospecimen and Research Asset programs, built around a platform for Research Asset Orchestration."

**Add §2.8 "What Kadarn Is Not" — new section, required:**
- Not a site directory or marketplace (that is what Inato does)
- Not a CTMS or study management system (that is what SiteVault, CRIO, Florence do)
- Not a LIMS or central laboratory system (that is what LabWare, LabConnect do)
- Not a biospecimen execution tool for the sponsor (that is what Slope does)
- Not a system that rates, certifies, or judges institutions
- Not a system that emits institutional truth — only evidence about institutional claims

**Add §2.9 "Scope Decision Record" — new section:**
Formally record the scope evolution: Kadarn began as a platform to find biospecimens (Discovery-centric). It is now execution infrastructure for biospecimen programs with a specific differentiator: neutral, multi-actor, cross-sponsor portable institutional evidence. This was not scope creep — it was a deliberate expansion consistent with the Operational Twin and Workflow models already defined in KRM-RAO.

**Add §2.10 "Canonical Positioning Statement" — new section (versioned):**
> "Kadarn builds the evidence infrastructure that makes institutional capability verifiable, portable, and accumulative across multiple commercial relationships over time."

Any change to this statement requires its own ADR. It may not be edited silently.

---

## 1.2 Architectural Lexicon v1.1 → v1.2

**File:** `docs/architecture/lexicon.md`

**New terms to add (from KEMS-001 and this session):**

| Term | Definition |
|---|---|
| **Claim** | A specific, bounded assertion about an institutional capability that is specific enough to be supported or contradicted by evidence. Not a general reputation label. |
| **Confidence Graph** | The complete representation of evidence supporting or contradicting a Claim, including Evidence Nodes, their relationships, and the emergent Confidence State. |
| **Evidence Node** | A structured object representing a single piece of evidence, with properties: content, source, date, type, provenance, expiration, weight. |
| **Evidence Class** | The category of an Evidence Node, from A (public independent) to F (external confirmation). Determines the node's independence and contribution to the Confidence State. |
| **Confidence State** | The dynamic output of a Confidence Graph: a value (0-100), a level (High/Moderate/Low/Insufficient), and a last-updated timestamp. Not a static score. |
| **Counter Evidence** | An Evidence Node that contradicts rather than supports a Claim. Decreases the Confidence State. Cannot be deleted — only responded to. |
| **Right of Response** | A structured response from an institution to a Counter Evidence node. Attaches to the Counter Evidence as a linked node. Does not modify the original. |
| **Temporal Continuity** | A property of a Claim's evidence graph that verifies the chronological consistency and operational cadence of supporting evidence over time. |
| **Evidence Class A** | Public Independent Evidence: ClinicalTrials.gov, FDA, PubMed, IRB registries. |
| **Evidence Class B** | Institutional Documentary Evidence: SOPs, calibration certificates, training records, CAPA documentation, shipping logs. |
| **Evidence Class C** | Operational Evidence: events generated automatically by Vilo Execution Systems as a byproduct of operational activity. |
| **Evidence Class D** | Cross-Source Corroboration: structural property of the graph when two or more independent sources from different classes are mutually consistent. |
| **Evidence Class E** | Temporal Continuity Evidence: verifies that a capability history is chronologically coherent and operationally consistent. |
| **Evidence Class F** | External Confirmation: evidence provided by an independent third party confirming a specific capability or event from their own records. |
| **Explainable Inference** | An inference produced by an Intelligence Engine that is fully traceable to the Evidence Nodes that produced it. No Confidence Value is valid in Kadarn without its explanation. |
| **Operational Visibility** | The ability of a sponsor or network operator to see the current and historical operational capacity of institutions in their network, based on structured evidence rather than self-reported profiles. |

**Terms to modify:**

| Existing Term | Required Change |
|---|---|
| **Trust** | Definition updated: Trust is no longer "a computed operational measure" as a product feature. Trust is the emergent consequence of accumulated evidence — it is not produced by Kadarn, it emerges from the Confidence Graph. Update the definition and the Canonical Usage Rules accordingly. |
| **Engine** | Add distinction between Core Engines (operated by Kadarn), Certified Engines (third-party, certified), and Private Engines (tenant-specific, not shared). |
| **Evidence** | Expand definition to align with Evidence Node structure from KEMS-001. |

**Add to Language Governance §1.5:**
> "Terms that have been formally retired (see Appendix — Retired Terms) may not be reintroduced in any document without a new ADR. The Language Governance process applies to retirements as well as additions."

---

## 1.3 KRM-RAO v1.1 → v2.0

**File:** `docs/architecture/krm-rao.md`

This is a substantive version increment, not a patch. The following changes reflect architectural decisions made during the strategic session.

**§3.4 Architectural Layers — add Evidence Core as explicit layer:**

The current model has Applications → Engines → Services → Operational Twins → Graphs → Fabrics → Infrastructure.

Add between Services and Operational Twins:

> **Evidence Core** — The deterministic, non-opinionated layer responsible for receiving evidence, preserving provenance, managing process state (never semantic truth), controlling access policies, and maintaining the dispute/right-of-response lifecycle. The Evidence Core never emits judgments. It never computes confidence. It only stores, relates, and governs access to evidence.

**§3.6 Operational Twin Model — add missing twins:**
Add `Aliquot Twin` (was in KRM-BNO but missing from base model — already flagged in v1.1 but not executed).
Add `Evidence Twin` — a new concept: the persistent representation of an Evidence Node and its relationships within the Confidence Graph.

**§3.7 Engines as Capabilities — restructure:**

Retire the simple sequential list. Replace with:

**Core Engines (operated by Kadarn, v1 scope):**
- Confidence Engine: evaluates Evidence Graphs and produces Confidence States
- Provenance Engine: manages evidence chains, counter-evidence, and rights of response
- Policy Engine: determines access permissions and visibility rules per actor
- Knowledge Engine: semantic understanding, ontology resolution, controlled vocabulary

**Engines pending decision (not in v1 scope):**
- Workflow Engine
- Fulfillment Engine
- Financial Engine
- Intelligence Engine (renamed from Trust Engine)
- Integration Engine

**Note on Trust Engine:** formally renamed or retired as a standalone engine. The concept of "Trust" is now produced as an emergent property of the Confidence Graph, not by a dedicated engine. If a named engine is needed, it will be called "Confidence Engine" or "Institutional Intelligence Engine." This requires ADR before finalizing.

**§3.8 Event Model — add Evidence events:**
- `EvidenceSubmitted`
- `EvidenceClassified`
- `CounterEvidenceRecorded`
- `RightOfResponseSubmitted`
- `ConfidenceStateUpdated`
- `ClaimCreated`
- `TemporalContinuityVerified`
- `ExternalConfirmationReceived`

**Add §3.14 — Evidence Core Boundary Rule:**

> A function belongs to the Evidence Core if and only if it satisfies all five of the following conditions simultaneously:
> 1. It preserves evidence without altering its content.
> 2. It preserves provenance of all evidence it handles.
> 3. It enforces access policies without creating new policies.
> 4. It does not alter the meaning or semantic interpretation of any evidence.
> 5. It produces the same result for any two consumers with identical access permissions.
>
> If any of these five conditions fails, the function belongs to an Engine, not to the Evidence Core.

---

## 1.4 KRM-BNO v1.1 → v1.2

**File:** `docs/architecture/krm-bno-profile.md`

**§4.1 Purpose — update framing:**
Add: "KRM-BNO specializes KRM-RAO for biospecimen networks. In this profile, the primary Evidence Class C source is Vilo Execution Systems, which generate operational evidence as a byproduct of biospecimen execution. Kadarn structures, verifies, and makes this evidence portable across sponsor relationships."

**§4.4 Biospecimen Twins — already correct, confirm Aliquot Twin present.**

**Add §4.10 — Competitive Boundary:**
Document explicitly where Kadarn does not compete in the biospecimen domain:
- Slope: biospecimen execution tool, sponsor-contracted, data stays in sponsor's tenant. Kadarn is the site-owned portable evidence layer, not a replacement for Slope.
- SiteVault: document management for sponsor-site relationship. Kadarn is not a document repository.
- LabConnect/LabWare: central laboratory systems. Kadarn is not a LIMS.

**Add §4.11 — Evidence Source Map for Biospecimens:**
Map each Evidence Class to its biospecimen-specific sources:
- Class A: ClinicalTrials.gov study registrations, FDA inspection databases, IRB approval records
- Class B: Lab manuals, cold chain logs, equipment calibrations, SOPs, training records
- Class C: Vilo Execution events (CollectionCompleted, ShipmentReleased, QCApproved, TemperatureRecorded)
- Class D: Cross-source corroboration between Class A study registrations and Class B operational records
- Class E: Temporal consistency of biospecimen operations across multiple years and studies
- Class F: Central laboratory receipt and acceptance rate confirmations, CRO study completion letters

---

## 1.5 Sprint Plan v2.0 → v2.1

**File:** `docs/sprint-plan-v2.0.md`

**Add Sprint 17 — KEMS-001 Implementation:**
- Implement the Claim entity and Evidence Node structure as defined in KEMS-001
- Build the Evidence Core boundary enforcement (the five-condition test)
- Build the six Evidence Class classification engine
- Build Confidence State computation (initial version: emergent from graph, not fixed formula)
- Build the Right of Response workflow
- Build Temporal Continuity detection

**Add Sprint 18 — Confidence Graph API:**
- Public-facing API for querying Confidence Graphs per Claim
- Visibility controls per actor (site sees all, sponsor sees authorized subset)
- Explainability output: every Confidence Value must return its evidence node list

**Add Sprint 19 — Evidence Ingestion Pipelines:**
- ClinicalTrials.gov API integration (Class A evidence, automated)
- PubMed API integration (Class A evidence, automated)
- Document upload pipeline with consistency detection (Class B evidence)
- Temporal continuity checker (Class E, runs on all evidence graphs nightly)

**Add Sprint 20 — Sponsor Intelligence Access (MVP):**
- Sponsor dashboard: Confidence Graphs for their authorized site network
- Portfolio monitoring: alerts on Confidence State degradation
- Feasibility query: search sites by Claim and minimum Confidence Level

---

## 1.6 Governance & Compliance Pack — updates required

**File:** `docs/governance/governance-compliance-pack.md`

**Add two new documents (identified as necessary by KEMS-001):**

**Document G-22 — Evidence Dispute & Correction Process:**
- Who can submit a Right of Response (the institution the evidence concerns)
- Timeline for Kadarn to acknowledge and classify a dispute (suggested: 5 business days)
- What happens to the Confidence State during an open dispute (suggested: a visual marker indicating "evidence under dispute" without freezing the value)
- What constitutes a resolved dispute (Right of Response submitted + either sponsor acceptance or auditor confirmation)
- What the audit trail of a dispute must contain

**Document G-23 — Multi-Actor Evidence Visibility Policy:**
- An institution's evidence submitted by one sponsor is not visible to competing sponsors without the institution's explicit authorization
- Counter Evidence submitted by a sponsor is visible to the institution that it concerns
- Aggregate, anonymized evidence (for benchmark purposes) requires minimum population thresholds to prevent reverse-identification
- Derived Signals and Federated Feedback (signals that improve the graph without revealing proprietary models) are classified as a separate data category pending privacy design review

---

# PART 2 — WHAT TO ADD

## 2.1 KEMS-001 — The Confidence Graph Model

**File:** `docs/architecture/kems-001-confidence-graph.md`

**Status:** WRITTEN. See file `KEMS-001_Confidence_Graph_Model_v1.0.md`.

**Action required:**
- Ratify as canonical — this requires formal approval per Lexicon §1.5 governance process
- Register in the document hierarchy (sits at Level 2 — Model, below Manifesto, alongside KRM-RAO)
- Link from KRM-RAO §3.14 as the authoritative definition of the Evidence Core boundary
- Add all KEMS-001 terms to Lexicon v1.2 (already listed in §1.2 above)

---

## 2.2 Claim Taxonomy v1.0

**File:** `docs/architecture/claim-taxonomy-v1.0.md`

**Status:** NOT WRITTEN. Required before any Confidence Graph can be populated.

**Contents:**
- The canonical list of valid Claims for the Biospecimen domain (initial scope)
- For each Claim: name, description, relevant Evidence Classes, natural decay rate, example Evidence Nodes
- Claims that are explicitly out of scope for v1 (to prevent scope creep)

**Example Claims for v1:**
- `biospecimen.processing.pk_samples`
- `biospecimen.storage.minus_80`
- `biospecimen.storage.minus_20`
- `biospecimen.cold_chain.validated`
- `biospecimen.processing.pbmc`
- `biospecimen.processing.ffpe`
- `biospecimen.shipping.dry_ice_capable`
- `biospecimen.shipping.international`
- `regulatory.gcp_trained_staff`
- `regulatory.inspection_ready`
- `operational.phase_i_capable`
- `operational.overnight_observation`
- `operational.patient_recruitment.oncology`
- `operational.study_completion_history`

**Priority:** High. Cannot build the Confidence Graph without the Claim Taxonomy.

---

## 2.3 ADR-010 — Trust Engine Retirement and Replacement

**File:** `docs/adr/ADR-010-trust-engine-retirement.md`

**Decision to record:**
- "Trust Engine" as a named Core Engine is formally retired
- "Trust" as a product that Kadarn produces is formally retired
- Replacement: Trust is an emergent property of the Confidence Graph, not a product feature
- The new engine responsible for evaluating Confidence Graphs is named "Confidence Engine" (pending final name decision)
- "Trust Level: Gold/Silver/Bronze" is retired and replaced by Confidence Level: High/Moderate/Low/Insufficient

**Status:** NOT WRITTEN. Required to close the open item from the Semantic Freeze v2.0 backlog.

---

## 2.4 ADR-011 — Evidence Core Boundary Rule

**File:** `docs/adr/ADR-011-evidence-core-boundary.md`

**Decision to record:**
- The five-condition test defined in KRM-RAO §3.14 is the canonical rule for determining whether a function belongs to the Evidence Core or to an Engine
- Process state management (Open/Under Review/Closed on disputes) belongs to the Evidence Core as workflow state, not as semantic judgment
- The content of dispute resolutions always comes from human actors and is recorded as Evidence Nodes, never auto-generated by the Core
- Any future function that fails any of the five conditions must be built as an Engine, not added to the Core

**Status:** NOT WRITTEN. Required before Sprint 17.

---

## 2.5 ADR-012 — Engine Governance: Core / Certified / Private

**File:** `docs/adr/ADR-012-engine-governance.md`

**Decision to record:**
- Core Engines: built and operated by Kadarn, define canonical semantics, v1 list is: Confidence Engine, Provenance Engine, Policy Engine, Knowledge Engine
- Certified Engines: built by third parties, require certification process (process TBD in separate spec), examples: Rare Disease Readiness Engine, Cell Therapy Qualification Engine
- Private Engines: built by organizations for their own use, never shared with ecosystem, consume Evidence Core via API
- Private Engines may consume shared evidence but may not expose their model or results to the shared network (prevents free-riding without cooperation)
- The Certified Engine certification process and marketplace are deferred to Year 2-3 — this ADR only establishes the framework, not the process

**Status:** NOT WRITTEN.

---

## 2.6 Competitive Boundary Document

**File:** `docs/strategy/competitive-boundary.md`

**Status:** NOT WRITTEN. Required for sales and product alignment.

**Contents:**
Based on verified research during this session, document precisely where each competitor operates and where Kadarn does not compete:

| Competitor | What they do | What Kadarn does differently | Verified? |
|---|---|---|---|
| Inato | Marketplace matching, site visibility | Kadarn builds portable evidence history, not matching | ✅ |
| Veeva SiteVault | eISF, CTMS, document management for sponsor-site relationship (free to 20 studies) | Kadarn is not a document repository; SiteVault data stays in sponsor's vault | ✅ |
| Veeva Link + Snowflake | Intra-sponsor site intelligence, predictive analytics | Kadarn is neutral, multi-sponsor, site-owned — Veeva's intelligence stays inside their ecosystem | ✅ |
| Slope (B360) | Biospecimen execution tool for the sponsor, 2,200+ sites | Slope is sponsor-contracted; data stays with sponsor. Kadarn is site-owned and portable | ✅ |
| IQVIA | Historical site performance from their own data | IQVIA's intelligence is proprietary and intra-IQVIA; not portable or site-owned | Partial |
| Florence Healthcare | eBinders, eISF, Site Enablement (free tier) | Not a document management tool | ✅ |
| CRIO | Site CTMS, sponsor reimbursable ($1,000/study) | Not a CTMS — Kadarn is evidence infrastructure | ✅ |

**IQVIA Site Intelligence** requires deeper verification before finalizing this document — identified as the most likely competitor to partially occupy Kadarn's space.

---

## 2.7 Sponsor / CRO Validation Script

**File:** `docs/validation/sponsor-cro-validation-script.md`

**Status:** WRITTEN. See file `Sponsor_CRO_Validation_Script.md`.

**Action required:**
- Add Section 5b: Module Prioritization Questions (show the six modules in plain language, ask which is already resolved vs. still painful)
- Add the key question on data portability: *"When a study ends, does your site's performance history stay with you, or does it stay with the sponsor's systems?"*
- Use when: first sponsor/CRO conversations begin, after Kadarn has 20+ sites with real Confidence Graphs

---

## 2.8 Kadarn — Vilo OS Relationship Document

**File:** `docs/strategy/kadarn-vilo-relationship.md`

**Status:** NOT WRITTEN. Required to prevent future confusion between the two products.

**Contents:**

**Kadarn:** evidence infrastructure of the network. Neutral. Multi-actor. Sponsor-facing and site-facing. Business model: sponsors and CROs pay for intelligence access.

**Vilo OS:** operational system for research sites. Site-facing only. Business model: sites pay for operational modules.

**Relationship:** Vilo OS is an Evidence Class C generator for Kadarn. Every operational action in Vilo OS automatically generates evidence that feeds the site's Confidence Graph in Kadarn. This is the primary mechanism for building Confidence Graph depth without manual effort from the site.

**Independence:** each product can be sold independently. A site can use Kadarn without Vilo OS (using Class A, B, and F evidence only). A site can use Vilo OS without Kadarn (operational tool only, no institutional intelligence layer). The combination creates compounding value: Vilo OS generates Class C evidence automatically, which is the highest-quality operational evidence available.

**GTM sequence:**
1. Vilo OS first: build evidence base from operational execution
2. Kadarn second: once 20-50 sites have Confidence Graphs worth consulting
3. First sponsor conversation: when there is real evidence to show, not a hypothetical

---

## 2.9 Business Model Document — Kadarn Only

**File:** `docs/strategy/kadarn-business-model.md`

**Status:** NOT WRITTEN. Consolidates the income channel analysis from this session.

**Income channels to document:**

| Channel | Buyer | Model | Phase |
|---|---|---|---|
| K1 — Sponsor Portfolio Intelligence | Sponsor | Annual subscription by network size | Year 2 |
| K2 — Feasibility Intelligence | Sponsor | Per-site query before study start | Year 2 |
| K3 — Portfolio Monitoring Alerts | Sponsor | Annual premium add-on to K1 | Year 2 |
| K4 — Amendment Impact Assessment | Sponsor | Per-amendment fee | Year 2 |
| K5 — CRO Enterprise License | CRO | Annual portfolio license | Year 2-3 |
| K6 — Benchmark Intelligence Reports | Industry | Per-report, annual | Year 3 |
| K7 — Institutional Asset (site pays) | Site | Annual subscription for own Confidence Graph | Year 1 |
| K8 — Certified Engine Program | Third parties | Certification fee + API royalties | Year 3-5 |

**Revenue projections (from this session, to be included):**

| Year | Low | Medium | High |
|---|---|---|---|
| Year 1 | $0-$20,000 | $25,000-$50,000 | $50,000-$75,000 |
| Year 2 | $65,000 | $375,000 | $1,400,000 |
| Year 3 | $100,000 | $1,420,000 | $4,600,000 |

**Critical condition:** Kadarn income is gated by number of sites with real Confidence Graphs. No meaningful sponsor revenue before 50+ sites with evidence depth. Build the evidence base first.

---

## 2.10 Evidence Verification Playbook

**File:** `docs/operations/evidence-verification-playbook.md`

**Status:** NOT WRITTEN. Required for onboarding operations.

**Contents:**

**How Kadarn verifies evidence without requiring third-party cooperation:**

**Tier 1 — Automatic (no human effort):**
- ClinicalTrials.gov API: pull study registrations by investigator/institution
- PubMed API: pull publications by institution/PI
- Temporal consistency check: verify chronological coherence of submitted evidence

**Tier 2 — Semi-automatic (site uploads, Kadarn classifies):**
- Document upload: SOPs, calibration certificates, training records, shipping logs
- Consistency detection: AI-assisted check for internal inconsistencies (volume claims vs. infrastructure declared)

**Tier 3 — Facilitated (Kadarn generates the request, site sends it):**
- CRO confirmation request: standardized letter template the site sends to past CROs requesting written confirmation of study completion
- Central laboratory confirmation: request to lab for aggregate sample receipt/acceptance data for the site

**Tier 4 — Passive (generated by Vilo OS operation):**
- Class C evidence: automatic event generation from Vilo Execution modules
- No additional effort from the site — operating in Vilo generates the evidence

**What Kadarn will never claim to verify:**
- The quality of patient care
- The accuracy of medical records
- The scientific validity of study results
- Any fact that requires physical inspection

---

# PART 3 — WHAT TO ARCHIVE

## 3.1 Retired Terminology

The following terms are formally retired. They may not appear in any new Kadarn document. Existing documents that use them must be updated.

| Retired Term | Reason | Replacement |
|---|---|---|
| **Trust Score** | Binary, opaque, legally exposed | Confidence State (per Claim, with full explanation) |
| **Trust Level: Gold/Silver/Bronze** | Categorical judgment without traceable evidence | Confidence Level: High/Moderate/Low/Insufficient |
| **Verified** (as in "this site is Verified") | Implies absolute truth; creates certification liability | "Supported by Evidence" (with Evidence Class and source listed) |
| **Institutional Certification** | Same problem as Verified | External Confirmation (Class F) when a third party confirms |
| **Trust Infrastructure** | Trust is emergent, not a product | Evidence Infrastructure |
| **Trust Engine** (as Core Engine) | Engine was treating Trust as a computable output | Confidence Engine (produces Confidence States from Evidence Graphs) |
| **Platform to find biospecimens** | Original framing, too narrow, superseded | "Execution infrastructure for biospecimen programs with portable evidence" |
| **Kadarn verifies capacity** | Claims more than Kadarn can deliver | "Kadarn organizes verifiable evidence about institutional capacity" |

## 3.2 Archived Architectural Concepts

These concepts are not deleted — they are archived with an explanation of why they were superseded.

**"Single Trust Score per Institution"**
Why archived: A single score per institution obscures which specific capabilities are well-evidenced and which are not. A sponsor evaluating overnight observation capability needs different evidence than one evaluating cold chain logistics. A single score cannot serve both without hiding the distinction.
Replaced by: Confidence Graph per Claim.

**"Marketplace-first GTM"**
Why archived: Marketplace value depends on volume of studies published by sponsors. If no studies are published, there is no value — the same failure mode documented for Inato. Kadarn's value must exist independently of whether a marketplace transaction occurs.
Replaced by: Evidence infrastructure that generates value for the site regardless of whether a study is found. The marketplace, if it exists, is a consequence of evidence quality — not the primary product.

**"SiteVault competitor" framing**
Why archived: SiteVault is free, has 8,000+ sites, and is subsidized indefinitely by Veeva's enterprise revenue. Competing directly on document management is an unwinnable position.
Replaced by: Kadarn occupies the evidence portability layer that SiteVault by design cannot occupy (SiteVault data stays in the sponsor's vault; Kadarn data stays with the site).

**"AI layer" as a standalone differentiator**
Why archived: Every competitor has an AI layer. AI as a differentiator is table stakes by 2025-2026. The differentiator is the data, not the AI that processes it.
Replaced by: The Confidence Graph model, which produces Explainable Inferences — the AI is a consequence, not the product.

---

# PART 4 — IMPLEMENTATION SEQUENCE

## Phase 0 — Documentation Foundation (Weeks 1-4)

**Goal:** close the gap between what was decided in the strategic session and what is formally documented. Nothing is "decided" until it is written.

| Task | Owner | Output | Depends on |
|---|---|---|---|
| Ratify KEMS-001 | Architecture | Signed KEMS-001 v1.0 | — |
| Write ADR-010 (Trust Engine retirement) | Architecture | ADR-010 | KEMS-001 ratified |
| Write ADR-011 (Evidence Core boundary) | Architecture | ADR-011 | KEMS-001 ratified |
| Write ADR-012 (Engine governance) | Architecture | ADR-012 | ADR-011 |
| Update Lexicon v1.1 → v1.2 | Architecture | Lexicon v1.2 | ADR-010, ADR-011 |
| Write Claim Taxonomy v1.0 | Product + Architecture | Claim Taxonomy | KEMS-001 ratified |
| Write Competitive Boundary document | Strategy | Competitive Boundary | — (can start now) |
| Write Kadarn-Vilo Relationship doc | Strategy | Relationship doc | — (can start now) |

**Exit criteria for Phase 0:**
- All retired terms are removed from canonical documents
- KEMS-001 is ratified and linked from KRM-RAO
- Claim Taxonomy v1.0 exists with at least 10 validated Claims
- No document refers to "Trust Score", "Verified", or "platform to find biospecimens"

---

## Phase 1 — Evidence Core Build (Months 1-3)

**Goal:** build the Evidence Core as defined in KEMS-001. This is the foundation — everything else sits on top of it.

| Sprint | Goal | Key deliverable |
|---|---|---|
| Sprint 17 | Implement Claim entity and Evidence Node structure | Working data model for Claims and Evidence Nodes |
| Sprint 17 | Build Evidence Class classifier | Incoming evidence classified automatically into A-F |
| Sprint 17 | Build Evidence Core boundary enforcement | Five-condition test implemented as code guard |
| Sprint 18 | Build Confidence State computation (v1) | Confidence Value, Level, and Explanation output per Claim |
| Sprint 18 | Build Right of Response workflow | Counter Evidence + response chain preserved |
| Sprint 19 | ClinicalTrials.gov API integration | Class A evidence ingested automatically by institution/PI |
| Sprint 19 | PubMed API integration | Class A evidence ingested automatically |
| Sprint 19 | Document upload pipeline (Class B) | Site can upload SOPs, certificates, logs |
| Sprint 19 | Temporal Continuity checker | Nightly batch job detecting chronological inconsistencies |

**Exit criteria for Phase 1:**
- A site can create Claims for its capabilities
- A site can submit evidence of any class against those Claims
- Kadarn automatically ingests Class A evidence from public APIs
- Every Confidence State has a full explanation navigable to source nodes
- Counter Evidence and Right of Response chain works end to end

---

## Phase 2 — Evidence Onboarding (Months 2-4, parallel with Phase 1)

**Goal:** while the Evidence Core is being built, begin structuring existing historical evidence from known sites. This is operational, not engineering.

| Task | Description | Output |
|---|---|---|
| Identify 10-20 pilot sites | Site directors already known from Vilo Research network | Pilot site list |
| Design onboarding interview | Structured session to identify Claims and locate existing evidence | Onboarding protocol |
| Execute onboarding for 5 sites manually | Manual Confidence Graph construction using KEMS-001 | 5 sites with real Confidence Graphs |
| Identify Class A evidence automatically | Run ClinicalTrials.gov lookup for each pilot site | Class A nodes for all pilot sites |
| Facilitate first CRO confirmation requests | Generate standardized letter; site sends to past CROs | First Class F evidence nodes |
| Document gaps explicitly | For each site, what Claims have low confidence and why | Gap register per site |

**Exit criteria for Phase 2:**
- 10+ pilot sites have Confidence Graphs with at least Class A and Class B evidence
- At least 3 sites have at least one Class F (external confirmation) node
- The Confidence Graph of each pilot site is navigable and explainable
- The onboarding protocol is documented well enough that a new team member could execute it

---

## Phase 3 — Sponsor Intelligence MVP (Months 4-8)

**Goal:** with 20+ sites having real Confidence Graphs, build the minimum product a sponsor would pay to access.

| Sprint | Goal | Key deliverable |
|---|---|---|
| Sprint 20 | Sponsor dashboard — portfolio view | Sponsor sees Confidence Graphs for their authorized sites |
| Sprint 20 | Visibility controls | Site authorizes which Claims are visible to which sponsors |
| Sprint 20 | Feasibility query | Sponsor searches sites by Claim + minimum Confidence Level |
| Sprint 21 | Portfolio monitoring — degradation alerts | Alert when Confidence State of an active site drops |
| Sprint 21 | Amendment Impact Assessment (v1) | Given a protocol change, which sites are affected and how |
| Sprint 22 | Sponsor access pricing and billing | K1 and K2 channels operational |

**Exit criteria for Phase 3:**
- At least one sponsor is paying for access (any amount — the first dollar validates the model)
- The sponsor can search for sites by specific Claims
- The sponsor can see a Confidence Graph with its full explanation
- At least one degradation alert has been sent and acknowledged

---

## Phase 4 — Scale and Network Effects (Months 9-18)

**Goal:** grow the site network to the point where Kadarn's value for sponsors becomes compounding.

| Task | Description |
|---|---|
| SMO / site network partnerships | Negotiate contracts with 2-3 Site Management Organizations to onboard 20-50 sites each |
| CRO pilot | Identify one CRO for an enterprise pilot (Channel K5) |
| Vilo OS Class C integration | Connect Vilo OS operational events to Kadarn as automatic Class C evidence |
| Benchmark Intelligence v1 | First industry benchmark report when 100+ sites have sufficient history |
| Certified Engine framework | Draft the certification process for third-party engines (not launch, just framework) |

**Exit criteria for Phase 4:**
- 100+ sites with Confidence Graphs
- 3+ sponsors paying for access
- At least one CRO in a paid pilot or contract
- Vilo OS generating Class C evidence automatically for enrolled sites

---

## Open Questions — Backlog (not blocking, tracked explicitly)

These questions were identified during the strategic session as unresolved. They are not blocking the implementation sequence above, but they must be resolved before the relevant phase begins.

| Question | Blocks | Priority |
|---|---|---|
| IQVIA Site Intelligence full verification — does it occupy the portable evidence space? | Competitive Boundary document | High — before first sponsor conversation |
| Exact Confidence algorithm (how graph structure maps to Confidence Value 0-100) | Sprint 18 | Medium — v1 can use a simple weighted approach and evolve |
| Claim Taxonomy beyond biospecimen domain | Phase 3+ | Low for now |
| Derived Signal / Federated Feedback privacy design | ADR-012 | Medium — before Certified Engine program |
| KEMS/KRM-RAO exact relationship — is KEMS a v2 of KRM-RAO or a separate spec? | Document hierarchy | Medium — before Lexicon v1.2 is finalized |
| Pricing finalization for K1-K8 channels | Phase 3 | Medium — before billing sprint |
| Whether Kadarn needs a BAA for any of its data flows | G-22, G-23 | High — legal review required before any sponsor data ingestion |

---

## Success Metrics — By Phase

| Phase | Metric | Target |
|---|---|---|
| Phase 0 | Documents ratified with zero retired terms | 100% compliance in canonical docs |
| Phase 1 | Evidence Core operational | Claims, Evidence Nodes, Confidence States functional end-to-end |
| Phase 2 | Pilot sites onboarded | 10+ sites with real Confidence Graphs |
| Phase 3 | First paying sponsor | $1 of validated sponsor revenue |
| Phase 4 | Network density | 100+ sites, 3+ sponsors, 1 CRO |

---

## What This Plan Does Not Cover

- Vilo OS implementation (separate product, separate plan)
- Fundraising or investor materials (separate document)
- Legal entity structure and BAA execution (separate legal workstream — flagged as open question)
- Team structure and hiring plan (separate operational document)
- Pricing negotiation tactics (separate sales playbook)

---

*This document consolidates decisions from an extended strategic session. It supersedes any prior roadmap, sprint plan, or architectural direction that conflicts with the decisions recorded here. In case of conflict between this document and a prior document, this document prevails — unless the prior document is the Manifesto, KEMS-001, or a ratified ADR, in which case those take precedence per the document hierarchy established in Manifesto §2.9.*
