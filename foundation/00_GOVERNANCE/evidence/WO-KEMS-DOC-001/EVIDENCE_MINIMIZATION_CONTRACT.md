# WO-KEMS-DOC-001 — Evidence Minimization and Selective Custody Contract

**Work Order ID:** WO-KEMS-DOC-001
**Status:** DESIGN_PROPOSAL — awaiting Human Gate approval
**Authority:** KPO (KADARN Program Office)
**Phase:** Design-only. No runtime, no database, no API modifications.
**Depends on:** KEMS-001, KEMS-002, document-handling.ts (KTP-1.5)
**Canonical base:** CANONICAL_MVP_SCOPE §A.4

---

## 1. INVENTORY OF EXISTING MODEL

### 1.1 What exists (canonical TypeScript — NOT materialized)

| Artifact | Location | Status |
|---|---|---|
| `DocumentHandlingMode` (6 values) | `packages/types/src/document-handling.ts` | ✅ Type only |
| `EvidenceBasis` (8 values) | same file | ✅ Type only |
| `DisclosureStatus` (6 values) | same file | ✅ Type only |
| `RedactionStatus` (5 values) | same file | ✅ Type only |
| `DOCUMENT_HANDLING_MATRIX` | same file | ✅ Type only |
| `DocumentIntakeDecision` | same file | ✅ Type only |
| `StoredDocumentRecord` | same file | ✅ Type only |
| `FeasibilityFolderMetadata` | same file | ✅ Type only |
| `isRetained()`, `isEvidenceEligible()`, `isSponsorFacing()` | same file | ✅ Helper functions |

### 1.2 What exists in database

| Artifact | Table | Status |
|---|---|---|
| Document metadata | `evidence_sources` (migration 094) | 🟡 Partial — no handling_mode column |
| Text chunks + embeddings | `document_chunks` (migration 094) | ✅ |
| Claims | `claims` (migration 094) | ✅ |
| Claim-evidence links | `claim_evidence_links` (migration 094) | ✅ |

### 1.3 What does NOT exist

| Gap | Severity |
|---|---|
| Intake decision entity (accept/reject/quarantine) | 🔴 |
| Sensitivity classification (PHI/PII detection) | 🔴 |
| Retention policy table | 🔴 |
| Destruction record table | 🔴 |
| Legal hold mechanism | 🔴 |
| Document taxonomy (what type → what treatment) | 🔴 |
| De-identification method tracking | 🟡 |
| HIPAA compliance documentation | 🔴 |
| `handling_mode` column on `evidence_sources` | 🔴 |
| Backend enforcement of any policy | 🔴 |

### 1.4 Existing risk

The current `POST /api/v1/documents/upload` pipeline (migration 094) processes any uploaded file through text extraction → chunking → OpenAI embeddings **without**:
- Intake decision
- Sensitivity check
- PHI/PII detection
- Retention policy assignment
- User consent capture

This means documents could be sent to external embedding services before any governance decision is made.

---

## 2. SEPARATED DIMENSIONS

### 2.1 Intake Disposition

Determines whether KADARN accepts the file for processing.

```
accepted                    → Proceed to classification
accepted_with_redaction     → Redact first, then process
accepted_ephemeral          → Process temporarily, auto-destroy
reference_required          → Do not ingest; store external reference only
rejected                    → Do not ingest; notify user
quarantined                 → Isolate; requires manual review
manual_review_required      → Hold; human reviewer must decide
```

**`rejected` belongs HERE, not in `DocumentHandlingMode`.**

### 2.2 Document Handling Mode (canonical — preserved)

Determines what KADARN does after accepting the document.

```
stored_evidence         → Retain original + derivatives
reviewed_not_stored     → Validate, extract facts, destroy original
reference_only          → Store external reference, no file copy
private_restricted      → Retain but never sponsor-facing
feasibility_folder      → Retain; eligible for sponsor packages (with authorization)
ephemeral_processing    → Temporary processing; facts extracted; file discarded
```

### 2.3 Sensitivity Classification

Determined BEFORE processing. `unknown` triggers quarantine.

```
public              → No restrictions
internal            → Institution-internal only
confidential        → Requires access controls
restricted          → Legal or contractual restrictions
pii_detected        → Contains personal identifiable information
phi_detected        → Contains protected health information
regulated_record    → Subject to FDA/EMA/other retention rules
prohibited          → On the prohibited list; auto-reject
unknown             → Unclassified; quarantine until reviewed
```

### 2.4 Retention Policy

```
retention_basis:    regulatory | contractual | institutional | kadarn_default
retention_days:     integer (null = permanent while valid)
retention_trigger:  upload_date | document_date | expiration_date | validation_date
destruction_trigger: expiry | manual | policy_change | legal_hold_release
minimum_retention_until: date | null
maximum_retention_until: date | null
policy_version:     string (e.g., "v1.0.0")
```

Retention duration is resolved via policy lookup, not hardcoded.

### 2.5 De-identification Method

Separate from redaction status. Tracks HOW de-identification was performed.

```
not_required              → Document contains no identifiers
manual_redaction          → Human reviewed and removed identifiers
safe_harbor               → 18 HIPAA identifiers removed per §164.514(b)
expert_determination      → Qualified expert certified minimal re-identification risk
institution_attestation   → Institution certifies document is de-identified
unknown                   → Not assessed; must not be treated as de-identified
```

### 2.6 Legal Hold

Must block ALL of:
- Scheduled destruction
- Manual destruction
- Original replacement
- Version purging
- Derivative deletion (chunks, embeddings, previews, caches)

### 2.7 Destruction Record

Immutable, separate from the destroyed document.

```
document_id
content_hash
policy_version
scheduled_at
destroyed_at
destruction_method        → logical_delete | cryptographic_erase | overwrite | physical
destruction_scope         → original_only | original_and_derivatives | full_cascade
performed_by
verified_by
result                    → success | partial_failure | blocked_by_legal_hold
failure_reason
legal_hold_checked        → boolean
legal_hold_active_at_time → boolean
derived_assets_disposition → destroyed | retained_with_justification | error
```

---

## 3. DOCUMENT TAXONOMY

### 3.1 Classification by document type

| Document Type | Default Sensitivity | Default Intake | Default Handling | Retention Basis |
|---|---|---|---|---|
| Institutional license | internal | accepted | stored_evidence | validity + policy |
| CLIA/CAP certificate | internal | accepted | stored_evidence | validity + policy |
| Lab certification | internal | accepted | stored_evidence | validity + policy |
| Professional license (PI) | pii_detected | accepted_with_redaction | reviewed_not_stored | validity |
| Professional license (staff) | pii_detected | accepted_with_redaction | reviewed_not_stored | validity |
| GCP/IATA/ACLS/BLS cert | internal | accepted | stored_evidence | validity |
| Insurance policy | confidential | accepted | private_restricted | contractual |
| Equipment calibration | internal | accepted | stored_evidence | validity |
| Equipment photo/floorplan | internal | accepted | stored_evidence | validity |
| SOP (demonstrating capability) | confidential | manual_review_required | private_restricted | contractual |
| CV (PI) — extensive | pii_detected | accepted_ephemeral | ephemeral_processing | 30 days |
| CV (staff) — extensive | pii_detected | accepted_ephemeral | ephemeral_processing | 30 days |
| Staff roster | pii_detected | accepted_ephemeral | ephemeral_processing | 7 days |
| Internal inventory | internal | accepted_ephemeral | ephemeral_processing | 30 days |
| Maintenance records | internal | accepted_ephemeral | ephemeral_processing | 90 days |
| Financial document | confidential | rejected | — | — |
| Contract (confidential) | confidential | manual_review_required | private_restricted | contractual |
| Operational report | internal | accepted_ephemeral | ephemeral_processing | 90 days |
| Training records | pii_detected | accepted_ephemeral | ephemeral_processing | 30 days |
| Public registry entry | public | reference_required | reference_only | validity |
| FDA/EMA audit report | regulated_record | accepted | stored_evidence | regulatory |
| Ethics committee approval | internal | accepted | stored_evidence | validity |
| Clinical trial agreement | confidential | manual_review_required | private_restricted | contractual |

---

## 4. PROHIBITED DOCUMENTS

KADARN must **reject at intake** — never ingest, even temporarily:

| Document Type | Justification |
|---|---|
| Medical records (complete) | PHI; not minimum necessary (HIPAA) |
| Clinical notes | PHI; source data belongs in EHR |
| Lab results with patient IDs | PHI; re-identifiable |
| Informed consent forms | PHI; contains patient identifiers |
| Subject identification logs | PHI; explicitly prohibited |
| Screening logs with identifiers | PHI; re-identifiable |
| Patient lists | PHI; not necessary for capability demonstration |
| Bank credentials | PII; financial data |
| Social Security Numbers | PII; no legitimate use case |
| Personal ID documents (passport, DL) | PII; unless specifically required and redacted |
| Complete eReg / eTMF | Regulated; belongs in sponsor system |
| Genomic data with identifiers | PHI; genetic information |
| Biometric data | PHI; biometric identifiers |
| Unclassified documents | Unknown sensitivity; must quarantine, not ingest |

---

## 5. DECISION MATRIX (Intake × Handling × Sensitivity × Retention)

| Doc Type | Sensitivity | Intake | Handling | Original | Derivatives | Retention |
|---|---|---|---|---|---|---|
| CLIA Certificate | internal | accepted | stored_evidence | Retain | Retain | Validity + 7yr |
| PI License | pii_detected | accepted_with_redaction | reviewed_not_stored | Destroy | Facts only | Validity + 3yr |
| Staff CV | pii_detected | accepted_ephemeral | ephemeral_processing | Destroy | Facts only | 30 days |
| SOP (sensitive) | confidential | manual_review | private_restricted | Optional | Metadata only | Contractual |
| Public registry | public | reference_required | reference_only | Never copy | Reference | While valid |
| Medical record | phi_detected | rejected | — | Never store | None | N/A |
| Unclassified | unknown | quarantined | — | Isolated temp | None | 24 hours |
| Financial doc | confidential | rejected | — | Never store | None | N/A |
| Equipment calibration | internal | accepted | stored_evidence | Retain | Retain | Validity + 5yr |
| FDA audit report | regulated_record | accepted | stored_evidence | Retain | Retain | Regulatory |
| Contract (confidential) | confidential | manual_review | private_restricted | Optional | Metadata only | Contractual |

---

## 6. PHI/PII CONTROL FLOW

```
1. User selects file for upload
2. PRE-UPLOAD check:
   a. Document type classification (user-declared or auto-detected)
   b. If type is on PROHIBITED list → REJECT with explanation
   c. If type is unknown → QUARANTINE
3. SENSITIVITY SCAN (before any processing):
   a. Pattern detection (SSN, DOB, MRN, email, phone, name patterns)
   b. If phi_detected AND intake ≠ accepted_with_redaction → QUARANTINE
   c. If pii_detected AND handling ≠ ephemeral → prompt for redaction
4. INTAKE DECISION:
   a. Auto-decide for low-risk types (certificates, public docs)
   b. Manual review required for: confidential, regulated_record, unknown
   c. rejected → file deleted; record created with rejection reason
5. REDACTION (if accepted_with_redaction):
   a. User prompted to upload redacted version OR
   b. KADARN performs automated redaction with human confirmation
   c. De-identification method recorded
6. PROCESSING (only after intake = accepted* and sensitivity cleared):
   a. Text extraction
   b. Chunking
   c. Embedding (ONLY if sensitivity ≤ internal AND BAA/legal basis exists)
7. RETENTION ASSIGNMENT:
   a. Policy lookup by document type → retention_days + trigger
   b. Destruction scheduled
8. LEGAL HOLD CHECK (before any destruction):
   a. Check active holds on institution, claim, or document
   b. If hold active → suspend destruction; log
```

---

## 7. LEGAL HOLD SEMANTICS

### 7.1 What a legal hold blocks

| Operation | Blocked? |
|---|---|
| Scheduled destruction | ✅ Yes |
| Manual destruction | ✅ Yes |
| Original file replacement | ✅ Yes |
| Version purging | ✅ Yes |
| Derivative deletion (chunks) | ✅ Yes |
| Derivative deletion (embeddings) | ✅ Yes |
| Derivative deletion (previews) | ✅ Yes |
| Derivative deletion (caches) | ✅ Yes |
| Metadata updates | ❌ No |
| Access logging | ❌ No |
| Read operations | ❌ No |

### 7.2 Hold activation

```
- Scope: institution | claim | document | batch
- Activated by: human reviewer | system (regulatory trigger)
- Requires: reason, scope, authorized_by, effective_date
- Notifies: retention scheduler, destruction cron
```

### 7.3 Hold release

```
- Requires: authorized_by, release_reason, release_date
- Cascades: re-evaluates pending destructions
- Does NOT auto-destroy: re-schedules based on current policy
```

---

## 8. DESTRUCTION SEMANTICS

### 8.1 Complete destruction scope

Destruction of `evidence_sources` record must cascade to:
- Original file (Supabase Storage)
- All `document_chunks` rows
- All embeddings (pgvector)
- Temporary processing files
- Preview/thumbnail images
- Cached extraction results
- Backup copies (per retention policy)

Destroying only the PDF record while chunks and embeddings persist is NOT complete destruction.

### 8.2 Destruction methods

| Method | Description | Verification |
|---|---|---|
| `logical_delete` | DB row soft-deleted; storage file removed | Hash comparison before/after |
| `cryptographic_erase` | Encryption key destroyed; data unrecoverable | Key destruction attestation |
| `overwrite` | Storage blocks overwritten N times | Write verification |
| `physical` | Physical media destroyed | Certificate of destruction |

### 8.3 Destruction verification

```
1. Pre-destruction snapshot: file paths, chunk count, embedding count, sizes
2. Execute destruction (original + cascade)
3. Post-destruction verification:
   a. File no longer exists at storage path
   b. Chunk count = 0 for this source_id
   c. Embedding search for source content returns no results
   d. No temporary files remain
4. Record DestructionRecord with result + verifier
```

---

## 9. PROPOSED ENTITIES (design, not SQL)

### New entities to add to document-handling.ts

```
DocumentIntakeDisposition   → 7 values (accepted → manual_review_required)
DocumentSensitivityClass    → 9 values (public → unknown)
RetentionPolicy             → policy_id, basis, days, trigger, version
RetentionAssignment         → document_id, policy_id, scheduled_destruction
LegalHold                   → id, scope, reason, activated_by, dates
DestructionRecord           → full record per §8
DeidentificationMethod      → 5 methods + unknown
DocumentTaxonomyRule        → doc_type → sensitivity + intake + handling + retention
```

### Columns to add to evidence_sources migration

```
intake_disposition      → DocumentIntakeDisposition
handling_mode           → DocumentHandlingMode (from existing canonical type)
sensitivity_class       → DocumentSensitivityClass
retention_policy_id     → FK to retention_policies
scheduled_destruction_at → timestamp
redaction_status        → RedactionStatus (existing)
deidentification_method → DeidentificationMethod
deidentification_reviewer → string
phi_checked             → boolean
phi_detected            → boolean
intake_decision_by      → string
intake_decision_at      → timestamp
policy_version          → string
```

---

## 10. API ENDPOINT DESIGN (no implementation)

| Endpoint | Method | Purpose |
|---|---|---|
| `/documents/intake` | POST | Submit file for intake decision (pre-processing) |
| `/documents/:id/classify` | POST | Assign sensitivity + handling mode |
| `/documents/:id/review` | POST | Human reviewer decision (accept/reject/quarantine) |
| `/documents/:id/redact` | POST | Submit redacted version or trigger redaction |
| `/documents/:id/approve-processing` | POST | Gate: allow extraction + embedding |
| `/documents/:id/schedule-destruction` | POST | Assign retention policy + schedule |
| `/documents/:id/destroy` | POST | Execute verified destruction |
| `/documents/:id/legal-holds` | POST | Place legal hold |
| `/documents/:id/legal-holds/:holdId` | DELETE | Release legal hold |

`/classify` may recommend but must not auto-approve for confidential, regulated, or unknown documents.

---

## 11. ACCEPTANCE CRITERIA FOR TECHNICAL PHASE

Before any migration, API, or UI work proceeds, the following must be true:

1. ✅ Intake Disposition separated from Document Handling Mode
2. ✅ Document taxonomy defined with ≥ 20 document types
3. ✅ Decision matrix maps type → intake → handling → sensitivity → retention
4. ✅ Prohibited documents list is explicit and justified
5. ✅ PHI/PII detection flow designed (pre-processing gate)
6. ✅ Legal hold design covers all destructive operations
7. ✅ Destruction design includes full cascade + verification
8. ✅ Retention policy is versioned and lookup-based, not hardcoded
9. ✅ De-identification methods separated from redaction status
10. ✅ All entity definitions are in TypeScript (document-handling.ts extensions)
11. ✅ Migration design is coherent (single grouped migration, not fragmented)
12. ✅ API endpoints are designed but not implemented
13. ✅ Backend enforcement design precedes UI design
14. ✅ Human Gate approval obtained before any code changes

---

*WO-KEMS-DOC-001 — Design Phase — 2026-07-30*
*Next: Human Gate review → ACCEPTED → WO-KEMS-DOC-002 (Type extension + migration design)*
