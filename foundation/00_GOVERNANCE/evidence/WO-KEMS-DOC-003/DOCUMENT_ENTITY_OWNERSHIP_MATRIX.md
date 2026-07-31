# DOCUMENT ENTITY OWNERSHIP MATRIX

**Work Order:** WO-KEMS-DOC-003
**Deliverable:** 4 of 5
**Reference:** DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md (Deliverable 2)
**Classification:** 48 document types mapped to entity owners

---

## Entity Model

The following entity types own evidence in the KADARN Evidence Management System (KEMS):

| Entity | Description |
|---|---|
| **Person** | Individual professional (PI, Sub-I, study coordinator, lab tech, etc.) |
| **Institution** | Legal entity operating the site (hospital, university, CRO, etc.) |
| **Location** | Physical site or facility where activities occur |
| **Equipment** | Concrete asset — centrifuge, freezer, imaging modality, etc. |
| **Study** | Specific clinical research protocol / study instance |
| **Technology System** | Electronic system — EMR/EHR, CTMS, eSource, etc. |
| **Counterparty** | External entity party to a legal agreement (MTA, CDA, etc.) |

### Ownership Cardinality Semantics

| Connector | Meaning |
|---|---|
| `+` (plus) | Joint ownership — ALL entities required to own the evidence |
| `or` | Alternative ownership — ANY of the listed entities may own |
| `→` (arrow) | Derived ownership — primary entity owns, secondary references |

---

## Document Type → Entity Owner Matrix

| # | Document Type | Primary Class | Entity Owner(s) | Rationale |
|---|---|---|---|---|
| 1 | Curriculum Vitae | PERSON_REUSABLE | Person | Owned by the individual professional; updated by them |
| 2 | GCP Training Certificate | PERSON_REUSABLE | Person | Issued to the individual; personal credential |
| 3 | IATA Training Certificate | PERSON_REUSABLE | Person | Issued to the individual; personal credential |
| 4 | Human Subjects Protection | PERSON_REUSABLE | Person | Issued to the individual; personal credential |
| 5 | Medical License | PERSON_REUSABLE | Person | State-issued to the individual practitioner |
| 6 | Board Certification | PERSON_REUSABLE | Person | Specialty board-issued to the individual |
| 7 | ACLS/BLS Certification | PERSON_REUSABLE | Person | Issued to the individual; personal credential |
| 8 | Study-Specific Training | STUDY_SPECIFIC | Person + Study | Training tied to a specific protocol; person completes it |
| 9 | Delegation of Authority Log | STUDY_SPECIFIC | Person + Study + Location | Records who is delegated what, where, under which study |
| 10 | FDA Form 1572 | STUDY_SPECIFIC | Person + Institution + Study | PI signs; institution is listed; study is the context |
| 11 | Financial Disclosure | STUDY_SPECIFIC | Person + Study | Per-investigator per-study financial interest declaration |
| 12 | State/Regional License | PERSON_REUSABLE | Person + Location | Licensed to practice in a specific state/jurisdiction |
| 13 | CLIA Certificate | SITE_REUSABLE | Institution + Location | Issued to the laboratory at a specific location |
| 14 | CAP Accreditation | SITE_REUSABLE | Institution + Location | Accredited laboratory at a specific location |
| 15 | Institutional License | SITE_REUSABLE | Institution | Institutional operating license or business registration |
| 16 | Pharmacy License | SITE_REUSABLE | Institution + Location | Licensed pharmacy at a specific location |
| 17 | Controlled-Substance Registration | SITE_REUSABLE | Institution | DEA or equivalent registration held by the institution |
| 18 | IRB Reliance Information | SITE_REUSABLE | Institution | Institution's IRB registration, FWA, and reliance agreements |
| 19 | Facility Certification | LOCATION_REUSABLE | Location | Certification tied to the physical facility |
| 20 | Insurance Certificate | SITE_REUSABLE | Institution | Institutional professional liability or clinical trial insurance |
| 21 | Standard Operating Procedure | SITE_REUSABLE | Institution | Institution-authored and maintained SOP |
| 22 | CAPA Records | RESTRICTED_EVIDENCE | Institution or Location | Corrective action tied to institutional QMS or facility |
| 23 | Internal Audit Report | RESTRICTED_EVIDENCE | Institution | Internal quality audit conducted by/for the institution |
| 24 | Emergency Response Plan | SITE_REUSABLE | Institution + Location | Institutional plan implemented at a specific location |
| 25 | Business Continuity Plan | SITE_REUSABLE | Institution | Institutional plan; may reference locations |
| 26 | Hazardous Materials Documentation | LOCATION_REUSABLE | Location | Tied to the physical facility housing hazardous materials |
| 27 | Equipment Calibration Record | EQUIPMENT_REUSABLE | Equipment + Location | Specific equipment unit at a specific location |
| 28 | Preventive Maintenance Record | EQUIPMENT_REUSABLE | Equipment + Location | Specific equipment unit at a specific location |
| 29 | Equipment Qualification (IQ/OQ/PQ) | EQUIPMENT_REUSABLE | Equipment + Location | Specific equipment unit at a specific location |
| 30 | Temperature Mapping Report | EQUIPMENT_REUSABLE | Equipment + Location | Storage unit mapped at a specific location |
| 31 | Shipping Equipment Validation | EQUIPMENT_REUSABLE | Equipment + Location | Shipping container/system validated at a location |
| 32 | Backup Power Test Logs | LOCATION_REUSABLE | Location + Equipment | Location-wide backup power system; may reference generator equipment |
| 33 | Alarm Response / Excursion Logs | RESTRICTED_EVIDENCE | Location + Equipment | Incident at a location involving specific equipment |
| 34 | Environmental Monitoring Logs | LOCATION_REUSABLE | Location + Equipment | Environmental conditions at a location monitored by equipment |
| 35 | Radiation Safety Certificate | LOCATION_REUSABLE | Location + Equipment | Location certificate; equipment (imaging modality) is the source |
| 36 | BSL Documentation | LOCATION_REUSABLE | Location | Biosafety level assigned to a specific facility |
| 37 | EMR/EHR System Validation | TECHNOLOGY_SYSTEM_REUSABLE | Technology System + Institution | System validation owned by the institution operating the system |
| 38 | Data Security Certification | TECHNOLOGY_SYSTEM_REUSABLE | Technology System + Institution | System certification held by the institution |
| 39 | 21 CFR Part 11 Compliance | TECHNOLOGY_SYSTEM_REUSABLE | Technology System + Institution | System compliance assessment owned by the institution |
| 40 | Patient Recruitment Plan | STRUCTURED_DATA | Institution | Institutional capability data; plan owned by site |
| 41 | Diversity and Inclusion Plan | STRUCTURED_DATA | Institution | Institutional capability data; plan owned by site |
| 42 | Community Advisory Board Documentation | STRUCTURED_DATA | Institution | Institutional capability data; board operated by site |
| 43 | Translator / Language Services | STRUCTURED_DATA | Institution | Institutional capability data; services arranged by site |
| 44 | Staff Training Compliance Matrix | STRUCTURED_DATA | Institution | Aggregate institutional data; references multiple persons |
| 45 | Material Transfer Agreement (MTA) | STUDY_SPECIFIC | Institution + Counterparty + Study | Tripartite: sending institution, receiving counterparty, study context |
| 46 | Indemnification / Liability Coverage | SITE_REUSABLE | Institution | Institutional insurance/indemnification policy |
| 47 | Medical Record | PROHIBITED | — | PHI — no entity ownership model; never ingested |
| 48 | Unclassified Document | PROHIBITED | — | Unknown sensitivity; quarantined; no entity assigned |

---

## Entity Ownership Summary

| Entity | Document Types Owned | Count |
|---|---|---|
| **Person** | CV, GCP, IATA, HSP, Medical License, Board Cert, ACLS/BLS | 7 sole |
| **Person + Study** | Study-Specific Training, Financial Disclosure | 2 |
| **Person + Institution + Study** | FDA 1572 | 1 |
| **Person + Location** | State/Regional License | 1 |
| **Person + Study + Location** | Delegation Log | 1 |
| **Institution** | Institutional License, IRB Reliance, SOP, Insurance, BCP, Internal Audit, Indemnification, + structured data types (5) | 12 |
| **Institution + Location** | CLIA, CAP, Pharmacy License, Controlled-Substance, Emergency Response | 5 |
| **Institution + Counterparty + Study** | MTA | 1 |
| **Location** | Facility Certification, Hazardous Materials, BSL | 3 |
| **Location + Equipment** | Backup Power, Alarm/Excursion, Env Monitoring, Radiation Safety | 4 |
| **Equipment + Location** | Calibration, Preventive Maint, IQ/OQ/PQ, Temp Mapping, Shipping Validation | 5 |
| **Technology System + Institution** | EMR/EHR Validation, Data Security, 21 CFR Part 11 | 3 |
| **— (Prohibited)** | Medical Record, Unclassified | 2 |

---

## Ownership Rules

1. **Person-owned evidence** is portable across studies and institutions. Expiry is date-driven.
2. **Person + Study evidence** requires both entities to be active in KADARN. Deprovisioning either entity invalidates the evidence linkage.
3. **Equipment + Location evidence** is location-scoped. Moving equipment invalidates location-linked calibration/qualification until re-established.
4. **Technology System + Institution evidence** requires the system to be registered as an entity. System decommissioning triggers evidence archival.
5. **Prohibited types** have no entity owner. KADARN must reject ingestion at the API boundary.

---

*DOCUMENT_ENTITY_OWNERSHIP_MATRIX.md — WO-KEMS-DOC-003 — 2026-07-30*
