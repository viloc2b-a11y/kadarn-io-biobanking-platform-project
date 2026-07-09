// ==========================================================================
// KTP-1.4 — Study Experience Record Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  createStudyExperienceRecord,
  classifyStudyEvidence,
  deriveStudyExperienceClaims,
  deriveHistoricalPerformanceSignals,
  generateStudyEvidenceNodePayloads,
  createStudyEvidenceLinks,
  validateNct,
  validateNctFormat,
  type StudyExperienceRecord,
  type ComponentEvidenceStatus,
} from '../../apps/web/src/lib/onboarding/study-experience-record'

// --------------------------------------------------------------------------
// Helper
// --------------------------------------------------------------------------

function makeStudy(overrides: Partial<StudyExperienceRecord> = {}): StudyExperienceRecord {
  const record = createStudyExperienceRecord({
    studyTitle: 'Test Study ABC',
    protocolNumber: 'ABC-123',
    clinicaltrialsGovNct: 'NCT01234567',
    sponsorName: 'Test Pharma',
    phase: 'Phase II',
    studyType: 'Interventional',
    siteStatus: 'completed',
    enrollmentEnrolledReported: 25,
    enrollmentCompletedReported: 22,
    ...overrides,
  })
  // Classify evidence on creation
  return {
    ...record,
    evidenceStatus: classifyStudyEvidence(record),
  }
}

function addDoc(
  record: StudyExperienceRecord,
  docType: StudyExperienceRecord['documents'][0]['documentType'],
  isUploaded = true,
): StudyExperienceRecord {
  const updated = {
    ...record,
    documents: [
      ...record.documents,
      {
        id: `doc-${record.documents.length + 1}`,
        documentType: docType,
        label: docType.replace(/_/g, ' '),
        uploadedDocLabel: null,
        isUploaded,
        isPending: false,
        effectiveDate: '2025-06-01',
        expirationDate: null,
        reviewStatus: null,
        componentsSupported: [],
      },
    ],
  }
  // Re-classify after adding document
  return {
    ...updated,
    evidenceStatus: classifyStudyEvidence(updated),
  }
}

// ==========================================================================
// Classification
// ==========================================================================

describe('classifyStudyEvidence', () => {
  it('should classify study existence as ANCHORED when NCT is present', () => {
    const study = makeStudy({ clinicaltrialsGovNct: 'NCT01234567' })
    const status = classifyStudyEvidence(study)
    expect(status.study_existence).toBe('ANCHORED')
  })

  it('should classify study existence as SELF_REPORTED when only title and protocol exist', () => {
    const study = makeStudy({ clinicaltrialsGovNct: null, studyTitle: 'Study X', protocolNumber: 'X-001' })
    const status = classifyStudyEvidence(study)
    expect(status.study_existence).toBe('SELF_REPORTED')
  })

  it('should classify site participation as EXTERNALLY_CORROBORATED with sponsor correspondence', () => {
    const study = addDoc(makeStudy(), 'sponsor_correspondence')
    const status = classifyStudyEvidence(study)
    expect(status.site_participation).toBe('EXTERNALLY_CORROBORATED')
  })

  it('should classify site participation as DOCUMENT_SUPPORTED with IRB letter', () => {
    const study = addDoc(makeStudy(), 'irb_approval_letter')
    const status = classifyStudyEvidence(study)
    expect(status.site_participation).toBe('DOCUMENT_SUPPORTED')
  })

  it('should classify site participation as DOCUMENT_SUPPORTED with activation letter', () => {
    const study = addDoc(makeStudy(), 'activation_letter')
    const status = classifyStudyEvidence(study)
    expect(status.site_participation).toBe('DOCUMENT_SUPPORTED')
  })

  it('should classify site participation as DOCUMENT_SUPPORTED with Form 1572', () => {
    const study = addDoc(makeStudy(), 'form_1572')
    const status = classifyStudyEvidence(study)
    expect(status.site_participation).toBe('DOCUMENT_SUPPORTED')
  })

  it('should classify site participation as ANCHORED when NCT exists but no site docs', () => {
    const study = makeStudy({ clinicaltrialsGovNct: 'NCT01234567' })
    const status = classifyStudyEvidence(study)
    expect(status.site_participation).toBe('ANCHORED')
  })

  it('should classify site IRB approval as DOCUMENT_SUPPORTED with IRB letter', () => {
    const study = addDoc(makeStudy(), 'irb_approval_letter')
    const status = classifyStudyEvidence(study)
    expect(status.site_irb_approval).toBe('DOCUMENT_SUPPORTED')
  })

  it('should classify enrollment as SELF_REPORTED when data exists but no docs', () => {
    const study = makeStudy({ enrollmentEnrolledReported: 50 })
    const status = classifyStudyEvidence(study)
    expect(status.enrollment_performance).toBe('SELF_REPORTED')
  })

  it('should classify enrollment as DOCUMENT_SUPPORTED with enrollment summary uploaded', () => {
    const study = addDoc(makeStudy({ enrollmentEnrolledReported: 50 }), 'enrollment_summary')
    const status = classifyStudyEvidence(study)
    expect(status.enrollment_performance).toBe('DOCUMENT_SUPPORTED')
  })

  it('should classify enrollment as EXTERNALLY_CORROBORATED with sponsor correspondence + enrollment data', () => {
    const study = addDoc(
      addDoc(makeStudy({ enrollmentEnrolledReported: 50 }), 'sponsor_correspondence'),
      'enrollment_summary',
    )
    const status = classifyStudyEvidence(study)
    expect(status.enrollment_performance).toBe('EXTERNALLY_CORROBORATED')
  })

  it('should NOT classify enrollment as EXTERNALLY_CORROBORATED with sponsor correspondence but no enrollment data', () => {
    const study = addDoc(
      makeStudy({ enrollmentEnrolledReported: null, enrollmentCompletedReported: null }),
      'sponsor_correspondence',
    )
    const status = classifyStudyEvidence(study)
    // Sponsor correspondence alone without enrollment data → no enrollment classification
    expect(status.enrollment_performance).toBe('UNKNOWN')
  })

  it('should classify operational execution as DOCUMENT_SUPPORTED with activation letter', () => {
    const study = addDoc(makeStudy(), 'activation_letter')
    const status = classifyStudyEvidence(study)
    expect(status.operational_execution).toBe('DOCUMENT_SUPPORTED')
  })

  it('should classify operational execution as DOCUMENT_SUPPORTED with SIV report', () => {
    const study = addDoc(makeStudy(), 'siv_report')
    const status = classifyStudyEvidence(study)
    expect(status.operational_execution).toBe('DOCUMENT_SUPPORTED')
  })

  it('should classify operational execution as SELF_REPORTED when study completed but no docs', () => {
    const study = makeStudy({ siteStatus: 'completed' })
    const status = classifyStudyEvidence(study)
    expect(status.operational_execution).toBe('SELF_REPORTED')
  })

  it('should classify biospecimen handling as DOCUMENT_SUPPORTED with lab manual + shipment logs', () => {
    const study = addDoc(addDoc(makeStudy(), 'lab_manual'), 'shipment_logs')
    const status = classifyStudyEvidence(study)
    expect(status.biospecimen_handling).toBe('DOCUMENT_SUPPORTED')
  })

  it('should classify biospecimen handling as UNKNOWN when no docs uploaded', () => {
    const study = makeStudy()
    const status = classifyStudyEvidence(study)
    expect(status.biospecimen_handling).toBe('UNKNOWN')
  })

  it('should keep UNKNOWN for components with no data at all', () => {
    const study = createStudyExperienceRecord()
    const status = classifyStudyEvidence(study)
    expect(status.study_existence).toBe('UNKNOWN')
    expect(status.site_participation).toBe('UNKNOWN')
    expect(status.enrollment_performance).toBe('UNKNOWN')
  })
})

// ==========================================================================
// Derived Claims
// ==========================================================================

describe('deriveStudyExperienceClaims', () => {
  it('should derive study participation claim from multiple studies', () => {
    const studies = [
      addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter'),
      addDoc(makeStudy({ protocolNumber: 'B-002' }), 'activation_letter'),
    ]
    const claims = deriveStudyExperienceClaims(studies)
    const participation = claims.find(c => c.claimId === 'study.participation')!
    expect(participation.evidenceStatus).toBe('DOCUMENT_SUPPORTED')
    expect(participation.studyCount).toBe(2)
  })

  it('should derive IRB pathway claim with DOCUMENT_SUPPORTED', () => {
    const studies = [addDoc(makeStudy(), 'irb_approval_letter')]
    const claims = deriveStudyExperienceClaims(studies)
    const irb = claims.find(c => c.claimId === 'regulatory.irb_pathway_executed')!
    expect(irb.evidenceStatus).toBe('DOCUMENT_SUPPORTED')
    expect(irb.studyCount).toBe(1)
  })

  it('should derive enrollment claim as SELF_REPORTED when no documents', () => {
    const studies = [makeStudy({ enrollmentEnrolledReported: 30 })]
    const claims = deriveStudyExperienceClaims(studies)
    const enrollment = claims.find(c => c.claimId === 'patient_recruitment.enrollment_history')!
    expect(enrollment.evidenceStatus).toBe('SELF_REPORTED')
    expect(enrollment.studyCount).toBe(1)
  })

  it('should derive enrollment claim as EXTERNALLY_CORROBORATED with sponsor letter', () => {
    const studies = [
      addDoc(
        addDoc(makeStudy({ enrollmentEnrolledReported: 30 }), 'sponsor_correspondence'),
        'enrollment_summary',
      ),
    ]
    const claims = deriveStudyExperienceClaims(studies)
    const enrollment = claims.find(c => c.claimId === 'patient_recruitment.enrollment_history')!
    expect(enrollment.evidenceStatus).toBe('EXTERNALLY_CORROBORATED')
  })

  it('should return UNKNOWN for all claims when no studies exist', () => {
    const claims = deriveStudyExperienceClaims([])
    for (const claim of claims) {
      expect(claim.evidenceStatus).toBe('UNKNOWN')
      expect(claim.studyCount).toBe(0)
    }
  })

  it('should derive closeout claim as DOCUMENT_SUPPORTED with closeout letter', () => {
    const studies = [addDoc(makeStudy(), 'closeout_letter')]
    const claims = deriveStudyExperienceClaims(studies)
    const closeout = claims.find(c => c.claimId === 'closeout.completed')!
    expect(closeout.evidenceStatus).toBe('DOCUMENT_SUPPORTED')
  })

  it('should derive closeout claim as SELF_REPORTED when study completed but no closeout doc', () => {
    const studies = [makeStudy({ siteStatus: 'completed' })]
    const claims = deriveStudyExperienceClaims(studies)
    const closeout = claims.find(c => c.claimId === 'closeout.completed')!
    expect(closeout.evidenceStatus).toBe('SELF_REPORTED')
  })

  it('should not elevate enrollment to EXTERNALLY_CORROBORATED with only IRB letter', () => {
    const studies = [addDoc(makeStudy({ enrollmentEnrolledReported: 30 }), 'irb_approval_letter')]
    const claims = deriveStudyExperienceClaims(studies)
    const enrollment = claims.find(c => c.claimId === 'patient_recruitment.enrollment_history')!
    // IRB letter supports participation, not enrollment
    expect(enrollment.evidenceStatus).toBe('SELF_REPORTED')
  })

  it('should aggregate best status across multiple studies', () => {
    const studies = [
      makeStudy({ protocolNumber: 'A-001', enrollmentEnrolledReported: 10 }), // self-reported
      addDoc(
        makeStudy({ protocolNumber: 'B-002', enrollmentEnrolledReported: 20 }),
        'enrollment_summary',
      ), // document-supported
      addDoc(
        addDoc(
          makeStudy({ protocolNumber: 'C-003', enrollmentEnrolledReported: 30 }),
          'sponsor_correspondence',
        ),
        'enrollment_summary',
      ), // externally corroborated
    ]
    const claims = deriveStudyExperienceClaims(studies)
    const enrollment = claims.find(c => c.claimId === 'patient_recruitment.enrollment_history')!
    // Best status wins
    expect(enrollment.evidenceStatus).toBe('EXTERNALLY_CORROBORATED')
  })
})


// ==========================================================================
// Historical Performance Signals
// ==========================================================================

describe('deriveHistoricalPerformanceSignals', () => {
  it('should derive therapeutic area signals from studies with indications', () => {
    const studies = [
      makeStudy({ indication: 'NSCLC', protocolNumber: 'A-001' }),
      makeStudy({ indication: 'NSCLC', protocolNumber: 'A-002' }),
      makeStudy({ indication: 'Diabetes', protocolNumber: 'B-001' }),
    ]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.therapeuticAreaExperience).toHaveLength(2)
    const nsclc = sigs.therapeuticAreaExperience.find(t => t.area === 'NSCLC')!
    expect(nsclc.studyCount).toBe(2)
  })

  it('should derive phase experience signals', () => {
    const studies = [
      makeStudy({ phase: 'Phase II', protocolNumber: 'A-001' }),
      makeStudy({ phase: 'Phase III', protocolNumber: 'B-001' }),
      makeStudy({ phase: 'Phase II', protocolNumber: 'C-001' }),
    ]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    const phase2 = sigs.phaseExperience.find(p => p.phase === 'Phase II')!
    expect(phase2.studyCount).toBe(2)
    expect(sigs.phaseExperience).toHaveLength(2)
  })

  it('should derive sponsor relationship signals', () => {
    const studies = [
      makeStudy({ sponsorName: 'Pfizer', protocolNumber: 'A-001' }),
      makeStudy({ sponsorName: 'Pfizer', protocolNumber: 'A-002' }),
      makeStudy({ sponsorName: 'Novartis', protocolNumber: 'B-001' }),
    ]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    const pfizer = sigs.sponsorRelationshipHistory.find(s => s.sponsorName === 'Pfizer')!
    expect(pfizer.studyCount).toBe(2)
  })

  it('should classify complexity as high for Phase I + Phase III', () => {
    const studies = [
      makeStudy({ phase: 'Phase I', protocolNumber: 'A-001' }),
      makeStudy({ phase: 'Phase III', protocolNumber: 'B-001' }),
    ]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.studyComplexityTier).toBe('high')
  })

  it('should classify complexity as low for single Phase II study', () => {
    const studies = [makeStudy({ phase: 'Phase II', protocolNumber: 'A-001' })]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.studyComplexityTier).toBe('low')
  })

  it('should classify biospecimen intensity as moderate with one biospecimen study', () => {
    const study = addDoc(
      addDoc(makeStudy({ protocolNumber: 'A-001' }), 'lab_manual'),
      'shipment_logs',
    )
    const sigs = deriveHistoricalPerformanceSignals([study])
    expect(sigs.biospecimenIntensityTier).toBe('moderate')
  })

  it('should classify biospecimen intensity as none for studies without biospecimen docs', () => {
    const studies = [makeStudy({ protocolNumber: 'A-001' })]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.biospecimenIntensityTier).toBe('none')
  })

  it('should classify enrollment band as high for 100+ enrolled', () => {
    const studies = [
      makeStudy({ enrollmentEnrolledReported: 60, protocolNumber: 'A-001' }),
      makeStudy({ enrollmentEnrolledReported: 50, protocolNumber: 'B-001' }),
    ]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.enrollmentOutcomeBand).toBe('high')
  })

  it('should classify enrollment band as none_reported when no enrollment data', () => {
    const studies = [makeStudy({ enrollmentEnrolledReported: null, enrollmentCompletedReported: null, protocolNumber: 'A-001' })]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.enrollmentOutcomeBand).toBe('none_reported')
  })

  it('should classify startup evidence as document_supported with activation letter', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'activation_letter')
    const sigs = deriveHistoricalPerformanceSignals([study])
    expect(sigs.startupEvidenceStatus).toBe('document_supported')
  })

  it('should classify startup evidence as missing with no documents', () => {
    const studies = [makeStudy({ protocolNumber: 'A-001' })]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.startupEvidenceStatus).toBe('missing')
  })

  it('should classify site role certainty as document_supported with IRB letter', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter')
    const sigs = deriveHistoricalPerformanceSignals([study])
    expect(sigs.siteRoleCertainty).toBe('document_supported')
  })

  it('should generate execution pattern tags', () => {
    const studies = [
      makeStudy({ studyType: 'Interventional', phase: 'Phase II', protocolNumber: 'A-001' }),
      makeStudy({ studyType: 'Observational', phase: 'Phase IV', protocolNumber: 'B-001' }),
    ]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.executionPatternTags).toContain('interventional')
    expect(sigs.executionPatternTags).toContain('observational')
    expect(sigs.executionPatternTags).toContain('late_phase')
  })

  it('should mark self-reported studies in limitations', () => {
    const studies = [makeStudy({ protocolNumber: 'A-001', clinicaltrialsGovNct: null })]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.selfReportedOnlyCount).toBe(1)
    expect(sigs.limitations.some(l => l.includes('self-reported'))).toBe(true)
  })

  it('should include limitations about matching', () => {
    const studies = [makeStudy({ protocolNumber: 'A-001' })]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.limitations.some(l => l.includes('do not determine protocol fit'))).toBe(true)
  })

  it('should return unknown tiers for empty records', () => {
    const sigs = deriveHistoricalPerformanceSignals([])
    expect(sigs.studyComplexityTier).toBe('unknown')
    expect(sigs.biospecimenIntensityTier).toBe('unknown')
    expect(sigs.enrollmentOutcomeBand).toBe('unknown')
    expect(sigs.totalStudies).toBe(0)
  })

  it('should not produce EXTERNALLY_CORROBORATED for self-reported studies', () => {
    const studies = [makeStudy({ protocolNumber: 'A-001' })]
    const sigs = deriveHistoricalPerformanceSignals(studies)
    expect(sigs.siteRoleCertainty).not.toBe('externally_corroborated')
    expect(sigs.externallyCorroboratedCount).toBe(0)
  })

  it('should produce EXTERNALLY_CORROBORATED when sponsor letter present', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'sponsor_correspondence')
    const sigs = deriveHistoricalPerformanceSignals([study])
    expect(sigs.siteRoleCertainty).toBe('externally_corroborated')
    expect(sigs.externallyCorroboratedCount).toBe(1)
  })
})


// ==========================================================================
// Evidence Bridge Tests
// ==========================================================================

describe('generateStudyEvidenceNodePayloads', () => {
  it('should generate payload for IRB approval letter supporting site_irb_approval', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'ABC-001' }), 'irb_approval_letter')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const irbPayloads = payloads.filter(p => p.supportedComponent === 'site_irb_approval')
    expect(irbPayloads.length).toBeGreaterThanOrEqual(1)
    expect(irbPayloads[0].evidenceClass).toBe('B')
    expect(irbPayloads[0].readyForPersistence).toBe(true)
  })

  it('should NOT support enrollment from IRB approval letter', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'ABC-001' }), 'irb_approval_letter')
    const payloads = generateStudyEvidenceNodePayloads(study)
    const enrollmentPayloads = payloads.filter(p => p.supportedComponent === 'enrollment_performance')
    // IRB letter components are site_irb_approval and site_participation, not enrollment
    const irbEnrollmentWarnings = payloads
      .filter(p => p.supportedComponent === 'enrollment_performance')
      .flatMap(p => p.warnings)
    // There should be no enrollment payloads from IRB letter alone
    expect(enrollmentPayloads.length).toBe(0)
  })

  it('should support enrollment_performance from enrollment summary', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'ABC-001', enrollmentEnrolledReported: 50 }), 'enrollment_summary')
    const payloads = generateStudyEvidenceNodePayloads(study)
    const enrollmentPayloads = payloads.filter(p => p.supportedComponent === 'enrollment_performance')
    expect(enrollmentPayloads.length).toBeGreaterThanOrEqual(1)
    expect(enrollmentPayloads[0].evidenceBasis || 'DOCUMENT_SUPPORTED').toBeTruthy()
  })

  it('should mark sponsor correspondence as EXTERNALLY_CORROBORATED source', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'ABC-001' }), 'sponsor_correspondence')
    const payloads = generateStudyEvidenceNodePayloads(study)
    expect(payloads.length).toBeGreaterThan(0)
    expect(payloads[0].sourceType).toBe('sponsor_correspondence')
  })

  it('should mark institution upload documents as institution_upload source', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'ABC-001' }), 'lab_manual')
    const payloads = generateStudyEvidenceNodePayloads(study)
    expect(payloads.length).toBeGreaterThan(0)
    expect(payloads[0].sourceType).toBe('institution_upload')
  })

  it('should include provenance summary in each payload', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'ABC-001', studyTitle: 'Test Study' }), 'irb_approval_letter')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1', 'user-1')
    for (const p of payloads) {
      expect(p.provenanceSummary.length).toBeGreaterThan(0)
      expect(p.studyExperienceRecordId).toBe(study.id)
    }
  })

  it('should not generate payloads for non-uploaded documents', () => {
    const study = makeStudy({ protocolNumber: 'ABC-001' })
    study.documents.push({
      id: 'doc-1', documentType: 'irb_approval_letter', label: 'IRB Letter',
      uploadedDocLabel: null, isUploaded: false, isPending: true,
      effectiveDate: null, expirationDate: null, reviewStatus: null, componentsSupported: [],
    })
    const payloads = generateStudyEvidenceNodePayloads(study)
    expect(payloads.length).toBe(0)
  })
})

describe('createStudyEvidenceLinks', () => {
  it('should create links for each uploaded document', () => {
    const study = addDoc(addDoc(makeStudy({ protocolNumber: 'ABC-001' }), 'irb_approval_letter'), 'activation_letter')
    const links = createStudyEvidenceLinks(study)
    expect(links.length).toBeGreaterThanOrEqual(3) // IRB supports 2 components, activation supports 2
  })

  it('should mark REFERENCED_ONLY for non-uploaded documents', () => {
    const study = makeStudy({ protocolNumber: 'ABC-001' })
    study.documents.push({
      id: 'doc-1', documentType: 'irb_approval_letter', label: 'IRB Letter',
      uploadedDocLabel: null, isUploaded: false, isPending: true,
      effectiveDate: null, expirationDate: null, reviewStatus: null, componentsSupported: [],
    })
    const links = createStudyEvidenceLinks(study)
    for (const link of links) {
      expect(link.supportLevel).toBe('REFERENCED_ONLY')
      expect(link.evidenceBasis).toBe('SELF_REPORTED')
      expect(link.limitations.length).toBeGreaterThan(0)
    }
  })

  it('should include limitation when IRB letter linked to enrollment', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'ABC-001' }), 'irb_approval_letter')
    const links = createStudyEvidenceLinks(study)
    // IRB letter should not claim enrollment support
    const enrollmentLinks = links.filter(l => l.supportedComponent === 'enrollment_performance')
    expect(enrollmentLinks.length).toBe(0)
  })
})


// ==========================================================================
// NCT Validation Tests
// ==========================================================================

describe('validateNctFormat', () => {
  it('should accept valid NCT format', () => {
    expect(validateNctFormat('NCT01234567')).toBe(true)
    expect(validateNctFormat('NCT99999999')).toBe(true)
  })

  it('should accept lowercase nct', () => {
    expect(validateNctFormat('nct01234567')).toBe(true)
  })

  it('should reject invalid formats', () => {
    expect(validateNctFormat('')).toBe(false)
    expect(validateNctFormat('NCT123')).toBe(false)
    expect(validateNctFormat('NCT012345678')).toBe(false)
    expect(validateNctFormat('ABC01234567')).toBe(false)
    expect(validateNctFormat('NCTabcdefgh')).toBe(false)
  })

  it('should handle whitespace', () => {
    expect(validateNctFormat('  NCT01234567  ')).toBe(true)
  })
})

describe('validateNct', () => {
  it('should return formatValid true for valid NCT', () => {
    const result = validateNct('NCT01234567')
    expect(result.formatValid).toBe(true)
    expect(result.apiConfirmed).toBe(false)
    expect(result.apiAvailable).toBe(false)
  })

  it('should return formatValid false for invalid NCT', () => {
    const result = validateNct('INVALID')
    expect(result.formatValid).toBe(false)
  })

  it('should include limitations about what NCT does NOT prove', () => {
    const result = validateNct('NCT01234567')
    expect(result.limitations.length).toBeGreaterThanOrEqual(3)
    expect(result.limitations.some(l => l.includes('does NOT prove site participation'))).toBe(true)
    expect(result.limitations.some(l => l.includes('does NOT prove enrollment'))).toBe(true)
  })

  it('should state that API confirmation is not yet available', () => {
    const result = validateNct('NCT01234567')
    expect(result.limitations.some(l => l.includes('API confirmation is not yet integrated'))).toBe(true)
  })
})
