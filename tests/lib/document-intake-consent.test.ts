// ==========================================================================
// KTP-1.5 — Document Intake Consent Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  generateIntakeOptions,
  getDefaultHandlingMode,
  createIntakeDecision,
  validateIntakeChoice,
} from '../../apps/web/src/lib/documents/document-intake-consent'

// ==========================================================================
// generateIntakeOptions
// ==========================================================================

describe('generateIntakeOptions', () => {
  it('should return 6 options for an uploaded IRB letter', () => {
    const options = generateIntakeOptions({
      documentType: 'irb_approval_letter',
      documentLabel: 'IRB Approval Letter',
      isUploaded: true,
    })
    expect(options).toHaveLength(6)
  })

  it('should recommend feasibility_folder for suggested doc types', () => {
    const options = generateIntakeOptions({
      documentType: 'irb_approval_letter',
      documentLabel: 'IRB Approval Letter',
      isUploaded: true,
    })
    const ff = options.find(o => o.mode === 'feasibility_folder')!
    expect(ff.recommended).toBe(true)
  })

  it('should NOT recommend feasibility_folder for sensitive documents', () => {
    const options = generateIntakeOptions({
      documentType: 'other',
      documentLabel: 'Study Budget',
      isUploaded: true,
    })
    const ff = options.find(o => o.mode === 'feasibility_folder')!
    expect(ff.recommended).toBe(false)
    expect(ff.warning).toBeDefined()
  })

  it('should show retention info for each option', () => {
    const options = generateIntakeOptions({
      documentType: 'other',
      documentLabel: 'Test Doc',
      isUploaded: true,
    })
    for (const opt of options) {
      expect(opt.retentionSummary).toBeDefined()
      expect(opt.evidenceSummary).toBeDefined()
    }
  })

  it('should warn when uploaded file set to reference_only', () => {
    const options = generateIntakeOptions({
      documentType: 'other',
      documentLabel: 'Test Doc',
      isUploaded: true,
    })
    const ref = options.find(o => o.mode === 'reference_only')!
    expect(ref.warning).toContain('uploaded')
  })
})

// ==========================================================================
// getDefaultHandlingMode
// ==========================================================================

describe('getDefaultHandlingMode', () => {
  it('should default to reference_only when not uploaded', () => {
    const mode = getDefaultHandlingMode({ isUploaded: false })
    expect(mode).toBe('reference_only')
  })

  it('should default to private_restricted when uploaded', () => {
    const mode = getDefaultHandlingMode({ isUploaded: true })
    expect(mode).toBe('private_restricted')
  })

  it('should default to private_restricted when sensitive', () => {
    const mode = getDefaultHandlingMode({ isUploaded: true, containsSensitiveInfo: true })
    expect(mode).toBe('private_restricted')
  })

  it('should NEVER default to feasibility_folder (requires explicit consent)', () => {
    const mode = getDefaultHandlingMode({ isUploaded: true })
    expect(mode).not.toBe('feasibility_folder')
  })

  it('should NEVER default to stored_evidence without consent', () => {
    const mode = getDefaultHandlingMode({ isUploaded: true })
    expect(mode).not.toBe('stored_evidence')
  })
})

// ==========================================================================
// createIntakeDecision
// ==========================================================================

describe('createIntakeDecision', () => {
  it('should create a decision with consent text', () => {
    const decision = createIntakeDecision({
      documentId: 'doc-1',
      selectedMode: 'stored_evidence',
      selectedBy: 'user-1',
    })
    expect(decision.selectedHandlingMode).toBe('stored_evidence')
    expect(decision.consentAccepted).toBe(true)
    expect(decision.consentTextShown.length).toBeGreaterThan(0)
    expect(decision.selectedBy).toBe('user-1')
    expect(decision.selectedAt).toBeDefined()
  })

  it('should include consent text for each mode', () => {
    const modes = ['stored_evidence', 'reviewed_not_stored', 'reference_only', 'private_restricted', 'feasibility_folder', 'ephemeral_processing'] as const
    for (const mode of modes) {
      const decision = createIntakeDecision({
        selectedMode: mode,
        selectedBy: 'user-1',
      })
      expect(decision.consentTextShown).toBeDefined()
      expect(decision.consentTextShown.length).toBeGreaterThan(0)
    }
  })
})

// ==========================================================================
// validateIntakeChoice
// ==========================================================================

describe('validateIntakeChoice', () => {
  it('should allow stored_evidence when uploaded', () => {
    const result = validateIntakeChoice({ mode: 'stored_evidence', isUploaded: true })
    expect(result.valid).toBe(true)
  })

  it('should allow stored_evidence when not uploaded (deferred)', () => {
    const result = validateIntakeChoice({ mode: 'stored_evidence', isUploaded: false })
    expect(result.valid).toBe(true)
  })

  it('should block feasibility_folder when redaction is unknown', () => {
    const result = validateIntakeChoice({
      mode: 'feasibility_folder',
      isUploaded: true,
      redactionStatus: 'unknown',
    })
    expect(result.valid).toBe(false)
  })

  it('should block feasibility_folder when redaction is required', () => {
    const result = validateIntakeChoice({
      mode: 'feasibility_folder',
      isUploaded: true,
      redactionStatus: 'required',
    })
    expect(result.valid).toBe(false)
  })

  it('should block feasibility_folder when document is sensitive', () => {
    const result = validateIntakeChoice({
      mode: 'feasibility_folder',
      isUploaded: true,
      containsSensitiveInfo: true,
    })
    expect(result.valid).toBe(false)
  })

  it('should allow feasibility_folder when redaction is resolved', () => {
    const result = validateIntakeChoice({
      mode: 'feasibility_folder',
      isUploaded: true,
      redactionStatus: 'none',
    })
    expect(result.valid).toBe(true)
  })

  it('should always allow reference_only', () => {
    const result = validateIntakeChoice({ mode: 'reference_only', isUploaded: false })
    expect(result.valid).toBe(true)
  })
})
