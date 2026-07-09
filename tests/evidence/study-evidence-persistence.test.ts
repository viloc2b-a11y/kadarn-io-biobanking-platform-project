// ==========================================================================
// KTP-1.4 — Study Evidence Persistence Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  createStudyExperienceRecord,
  classifyStudyEvidence,
  generateStudyEvidenceNodePayloads,
  type StudyExperienceRecord,
} from '../../apps/web/src/lib/onboarding/study-experience-record'
import {
  prepareEvidenceNodeInserts,
  generateIdempotencyKey,
  linkPersistedEvidenceNodes,
  getEvidenceNodeInsertStatements,
} from '../../packages/evidence-core/src/study-evidence-persistence'

// --------------------------------------------------------------------------
// Helpers
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
    ...overrides,
  })
  return { ...record, evidenceStatus: classifyStudyEvidence(record) }
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
  return { ...updated, evidenceStatus: classifyStudyEvidence(updated) }
}

// ==========================================================================
// prepareEvidenceNodeInserts
// ==========================================================================

describe('prepareEvidenceNodeInserts', () => {
  it('should prepare payloads for uploaded IRB letter', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const result = prepareEvidenceNodeInserts('org-1', study.id, payloads)
    expect(result.prepared.length).toBeGreaterThanOrEqual(1)
    const irbPayloads = result.prepared.filter(p =>
      p._study_metadata.supported_component === 'site_irb_approval'
    )
    expect(irbPayloads.length).toBeGreaterThanOrEqual(1)
    expect(irbPayloads[0].evidence_class).toBe('B')
    expect(irbPayloads[0].weight).toBe(0.5)
  })

  it('should prepare payloads for enrollment summary', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001', enrollmentEnrolledReported: 50 }), 'enrollment_summary')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const result = prepareEvidenceNodeInserts('org-1', study.id, payloads)
    const enrollmentPayloads = result.prepared.filter(p =>
      p._study_metadata.supported_component === 'enrollment_performance'
    )
    expect(enrollmentPayloads.length).toBeGreaterThanOrEqual(1)
    expect(enrollmentPayloads[0].evidence_class).toBe('C')
  })

  it('should mark sponsor correspondence with sponsor_correspondence source type', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'sponsor_correspondence')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const result = prepareEvidenceNodeInserts('org-1', study.id, payloads)
    expect(result.prepared.length).toBeGreaterThan(0)
    const sourceTypes = result.prepared.map(p => p._study_metadata.source_type)
    expect(sourceTypes).toContain('sponsor_correspondence')
  })

  it('should skip non-uploaded documents', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter', false)
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const result = prepareEvidenceNodeInserts('org-1', study.id, payloads)
    expect(result.prepared.length).toBe(0)
  })

  it('should include provenance in each prepared payload', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const result = prepareEvidenceNodeInserts('org-1', study.id, payloads)
    for (const p of result.prepared) {
      expect(p.provenance).toBeDefined()
      expect(p.provenance.summary).toBeDefined()
      expect(p.provenance.transformation_history).toBeDefined()
      expect(p.provenance.transformation_history).toContain('evidence_node_prepared')
    }
  })

  it('should include visibility metadata', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const result = prepareEvidenceNodeInserts('org-1', study.id, payloads)
    for (const p of result.prepared) {
      expect(p.visibility).toBeDefined()
      expect(p.visibility.owning_organization_id).toBe('org-1')
      expect(p.visibility.scope).toBe('organization')
    }
  })

  it('should report missing prerequisites for claim creation', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const result = prepareEvidenceNodeInserts('org-1', study.id, payloads)
    expect(result.missingPrerequisites.length).toBeGreaterThan(0)
    expect(result.missingPrerequisites[0]).toContain('Claims must exist')
  })
})

// ==========================================================================
// generateIdempotencyKey
// ==========================================================================

describe('generateIdempotencyKey', () => {
  it('should produce the same key for same inputs', () => {
    const key1 = generateIdempotencyKey('org-1', 'study-1', 'doc-1', 'site_irb_approval')
    const key2 = generateIdempotencyKey('org-1', 'study-1', 'doc-1', 'site_irb_approval')
    expect(key1).toBe(key2)
  })

  it('should produce different keys for different components', () => {
    const key1 = generateIdempotencyKey('org-1', 'study-1', 'doc-1', 'site_irb_approval')
    const key2 = generateIdempotencyKey('org-1', 'study-1', 'doc-1', 'site_participation')
    expect(key1).not.toBe(key2)
  })

  it('should produce different keys for different documents', () => {
    const key1 = generateIdempotencyKey('org-1', 'study-1', 'doc-1', 'site_irb_approval')
    const key2 = generateIdempotencyKey('org-1', 'study-1', 'doc-2', 'site_irb_approval')
    expect(key1).not.toBe(key2)
  })

  it('should prevent duplicates within same batch', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const result = prepareEvidenceNodeInserts('org-1', study.id, payloads)
    // No duplicate idempotency keys in prepared payloads
    const keys = result.prepared.map(p => p._idempotency_key)
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })
})

// ==========================================================================
// linkPersistedEvidenceNodes
// ==========================================================================

describe('linkPersistedEvidenceNodes', () => {
  it('should update links with persisted evidence node IDs', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter')
    const links = [
      {
        studyExperienceRecordId: study.id,
        studyDocumentId: study.documents[0].id,
        uploadedDocLabel: null,
        evidenceNodeId: null,
        supportedComponent: 'site_irb_approval' as const,
        supportLevel: 'FULL_SUPPORT' as const,
        evidenceBasis: 'DOCUMENT_SUPPORTED' as const,
        reviewStatus: 'not_reviewed' as const,
        limitations: [],
      },
    ]

    const key = generateIdempotencyKey('org-1', study.id, study.documents[0].id, 'site_irb_approval')
    const persistedIds = new Map([[key, 'ev-node-123']])

    const updated = linkPersistedEvidenceNodes(links, persistedIds, 'org-1', study.id)
    expect(updated[0].evidenceNodeId).toBe('ev-node-123')
    expect(updated[0].reviewStatus).toBe('under_review')
  })

  it('should not update link if no matching persisted node', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter')
    const links = [
      {
        studyExperienceRecordId: study.id,
        studyDocumentId: study.documents[0].id,
        uploadedDocLabel: null,
        evidenceNodeId: null,
        supportedComponent: 'site_irb_approval' as const,
        supportLevel: 'FULL_SUPPORT' as const,
        evidenceBasis: 'DOCUMENT_SUPPORTED' as const,
        reviewStatus: 'not_reviewed' as const,
        limitations: [],
      },
    ]

    const updated = linkPersistedEvidenceNodes(links, new Map(), 'org-1', study.id)
    expect(updated[0].evidenceNodeId).toBeNull()
  })
})

// ==========================================================================
// getEvidenceNodeInsertStatements
// ==========================================================================

describe('getEvidenceNodeInsertStatements', () => {
  it('should generate valid INSERT SQL for prepared payloads', () => {
    const study = addDoc(makeStudy({ protocolNumber: 'A-001' }), 'irb_approval_letter')
    const payloads = generateStudyEvidenceNodePayloads(study, 'org-1')
    const result = prepareEvidenceNodeInserts('org-1', study.id, payloads)
    const statements = getEvidenceNodeInsertStatements(result.prepared)
    expect(statements.length).toBeGreaterThan(0)
    for (const stmt of statements) {
      expect(stmt).toContain('INSERT INTO evidence_nodes')
      expect(stmt).toContain('claim_id')
      expect(stmt).toContain('evidence_class')
      expect(stmt).toContain('provenance')
    }
  })
})
