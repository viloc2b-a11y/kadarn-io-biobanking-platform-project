# Kadarn Ecosystem Reference Architecture

**Version:** 1.0  
**Status:** Accepted  
**Supersedes:** All prior ecosystem descriptions  

---

## 1. Purpose

This document describes the ecosystem within which Kadarn operates — the
actors, systems, flows, and frictions — before describing Kadarn itself.
Every architectural decision in Kadarn must be traceable to a real
ecosystem need, not to an abstract architectural preference.

**Principle:** Know the territory before mapping Kadarn onto it.

---

## 2. Ecosystem Actors

The biospecimen research ecosystem involves 17 distinct actor types.
Each has specific responsibilities, incentives, and existing systems.

### 2.1 Sponsors

**Who:** Pharmaceutical companies, biotechnology firms, academic
research organizations that fund and conduct biomedical research.

**Responsibilities:**
- Define study objectives and protocols
- Fund specimen procurement and testing
- Own regulatory submissions (IND, IDE, 510(k))
- Select CROs and research partners

**Existing systems:** CTMS, eTMF, ERP (SAP, Oracle), Vault (RIM)

**Pain points:** Slow specimen access (4-9 months), opaque availability,
variable quality, high coordination overhead across multiple CROs and sites.

### 2.2 CROs (Contract Research Organizations)

**Who:** Organizations that manage clinical trials on behalf of sponsors.

**Responsibilities:**
- Design and manage clinical studies
- Select and oversee clinical sites
- Manage specimen logistics
- Ensure regulatory compliance

**Existing systems:** CTMS, LIMS, eTMF, EDC systems (Rave, InForm, Veeva)

**Pain points:** Multi-client specimen management, reconciling across
site biobanks, manual MTA/DUA processes, fragmented tracking.

### 2.3 Research Organizations

**Who:** Academic medical centers, research institutes, hospitals that
conduct research independently or as clinical sites.

**Responsibilities:**
- Conduct approved research protocols
- Manage local biorepositories
- Ensure ethical and regulatory compliance

**Existing systems:** Local biobank databases, LIMS, IRB tracking

**Pain points:** Limited specimen discoverability, manual request
processes, underutilized collections.

### 2.4 Principal Investigators (PIs)

**Who:** The lead researchers responsible for a study's scientific conduct.

**Responsibilities:**
- Design study protocols
- Oversee specimen collection and use
- Publish and disseminate findings

**Pain points:** Administrative burden of specimen access, multi-site
coordination, provenance tracking for publications.

### 2.5 Clinical Sites

**Who:** Hospitals and clinics where specimens are collected from patients.

**Responsibilities:**
- Patient recruitment and consent
- Specimen collection and initial processing
- Medical record abstraction
- IRB compliance

**Existing systems:** EMR/EHR (Epic, Cerner, Meditech), LIS, scheduling

**Pain points:** Consent management complexity, integration with research
systems, staff training on research protocols alongside clinical duties.

### 2.6 Biobanks

**Who:** Specialized facilities that collect, process, store, and
distribute biospecimens under governance frameworks.

**Responsibilities:**
- Specimen collection, processing, and storage
- Quality management (ISO 20387, CAP Biorepository)
- Governance and consent management
- Distribution to researchers

**Existing systems:** Biobank LIMS (FreezerPro, OpenSpecimen, caTissue),
freezer monitoring systems, labware management

**Pain points:** Manual fulfillment workflows, heterogeneous IT systems,
limited interoperability, consent versioning across collections, under-
utilized inventory.

### 2.7 Pathology Groups

**Who:** Clinical pathology departments and commercial pathology labs
that evaluate and release tissue for research.

**Responsibilities:**
- Pathologist review of tissue
- Diagnosis and grading
- Release of residual tissue for research

**Existing systems:** LIS, PACS, digital pathology platforms

**Pain points:** Clinical vs research prioritization, tissue adequacy
assessment, manual release coordination.

### 2.8 Laboratories

**Who:** Assay-performing labs (CLIA, CAP, GCLP, GLP) that process
specimens for research endpoints.

**Responsibilities:**
- Perform specified assays
- Maintain accreditation (CLIA, CAP, GCLP)
- Report results with QC documentation
- Manage residual specimens

**Existing systems:** LIMS with assay tracking, ELN (Electronic Lab Notebook),
QC systems

**Pain points:** Multi-study sample management, assay scheduling, result
reporting in study-specific formats, specimen chain of custody.

### 2.9 Couriers

**Who:** Specialized logistics providers for biomedical materials
(World Courier, Marken, FedEx Custom Critical, etc.).

**Responsibilities:**
- Temperature-controlled transport
- Chain of custody documentation
- Customs clearance for international shipments
- Real-time tracking

**Existing systems:** Courier-specific tracking portals, temperature
monitoring devices (Sensitech, Onset, Tive)

**Pain points:** Cold chain breach risk, customs delays, manual status
reporting, multi-leg shipment coordination.

### 2.10 IRBs / Ethics Committees

**Who:** Institutional Review Boards or equivalent ethics oversight bodies.

**Responsibilities:**
- Review and approve research protocols
- Review consent forms and processes
- Oversee ongoing research compliance

**Existing systems:** IRB management systems (IRBNet, Advarra, WCG)

**Pain points:** Multi-site IRB reliance review delays, consent form
version management, protocol amendment tracking.

### 2.11 Regulatory Bodies

**Who:** FDA, EMA, HIPAA enforcement, CAP/CLIA accreditors, ISO
auditors, state health departments, GDPR authorities.

**Responsibilities:**
- Set and enforce research standards
- Approve drugs and devices
- Audit clinical trial conduct
- Protect human subjects and privacy

**Existing systems:** Regulatory submission portals (FDA eCTD, EMA IRIS)

**Pain points:** Evolving requirements, multi-jurisdiction compliance,
audit readiness.

### 2.12 Data Repositories

**Who:** dbGaP, EGA, GEO, Synapse, Vivli, and other data sharing platforms.

**Responsibilities:**
- Host and distribute research data
- Manage data access committees
- Ensure data use agreements

**Existing systems:** Repository portals, DUO (Data Use Ontology) systems

**Pain points:** Inconsistent data submission standards, limited
specimen-to-data linkage, delayed data availability.

### 2.13 LIMS (Laboratory Information Management Systems)

**Who:** Existing laboratory systems that Kadarn must integrate with.

**Examples:** LabVantage, LabWare, STARLIMS, OpenSpecimen, FreezerPro,
custom institutional systems.

**Role in ecosystem:** LIMS are the source of truth for specimen-level
data within each organization. Kadarn does not replace LIMS.

### 2.14 CTMS (Clinical Trial Management Systems)

**Who:** Systems that manage clinical trial operations.

**Examples:** Veeva Vault CTMS, Medidata Rave, Oracle Siebel CTMS,
Forté eClinical.

**Role in ecosystem:** CTMS are the source of truth for study-level data.
Kadarn reads study context from CTMS but does not manage studies.

### 2.15 EMR / EHR (Electronic Medical/Health Records)

**Who:** Clinical record systems at hospitals and sites.

**Examples:** Epic, Cerner (Oracle Health), Meditech, Athenahealth,
NextGen.

**Role in ecosystem:** EHRs contain patient consent, diagnosis codes,
and clinical data that may be linked to specimens. Kadarn may reference
EHR data but does not store or replicate clinical records.

### 2.16 ERP / P2P Systems

**Who:** Enterprise Resource Planning and Procure-to-Pay systems.

**Examples:** SAP Ariba, Oracle E-Business Suite, Workday, Coupa.

**Role in ecosystem:** ERP systems handle sponsor payments, CRO
invoicing, and site reimbursements. Kadarn Settlement Engine may
trigger payments via ERP integration.

---

## 3. Responsibility Boundaries

Kadarn owns:

- **Orchestration** across organizations — not the internal operations of any
  single organization
- **Provenance** across the network — not the internal records of any
  single LIMS or CTMS
- **Trust computation** across organizations — not the certification
  authority (CAP, CLIA, FDA retain that)
- **Policy enforcement** at network decision points — not the internal
  policies of any organization (each org manages its own)

Kadarn does NOT own:

| Not Owned | Owned By |
|-----------|----------|
| Specimen collection | Clinical sites, biobanks |
| Assay execution | Laboratories |
| Clinical care | Hospitals, PIs |
| Drug/device approval | Regulatory bodies (FDA, EMA) |
| Financial accounting | Sponsors, CROs — their ERP |
| IRB review | Ethics committees |
| Informed consent process | Clinical sites, PIs |
| Courier operations | Logistics providers |
| Certification/accreditation | CAP, CLIA, ISO, FDA |
| Data repository content | dbGaP, EGA, Vivli |

---

## 4. Major Ecosystem Flows

### 4.1 Discovery

A sponsor or CRO searches for available specimens across multiple
biobanks and collections.

**Ecosystem friction:** No unified catalog. Each biobank has its own
system with different metadata standards. Discovery requires manual
outreach to dozens of biobanks. Response times range from weeks to
months.

**Kadarn role:** Kadarn provides a federated discovery catalog where
biobanks publish availability (without PHI). Queries return matched
collections with governance requirements.

### 4.2 Feasibility

An assessment of whether a study can be conducted given available
specimens, site capacity, and regulatory context.

**Ecosystem friction:** Feasibility assessments are manual, require
site-by-site data collection, and often reveal gaps late in the process.

**Kadarn role:** Kadarn aggregates availability, site capacity, and
regulatory status to produce real-time feasibility reports.

### 4.3 Access Request

A formal request for specimens submitted by a researcher to a biobank
or collection owner.

**Ecosystem friction:** Ad-hoc email-based requests, inconsistent
information, no tracking.

**Kadarn role:** Kadarn standardizes access requests with required
fields (protocol, IRB, intended use, material requested, governance
requirements).

### 4.4 Governance Review

Evaluation of a request against applicable policies, regulations, and
agreements.

**Ecosystem friction:** Multi-step manual review across IRB, legal,
scientific, and institutional reviewers. No system for parallel review.

**Kadarn role:** Kadarn Policy Engine evaluates governance policies
declaratively, routes to human reviewers only when policy evaluation
is inconclusive, and tracks review status.

### 4.5 MTA / DUA

Material Transfer Agreement or Data Use Agreement execution between
provider and recipient organizations.

**Ecosystem friction:** Manual contract routing, 4-8 weeks turnaround,
redundant negotiations for repeat transfers between same parties.

**Kadarn role:** Kadarn provides MTA/DUA templates, electronic signing,
and tracks active agreements with version control. The Transaction Twin
persists the full lifecycle.

### 4.6 Consent Verification

Confirmation that patient/donor consent covers the intended use.

**Ecosystem friction:** Consent forms are paper or scanned PDF.
Verification requires manual review. Consent is rarely structured.

**Kadarn role:** Kadarn links consent documents to specimens, associates
consent codes (e.g., DUO terms), and verifies consent at access request
time via policy evaluation.

### 4.7 Collection

Physical collection of specimens from a donor at a clinical site.

**Ecosystem friction:** Collection requires coordination between
clinical staff, research coordinators, and biobank personnel.
Specimen IDs may not be assigned until the biobank receives the sample.

**Kadarn role:** Kadarn generates pre-labeled collection kits with
unique specimen IDs, tracks collection events, and links to donor
consent and clinical data.

### 4.8 Processing

Primary processing of collected specimens (centrifugation, aliquoting,
fixation, embedding, freezing).

**Ecosystem friction:** Processing protocols vary by biobank. Manual
recording of processing steps, aliquots, and QC results.

**Kadarn role:** Kadarn Specimen Twin records each processing event,
aliquot creation, and QC result. Protocol adherence is verifiable
through the Provenance Graph.

### 4.9 QC

Quality control assessment of specimens before release or after
processing.

**Ecosystem friction:** QC results in LIMS or paper. No standard format.
Results may not be communicated to requestors.

**Kadarn role:** Kadarn records QC events, passes/fails, and supporting
evidence. QC results inform the Trust Graph.

### 4.10 Logistics

Physical shipment of specimens from provider to recipient.

**Ecosystem friction:** Temperature excursion risk, customs delays,
missing chain of custody documentation. Real-time tracking is courier-
specific and may not be shared.

**Kadarn role:** Kadarn coordinates shipment scheduling, generates
shipping manifests with regulatory documentation, ingests temperature
telemetry, and updates the Shipment Twin with location and condition
events.

### 4.11 Receipt

Formal receipt and inspection of shipped specimens by the recipient.

**Ecosystem friction:** Manual receipt verification, condition
assessment, and documentation. Discrepancies are handled by email.

**Kadarn role:** Kadarn records receipt events, specimen condition
assessment, and initiates acceptance or dispute workflows.

### 4.12 Acceptance

Formal acceptance of specimens, triggering fulfillment completion and
settlement.

**Ecosystem friction:** Acceptance may be conditional (partial
acceptance, quality issues). No standard acceptance workflow.

**Kadarn role:** Kadarn manages conditional acceptance, partial
fulfillment, and dispute workflows. Acceptance triggers the
Fulfillment Engine to close the fulfillment and initiate settlement.

### 4.13 Data Linkage

Linking specimens to clinical data, assay results, and research outputs.

**Ecosystem friction:** Specimen IDs in LIMS, clinical data in EHR,
assay results in LIS, and research data in repositories — all with
different identifiers. Linkage is manual and lossy.

**Kadarn role:** Kadarn maintains persistent identifiers (Research
Asset IDs) that can be mapped across systems. The Knowledge Graph
semantically links entities across sources.

### 4.14 Settlement

Financial completion of a fulfilled request — payment, fees, and
distribution.

**Ecosystem friction:** Manual invoicing, delayed payment reconciliation,
unclear fee structures.

**Kadarn role:** Kadarn Financial Engine calculates fees against
fulfillment data, distributes payments, and provides settlement records
for audit.

---

## 5. Current Ecosystem Frictions

| # | Friction | Impact | Actors Affected |
|---|----------|--------|-----------------|
| 1 | No unified specimen discovery | 4-9 month lead time for specimen access | Sponsors, CROs, PIs |
| 2 | Manual request/governance workflows | High coordination overhead, errors | All |
| 3 | Heterogeneous biobank IT systems | Integration cost, data inconsistency | Biobanks, CROs, Sponsors |
| 4 | Paper/email-based MTA/DUA | 4-8 week turnaround, version confusion | Legal, CROs, Sites |
| 5 | Consent versioning and verification | Compliance risk, study delays | Sites, IRBs, Biobanks |
| 6 | Cold chain visibility gaps | Sample loss, disputed shipments | Biobanks, Couriers, Sponsors |
| 7 | No cross-organizational provenance | Results can't be fully traced | Laboratories, Sponsors, Regulators |
| 8 | Manual settlement and invoicing | 60-120 day payment cycles | Biobanks, CROs, Sponsors |
| 9 | Limited specimen-to-data linkage | Underutilized data, publication gaps | PIs, Data Repositories |
| 10 | No standardized trust assessment | Risk-averse routing, underutilized capacity | Sponsors, Biobanks |

---

## 6. Kadarn Orchestration Boundary

Kadarn orchestrates **across** organizations. It does not replace
**within**-organization systems.

### Where Kadarn Orchestrates

Kadarn is the coordination layer for:

- **Multi-organization flows:** Any flow that crosses organizational
  boundaries (discovery, request, governance, fulfillment, settlement)
- **Network-wide state:** Who has what, under what governance, at what
  trust level, available for what use
- **Cross-system provenance:** Linking events across LIMS, CTMS, EHR,
  and logistics systems into a coherent entity history
- **Policy enforcement at boundaries:** Governance rules that apply
  when assets move between organizations
- **Trust computation:** Aggregated evidence-based trust across the
  network

### Where Kadarn Does NOT Replace

| System | Retained By | Kadarn Integration |
|--------|-------------|-------------------|
| LIMS (specimen inventory) | Each biobank | Event ingestion, status queries |
| CTMS (study management) | CROs/sponsors | Study context reads |
| EHR (clinical data) | Clinical sites | De-identified data linkage |
| Logistics tracking | Couriers | Telemetry ingestion |
| Assay/LIS | Laboratories | Result receipt, provenance linkage |
| IRB management | IRBs | Status reads, approval event ingestion |
| Financial ERP | Sponsors/CROs | Settlement triggers, invoicing |
| Document management | Legal departments | MTA/DUA evidence receipt |
| Data repositories | dbGaP, EGA, etc. | Data publication tracking |

### Integration Principle

Kadarn does not call APIs of existing systems to read or write data on
their behalf. Instead, Kadarn:

1. **Ingests events** from existing systems when they occur
2. **Provides webhook/API endpoints** for existing systems to publish
   events
3. **Maps identifiers** across systems via the Knowledge Graph
4. **Links provenance** by correlating events from multiple systems

This preserves existing system autonomy while enabling network-level
orchestration.
