# DOCUMENT PACKAGE BEHAVIOR MATRIX

**Work Order:** WO-KEMS-DOC-003
**Deliverable:** 5 of 5
**Reference:** DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md (Deliverable 2)
**Classification:** 48 document types with package assembly behavior rules

---

## Design Principle: D17 — Eligible ≠ Selected ≠ Authorized

The KADARN Evidence Package System (KEPS) enforces a three-phase lifecycle for every document type:

| Phase | State | Meaning |
|---|---|---|
| **Eligible** | `eligible` | Document type is applicable to the package context. KADARN may suggest it. |
| **Selected** | `awaiting_review` | User or system has flagged the document for inclusion. Pending authorization. |
| **Authorized** | `authorized` | Recipient-specific authorization granted. Document is included in the package. |

**Rule D17.1:** `system_suggested` always enters the `awaiting_review` state — never auto-authorized.
**Rule D17.2:** A document must pass through `awaiting_review` before reaching `authorized`.
**Rule D17.3:** Authorization is recipient-specific. Authorization for Sponsor A does not authorize for Sponsor B.

---

## Behavior Columns

| Column | Type | Description |
|---|---|---|
| **System Suggest** | Boolean | Can KADARN automatically suggest this document type for a package? |
| **User Select** | Boolean | Can a human user manually select this type for a package? |
| **Redaction Required** | Boolean | Must PII/PHI/confidential content be redacted before external transfer? |
| **Recipient Auth Required** | Boolean | Must recipient-specific authorization be obtained before sharing? |
| **Metadata-Only Sharing** | Boolean | Can the document be shared as metadata-only (no file content) in a package? |
| **External Transfer Prohibited** | Boolean | Is external transfer (outside the site's KADARN tenant) prohibited? |
| **Default Lifecycle** | State Path | Default lifecycle path through KEPS |

---

## Document Package Behavior Matrix (48 Types)

| # | Document Type | System Suggest | User Select | Redaction Required | Recipient Auth Required | Metadata-Only Sharing | External Transfer Prohibited | Default Lifecycle |
|---|---|---|---|---|---|---|---|---|
| 1 | Curriculum Vitae | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 2 | GCP Training Certificate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 3 | IATA Training Certificate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 4 | Human Subjects Protection | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 5 | Medical License | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 6 | Board Certification | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 7 | ACLS/BLS Certification | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 8 | Study-Specific Training | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 9 | Delegation of Authority Log | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 10 | FDA Form 1572 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | eligible → awaiting_review → authorized |
| 11 | Financial Disclosure | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 12 | State/Regional License | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 13 | CLIA Certificate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 14 | CAP Accreditation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 15 | Institutional License | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 16 | Pharmacy License | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 17 | Controlled-Substance Registration | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 18 | IRB Reliance Information | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 19 | Facility Certification | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 20 | Insurance Certificate | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 21 | Standard Operating Procedure | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 22 | CAPA Records | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | eligible → awaiting_review (internal only) |
| 23 | Internal Audit Report | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | eligible → awaiting_review (internal only) |
| 24 | Emergency Response Plan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 25 | Business Continuity Plan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 26 | Hazardous Materials Documentation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 27 | Equipment Calibration Record | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 28 | Preventive Maintenance Record | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 29 | Equipment Qualification (IQ/OQ/PQ) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 30 | Temperature Mapping Report | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 31 | Shipping Equipment Validation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 32 | Backup Power Test Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 33 | Alarm Response / Excursion Logs | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | eligible → awaiting_review (internal only) |
| 34 | Environmental Monitoring Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 35 | Radiation Safety Certificate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 36 | BSL Documentation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 37 | EMR/EHR System Validation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 38 | Data Security Certification | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 39 | 21 CFR Part 11 Compliance | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 40 | Patient Recruitment Plan | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 41 | Diversity and Inclusion Plan | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 42 | Community Advisory Board Documentation | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 43 | Translator / Language Services | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 44 | Staff Training Compliance Matrix | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | eligible → awaiting_review → authorized |
| 45 | Material Transfer Agreement (MTA) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | eligible → awaiting_review → authorized |
| 46 | Indemnification / Liability Coverage | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | eligible → awaiting_review → authorized |
| 47 | Medical Record | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | N/A — prohibited |
| 48 | Unclassified Document | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | N/A — prohibited |

---

## Behavior Summary by Primary Class

| Class | System Suggest | User Select | Redaction | Recipient Auth | Metadata-Only | External Transfer Prohibited |
|---|---|---|---|---|---|---|
| PERSON_REUSABLE (9) | All 9 ✅ | All 9 ✅ | 3 require | 0 require | 3 allow | 0 prohibit |
| SITE_REUSABLE (11) | 6 ✅, 5 ❌ | All 11 ✅ | 5 require | 5 require | 7 allow | 0 prohibit |
| LOCATION_REUSABLE (6) | All 6 ✅ | All 6 ✅ | 0 require | 0 require | 0 allow | 0 prohibit |
| EQUIPMENT_REUSABLE (5) | All 5 ✅ | All 5 ✅ | 0 require | 0 require | 0 allow | 0 prohibit |
| TECHNOLOGY_SYSTEM_REUSABLE (3) | All 3 ✅ | All 3 ✅ | 1 requires | 1 requires | 0 allow | 0 prohibit |
| STUDY_SPECIFIC (5) | 4 ✅, 1 ❌ (MTA) | All 5 ✅ | 3 require | 3 require | 1 allows (MTA) | 2 prohibit (1572, MTA) |
| STRUCTURED_DATA (5) | 1 ✅, 4 ❌ | All 5 ✅ | 1 requires (Training Matrix) | 0 require | 5 allow | 0 prohibit |
| RESTRICTED_EVIDENCE (3) | 0 ✅, 3 ❌ | All 3 ✅ | 3 require | 3 require | 3 allow | 3 prohibit |
| PROHIBITED (2) | 0 ✅, 2 ❌ | 0 ✅, 2 ❌ | N/A | N/A | N/A | 2 prohibit |

---

## D17 Enforcement Rules

### Rule: System Suggest → Awaiting Review

```
WHEN system_suggested = true
  AND document enters package assembly pipeline
THEN document.state = awaiting_review
  NEVER auto-transition to authorized
```

### Rule: Authorization is Recipient-Scoped

```
WHEN recipient_auth_required = true
  AND document.state = awaiting_review
THEN authorization = {
  recipient_id: required,
  authorized_by: required,
  authorized_at: timestamp,
  scope: single_recipient
}
  Authorization for recipient X ≠ Authorization for recipient Y
```

### Rule: Metadata-Only Sharing

```
WHEN metadata_only_allowed = true
  AND document.shared_as = metadata_only
THEN file_content is excluded from package
  metadata fields (type, entity, dates, status) are included
```

### Rule: External Transfer Prohibition

```
WHEN external_transfer_prohibited = true
  AND package.recipient.domain != site.internal_domain
THEN REJECT package assembly
  ERROR: external transfer prohibited for {document_type}
```

### Rule: Prohibited Types

```
WHEN document.primary_class = PROHIBITED
THEN REJECT ingestion at API boundary
  system_suggested = false
  user_selectable = false
  No further behavior rules apply
```

---

## Behavior Decision Flow

```
Document enters package context
  │
  ├─ Is primary_class = PROHIBITED?
  │   └─ YES → REJECT. End.
  │
  ├─ Is system_suggested = true?
  │   └─ YES → auto-add as 'awaiting_review'
  │
  ├─ Is user_selectable = true AND user selects it?
  │   └─ YES → add as 'awaiting_review'
  │
  ├─ Is recipient_auth_required = true?
  │   ├─ YES → prompt for recipient-specific authorization
  │   └─ NO  → proceed to content assembly
  │
  ├─ Is redaction_required = true?
  │   ├─ YES → apply redaction before file content inclusion
  │   └─ NO  → include file content as-is
  │
  ├─ Is metadata_only_allowed = true AND package.mode = metadata_only?
  │   ├─ YES → include metadata only; exclude file content
  │   └─ NO  → include full content
  │
  └─ Is external_transfer_prohibited = true?
      ├─ YES AND recipient is external → REJECT. End.
      └─ NO → authorize and include in package
```

---

*DOCUMENT_PACKAGE_BEHAVIOR_MATRIX.md — WO-KEMS-DOC-003 — 2026-07-30*
