// ==========================================================================
// KTP-1.5 — Document Handling Modes & Evidence Retention Policy v1
// ==========================================================================
// Canonical types for document handling, evidence basis, disclosure control,
// and redaction status. Separates four orthogonal axes:
//
//   1. What happened to the file?        → DocumentHandlingMode
//   2. What support does it provide?     → EvidenceBasis
//   3. Is it eligible for disclosure?    → DisclosureStatus
//   4. Was it actually shared/redacted?  → RedactionStatus
//
// These types are shared across Study Experience, Documents, Evidence Core,
// Passport, and Feasibility Folder.
// ==========================================================================

// --------------------------------------------------------------------------
// 1. Document Handling Mode — what happened to the file
// --------------------------------------------------------------------------

export type DocumentHandlingMode =
  | 'stored_evidence'          // File retained as evidence in Kadarn
  | 'reviewed_not_stored'      // Reviewed by Kadarn; source not retained
  | 'reference_only'           // Referenced externally; no file in Kadarn
  | 'private_restricted'       // Retained but never sponsor-facing
  | 'feasibility_folder'       // Curated for future feasibility/startup packages
  | 'ephemeral_processing'     // Processed temporarily; facts extracted, file discarded

export const DOCUMENT_HANDLING_MODE_LABELS: Record<DocumentHandlingMode, string> = {
  stored_evidence: 'Stored as evidence',
  reviewed_not_stored: 'Reviewed — not stored',
  reference_only: 'Reference only',
  private_restricted: 'Private / restricted',
  feasibility_folder: 'Feasibility Folder',
  ephemeral_processing: 'Temporary processing',
}

/** Whether the file itself is retained in Kadarn storage */
export function isRetained(mode: DocumentHandlingMode): boolean {
  return mode === 'stored_evidence' || mode === 'feasibility_folder' || mode === 'private_restricted'
}

/** Whether this mode allows the document to be used as evidence */
export function isEvidenceEligible(mode: DocumentHandlingMode): boolean {
  return mode !== 'reference_only'
}

// --------------------------------------------------------------------------
// 2. Evidence Basis — what support the document provides to a claim
// --------------------------------------------------------------------------

export type EvidenceBasis =
  | 'self_reported'                    // Institution declaration only, no document
  | 'referenced_only'                  // Document referenced but not available in Kadarn
  | 'document_reviewed_not_stored'     // Reviewed by Kadarn but source not retained
  | 'document_supported'               // Document stored and supports claim (internal)
  | 'document_supported_internal'      // Document stored but restricted — not sponsor-facing
  | 'document_supported_shareable'     // Document stored and eligible for sponsor sharing
  | 'reviewed_limited_retention'       // Reviewed with limited retention period
  | 'externally_corroborated'          // Confirmed by third party (sponsor, CRO, registry)

export const EVIDENCE_BASIS_LABELS: Record<EvidenceBasis, string> = {
  self_reported: 'Self-reported',
  referenced_only: 'Referenced only',
  document_reviewed_not_stored: 'Reviewed — not stored',
  document_supported: 'Document-supported',
  document_supported_internal: 'Internal document',
  document_supported_shareable: 'Shareable document',
  reviewed_limited_retention: 'Reviewed — limited retention',
  externally_corroborated: 'Externally corroborated',
}

/** Whether this evidence basis counts as "supported by evidence" for readiness */
export function isEvidenceBacked(basis: EvidenceBasis): boolean {
  return [
    'document_supported',
    'document_supported_internal',
    'document_supported_shareable',
    'externally_corroborated',
  ].includes(basis)
}

/** Whether this evidence basis is sponsor-facing */
export function isSponsorFacing(basis: EvidenceBasis): boolean {
  return [
    'document_supported_shareable',
    'externally_corroborated',
  ].includes(basis)
}

// --------------------------------------------------------------------------
// 3. Disclosure Status — eligibility and actual sharing state
// --------------------------------------------------------------------------

export type DisclosureStatus =
  | 'not_eligible'                 // Cannot be shared (private, restricted, expired)
  | 'eligible_with_authorization'  // Can be shared if site authorizes
  | 'authorized_for_package'       // Site has authorized for a specific package
  | 'shared'                       // Has been shared with a recipient
  | 'access_revoked'               // Previously shared, now revoked
  | 'expired'                      // Sharing authorization has expired

export const DISCLOSURE_STATUS_LABELS: Record<DisclosureStatus, string> = {
  not_eligible: 'Not eligible for sharing',
  eligible_with_authorization: 'Eligible — requires authorization',
  authorized_for_package: 'Authorized for package',
  shared: 'Shared',
  access_revoked: 'Access revoked',
  expired: 'Sharing expired',
}

// --------------------------------------------------------------------------
// 4. Redaction Status — whether the document has been redacted
// --------------------------------------------------------------------------

export type RedactionStatus =
  | 'none'             // Not redacted; full document
  | 'redacted'         // Redaction applied
  | 'unknown'          // Redaction status unknown
  | 'required'         // Redaction required before sharing
  | 'not_applicable'   // Redaction not applicable (e.g., public document)

export const REDACTION_STATUS_LABELS: Record<RedactionStatus, string> = {
  none: 'Not redacted',
  redacted: 'Redacted',
  unknown: 'Redaction status unknown',
  required: 'Redaction required',
  not_applicable: 'Redaction N/A',
}

// --------------------------------------------------------------------------
// Mapping Matrix: HandlingMode → EvidenceBasis → DisclosureStatus
// --------------------------------------------------------------------------

export interface DocumentHandlingMapping {
  handlingMode: DocumentHandlingMode
  evidenceBasis: EvidenceBasis
  retained: boolean
  sponsorFacing: boolean
  defaultDisclosureStatus: DisclosureStatus
  description: string
}

export const DOCUMENT_HANDLING_MATRIX: Record<DocumentHandlingMode, DocumentHandlingMapping> = {
  stored_evidence: {
    handlingMode: 'stored_evidence',
    evidenceBasis: 'document_supported',
    retained: true,
    sponsorFacing: false,
    defaultDisclosureStatus: 'not_eligible',
    description: 'File retained as internal evidence. Not sponsor-facing by default.',
  },
  reviewed_not_stored: {
    handlingMode: 'reviewed_not_stored',
    evidenceBasis: 'document_reviewed_not_stored',
    retained: false,
    sponsorFacing: false,
    defaultDisclosureStatus: 'not_eligible',
    description: 'Reviewed by Kadarn. Source not retained. Facts extracted.',
  },
  reference_only: {
    handlingMode: 'reference_only',
    evidenceBasis: 'referenced_only',
    retained: false,
    sponsorFacing: false,
    defaultDisclosureStatus: 'not_eligible',
    description: 'Document referenced but not available in Kadarn.',
  },
  private_restricted: {
    handlingMode: 'private_restricted',
    evidenceBasis: 'document_supported_internal',
    retained: true,
    sponsorFacing: false,
    defaultDisclosureStatus: 'not_eligible',
    description: 'Retained internally. Never sponsor-facing.',
  },
  feasibility_folder: {
    handlingMode: 'feasibility_folder',
    evidenceBasis: 'document_supported_shareable',
    retained: true,
    sponsorFacing: true,
    defaultDisclosureStatus: 'eligible_with_authorization',
    description: 'Curated for feasibility/startup packages. Requires site authorization to share.',
  },
  ephemeral_processing: {
    handlingMode: 'ephemeral_processing',
    evidenceBasis: 'reviewed_limited_retention',
    retained: false,
    sponsorFacing: false,
    defaultDisclosureStatus: 'not_eligible',
    description: 'Processed temporarily. Facts extracted, file discarded.',
  },
}

/** Get the mapping for a given handling mode */
export function getHandlingMapping(mode: DocumentHandlingMode): DocumentHandlingMapping {
  return DOCUMENT_HANDLING_MATRIX[mode]
}

// --------------------------------------------------------------------------
// Feasibility Folder metadata (extended per LOOP 2)
// --------------------------------------------------------------------------

export interface FeasibilityFolderMetadata {
  inFeasibilityFolder: boolean
  feasibilityFolderAddedAt?: string
  feasibilityFolderAddedBy?: string
  feasibilityFolderCategory?: string
  sponsorPackageEligible: boolean
  disclosureEligible: boolean
  requiresSiteAuthorization: boolean
  disclosureStatus: DisclosureStatus
  suggestedForFeasibilityFolder: boolean
  sensitivityWarning?: string
  redactionStatus: RedactionStatus
  redactionNotes?: string
  disclosureUse?: 'feasibility_and_startup' | 'qualification' | 'regulatory_startup'
  lastReviewedAt?: string
  expirationDate?: string
}

// --------------------------------------------------------------------------
// Document Intake Decision (LOOP 3)
// --------------------------------------------------------------------------

export interface DocumentIntakeDecision {
  documentId?: string
  temporaryUploadId?: string
  selectedHandlingMode: DocumentHandlingMode
  selectedBy: string
  selectedAt: string
  consentTextShown: string
  consentAccepted: boolean
  sensitivityWarningShown?: string
  redactionStatus?: RedactionStatus
}

// --------------------------------------------------------------------------
// Stored Document Record (LOOP 4)
// --------------------------------------------------------------------------

export interface StoredDocumentRecord {
  documentId: string
  organizationId: string
  storageUri?: string
  sourceHash?: string
  filename?: string
  mimeType?: string
  uploadedAt?: string
  uploadedBy?: string
  handlingMode: DocumentHandlingMode
  evidenceBasis: EvidenceBasis
  disclosureStatus: DisclosureStatus
  redactionStatus: RedactionStatus
  retained: boolean
  retentionLimitation?: string
}


// ==========================================================================
// KTP-1.5 — Feasibility Folder Suggestion Engine (LOOP 2)
// ==========================================================================
// Determines which documents should be suggested for the Feasibility Folder
// based on document type, sensitivity, and disclosure eligibility.
// ==========================================================================

export interface FeasibilitySuggestion {
  /** Whether this document is suggested for Feasibility Folder */
  suggested: boolean
  /** Reason for suggestion (or rejection) */
  reason: string
  /** Whether there are sensitivity concerns */
  hasSensitivityWarning: boolean
  /** Sensitivity warning text, if any */
  sensitivityWarning?: string
  /** Category within Feasibility Folder */
  suggestedCategory?: FeasibilityFolderCategory
  /** Whether redaction is suggested before adding */
  redactionSuggested: boolean
  /** Whether this document requires site authorization before sharing */
  requiresSiteAuthorization: boolean
}

export type FeasibilityFolderCategory =
  | 'regulatory_documents'
  | 'site_capability'
  | 'staff_qualifications'
  | 'facility_equipment'
  | 'quality_system'
  | 'study_experience'
  | 'biospecimen_handling'
  | 'data_management'
  | 'sponsor_references'
  | 'other'

/** Document types that SHOULD be suggested for Feasibility Folder */
const SUGGESTED_DOC_TYPES = new Set([
  'irb_approval_letter',
  'activation_letter',
  'closeout_letter',
  'lab_manual',
  'protocol_document',
  'enrollment_summary',
  'sponsor_correspondence',
  'cro_correspondence',
])

/** Document types that should NOT be suggested (sensitive/confidential) */
const EXCLUDED_DOC_TYPES = new Set([
  // Intentionally empty — we filter by content/sensitivity, not just type
])

/** Keywords that indicate sensitivity — document should not be auto-suggested */
const SENSITIVITY_KEYWORDS = [
  'confidential', 'proprietary', 'budget', 'contract', 'cta',
  'capa', 'audit finding', 'monitoring finding', 'phi',
  'source document', 'subject', 'patient', 'compensation',
]

/**
 * Evaluate whether a document should be suggested for the Feasibility Folder.
 *
 * Rules:
 *   - Suggested doc types → recommended
 *   - Sensitivity keywords → warning, not auto-suggested
 *   - Redaction-required documents → suggested but with redaction warning
 *   - All suggestions require site authorization before sharing
 */
export function evaluateFeasibilitySuggestion(params: {
  documentType: string
  documentLabel: string
  isUploaded: boolean
  redactionStatus?: RedactionStatus
  containsSensitiveInfo?: boolean
}): FeasibilitySuggestion {
  const { documentType, documentLabel, isUploaded, redactionStatus, containsSensitiveInfo } = params

  // Must be uploaded
  if (!isUploaded) {
    return {
      suggested: false,
      reason: 'Document not yet uploaded.',
      hasSensitivityWarning: false,
      redactionSuggested: false,
      requiresSiteAuthorization: true,
    }
  }

  // Check sensitivity keywords
  const lowerLabel = documentLabel.toLowerCase()
  const matchedKeywords = SENSITIVITY_KEYWORDS.filter(kw => lowerLabel.includes(kw))
  const isSensitive = matchedKeywords.length > 0 || containsSensitiveInfo === true

  if (isSensitive) {
    return {
      suggested: false,
      reason: 'Document may contain sensitive information: ' + matchedKeywords.join(', '),
      hasSensitivityWarning: true,
      sensitivityWarning: 'This document may contain confidential, financial, or PHI-related information. Review before adding to Feasibility Folder.',
      redactionSuggested: true,
      requiresSiteAuthorization: true,
    }
  }

  // Check redaction status
  if (redactionStatus === 'unknown' || redactionStatus === 'required') {
    return {
      suggested: false,
      reason: 'Redaction status is ' + redactionStatus + '. Resolve before adding to Feasibility Folder.',
      hasSensitivityWarning: true,
      sensitivityWarning: 'Redact sensitive information before adding to Feasibility Folder.',
      redactionSuggested: true,
      requiresSiteAuthorization: true,
    }
  }

  // Suggested document types
  if (SUGGESTED_DOC_TYPES.has(documentType)) {
    return {
      suggested: true,
      reason: 'This document type is commonly requested for feasibility and startup packages.',
      hasSensitivityWarning: false,
      suggestedCategory: mapDocTypeToCategory(documentType),
      redactionSuggested: false,
      requiresSiteAuthorization: true,
    }
  }

  // Default: not suggested but can be manually added
  return {
    suggested: false,
    reason: 'This document type is not automatically suggested. You may still add it manually.',
    hasSensitivityWarning: false,
    redactionSuggested: false,
    requiresSiteAuthorization: true,
  }
}

function mapDocTypeToCategory(docType: string): FeasibilityFolderCategory {
  const map: Record<string, FeasibilityFolderCategory> = {
    irb_approval_letter: 'regulatory_documents',
    activation_letter: 'study_experience',
    siv_report: 'study_experience',
    delegation_log: 'staff_qualifications',
    form_1572: 'regulatory_documents',
    closeout_letter: 'study_experience',
    lab_manual: 'biospecimen_handling',
    shipment_logs: 'biospecimen_handling',
    enrollment_summary: 'study_experience',
    sponsor_correspondence: 'sponsor_references',
    cro_correspondence: 'sponsor_references',
    protocol_document: 'regulatory_documents',
    informed_consent: 'regulatory_documents',
  }
  return map[docType] || 'other'
}
