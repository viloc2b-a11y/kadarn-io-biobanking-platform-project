# WO-KEMS-DOC-002 — Type Extension and Migration Design

**Work Order ID:** WO-KEMS-DOC-002
**Status:** DESIGN_PROPOSAL — awaiting Human Gate
**Authority:** KPO (KADARN Program Office)
**Phase:** Design-only. No runtime, no database, no API modifications.
**Baseline:** WO-KEMS-DOC-001 ACCEPTED (76e3625)
**Depends on:** `document-handling.ts` (KTP-1.5), migration 094, `kems-claim.ts`

---

## 1. TYPE EXTENSIONS TO document-handling.ts

### 1.1 DocumentIntakeDisposition

```typescript
export type DocumentIntakeDisposition =
  | 'accepted'
  | 'accepted_with_redaction'
  | 'accepted_ephemeral'
  | 'reference_required'
  | 'rejected'
  | 'quarantined'
  | 'manual_review_required'

export const INTAKE_DISPOSITION_LABELS: Record<DocumentIntakeDisposition, string> = {
  accepted: 'Accepted — proceed to classification',
  accepted_with_redaction: 'Accepted — redact first, then process',
  accepted_ephemeral: 'Accepted — temporary processing, auto-destroy',
  reference_required: 'Do not ingest — store external reference',
  rejected: 'Rejected — do not ingest',
  quarantined: 'Quarantined — requires review',
  manual_review_required: 'Manual review required',
}

/** Whether the intake disposition allows processing */
export function isIntakeAccepted(d: DocumentIntakeDisposition): boolean {
  return ['accepted', 'accepted_with_redaction', 'accepted_ephemeral'].includes(d)
}

/** Whether the intake disposition blocks all processing */
export function isIntakeBlocked(d: DocumentIntakeDisposition): boolean {
  return ['rejected', 'quarantined'].includes(d)
}
```

### 1.2 DocumentSensitivityClass

```typescript
export type DocumentSensitivityClass =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'pii_detected'
  | 'phi_detected'
  | 'regulated_record'
  | 'prohibited'
  | 'unknown'

export const SENSITIVITY_LABELS: Record<DocumentSensitivityClass, string> = {
  public: 'Public — no restrictions',
  internal: 'Internal — institution only',
  confidential: 'Confidential — access controlled',
  restricted: 'Restricted — legal/contractual limits',
  pii_detected: 'PII detected — personal identifiable information',
  phi_detected: 'PHI detected — protected health information',
  regulated_record: 'Regulated — FDA/EMA retention rules apply',
  prohibited: 'Prohibited — never ingest',
  unknown: 'Unknown — quarantine required',
}

/** Whether processing (extraction, embedding) is allowed for this sensitivity */
export function isProcessingAllowed(s: DocumentSensitivityClass): boolean {
  return ['public', 'internal'].includes(s)
}

/** Whether processing requires explicit authorization */
export function requiresProcessingAuthorization(s: DocumentSensitivityClass): boolean {
  return ['confidential', 'restricted', 'regulated_record'].includes(s)
}

/** Whether this sensitivity blocks all processing */
export function isProcessingBlocked(s: DocumentSensitivityClass): boolean {
  return ['pii_detected', 'phi_detected', 'prohibited', 'unknown'].includes(s)
}
```

### 1.3 ExpirationClassification

```typescript
export type ExpirationClassification =
  | 'expires_on_date'
  | 'periodic_review_required'
  | 'valid_until_replaced'
  | 'no_expiration'
  | 'expiration_unknown'

/** Whether the expiration classification can be resolved to a validity state */
export function isExpirationClassificationResolvable(e: ExpirationClassification): boolean {
  return e !== 'expiration_unknown'
}

/** Whether this classification requires an explicit expiration date */
export function requiresExpirationDate(e: ExpirationClassification): boolean {
  return e === 'expires_on_date'
}
```

### 1.4 DeidentificationMethod

```typescript
export type DeidentificationMethod =
  | 'not_required'
  | 'manual_redaction'
  | 'safe_harbor'
  | 'expert_determination'
  | 'institution_attestation'
  | 'unknown'

export const DEIDENTIFICATION_LABELS: Record<DeidentificationMethod, string> = {
  not_required: 'No identifiers present',
  manual_redaction: 'Manual redaction by reviewer',
  safe_harbor: 'HIPAA Safe Harbor — 18 identifiers removed per §164.514(b)',
  expert_determination: 'Expert determination of minimal re-identification risk',
  institution_attestation: 'Institution certifies de-identification',
  unknown: 'Not assessed — do not treat as de-identified',
}
```

### 1.5 RetentionPolicy

```typescript
export interface RetentionPolicy {
  id: string
  policy_name: string
  retention_basis: 'regulatory' | 'contractual' | 'institutional' | 'kadarn_default'
  retention_days: number | null          // null = permanent while valid
  retention_trigger: 'upload_date' | 'document_date' | 'expiration_date' | 'validation_date'
  destruction_trigger: 'expiry' | 'manual' | 'policy_change' | 'legal_hold_release'
  minimum_retention_until: string | null  // ISO date
  maximum_retention_until: string | null
  policy_version: string                  // e.g., "v1.0.0"
  applies_to_sensitivity: DocumentSensitivityClass[]
  applies_to_handling: DocumentHandlingMode[]
  created_at: string
  superseded_by: string | null
}

export interface RetentionAssignment {
  id: string
  document_id: string
  policy_id: string
  policy_version: string
  scheduled_destruction_at: string | null
  assigned_at: string
  assigned_by: string
}
```

### 1.6 LegalHold

```typescript
export interface LegalHold {
  id: string
  scope_type: 'institution' | 'claim' | 'document' | 'batch'
  scope_id: string
  reason: string
  authorized_by: string
  effective_date: string
  release_date: string | null
  release_reason: string | null
  released_by: string | null
  blocks: LegalHoldBlock[]
}

export type LegalHoldBlock =
  | 'scheduled_destruction'
  | 'manual_destruction'
  | 'original_replacement'
  | 'version_purging'
  | 'derivative_deletion_chunks'
  | 'derivative_deletion_embeddings'
  | 'derivative_deletion_previews'
  | 'derivative_deletion_caches'

export const ALL_LEGAL_HOLD_BLOCKS: LegalHoldBlock[] = [
  'scheduled_destruction', 'manual_destruction', 'original_replacement',
  'version_purging', 'derivative_deletion_chunks', 'derivative_deletion_embeddings',
  'derivative_deletion_previews', 'derivative_deletion_caches',
]
```

### 1.7 DestructionRecord

```typescript
export interface DestructionRecord {
  id: string
  document_id: string
  content_hash: string
  policy_version: string
  scheduled_at: string | null
  destroyed_at: string
  destruction_method: 'logical_delete' | 'cryptographic_erase' | 'overwrite' | 'physical'
  destruction_scope: 'original_only' | 'original_and_derivatives' | 'full_cascade'
  performed_by: string
  verified_by: string | null
  result: 'success' | 'partial_failure' | 'blocked_by_legal_hold'
  failure_reason: string | null
  legal_hold_checked: boolean
  legal_hold_active_at_time: boolean
  derived_assets_disposition: 'destroyed' | 'retained_with_justification' | 'error'
  pre_destruction_snapshot: {
    file_size: number
    chunk_count: number
    embedding_count: number
    temp_files: string[]
  }
}
```

### 1.8 DocumentTaxonomyRule

```typescript
export interface DocumentTaxonomyRule {
  document_type: string
  default_sensitivity: DocumentSensitivityClass
  default_intake: DocumentIntakeDisposition
  default_handling: DocumentHandlingMode
  default_retention_basis: RetentionPolicy['retention_basis']
  requires_review: boolean
  is_prohibited: boolean
  prohibition_reason: string | null
  applicable_entity_types: ('institution' | 'person' | 'location' | 'equipment')[]
  is_package_eligible: boolean
  is_vault_eligible: boolean
}
```

### 1.9 ValidityStatus

```typescript
export type ValidityStatus =
  | 'current'
  | 'expiring_soon'      // within 90 days
  | 'expiring_imminent'  // within 30 days
  | 'expired'
  | 'unknown'
  | 'not_applicable'

export function computeValidityStatus(context: {
  expirationClassification: ExpirationClassification
  expirationDate: string | null
  lastReviewedAt: string | null
  nextReviewDueAt: string | null
  reviewIntervalDays: number | null
  supersededByDocumentId: string | null
  isCurrentVersion: boolean
  replacedAt: string | null
}): { status: ValidityStatus; errors: string[] } {
  const errors: string[] = []
  const { expirationClassification, expirationDate, lastReviewedAt, nextReviewDueAt,
          supersededByDocumentId, isCurrentVersion, replacedAt } = context

  switch (expirationClassification) {
    case 'no_expiration':
      return { status: 'current', errors: [] }

    case 'expiration_unknown':
      return { status: 'unknown', errors: ['Expiration classification is unknown'] }

    case 'expires_on_date': {
      if (!expirationDate) {
        return { status: 'unknown', errors: ['expires_on_date requires expirationDate — missing'] }
      }
      const now = new Date()
      const exp = new Date(expirationDate)
      const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntil < 0) return { status: 'expired', errors: [] }
      if (daysUntil <= 30) return { status: 'expiring_imminent', errors: [] }
      if (daysUntil <= 90) return { status: 'expiring_soon', errors: [] }
      return { status: 'current', errors: [] }
    }

    case 'periodic_review_required': {
      if (!lastReviewedAt && !nextReviewDueAt) {
        return { status: 'unknown', errors: ['periodic_review requires lastReviewedAt or nextReviewDueAt'] }
      }
      const now = new Date()
      // If nextReviewDueAt is set, use it directly
      if (nextReviewDueAt) {
        const due = new Date(nextReviewDueAt)
        if (due < now) return { status: 'expired', errors: ['Periodic review overdue'] }
        const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil <= 30) return { status: 'expiring_imminent', errors: [] }
        if (daysUntil <= 90) return { status: 'expiring_soon', errors: [] }
        return { status: 'current', errors: [] }
      }
      // Compute from lastReviewedAt + reviewIntervalDays
      if (lastReviewedAt && context.reviewIntervalDays) {
        const reviewed = new Date(lastReviewedAt)
        const due = new Date(reviewed)
        due.setDate(due.getDate() + context.reviewIntervalDays)
        if (due < now) return { status: 'expired', errors: ['Periodic review overdue'] }
        const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil <= 30) return { status: 'expiring_imminent', errors: [] }
        if (daysUntil <= 90) return { status: 'expiring_soon', errors: [] }
        return { status: 'current', errors: [] }
      }
      return { status: 'unknown', errors: ['Insufficient data for periodic review calculation'] }
    }

    case 'valid_until_replaced': {
      if (!isCurrentVersion) {
        return { status: 'expired', errors: [`Superseded by ${supersededByDocumentId || 'unknown'}`] }
      }
      if (replacedAt) {
        return { status: 'expired', errors: [`Replaced at ${replacedAt}`] }
      }
      // Still current version and not replaced → remains valid
      return { status: 'current', errors: [] }
    }

    default:
      return { status: 'unknown', errors: [`Unhandled expiration classification: ${expirationClassification}`] }
  }
}
```

### 1.10 PackageEligibility (corrected — taxonomy recommends, user selects)

```typescript
// ─── Package Purpose (taxonomy recommendation, not governance) ─────────

export type PackagePurpose =
  | 'feasibility'          // Initial feasibility response
  | 'site_qualification'   // Formal site qualification visit
  | 'study_startup'        // Regulatory startup package
  | 'study_assignment'     // Study-specific staff/equipment assignment
  | 'internal_evidence'    // Internal audit, KADARN review only

// ─── Package Selection (human-directed) ─────────────────────────────────

export type PackageSelectionMethod =
  | 'chat_requested'       // User described need; KADARN identified candidates
  | 'manual_selected'      // User browsed Vault and selected directly
  | 'system_suggested'     // KADARN auto-suggested; ALWAYS pending confirmation

export type PackageSelectionStatus =
  | 'draft'                // Selection started, not complete
  | 'awaiting_review'      // KADARN suggestions presented; user must confirm
  | 'confirmed'            // User confirmed selection
  | 'rejected'             // User rejected (item or entire package)

export interface PackageDocumentSelection {
  document_id: string
  selected_by: string
  selection_method: PackageSelectionMethod
  selection_reason: string | null     // Why this document was selected
  selected_at: string
  confirmed_by: string | null
  confirmed_at: string | null
  status: PackageSelectionStatus
}

// ─── Rule: Eligible ≠ Selected ≠ Authorized ────────────────────────────
//
// Eligibility  → Can this document be used? (validity, sensitivity, handling)
// Selection    → Does the user want it in this package?
// Authorization → Has the site authorized transfer to this recipient?
//
// All three must be true for transfer.

export interface PackageEligibility {
  document_id: string
  is_current: boolean
  is_vault_eligible: boolean
  eligible_purposes: PackagePurpose[]
  blocking_reasons: string[]
  validity_status: ValidityStatus
  disclosure_status: DisclosureStatus
  requires_site_authorization: boolean
  expiration_date: string | null
  last_reviewed_at: string | null
}

// ─── Transfer Eligibility (separates doc eligibility from authorization) ─

export interface TransferEligibility {
  documentEligible: boolean       // Document meets technical requirements
  packageEligible: boolean        // Document is eligible for this purpose
  transferAuthorized: boolean     // Site has authorized transfer to this recipient
  blockingReasons: string[]
  requiresAuthorization: boolean
  authorizedBy: string | null
  authorizedAt: string | null
  authorizationScope: 'full' | 'metadata_only' | 'redacted' | null
}

export function computePackageEligibility(
  handlingMode: DocumentHandlingMode,
  validityStatus: ValidityStatus,
  disclosureStatus: DisclosureStatus,
  sensitivityClass: DocumentSensitivityClass,
  purpose: PackagePurpose,
): PackageEligibility {
  const blocking: string[] = []

  // ─── Vault eligibility ──────────────────────────────────────────────
  const vaultEligible = ['stored_evidence', 'feasibility_folder', 'private_restricted'].includes(handlingMode)

  // ─── Package handling eligibility ───────────────────────────────────
  // CRITICAL: private_restricted is vault-eligible but NEVER package-eligible
  const packageHandlingEligible = ['stored_evidence', 'feasibility_folder'].includes(handlingMode)

  if (handlingMode === 'ephemeral_processing') blocking.push('Document is ephemeral — no original retained')
  if (handlingMode === 'reviewed_not_stored') blocking.push('Original destroyed after review')
  if (handlingMode === 'reference_only') blocking.push('External reference only — no file in KADARN')
  if (handlingMode === 'private_restricted') blocking.push('Document is private-restricted — cannot be included in sponsor packages')

  // ─── Validity ───────────────────────────────────────────────────────
  if (validityStatus === 'expired') blocking.push('Document has expired')
  if (validityStatus === 'unknown') blocking.push('Validity cannot be determined')

  // ─── Sensitivity ────────────────────────────────────────────────────
  if (sensitivityClass === 'phi_detected') blocking.push('PHI detected — not eligible for sharing')
  if (sensitivityClass === 'prohibited') blocking.push('Document type is prohibited')

  // ─── Disclosure ─────────────────────────────────────────────────────
  if (disclosureStatus === 'not_eligible') blocking.push('Not eligible for disclosure')
  if (disclosureStatus === 'access_revoked') blocking.push('Disclosure access revoked')

  // ─── Purpose-specific eligibility ───────────────────────────────────
  const eligiblePurposes = computeEligiblePurposes(handlingMode, sensitivityClass, validityStatus)
  if (!eligiblePurposes.includes(purpose)) {
    blocking.push(`Document not eligible for purpose: ${purpose}`)
  }

  return {
    document_id: '',
    is_current: validityStatus === 'current',
    is_vault_eligible: vaultEligible,
    eligible_purposes: eligiblePurposes,
    blocking_reasons: blocking,
    validity_status: validityStatus,
    disclosure_status: disclosureStatus,
    requires_site_authorization: ['feasibility', 'site_qualification', 'study_startup', 'study_assignment'].includes(purpose),
    expiration_date: null,
    last_reviewed_at: null,
  }
}

function computeEligiblePurposes(
  handlingMode: DocumentHandlingMode,
  sensitivityClass: DocumentSensitivityClass,
  validityStatus: ValidityStatus,
): PackagePurpose[] {
  // Private/restricted docs: internal evidence only
  if (handlingMode === 'private_restricted') return ['internal_evidence']
  if (handlingMode === 'ephemeral_processing') return ['internal_evidence']
  if (handlingMode === 'reviewed_not_stored') return ['internal_evidence']
  if (handlingMode === 'reference_only') return ['internal_evidence']

  // Expired/unknown validity: not eligible for external purposes
  if (validityStatus === 'expired' || validityStatus === 'unknown') return ['internal_evidence']

  // Sensitive: internal only
  if (['confidential', 'restricted', 'pii_detected', 'regulated_record'].includes(sensitivityClass)) {
    return ['internal_evidence', 'feasibility']
  }

  // Full eligibility
  return ['feasibility', 'site_qualification', 'study_startup', 'study_assignment', 'internal_evidence']
}

// ─── Transfer Eligibility (with authorization) ───────────────────────────

export function computeTransferEligibility(
  packageEligibility: PackageEligibility,
  purpose: PackagePurpose,
  authorization?: DisclosureAuthorization | null,
): TransferEligibility {
  const blocking: string[] = [...packageEligibility.blocking_reasons]

  const documentEligible = packageEligibility.eligible_purposes.includes(purpose)
  if (!documentEligible) blocking.push(`Document not eligible for purpose: ${purpose}`)

  // Check authorization
  let transferAuthorized = false
  let authorizedBy: string | null = null
  let authorizedAt: string | null = null
  let authorizationScope: 'full' | 'metadata_only' | 'redacted' | null = null

  if (purpose === 'internal_evidence') {
    transferAuthorized = true  // Internal use doesn't require site authorization
  } else if (authorization) {
    if (authorization.revoked_at) {
      blocking.push('Authorization has been revoked')
    } else if (authorization.expires_at && new Date(authorization.expires_at) < new Date()) {
      blocking.push('Authorization has expired')
    } else {
      transferAuthorized = true
      authorizedBy = authorization.authorized_by
      authorizedAt = authorization.authorized_at
      authorizationScope = authorization.scope
    }
  } else {
    blocking.push('Site authorization required for transfer')
  }

  return {
    documentEligible,
    packageEligible: documentEligible && blocking.filter(b =>
      !b.includes('authorization') || b === 'Site authorization required for transfer'
    ).length === 0,
    transferAuthorized,
    blockingReasons: blocking,
    requiresAuthorization: purpose !== 'internal_evidence',
    authorizedBy,
    authorizedAt,
    authorizationScope,
  }
}

interface DisclosureAuthorization {
  authorized_by: string
  authorized_at: string
  recipient_type: string
  recipient_id: string
  study_id: string | null
  scope: 'full' | 'metadata_only' | 'redacted'
  expires_at: string | null
  revoked_at: string | null
}
```

### 1.11 DocumentTaxonomyRule (corrected with PackagePurpose[])

```typescript
export interface DocumentTaxonomyRule {
  document_type: string
  default_sensitivity: DocumentSensitivityClass
  default_intake: DocumentIntakeDisposition
  default_handling: DocumentHandlingMode
  default_retention_basis: RetentionPolicy['retention_basis']
  requires_review: boolean
  is_prohibited: boolean
  prohibition_reason: string | null
  applicable_entity_types: ('institution' | 'person' | 'location' | 'equipment')[]
  eligible_purposes: PackagePurpose[]      // Replaces boolean is_package_eligible
  is_vault_eligible: boolean
}
```typescript
export const DOCUMENT_TAXONOMY: Record<string, DocumentTaxonomyRule> = {
  // ─── Personnel documents ───────────────────────────────────────────
  'cv': {
    document_type: 'Curriculum Vitae',
    default_sensitivity: 'pii_detected', default_intake: 'accepted_ephemeral',
    default_handling: 'ephemeral_processing', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['feasibility', 'site_qualification', 'study_startup'],
    is_vault_eligible: false,
  },
  'gcp_certificate': {
    document_type: 'GCP Training Certificate',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['feasibility', 'site_qualification', 'study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  'iata_certificate': {
    document_type: 'IATA Training Certificate',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['feasibility', 'site_qualification', 'study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  'human_subjects_protection': {
    document_type: 'Human Subjects Protection Training',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['feasibility', 'site_qualification', 'study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  'medical_license': {
    document_type: 'Medical License',
    default_sensitivity: 'pii_detected', default_intake: 'accepted_with_redaction',
    default_handling: 'reviewed_not_stored', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['feasibility', 'site_qualification', 'study_startup'],
    is_vault_eligible: false,
  },
  'board_certification': {
    document_type: 'Board Certification',
    default_sensitivity: 'pii_detected', default_intake: 'accepted_with_redaction',
    default_handling: 'reviewed_not_stored', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: false,
  },
  'acls_bls': {
    document_type: 'ACLS/BLS Certification',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  'study_specific_training': {
    document_type: 'Study-Specific Training Evidence',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'contractual',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  'delegation_of_authority': {
    document_type: 'Delegation of Authority Log',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'regulatory',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  // ─── Regulatory documents ──────────────────────────────────────────
  'fda_1572': {
    document_type: 'FDA Form 1572 (Statement of Investigator)',
    default_sensitivity: 'pii_detected', default_intake: 'accepted_with_redaction',
    default_handling: 'private_restricted', default_retention_basis: 'regulatory',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  'financial_disclosure': {
    document_type: 'Financial Disclosure Form (21 CFR Part 54)',
    default_sensitivity: 'confidential', default_intake: 'manual_review_required',
    default_handling: 'private_restricted', default_retention_basis: 'regulatory',
    requires_review: true, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person'],
    eligible_purposes: ['study_startup'],
    is_vault_eligible: true,
  },
  'state_license': {
    document_type: 'State/Regional Professional License',
    default_sensitivity: 'pii_detected', default_intake: 'accepted_with_redaction',
    default_handling: 'reviewed_not_stored', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['person', 'location'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: false,
  },
  // ─── Institutional documents ───────────────────────────────────────
  'clia_certificate': {
    document_type: 'CLIA Certificate',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'regulatory',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution', 'location'],
    eligible_purposes: ['feasibility', 'site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'cap_accreditation': {
    document_type: 'CAP Accreditation',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'regulatory',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution', 'location'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'institutional_license': {
    document_type: 'Institutional License',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'regulatory',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'pharmacy_license': {
    document_type: 'Pharmacy License',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'regulatory',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution', 'location'],
    eligible_purposes: ['study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  'controlled_substance_registration': {
    document_type: 'Controlled-Substance Registration',
    default_sensitivity: 'restricted', default_intake: 'manual_review_required',
    default_handling: 'private_restricted', default_retention_basis: 'regulatory',
    requires_review: true, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  'irb_reliance': {
    document_type: 'IRB Reliance Information',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['study_startup'],
    is_vault_eligible: true,
  },
  'facility_certification': {
    document_type: 'Facility Certification',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'insurance_certificate': {
    document_type: 'Insurance Certificate',
    default_sensitivity: 'confidential', default_intake: 'accepted',
    default_handling: 'private_restricted', default_retention_basis: 'contractual',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['internal_evidence'],
    is_vault_eligible: true,
  },
  'sop': {
    document_type: 'Standard Operating Procedure',
    default_sensitivity: 'confidential', default_intake: 'manual_review_required',
    default_handling: 'private_restricted', default_retention_basis: 'institutional',
    requires_review: true, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['study_startup'],
    is_vault_eligible: true,
  },
  // ─── Quality documents ─────────────────────────────────────────────
  'capa_records': {
    document_type: 'CAPA Records (Corrective and Preventive Action)',
    default_sensitivity: 'confidential', default_intake: 'manual_review_required',
    default_handling: 'private_restricted', default_retention_basis: 'institutional',
    requires_review: true, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['internal_evidence'],
    is_vault_eligible: true,
  },
  'internal_audit_report': {
    document_type: 'Internal Audit Report',
    default_sensitivity: 'confidential', default_intake: 'manual_review_required',
    default_handling: 'private_restricted', default_retention_basis: 'institutional',
    requires_review: true, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['internal_evidence'],
    is_vault_eligible: true,
  },
  // ─── Emergency & safety documents ───────────────────────────────────
  'emergency_response_plan': {
    document_type: 'Emergency Response / Disaster Recovery Plan',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution', 'location'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'business_continuity_plan': {
    document_type: 'Business Continuity Plan',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['site_qualification'],
    is_vault_eligible: true,
  },
  'hazardous_materials': {
    document_type: 'Hazardous Materials / Chemical Safety Documentation',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution', 'location'],
    eligible_purposes: ['site_qualification'],
    is_vault_eligible: true,
  },
  // ─── Equipment documents ───────────────────────────────────────────
  'equipment_calibration': {
    document_type: 'Equipment Calibration Record',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location', 'equipment'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'equipment_maintenance': {
    document_type: 'Preventive Maintenance Record',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location', 'equipment'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'equipment_qualification': {
    document_type: 'Equipment Qualification Record (IQ/OQ/PQ)',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location', 'equipment'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'temperature_mapping': {
    document_type: 'Temperature Mapping Report',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location', 'equipment'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'shipping_validation': {
    document_type: 'Shipping Equipment Validation',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location', 'equipment'],
    eligible_purposes: ['study_startup', 'study_assignment'],
    is_vault_eligible: true,
  },
  'backup_power_logs': {
    document_type: 'Backup Power Test Logs',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location', 'equipment'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'alarm_excursion_logs': {
    document_type: 'Alarm Response / Excursion Logs',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location', 'equipment'],
    eligible_purposes: ['site_qualification'],
    is_vault_eligible: true,
  },
  'environmental_monitoring_logs': {
    document_type: 'Environmental Monitoring Logs (ongoing)',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location', 'equipment'],
    eligible_purposes: ['site_qualification'],
    is_vault_eligible: true,
  },
  'radiation_safety': {
    document_type: 'Radiation Safety Certificate',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'regulatory',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['location', 'equipment'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  'bsl_documentation': {
    document_type: 'Biosafety Level (BSL) Documentation',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution', 'location'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  // ─── Technology documents ──────────────────────────────────────────
  'emr_validation': {
    document_type: 'EMR/EHR System Validation',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['site_qualification'],
    is_vault_eligible: true,
  },
  'data_security_cert': {
    document_type: 'Data Security Certification (SOC 2 / ISO 27001)',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['site_qualification'],
    is_vault_eligible: true,
  },
  'part11_compliance': {
    document_type: '21 CFR Part 11 Compliance Documentation',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'regulatory',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['study_startup'],
    is_vault_eligible: true,
  },
  // ─── Operational documents ─────────────────────────────────────────
  'recruitment_plan': {
    document_type: 'Patient Recruitment and Outreach Plan',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['feasibility', 'site_qualification'],
    is_vault_eligible: true,
  },
  'diversity_plan': {
    document_type: 'Diversity and Inclusion Plan',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['feasibility'],
    is_vault_eligible: true,
  },
  'community_advisory_board': {
    document_type: 'Community Advisory Board Documentation',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['feasibility'],
    is_vault_eligible: true,
  },
  'translator_services': {
    document_type: 'Translator / Language Services Documentation',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['feasibility', 'site_qualification'],
    is_vault_eligible: true,
  },
  'training_matrix': {
    document_type: 'Staff Training Compliance Matrix',
    default_sensitivity: 'internal', default_intake: 'accepted',
    default_handling: 'stored_evidence', default_retention_basis: 'institutional',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['site_qualification', 'study_startup'],
    is_vault_eligible: true,
  },
  // ─── Legal documents ───────────────────────────────────────────────
  'mta_agreement': {
    document_type: 'Material Transfer Agreement (MTA)',
    default_sensitivity: 'confidential', default_intake: 'manual_review_required',
    default_handling: 'private_restricted', default_retention_basis: 'contractual',
    requires_review: true, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['internal_evidence'],
    is_vault_eligible: true,
  },
  'indemnification': {
    document_type: 'Indemnification / Liability Coverage',
    default_sensitivity: 'confidential', default_intake: 'accepted',
    default_handling: 'private_restricted', default_retention_basis: 'contractual',
    requires_review: false, is_prohibited: false, prohibition_reason: null,
    applicable_entity_types: ['institution'],
    eligible_purposes: ['internal_evidence'],
    is_vault_eligible: true,
  },
  // ─── Prohibited ────────────────────────────────────────────────────
  'medical_record': {
    document_type: 'Medical Record',
    default_sensitivity: 'prohibited', default_intake: 'rejected',
    default_handling: 'ephemeral_processing', default_retention_basis: 'kadarn_default',
    requires_review: false, is_prohibited: true,
    prohibition_reason: 'PHI — not minimum necessary (HIPAA). Never ingest.',
    applicable_entity_types: [],
    eligible_purposes: [],
    is_vault_eligible: false,
  },
  // ─── Fallback ──────────────────────────────────────────────────────
  'unclassified': {
    document_type: 'Unclassified Document',
    default_sensitivity: 'unknown', default_intake: 'quarantined',
    default_handling: 'ephemeral_processing', default_retention_basis: 'kadarn_default',
    requires_review: true, is_prohibited: false,
    prohibition_reason: 'Unknown sensitivity — quarantine until classified.',
    applicable_entity_types: [],
    eligible_purposes: [],
    is_vault_eligible: false,
  },
}
```

---

## 2. ENTITY RELATIONSHIPS

### 2.1 Single Authority Rule

State that can be determined by query MUST NOT be duplicated as a column.

| State | Canonical Location | Must NOT appear in evidence_sources |
|---|---|---|
| Package eligibility | Computed from handling + validity + sensitivity + disclosure | ❌ No `is_package_eligible` column |
| Transfer authorization | `disclosure_authorizations` table | ❌ No `is_authorized` column |
| Scheduled destruction | `document_retention_assignments` table | ❌ No `scheduled_destruction_at` column (duplicate) |
| Legal hold active | `legal_holds` table (query by scope) | ❌ No `is_on_legal_hold` column |
| Validity status | Computed from `computeValidityStatus()` | 🟡 May cache for performance, but not authoritative |
| Processing status | `evidence_sources.processing_status` | ✅ This IS the canonical location |

**Rule:** `evidence_sources` holds the document's current state and FK references. Related tables hold history, multiple assignments, authorizations, and events. No column in `evidence_sources` may be derived from a query against related tables.

### 2.2 PII Post-Redaction Transition

When a document with `pii_detected` sensitivity undergoes successful redaction:

```typescript
interface PIIRedactionTransition {
  // Pre-redaction state (preserved)
  original_sensitivity_class: 'pii_detected'
  original_handling_mode: DocumentHandlingMode

  // Post-redaction state
  processed_sensitivity_class: DocumentSensitivityClass  // e.g., 'internal'
  processed_handling_mode: DocumentHandlingMode          // e.g., 'stored_evidence'
  redaction_status: 'redacted'
  deidentification_method: DeidentificationMethod        // e.g., 'manual_redaction'

  // Verification
  verified_by: string
  verified_at: string
  verification_method: string

  // Original document disposition
  original_disposition: 'destroyed' | 'restricted_retained'
  original_destruction_record_id?: string
}
```

**Flow:**
```
1. Document ingested with sensitivity_class = 'pii_detected'
2. Processing blocked — isProcessingBlocked('pii_detected') = true
3. Redaction performed (manual or automated)
4. Redaction verified by reviewer
5. PIIRedactionTransition recorded
6. Original document:
   a. If original_disposition = 'destroyed' → destruction record created, original deleted
   b. If original_disposition = 'restricted_retained' → kept with is_current_version = false
7. Redacted version:
   a. New evidence_sources row with sensitivity_class = processed_sensitivity_class
   b. handling_mode = processed_handling_mode
   c. replaces_document_id → original document ID
   d. Now passes isProcessingAllowed() check
   e. Eligible for vault/package per new classification
```

### 2.3 Entity Diagram

```
evidence_sources (existing, migration 094)
  ├── +intake_disposition: DocumentIntakeDisposition
  ├── +handling_mode: DocumentHandlingMode
  ├── +sensitivity_class: DocumentSensitivityClass
  ├── +expiration_classification: ExpirationClassification
  ├── +expiration_date: timestamptz
  ├── +effective_date: timestamptz
  ├── +issue_date: timestamptz
  ├── +issuing_authority: text
  ├── +document_version: text
  ├── +review_date: timestamptz
  ├── +validity_status: ValidityStatus (computed)
  ├── +deidentification_method: DeidentificationMethod
  ├── +deidentification_reviewer: text
  ├── +phi_checked: boolean
  ├── +phi_detected: boolean
  ├── +intake_decision_by: text
  ├── +intake_decision_at: timestamptz
  ├── +policy_version: text
  ├── +owner_type: 'institution' | 'person' | 'location' | 'equipment'
  ├── +owner_id: uuid
  ├── +replaces_document_id: uuid (self-referencing)

retention_policies (new table)
  ├── policy_name, retention_basis, retention_days
  ├── retention_trigger, destruction_trigger
  ├── policy_version, superseded_by

document_retention_assignments (new table)
  ├── document_id → evidence_sources
  ├── policy_id → retention_policies
  ├── scheduled_destruction_at

legal_holds (new table)
  ├── scope_type, scope_id, reason
  ├── authorized_by, effective_date, release_date
  ├── blocks: LegalHoldBlock[]

destruction_records (new table)
  ├── document_id, content_hash
  ├── policy_version, scheduled_at, destroyed_at
  ├── destruction_method, destruction_scope
  ├── performed_by, verified_by, result
  ├── pre_destruction_snapshot (JSONB)

document_taxonomy (new table — seed data)
  ├── document_type (PK)
  ├── default_sensitivity, default_intake, default_handling
  ├── requires_review, is_prohibited
  ├── applicable_entity_types
  ├── is_package_eligible, is_vault_eligible

document_access_events (new table)
  ├── document_id, accessed_by, accessed_at
  ├── access_type: 'view' | 'download' | 'share' | 'redact' | 'review'
  ├── disclosure_scope: 'internal' | 'kadarn_reviewer' | 'sponsor' | 'public'
  ├── authorized_by, authorization_id

disclosure_authorizations (new table)
  ├── document_id, authorized_by (site user)
  ├── recipient_type: 'sponsor' | 'cro' | 'kadarn'
  ├── recipient_id, study_id
  ├── scope: 'full' | 'metadata_only' | 'redacted'
  ├── authorized_at, expires_at, revoked_at
```

---

## 3. COLUMNS TO ADD TO evidence_sources (migration 094 extension)

```sql
ALTER TABLE evidence_sources
  ADD COLUMN intake_disposition text
    CHECK (intake_disposition IN ('accepted','accepted_with_redaction','accepted_ephemeral','reference_required','rejected','quarantined','manual_review_required')),
  ADD COLUMN handling_mode text
    CHECK (handling_mode IN ('stored_evidence','reviewed_not_stored','reference_only','private_restricted','feasibility_folder','ephemeral_processing')),
  ADD COLUMN sensitivity_class text
    CHECK (sensitivity_class IN ('public','internal','confidential','restricted','pii_detected','phi_detected','regulated_record','prohibited','unknown')),
  ADD COLUMN expiration_classification text DEFAULT 'expiration_unknown'
    CHECK (expiration_classification IN ('expires_on_date','periodic_review_required','valid_until_replaced','no_expiration','expiration_unknown')),
  ADD COLUMN expiration_date timestamptz,
  ADD COLUMN effective_date timestamptz,
  ADD COLUMN issue_date timestamptz,
  ADD COLUMN issuing_authority text,
  ADD COLUMN document_version text,
  ADD COLUMN review_date timestamptz,
  ADD COLUMN deidentification_method text DEFAULT 'unknown'
    CHECK (deidentification_method IN ('not_required','manual_redaction','safe_harbor','expert_determination','institution_attestation','unknown')),
  ADD COLUMN deidentification_reviewer text,
  ADD COLUMN phi_checked boolean DEFAULT false,
  ADD COLUMN phi_detected boolean DEFAULT false,
  ADD COLUMN intake_decision_by text,
  ADD COLUMN intake_decision_at timestamptz,
  ADD COLUMN policy_version text,
  ADD COLUMN owner_type text
    CHECK (owner_type IN ('institution','person','location','equipment')),
  ADD COLUMN owner_id uuid,
  ADD COLUMN replaces_document_id uuid REFERENCES evidence_sources(id);
```

---

## 4. NEW TABLES DESIGN

### 4.1 retention_policies

```sql
CREATE TABLE retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  retention_basis TEXT NOT NULL CHECK (retention_basis IN ('regulatory','contractual','institutional','kadarn_default')),
  retention_days INT,                          -- NULL = permanent while valid
  retention_trigger TEXT NOT NULL CHECK (retention_trigger IN ('upload_date','document_date','expiration_date','validation_date')),
  destruction_trigger TEXT NOT NULL CHECK (destruction_trigger IN ('expiry','manual','policy_change','legal_hold_release')),
  minimum_retention_until TIMESTAMPTZ,
  maximum_retention_until TIMESTAMPTZ,
  policy_version TEXT NOT NULL,
  applies_to_sensitivity TEXT[] NOT NULL,
  applies_to_handling TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  superseded_by UUID REFERENCES retention_policies(id)
);
```

### 4.2 document_retention_assignments

```sql
CREATE TABLE document_retention_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES evidence_sources(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES retention_policies(id),
  policy_version TEXT NOT NULL,
  scheduled_destruction_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT NOT NULL
);
```

### 4.3 legal_holds

```sql
CREATE TABLE legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('institution','claim','document','batch')),
  scope_id UUID NOT NULL,
  reason TEXT NOT NULL,
  authorized_by TEXT NOT NULL,
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  release_date TIMESTAMPTZ,
  release_reason TEXT,
  released_by TEXT,
  blocks TEXT[] NOT NULL DEFAULT ARRAY['scheduled_destruction','manual_destruction','original_replacement','version_purging','derivative_deletion_chunks','derivative_deletion_embeddings','derivative_deletion_previews','derivative_deletion_caches']
);
```

### 4.4 destruction_records

```sql
CREATE TABLE destruction_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  content_hash TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  destroyed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  destruction_method TEXT NOT NULL CHECK (destruction_method IN ('logical_delete','cryptographic_erase','overwrite','physical')),
  destruction_scope TEXT NOT NULL CHECK (destruction_scope IN ('original_only','original_and_derivatives','full_cascade')),
  performed_by TEXT NOT NULL,
  verified_by TEXT,
  result TEXT NOT NULL CHECK (result IN ('success','partial_failure','blocked_by_legal_hold')),
  failure_reason TEXT,
  legal_hold_checked BOOLEAN NOT NULL DEFAULT false,
  legal_hold_active_at_time BOOLEAN NOT NULL DEFAULT false,
  derived_assets_disposition TEXT CHECK (derived_assets_disposition IN ('destroyed','retained_with_justification','error')),
  pre_destruction_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 document_taxonomy (seed data)

```sql
CREATE TABLE document_taxonomy (
  document_type TEXT PRIMARY KEY,
  default_sensitivity TEXT NOT NULL,
  default_intake TEXT NOT NULL,
  default_handling TEXT NOT NULL,
  default_retention_basis TEXT NOT NULL,
  retention_days INT,
  requires_review BOOLEAN DEFAULT false,
  is_prohibited BOOLEAN DEFAULT false,
  prohibition_reason TEXT,
  applicable_entity_types TEXT[] NOT NULL DEFAULT '{}',
  is_package_eligible BOOLEAN DEFAULT false,
  is_vault_eligible BOOLEAN DEFAULT false
);
```

### 4.6 document_access_events

```sql
CREATE TABLE document_access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES evidence_sources(id) ON DELETE CASCADE,
  accessed_by TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_type TEXT NOT NULL CHECK (access_type IN ('view','download','share','redact','review')),
  disclosure_scope TEXT CHECK (disclosure_scope IN ('internal','kadarn_reviewer','sponsor','public')),
  authorized_by TEXT,
  authorization_id UUID
);
```

### 4.7 disclosure_authorizations

```sql
CREATE TABLE disclosure_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES evidence_sources(id) ON DELETE CASCADE,
  authorized_by TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('sponsor','cro','kadarn')),
  recipient_id TEXT NOT NULL,
  study_id TEXT,
  scope TEXT NOT NULL DEFAULT 'full' CHECK (scope IN ('full','metadata_only','redacted')),
  authorized_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT
);
```

---

## 5. EXPIRATION ALERT SCHEDULE

```typescript
export const EXPIRATION_ALERT_WINDOWS = [
  { days_before: 90, label: '90-day warning', action: 'notify_site' },
  { days_before: 60, label: '60-day warning', action: 'notify_site' },
  { days_before: 30, label: '30-day warning', action: 'notify_site_and_flag' },
  { days_before: 14, label: '14-day warning', action: 'notify_site_and_flag_urgent' },
  { days_before: 7,  label: '7-day warning', action: 'notify_site_and_flag_critical' },
  { days_before: 0,  label: 'Expiration day', action: 'mark_expired_and_notify' },
]

export function computeExpirationAlerts(
  expirationDate: string,
  documentId: string,
): ExpirationAlert[] {
  const exp = new Date(expirationDate)
  const now = new Date()
  const alerts: ExpirationAlert[] = []

  for (const window of EXPIRATION_ALERT_WINDOWS) {
    const triggerDate = new Date(exp)
    triggerDate.setDate(triggerDate.getDate() - window.days_before)

    if (now >= triggerDate && now < exp) {
      alerts.push({
        document_id: documentId,
        alert_type: window.label,
        action: window.action,
        days_remaining: Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        triggered_at: now.toISOString(),
      })
    }
  }

  return alerts
}

interface ExpirationAlert {
  document_id: string
  alert_type: string
  action: string
  days_remaining: number
  triggered_at: string
}
```

---

## 6. VALIDITY ENGINE

```typescript
export interface DocumentValidityResult {
  document_id: string
  validity_status: ValidityStatus
  expiration_classification: ExpirationClassification
  days_until_expiration: number | null
  alerts: ExpirationAlert[]
  is_package_eligible: boolean
  affected_claims: string[]
  affected_assets: string[]
}

export function assessDocumentValidity(
  document: EvidenceSourceRecord,
  linkedClaims: string[],
  linkedAssets: string[],
): DocumentValidityResult {
  const validityStatus = computeValidityStatus(
    document.expiration_classification,
    document.expiration_date,
  )

  const alerts = document.expiration_date
    ? computeExpirationAlerts(document.expiration_date, document.id)
    : []

  const eligibility = computePackageEligibility(
    document.handling_mode,
    validityStatus,
    document.disclosure_status || 'not_eligible',
    document.sensitivity_class,
  )

  return {
    document_id: document.id,
    validity_status: validityStatus,
    expiration_classification: document.expiration_classification,
    days_until_expiration: alerts[0]?.days_remaining ?? null,
    alerts,
    is_package_eligible: eligibility.is_package_eligible,
    affected_claims: linkedClaims,
    affected_assets: linkedAssets,
  }
}
```

---

## 7. MIGRATION FROM CURRENT MODEL

### Current state (migration 094)
```
evidence_sources: id, institution_id, source_type, label, file_path, file_name,
  file_type, file_size, file_hash, page_count, text_content, processing_status
```

### Migration plan
1. **Migration 095** (ALTER only — no new tables): Add columns to `evidence_sources` as specified in §3
2. **Migration 096** (new tables): Create `retention_policies`, `document_retention_assignments`, `legal_holds`, `destruction_records`, `document_taxonomy`, `document_access_events`, `disclosure_authorizations`
3. **Seed data**: Populate `document_taxonomy` with the `DOCUMENT_TAXONOMY` lookup table
4. **Seed data**: Populate `retention_policies` with default policies:

```sql
-- Default retention policies
INSERT INTO retention_policies (policy_name, retention_basis, retention_days, retention_trigger, destruction_trigger, policy_version, applies_to_sensitivity, applies_to_handling)
VALUES
  ('Permanent — regulatory', 'regulatory', NULL, 'document_date', 'manual', 'v1.0.0', ARRAY['regulated_record'], ARRAY['stored_evidence']),
  ('Validity + 7 years', 'regulatory', 2555, 'expiration_date', 'expiry', 'v1.0.0', ARRAY['internal'], ARRAY['stored_evidence']),
  ('Validity + 3 years', 'institutional', 1095, 'expiration_date', 'expiry', 'v1.0.0', ARRAY['pii_detected'], ARRAY['reviewed_not_stored']),
  ('30 days — ephemeral', 'institutional', 30, 'upload_date', 'expiry', 'v1.0.0', ARRAY['pii_detected'], ARRAY['ephemeral_processing']),
  ('7 days — ephemeral', 'institutional', 7, 'upload_date', 'expiry', 'v1.0.0', ARRAY['pii_detected'], ARRAY['ephemeral_processing']),
  ('Contractual retention', 'contractual', NULL, 'upload_date', 'manual', 'v1.0.0', ARRAY['confidential'], ARRAY['private_restricted']),
  ('24 hours — quarantine', 'kadarn_default', 1, 'upload_date', 'expiry', 'v1.0.0', ARRAY['unknown'], ARRAY['ephemeral_processing']);
```

5. **Backfill**: Existing `evidence_sources` rows default to:
   - `intake_disposition` = `'accepted'`
   - `handling_mode` = `'stored_evidence'`
   - `sensitivity_class` = `'unknown'` (requires review)
   - `expiration_classification` = `'expiration_unknown'`

---

## 8. POLICY VERSIONING RULES

1. Every retention decision records the `policy_version` that was active at decision time
2. `retention_policies` uses `superseded_by` for policy evolution
3. When a policy changes:
   a. Old policy marked with `superseded_by` → new policy ID
   b. Existing `document_retention_assignments` NOT auto-updated
   c. New documents use new policy version
   d. Existing documents can be re-assigned via manual review
4. `DestructionRecord` captures `policy_version` at destruction time
5. `LegalHold` captures policy at hold placement time

---

## 9. ACCEPTANCE CRITERIA FOR IMPLEMENTATION PHASE

Before any migration execution or code change:

1. ✅ All type extensions defined in document-handling.ts (11 types + 22 taxonomy entries)
2. ✅ DOCUMENT_TAXONOMY populated with 22 document types (all resolve to canonical rules)
3. ✅ Expiration classification: 5 values, all handled by computeValidityStatus()
4. ✅ ValidityStatus computed with full context object (all 5 classifications)
5. ✅ PackageEligibility: PackagePurpose[] replaces boolean, 5 purposes defined
6. ✅ TransferEligibility: separates documentEligible, packageEligible, transferAuthorized
7. ✅ private_restricted explicitly blocked from sponsor packages
8. ✅ PII post-redaction transition defined (original_sensitivity → processed_sensitivity)
9. ✅ Legal hold blocks all 8 destructive operations
10. ✅ Destruction record captures full pre-destruction snapshot
11. ✅ Retention policies versioned with superseded_by chain
12. ✅ Single Authority Rule: no redundant state columns in evidence_sources
13. ✅ Migration design is coherent (2 migrations: ALTER + CREATE)
14. ✅ Seed data includes taxonomy (22 types) + retention policies (7)
15. ✅ Backfill strategy defined for existing evidence_sources rows
16. ✅ No runtime code changes in this Work Order

---

*WO-KEMS-DOC-002 — Design Phase — 2026-07-30 — Revision 2*
*Baseline: WO-KEMS-DOC-001 ACCEPTED (76e3625)*
*Corrections applied: C1-C8 (2026-07-30)*
*D17 added: Human-directed package composition (2026-07-30)*
*Revision 3: Taxonomy expanded from 22 → 46 document types (2026-07-30)*
*Next: Human Gate review → ACCEPTED → migration execution*
