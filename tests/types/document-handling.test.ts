// ==========================================================================
// KTP-1.5 — Document Handling Modes & Matrix Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  isRetained,
  isEvidenceEligible,
  isEvidenceBacked,
  isSponsorFacing,
  getHandlingMapping,
  DOCUMENT_HANDLING_MATRIX,
  evaluateFeasibilitySuggestion,
  type DocumentHandlingMode,
  type EvidenceBasis,
  type DisclosureStatus,
  type RedactionStatus,
} from '../../packages/types/src/document-handling'

// ==========================================================================
// Retention
// ==========================================================================

describe('isRetained', () => {
  it('should return true for stored_evidence', () => {
    expect(isRetained('stored_evidence')).toBe(true)
  })

  it('should return true for feasibility_folder', () => {
    expect(isRetained('feasibility_folder')).toBe(true)
  })

  it('should return true for private_restricted', () => {
    expect(isRetained('private_restricted')).toBe(true)
  })

  it('should return false for reviewed_not_stored', () => {
    expect(isRetained('reviewed_not_stored')).toBe(false)
  })

  it('should return false for reference_only', () => {
    expect(isRetained('reference_only')).toBe(false)
  })

  it('should return false for ephemeral_processing', () => {
    expect(isRetained('ephemeral_processing')).toBe(false)
  })
})

// ==========================================================================
// Evidence Eligibility
// ==========================================================================

describe('isEvidenceEligible', () => {
  it('should return false for reference_only', () => {
    expect(isEvidenceEligible('reference_only')).toBe(false)
  })

  it('should return true for stored_evidence', () => {
    expect(isEvidenceEligible('stored_evidence')).toBe(true)
  })

  it('should return true for reviewed_not_stored', () => {
    expect(isEvidenceEligible('reviewed_not_stored')).toBe(true)
  })
})

// ==========================================================================
// Evidence Backed
// ==========================================================================

describe('isEvidenceBacked', () => {
  it('should return true for document_supported', () => {
    expect(isEvidenceBacked('document_supported')).toBe(true)
  })

  it('should return true for externally_corroborated', () => {
    expect(isEvidenceBacked('externally_corroborated')).toBe(true)
  })

  it('should return false for self_reported', () => {
    expect(isEvidenceBacked('self_reported')).toBe(false)
  })

  it('should return false for referenced_only', () => {
    expect(isEvidenceBacked('referenced_only')).toBe(false)
  })
})

// ==========================================================================
// Sponsor Facing
// ==========================================================================

describe('isSponsorFacing', () => {
  it('should return true for document_supported_shareable', () => {
    expect(isSponsorFacing('document_supported_shareable')).toBe(true)
  })

  it('should return true for externally_corroborated', () => {
    expect(isSponsorFacing('externally_corroborated')).toBe(true)
  })

  it('should return false for document_supported', () => {
    expect(isSponsorFacing('document_supported')).toBe(false)
  })

  it('should return false for document_supported_internal', () => {
    expect(isSponsorFacing('document_supported_internal')).toBe(false)
  })

  it('should return false for self_reported', () => {
    expect(isSponsorFacing('self_reported')).toBe(false)
  })
})

// ==========================================================================
// Mapping Matrix
// ==========================================================================

describe('DOCUMENT_HANDLING_MATRIX', () => {
  it('should have 6 entries', () => {
    expect(Object.keys(DOCUMENT_HANDLING_MATRIX)).toHaveLength(6)
  })

  it('stored_evidence → document_supported, retained, not sponsor-facing by default', () => {
    const m = DOCUMENT_HANDLING_MATRIX.stored_evidence
    expect(m.evidenceBasis).toBe('document_supported')
    expect(m.retained).toBe(true)
    expect(m.sponsorFacing).toBe(false)
    expect(m.defaultDisclosureStatus).toBe('not_eligible')
  })

  it('reviewed_not_stored → document_reviewed_not_stored, not retained', () => {
    const m = DOCUMENT_HANDLING_MATRIX.reviewed_not_stored
    expect(m.evidenceBasis).toBe('document_reviewed_not_stored')
    expect(m.retained).toBe(false)
  })

  it('reference_only → referenced_only, not retained, not evidence-eligible', () => {
    const m = DOCUMENT_HANDLING_MATRIX.reference_only
    expect(m.evidenceBasis).toBe('referenced_only')
    expect(m.retained).toBe(false)
    expect(isEvidenceEligible('reference_only')).toBe(false)
  })

  it('private_restricted → document_supported_internal, retained, not sponsor-facing', () => {
    const m = DOCUMENT_HANDLING_MATRIX.private_restricted
    expect(m.evidenceBasis).toBe('document_supported_internal')
    expect(m.retained).toBe(true)
    expect(m.sponsorFacing).toBe(false)
  })

  it('feasibility_folder → document_supported_shareable, retained, eligible with authorization', () => {
    const m = DOCUMENT_HANDLING_MATRIX.feasibility_folder
    expect(m.evidenceBasis).toBe('document_supported_shareable')
    expect(m.retained).toBe(true)
    expect(m.sponsorFacing).toBe(true)
    expect(m.defaultDisclosureStatus).toBe('eligible_with_authorization')
    // Feasibility Folder is NOT shared automatically
    expect(m.defaultDisclosureStatus).not.toBe('shared')
    expect(m.defaultDisclosureStatus).not.toBe('authorized_for_package')
  })

  it('ephemeral_processing → reviewed_limited_retention, not retained', () => {
    const m = DOCUMENT_HANDLING_MATRIX.ephemeral_processing
    expect(m.evidenceBasis).toBe('reviewed_limited_retention')
    expect(m.retained).toBe(false)
  })
})

// ==========================================================================
// getHandlingMapping
// ==========================================================================

describe('getHandlingMapping', () => {
  it('should return correct mapping for each mode', () => {
    for (const mode of Object.keys(DOCUMENT_HANDLING_MATRIX) as DocumentHandlingMode[]) {
      const mapping = getHandlingMapping(mode)
      expect(mapping.handlingMode).toBe(mode)
      expect(mapping.evidenceBasis).toBeDefined()
    }
  })
})

// ==========================================================================
// reviewed_not_stored ≠ stored_evidence
// ==========================================================================

describe('reviewed_not_stored vs stored_evidence', () => {
  it('reviewed_not_stored should NOT be treated as stored_evidence', () => {
    const reviewed = DOCUMENT_HANDLING_MATRIX.reviewed_not_stored
    const stored = DOCUMENT_HANDLING_MATRIX.stored_evidence
    expect(reviewed.retained).not.toBe(stored.retained)
    expect(reviewed.evidenceBasis).not.toBe(stored.evidenceBasis)
  })
})

// ==========================================================================
// reference_only does NOT elevate to document_supported
// ==========================================================================

describe('reference_only does not elevate', () => {
  it('reference_only should not be evidence-backed', () => {
    expect(isEvidenceBacked('referenced_only')).toBe(false)
  })

  it('reference_only should not be sponsor-facing', () => {
    expect(isSponsorFacing('referenced_only')).toBe(false)
  })
})

// ==========================================================================
// private_restricted is not sponsor-facing
// ==========================================================================

describe('private_restricted is not sponsor-facing', () => {
  it('private_restricted should not be sponsor-facing', () => {
    expect(isSponsorFacing('document_supported_internal')).toBe(false)
  })
})

// ==========================================================================
// feasibility_folder eligible with authorization, not shared automatically
// ==========================================================================

describe('feasibility_folder authorization', () => {
  it('should be eligible_with_authorization, not shared', () => {
    const m = DOCUMENT_HANDLING_MATRIX.feasibility_folder
    expect(m.defaultDisclosureStatus).toBe('eligible_with_authorization')
    expect(m.defaultDisclosureStatus).not.toBe('shared')
    expect(m.defaultDisclosureStatus).not.toBe('authorized_for_package')
  })
})


// ==========================================================================
// Feasibility Folder Suggestion Engine
// ==========================================================================

describe('evaluateFeasibilitySuggestion', () => {
  it('should suggest IRB approval letter for Feasibility Folder', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'irb_approval_letter',
      documentLabel: 'IRB Approval Letter',
      isUploaded: true,
    })
    expect(result.suggested).toBe(true)
    expect(result.requiresSiteAuthorization).toBe(true)
    expect(result.suggestedCategory).toBe('regulatory_documents')
  })

  it('should suggest activation letter', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'activation_letter',
      documentLabel: 'Site Activation Letter',
      isUploaded: true,
    })
    expect(result.suggested).toBe(true)
  })

  it('should suggest closeout letter', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'closeout_letter',
      documentLabel: 'Closeout Letter',
      isUploaded: true,
    })
    expect(result.suggested).toBe(true)
  })

  it('should suggest lab manual', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'lab_manual',
      documentLabel: 'Lab Manual',
      isUploaded: true,
    })
    expect(result.suggested).toBe(true)
    expect(result.suggestedCategory).toBe('biospecimen_handling')
  })

  it('should suggest enrollment summary', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'enrollment_summary',
      documentLabel: 'Enrollment Summary',
      isUploaded: true,
    })
    expect(result.suggested).toBe(true)
  })

  it('should suggest sponsor correspondence', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'sponsor_correspondence',
      documentLabel: 'Sponsor Confirmation Letter',
      isUploaded: true,
    })
    expect(result.suggested).toBe(true)
    expect(result.suggestedCategory).toBe('sponsor_references')
  })

  it('should NOT suggest if not uploaded', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'irb_approval_letter',
      documentLabel: 'IRB Approval Letter',
      isUploaded: false,
    })
    expect(result.suggested).toBe(false)
  })

  it('should warn about sensitive documents (budget)', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'other',
      documentLabel: 'Study Budget',
      isUploaded: true,
    })
    expect(result.suggested).toBe(false)
    expect(result.hasSensitivityWarning).toBe(true)
  })

  it('should warn about sensitive documents (contract)', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'other',
      documentLabel: 'CTA Contract',
      isUploaded: true,
    })
    expect(result.suggested).toBe(false)
    expect(result.hasSensitivityWarning).toBe(true)
  })

  it('should warn about CAPA documents', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'other',
      documentLabel: 'CAPA Report',
      isUploaded: true,
    })
    expect(result.suggested).toBe(false)
    expect(result.hasSensitivityWarning).toBe(true)
  })

  it('should warn about PHI-containing documents', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'other',
      documentLabel: 'Patient Enrollment Log',
      isUploaded: true,
    })
    expect(result.suggested).toBe(false)
    expect(result.hasSensitivityWarning).toBe(true)
  })

  it('should warn when redaction is unknown', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'irb_approval_letter',
      documentLabel: 'IRB Approval Letter',
      isUploaded: true,
      redactionStatus: 'unknown',
    })
    expect(result.suggested).toBe(false)
    expect(result.redactionSuggested).toBe(true)
  })

  it('should warn when redaction is required', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'irb_approval_letter',
      documentLabel: 'IRB Approval Letter',
      isUploaded: true,
      redactionStatus: 'required',
    })
    expect(result.suggested).toBe(false)
    expect(result.redactionSuggested).toBe(true)
  })

  it('should always require site authorization', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'irb_approval_letter',
      documentLabel: 'IRB Approval Letter',
      isUploaded: true,
    })
    expect(result.requiresSiteAuthorization).toBe(true)
  })

  it('should NOT auto-suggest documents with explicit sensitivity flag', () => {
    const result = evaluateFeasibilitySuggestion({
      documentType: 'irb_approval_letter',
      documentLabel: 'IRB Approval Letter',
      isUploaded: true,
      containsSensitiveInfo: true,
    })
    expect(result.suggested).toBe(false)
    expect(result.hasSensitivityWarning).toBe(true)
  })
})
