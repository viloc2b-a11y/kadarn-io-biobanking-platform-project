// ==========================================================================
// KTP-1.5 — Pilot Workspace Reset Tests (LOOP 10C)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  scanWorkspace,
  resetPilotWorkspace,
  createViloPilotSeed,
} from '../../apps/web/src/lib/documents/pilot-workspace-reset'

// ==========================================================================
// Fixtures
// ==========================================================================

const DEMO_UPLOADED_DOCS = [
  { label: 'CV_Sarah_Chen_demo.pdf', type: 'cv', uploaded: true, fileName: 'CV_Sarah_Chen_demo.pdf' },
  { label: 'CLIA_Cert_Main_Lab.pdf', type: 'clia_certificate', uploaded: true, fileName: 'CLIA_Cert.pdf' },
  { label: 'walkthrough_test_doc.pdf', type: 'other', uploaded: false, fileName: 'walkthrough_test_doc.pdf' },
  { label: 'Real_Business_License.pdf', type: 'business_license', uploaded: true, fileName: 'Real_Business_License.pdf' },
]

const DEMO_STUDIES = [
  {
    id: 'study-1', studyTitle: 'Demo Study ABC',
    documents: [
      { id: 'd1', label: 'IRB_Approval_demo.pdf', isUploaded: true, documentType: 'irb_approval_letter' },
      { id: 'd2', label: 'Activation_Letter.pdf', isUploaded: true, documentType: 'activation_letter' },
    ],
  },
  {
    id: 'study-2', studyTitle: 'Real Study XYZ — Oncology',
    documents: [
      { id: 'd3', label: 'Enrollment_Summary_Q1.pdf', isUploaded: true, documentType: 'enrollment_summary' },
    ],
  },
]

// ==========================================================================
// scanWorkspace
// ==========================================================================

describe('scanWorkspace', () => {
  it('should detect demo documents by label keywords', () => {
    const inventory = scanWorkspace({
      uploadedDocs: DEMO_UPLOADED_DOCS,
      studyRecords: [],
    })
    expect(inventory.summary.demoItems).toBeGreaterThanOrEqual(1)
    expect(inventory.summary.totalItems).toBe(4)
  })

  it('should detect orphan (not uploaded) documents', () => {
    const inventory = scanWorkspace({
      uploadedDocs: DEMO_UPLOADED_DOCS,
      studyRecords: [],
    })
    expect(inventory.summary.orphanItems).toBeGreaterThanOrEqual(1)
  })

  it('should recommend delete for demo items', () => {
    const inventory = scanWorkspace({
      uploadedDocs: DEMO_UPLOADED_DOCS,
      studyRecords: [],
    })
    expect(inventory.summary.deleteRecommended).toBeGreaterThanOrEqual(1)
  })

  it('should recommend preserve for real-looking items', () => {
    const inventory = scanWorkspace({
      uploadedDocs: DEMO_UPLOADED_DOCS,
      studyRecords: [],
    })
    expect(inventory.summary.preserveRecommended).toBeGreaterThanOrEqual(1)
  })

  it('should scan study experience documents', () => {
    const inventory = scanWorkspace({
      uploadedDocs: [],
      studyRecords: DEMO_STUDIES,
    })
    expect(inventory.studyDocs.length).toBeGreaterThanOrEqual(2)
  })

  it('should mark demo studies for deletion', () => {
    const inventory = scanWorkspace({
      uploadedDocs: [],
      studyRecords: DEMO_STUDIES,
    })
    const demoStudyDocs = inventory.studyDocs.filter(d => d.label.includes('Demo'))
    expect(demoStudyDocs.length).toBeGreaterThanOrEqual(1)
  })

  it('should preserve entity records', () => {
    const inventory = scanWorkspace({
      uploadedDocs: [],
      studyRecords: [],
      organizationName: 'Vilo Research Group',
    })
    expect(inventory.entityRecords.length).toBe(1)
    expect(inventory.entityRecords[0].recommendedAction).toBe('preserve')
  })
})

// ==========================================================================
// resetPilotWorkspace
// ==========================================================================

describe('resetPilotWorkspace', () => {
  it('should report items to delete in dry run', () => {
    const result = resetPilotWorkspace({
      uploadedDocs: DEMO_UPLOADED_DOCS,
      studyRecords: DEMO_STUDIES,
      dryRun: true,
    })
    expect(result.dryRun).toBe(true)
    expect(result.itemsDeleted).toBe(0)
    expect(result.itemsAffected).toBeGreaterThan(0)
    expect(result.warnings.some(w => w.includes('Dry run'))).toBe(true)
  })

  it('should remove demo documents in real reset', () => {
    const result = resetPilotWorkspace({
      uploadedDocs: DEMO_UPLOADED_DOCS,
      studyRecords: DEMO_STUDIES,
      dryRun: false,
    })
    expect(result.dryRun).toBe(false)
    expect(result.itemsDeleted).toBeGreaterThan(0)
  })

  it('should preserve real-looking documents', () => {
    const result = resetPilotWorkspace({
      uploadedDocs: DEMO_UPLOADED_DOCS,
      studyRecords: DEMO_STUDIES,
      dryRun: false,
    })
    expect(result.itemsPreserved).toBeGreaterThan(0)
  })

  it('should report DB cleanup as skipped', () => {
    const result = resetPilotWorkspace({
      uploadedDocs: [],
      studyRecords: [],
      dryRun: false,
    })
    expect(result.dbCleanupSkipped).toBe(true)
    expect(result.dbCleanupReason).toContain('0 rows')
  })

  it('should report storage cleanup as skipped', () => {
    const result = resetPilotWorkspace({
      uploadedDocs: [],
      studyRecords: [],
      dryRun: false,
    })
    expect(result.storageCleanupSkipped).toBe(true)
    expect(result.storageCleanupReason).toContain('simulated')
  })

  it('should warn if no demo items found (workspace already clean)', () => {
    const result = resetPilotWorkspace({
      uploadedDocs: [{ label: 'Real_Doc.pdf', type: 'other', uploaded: true }],
      studyRecords: [],
      dryRun: false,
    })
    expect(result.warnings.some(w => w.includes('already be clean'))).toBe(true)
  })
})

// ==========================================================================
// createViloPilotSeed
// ==========================================================================

describe('createViloPilotSeed', () => {
  it('should create empty seed with organization name', () => {
    const seed = createViloPilotSeed({ organizationName: 'Vilo Research Group' })
    expect(seed.organization).toBe('Vilo Research Group')
    expect(seed.uploadedDocs).toHaveLength(0)
    expect(seed.studyRecords).toHaveLength(0)
  })

  it('should preserve existing real studies', () => {
    const seed = createViloPilotSeed({
      organizationName: 'Vilo Research',
      preserveStudies: [{ id: 's1', studyTitle: 'Real Study', protocolNumber: 'REAL-001', nct: 'NCT01234567' }],
    })
    expect(seed.studyRecords).toHaveLength(1)
    expect(seed.studyRecords[0].nct).toBe('NCT01234567')
  })
})
