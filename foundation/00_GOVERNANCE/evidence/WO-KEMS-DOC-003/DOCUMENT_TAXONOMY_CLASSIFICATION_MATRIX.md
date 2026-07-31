# DOCUMENT TAXONOMY CLASSIFICATION MATRIX

**Work Order:** WO-KEMS-DOC-003
**Deliverable:** 2 of 5
**Baseline:** WO-KEMS-DOC-002 ACCEPTED (e9581aa), WO-KEMS-DOC-001 ACCEPTED (76e3625)
**Classification:** 46 document types × 9 primary classes

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
| **PROHIBITED** | KADARN must not accept under normal conditions |

---

## Classification Matrix (46 types)

| # | Document Type | Primary Class | Entity Owner | Reusable | Study-Specific | Restricted | Seed Candidate | Rationale |
|---|---|---|---|---|---|---|---|---|
| 1 | Curriculum Vitae | PERSON_REUSABLE | Person | ✅ | — | — | ✅ | Per-person credential; used across all studies |
| 2 | GCP Training Certificate | PERSON_REUSABLE | Person | ✅ | — | — | ✅ | Universal requirement; reusable |
| 3 | IATA Training Certificate | PERSON_REUSABLE | Person | ✅ | — | — | ✅ | Required when shipping samples; reusable |
| 4 | Human Subjects Protection | PERSON_REUSABLE | Person | ✅ | — | — | ✅ | Universal requirement |
| 5 | Medical License | PERSON_REUSABLE | Person | ✅ | — | — | ✅ | State-issued; valid until expiry |
| 6 | Board Certification | PERSON_REUSABLE | Person | ✅ | — | — | ✅ | Specialty-specific; reusable |
| 7 | ACLS/BLS Certification | PERSON_REUSABLE | Person | ✅ | — | — | ✅ | Protocol-dependent but person-owned |
| 8 | Study-Specific Training | STUDY_SPECIFIC | Person + Study | — | ✅ | — | ❌ | Per-study; not reusable across protocols |
| 9 | Delegation of Authority Log | STUDY_SPECIFIC | Person + Study | — | ✅ | — | ❌ | Per-study; 1572-linked |
| 10 | FDA Form 1572 | STUDY_SPECIFIC | Person + Institution + Study | — | ✅ | ✅ | ❌ | Per-study regulatory document; contains PII |
| 11 | Financial Disclosure | STUDY_SPECIFIC | Person + Study | — | ✅ | ✅ | ❌ | Per-study; confidential |
| 12 | State/Regional License | PERSON_REUSABLE | Person + Location | ✅ | — | — | ✅ | State-specific; reusable while valid |
| 13 | CLIA Certificate | SITE_REUSABLE | Institution + Location | ✅ | — | — | ✅ | Regulatory; per-lab-location |
| 14 | CAP Accreditation | SITE_REUSABLE | Institution + Location | ✅ | — | — | ✅ | Regulatory; per-lab-location |
| 15 | Institutional License | SITE_REUSABLE | Institution | ✅ | — | — | ✅ | Foundational; reusable |
| 16 | Pharmacy License | SITE_REUSABLE | Institution + Location | ✅ | — | — | ✅ | Conditional; reusable |
| 17 | Controlled-Substance Registration | SITE_REUSABLE | Institution | ✅ | — | ✅ | ✅ | Restricted; manual review required |
| 18 | IRB Reliance Information | SITE_REUSABLE | Institution | ✅ | — | — | ✅ | Reusable; per-institution |
| 19 | Facility Certification | LOCATION_REUSABLE | Location | ✅ | — | — | ✅ | Per-location; reusable |
| 20 | Insurance Certificate | SITE_REUSABLE | Institution | ✅ | — | ✅ | ✅ | Confidential; internal evidence only |
| 21 | Standard Operating Procedure | SITE_REUSABLE | Institution | ✅ | — | ✅ | ✅ | Confidential; selected by protocol relevance |
| 22 | CAPA Records | RESTRICTED_EVIDENCE | Institution + Location | — | — | ✅ | ❌ | Internal quality; not for external transfer |
| 23 | Internal Audit Report | RESTRICTED_EVIDENCE | Institution | — | — | ✅ | ❌ | Confidential; internal only |
| 24 | Emergency Response Plan | SITE_REUSABLE | Institution + Location | ✅ | — | — | ✅ | Per-location where applicable |
| 25 | Business Continuity Plan | SITE_REUSABLE | Institution | ✅ | — | — | ✅ | Institutional; reusable |
| 26 | Hazardous Materials Documentation | LOCATION_REUSABLE | Location | ✅ | — | — | ✅ | Per-location; reusable |
| 27 | Equipment Calibration Record | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | ✅ | Per-equipment; reusable |
| 28 | Preventive Maintenance Record | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | ✅ | Per-equipment; reusable |
| 29 | Equipment Qualification (IQ/OQ/PQ) | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | ✅ | Per-equipment; reusable |
| 30 | Temperature Mapping Report | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | ✅ | Per-equipment/location; reusable |
| 31 | Shipping Equipment Validation | EQUIPMENT_REUSABLE | Equipment + Location | ✅ | — | — | ✅ | Conditional; reusable |
| 32 | Backup Power Test Logs | LOCATION_REUSABLE | Location + Equipment | ✅ | — | — | ✅ | Per-location; ongoing evidence |
| 33 | Alarm Response / Excursion Logs | RESTRICTED_EVIDENCE | Location + Equipment | — | — | ✅ | ❌ | Operational incident; restricted |
| 34 | Environmental Monitoring Logs | LOCATION_REUSABLE | Location + Equipment | ✅ | — | — | ✅ | Ongoing; per-location |
| 35 | Radiation Safety Certificate | LOCATION_REUSABLE | Location + Equipment | ✅ | — | — | ✅ | Per-location; regulatory |
| 36 | BSL Documentation | LOCATION_REUSABLE | Location | ✅ | — | — | ✅ | Per-location; reusable |
| 37 | EMR/EHR System Validation | TECHNOLOGY_SYSTEM_REUSABLE | Technology System + Institution | ✅ | — | — | ✅ | System-level; reusable |
| 38 | Data Security Certification | TECHNOLOGY_SYSTEM_REUSABLE | Technology System + Institution | ✅ | — | — | ✅ | System-level; reusable |
| 39 | 21 CFR Part 11 Compliance | TECHNOLOGY_SYSTEM_REUSABLE | Technology System + Institution | ✅ | — | — | ✅ | Regulatory; reusable |
| 40 | Patient Recruitment Plan | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | ❌ | Primarily structured data; PDF is optional |
| 41 | Diversity and Inclusion Plan | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | ❌ | Primarily structured data |
| 42 | Community Advisory Board Documentation | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | ❌ | Primarily structured data |
| 43 | Translator / Language Services | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | ❌ | Primarily structured data |
| 44 | Staff Training Compliance Matrix | STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | Institution | ✅ | — | — | ❌ | Aggregate data; PDF is optional |
| 45 | Material Transfer Agreement (MTA) | STUDY_SPECIFIC | Institution + Counterparty + Study | — | ✅ | ✅ | ❌ | Per-study/collection; restricted |
| 46 | Indemnification / Liability Coverage | SITE_REUSABLE | Institution | ✅ | — | ✅ | ✅ | Confidential; internal evidence only |
| 47 | Medical Record | PROHIBITED | — | — | — | — | ❌ | PHI — never ingest |
| 48 | Unclassified Document | PROHIBITED | — | — | — | — | ❌ | Unknown sensitivity — quarantine |

---

## Summary by Primary Class

| Class | Count | Seed Candidates |
|---|---|---|
| PERSON_REUSABLE | 9 | 9 (all) |
| SITE_REUSABLE | 11 | 11 (all) |
| LOCATION_REUSABLE | 6 | 6 (all) |
| EQUIPMENT_REUSABLE | 5 | 5 (all) |
| TECHNOLOGY_SYSTEM_REUSABLE | 3 | 3 (all) |
| STUDY_SPECIFIC | 5 | 0 (none — per-study, not reusable taxonomy) |
| STRUCTURED_DATA_WITH_OPTIONAL_EVIDENCE | 5 | 0 (model as data, not document taxonomy) |
| RESTRICTED_EVIDENCE | 3 | 0 (internal only, not for external package) |
| PROHIBITED | 2 | 0 (never ingest) |
| **TOTAL** | **48** | **34 seed candidates** |

---

## Seed vs. Non-Seed Decision

### ✅ Approved as Taxonomy Seeds (34 types)
All SITE_REUSABLE, PERSON_REUSABLE, LOCATION_REUSABLE, EQUIPMENT_REUSABLE, and TECHNOLOGY_SYSTEM_REUSABLE types. These represent reusable evidence categories that apply across studies and can be seeded as document taxonomy rules.

### ❌ NOT Approved as Seeds (14 types)
- **STUDY_SPECIFIC (5):** FDA 1572, Delegation Log, Financial Disclosure, Study-Specific Training, MTA. Per-study documents should not be seeded as universal taxonomy types.
- **STRUCTURED_DATA (5):** Recruitment Plan, Diversity Plan, Community Board, Translator, Training Matrix. These should be modeled as structured data fields, not document taxonomy entries.
- **RESTRICTED_EVIDENCE (3):** CAPA, Internal Audit, Alarm/Excursion Logs. Internal evidence — can validate claims but must not be eligible for automated package assembly.
- **PROHIBITED (2):** Medical Record, Unclassified. Never ingest.

---

*DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md — WO-KEMS-DOC-003 — 2026-07-30*
