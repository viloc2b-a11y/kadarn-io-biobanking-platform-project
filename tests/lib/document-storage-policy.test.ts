// ==========================================================================
// KTP-1.5 — Document Storage Policy Tests (LOOP 4)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  evaluateStoragePolicy,
  mapStudyDocumentToStorage,
  type UploadedDocRef,
} from '../../apps/web/src/lib/documents/document-storage-policy'

// ==========================================================================
// evaluateStoragePolicy
// ==========================================================================

describe('evaluateStoragePolicy', () => {
  it('should retain file for stored_evidence with uploaded doc', () => {
    const result = evaluateStoragePolicy({
      documentId: 'doc-1',
      organizationId: 'org-1',
      handlingMode: 'stored_evidence',
      uploadedDoc: { label: 'Test', type: 'pdf', uploaded: true, fileName: 'test.pdf' },
    })
    expect(result.shouldRetain).toBe(true)
    expect(result.storageStatus).toBe('retained')
    expect(result.storedRecord).not.toBeNull()
    expect(result.storedRecord!.retained).toBe(true)
    expect(result.storedRecord!.handlingMode).toBe('stored_evidence')
  })

  it('should retain file for feasibility_folder', () => {
    const result = evaluateStoragePolicy({
      documentId: 'doc-1',
      organizationId: 'org-1',
      handlingMode: 'feasibility_folder',
      uploadedDoc: { label: 'Test', type: 'pdf', uploaded: true, fileName: 'test.pdf' },
    })
    expect(result.shouldRetain).toBe(true)
    expect(result.storageStatus).toBe('retained')
    expect(result.limitations.some(l => l.includes('Feasibility Folder'))).toBe(true)
  })

  it('should retain file for private_restricted', () => {
    const result = evaluateStoragePolicy({
      documentId: 'doc-1',
      organizationId: 'org-1',
      handlingMode: 'private_restricted',
      uploadedDoc: { label: 'Test', type: 'pdf', uploaded: true, fileName: 'test.pdf' },
    })
    expect(result.shouldRetain).toBe(true)
    expect(result.limitations.some(l => l.includes('private/restricted'))).toBe(true)
  })

  it('should NOT retain file for reviewed_not_stored', () => {
    const result = evaluateStoragePolicy({
      documentId: 'doc-1',
      organizationId: 'org-1',
      handlingMode: 'reviewed_not_stored',
      uploadedDoc: { label: 'Test', type: 'pdf', uploaded: true, fileName: 'test.pdf' },
    })
    expect(result.shouldRetain).toBe(false)
    expect(result.storageStatus).toBe('discarded')
    expect(result.storedRecord).toBeNull()
    expect(result.limitations.some(l => l.includes('not retained'))).toBe(true)
  })

  it('should NOT retain file for ephemeral_processing', () => {
    const result = evaluateStoragePolicy({
      documentId: 'doc-1',
      organizationId: 'org-1',
      handlingMode: 'ephemeral_processing',
      uploadedDoc: { label: 'Test', type: 'pdf', uploaded: true, fileName: 'test.pdf' },
    })
    expect(result.shouldRetain).toBe(false)
    expect(result.storageStatus).toBe('discarded')
    expect(result.limitations.some(l => l.includes('discarded'))).toBe(true)
  })

  it('should show not_uploaded when no uploaded doc', () => {
    const result = evaluateStoragePolicy({
      documentId: 'doc-1',
      organizationId: 'org-1',
      handlingMode: 'stored_evidence',
      uploadedDoc: null,
    })
    expect(result.storageStatus).toBe('not_uploaded')
    expect(result.shouldRetain).toBe(true)
    expect(result.storedRecord).toBeNull()
  })

  it('should show not_expected for reference_only', () => {
    const result = evaluateStoragePolicy({
      documentId: 'doc-1',
      organizationId: 'org-1',
      handlingMode: 'reference_only',
      uploadedDoc: null,
    })
    expect(result.storageStatus).toBe('not_expected')
    expect(result.uploadExpected).toBe(false)
  })

  it('should show processing for converting docs', () => {
    const result = evaluateStoragePolicy({
      documentId: 'doc-1',
      organizationId: 'org-1',
      handlingMode: 'stored_evidence',
      uploadedDoc: { label: 'Test', type: 'pdf', uploaded: true, fileName: 'test.pdf', status: 'converting' },
    })
    expect(result.storageStatus).toBe('processing')
  })

  it('should include evidence basis from matrix in stored record', () => {
    const result = evaluateStoragePolicy({
      documentId: 'doc-1',
      organizationId: 'org-1',
      handlingMode: 'feasibility_folder',
      uploadedDoc: { label: 'Test', type: 'pdf', uploaded: true, fileName: 'test.pdf' },
    })
    expect(result.storedRecord!.evidenceBasis).toBe('document_supported_shareable')
    expect(result.storedRecord!.disclosureStatus).toBe('eligible_with_authorization')
  })
})

// ==========================================================================
// mapStudyDocumentToStorage
// ==========================================================================

describe('mapStudyDocumentToStorage', () => {
  const uploadedDocs: UploadedDocRef[] = [
    { label: 'IRB Approval Letter', type: 'pdf', uploaded: true, fileName: 'irb.pdf' },
    { label: 'Lab Manual v2', type: 'pdf', uploaded: true, fileName: 'lab.pdf' },
    { label: 'Pending Doc', type: 'pdf', uploaded: false, pending: true },
  ]

  it('should find matching uploaded doc by label', () => {
    const result = mapStudyDocumentToStorage({
      studyDocId: 'sd-1',
      studyDocType: 'irb_approval_letter',
      studyDocLabel: 'IRB Approval Letter',
      isUploaded: true,
      organizationId: 'org-1',
      handlingMode: 'stored_evidence',
      uploadedDocs,
    })
    expect(result.linkedUploadedDoc).not.toBeNull()
    expect(result.linkedUploadedDoc!.fileName).toBe('irb.pdf')
    expect(result.storageStatus).toBe('retained')
  })

  it('should find matching doc by partial label match', () => {
    const result = mapStudyDocumentToStorage({
      studyDocId: 'sd-2',
      studyDocType: 'lab_manual',
      studyDocLabel: 'Lab Manual',
      isUploaded: true,
      organizationId: 'org-1',
      handlingMode: 'stored_evidence',
      uploadedDocs,
    })
    expect(result.linkedUploadedDoc).not.toBeNull()
    expect(result.linkedUploadedDoc!.fileName).toBe('lab.pdf')
  })

  it('should return null link when no match found', () => {
    const result = mapStudyDocumentToStorage({
      studyDocId: 'sd-3',
      studyDocType: 'other',
      studyDocLabel: 'Unknown Document',
      isUploaded: true,
      organizationId: 'org-1',
      handlingMode: 'stored_evidence',
      uploadedDocs,
    })
    expect(result.linkedUploadedDoc).toBeNull()
    expect(result.storageStatus).toBe('not_uploaded')
  })
})
