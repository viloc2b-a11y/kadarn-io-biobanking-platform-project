// ==========================================================================
// KTP-1.5 — Document Upload & Storage Policy (LOOP 4)
// ==========================================================================
// Bridges the gap between Study Experience documents, real uploaded files
// (onboarding UploadedDoc[]), and DocumentHandlingMode.
//
// Rules:
//   - stored_evidence / feasibility_folder / private_restricted → retain file
//   - reviewed_not_stored / ephemeral_processing → extract facts, discard file
//   - reference_only → no file expected, no upload required
//
// Current state: maps StudyExperienceDocument to UploadedDoc references.
// Actual file storage (Supabase Storage) is deferred to backend integration.
// ==========================================================================

import type {
  DocumentHandlingMode,
  EvidenceBasis,
  DisclosureStatus,
  RedactionStatus,
  StoredDocumentRecord,
} from '@kadarn/types/document-handling'
import { DOCUMENT_HANDLING_MATRIX, isRetained } from '@kadarn/types/document-handling'

// --------------------------------------------------------------------------
// Uploaded document reference (mirrors onboarding UploadedDoc)
// --------------------------------------------------------------------------

export interface UploadedDocRef {
  label: string
  type: string
  uploaded: boolean
  fileName?: string
  fileSize?: number
  status?: 'uploaded' | 'converting' | 'converted' | 'failed'
  evidenceClass?: 'A' | 'B' | 'C' | 'D'
  proves?: string[]
  pending?: boolean
  notApplicable?: boolean
  expiresAt?: string
}

// --------------------------------------------------------------------------
// Storage policy result
// --------------------------------------------------------------------------

export interface StoragePolicyResult {
  /** Whether the file should be retained */
  shouldRetain: boolean
  /** Whether upload is expected for this document */
  uploadExpected: boolean
  /** Whether the document is ready for evidence processing */
  readyForEvidence: boolean
  /** Current storage status */
  storageStatus: 'not_uploaded' | 'uploaded' | 'processing' | 'retained' | 'discarded' | 'not_expected'
  /** Limitations or warnings */
  limitations: string[]
  /** The StoredDocumentRecord if retention applies */
  storedRecord: StoredDocumentRecord | null
}

// --------------------------------------------------------------------------
// Evaluate storage policy for a document
// --------------------------------------------------------------------------

export function evaluateStoragePolicy(params: {
  documentId: string
  organizationId: string
  handlingMode: DocumentHandlingMode
  uploadedDoc: UploadedDocRef | null
  filename?: string
  mimeType?: string
}): StoragePolicyResult {
  const { documentId, organizationId, handlingMode, uploadedDoc, filename, mimeType } = params
  const mapping = DOCUMENT_HANDLING_MATRIX[handlingMode]
  const limitations: string[] = []

  // Determine if upload is expected
  const uploadExpected = handlingMode !== 'reference_only'

  // Determine storage status
  let storageStatus: StoragePolicyResult['storageStatus']
  if (!uploadExpected) {
    storageStatus = 'not_expected'
  } else if (!uploadedDoc || !uploadedDoc.uploaded) {
    storageStatus = 'not_uploaded'
    limitations.push('Document not yet uploaded. Evidence support is limited until upload completes.')
  } else if (uploadedDoc.status === 'converting' || uploadedDoc.status === 'failed') {
    storageStatus = 'processing'
    limitations.push('Document upload is in progress or failed.')
  } else {
    storageStatus = isRetained(handlingMode) ? 'retained' : 'discarded'
  }

  // Determine if ready for evidence
  const readyForEvidence = storageStatus === 'retained' || storageStatus === 'discarded'

  // Build StoredDocumentRecord if retained
  let storedRecord: StoredDocumentRecord | null = null
  if (isRetained(handlingMode) && uploadedDoc?.uploaded) {
    storedRecord = {
      documentId,
      organizationId,
      storageUri: uploadedDoc.fileName ? `kadarn://documents/${organizationId}/${uploadedDoc.fileName}` : undefined,
      sourceHash: undefined, // Would be computed at upload time
      filename: uploadedDoc.fileName || filename,
      mimeType,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'system',
      handlingMode,
      evidenceBasis: mapping.evidenceBasis,
      disclosureStatus: mapping.defaultDisclosureStatus,
      redactionStatus: 'unknown',
      retained: true,
    }
  }

  // Add handling-mode-specific limitations
  if (handlingMode === 'reviewed_not_stored') {
    limitations.push('File reviewed but not retained. Only extracted facts are preserved.')
  }
  if (handlingMode === 'ephemeral_processing') {
    limitations.push('File processed temporarily and discarded. Facts extracted, source not retained.')
  }
  if (handlingMode === 'private_restricted') {
    limitations.push('Document retained as private/restricted. Never sponsor-facing.')
  }
  if (handlingMode === 'feasibility_folder') {
    limitations.push('Document retained in Feasibility Folder. Requires site authorization before sharing.')
  }

  return {
    shouldRetain: isRetained(handlingMode),
    uploadExpected,
    readyForEvidence,
    storageStatus,
    limitations,
    storedRecord,
  }
}

// --------------------------------------------------------------------------
// Map Study Experience document to storage policy
// --------------------------------------------------------------------------

export function mapStudyDocumentToStorage(params: {
  studyDocId: string
  studyDocType: string
  studyDocLabel: string
  isUploaded: boolean
  organizationId: string
  handlingMode: DocumentHandlingMode
  uploadedDocs: UploadedDocRef[]
}): StoragePolicyResult & { linkedUploadedDoc: UploadedDocRef | null } {
  const { studyDocId, studyDocLabel, isUploaded, organizationId, handlingMode, uploadedDocs } = params

  // Try to find a matching uploaded document by label
  const linkedDoc = uploadedDocs.find(
    d => d.label.toLowerCase().includes(studyDocLabel.toLowerCase()) ||
         studyDocLabel.toLowerCase().includes(d.label.toLowerCase())
  ) || null

  const storageResult = evaluateStoragePolicy({
    documentId: studyDocId,
    organizationId,
    handlingMode,
    uploadedDoc: linkedDoc,
    filename: linkedDoc?.fileName,
  })

  return { ...storageResult, linkedUploadedDoc: linkedDoc }
}

// --------------------------------------------------------------------------
// Batch evaluation for Study Experience records
// --------------------------------------------------------------------------

export function evaluateStudyDocumentStorage(params: {
  organizationId: string
  studyDocuments: Array<{
    id: string
    documentType: string
    label: string
    isUploaded: boolean
    handlingMode: DocumentHandlingMode
  }>
  uploadedDocs: UploadedDocRef[]
}): Map<string, StoragePolicyResult & { linkedUploadedDoc: UploadedDocRef | null }> {
  const results = new Map<string, StoragePolicyResult & { linkedUploadedDoc: UploadedDocRef | null }>()

  for (const doc of params.studyDocuments) {
    const result = mapStudyDocumentToStorage({
      studyDocId: doc.id,
      studyDocType: doc.documentType,
      studyDocLabel: doc.label,
      isUploaded: doc.isUploaded,
      organizationId: params.organizationId,
      handlingMode: doc.handlingMode,
      uploadedDocs: params.uploadedDocs,
    })
    results.set(doc.id, result)
  }

  return results
}
