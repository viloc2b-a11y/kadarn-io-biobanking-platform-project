# DOCUMENT PACKAGE BEHAVIOR MATRIX

**Work Order:** WO-KEMS-DOC-003
**Deliverable:** 5 of 5
**Reference:** DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md (Deliverable 2)
**Classification:** 48 document types with package assembly behavior rules
**Revision:** Human Gate feedback A6-A8 — fixed lifecycle contradictions; canonical lifecycle endpoints; entity relationship terminology

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

## Entity Relationship Model

Package behavior is governed by entity relationships, not generic "ownership." The following entity roles determine document lifecycle and transfer eligibility:

| Role | Definition |
|---|---|
| **legal_owner** | Entity holding legal title to the evidence (e.g., Institution for SOPs, Person for CVs) |
| **record_subject** | Entity the document is about or describes (e.g., Principal Investigator for FDA 1572) |
| **custodian** | Entity responsible for storing and managing the evidence (e.g., Institution as custodian of PI credentials) |
| **issuing_authority** | Entity that issued, required, or mandated the document (e.g., FDA regulatory framework for FDA 1572) |

**Rule ER.1:** `external_transfer_prohibited = true` if `legal_owner` or `custodian` policy prohibits off-site dissemination.
**Rule ER.2:** `recipient_auth_required = true` when the `record_subject`, `custodian`, or `issuing_authority` requires per-recipient sign-off.
**Rule ER.3:** Package assembly must resolve all entity roles before lifecycle state transitions.

---

## Lifecycle Endpoints

Every document type resolves to exactly one canonical lifecycle endpoint:

| Endpoint | Meaning |
|---|---|
| **AUTHORIZED_FOR_INTERNAL_REVIEW** | Document can be reviewed and validated internally; external transfer is prohibited |
| **AUTHORIZED_FOR_RECIPIENT_TRANSFER** | Document is eligible for full external transfer after recipient-specific authorization |
| **METADATA_ONLY_AUTHORIZED** | Only metadata (type, entity, dates, status) is authorized for transfer; file content is excluded |
| **TRANSFER_PROHIBITED** | Document cannot be included in any package — internal or external |

**Rule LE.1:** `external_transfer_prohibited = true` → endpoint MUST be `AUTHORIZED_FOR_INTERNAL_REVIEW` or `TRANSFER_PROHIBITED` — never `AUTHORIZED_FOR_RECIPIENT_TRANSFER`.
**Rule LE.2:** `primary_class = PROHIBITED_CONTENT` → endpoint MUST be `TRANSFER_PROHIBITED`.
**Rule LE.3:** Quarantined documents (`QUARANTINE_PENDING_CLASSIFICATION`) → `TRANSFER_PROHIBITED` until human classification resolves the destination.

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
| **Lifecycle Endpoint** | Canonical Endpoint | Final authorized state for the document type |

---

## Document Package Behavior Matrix (48 Types)

| # | Document Type | System Suggest | User Select | Redaction Required | Recipient Auth Required | Metadata-Only Sharing | External Transfer Prohibited | Lifecycle Endpoint |
|---|---|---|---|---|---|---|---|---|
| 1 | Curriculum Vitae | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 2 | GCP Training Certificate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 3 | IATA Training Certificate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 4 | Human Subjects Protection | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 5 | Medical License | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 6 | Board Certification | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 7 | ACLS/BLS Certification | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 8 | Study-Specific Training | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 9 | Delegation of Authority Log | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 10 | FDA Form 1572 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | **TRANSFER_PROHIBITED** (Study Workspace only — not recipient-authorized) |
| 11 | Financial Disclosure | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 12 | State/Regional License | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 13 | CLIA Certificate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 14 | CAP Accreditation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 15 | Institutional License | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 16 | Pharmacy License | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 17 | Controlled-Substance Registration | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 18 | IRB Reliance Information | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 19 | Facility Certification | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 20 | Insurance Certificate | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 21 | Standard Operating Procedure | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 22 | CAPA Records | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | AUTHORIZED_FOR_INTERNAL_REVIEW |
| 23 | Internal Audit Report | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | AUTHORIZED_FOR_INTERNAL_REVIEW |
| 24 | Emergency Response Plan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 25 | Business Continuity Plan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 26 | Hazardous Materials Documentation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 27 | Equipment Calibration Record | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 28 | Preventive Maintenance Record | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 29 | Equipment Qualification (IQ/OQ/PQ) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 30 | Temperature Mapping Report | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 31 | Shipping Equipment Validation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 32 | Backup Power Test Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 33 | Alarm Response / Excursion Logs | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | AUTHORIZED_FOR_INTERNAL_REVIEW |
| 34 | Environmental Monitoring Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 35 | Radiation Safety Certificate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 36 | BSL Documentation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 37 | EMR/EHR System Validation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 38 | Data Security Certification | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 39 | 21 CFR Part 11 Compliance | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 40 | Patient Recruitment Plan | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | METADATA_ONLY_AUTHORIZED |
| 41 | Diversity and Inclusion Plan | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | METADATA_ONLY_AUTHORIZED |
| 42 | Community Advisory Board Documentation | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | METADATA_ONLY_AUTHORIZED |
| 43 | Translator / Language Services | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | METADATA_ONLY_AUTHORIZED |
| 44 | Staff Training Compliance Matrix | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 45 | Material Transfer Agreement (MTA) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | AUTHORIZED_FOR_INTERNAL_REVIEW |
| 46 | Indemnification / Liability Coverage | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | AUTHORIZED_FOR_RECIPIENT_TRANSFER |
| 47 | Medical Record | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | **TRANSFER_PROHIBITED** (PROHIBITED_CONTENT — rejected at API boundary) |
| 48 | Unclassified Document | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | **TRANSFER_PROHIBITED** (QUARANTINE_PENDING_CLASSIFICATION — pending human review) |

---

## Behavior Summary by Primary Class

| Class | System Suggest | User Select | Redaction | Recipient Auth | Metadata-Only | External Transfer Prohibited | Lifecycle Endpoint |
|---|---|---|---|---|---|---|---|
| PERSON_REUSABLE (9) | All 9 ✅ | All 9 ✅ | 3 require | 0 require | 3 allow | 0 prohibit | AUTHORIZED_FOR_RECIPIENT_TRANSFER (9) |
| SITE_REUSABLE (11) | 6 ✅, 5 ❌ | All 11 ✅ | 5 require | 5 require | 7 allow | 0 prohibit | AUTHORIZED_FOR_RECIPIENT_TRANSFER (11) |
| LOCATION_REUSABLE (6) | All 6 ✅ | All 6 ✅ | 0 require | 0 require | 0 allow | 0 prohibit | AUTHORIZED_FOR_RECIPIENT_TRANSFER (6) |
| EQUIPMENT_REUSABLE (5) | All 5 ✅ | All 5 ✅ | 0 require | 0 require | 0 allow | 0 prohibit | AUTHORIZED_FOR_RECIPIENT_TRANSFER (5) |
| TECHNOLOGY_SYSTEM_REUSABLE (3) | All 3 ✅ | All 3 ✅ | 1 requires | 1 requires | 0 allow | 0 prohibit | AUTHORIZED_FOR_RECIPIENT_TRANSFER (3) |
| STUDY_SPECIFIC (5) | 4 ✅, 1 ❌ (MTA) | All 5 ✅ | 3 require | 3 require | 1 allows (MTA) | 2 prohibit (1572, MTA) | AUTHORIZED_FOR_RECIPIENT_TRANSFER (3), TRANSFER_PROHIBITED (1: 1572), AUTHORIZED_FOR_INTERNAL_REVIEW (1: MTA) |
| STRUCTURED_DATA (5) | 1 ✅, 4 ❌ | All 5 ✅ | 1 requires (Training Matrix) | 0 require | 5 allow | 0 prohibit | AUTHORIZED_FOR_RECIPIENT_TRANSFER (1: Training Matrix), METADATA_ONLY_AUTHORIZED (4) |
| RESTRICTED_EVIDENCE (3) | 0 ✅, 3 ❌ | All 3 ✅ | 3 require | 3 require | 3 allow | 3 prohibit | AUTHORIZED_FOR_INTERNAL_REVIEW (3) |
| PROHIBITED_CONTENT (1) | 0 ✅, 1 ❌ | 0 ✅, 1 ❌ | N/A | N/A | N/A | 1 prohibit | TRANSFER_PROHIBITED (1) |
| QUARANTINE (1) | 0 ✅, 1 ❌ | 0 ✅, 1 ❌ | N/A | N/A | N/A | 1 prohibit | TRANSFER_PROHIBITED (1) |

> **Contradiction Resolution (A6):** FDA Form 1572 (row 10) and Material Transfer Agreement (row 45) previously had `external_transfer_prohibited = true` yet their lifecycle ended in `authorized` (implying external transfer eligibility). This violated Rule LE.1. FDA 1572 is now `TRANSFER_PROHIBITED` — it resides in the Study Workspace only and is never recipient-authorized. MTA is `AUTHORIZED_FOR_INTERNAL_REVIEW` — internal use permitted; external transfer prohibited. All other documents with `external_transfer_prohibited = true` were verified consistent (CAPA, Internal Audit, Alarm/Excursion → AUTHORIZED_FOR_INTERNAL_REVIEW; Medical Record, Unclassified → TRANSFER_PROHIBITED).

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

### Rule: Prohibited Content Types

```
WHEN document.primary_class = PROHIBITED_CONTENT
THEN REJECT ingestion at API boundary
  system_suggested = false
  user_selectable = false
  lifecycle_endpoint = TRANSFER_PROHIBITED
  No further behavior rules apply
```

### Rule: Quarantine Pending Classification

```
WHEN document.implementation_destination = QUARANTINE_PENDING_CLASSIFICATION
THEN ingestion is permitted (for human review)
  system_suggested = false
  user_selectable = false
  package_eligible = false
  external_transfer_prohibited = true
  lifecycle_endpoint = TRANSFER_PROHIBITED
  REQUIRE human classification before any state transition
```

---

## Behavior Decision Flow

```
Document enters package context
  │
  ├─ Is primary_class = PROHIBITED_CONTENT?
  │   └─ YES → REJECT. End. (lifecycle: TRANSFER_PROHIBITED)
  │
  ├─ Is implementation_destination = QUARANTINE_PENDING_CLASSIFICATION?
  │   └─ YES → REJECT. Require human classification. End. (lifecycle: TRANSFER_PROHIBITED)
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

*DOCUMENT_PACKAGE_BEHAVIOR_MATRIX.md — WO-KEMS-DOC-003 — Revised 2026-07-30 per Human Gate A6-A8*
