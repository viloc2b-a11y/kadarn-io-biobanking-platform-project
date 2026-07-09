# Kadarn Claim Taxonomy v1.1 — Hybrid Trial Readiness Domain

**Version:** 1.1
**Status:** ✅ Ratified — KTP-1.3
**Normative sources:** KEMS-001 v1.0, Lexicon v1.2, ADR-004 (Platform Boundaries), ADR-011 (Evidence Core Boundary)
**Domain scope:** Clinical Trials — Hybrid Trial Readiness
**Supersedes:** v1.0 §Reserved domains (activates reserved `clinical_trials` domain)
**Effective date:** 2026-07-09

---

## 1. Purpose

This document defines the canonical claim taxonomy for **Hybrid Trial Readiness** within the Kadarn Evidence Core. It extends the v1.0 taxonomy (biospecimen domain) by activating the reserved `clinical_trials` domain with a `hybrid` subdomain containing 10 claim families.

Each claim family evaluates a specific dimension of an institution's readiness to participate in hybrid, decentralized, or at-home clinical trials.

This taxonomy is the **source of truth** for:
- Evidence requirements in `readiness_evidence_requirements` (migration 055)
- Claim generation in the onboarding interview engine
- Confidence computation in the readiness engine
- Capability derivation in the passport read model
- Sponsor-facing readiness reports

---

## 2. Scope

### In scope

- Institutional readiness to execute hybrid clinical trial components
- Evidence requirements for each hybrid trial capability dimension
- Confidence degradation rules specific to hybrid trial evidence patterns
- N/A and UNKNOWN handling for optional or uncollected capabilities
- Sponsor-facing explanations and site-facing gap guidance

### Out of scope

- Trial management operations (CTMS — see ADR-004)
- Patient-level clinical data capture (EDC — see ADR-004)
- Regulatory document lifecycle management (eTMF — see ADR-004)
- Laboratory information management (LIMS — see ADR-004)
- Home nurse scheduling or dispatch operations
- Vendor contract negotiation or procurement
- Device procurement or hardware logistics
- Real-time patient monitoring operations
- Guarantee of future compliance (KEMS-003: Kadarn builds trust through evidence, not promises)

---

## 3. Non-Goals

This taxonomy does **not**:

- Certify institutions as "hybrid trial ready" — Kadarn reports evidence-backed confidence, not certification
- Replace sponsor qualification or oversight — sponsors remain responsible for trial-specific due diligence
- Guarantee future performance — readiness is a current-state assessment based on verifiable evidence
- Use "Trust Score" or any composite trust metric — Kadarn reports confidence per claim, not aggregated trust
- Use "Verified Site" or "Certified Site" labels — these imply guarantees Kadarn does not make
- Rank institutions against each other — readiness is absolute per-institution, not comparative

---

## 4. Canonical Language

### Terms used

| Term | Definition |
|------|-----------|
| **Claim** | A verifiable statement about an institutional capability (KEMS-001 §1) |
| **Evidence** | Structured proof that supports or contradicts a claim (KEMS-001 §2) |
| **Confidence** | Numeric value (0.00–1.00) representing how strongly evidence supports a claim |
| **Readiness** | Aggregate confidence across all capability dimensions for a program type |
| **Hybrid Trial** | Clinical trial incorporating both site-based and decentralized (at-home, remote) components |
| **DCT** | Decentralized Clinical Trial — synonym for hybrid trial in regulatory contexts |
| **Self-declared** | Evidence Class B only, without operational (C), external (F), or public (A) corroboration |
| **Supported** | Evidence backed by operational records (C) or external confirmation (A, F) beyond self-declaration |
| **N/A** | Not Applicable — institution does not perform this activity and has explicitly declared so |
| **UNKNOWN** | Evidence has not been collected — distinct from absence of capability |

### Terms NOT used

| Term | Reason excluded |
|------|----------------|
| Trust Score | Kadarn reports confidence, not trust. Trust is a human judgment. |
| Verified Site | Implies certification. Kadarn reports evidence, not certification. |
| Certified Site | Implies guarantee. Kadarn does not guarantee future compliance. |
| Qualified Site | Implies sponsor-specific approval. Readiness is sponsor-agnostic. |
| Approved | Implies regulatory endorsement. Kadarn does not endorse. |

---

## 5. Readiness States

Readiness for Hybrid Trial is expressed as one of four states, computed from evidence across all applicable claim families:

| State | Condition | Meaning |
|-------|-----------|---------|
| `ready` | All mandatory claims met with confidence ≥ threshold (0.75), all optional claims also met | Institution has sufficient evidence across all applicable hybrid trial dimensions |
| `conditionally_ready` | All mandatory claims met, at least one optional claim met, but not all optional | Institution meets core requirements; some optional capabilities are developing |
| `partial` | All mandatory claims met but zero optional claims met, OR some mandatory claims unmet but non-zero evidence exists | Institution has foundational evidence but significant gaps remain |
| `not_ready` | One or more mandatory claims unmet (excluding N/A and UNKNOWN) | Institution cannot demonstrate minimum hybrid trial readiness |

**Key rules:**
- N/A claims are excluded from mandatory/optional counts entirely
- UNKNOWN claims are excluded from mandatory/optional counts — they are not treated as unmet
- The readiness threshold (0.75) is configurable per program type in `program_type_taxonomy.readiness_threshold`

---

## 6. Evidence Support Rules

Each claim is classified into one of eight evidence support levels during evaluation:

| Level | Condition | Confidence cap |
|-------|-----------|---------------|
| `SUPPORTED_BY_EVIDENCE` | Evidence includes Class A or F, or spans 3+ classes including C | No cap |
| `PARTIALLY_SUPPORTED` | Evidence includes Class B + C but no A, D, or F | 0.65 |
| `DECLARED_ONLY` | All evidence is Class B (self-declared) only | 0.40 |
| `NEEDS_EVIDENCE` | Some evidence exists but mandatory classes (B+C) are incomplete | 0.50 |
| `UNKNOWN` | No evidence collected — claim not yet evaluated | Excluded from confidence avg |
| `NOT_APPLICABLE` | Institution explicitly declared this does not apply | Excluded from all counts |
| `NEEDS_REVIEW` | Evidence exists but is approaching expiry (within 25% of decay period) | No cap; flagged for review |
| `EXPIRED_OR_OUTDATED` | All evidence has exceeded decay period | 0.30 |

**Self-report hard cap:** A claim backed by Class B evidence only cannot exceed 0.40 confidence, regardless of the number of Class B nodes. Self-declaration alone is not sufficient to demonstrate capability.

**Operational-only cap:** A claim backed by Class B + C only (no external corroboration) cannot exceed 0.65 confidence. Operational evidence helps but external confirmation (A, F) or cross-source corroboration (D) is required for high confidence.

---

## 7. Claim Taxonomy Table

```
clinical_trials                          ← activated from v1.0 reserved domains
└── hybrid                               ← new subdomain
    ├── clinical_trials.hybrid.site_execution
    ├── clinical_trials.hybrid.at_home_coordination
    ├── clinical_trials.hybrid.data_integrity
    ├── clinical_trials.hybrid.patient_access_diversity
    ├── clinical_trials.hybrid.biospecimen_at_home
    ├── clinical_trials.hybrid.remote_monitoring
    ├── clinical_trials.hybrid.vendor_nurse_coordination
    ├── clinical_trials.hybrid.protocol_compliance
    ├── clinical_trials.hybrid.safety_escalation
    └── clinical_trials.hybrid.historical_experience
```

| # | Claim ID | Mandatory | Can be N/A | Decay (months) | Required Evidence Classes |
|---|----------|-----------|------------|----------------|--------------------------|
| 1 | `site_execution` | Yes | No | 12 | B + C |
| 2 | `at_home_coordination` | Yes | Yes | 12 | B + C |
| 3 | `data_integrity` | Yes | No | 24 | B + C |
| 4 | `patient_access_diversity` | Yes | Yes (labs/reference facilities only) | 36 | B + C |
| 5 | `biospecimen_at_home` | Yes | Yes | 6 | B + C |
| 6 | `remote_monitoring` | No (optional) | Yes | 12 | B + C |
| 7 | `vendor_nurse_coordination` | Yes | Yes | 12 | B + C |
| 8 | `protocol_compliance` | Yes | No | 12 | B + C |
| 9 | `safety_escalation` | Yes | No | 12 | B + C |
| 10 | `historical_experience` | No (optional) | Yes | 60 | A or C |

---

## 8. Detailed Claim Definitions

---

### Claim 1: `clinical_trials.hybrid.site_execution`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.site_execution` |
| **Label** | Site-Based Execution Readiness |
| **Statement** | The institution can execute site-based components of hybrid clinical trials with documented procedures, adequate physical infrastructure, and trained staff deployed for in-person protocol visits. |
| **Operational Context** | Site execution is the physical anchor of a hybrid trial. Even in decentralized models, certain visits (screening, complex assessments, IP administration, emergency response) require a physical site. This claim evaluates whether the site component is documented, staffed, and operationally proven. |
| **What This Claim Supports** | That the institution has defined procedures for site-based visits, can demonstrate operational site visit records, and has the infrastructure (exam rooms, dedicated research space, backup power) to execute protocol-driven in-person visits. |
| **What This Claim Does NOT Prove** | That the institution can execute at-home visits (see `at_home_coordination`). That the institution has experience with hybrid trials specifically (see `historical_experience`). That the site is qualified for any specific protocol. |
| **Required Evidence** | Class B: Site execution SOP or facility documentation (minimum 1). Class C: Operational visit records showing site-based execution within protocol timelines (minimum 1). |
| **Optional Evidence** | Class F: Sponsor site qualification letter or monitoring visit confirmation report. |
| **Conditional Evidence** | If the institution declares early-phase capability → overnight/stay capacity documentation (Class B) required. If the institution operates multiple locations → facility documentation per location (Class B) required. |
| **Historical Evidence** | Prior site visit records spanning ≥ 12 months (Class C, demonstrates temporal continuity). Prior monitoring visit reports confirming site adequacy (Class F). ClinicalTrials.gov study records showing site-based study participation (Class A). |
| **Evidence Classes Expected** | B, C, D, E, F. Class A is not applicable (site execution is not a public registry item). |
| **N/A Logic** | Cannot be N/A. Every institution participating in clinical research has a physical site component. If the institution is a virtual-only entity with zero physical locations, this must be explicitly declared and verified. |
| **UNKNOWN Logic** | If no site execution data has been collected, the claim is UNKNOWN. It is excluded from mandatory counts — this prevents new institutions from being penalized before completing onboarding. Gap guidance: "Complete the Infrastructure section and upload site execution SOP." |
| **Expired Evidence Behavior** | Site execution evidence decays after 12 months without new operational visit records. Expired evidence drops confidence by up to 25 points. Renewal: upload recent site visit records or updated facility documentation. |
| **Confidence Degradation Triggers** | Only self-declared (Class B, no Class C or F) → cap at 0.40. No operational visit records in 12 months → -20% confidence. Facility documentation older than 24 months → -15%. Multiple locations declared but documentation for only one → -10% per missing location. |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | 1 Class B (SOP or facility doc) + 1 Class C (visit record within 24 months). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | 1 Class B + 2 Class C (visit records spanning ≥ 6 months) + 1 Class F (sponsor confirmation OR monitoring visit report). |
| **Sponsor-Facing Explanation** | "This institution has documented site-based execution procedures. [N] operational site visits recorded in the past 12 months across [X] locations. Facility documentation supports [Y] exam rooms and [Z] dedicated research spaces. [Sponsor qualification letter on file / No sponsor confirmation available]." |
| **Site-Facing Gap Guidance** | "Upload your site execution SOP or facility documentation. Add operational visit records from recent studies to demonstrate active site capability. Missing: [list specific missing evidence items]." |
| **Example Evidence Packet** | Site Visit SOP v2.1 (B), facility floor plan showing 4 exam rooms (B), 47 completed site visit logs with timestamps from Study ABC-123 (C), sponsor site qualification letter from XYZ Pharma dated 2026-03 (F). |

---

### Claim 2: `clinical_trials.hybrid.at_home_coordination`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.at_home_coordination` |
| **Label** | At-Home Coordination Readiness |
| **Statement** | The institution can coordinate at-home patient visits with a defined responsibility matrix, documented at-home workflow SOPs, contracted home health providers, and communication and escalation pathways that connect home, site, and sponsor. |
| **Operational Context** | At-home visits are the defining feature of decentralized trials. Coordination involves scheduling, provider deployment, remote visit documentation, patient communication, and escalation when home environments present unexpected conditions. This claim evaluates whether the coordination framework exists and has been operationalized. |
| **What This Claim Supports** | That the institution has a responsibility matrix defining who does what across site, home, and vendor roles. That at-home workflows are documented. That home health providers are contracted and trained. That communication and escalation pathways exist from home to site to sponsor. |
| **What This Claim Does NOT Prove** | That the institution can collect biospecimens at home (see `biospecimen_at_home`). That remote monitoring devices are deployed (see `remote_monitoring`). That home nurses are qualified for IP administration (see `vendor_nurse_coordination`). That at-home safety events are handled (see `safety_escalation`). |
| **Required Evidence** | Class B: Responsibility matrix AND at-home workflow SOP (minimum 2). Class C: At-home visit completion records or coordination logs (minimum 1). |
| **Optional Evidence** | Class F: Sponsor confirmation of at-home coordination capability. |
| **Conditional Evidence** | If at-home visits include biospecimen collection → `biospecimen_at_home` claim must also be evaluated. If at-home visits include IP administration → `vendor_nurse_coordination` claim must also be evaluated. If multiple home health providers → training records per provider (Class B) required. |
| **Historical Evidence** | Prior at-home visit completions spanning ≥ 6 months (Class C). Patient satisfaction or retention data from at-home arms (Class C). Sponsor confirmation of at-home execution in prior studies (Class F). |
| **Evidence Classes Expected** | B, C, D, E, F. Class A does not apply (no public registry for at-home coordination). |
| **N/A Logic** | N/A if the institution explicitly declares zero at-home visit capability and does not participate in decentralized trials. A virtual site cannot mark this N/A — at-home IS their site. A reference lab or processing-only facility can mark N/A. When N/A, the `biospecimen_at_home` and `vendor_nurse_coordination` claims are also evaluated for N/A eligibility. |
| **UNKNOWN Logic** | If the hybrid trial questionnaire has not been completed, this claim is UNKNOWN. Gap guidance: "Complete the At-Home Coordination section to evaluate this capability." |
| **Expired Evidence Behavior** | At-home coordination evidence decays after 12 months without new at-home visit records. Vendor contracts older than 24 months → flagged for review. |
| **Confidence Degradation Triggers** | Responsibility matrix missing → cap at 0.30. No at-home visit records in 12 months → -25%. Vendor contracts expired → -20%. Only self-declared (Class B, no Class C or F) → cap at 0.40. Workflow SOP present but no operational records → cap at 0.45. |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | Responsibility matrix (B) + at-home workflow SOP (B) + 1 at-home visit record within 24 months (C). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | Responsibility matrix (B) + at-home workflow SOP (B) + 3+ at-home visit records spanning ≥ 6 months (C) + sponsor confirmation OR home health provider contract (F or B). |
| **Sponsor-Facing Explanation** | "This institution has a defined at-home coordination framework with a documented responsibility matrix. [N] home health providers are contracted. [X] at-home visits completed in the past 12 months across [Y] therapeutic areas. Communication and escalation pathways are documented. [Sponsor confirmation on file / No sponsor confirmation available]." |
| **Site-Facing Gap Guidance** | "Define and upload your responsibility matrix showing roles across site, home health, and vendor staff. Upload your at-home workflow SOP. Add at-home visit completion records. Missing: responsibility matrix, workflow SOP, visit records." |
| **Example Evidence Packet** | Responsibility Matrix v1.0 assigning PI, CRC, home health RN, and vendor coordinator roles (B), At-Home Visit Workflow SOP v3.2 covering scheduling, confirmation, documentation, and escalation (B), 23 at-home visit completion logs from Study DEF-456 (C), home health agency master services agreement (B), sponsor confirmation letter for at-home capability (F). |

---

### Claim 3: `clinical_trials.hybrid.data_integrity`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.data_integrity` |
| **Label** | Hybrid Data Integrity Readiness |
| **Statement** | The institution can maintain data integrity across all hybrid trial data collection points with documented source documentation procedures, validated EHR/EDC/eSource/eConsent workflows, audit trail and query management processes, and a data review workflow that ensures consistency between site-collected and remote-collected data before database lock. |
| **Operational Context** | Hybrid trials generate data from multiple sources: site EMR, at-home devices, patient-reported outcomes, eConsent platforms, and remote monitoring feeds. Data integrity requires that all sources are documented, validated, reconciled, and auditable. This claim evaluates the institution's data governance across the hybrid data lifecycle. |
| **What This Claim Supports** | That the institution has a source documentation SOP covering all data collection points. That EHR/EDC/eSource/eConsent workflows are documented and validated. That audit trails and query resolution processes exist. That a data review workflow reconciles site and remote data before database lock. |
| **What This Claim Does NOT Prove** | That specific EDC/eSource platforms are 21 CFR Part 11 compliant (that is platform-specific, not institutional). That data is transmitted securely (see infrastructure and technology documentation). That the institution manages the EDC system itself (many institutions use sponsor-provided EDC). |
| **Required Evidence** | Class B: Source documentation SOP AND data integrity / data review SOP (minimum 2). Class C: Audit trail records or query resolution logs (minimum 1). |
| **Optional Evidence** | Class A: 21 CFR Part 11 compliance documentation or regulatory certification. Class F: Sponsor audit confirmation referencing data integrity. |
| **Conditional Evidence** | If eConsent is in use → eConsent system validation documentation (Class B) + Part 11 compliance documentation (Class A) required. If eSource is in use → eSource workflow documentation (Class B) + system validation records (Class B) required. If remote data feeds into EDC → data integration validation (Class B) required. If multiple EDC platforms are used → platform-specific workflow documentation per platform (Class B). |
| **Historical Evidence** | Prior audit trail reviews spanning ≥ 12 months (Class C). Query resolution metrics showing closure rates and turnaround times (Class C). Sponsor audit reports referencing data integrity outcomes (Class F). Regulatory inspection outcomes with no data integrity findings (Class A). |
| **Evidence Classes Expected** | A, B, C, D, E, F. |
| **N/A Logic** | Cannot be N/A. Every institution participating in clinical research handles data. Data integrity is universal. Minimum expectation is at least Class B self-declaration. |
| **UNKNOWN Logic** | If the data systems section has not been completed, this claim is UNKNOWN. Gap guidance: "Complete the Data Systems & Integrity section to evaluate this capability." |
| **Expired Evidence Behavior** | Data integrity evidence decays after 24 months. System validation records older than 24 months → treated as expired. Audit trail records older than 24 months → still useful for temporal continuity (Class E) but not as current operational evidence (Class C). |
| **Confidence Degradation Triggers** | No audit trail evidence → -25%. Only self-declared (Class B, no Class C or A or F) → cap at 0.40. System validation expired (>24 months) → -20%. eSource/eConsent declared but no Part 11 compliance documentation → cap at 0.35. Query resolution logs present but no source documentation SOP → cap at 0.45. |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | Source documentation SOP (B) + data integrity SOP (B) + 1 audit trail or query log within 24 months (C). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | Source documentation SOP (B) + data integrity SOP (B) + 3+ audit trail/query records spanning ≥ 12 months (C) + Part 11 documentation OR sponsor audit confirmation (A or F). |
| **Sponsor-Facing Explanation** | "This institution maintains documented data integrity procedures including source documentation SOP and data review workflow. [N] audit trail exports and [X] query resolution records available from the past 24 months. [EHR/EDC/eSource/eConsent] systems are documented and [validated / self-declared]. [Part 11 compliance documentation on file / Part 11 compliance not documented]." |
| **Site-Facing Gap Guidance** | "Upload your source documentation SOP and data integrity/data review SOP. Add audit trail records or query resolution logs from recent studies. If using eSource or eConsent, upload system validation documentation. Missing: source doc SOP, data integrity SOP, audit trail records." |
| **Example Evidence Packet** | Source Documentation SOP v4.1 covering site EMR, remote device data, and patient-reported outcomes (B), Data Review Workflow SOP v2.0 defining pre-lock reconciliation process (B), 12 audit trail exports from Study GHI-789 (C), query resolution log showing 94% closure rate within 7 days (C), 21 CFR Part 11 compliance assessment for eSource platform (A), sponsor audit report confirming data integrity controls (F). |

---

### Claim 4: `clinical_trials.hybrid.patient_access_diversity`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.patient_access_diversity` |
| **Label** | Patient Access & Diversity Readiness |
| **Statement** | The institution can ensure broad patient access and demographic diversity in hybrid trials through a characterized patient panel, documented geographic reach, language accessibility services, underserved community access programs, and tracked enrollment diversity metrics with retention history. |
| **Operational Context** | Hybrid trials can expand access by reducing travel burden, but only if the institution actively reaches diverse populations. This claim evaluates five distinct access dimensions: (1) patient panel characterization, (2) geographic reach, (3) language accessibility, (4) underserved community access programs, and (5) enrollment diversity metrics with retention history. |
| **What This Claim Supports** | That the institution has a characterized patient panel with documented demographics. That geographic reach extends beyond a single catchment area. That language accessibility services are documented for the populations served. That underserved community access programs exist. That enrollment diversity and retention metrics are tracked. |
| **What This Claim Does NOT Prove** | That the institution will enroll diverse populations in any specific trial. That the institution meets FDA diversity guidance for a particular indication. That community outreach programs are effective (effectiveness requires outcomes data, which is Class C). |
| **Required Evidence** | Class B: Patient panel demographics documentation or language accessibility plan (minimum 1). Class C: Enrollment diversity metrics from prior studies or retention rate reports (minimum 1). |
| **Optional Evidence** | Class A: Public diversity plan submission or community outreach program documentation. Class F: Sponsor confirmation of diverse enrollment capability. |
| **Conditional Evidence** | If multiple languages are declared → language accessibility documentation per language (Class B) required. If underserved community access is claimed → community outreach program documentation (Class B) + referral network evidence (Class C) required. If geographic reach spans multiple states/countries → site location documentation per region (Class B) required. |
| **Historical Evidence** | Prior enrollment diversity metrics across multiple studies (Class C). Retention rate trends over ≥ 24 months (Class E). Patient panel growth over time (Class E). Community outreach event records (Class C). |
| **Evidence Classes Expected** | A, B, C, D, E, F. |
| **N/A Logic** | N/A if the institution is a reference lab, processing-only facility, or biobank with zero patient contact and zero recruitment activity. Must be explicitly declared with rationale. When N/A, excluded from mandatory counts. |
| **UNKNOWN Logic** | If the patient access section has not been completed, this claim is UNKNOWN. Gap guidance: "Complete the Patient Access & Diversity section to evaluate this capability." |
| **Expired Evidence Behavior** | Patient panel demographics evidence decays after 36 months. Enrollment diversity metrics older than 36 months → treated as historical context (Class E) but not current operational evidence (Class C). Retention data older than 36 months → flagged as potentially stale. |
| **Confidence Degradation Triggers** | No diversity metrics in 36 months → -25%. Patient panel undocumented → cap at 0.30. Languages claimed without documentation → -10% per undocumented language. Retention data absent → -15%. Only self-declared (Class B, no Class C or A or F) → cap at 0.40. Geographic reach claimed but only one location documented → -15%. |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | Patient panel demographics doc (B) + 1 enrollment diversity report within 36 months (C). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | Patient panel demographics (B) + language accessibility plan for all claimed languages (B) + 3+ enrollment diversity reports spanning ≥ 12 months (C) + community outreach documentation OR sponsor confirmation (A/B/F). Retention rate ≥ 70% documented. |
| **Sponsor-Facing Explanation** | "This institution serves a patient panel of [N] with documented demographics across [X] therapeutic areas. Geographic reach: [single city / metro area / state / national / multi-country]. Languages supported: [list]. [Y] enrollment diversity reports available from prior studies. Underserved access programs: [list or 'None documented']. Retention rate: [Z]%." |
| **Site-Facing Gap Guidance** | "Upload your patient panel demographics documentation. Add enrollment diversity metrics from prior studies. If you serve non-English populations, upload language accessibility documentation for each language. Missing: panel demographics, diversity metrics, language accessibility plan." |
| **Example Evidence Packet** | Patient Panel Demographics Report Q1 2026 showing 8,200 active patients across oncology, endocrinology, cardiology (B), Language Accessibility Plan covering Spanish, Mandarin, and Vietnamese with interpreter service agreements (B), 3 enrollment diversity reports from Studies JKL, MNO, PQR showing 42% non-white enrollment (C), Community Outreach Program documentation with 4 partner clinics in underserved ZIP codes (B), retention rate report showing 82% across 3 studies (C). |

---

### Claim 5: `clinical_trials.hybrid.biospecimen_at_home`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.biospecimen_at_home` |
| **Label** | Biospecimen-at-Home Readiness |
| **Statement** | The institution can collect, handle, and ship biospecimens from patient homes with validated at-home collection procedures, documented chain of custody from home to lab, defined sample workflow for home collection, courier/shipping coordination for home pickups, and temperature/cold chain monitoring throughout the home-to-lab transport pipeline. |
| **Operational Context** | At-home biospecimen collection introduces unique risks: collection by non-lab personnel (home health staff or patients), uncontrolled home environments, extended transport time from home to lab, and temperature excursions during transit. This claim evaluates the institution's ability to maintain specimen integrity across this distributed collection model. |
| **What This Claim Supports** | That the institution has validated at-home collection kits and procedures. That chain of custody is maintained from the moment of collection at home through lab receipt. That sample workflow defines handling, stabilization, and packaging for home collection. That courier/shipping is coordinated for home pickups with defined pickup windows. That temperature is monitored and controlled throughout transport. |
| **What This Claim Does NOT Prove** | That the institution can coordinate at-home visits in general (see `at_home_coordination`). That the lab processing the specimens is qualified (see biospecimen domain claims in v1.0 taxonomy). That international shipping from home is IATA-compliant (this is conditional evidence). |
| **Required Evidence** | Class B: At-home collection SOP AND chain of custody SOP (minimum 2). Class C: Completed at-home collection records with temperature data (minimum 1). |
| **Optional Evidence** | Class C: Courier performance reports or shipping temperature logs (additional). Class F: Sponsor or courier confirmation of at-home biospecimen quality. |
| **Conditional Evidence** | If temperature-sensitive specimens are collected → continuous temperature monitoring records from home-to-lab transport (Class C) + shipping validation documentation (Class B). If international shipping from patient homes → IATA certification for dangerous goods (Class B). If patient self-collection kits are used → patient instruction materials with comprehension verification (Class B). If multiple courier vendors → performance comparison records (Class C). |
| **Historical Evidence** | Prior at-home collection completions spanning ≥ 6 months (Class C). Temperature excursion records with documented resolution (Class C). Courier on-time performance trends (Class C, Class E). Specimen quality metrics from at-home collections (Class C). Sponsor confirmation of at-home biospecimen quality in prior studies (Class F). |
| **Evidence Classes Expected** | B, C, D, E, F. Class A does not apply (no public registry for at-home biospecimen procedures). |
| **N/A Logic** | N/A if the institution does not perform biospecimen collection at home. This is expected for sites that only do site-based collections. If at-home coordination is declared AND biospecimen operations are declared, this claim cannot be N/A unless the institution explicitly states they do at-home visits but never collect specimens during them. |
| **UNKNOWN Logic** | If biospecimen-at-home data has not been collected, this claim is UNKNOWN. Gap guidance: "Complete the Biospecimen at Home section to evaluate this capability." |
| **Expired Evidence Behavior** | Biospecimen-at-home evidence decays aggressively — 6 months without new at-home collection records. This reflects the operational sensitivity of home collections (kit expiration, courier contract changes, staff turnover). Temperature monitoring records older than 6 months → treated as expired. |
| **Confidence Degradation Triggers** | No at-home collection records in 6 months → -30%. Chain of custody gaps (missing handoff documentation) → -25%. Temperature excursions without documented resolution → -20% per excursion. Only self-declared (Class B, no Class C) → cap at 0.35. Courier performance data absent → -10%. No temperature monitoring records → cap at 0.30 (temperature control is critical for biospecimen integrity). |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | At-home collection SOP (B) + chain of custody SOP (B) + 1 completed at-home collection record with temperature data within 6 months (C). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | At-home collection SOP (B) + chain of custody SOP (B) + 5+ at-home collection records spanning ≥ 3 months (C) + temperature monitoring records showing zero excursions or all excursions resolved (C) + courier performance report OR sponsor confirmation (C or F). |
| **Sponsor-Facing Explanation** | "This institution has validated at-home biospecimen collection procedures with [N] collections completed in the past 6 months. Chain of custody is documented from home to lab with temperature monitoring throughout. [X] temperature excursions documented and [all resolved / Y unresolved]. Courier performance: [Z]% on-time pickup rate. [IATA certification on file for international shipping / Domestic shipping only]." |
| **Site-Facing Gap Guidance** | "Upload your at-home collection SOP and chain of custody SOP. Add completed at-home collection records with temperature data. If shipping internationally, upload IATA certification. Missing: collection SOP, chain of custody SOP, collection records, temperature data." |
| **Example Evidence Packet** | At-Home Blood Collection Kit SOP v2.0 with validated 4-hour stability window (B), Chain of Custody SOP for Home-to-Lab Transport v1.3 with 4-point handoff documentation (B), 31 completed at-home collection manifests with timestamps from Study STU-012 (C), continuous temperature log from 31 shipments showing 2 excursions (both resolved within 30 min) (C), courier performance report showing 97% on-time pickup rate (C), sponsor confirmation of at-home specimen quality (F). |

---

### Claim 6: `clinical_trials.hybrid.remote_monitoring`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.remote_monitoring` |
| **Label** | Remote Monitoring Readiness |
| **Statement** | The institution can deploy and manage remote patient monitoring devices with documented SOPs for device deployment and retrieval, patient training materials, data ingestion workflows from wearables/sensors/home devices into the clinical data flow, and alert management procedures for device-generated notifications. |
| **Operational Context** | Remote monitoring extends data collection beyond the clinic using wearable sensors, home monitoring devices, and patient-facing apps. This claim evaluates whether the institution has the operational framework to deploy devices, train patients, ingest data, and manage alerts — not whether specific devices are FDA-cleared (that is device-specific). |
| **What This Claim Supports** | That the institution has SOPs for remote monitoring and device management. That patient training materials exist. That remote data is ingested into the clinical data flow. That alert management procedures are documented and tested. |
| **What This Claim Does NOT Prove** | That specific devices are validated or FDA-cleared for a given indication. That the institution manufactures or configures devices. That remote data is integrated with any specific EDC platform. That the institution provides 24/7 alert response (this requires operational evidence). |
| **Required Evidence** | Class B: Remote monitoring SOP AND device management SOP (minimum 2). Class C: Remote monitoring data records or alert management logs (minimum 1). |
| **Optional Evidence** | Class F: Device vendor or sponsor confirmation of remote monitoring capability. |
| **Conditional Evidence** | If wearables are deployed → device calibration records (Class B) + patient training documentation (Class B) required. If remote data feeds into EDC → data integration validation documentation (Class B) required. If alert-based safety triggers are used → alert-to-escalation workflow documentation (Class B) required. |
| **Historical Evidence** | Prior remote monitoring deployments spanning ≥ 12 months (Class C). Device retrieval and compliance rates across studies (Class C). Alert response metrics (Class C). Patient training completion records (Class B). |
| **Evidence Classes Expected** | B, C, D, E, F. Class A does not apply (no public registry for remote monitoring capability). |
| **N/A Logic** | N/A if the institution does not use remote monitoring in any trial. Explicit N/A declaration required. When N/A, excluded from optional counts — does not penalize readiness. |
| **UNKNOWN Logic** | If the remote monitoring section has not been completed, this claim is UNKNOWN. Gap guidance: "Complete the Remote Monitoring section to evaluate this capability." |
| **Expired Evidence Behavior** | Remote monitoring evidence decays after 12 months without new deployment records. Device calibration records older than 12 months → treated as expired. Patient training materials older than 24 months → flagged for review (may be outdated). |
| **Confidence Degradation Triggers** | No monitoring records in 12 months → -25%. No device calibration records → -15%. Only self-declared (Class B, no Class C or F) → cap at 0.40. Alert management claimed but no alert logs → -10%. |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | Remote monitoring SOP (B) + device management SOP (B) + 1 monitoring data record or alert log within 12 months (C). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | Remote monitoring SOP (B) + device management SOP (B) + patient training materials (B) + 3+ monitoring data records spanning ≥ 6 months (C) + device calibration records (B) + sponsor or vendor confirmation (F). |
| **Sponsor-Facing Explanation** | "This institution has deployed [N] remote monitoring devices across [X] studies. Patient training is documented for all deployed devices. Remote data ingestion workflows are documented. Alert management procedures are in place with [Y] alerts processed in the past 12 months. [Device calibration records on file / Calibration records not available]." |
| **Site-Facing Gap Guidance** | "Upload your remote monitoring SOP and device management SOP. Add remote monitoring data records or alert management logs. If devices are deployed, upload calibration and patient training documentation. Missing: monitoring SOP, device SOP, monitoring records." |
| **Example Evidence Packet** | Remote Monitoring SOP v2.1 covering wearable deployment, data ingestion, and alert management (B), Device Management SOP v1.0 covering inventory, calibration, retrieval, and cleaning (B), Patient Training Guide for ActiGraph GT9X with comprehension quiz (B), 45 remote monitoring data ingestion records from Study VWX-345 (C), device calibration certificates for 12 ActiGraph units dated 2026-01 (B), alert management log showing 8 alerts with 100% response within 2 hours (C). |

---

### Claim 7: `clinical_trials.hybrid.vendor_nurse_coordination`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.vendor_nurse_coordination` |
| **Label** | Vendor / Home Nurse Coordination Readiness |
| **Statement** | The institution can coordinate external vendors and home nursing services with documented vendor qualification SOP, vendor training SOP, contract/agreement management, training oversight with completion records, and performance monitoring that integrates vendor-delivered services into the clinical trial workflow. |
| **Operational Context** | Hybrid trials often depend on third-party home health agencies, mobile phlebotomy services, and specialized nursing providers. The institution must qualify, train, and monitor these vendors — they are an extension of the site, not an independent entity. This claim evaluates whether the institution manages vendors as part of its quality system. |
| **What This Claim Supports** | That the institution qualifies vendors before engagement. That vendor staff receive protocol-specific training. That vendor performance is monitored and documented. That vendor-delivered services are integrated into the trial workflow (visit documentation, data entry, safety reporting). |
| **What This Claim Does NOT Prove** | That specific vendors are qualified for a given protocol (that is protocol-specific). That vendor contracts are financially favorable. That the institution can perform the vendor's services itself. That vendor staff are institution employees. |
| **Required Evidence** | Class B: Vendor qualification SOP AND vendor training SOP (minimum 2). Class C: Vendor performance records or training completion logs (minimum 1). |
| **Optional Evidence** | Class F: Sponsor approval of vendor qualification. |
| **Conditional Evidence** | If home nurses administer IP → IP administration training documentation (Class B) + delegation log (Class B) required. If multiple vendors are used → vendor performance comparison records (Class C) required. If vendors change between studies → re-qualification documentation per vendor (Class B) required. If vendor staff have patient contact → background check and credential verification documentation (Class B) required. |
| **Historical Evidence** | Prior vendor deployments across ≥ 2 studies (Class C). Vendor performance trends over time (Class E). Training completion history by vendor (Class C). Sponsor audit outcomes involving vendor activities (Class F). |
| **Evidence Classes Expected** | B, C, D, E, F. Class A does not apply. |
| **N/A Logic** | N/A if the institution uses only internal staff for all trial activities and declares zero external vendor relationships. Must be consistent: if at-home coordination is declared and home health providers are used, this claim cannot be N/A. |
| **UNKNOWN Logic** | If vendor/nurse data has not been collected, this claim is UNKNOWN. Gap guidance: "Complete the Vendor/Home Nurse Coordination section to evaluate this capability." |
| **Expired Evidence Behavior** | Vendor coordination evidence decays after 12 months without new vendor activity. Training records older than 12 months → flagged as potentially stale (staff turnover). Vendor contracts older than 24 months → flagged for review. |
| **Confidence Degradation Triggers** | No vendor performance records in 12 months → -25%. Training records missing for active vendors → -20%. Only self-declared (Class B, no Class C or F) → cap at 0.35. Multiple vendors declared but qualification documentation for only one → -15% per unqualified vendor. Vendor contracts expired → -15%. |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | Vendor qualification SOP (B) + vendor training SOP (B) + 1 vendor performance record or training log within 12 months (C). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | Vendor qualification SOP (B) + vendor training SOP (B) + 3+ training completion records spanning ≥ 2 vendors (C) + vendor performance scorecards with trend data (C) + sponsor confirmation of vendor qualification (F). |
| **Sponsor-Facing Explanation** | "This institution manages [N] qualified vendors/home nursing providers with documented qualification and training procedures. [X] vendor staff trained in the past 12 months across [Y] vendors. Vendor performance metrics are tracked and available for review. [Sponsor approval of vendor qualification on file / No sponsor confirmation available]." |
| **Site-Facing Gap Guidance** | "Upload your vendor qualification SOP and vendor training SOP. Add vendor performance records or training completion logs. For each active vendor, upload qualification and training documentation. Missing: qualification SOP, training SOP, performance records." |
| **Example Evidence Packet** | Vendor Qualification SOP v2.0 with qualification checklist covering licensure, insurance, credentialing, and reference checks (B), Vendor Training SOP v1.5 requiring protocol-specific training with documented comprehension (B), training completion logs for 8 nurses across 2 home health agencies (C), vendor performance scorecard Q1 2026 showing 94% on-time visit rate and 0 safety events (C), sponsor approval letter for HomeCare Plus agency (F). |

---

### Claim 8: `clinical_trials.hybrid.protocol_compliance`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.protocol_compliance` |
| **Label** | Protocol Compliance Documentation Readiness |
| **Statement** | The institution can document protocol compliance across distributed trial sites with a protocol deviation tracking SOP, compliance monitoring procedures, corrective action workflows, and documentation standards that consistently apply to site, remote, and at-home trial settings with linked CAPA records. |
| **Operational Context** | Protocol deviations in hybrid trials can occur at the site, at home, or in transit between them. The institution must track deviations regardless of where they occur, apply consistent documentation standards, and link corrective actions. This claim evaluates the compliance infrastructure across the distributed trial model. |
| **What This Claim Supports** | That the institution tracks protocol deviations across all settings (site, remote, at-home). That compliance monitoring procedures exist. That corrective actions are documented and closed. That CAPA records are linked to deviations. That documentation standards are consistent regardless of setting. |
| **What This Claim Does NOT Prove** | That the institution has zero protocol deviations. That the institution's deviation rate is below any benchmark. That the institution is "inspection-ready" (that requires regulatory evidence). That specific corrective actions were effective (that requires outcomes data over time). |
| **Required Evidence** | Class B: Protocol deviation SOP AND compliance monitoring SOP (minimum 2). Class C: Deviation records or compliance reports (minimum 1). |
| **Optional Evidence** | Class A: Regulatory inspection report or CAPA records linked to deviations. Class F: Sponsor audit confirmation of compliance procedures. |
| **Conditional Evidence** | If CAPA system exists → CAPA records linked to protocol deviations (Class C) required. If prior regulatory inspections → inspection reports (Class A) required. If multiple trial phases (I-IV) → deviation tracking must demonstrate phase-appropriate procedures (Class B, per phase). |
| **Historical Evidence** | Deviation rates over time (Class E). CAPA closure metrics (Class C). Inspection outcomes with no critical compliance findings (Class A). Sponsor audit reports (Class F). |
| **Evidence Classes Expected** | A, B, C, D, E, F. |
| **N/A Logic** | Cannot be N/A. Protocol compliance documentation is universal for clinical research. Even sites with zero deviations must have a deviation tracking procedure and demonstrate that tracking is in place. |
| **UNKNOWN Logic** | If compliance data has not been collected, this claim is UNKNOWN. Gap guidance: "Complete the Safety & Compliance section to evaluate this capability." |
| **Expired Evidence Behavior** | Protocol compliance evidence decays after 12 months without new deviation records or compliance reports. Absence of deviation records for 12 months is ambiguous: it could mean perfect compliance or no tracking. If no deviation records AND no explicit monitoring confirmation → flag as "unverified tracking," -15%. |
| **Confidence Degradation Triggers** | No deviation tracking records in 12 months AND no monitoring confirmation → -15%, flag "unverified." Only self-declared (Class B, no Class C or A or F) → cap at 0.40. CAPA system declared but no CAPA records linked to deviations → -20%. Deviation SOP present but no operational deviation records → cap at 0.45. |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | Protocol deviation SOP (B) + compliance monitoring SOP (B) + 1 deviation record or compliance report within 12 months (C). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | Protocol deviation SOP (B) + compliance monitoring SOP (B) + 3+ deviation records with resolution status spanning ≥ 6 months (C) + CAPA records linked to deviations (C or A) + sponsor audit confirmation OR regulatory inspection report (F or A). |
| **Sponsor-Facing Explanation** | "This institution maintains protocol deviation tracking with [N] deviations documented and [X]% resolved in the past 12 months. Compliance monitoring procedures span site, remote, and at-home settings. [Y] CAPA records linked to protocol deviations. [Regulatory inspection report on file with no critical findings / No recent inspection data available]." |
| **Site-Facing Gap Guidance** | "Upload your protocol deviation SOP and compliance monitoring SOP. Add deviation records or compliance reports from recent studies. If you have a CAPA system, link CAPA records to deviations. Missing: deviation SOP, compliance SOP, deviation records." |
| **Example Evidence Packet** | Protocol Deviation SOP v3.0 covering site, remote, and at-home deviation identification, classification, and reporting (B), Compliance Monitoring SOP v2.1 defining monitoring frequency and documentation standards per setting (B), deviation log from Study YZA-678 showing 12 deviations (8 minor, 3 major, 1 critical — all resolved) (C), 3 CAPA records linked to major/critical deviations with effectiveness verification (C), FDA inspection report 2025 with no Form 483 (A). |

---

### Claim 9: `clinical_trials.hybrid.safety_escalation`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.safety_escalation` |
| **Label** | Safety Escalation Readiness |
| **Statement** | The institution can manage safety events across distributed trial settings with documented safety escalation SOP covering site, remote, and at-home environments, an emergency response plan for non-site settings, AE/SAE detection and reporting procedures that account for distributed locations, and escalation drills or safety event records demonstrating operational readiness. |
| **Operational Context** | Safety events in hybrid trials can occur anywhere: anaphylaxis during at-home IP administration, a fall detected by a remote monitoring device, a cardiac event during a site visit. The institution must have escalation pathways that work regardless of where the patient is. This claim evaluates whether safety infrastructure accounts for distributed settings. |
| **What This Claim Supports** | That the institution has defined escalation pathways for remote and at-home settings. That AE/SAE detection and reporting timelines account for distributed locations. That emergency response is coordinated across sites. That escalation drills have been conducted and documented. That safety reporting procedures are tested. |
| **What This Claim Does NOT Prove** | That the institution has zero safety events. That emergency response will be effective in every scenario. That the institution provides emergency medical care at home. That safety reporting is compliant with any specific regulatory timeline (that is protocol-specific). |
| **Required Evidence** | Class B: Safety escalation SOP AND emergency response SOP for remote settings (minimum 2). Class C: Safety event records with escalation timestamps or escalation drill logs (minimum 1). |
| **Optional Evidence** | Class A: IRB safety report or regulatory safety filing. Class F: Sponsor safety audit confirmation. |
| **Conditional Evidence** | If at-home visits include IP administration → IP-specific safety escalation pathway (Class B) required. If remote monitoring includes alert-based safety triggers → alert-to-escalation workflow documentation (Class B) required. If the institution operates across multiple sites → site-specific emergency response plans per location (Class B) required. |
| **Historical Evidence** | Prior safety events with escalation metrics (Class C). Escalation drill completion records spanning ≥ 12 months (Class C). IRB safety report filings (Class A). Sponsor safety audit outcomes (Class F). |
| **Evidence Classes Expected** | A, B, C, D, E, F. |
| **N/A Logic** | Cannot be N/A. Safety escalation is universal for clinical research. Even sites with zero reported safety events must have escalation procedures and demonstrate drills. |
| **UNKNOWN Logic** | If safety escalation data has not been collected, this claim is UNKNOWN. Gap guidance: "Complete the Safety & Compliance section to evaluate this capability." |
| **Expired Evidence Behavior** | Safety escalation evidence decays after 12 months. Escalation drills older than 12 months → treated as expired (drills must be current). Safety event records older than 12 months → still useful for temporal continuity (Class E) but not as current operational evidence (Class C). |
| **Confidence Degradation Triggers** | No escalation drills in 12 months → -20%. No safety event records in 12 months AND no drill records → flag "unverified," -15%. Only self-declared (Class B, no Class C or A or F) → cap at 0.35. Emergency response SOP present but no drill evidence → cap at 0.40. At-home visits declared but no at-home-specific safety pathway → -15%. |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | Safety escalation SOP (B) + emergency response SOP (B) + 1 safety event record or drill log within 12 months (C). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | Safety escalation SOP (B) + emergency response SOP (B) + 3+ drill records spanning ≥ 6 months (C) + at-home-specific safety pathway if at-home visits declared (B) + IRB safety report OR sponsor safety audit confirmation (A or F). |
| **Sponsor-Facing Explanation** | "This institution has documented safety escalation pathways covering site, remote, and at-home settings. [N] escalation drills conducted in the past 12 months with [X]% completion rate. AE/SAE reporting procedures account for distributed trial designs. [At-home-specific safety pathway documented / At-home safety pathway not separately documented]. [IRB safety reports on file / No recent safety reports available]." |
| **Site-Facing Gap Guidance** | "Upload your safety escalation SOP and emergency response SOP for remote settings. Add safety event records with escalation timestamps or escalation drill logs. If you conduct at-home visits, upload at-home-specific safety pathways. Missing: escalation SOP, emergency response SOP, drill records." |
| **Example Evidence Packet** | Safety Escalation SOP v3.1 with separate pathways for site, at-home, and remote monitoring events including reporting timelines (B), Emergency Response Plan for At-Home Settings v1.0 covering anaphylaxis, fall, and acute deterioration scenarios (B), 4 quarterly escalation drill records from 2025-2026 with 100% staff participation (C), at-home-specific safety pathway addendum covering home IP administration incidents (B), IRB safety report filing for Study BCD-901 (A). |

---

### Claim 10: `clinical_trials.hybrid.historical_experience`

| Field | Value |
|-------|-------|
| **Claim ID** | `clinical_trials.hybrid.historical_experience` |
| **Label** | Hybrid Trial Historical Experience |
| **Statement** | The institution has demonstrated experience participating in hybrid or decentralized clinical trials with verifiable study records, operational metrics from prior hybrid study execution, and documented lessons learned that inform current procedures. |
| **Operational Context** | Historical experience is a strong positive signal but is NOT required for hybrid trial readiness — new entrants can demonstrate readiness through evidence of capabilities without prior hybrid trial experience. This claim captures demonstrated track record specifically in the hybrid/decentralized model. |
| **What This Claim Supports** | That the institution has participated in hybrid or DCT studies. That operational metrics from prior hybrid studies are available. That lessons learned are documented and applied. That sponsors can provide references for hybrid trial execution. |
| **What This Claim Does NOT Prove** | That the institution will succeed in future hybrid trials. That the institution is more capable than one without hybrid experience. That historical experience in traditional trials translates to hybrid trial readiness. That the institution has experience in a specific therapeutic area or phase. |
| **Required Evidence** | Class A: ClinicalTrials.gov records for hybrid/DCT studies (minimum 1) OR Class C: Operational records from prior hybrid studies (minimum 1). |
| **Optional Evidence** | Class C: Additional operational records from prior hybrid studies. Class F: Sponsor confirmation of hybrid study participation. |
| **Conditional Evidence** | None. Historical experience is optional by nature. |
| **Historical Evidence** | This claim IS historical evidence. Prior study records (A), operational metrics (C), sponsor references (F). |
| **Evidence Classes Expected** | A, C, D, E, F. Class B is explicitly excluded — historical experience cannot be self-declared. It must be verifiable through public registries (A), operational records (C), or external confirmation (F). |
| **N/A Logic** | N/A if the institution has zero hybrid trial experience. This is expected and does not penalize readiness. When N/A, excluded from optional counts. |
| **UNKNOWN Logic** | If historical experience data has not been collected, this claim is UNKNOWN. Gap guidance: "Complete the Historical Experience section or mark as N/A if you have no hybrid trial experience." |
| **Expired Evidence Behavior** | Historical experience decays slowly — 60 months. Studies completed more than 5 years ago still provide some signal (Class E, continuity) but are not strong evidence of current capability. Evidence older than 60 months → treated as Class E only, cap at 0.35. |
| **Confidence Degradation Triggers** | Only self-declared (Class B) → cap at 0.25 (historical experience cannot be self-declared). No Class A or C or F evidence → cap at 0.20. All evidence older than 60 months → cap at 0.35 (treated as historical context only). Single study only → moderate confidence max; multiple studies required for high confidence. |
| **Minimum Evidence for Moderate Confidence (≥ 0.50)** | 1 ClinicalTrials.gov record for a hybrid/DCT study (A) OR 1 set of operational records from a prior hybrid study (C). |
| **Minimum Evidence for High Confidence (≥ 0.75)** | 2+ ClinicalTrials.gov records for hybrid/DCT studies (A) + operational metrics from at least 1 study (C) + sponsor reference or confirmation (F). Studies spanning ≥ 2 therapeutic areas preferred. |
| **Sponsor-Facing Explanation** | "This institution has participated in [N] hybrid or decentralized clinical trials. [X] studies registered on ClinicalTrials.gov with decentralized elements. Operational metrics and sponsor references available for review. [N/A: This institution has not yet participated in hybrid or decentralized clinical trials. All other readiness dimensions are evaluated on current capabilities, not historical experience.]" |
| **Site-Facing Gap Guidance** | "If you have participated in hybrid or DCT studies, provide ClinicalTrials.gov NCT numbers or upload operational records. If you have no hybrid trial experience, mark this section as N/A — this does not penalize your readiness." |
| **Example Evidence Packet** | ClinicalTrials.gov records NCT01234567 and NCT02345678 showing decentralized elements (at-home visits, remote monitoring) (A), operational metrics report from Study NCT01234567 showing 89% at-home visit compliance and 94% data completeness (C), sponsor reference letter from ABC Pharma confirming hybrid trial execution (F). |

---

## 9. Evidence Class Mapping

| Evidence Class | Hybrid Trial Examples |
|----------------|----------------------|
| **A — Public Independent Evidence** | ClinicalTrials.gov hybrid/DCT study records, FDA inspection reports, 21 CFR Part 11 compliance certifications, IRB safety report filings, diversity plan submissions to regulatory bodies |
| **B — Institutional Documentary Evidence** | SOPs, responsibility matrices, workflow documentation, vendor contracts, training materials, device calibration records, patient panel demographics reports, system validation documentation |
| **C — Operational Evidence** | Site visit logs, at-home visit completion records, audit trail exports, query resolution logs, enrollment diversity metrics, temperature monitoring records, courier performance reports, training completion logs, deviation records, escalation drill logs, alert management logs |
| **D — Cross-Source Corroboration** | Agreement between site records and vendor records on visit completion; consistency between site EMR and remote monitoring data; aligned documentation across multiple locations |
| **E — Temporal Continuity** | Visit records spanning ≥ 12 months; deviation tracking across multiple study phases; retention rate trends over ≥ 24 months; drill completion consistency over time |
| **F — External Confirmation** | Sponsor qualification letters, sponsor audit reports, vendor performance confirmation, courier service confirmation, CRO references for hybrid trial execution |

---

## 10. N/A and UNKNOWN Rules

### N/A (Not Applicable)

| Rule | Description |
|------|-------------|
| **Declaration required** | N/A must be explicitly declared by the institution — it is never inferred |
| **Rationale required** | Each N/A declaration must include a brief rationale (e.g., "We do not perform at-home biospecimen collection") |
| **Consistency check** | N/A declarations are validated against related claims (e.g., at-home coordination N/A → biospecimen-at-home should also be N/A) |
| **Exclusion from counts** | N/A claims are excluded from mandatoryCapsTotal, optionalCapsTotal, and overallConfidence averaging |
| **No gap generation** | N/A claims do not generate EvidenceGap entries |
| **No penalty** | N/A claims do not reduce readiness status or confidence |
| **Sponsor transparency** | Sponsor-facing output explicitly marks N/A claims as "Not applicable — institution does not perform this activity" |

### UNKNOWN

| Rule | Description |
|------|-------------|
| **Default state** | Claims are UNKNOWN until evidence is collected (questionnaire completed, documents uploaded, or operational records provided) |
| **Distinct from absent** | UNKNOWN ≠ absence of capability. UNKNOWN = "we haven't looked yet" |
| **Exclusion from counts** | UNKNOWN claims are excluded from mandatoryCapsTotal, optionalCapsTotal, and overallConfidence averaging |
| **Gap generation** | UNKNOWN claims DO generate EvidenceGap entries with severity 'info' (not 'blocker') |
| **Guidance provided** | Site-facing output includes specific guidance: which questionnaire section to complete, which documents to upload |
| **Does not block readiness** | An institution can reach 'ready' status with UNKNOWN claims — but only if sufficient mandatory claims are met with evidence |

---

## 11. Confidence Rules

### General confidence computation

```
Per-claim confidence =
  evidenceClassEvaluator(evidence) × 0.35 +
  relationshipEvaluator(relationships) × 0.15 +
  counterEvidenceEvaluator(counterEvidence) × 0.20 +
  temporalEvaluator(temporalData) × 0.15 +
  rightOfResponseEvaluator(responses) × 0.05 +
  visibilityEvaluator(visibility) × 0.10
```

### Self-report caps (hard limits)

| Evidence pattern | Cap | Rationale |
|-----------------|-----|-----------|
| Class B only | 0.40 | Self-declaration without operational or external evidence is not sufficient |
| Class B + C only (no A, D, F) | 0.65 | Operational evidence helps but lacks external corroboration |
| Historical experience with Class B only | 0.25 | Historical experience CANNOT be self-declared |
| Any pattern with expired evidence only | 0.30 | Expired evidence provides minimal confidence |

### Confidence degradation from N/A and UNKNOWN

| State | Effect on confidence |
|-------|---------------------|
| N/A | Excluded from averaging — does not reduce confidence |
| UNKNOWN | Excluded from averaging — does not reduce confidence |
| DECLARED_ONLY | Included in averaging with cap at 0.40 |
| PARTIALLY_SUPPORTED | Included in averaging with cap at 0.65 |
| SUPPORTED_BY_EVIDENCE | Included in averaging with no cap |
| EXPIRED_OR_OUTDATED | Included in averaging with cap at 0.30 |

---

## 12. Sponsor-Facing Outputs

Every claim produces a sponsor-facing explanation that follows this template:

```
"[Institution name] [capability statement with evidence counts].
 [Specific evidence highlights — what was found].
 [Limitations — what is missing or degraded].
 [N/A declaration if applicable]."
```

### Example: biospecimen-at-home (moderate confidence)

> "Vilo Research has validated at-home biospecimen collection procedures with 31 collections completed in the past 6 months. Chain of custody is documented from home to lab with temperature monitoring throughout. 2 temperature excursions documented and both resolved within 30 minutes. Courier performance: 97% on-time pickup rate. Limitations: No IATA certification for international shipping — domestic shipping only. No sponsor confirmation of at-home biospecimen quality on file."

### Example: historical_experience (N/A)

> "Vilo Research has not yet participated in hybrid or decentralized clinical trials. All other readiness dimensions are evaluated on current capabilities, not historical experience. This does not penalize overall readiness."

---

## 13. Site-Facing Gap Outputs

Every claim with gaps produces site-facing guidance that follows this template:

```
"[Gap summary: what is missing].
 [Action: what to upload or complete].
 [Impact: what this gap means for readiness].
 Missing: [specific list of missing evidence items]."
```

### Example: data_integrity (needs evidence)

> "Your data integrity procedures need documentation. Upload your source documentation SOP and data integrity/data review SOP. Add audit trail records or query resolution logs from recent studies. Impact: Without these, data integrity readiness is capped at 0.40 (self-declared only). Missing: source documentation SOP, data integrity SOP, audit trail records."

---

## 14. Implementation Notes

### Migration reference

This taxonomy is implemented in:
- `database/migrations/055_hybrid_trial_readiness.sql` — capability types, program type, requirements
- `packages/readiness-engine/src/hybrid-evaluators.ts` — SelfReportCap, EvidenceExpiry, NotApplicableSkip evaluators
- `packages/readiness-engine/src/readiness-evaluation.ts` — EvidenceSupport type, N/A/UNKNOWN skip, self-report caps

### Onboarding integration

Claim families 1–10 map to the `hybrid-trial` interview domain in `apps/web/src/lib/onboarding/onboarding-journey.ts`. Each family corresponds to a questionnaire section with conditional gates as defined in the claim specification cards.

### Program type

Program type key: `readiness_hybrid_trial`
Category: `readiness`
Threshold: 0.75 (configurable per `program_type_taxonomy.readiness_threshold`)

### Backward compatibility

This taxonomy activates the reserved `clinical_trials` domain from v1.0. Existing biospecimen claims are unaffected. The new claims follow the same structure (dotted IDs, specification cards, evidence classes) as v1.0.

---

## 15. Test Requirements

### Minimum test coverage per claim family

| Test category | Count | Description |
|---------------|-------|-------------|
| Claim creation | 10 | Each claim can be instantiated with valid fields |
| Evidence class validation | 10 | Each claim accepts only its declared evidence classes and rejects others |
| Decay period verification | 10 | Each claim's decay period matches this taxonomy |
| N/A logic | 6 | Claims 2,4,5,6,7,10: N/A declaration excludes from counts |
| UNKNOWN logic | 10 | All claims: UNKNOWN excluded from counts, generates info-level gap |
| Self-report cap | 10 | All non-historical claims: Class B only → cap at 0.40 |
| Confidence degradation | 10 | Each claim: expired evidence, missing mandatory classes, missing conditional evidence |
| Sponsor output | 10 | Each claim produces sponsor-facing explanation with limitations |
| Site gap output | 10 | Each claim with gaps produces actionable site-facing guidance |
| Integration | 5 | Full pipeline: evidence → claim → confidence → readiness → passport |

**Total minimum: 91 tests**

### Existing coverage (KTP-1.3 MVP)

- `tests/readiness/hybrid-trial/hybrid-evaluators.test.ts` — 16 tests (evaluator logic)
- `tests/readiness/hybrid-trial/hybrid-taxonomy.test.ts` — 19 tests (claim structure, evidence requirements, mandatory/optional counts)
- `tests/readiness/hybrid-trial/hybrid-readiness.test.ts` — 11 tests (readiness scenarios: full evidence, self-declared, expired, N/A, UNKNOWN, mixed, edge cases)

**Current coverage: 46 tests.** Remaining 45 tests to be added in subsequent iterations per the test requirements above.

---

## Validation Cross-Check

| # | Check | Result |
|---|-------|--------|
| 1 | Every claim uses only terms from Lexicon v1.2? | ✅ PASS — no non-lexicon terms introduced |
| 2 | Every claim can be represented by a Confidence Graph? | ✅ PASS — each maps to KEMS §2 via EvidenceClass evaluators |
| 3 | Every claim admits at least one valid Evidence Class? | ✅ PASS — minimum: A or B+C for all claims |
| 4 | Every claim can be contradicted by Counter Evidence? | ✅ PASS — each claim defines specific counter-evidence scenarios |
| 5 | Minimum 10 claims for Clinical Trials domain? | ✅ PASS — exactly 10 claims defined |
| 6 | No "Trust Score" language? | ✅ PASS — confidence used throughout, never "trust" |
| 7 | No "Verified Site" or "Certified Site" language? | ✅ PASS — neither term appears in any claim definition or output template |
| 8 | No guarantee of future compliance? | ✅ PASS — §3 Non-Goals explicitly states Kadarn does not guarantee future performance |
| 9 | Every claim too narrow to be a single yes/no? | ✅ PASS — each claim requires multiple evidence classes and admits partial confidence |
| 10 | Every claim has sufficient evidence pathways to reach high confidence? | ✅ PASS — each claim defines minimum evidence for high confidence (≥ 0.75) |
| 11 | Biospecimen-at-home requires chain of custody, sample workflow, courier/shipping, and temperature evidence? | ✅ PASS — all four explicitly required in claim 5 specification card |
| 12 | Data integrity requires source documentation, EHR/EDC/eSource/eConsent, query/audit, and data review? | ✅ PASS — all four explicitly required in claim 3 specification card |
| 13 | At-home coordination requires responsibility matrix, vendor/home nurse workflow, communication workflow, and escalation pathway? | ✅ PASS — all required in claim 2; vendor coverage in claim 7; escalation in claim 9 |
| 14 | Claims not too broad — each covers one capability dimension? | ✅ PASS — 10 claims cover 10 distinct dimensions with no overlap |
| 15 | Document can guide implementation and QA? | ✅ PASS — implementation notes (§14) and test requirements (§15) provide actionable guidance |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.1 | 2026-07-09 | Initial hybrid trial readiness taxonomy — 10 claims across `clinical_trials.hybrid` subdomain. Activates reserved `clinical_trials` domain from v1.0. Adds EvidenceSupport levels, N/A/UNKNOWN rules, self-report caps, and sponsor-facing output templates. |

---

*This document is artifact P0-009 of the Kadarn Platform. All claims use Lexicon v1.2 vocabulary. The clinical_trials domain was reserved in v1.0 and is now activated. No claims express certification, guarantee, or trust metrics — Kadarn reports evidence-backed confidence only.*
