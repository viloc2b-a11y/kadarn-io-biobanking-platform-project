# DOCUMENT TAXONOMY CLASSIFICATION MATRIX

**Work Order:** WO-KEMS-DOC-003
**Deliverable:** 2 of 5
**Baseline:** WO-KEMS-DOC-002 ACCEPTED (e9581aa), WO-KEMS-DOC-001 ACCEPTED (76e3625)
**Classification:** 48 document types × 9 primary classes
**Revision:** Human Gate feedback A3-A5 — replaced Seed Candidate with implementation_destination; reclassified Unclassified Document

---

## Primary Classes

| Class | Description |
|---|---|
| **SITE_REUSABLE** | Institutional evidence, reusable across studies |
| **PERSON_REUSABLE** | Evidence owned by a person, reusable across studies |
| **LOCATION_REUSABLE** | Evidence valid only for a specific location |
| **EQUIPMENT_REUSABLE** | Evidence linked to a concrete equipment asset |
| **TECHNOLOGY_SYSTEM_REUSABLE** | Evidence of an electronic system |
| **STUDY_SPECIFIC** | Not part of the general institutional profile |
| **STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE** | Primarily modeled as data, may have supporting files |
| **RESTRICTED_EVIDENCE** | Validates claims but has access/transfer limitations |
| **PROHIBITED_CONTENT** | Content KADARN must never ingest (PHI, etc.); distinct from taxonomy implementation destinations |

---

## Implementation Destinations

Each classified document type is assigned exactly one `implementation_destination` that governs how KADARN ingests, stores, and packages it.

| Destination | Meaning |
|---|---|
| **REUSABLE_DOCUMENT_TAXONOMY** | Reusable evidence taxonomy entry; seeded across studies; eligible for automated package assembly |
| **STUDY_SPECIFIC_DOCUMENT_TAXONOMY** | Per-study taxonomy entry; not reusable across protocols; package-eligible within study scope |
| **STRUCTURED_PROFILE_DATA** | Modeled as structured profile data fields, not document taxonomy entries; optional evidence files |
| **RESTRICTED_EVIDENCE_TAXONOMY** | Internal evidence only; validates claims but ineligible for external package assembly |
| **PROHIBITED_INGESTION** | KADARN must reject at API boundary — never ingest, never store |
| **QUARANTINE_PENDING_CLASSIFICATION** | Ingestion allowed; package ineligible; external transfer prohibited; manual human classification required before any further action |

---

## Classification Matrix (48 types)

| # | Document Type | Primary Class | Entity Owner | Reusable | Study-Specific | Restricted | implementation_destination | Rationale |
|---|---|---|---|---|---|---|---|---|
| 1 | Curriculum Vitae | PERSON_REUSABLE | Person | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-person credential; used across all studies |
| 2 | GCP Training Certificate | PERSON_REUSABLE | Person | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Universal requirement; reusable |
| 3 | IATA Training Certificate | PERSON_REUSABLE | Person | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Required when shipping samples; reusable |
| 4 | Human Subjects Protection | PERSON_REUSABLE | Person | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Universal requirement |
| 5 | Medical License | PERSON_REUSABLE | Person | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | State-issued; valid until expiry |
| 6 | Board Certification | PERSON_REUSABLE | Person | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Specialty-specific; reusable |
| 7 | ACLS/BLS Certification | PERSON_REUSABLE | Person | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Protocol-dependent but person-owned |
| 8 | Study-Specific Training | STUDY_SPECIFIC | Person + Study | — | ✅ | — | STUDY_SPECIFIC_DOCUMENT_TAXONOMY | Per-study; not reusable across protocols |
| 9 | Delegation of Authority Log | STUDY_SPECIFIC | Person + Study | — | ✅ | — | STUDY_SPECIFIC_DOCUMENT_TAXONOMY | Per-study; 1572-linked |
| 10 | FDA Form 1572 | STUDY_SPECIFIC | Person + Institution + Study | — | ✅ | ✅ | STUDY_SPECIFIC_DOCUMENT_TAXONOMY | Per-study regulatory document; contains PII |
| 11 | Financial Disclosure | STUDY_SPECIFIC | Person + Study | — | ✅ | ✅ | STUDY_SPECIFIC_DOCUMENT_TAXONOMY | Per-study; confidential |
| 12 | State/Regional License | PERSON_REUSABLE | Person + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | State-specific; reusable while valid |
| 13 | CLIA Certificate | SITE_REUSABLE | Institution + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Regulatory; per-lab-location |
| 14 | CAP Accreditation | SITE_REUSABLE | Institution + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Regulatory; per-lab-location |
| 15 | Institutional License | SITE_REUSABLE | Institution | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Foundational; reusable |
| 16 | Pharmacy License | SITE_REUSABLE | Institution + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Conditional; reusable |
| 17 | Controlled-Substance Registration | SITE_REUSABLE | Institution | ✅ | — | ✅ | REUSABLE_DOCUMENT_TAXONOMY | Restricted; manual review required |
| 18 | IRB Reliance Information | SITE_REUSABLE | Institution | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Reusable; per-institution |
| 19 | Facility Certification | LOCATION_REUSABLE | Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-location; reusable |
| 20 | Insurance Certificate | SITE_REUSABLE | Institution | ✅ | — | ✅ | REUSABLE_DOCUMENT_TAXONOMY | Confidential; internal evidence only |
| 21 | Standard Operating Procedure | SITE_REUSABLE | Institution | ✅ | — | ✅ | REUSABLE_DOCUMENT_TAXONOMY | Confidential; selected by protocol relevance |
| 22 | CAPA Records | RESTRICTED_EVIDENCE | Institution + Location | — | — | ✅ | RESTRICTED_EVIDENCE_TAXONOMY | Internal quality; not for external transfer |
| 23 | Internal Audit Report | RESTRICTED_EVIDENCE | Institution | — | — | ✅ | RESTRICTED_EVIDENCE_TAXONOMY | Confidential; internal only |
| 24 | Emergency Response Plan | SITE_REUSABLE | Institution + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-location where applicable |
| 25 | Business Continuity Plan | SITE_REUSABLE | Institution | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Institutional; reusable |
| 26 | Hazardous Materials Documentation | LOCATION_REUSABLE | Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-location; reusable |
| 27 | Equipment Calibration Record | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-equipment; reusable |
| 28 | Preventive Maintenance Record | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-equipment; reusable |
| 29 | Equipment Qualification (IQ/OQ/PQ) | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-equipment; reusable |
| 30 | Temperature Mapping Report | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-equipment/location; reusable |
| 31 | Shipping Equipment Validation | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Conditional; reusable |
| 32 | Backup Power Test Logs | LOCATION_REUSABLE | Location + Equipment | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-location; ongoing evidence |
| 33 | Alarm Response / Excursion Logs | RESTRICTED_EVIDENCE | Location + Equipment | — | — | ✅ | RESTRICTED_EVIDENCE_TAXONOMY | Operational incident; restricted |
| 34 | Environmental Monitoring Logs | LOCATION_REUSABLE | Location + Equipment | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Ongoing; per-location |
| 35 | Radiation Safety Certificate | LOCATION_REUSABLE | Location + Equipment | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-location; regulatory |
| 36 | BSL Documentation | LOCATION_REUSABLE | Location | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Per-location; reusable |
| 37 | EMR/EHR System Validation | TECHNOLOGY_SYSTEM_REUSABLE | Technology System + Institution | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | System-level; reusable |
| 38 | Data Security Certification | TECHNOLOGY_SYSTEM_REUSABLE | Technology System + Institution | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | System-level; reusable |
| 39 | 21 CFR Part 11 Compliance | TECHNOLOGY_SYSTEM_REUSABLE | Technology System + Institution | ✅ | — | — | REUSABLE_DOCUMENT_TAXONOMY | Regulatory; reusable |
| 40 | Patient Recruitment Plan | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | STRUCTURED_PROFILE_DATA | Primarily structured data; PDF is optional |
| 41 | Diversity and Inclusion Plan | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | STRUCTURED_PROFILE_DATA | Primarily structured data |
| 42 | Community Advisory Board Documentation | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | STRUCTURED_PROFILE_DATA | Primarily structured data |
| 43 | Translator / Language Services | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | STRUCTURED_PROFILE_DATA | Primarily structured data |
| 44 | Staff Training Compliance Matrix | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | STRUCTURED_PROFILE_DATA | Aggregate data; PDF is optional |
| 45 | Material Transfer Agreement (MTA) | STUDY_SPECIFIC | Institution + Counterparty + Study | — | ✅ | ✅ | STUDY_SPECIFIC_DOCUMENT_TAXONOMY | Per-study/collection; restricted |
| 46 | Indemnification / Liability Coverage | SITE_REUSABLE | Institution | ✅ | — | ✅ | REUSABLE_DOCUMENT_TAXONOMY | Confidential; internal evidence only |
| 47 | Medical Record | PROHIBITED_CONTENT | — | — | — | — | PROHIBITED_INGESTION | PHI — never ingest; blocked at API boundary |
| 48 | Unclassified Document | QUARANTINE (pending) | — | — | — | — | QUARANTINE_PENDING_CLASSIFICATION | Ingestion allowed; package ineligible; external transfer prohibited; human classification required before any further action |

> **Note:** PROHIBITED_CONTENT (row 47) is a primary class distinct from the implementation destinations. It denotes content that must never enter KADARN. Its implementation_destination is PROHIBITED_INGESTION. Unclassified Document (row 48) was previously classified as PROHIBITED; it is now QUARANTINE_PENDING_CLASSIFICATION — ingestion is permitted so the document can be reviewed and classified by a human, but it cannot be included in any package and cannot be transferred externally until classification is complete.

---

## Summary by implementation_destination

| implementation_destination | Count | Description |
|---|---|---|
| REUSABLE_DOCUMENT_TAXONOMY | 34 | Seeded as reusable taxonomy; eligible for automated package assembly |
| STUDY_SPECIFIC_DOCUMENT_TAXONOMY | 5 | Per-study taxonomy; package-eligible within study scope only |
| STRUCTURED_PROFILE_DATA | 5 | Modeled as structured data fields, not document taxonomy |
| RESTRICTED_EVIDENCE_TAXONOMY | 3 | Internal evidence only; ineligible for external package |
| PROHIBITED_INGESTION | 1 | Never ingest — rejected at API boundary |
| QUARANTINE_PENDING_CLASSIFICATION | 1 | Ingested but held pending human classification |
| **TOTAL** | **48** | **6 destination types** |

---

## Destination Decision Logic

### REUSABLE_DOCUMENT_TAXONOMY (34 types)
All SITE_REUSABLE, PERSON_REUSABLE, LOCATION_REUSABLE, EQUIPMENT_REUSABLE, and TECHNOLOGY_SYSTEM_REUSABLE types. These represent reusable evidence categories that apply across studies and are seeded as document taxonomy rules. Eligible for automated package assembly.

### STUDY_SPECIFIC_DOCUMENT_TAXONOMY (5 types)
FDA 1572, Delegation Log, Financial Disclosure, Study-Specific Training, MTA. Per-study documents; taxonomy entries scoped to a single study. Package-eligible within the study scope.

### STRUCTURED_PROFILE_DATA (5 types)
Recruitment Plan, Diversity Plan, Community Board, Translator, Training Matrix. Modeled as structured data fields, not document taxonomy entries. Optional evidence files may accompany the structured data.

### RESTRICTED_EVIDENCE_TAXONOMY (3 types)
CAPA, Internal Audit, Alarm/Excursion Logs. Internal evidence — can validate claims but must not be eligible for automated external package assembly.

### PROHIBITED_INGESTION (1 type)
Medical Record. PHI content — KADARN must reject at the API boundary. No ingestion, no storage, no processing.

### QUARANTINE_PENDING_CLASSIFICATION (1 type)
Unclassified Document. Ingestion is permitted so the document can be reviewed by a human. Package assembly is prohibited. External transfer is prohibited. A human must classify the document before any further automated action.

---

*DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md — WO-KEMS-DOC-003 — Revised 2026-07-30 per Human Gate A3-A5*
