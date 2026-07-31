# DOCUMENT ENTITY OWNERSHIP MATRIX

**Work Order:** WO-KEMS-DOC-003
**Deliverable:** 4 of 5
**Reference:** DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md (Deliverable 2)
**Classification:** 48 document types mapped to entity relationships
**Revision:** Human Gate feedback A9 — replaced generic "ownership" with legal_owner, record_subject, custodian, issuing_authority, entity_scope, study_context, location_context

---

## Entity Relationship Model

KADARN Evidence Management System (KEMS) models document-to-entity relationships across seven dimensions. This replaces the previous generic "Entity Owner(s)" model with precise, enforceable roles.

### Entity Roles

| Role | Definition | Enforceable Rule |
|---|---|---|
| **legal_owner** | Entity holding legal title or rights to the evidence | Determines transfer authorization; deprovisioning legal_owner invalidates evidence linkage |
| **record_subject** | Entity the document is about, describes, or names | Must be active in KADARN for the document to be valid; PII/PHI scope is derived from record_subject |
| **custodian** | Entity responsible for storing, managing, and maintaining the evidence | Custodian policy governs redaction, retention, and access control |
| **issuing_authority** | Entity that issued, required, or mandated the document (regulatory body, certifying organization, etc.) | Expiry and renewal cadence derived from issuing_authority requirements |
| **entity_scope** | Set of entity types the evidence is scoped to (Person, Institution, Location, Equipment, Study, Technology System, Counterparty) | Determines which entities must be provisioned before evidence can be linked |
| **study_context** | Whether the document requires a study to be meaningful | `required` → cannot exist without a study; `optional` → may be linked to a study; `none` → study-independent |
| **location_context** | Whether the document is location-scoped | `required` → tied to a specific location; `optional` → may reference a location; `none` → location-independent |

### Cardinality Connectors

| Connector | Meaning |
|---|---|
| `+` (plus) | Joint — ALL listed entities required |
| `or` | Alternative — ANY listed entity suffices |
| `/` (slash) | Multiple roles — entity serves multiple roles |

---

## Document Type → Entity Relationship Matrix

| # | Document Type | Primary Class | legal_owner | record_subject | custodian | issuing_authority | entity_scope | study_context | location_context | Rationale |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Curriculum Vitae | PERSON_REUSABLE | Person | Person (Professional) | Institution | Person (self-issued) | Person | optional | none | Individual owns their CV; institution stores it |
| 2 | GCP Training Certificate | PERSON_REUSABLE | Person | Person (Trainee) | Institution | Training Provider / Sponsor | Person | optional | none | Issued to individual; personal credential |
| 3 | IATA Training Certificate | PERSON_REUSABLE | Person | Person (Trainee) | Institution | IATA / Training Provider | Person | optional | none | Issued to individual; personal credential |
| 4 | Human Subjects Protection | PERSON_REUSABLE | Person | Person (Trainee) | Institution | CITI Program / Institution | Person | optional | none | Issued to individual; personal credential |
| 5 | Medical License | PERSON_REUSABLE | Person | Person (Physician) | Institution | State Medical Board | Person + Location | optional | required | State-issued to individual practitioner; location-scoped |
| 6 | Board Certification | PERSON_REUSABLE | Person | Person (Physician) | Institution | Specialty Board (ABMS) | Person | optional | none | Specialty board-issued to individual |
| 7 | ACLS/BLS Certification | PERSON_REUSABLE | Person | Person (Provider) | Institution | AHA / Certifying Body | Person | optional | none | Issued to individual; personal credential |
| 8 | Study-Specific Training | STUDY_SPECIFIC | Person | Person (Trainee) | Institution | Sponsor / Institution | Person + Study | required | optional | Training tied to protocol; study-scoped |
| 9 | Delegation of Authority Log | STUDY_SPECIFIC | Institution | Multiple Persons (delegated staff) / Principal Investigator | Institution | Principal Investigator | Person + Study + Location | required | required | Records delegation per study per location |
| 10 | FDA Form 1572 | STUDY_SPECIFIC | Institution | Principal Investigator | Institution | FDA regulatory framework | Person + Institution + Study | required | required | PI signs as record_subject; institution listed; FDA requires it; study + institution context required |
| 11 | Financial Disclosure | STUDY_SPECIFIC | Person | Person (Investigator) | Institution | FDA regulatory framework | Person + Study | required | none | Per-investigator per-study declaration |
| 12 | State/Regional License | PERSON_REUSABLE | Person | Person (Licensee) | Institution | State Licensing Board | Person + Location | optional | required | Licensed to practice in specific jurisdiction |
| 13 | CLIA Certificate | SITE_REUSABLE | Institution | Laboratory | Institution | CMS / CLIA program | Institution + Location | optional | required | Issued to lab at specific location |
| 14 | CAP Accreditation | SITE_REUSABLE | Institution | Laboratory | Institution | College of American Pathologists | Institution + Location | optional | required | Accredited lab at specific location |
| 15 | Institutional License | SITE_REUSABLE | Institution | Institution | Institution | State / Regulatory Body | Institution | optional | none | Institutional operating license |
| 16 | Pharmacy License | SITE_REUSABLE | Institution | Pharmacy | Institution | State Board of Pharmacy | Institution + Location | optional | required | Licensed pharmacy at specific location |
| 17 | Controlled-Substance Registration | SITE_REUSABLE | Institution | Institution | Institution | DEA | Institution | optional | none | DEA registration held by institution |
| 18 | IRB Reliance Information | SITE_REUSABLE | Institution | IRB | Institution | OHRP / FDA | Institution | optional | none | Institution's IRB registration and reliance agreements |
| 19 | Facility Certification | LOCATION_REUSABLE | Institution | Facility | Institution | Accrediting Body | Location | optional | required | Certification tied to physical facility |
| 20 | Insurance Certificate | SITE_REUSABLE | Institution | Institution | Institution | Insurance Carrier | Institution | optional | none | Institutional professional liability coverage |
| 21 | Standard Operating Procedure | SITE_REUSABLE | Institution | Institution | Institution | Institution (self-issued) | Institution | optional | optional | Institution-authored SOP; may reference locations |
| 22 | CAPA Records | RESTRICTED_EVIDENCE | Institution | Institution / Location | Institution | Quality Unit | Institution + Location | optional | required | Corrective action tied to QMS at location |
| 23 | Internal Audit Report | RESTRICTED_EVIDENCE | Institution | Institution | Institution | Quality Unit | Institution | optional | optional | Internal quality audit; may span locations |
| 24 | Emergency Response Plan | SITE_REUSABLE | Institution | Location | Institution | Institution | Institution + Location | optional | required | Institutional plan implemented at specific location |
| 25 | Business Continuity Plan | SITE_REUSABLE | Institution | Institution | Institution | Institution | Institution | optional | optional | Institutional plan; may reference locations |
| 26 | Hazardous Materials Documentation | LOCATION_REUSABLE | Institution | Location | Institution | OSHA / EPA | Location | optional | required | Tied to physical facility housing hazardous materials |
| 27 | Equipment Calibration Record | EQUIPMENT_REUSABLE | Institution | Equipment | Institution | Calibration Provider / Manufacturer | Equipment + Location | optional | required | Specific equipment at specific location |
| 28 | Preventive Maintenance Record | EQUIPMENT_REUSABLE | Institution | Equipment | Institution | Institution / Service Provider | Equipment + Location | optional | required | Specific equipment at specific location |
| 29 | Equipment Qualification (IQ/OQ/PQ) | EQUIPMENT_REUSABLE | Institution | Equipment | Institution | Institution / Validation Provider | Equipment + Location | optional | required | Specific equipment at specific location |
| 30 | Temperature Mapping Report | EQUIPMENT_REUSABLE | Institution | Equipment | Institution | Institution / Mapping Provider | Equipment + Location | optional | required | Storage unit mapped at specific location |
| 31 | Shipping Equipment Validation | EQUIPMENT_REUSABLE | Institution | Equipment | Institution | Institution / Validation Provider | Equipment + Location | optional | required | Shipping system validated at location |
| 32 | Backup Power Test Logs | LOCATION_REUSABLE | Institution | Location | Institution | Institution | Location + Equipment | optional | required | Location-wide backup power; references equipment |
| 33 | Alarm Response / Excursion Logs | RESTRICTED_EVIDENCE | Institution | Location / Equipment | Institution | Quality Unit | Location + Equipment | optional | required | Incident at location involving equipment |
| 34 | Environmental Monitoring Logs | LOCATION_REUSABLE | Institution | Location | Institution | Institution | Location + Equipment | optional | required | Environmental conditions at location; equipment-monitored |
| 35 | Radiation Safety Certificate | LOCATION_REUSABLE | Institution | Location | Institution | NRC / State Radiation Authority | Location + Equipment | optional | required | Location-scoped; equipment is radiation source |
| 36 | BSL Documentation | LOCATION_REUSABLE | Institution | Location | Institution | Institutional Biosafety Committee | Location | optional | required | Biosafety level assigned to specific facility |
| 37 | EMR/EHR System Validation | TECHNOLOGY_SYSTEM_REUSABLE | Institution | Technology System | Institution | Institution / Vendor | Technology System + Institution | optional | none | System validation; institution operates it |
| 38 | Data Security Certification | TECHNOLOGY_SYSTEM_REUSABLE | Institution | Technology System | Institution | Certifying Body (SOC 2, ISO 27001) | Technology System + Institution | optional | none | System certification; institution holds it |
| 39 | 21 CFR Part 11 Compliance | TECHNOLOGY_SYSTEM_REUSABLE | Institution | Technology System | Institution | FDA regulatory framework | Technology System + Institution | optional | none | System compliance; institution responsible |
| 40 | Patient Recruitment Plan | STRUCTURED_DATA | Institution | Institution | Institution | Institution | Institution | optional | none | Institutional capability data |
| 41 | Diversity and Inclusion Plan | STRUCTURED_DATA | Institution | Institution | Institution | Institution | Institution | optional | none | Institutional capability data |
| 42 | Community Advisory Board Documentation | STRUCTURED_DATA | Institution | Institution | Institution | Institution | Institution | optional | none | Institutional capability data |
| 43 | Translator / Language Services | STRUCTURED_DATA | Institution | Institution | Institution | Institution | Institution | optional | none | Institutional capability data |
| 44 | Staff Training Compliance Matrix | STRUCTURED_DATA | Institution | Institution (aggregate) | Institution | Institution | Institution | optional | none | Aggregate institutional data; references persons |
| 45 | Material Transfer Agreement (MTA) | STUDY_SPECIFIC | Institution | Institution + Counterparty | Institution | Institution + Counterparty (bilateral) | Institution + Counterparty + Study | required | optional | Tripartite: sending institution, receiving counterparty, study context |
| 46 | Indemnification / Liability Coverage | SITE_REUSABLE | Institution | Institution | Institution | Insurance Carrier | Institution | optional | none | Institutional insurance/indemnification policy |
| 47 | Medical Record | PROHIBITED_CONTENT | — | — | — | — | — | — | — | PROHIBITED_CONTENT — no entity model; never ingested |
| 48 | Unclassified Document | QUARANTINE (pending) | — | — | — | — | — | — | — | QUARANTINE_PENDING_CLASSIFICATION — no entity assigned; pending human review |

---

## Entity Relationship Summary

### By legal_owner

| legal_owner | Count | Types |
|---|---|---|
| Person | 12 | CV, GCP, IATA, HSP, Medical License, Board Cert, ACLS/BLS, Study-Specific Training, Financial Disclosure, State/Regional License (rows 1-8, 11, 12) |
| Institution | 34 | Delegation Log, FDA 1572, CLIA, CAP, Institutional License, Pharmacy, Controlled-Substance, IRB, Facility Cert, Insurance, SOP, CAPA, Internal Audit, Emergency Response, BCP, HazMat, Calibration, Preventive Maint, IQ/OQ/PQ, Temp Mapping, Shipping Validation, Backup Power, Alarm/Excursion, Env Monitoring, Radiation Safety, BSL, EMR/EHR, Data Security, 21 CFR Part 11, Recruitment, Diversity, Community Board, Translator, Training Matrix, MTA, Indemnification (rows 9, 10, 13-46) |
| — (none) | 2 | Medical Record, Unclassified (rows 47, 48) |

### By record_subject

| record_subject | Count |
|---|---|
| Person | 12 |
| Institution | 14 |
| Location / Facility | 10 |
| Equipment | 5 |
| Laboratory | 2 |
| Technology System | 3 |
| Multiple Persons | 1 |
| Institution + Counterparty | 1 |
| — (none) | 2 |

### By issuing_authority

| issuing_authority Category | Count |
|---|---|
| Institution / Self-issued | 12 |
| Regulatory Body (FDA, DEA, CMS, NRC, OSHA, State Boards) | 14 |
| Certifying / Accrediting Body | 9 |
| Training Provider | 4 |
| Person (self-issued) | 1 |
| Insurance Carrier | 2 |
| Bilateral (Institution + Counterparty) | 1 |
| Quality Unit (internal) | 3 |
| — (none) | 2 |

### By study_context

| study_context | Count |
|---|---|
| required | 5 (Study-Specific Training, Delegation Log, FDA 1572, Financial Disclosure, MTA) |
| optional | 39 |
| none | 2 (Medical Record, Unclassified) |
| — (no model) | 2 |

### By location_context

| location_context | Count |
|---|---|
| required | 23 (Medical License, Delegation Log, FDA 1572, State License, CLIA, CAP, Pharmacy, Facility Cert, Emergency Response, CAPA, HazMat, Calibration, Preventive Maint, IQ/OQ/PQ, Temp Mapping, Shipping Validation, Backup Power, Alarm/Excursion, Env Monitoring, Radiation Safety, BSL) |
| optional | 8 |
| none | 15 |
| — (no model) | 2 |

---

## Entity Relationship Rules

1. **Person-as-legal_owner evidence** is portable across studies and institutions. Expiry is date-driven per issuing_authority requirements. The custodian (Institution) manages storage and access.

2. **study_context = required** means the document cannot exist in KADARN without an active study. Deprovisioning the study invalidates evidence linkage unless the document is re-scoped.

3. **location_context = required** means the document is tied to a specific location. Relocating equipment or closing a facility triggers evidence re-validation.

4. **Equipment + Location scoped evidence** (rows 27-31) requires both entities active. Moving equipment invalidates location-linked records until re-established at the new location.

5. **Technology System + Institution evidence** (rows 37-39) requires the system registered as an entity. System decommissioning triggers evidence archival per custodian retention policy.

6. **PROHIBITED_CONTENT** (row 47) has no entity relationship model. KADARN must reject ingestion at the API boundary before any entity resolution occurs.

7. **QUARANTINE_PENDING_CLASSIFICATION** (row 48) has no entity relationship model until human classification resolves the destination. Entity roles are assigned post-classification.

---

*DOCUMENT_ENTITY_OWNERSHIP_MATRIX.md — WO-KEMS-DOC-003 — Revised 2026-07-30 per Human Gate A9*
