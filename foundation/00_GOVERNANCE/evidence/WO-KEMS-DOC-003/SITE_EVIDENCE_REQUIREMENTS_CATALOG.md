# SITE EVIDENCE REQUIREMENTS CATALOG

**Work Order:** WO-KEMS-DOC-003
**Deliverable:** 1 of 5 (Catalog Reference)
**Reference:** DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md (Deliverable 2)
**Classification:** 48 evidence requirements across 10 capability areas

---

## Catalog Schema

| Column | Description |
|---|---|
| **Capability ID** | Unique identifier for the capability area (CXX) |
| **Claim ID** | Unique claim within the capability (CL-XXX) |
| **Entity Owner** | Entity that owns the evidence |
| **Evidence Required** | Primary evidence type (maps to document type #) |
| **Alternative Evidence** | Acceptable substitutes when primary unavailable |
| **Applicability** | When this claim applies to a site |
| **Validity Rule** | How currency/validity is determined |
| **Sensitivity** | Data classification (Public, Internal, Confidential, Restricted) |
| **Handling** | Storage, access, retention requirements |
| **Package Behavior** | How the evidence behaves in package assembly |
| **Review Level** | Required review tier (Auto, Level 1, Level 2, Level 3) |
| **Transfer Rule** | External transfer permission (Allowed, Conditional, Prohibited) |

### Column Value Definitions

**Sensitivity:**
| Level | Description |
|---|---|
| Public | No access restrictions |
| Internal | Site-internal use; not externally shared |
| Confidential | Contains PII or proprietary content |
| Restricted | Highly sensitive; access-controlled and logged |

**Review Level:**
| Level | Description |
|---|---|
| Auto | System-validated; no human review |
| Level 1 | Single reviewer (CRC or Site Manager) |
| Level 2 | Dual review (CRC + PI or QA) |
| Level 3 | Governance review (QA + Legal + Site Director) |

**Transfer Rule:**
| Rule | Description |
|---|---|
| Allowed | External transfer permitted without additional authorization |
| Conditional | External transfer requires recipient-specific authorization |
| Prohibited | External transfer is never permitted |

---

## 1. Institutional Identity

Evidence of the site's legal existence, licensing, and institutional standing.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C01 | CL-001 | Institution | Institutional License (#15) | Business Registration Certificate | All sites | Expiry date ≤ current date | Internal | Encrypted at rest; access by site admin role | Eligible → awaiting_review → authorized | Level 1 | Allowed |
| C01 | CL-002 | Institution | Insurance Certificate (#20) | Self-insurance letter; risk pool membership | All sites conducting clinical research | Expiry date ≤ current date | Confidential | Encrypted at rest; access by site admin + QA | User-selectable; recipient auth required; metadata-only allowed | Level 2 | Conditional |
| C01 | CL-003 | Institution | Indemnification / Liability Coverage (#46) | Umbrella policy documentation | All sites | Expiry date ≤ current date | Confidential | Encrypted at rest; access by legal + site admin | User-selectable; recipient auth required; metadata-only allowed | Level 3 | Conditional |
| C01 | CL-004 | Location | Facility Certification (#19) | Occupancy permit; fire marshal certificate | All sites with physical facilities | Expiry date ≤ current date | Internal | Encrypted at rest; access by site admin | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C01 | CL-005 | Institution | IRB Reliance Information (#18) | FWA number; IRB registration; reliance agreement | All sites conducting FDA-regulated research | FWA registration active; IRB roster current | Internal | Encrypted at rest; access by regulatory + site admin | System-suggested; eligible → awaiting_review → authorized | Level 2 | Allowed |

---

## 2. Clinical Experience

Evidence of staff qualifications, training, and clinical competence.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C02 | CL-006 | Person | Curriculum Vitae (#1) | NIH biosketch; institutional CV form | All study staff with delegated duties | Signed and dated within 2 years | Confidential | Encrypted at rest; PII redaction before external sharing; access by CRC + PI | System-suggested; redaction required; metadata-only allowed | Level 1 | Allowed (redacted) |
| C02 | CL-007 | Person | Medical License (#5) | State registration verification letter | PI and Sub-I (MD/DO/RN/NP/PA) | Expiry date ≤ current date; state = site state | Confidential | Encrypted at rest; license number redacted before external sharing | System-suggested; redaction required; metadata-only allowed | Level 1 | Allowed (redacted) |
| C02 | CL-008 | Person | Board Certification (#6) | Eligibility letter; training program completion certificate | PI and Sub-I when protocol requires board-certified specialist | Certification active per board registry | Confidential | Encrypted at rest; access by CRC + PI | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C02 | CL-009 | Person | State/Regional License (#12) | Multi-state compact license verification | Staff practicing across multiple jurisdictions | Expiry date ≤ current date; jurisdiction matches site | Confidential | Encrypted at rest; access by regulatory | System-suggested; metadata-only allowed | Level 1 | Allowed |
| C02 | CL-010 | Person | ACLS/BLS Certification (#7) | Equivalent emergency response certification | Staff with direct patient contact in interventional studies | Expiry date ≤ current date (typically 2 years) | Internal | Encrypted at rest; access by CRC | System-suggested; eligible → awaiting_review → authorized | Auto | Allowed |
| C02 | CL-011 | Person | GCP Training Certificate (#2) | ICH E6(R2) equivalent training; institutional GCP training | All study staff with delegated duties | Completed within 3 years; refresher if expired | Internal | Encrypted at rest; access by CRC + training coordinator | System-suggested; eligible → awaiting_review → authorized | Auto | Allowed |
| C02 | CL-012 | Person | Human Subjects Protection (#4) | CITI Program certificate; institutional HSP training | All study staff with subject contact or data access | Completed within 3 years; refresher if expired | Internal | Encrypted at rest; access by CRC + training coordinator | System-suggested; eligible → awaiting_review → authorized | Auto | Allowed |
| C02 | CL-013 | Person + Study | Study-Specific Training (#8) | Protocol training sign-off sheet; investigator meeting attendance | All staff delegated to a specific protocol | Completed before first delegated task; per protocol version | Internal | Encrypted at rest; access by CRC + PI | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C02 | CL-014 | Person + Study + Location | Delegation of Authority Log (#9) | Site delegation roster; sponsor-provided log template | All studies with delegated tasks | Signed by PI; matches 1572; updated when staff change | Confidential | Encrypted at rest; staff names redacted before external sharing | System-suggested; redaction required | Level 1 | Allowed (redacted) |

---

## 3. Lab Infrastructure

Evidence of laboratory licensing, accreditation, and operational capability.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C03 | CL-015 | Institution + Location | CLIA Certificate (#13) | State lab license; COLA accreditation | Sites performing clinical lab testing | Expiry date ≤ current date; test complexity matches protocol | Internal | Encrypted at rest; access by lab director + site admin | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C03 | CL-016 | Institution + Location | CAP Accreditation (#14) | ISO 15189 accreditation; JCI lab certification | Sites performing anatomic or clinical pathology | Accreditation cycle current; no adverse findings | Internal | Encrypted at rest; access by lab director + QA | System-suggested; eligible → awaiting_review → authorized | Level 2 | Allowed |
| C03 | CL-017 | Person | IATA Training Certificate (#3) | Dangerous goods shipping training; carrier-specific training | Staff shipping diagnostic or infectious substances | Completed within 2 years | Internal | Encrypted at rest; access by lab director | System-suggested; eligible → awaiting_review → authorized | Auto | Allowed |
| C03 | CL-018 | Location | BSL Documentation (#36) | Institutional biosafety committee approval; risk assessment | Sites handling BSL-2 or higher biological agents | BSL designation current; SOPs match designation | Internal | Encrypted at rest; access by biosafety officer | System-suggested; eligible → awaiting_review → authorized | Level 2 | Allowed |
| C03 | CL-019 | Location | Hazardous Materials Documentation (#26) | Chemical inventory; waste disposal contract; SDS binder | Sites storing or handling hazardous materials | Documentation current; training records up to date | Internal | Encrypted at rest; access by safety officer | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C03 | CL-046 | Technology System + Institution | 21 CFR Part 11 Compliance (#39) | System validation package; electronic signature certification | Sites using electronic records for regulated activities | Validation current; no outstanding deviations | Internal | Encrypted at rest; access by IT + QA | System-suggested; eligible → awaiting_review → authorized | Level 2 | Allowed |

---

## 4. Pharmacy

Evidence of pharmacy licensing, handling capability, and controlled substance management.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C04 | CL-020 | Institution + Location | Pharmacy License (#16) | State board of pharmacy registration | Sites with on-site pharmacy or IP dispensing | Expiry date ≤ current date; license class covers IP handling | Internal | Encrypted at rest; access by pharmacist + site admin | System-suggested; metadata-only allowed | Level 1 | Allowed |
| C04 | CL-021 | Institution | Controlled-Substance Registration (#17) | State controlled substance registration | Sites handling Schedule II-V controlled substances | Expiry date ≤ current date; schedule matches protocol | Restricted | Encrypted at rest; access-controlled; audit-logged | User-selectable; redaction required; recipient auth required; metadata-only allowed | Level 3 | Conditional |

---

## 5. Biospecimen

Evidence of biospecimen collection, processing, storage, and transfer capabilities.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C05 | CL-022 | Equipment + Location | Temperature Mapping Report (#30) | IQ/OQ thermal study; annual remapping | Sites storing specimens in controlled-temperature units | Mapping within 12 months; covers all storage locations | Internal | Encrypted at rest; access by lab manager | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C05 | CL-023 | Equipment + Location | Equipment Calibration Record (#27) | Manufacturer calibration certificate; NIST-traceable calibration | All lab equipment requiring calibration (pipettes, balances, thermometers) | Calibration within manufacturer-recommended interval | Internal | Encrypted at rest; access by lab manager + equipment coordinator | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C05 | CL-024 | Equipment + Location | Preventive Maintenance Record (#28) | Service contract; annual PM report | All critical lab equipment (centrifuges, freezers, biosafety cabinets) | PM within manufacturer-recommended interval | Internal | Encrypted at rest; access by lab manager | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C05 | CL-025 | Equipment + Location | Shipping Equipment Validation (#31) | Shipper qualification report; ambient profile study | Sites shipping specimens to central lab or biorepository | Validation within 24 months or per shipping season | Internal | Encrypted at rest; access by lab manager + shipping coordinator | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C05 | CL-026 | Location + Equipment | Environmental Monitoring Logs (#34) | Continuous monitoring system report; manual log sheets | Sites with controlled-temperature storage > 24 hours | Monitoring data current and complete; no unexplained gaps | Internal | Encrypted at rest; access by lab manager | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C05 | CL-027 | Location + Equipment | Alarm Response / Excursion Logs (#33) | Excursion investigation report; product disposition record | Sites with alarm-monitored storage | Logs current; all excursions investigated and closed | Restricted | Encrypted at rest; access by lab manager + QA | User-selectable; redaction required; recipient auth required; metadata-only allowed; external transfer prohibited | Level 2 | Prohibited |
| C05 | CL-028 | Institution + Counterparty + Study | Material Transfer Agreement (MTA) (#45) | Biological material transfer agreement; sample use agreement | Sites transferring biospecimens to external parties | Executed by all parties; within agreement term | Confidential | Encrypted at rest; access by legal + PI | User-selectable; redaction required; recipient auth required; metadata-only allowed; external transfer prohibited (agreement itself) | Level 3 | Conditional |

---

## 6. Equipment

Evidence of equipment qualification, calibration, and operational readiness.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C06 | CL-029 | Equipment + Location | Equipment Qualification (IQ/OQ/PQ) (#29) | Vendor qualification package; on-site qualification report | All GxP-critical equipment (freezers, centrifuges, imaging devices) | Qualification current per protocol requirements; requalification after move/repair | Internal | Encrypted at rest; access by equipment coordinator + QA | System-suggested; eligible → awaiting_review → authorized | Level 2 | Allowed |
| C06 | CL-030 | Location + Equipment | Backup Power Test Logs (#32) | Generator test report; UPS battery replacement log | Sites with critical equipment requiring uninterrupted power | Tested within 30 days; load test passed | Internal | Encrypted at rest; access by facilities + lab manager | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C06 | CL-031 | Location + Equipment | Radiation Safety Certificate (#35) | State radiation control registration; physicist survey report | Sites with imaging equipment emitting ionizing radiation | Certificate current; equipment registered with state | Internal | Encrypted at rest; access by radiation safety officer | System-suggested; eligible → awaiting_review → authorized | Level 2 | Allowed |

---

## 7. Quality System

Evidence of quality management system maturity, SOPs, and internal oversight.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C07 | CL-032 | Institution | Standard Operating Procedure (#21) | Protocol-specific work instruction; lab manual | All sites with regulated activities | SOP periodic review current (typically annual or biennial) | Confidential | Encrypted at rest; access by QA + department head | User-selectable; redaction required; recipient auth required; metadata-only allowed | Level 2 | Conditional |
| C07 | CL-033 | Institution or Location | CAPA Records (#22) | Deviation report; nonconformance log; root cause analysis | Sites with quality events requiring corrective action | CAPA initiated within 30 days of event; closed within timeline | Restricted | Encrypted at rest; access by QA + site director; audit-logged | User-selectable; redaction required; recipient auth required; metadata-only allowed; external transfer prohibited | Level 3 | Prohibited |
| C07 | CL-034 | Institution | Internal Audit Report (#23) | External audit report (sponsor/CRO); self-assessment checklist | Sites conducting internal quality audits | Audit conducted per QMS schedule; findings addressed | Restricted | Encrypted at rest; access by QA + site director; audit-logged | User-selectable; redaction required; recipient auth required; metadata-only allowed; external transfer prohibited | Level 3 | Prohibited |
| C07 | CL-035 | Institution | Staff Training Compliance Matrix (#44) | LMS training report; training completion spreadsheet | All sites | Training records current; no overdue mandatory training | Confidential | Encrypted at rest; staff names redacted before external sharing; access by training coordinator | System-suggested; redaction required | Level 1 | Allowed (redacted) |

---

## 8. Regulatory Startup

Evidence required for study activation, regulatory submissions, and investigator qualification.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C08 | CL-036 | Person + Institution + Study | FDA Form 1572 (#10) | Investigator statement (non-FDA); equivalent regulatory form | FDA-regulated drug/device studies | Signed by PI; matches Delegation Log; current protocol version | Confidential | Encrypted at rest; access by regulatory + PI; PII redacted before external sharing | System-suggested; redaction required; recipient auth required; external transfer prohibited (contains PII + commitments) | Level 2 | Conditional |
| C08 | CL-037 | Person + Study | Financial Disclosure (#11) | Annual financial disclosure update; no-change certification | All investigators listed on 1572 | Completed before study start; updated annually or upon change | Confidential | Encrypted at rest; access by regulatory + PI | System-suggested; redaction required; recipient auth required | Level 2 | Conditional |

---

## 9. Technology Systems

Evidence of electronic system validation, security, and compliance.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C09 | CL-038 | Technology System + Institution | EMR/EHR System Validation (#37) | System vendor validation package; site-specific validation addendum | Sites using EMR/EHR for source documentation | Validation current; system version documented | Internal | Encrypted at rest; access by IT + QA | System-suggested; eligible → awaiting_review → authorized | Level 2 | Allowed |
| C09 | CL-039 | Technology System + Institution | Data Security Certification (#38) | ISO 27001; SOC 2 Type II; HITRUST certification | All sites handling electronic protected health information | Certification current; scope covers site operations | Confidential | Encrypted at rest; access by IT security + legal | System-suggested; redaction required; recipient auth required | Level 2 | Conditional |
| C09 | CL-040 | Technology System + Institution | 21 CFR Part 11 Compliance (#39) | System audit trail validation; electronic signature certification | Sites using electronic records/signatures in FDA-regulated studies | Validation current; system change control documented | Internal | Encrypted at rest; access by IT + QA | System-suggested; eligible → awaiting_review → authorized | Level 2 | Allowed |

---

## 10. Operational Capabilities

Evidence of operational readiness, emergency preparedness, patient recruitment, and ancillary services.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C10 | CL-041 | Institution + Location | Emergency Response Plan (#24) | Code blue policy; emergency medical services agreement | All sites with on-site subject visits | Plan reviewed annually; drill records current | Internal | Encrypted at rest; access by safety officer + site director | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C10 | CL-042 | Institution | Business Continuity Plan (#25) | Disaster recovery plan; pandemic preparedness plan | All sites | Plan reviewed annually; contact information current | Internal | Encrypted at rest; access by site director + QA | System-suggested; eligible → awaiting_review → authorized | Level 1 | Allowed |
| C10 | CL-043 | Institution | Patient Recruitment Plan (#40) | Feasibility questionnaire response; recruitment strategy deck | Sites recruiting subjects | Plan matches protocol population; recruitment targets realistic | Internal | Encrypted at rest; access by CRC + PI | User-selectable; metadata-only allowed | Level 1 | Allowed |
| C10 | CL-044 | Institution | Diversity and Inclusion Plan (#41) | Community engagement strategy; demographic census data | Sites recruiting subjects | Plan current; aligns with protocol diversity requirements | Internal | Encrypted at rest; access by CRC + PI | User-selectable; metadata-only allowed | Level 1 | Allowed |
| C10 | CL-045 | Institution | Community Advisory Board Documentation (#42) | CAB meeting minutes; community engagement report | Sites with community advisory boards | CAB active; meetings within 6 months | Internal | Encrypted at rest; access by community engagement lead | User-selectable; metadata-only allowed | Level 1 | Allowed |
| C10 | CL-046 | Institution | Translator / Language Services (#43) | Interpreter service contract; bilingual staff roster; translated ICF library | Sites serving non-English-speaking populations | Services available and documented; qualifications verified | Internal | Encrypted at rest; access by CRC + regulatory | User-selectable; metadata-only allowed | Level 1 | Allowed |

---

## Prohibited Types

These types are catalogued for completeness but must never be ingested into KEMS.

| Capability ID | Claim ID | Entity Owner | Evidence Required | Alternative Evidence | Applicability | Validity Rule | Sensitivity | Handling | Package Behavior | Review Level | Transfer Rule |
|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | Medical Record (#47) | N/A — prohibited | N/A | N/A | PHI | Never ingest | system_suggested=false; user_selectable=false; external transfer prohibited | N/A | Prohibited |
| — | — | — | Unclassified Document (#48) | N/A — prohibited | N/A | N/A | Unknown | Quarantine; never ingest | system_suggested=false; user_selectable=false; external transfer prohibited | N/A | Prohibited |

---

## Cross-Reference: Capability → Document Type

| Capability Area | Capability ID | Document Types Covered |
|---|---|---|
| Institutional Identity | C01 | #15, #20, #46, #19, #18 |
| Clinical Experience | C02 | #1, #5, #6, #12, #7, #2, #4, #8, #9 |
| Lab Infrastructure | C03 | #13, #14, #3, #36, #26, #39 |
| Pharmacy | C04 | #16, #17 |
| Biospecimen | C05 | #30, #27, #28, #31, #34, #33, #45 |
| Equipment | C06 | #29, #32, #35 |
| Quality System | C07 | #21, #22, #23, #44 |
| Regulatory Startup | C08 | #10, #11 |
| Technology Systems | C09 | #37, #38, #39 |
| Operational Capabilities | C10 | #24, #25, #40, #41, #42, #43 |
| Prohibited | — | #47, #48 |

---

## Summary Statistics

| Metric | Count |
|---|---|
| Total Capability Areas | 10 |
| Total Claims | 46 |
| Evidence Types Mapped | 48 (46 active + 2 prohibited) |
| Review Level: Auto | 4 |
| Review Level: Level 1 | 22 |
| Review Level: Level 2 | 14 |
| Review Level: Level 3 | 6 |
| Transfer: Allowed | 28 |
| Transfer: Conditional | 12 |
| Transfer: Prohibited | 6 |
| Sensitivity: Internal | 28 |
| Sensitivity: Confidential | 14 |
| Sensitivity: Restricted | 4 |

---

*SITE_EVIDENCE_REQUIREMENTS_CATALOG.md — WO-KEMS-DOC-003 — 2026-07-30*
