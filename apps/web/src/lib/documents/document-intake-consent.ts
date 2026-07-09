// ==========================================================================
// KTP-1.5 — Document Intake Consent Engine (LOOP 3)
// ==========================================================================
// Provides the decision logic for document intake consent. The UI component
// (DocumentIntakeModal) uses this engine to present options, validate
// choices, and register consent decisions.
//
// Conservative defaults: if no mode is selected, defaults to 'reference_only'
// for external references and 'private_restricted' for uploaded files.
// ==========================================================================

import type {
  DocumentHandlingMode,
  DocumentIntakeDecision,
  RedactionStatus,
  FeasibilitySuggestion,
} from '@kadarn/types/document-handling'
import {
  DOCUMENT_HANDLING_MODE_LABELS,
  DOCUMENT_HANDLING_MATRIX,
  evaluateFeasibilitySuggestion,
} from '@kadarn/types/document-handling'

// --------------------------------------------------------------------------
// Intake option presented to the user
// --------------------------------------------------------------------------

export interface IntakeOption {
  mode: DocumentHandlingMode
  label: string
  description: string
  /** What happens to the file */
  retentionSummary: string
  /** What evidence support this provides */
  evidenceSummary: string
  /** Whether this is recommended for this document */
  recommended: boolean
  /** Warning to show before selecting */
  warning?: string
}

// --------------------------------------------------------------------------
// Consent text templates
// --------------------------------------------------------------------------

const CONSENT_TEXTS: Record<DocumentHandlingMode, string> = {
  stored_evidence:
    'I consent to Kadarn storing this document as internal evidence. ' +
    'The document will be retained and may be used for readiness evaluation. ' +
    'It will NOT be shared with sponsors without my explicit authorization.',
  reviewed_not_stored:
    'I consent to Kadarn reviewing this document to extract relevant facts. ' +
    'The source file will NOT be retained. Only extracted facts will be preserved.',
  reference_only:
    'I confirm this document is referenced for my records. ' +
    'Kadarn will NOT store, review, or process the file. ' +
    'No evidence will be derived from this reference.',
  private_restricted:
    'I consent to Kadarn storing this document as private/restricted. ' +
    'The document will be retained but will NEVER be sponsor-facing. ' +
    'It is for internal institutional use only.',
  feasibility_folder:
    'I consent to adding this document to my Feasibility Folder. ' +
    'The document will be retained and marked as eligible for future sponsor packages. ' +
    'It will NOT be shared without my explicit authorization for each package.',
  ephemeral_processing:
    'I consent to Kadarn processing this document temporarily. ' +
    'Relevant facts will be extracted. The source file will be discarded after processing.',
}

// --------------------------------------------------------------------------
// Generate intake options for a document
// --------------------------------------------------------------------------

export function generateIntakeOptions(params: {
  documentType: string
  documentLabel: string
  isUploaded: boolean
  redactionStatus?: RedactionStatus
  containsSensitiveInfo?: boolean
}): IntakeOption[] {
  const feasibility = evaluateFeasibilitySuggestion(params)
  const options: IntakeOption[] = []

  const allModes: DocumentHandlingMode[] = [
    'stored_evidence',
    'reviewed_not_stored',
    'reference_only',
    'private_restricted',
    'feasibility_folder',
    'ephemeral_processing',
  ]

  for (const mode of allModes) {
    const matrix = DOCUMENT_HANDLING_MATRIX[mode]
    const isRecommended =
      mode === 'feasibility_folder' ? feasibility.suggested : false

    const warning = buildWarning(mode, feasibility, params)

    options.push({
      mode,
      label: DOCUMENT_HANDLING_MODE_LABELS[mode],
      description: matrix.description,
      retentionSummary: matrix.retained
        ? 'File retained in Kadarn'
        : 'File NOT retained',
      evidenceSummary: matrix.evidenceBasis.replace(/_/g, ' '),
      recommended: isRecommended,
      warning,
    })
  }

  return options
}

function buildWarning(
  mode: DocumentHandlingMode,
  feasibility: FeasibilitySuggestion,
  params: { isUploaded: boolean; containsSensitiveInfo?: boolean },
): string | undefined {
  if (mode === 'feasibility_folder' && !feasibility.suggested && feasibility.hasSensitivityWarning) {
    return feasibility.sensitivityWarning
  }
  if (mode === 'stored_evidence' && params.containsSensitiveInfo) {
    return 'This document may contain sensitive information. Consider using Private/Restricted instead.'
  }
  if (mode === 'reference_only' && params.isUploaded) {
    return 'You have uploaded this file. Selecting Reference Only will not use the uploaded file as evidence.'
  }
  if (!params.isUploaded && (mode === 'stored_evidence' || mode === 'feasibility_folder')) {
    return 'No file uploaded. The document will be marked but no file will be stored until upload completes.'
  }
  return undefined
}

// --------------------------------------------------------------------------
// Default handling mode (conservative)
// --------------------------------------------------------------------------

/**
 * Determine the default handling mode for a document.
 * Conservative: reference_only for external refs, private_restricted for uploads.
 */
export function getDefaultHandlingMode(params: {
  isUploaded: boolean
  containsSensitiveInfo?: boolean
}): DocumentHandlingMode {
  if (!params.isUploaded) return 'reference_only'
  if (params.containsSensitiveInfo) return 'private_restricted'
  return 'private_restricted' // Conservative default: never auto-share
}

// --------------------------------------------------------------------------
// Register consent decision
// --------------------------------------------------------------------------

export function createIntakeDecision(params: {
  documentId?: string
  temporaryUploadId?: string
  selectedMode: DocumentHandlingMode
  selectedBy: string
  redactionStatus?: RedactionStatus
}): DocumentIntakeDecision {
  const consentText = CONSENT_TEXTS[params.selectedMode]
  const feasibility = params.documentId
    ? evaluateFeasibilitySuggestion({
        documentType: 'other',
        documentLabel: '',
        isUploaded: true,
        redactionStatus: params.redactionStatus,
      })
    : null

  return {
    documentId: params.documentId,
    temporaryUploadId: params.temporaryUploadId,
    selectedHandlingMode: params.selectedMode,
    selectedBy: params.selectedBy,
    selectedAt: new Date().toISOString(),
    consentTextShown: consentText,
    consentAccepted: true,
    sensitivityWarningShown: feasibility?.sensitivityWarning,
    redactionStatus: params.redactionStatus,
  }
}

// --------------------------------------------------------------------------
// Validation: can this mode be selected for this document?
// --------------------------------------------------------------------------

export function validateIntakeChoice(params: {
  mode: DocumentHandlingMode
  isUploaded: boolean
  redactionStatus?: RedactionStatus
  containsSensitiveInfo?: boolean
}): { valid: boolean; reason?: string } {
  if (!params.isUploaded && (params.mode === 'stored_evidence' || params.mode === 'feasibility_folder')) {
    return { valid: true, reason: 'No file uploaded. Mode will be applied when upload completes.' }
  }

  if (params.mode === 'feasibility_folder') {
    if (params.redactionStatus === 'unknown' || params.redactionStatus === 'required') {
      return { valid: false, reason: 'Redaction status must be resolved before adding to Feasibility Folder.' }
    }
    if (params.containsSensitiveInfo) {
      return { valid: false, reason: 'Sensitive documents should not be added to Feasibility Folder without review.' }
    }
  }

  return { valid: true }
}
