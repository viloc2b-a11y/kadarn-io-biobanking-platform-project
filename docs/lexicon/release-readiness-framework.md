# Kadarn — Release Readiness & Governance Documentation Set (v1.0)

This set extends the existing architectural documentation (Lexicon, Manifesto, KRM-RAO, KRM-BNO) with the two missing layers identified during the beta-readiness discussion:

1. A **Release Readiness Framework**, formalizing the Release Candidate (RC) stage that did not exist in the original roadmap.
2. A **Governance & Compliance Pack**, the regulatory/business counterpart to the technical architecture.

All terms below (Research Asset, Operational Twin, Policy, Trust, Evidence, Network, Ecosystem, Engine, Fabric, Graph) are used per the Kadarn Architectural Lexicon v1.1 and are **not redefined here**. Any new term introduced in this set is flagged as **[NEW — pending Language Governance approval]** per Lexicon §1.5.

---

## 0. Why This Set Exists

The test-count discrepancy (180 → 181 → 186/205) is a symptom, not the core issue. The core issue is that the project has no formal gate between "feature-complete" and "labeled beta." This document set creates that gate, and adds the document that no engineering sprint produces by default: the **business and regulatory readiness narrative**.

It also registers a scope observation that should be made explicit in the Manifesto's history, not just in this analysis: Kadarn shifted from *a platform to find biospecimens* to *an execution infrastructure for biospecimen programs*. That shift is architecturally already reflected (Program Engine, Exchange, Processing, Logistics, Regulatory, Analytics, AI as first-class layers), but it has not yet been recorded as a formal scope decision. See §1.4.

---

## 1. Kadarn Release Readiness Framework (v1.0)

### 1.1 Purpose

Defines the gate between feature completion and any `beta` or `1.0.0` label. No version may be declared `vX.0.0-beta` without passing through an RC stage with a documented exit checklist.

### 1.2 Versioning Rule **[NEW — pending Language Governance approval]**

| Stage | Version pattern | Meaning |
|---|---|---|
| Active development | `v0.x.0` | Features in progress, no readiness claim. |
| Release Candidate | `v0.x.0-release-candidate` | Feature-complete for the target scope; undergoing hardening, security review, regulatory gap assessment, and operational readiness work. No new features added during this stage. |
| Beta | `v1.0.0-beta` | RC checklist closed. External or limited-production use permitted under explicit beta terms. |
| General Availability | `v1.0.0` | Full production commitment. |

**Rule:** a version may not skip the Release Candidate stage. A test-count discrepancy (e.g., "186/205") blocks RC exit until resolved and explained — not just patched.

### 1.3 RC Exit Checklist (must be 100% closed, not "mostly closed")

| # | Workstream | Closing condition |
|---|---|---|
| 1 | Hardening | Indexes reviewed, `EXPLAIN ANALYZE` run on top slow queries, caching strategy documented, background jobs have retry/backoff policies, no known N+1 patterns in critical paths. |
| 2 | Security Review | OWASP ASVS checklist completed at the agreed level (L1/L2/L3 — must be stated explicitly), API Security Top 10 reviewed, secrets management audited, security headers and CSP verified, CSRF posture documented (even if "not applicable, stateless API" — must be stated, not assumed), rate limiting and abuse prevention verified under load. |
| 3 | Regulatory Readiness | Gap assessments completed (not certifications) for: HIPAA, 21 CFR Part 11, GDPR. SOC 2 and ISO 27001 readiness matrices drafted. |
| 4 | Operational Readiness | Runbooks exist for top N operational scenarios, monitoring and alerting are live (not "planned"), an Incident Response Plan exists and has been read by the on-call rotation, backup *and* restore have both been tested (restore-only-on-paper does not count). |
| 5 | Documentation Freeze | Blueprint, ADRs, OpenAPI spec, Architecture docs, Data Model, and API Contracts are version-tagged and frozen for the RC. Any change during RC requires a logged exception. |

### 1.4 Scope Decision Record **[NEW — pending approval, recorded here as a proposed ADR]**

> **Proposed ADR-XXX: Kadarn's scope is execution infrastructure for biospecimen programs, not a discovery marketplace.**
>
> *Context:* Kadarn began as a platform to find samples (Discovery-centric). The architecture has since grown to include Program Engine, Exchange, Processing, Logistics, Regulatory, Analytics, and AI as first-class layers — i.e., the full lifecycle of a biospecimen program, not just the matching step.
>
> *Decision (proposed):* Formally record this as a scope expansion, not scope creep, since it is consistent with KRM-RAO's Operational Twin and Workflow model. This should be ratified as an ADR before v1.0.0-beta, since downstream documents (sales positioning, regulatory scope, the Compliance Pack below) all depend on which scope statement is canonical.
>
> **Status update:** this scope statement has now been reflected in the Manifesto (§2.3 of the Kadarn Lexicon/Manifesto/KRM-RAO/KRM-BNO document, v1.1). Treat the ADR number itself as still pending formal assignment/ratification in your ADR log, but the scope language is no longer "proposed only" — it is the current canonical framing.
>
> *Consequence:* The regulatory and business-readiness questions in §2 below scale accordingly — "infrastructure that executes regulated programs" carries materially more obligations than "a directory that helps people find samples."

---

## 2. Business & Regulatory Readiness Track

This is a parallel workstream to engineering, not a sequential one. It does not block RC technically, but it blocks **go-to-market**, and it should start now rather than after RC closes, since legal and regulatory work has long lead times.

### 2.1 Core Questions to Answer (tracked as a register, not a one-time memo)

| Area | Question | Owner | Status |
|---|---|---|---|
| Licensing | What licenses does Kadarn need, and in which jurisdictions? | — | Open |
| HIPAA | When does Kadarn act as a Business Associate? When is a BAA required? | — | Open |
| HIPAA | When does HIPAA apply directly vs. through a covered entity's obligations? | — | Open |
| Insurance | What coverage is needed (E&O, cyber, general liability)? | — | Open |
| State registration | Which states require specific registrations for the activities Kadarn performs? | — | Open |
| GDPR | What happens when a European client or data subject uses the platform? Is Kadarn a controller, processor, or both depending on the flow? | — | Open |
| DPO | Does Kadarn need a Data Protection Officer, and under which trigger (GDPR Art. 37, or voluntary)? | — | Open |
| Privacy program | How is the privacy program structured — policy, intake, DSR handling, breach notification? | — | Open |
| Contracts | What contracts must participating organizations sign, and in what order (e.g., Network Participation Agreement before MTA/DUA)? | — | Open |

This register should live as a tracked artifact (issue tracker or governance repo), not a static document, since answers depend on jurisdiction-by-jurisdiction legal review.

### 2.2 Relationship to the Lexicon

Note that "Trust" in the Lexicon is defined as a computed operational measure — it is **not** a substitute for the legal/contractual trust established by a Network Participation Agreement or BAA. The Governance Pack below should make this distinction explicit so legal and engineering don't conflate "Trust Score" with "contractually established trust relationship."

---

## 3. Kadarn Governance & Compliance Pack

This is the regulatory and operational counterpart to the technical architecture (Lexicon, Manifesto, KRM-RAO, KRM-BNO). It does not aim for certification at this stage — it aims to **measure distance to** certification/compliance and to give the business defensible artifacts from day one.

Each item below includes: purpose, minimum contents, and dependency on other documents. None of these replace qualified legal counsel; they are the structural skeleton counsel and compliance leadership would fill in.

### 3.1 Company Compliance Manual
**Purpose:** single source of truth for "how Kadarn complies," referenced by every other document below.
**Minimum contents:** scope and applicability, regulatory inventory (HIPAA, GDPR, 21 CFR Part 11, state laws), roles and responsibilities (who owns compliance, who owns security, who owns privacy), policy review cadence, exception-handling process.
**Depends on:** Risk Register (§3.16), Regulatory Mappings (§3.17–3.19).

### 3.2 Information Security Program
**Purpose:** the security counterpart to KRM-RAO §3.12's Security Model — turns "Zero Trust, RBAC, evidence retention, auditability, least privilege" into operational policy.
**Minimum contents:** access control policy, encryption standards (at rest/in transit), secrets management, vulnerability management and patch cadence, logging and monitoring standards, third-party/vendor security requirements, security awareness training cadence.
**Depends on:** RC Security Review (§1.3 item 2), Incident Response Plan (§3.12).

### 3.3 Privacy Program
**Purpose:** operationalizes the GDPR/HIPAA privacy obligations identified in §2.1.
**Minimum contents:** data inventory and data flow mapping (what personal/health data Kadarn touches, where it goes), lawful basis per flow, data subject rights handling (access, deletion, portability), breach notification procedure and timelines, cross-border transfer mechanism (SCCs or equivalent) if applicable.
**Depends on:** GDPR Mapping (§3.18), DPA template (§3.7).

### 3.4 Vendor Management Program
**Purpose:** governs the Integration Fabric's external dependencies from a compliance angle, not just a technical one.
**Minimum contents:** vendor risk tiering, due diligence checklist before onboarding a vendor, contractual requirements per tier (security addenda, BAA where applicable), periodic reassessment cadence.

### 3.5 Business Associate Agreement (template)
**Purpose:** the HIPAA-required agreement for any Covered Entity / Business Associate relationship Kadarn enters as data processor of PHI.
**Minimum contents:** permitted uses and disclosures, safeguard obligations, breach notification timelines (HIPAA requires "without unreasonable delay," typically within 60 days), subcontractor flow-down obligations, termination and data-return/destruction terms.
**Depends on:** §2.1 HIPAA questions being answered first — a BAA template drafted before knowing when Kadarn is a Business Associate risks being generic and unusable.

### 3.6 Data Processing Agreement (template)
**Purpose:** the GDPR-equivalent of the BAA, for controller–processor relationships.
**Minimum contents:** processing scope and purpose, sub-processor authorization mechanism, data subject rights assistance obligations, breach notification timelines (GDPR: without undue delay, generally within 72 hours to the supervisory authority), international transfer mechanism, audit rights.

### 3.7 Network Participation Agreement (template)
**Purpose:** the master agreement an organization signs to join the Kadarn Network (per Lexicon's definition of Network) — distinct from the data-specific BAA/DPA.
**Minimum contents:** roles within the Network, Trust Graph implications of participation (what data feeds Trust scoring and who can see it), obligations as a counterpart in Transaction Twins, dispute resolution, termination and offboarding (what happens to in-flight Transaction Twins and Specimen Twins on exit).

### 3.8 Material Transfer Agreement (template)
**Purpose:** governs the legal transfer of physical Research Assets (biospecimens) between organizations — standard in biospecimen networks, but must be mapped explicitly to Kadarn's Specimen Twin and Shipment Twin lifecycle so the legal document and the system state stay synchronized.
**Minimum contents:** permitted use restrictions, ownership/title clauses, derivative-results handling, publication rights, biosafety/return-or-destroy terms.

### 3.9 Data Use Agreement (template)
**Purpose:** governs use of datasets/derived data distinct from physical specimens — maps to Dataset Twin.
**Minimum contents:** permitted use scope, re-identification prohibition (if de-identified data), data security requirements for the recipient, audit/reporting obligations back to the provider.

### 3.10 Quality Management System (QMS)
**Purpose:** required groundwork for any 21 CFR Part 11 relevance and generally expected by regulated biospecimen partners.
**Minimum contents:** document control procedure, change control procedure, CAPA (Corrective and Preventive Action) process, audit program (internal audits cadence), training records management.

### 3.11 Incident Response Plan
**Purpose:** operational counterpart to §1.3 item 4; must exist *and be exercised*, not just written.
**Minimum contents:** severity classification, escalation paths and on-call ownership, breach-specific procedures cross-referenced to HIPAA/GDPR notification timelines, communication templates (customer, regulator, internal), post-incident review process.

### 3.12 Disaster Recovery Plan
**Purpose:** technical continuity counterpart, tested not theoretical.
**Minimum contents:** RTO/RPO targets per system tier, backup and restore procedures (restore must be tested per §1.3 item 4), failover procedure, communication plan during an outage.

### 3.13 Business Continuity Plan
**Purpose:** the business-process counterpart to the Disaster Recovery Plan — what happens to operations (not just systems) during a disruption.
**Minimum contents:** critical business functions inventory, minimum staffing/continuity requirements, manual fallback procedures for critical workflows (e.g., how does a Shipment Twin get updated if the platform is down mid-transit), recovery prioritization order.

### 3.14 Retention Schedule
**Purpose:** defines how long each category of Research Asset, Evidence, and Event data is retained, and why — required input for both privacy compliance and 21 CFR Part 11 record-retention expectations.
**Minimum contents:** retention period per data category, legal basis for each period, secure destruction procedure, legal hold override process.

### 3.15 Records Management Policy
**Purpose:** governs how records (contracts, consent artifacts, audit logs, Evidence objects) are created, stored, and made retrievable — directly supports the Provenance and Evidence guarantees already promised in the Manifesto.
**Minimum contents:** records classification, storage and indexing standards, retrieval SLAs for audits, version control expectations.

### 3.16 Risk Register
**Purpose:** the living document that ties together security, regulatory, and operational risk — feeds the Company Compliance Manual.
**Minimum contents:** risk description, likelihood/impact scoring, mitigation owner, mitigation status, review cadence. Should explicitly include the items currently flagged as "Open" in §2.1.

### 3.17 HIPAA Security Rule Mapping
**Purpose:** maps each HIPAA Security Rule safeguard (administrative, physical, technical) to a specific Kadarn control or document.
**Minimum contents:** control-by-control mapping table, gap notes, remediation owner and target date for each gap.

### 3.18 GDPR Mapping
**Purpose:** maps GDPR articles relevant to Kadarn's processing activities to specific controls/documents.
**Minimum contents:** lawful basis mapping per data flow, Article 30 records of processing, DPIA trigger assessment (is a Data Protection Impact Assessment required given the scope decision in §1.4?).

### 3.19 21 CFR Part 11 Gap Assessment
**Purpose:** assesses how far Kadarn's electronic records and signatures are from Part 11 expectations — directly relevant if Transaction Twins or consent artifacts are treated as regulated electronic records by any partner.
**Minimum contents:** electronic signature controls assessment, audit trail completeness assessment (does the Provenance Graph satisfy Part 11 audit trail expectations as-is?), system validation status.

### 3.20 SOC 2 Readiness Matrix
**Purpose:** maps Trust Service Criteria (security, availability, processing integrity, confidentiality, privacy — choose applicable ones) to existing controls and documents gaps.

### 3.21 ISO 27001 Readiness Matrix
**Purpose:** maps Annex A controls to existing controls and documents gaps; can share most of its evidence base with §3.20 and §3.17 if structured consistently.

---

## 4. Sequencing Recommendation

1. Resolve the test-count discrepancy and close the RC Exit Checklist (§1.3) — this is a hard gate.
2. In parallel, start the Risk Register (§3.16) and the open-questions register (§2.1) immediately — they have the longest lead time and the least dependency on code being finished.
3. Ratify the scope ADR (§1.4) before drafting the Network Participation Agreement and Material Transfer Agreement — those documents need a settled scope statement to avoid rework.
4. Draft BAA/DPA templates only after §2.1's HIPAA/GDPR applicability questions have at least preliminary answers — a generic template drafted too early tends to need a full rewrite once the actual data flows are mapped.
5. Treat the full Governance & Compliance Pack as v0.1 drafts initially — each should be reviewed by qualified counsel before being represented to any client or auditor as authoritative.

---

## 5. Open Items Flagged for Language Governance (per Lexicon §1.5)

- The versioning vocabulary in §1.2 (`release-candidate` as a formal stage label) is new and should be approved or amended before being used in actual release tags.
- The proposed ADR in §1.4 changes how Kadarn's scope is described publicly; this has downstream effects on the Manifesto's "What Kadarn Is" section (§2.3 of the existing Manifesto) and should be reconciled with it, not left as a parallel narrative.
