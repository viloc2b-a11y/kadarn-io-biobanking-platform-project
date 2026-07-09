// ==========================================================================
// KTP-1.5 — Document Upload Router Tests (LOOP 10A)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  suggestDocumentRouting,
  checkEvidenceReadiness,
  canGenerateEvidenceNode,
  createTriageBatch,
  getSectionRoutingPreset,
  type RoutedDocument,
} from '../../apps/web/src/lib/documents/document-upload-router'

// ==========================================================================
// Routing Suggestions
// ==========================================================================

describe('suggestDocumentRouting — Staff Documents', () => {
  it('should route CV to person', () => {
    const result = suggestDocumentRouting({ documentType: 'cv' })
    expect(result.suggestedTarget.targetType).toBe('person')
    expect(result.suggestedTarget.section).toBe('people')
    expect(result.evidencePurpose).toBe('staff_qualification')
    expect(result.feasibilityEligible).toBe(true)
    expect(result.handlingMode).toBe('feasibility_folder')
    expect(result.autoSuggested).toBe(true)
  })

  it('should route medical license to person', () => {
    const result = suggestDocumentRouting({ documentType: 'medical_license' })
    expect(result.suggestedTarget.targetType).toBe('person')
    expect(result.claimCandidates).toContain('staff.qualification')
  })

  it('should route GCP certificate to person', () => {
    const result = suggestDocumentRouting({ documentType: 'gcp_certificate' })
    expect(result.suggestedTarget.targetType).toBe('person')
    expect(result.claimCandidates).toContain('staff.training')
  })

  it('should route IATA certificate to person', () => {
    const result = suggestDocumentRouting({ documentType: 'iata_certificate' })
    expect(result.suggestedTarget.targetType).toBe('person')
    expect(result.claimCandidates).toContain('biospecimen.shipping')
  })
})

describe('suggestDocumentRouting — Facility Documents', () => {
  it('should route CLIA certificate to facility', () => {
    const result = suggestDocumentRouting({ documentType: 'clia_certificate' })
    expect(result.suggestedTarget.targetType).toBe('facility')
    expect(result.suggestedTarget.section).toBe('infrastructure')
    expect(result.evidencePurpose).toBe('facility_certification')
  })
})

describe('suggestDocumentRouting — Equipment Documents', () => {
  it('should route calibration record to equipment', () => {
    const result = suggestDocumentRouting({ documentType: 'calibration_record' })
    expect(result.suggestedTarget.targetType).toBe('equipment')
    expect(result.evidencePurpose).toBe('equipment_readiness')
  })

  it('should route temperature log to equipment', () => {
    const result = suggestDocumentRouting({ documentType: 'temperature_log' })
    expect(result.suggestedTarget.targetType).toBe('equipment')
    expect(result.claimCandidates).toContain('biospecimen.cold_chain')
  })
})

describe('suggestDocumentRouting — Study Experience Documents', () => {
  it('should route IRB approval letter to study_experience', () => {
    const result = suggestDocumentRouting({ documentType: 'irb_approval_letter' })
    expect(result.suggestedTarget.targetType).toBe('study_experience')
    expect(result.claimCandidates).toContain('study.participation')
    expect(result.claimCandidates).toContain('regulatory.irb_pathway')
  })

  it('should route activation letter to study_experience', () => {
    const result = suggestDocumentRouting({ documentType: 'activation_letter' })
    expect(result.suggestedTarget.targetType).toBe('study_experience')
  })

  it('should route closeout letter to study_experience', () => {
    const result = suggestDocumentRouting({ documentType: 'closeout_letter' })
    expect(result.suggestedTarget.targetType).toBe('study_experience')
  })

  it('should route enrollment summary to study_experience', () => {
    const result = suggestDocumentRouting({ documentType: 'enrollment_summary' })
    expect(result.suggestedTarget.targetType).toBe('study_experience')
  })
})

describe('suggestDocumentRouting — Quality System Documents', () => {
  it('should route SOP index to quality_system', () => {
    const result = suggestDocumentRouting({ documentType: 'sop_index' })
    expect(result.suggestedTarget.targetType).toBe('quality_system')
    expect(result.suggestedTarget.section).toBe('quality')
    expect(result.claimCandidates).toContain('quality.sop_governance')
  })

  it('should route CAPA report to quality_system but private', () => {
    const result = suggestDocumentRouting({ documentType: 'capa_report' })
    expect(result.suggestedTarget.targetType).toBe('quality_system')
    expect(result.feasibilityEligible).toBe(false)
    expect(result.handlingMode).toBe('private_restricted')
  })
})

describe('suggestDocumentRouting — Organization Documents', () => {
  it('should route business license to organization', () => {
    const result = suggestDocumentRouting({ documentType: 'business_license' })
    expect(result.suggestedTarget.targetType).toBe('organization')
  })

  it('should route W-9 to organization', () => {
    const result = suggestDocumentRouting({ documentType: 'w9' })
    expect(result.suggestedTarget.targetType).toBe('organization')
  })

  it('should route insurance certificate to organization', () => {
    const result = suggestDocumentRouting({ documentType: 'insurance_certificate' })
    expect(result.suggestedTarget.targetType).toBe('organization')
  })
})

describe('suggestDocumentRouting — Sensitive Documents', () => {
  it('should route sponsor correspondence to study_experience but private', () => {
    const result = suggestDocumentRouting({ documentType: 'sponsor_correspondence' })
    expect(result.handlingMode).toBe('private_restricted')
    expect(result.feasibilityEligible).toBe(false)
  })

  it('should override to private when containsSensitiveInfo flag is set', () => {
    const result = suggestDocumentRouting({ documentType: 'cv', containsSensitiveInfo: true })
    expect(result.handlingMode).toBe('private_restricted')
    expect(result.feasibilityEligible).toBe(false)
    expect(result.warning).toBeDefined()
  })
})

// ==========================================================================
// Section-Aware Presets
// ==========================================================================

describe('getSectionRoutingPreset', () => {
  it('should preset People section to person target', () => {
    const preset = getSectionRoutingPreset('people')
    expect(preset.defaultTargetType).toBe('person')
  })

  it('should preset Study Experience section to study_experience target', () => {
    const preset = getSectionRoutingPreset('study_experience')
    expect(preset.defaultTargetType).toBe('study_experience')
  })

  it('should preset Equipment section to equipment target', () => {
    const preset = getSectionRoutingPreset('equipment')
    expect(preset.defaultTargetType).toBe('equipment')
  })
})

// ==========================================================================
// Fuzzy Matching
// ==========================================================================

describe('suggestDocumentRouting — Fuzzy matching by filename', () => {
  it('should match "Sarah_CV.pdf" to cv → person', () => {
    const result = suggestDocumentRouting({ filename: 'Sarah_CV.pdf' })
    expect(result.suggestedTarget.targetType).toBe('person')
    expect(result.autoSuggested).toBe(true)
  })

  it('should match "IRB_Approval_ABC123.pdf" to irb_approval_letter', () => {
    const result = suggestDocumentRouting({ filename: 'IRB_Approval_ABC123.pdf' })
    expect(result.suggestedTarget.targetType).toBe('study_experience')
  })

  it('should return needs_review for unrecognized filenames', () => {
    const result = suggestDocumentRouting({ filename: 'unknown_document.xyz' })
    expect(result.routingStatus).toBe('needs_review')
    expect(result.autoSuggested).toBe(false)
  })
})

// ==========================================================================
// Evidence Gating
// ==========================================================================

describe('checkEvidenceReadiness', () => {
  it('should return not_ready_unassigned for unassigned docs', () => {
    const doc: RoutedDocument = {
      documentId: 'd1', routingStatus: 'unassigned',
      evidenceReadiness: 'not_ready_unassigned', feasibilityEligible: false,
    }
    expect(checkEvidenceReadiness(doc)).toBe('not_ready_unassigned')
  })

  it('should return not_ready_needs_document_type when type missing', () => {
    const doc: RoutedDocument = {
      documentId: 'd1', routingStatus: 'assigned',
      primaryTarget: { targetType: 'person', confidence: 'user_selected' },
      evidenceReadiness: 'not_ready_needs_document_type', feasibilityEligible: true,
    }
    expect(checkEvidenceReadiness(doc)).toBe('not_ready_needs_document_type')
  })

  it('should return ready for fully assigned doc', () => {
    const doc: RoutedDocument = {
      documentId: 'd1', documentType: 'cv', routingStatus: 'assigned',
      primaryTarget: { targetType: 'person', targetId: 'p1', confidence: 'user_selected' },
      handlingMode: 'stored_evidence',
      evidenceReadiness: 'ready', feasibilityEligible: true,
    }
    expect(checkEvidenceReadiness(doc)).toBe('ready')
  })

  it('should return not_ready_private for private docs', () => {
    const doc: RoutedDocument = {
      documentId: 'd1', documentType: 'cv', routingStatus: 'assigned',
      primaryTarget: { targetType: 'person', targetId: 'p1', confidence: 'user_selected' },
      handlingMode: 'private_restricted',
      evidenceReadiness: 'not_ready_private', feasibilityEligible: false,
    }
    expect(checkEvidenceReadiness(doc)).toBe('not_ready_private')
  })
})

describe('canGenerateEvidenceNode', () => {
  it('should block unassigned documents', () => {
    const doc: RoutedDocument = {
      documentId: 'd1', routingStatus: 'unassigned',
      evidenceReadiness: 'not_ready_unassigned', feasibilityEligible: false,
    }
    const result = canGenerateEvidenceNode(doc)
    expect(result.canGenerate).toBe(false)
    expect(result.reason).toContain('no owner entity')
  })

  it('should allow fully assigned documents with claim candidates', () => {
    const doc: RoutedDocument = {
      documentId: 'd1', documentType: 'cv', routingStatus: 'assigned',
      primaryTarget: { targetType: 'person', targetId: 'p1', confidence: 'user_selected' },
      handlingMode: 'stored_evidence',
      claimCandidates: ['staff.qualification'],
      evidenceReadiness: 'ready', feasibilityEligible: true,
    }
    const result = canGenerateEvidenceNode(doc)
    expect(result.canGenerate).toBe(true)
  })

  it('should block when no claim candidates', () => {
    const doc: RoutedDocument = {
      documentId: 'd1', documentType: 'cv', routingStatus: 'assigned',
      primaryTarget: { targetType: 'person', targetId: 'p1', confidence: 'user_selected' },
      handlingMode: 'stored_evidence',
      claimCandidates: [],
      evidenceReadiness: 'ready', feasibilityEligible: true,
    }
    const result = canGenerateEvidenceNode(doc)
    expect(result.canGenerate).toBe(false)
    expect(result.reason).toContain('No claim candidates')
  })
})

// ==========================================================================
// Bulk Triage
// ==========================================================================

describe('createTriageBatch', () => {
  it('should create triage items with routing suggestions', () => {
    const batch = createTriageBatch({
      files: [
        { id: 'f1', filename: 'CV_Sarah.pdf', documentType: 'cv' },
        { id: 'f2', filename: 'CLIA_Cert.pdf', documentType: 'clia_certificate' },
        { id: 'f3', filename: 'unknown.xyz' },
      ],
    })
    expect(batch).toHaveLength(3)

    // CV → auto-suggested, low priority
    const cvItem = batch.find(b => b.documentType === 'cv')!
    expect(cvItem.routingStatus).toBe('suggested')
    expect(cvItem.triagePriority).toBe('low')
    expect(cvItem.primaryTarget?.targetType).toBe('person')

    // CLIA → auto-suggested, low priority
    const cliaItem = batch.find(b => b.documentType === 'clia_certificate')!
    expect(cliaItem.primaryTarget?.targetType).toBe('facility')

    // Unknown → needs review, high priority
    expect(batch[2].routingStatus).toBe('needs_review')
    expect(batch[2].triagePriority).toBe('high')
    expect(batch[2].actionRequired).toContain('manually')
  })

  it('should mark all triage items as not evidence-ready initially', () => {
    const batch = createTriageBatch({
      files: [{ id: 'f1', filename: 'test.pdf', documentType: 'cv' }],
    })
    expect(batch[0].evidenceReadiness).toBe('not_ready_unassigned')
    expect(batch[0].routingStatus).toBe('suggested') // suggested but not yet assigned
  })
})
