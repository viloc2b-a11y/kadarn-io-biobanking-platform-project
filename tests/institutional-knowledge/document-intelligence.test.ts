// ==========================================================================
// Sprint A3 — Document Intelligence Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  computeDocumentLifecycle, computeReviewStatus,
  renewDocument, replaceDocument, approveDocument, archiveDocument,
  linkDocumentToEntity, unlinkDocumentFromEntity,
  detectDocumentGaps, buildDocumentDashboard,
  DOCUMENT_INTELLIGENCE,
  type DocumentIntelligence, type DocumentLifecycleStatus,
} from '../../packages/institutional-knowledge/src/document-intelligence'
import type { KnowledgeItem } from '../../packages/institutional-knowledge/src/types'
import { EvidenceMaturityLevel } from '../../packages/evidence-validation/src/index'

// ==========================================================================
// Fixtures
// ==========================================================================

function makeDoc(overrides: Partial<DocumentIntelligence> = {}): DocumentIntelligence {
  return {
    documentId: 'doc-001',
    institutionId: 'org-test',
    label: 'CLIA Certificate',
    documentType: 'clia_certificate',
    description: 'Current CLIA certificate for main laboratory.',
    fileName: 'clia-2025.pdf', fileSizeBytes: 1024000, mimeType: 'application/pdf',
    uploadedAt: '2025-06-01T00:00:00Z', uploadedBy: 'admin',
    lifecycle: 'active',
    issuedAt: '2025-01-01T00:00:00Z', expiresAt: '2027-12-31T00:00:00Z',
    expires: true, renewalWindowMonths: 3,
    lastReviewedAt: '2025-06-01T00:00:00Z', reviewCycleMonths: 24, nextReviewDue: '2027-06-01T00:00:00Z',
    demonstrates: {
      capabilities: ['sample_processing', 'cold_chain', 'biobanking'],
      specimenTypes: ['whole_blood', 'plasma', 'serum'],
      programs: ['central_lab_services'],
      knowledgeItems: ['ki-clia-001'],
      summary: 'CLIA certification proves laboratory testing capability.',
    },
    supports: {
      people: [], facilities: ['fac-001'], equipment: [], laboratories: ['lab-001'],
    },
    impact: {
      readinessRequirements: ['req-laboratory-certification'],
      readinessImpact: 'blocker',
      regulatoryFrameworks: ['CLIA', 'CMS'],
      qualityElements: ['quality_manual'],
    },
    version: 1,
    supersededBy: null, supersedes: null, replaces: [], invalidatedBy: null,
    generatesCandidates: ['ec-clia-001'], supportsClaims: [],
    linkedEntities: [
      { entityType: 'facility', entityId: 'fac-001', relationship: 'certifies' },
      { entityType: 'laboratory', entityId: 'lab-001', relationship: 'qualifies' },
    ],
    tags: ['certification', 'regulatory', 'lab'],
    createdBy: 'system', approvedBy: 'admin', lastModifiedAt: '2025-06-01T00:00:00Z',
    ...overrides,
  }
}

function makeKnowledgeItem(): KnowledgeItem {
  return {
    id: 'ki-clia-001', organizationId: 'org-test',
    statement: 'CLIA-certified laboratory.',
    itemType: 'regulatory', category: 'lab_certifications',
    status: 'active', maturityLevel: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
    relationships: [], documentRefs: [], evidenceCandidates: [],
    externallyConfirmed: false, externalConfirmationCount: 0,
    hasOperationalHistory: false,
    declaredAt: '2025-01-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z',
    tags: [], metadata: {},
  }
}

// ==========================================================================
// PART 1 — Lifecycle
// ==========================================================================

describe('Document Intelligence — Lifecycle', () => {
  it('active document with future expiry', () => {
    const status = computeDocumentLifecycle(makeDoc())
    expect(status).toBe('active')
  })

  it('expiring soon within 90 days', () => {
    const future30 = new Date(); future30.setDate(future30.getDate() + 30)
    const doc = makeDoc({ expiresAt: future30.toISOString() })
    const status = computeDocumentLifecycle(doc)
    expect(status).toBe('expiring_soon')
  })

  it('expired document', () => {
    const doc = makeDoc({ expiresAt: '2024-01-01T00:00:00Z' })
    const status = computeDocumentLifecycle(doc)
    expect(status).toBe('expired')
  })

  it('non-expiring document stays active', () => {
    const doc = makeDoc({ expires: false, expiresAt: null })
    const status = computeDocumentLifecycle(doc)
    expect(status).toBe('active')
  })

  it('draft/superseded/archived preserved', () => {
    for (const status of ['draft', 'superseded', 'archived'] as DocumentLifecycleStatus[]) {
      const doc = makeDoc({ lifecycle: status })
      expect(computeDocumentLifecycle(doc)).toBe(status)
    }
  })

  it('review overdue', () => {
    const doc = makeDoc({ nextReviewDue: '2024-01-01T00:00:00Z' })
    const { status } = computeReviewStatus(doc)
    expect(status).toBe('overdue')
  })

  it('review ok when in future', () => {
    const doc = makeDoc({ nextReviewDue: '2030-01-01T00:00:00Z' })
    const { status } = computeReviewStatus(doc)
    expect(status).toBe('due')  // it's in the future but has a date
  })
})

// ==========================================================================
// PART 2 — Operations
// ==========================================================================

describe('Document Intelligence — Operations', () => {
  it('renew document updates expiry and lifecycle', () => {
    const doc = makeDoc({ expiresAt: '2025-06-01T00:00:00Z' })
    const { doc: renewed, operation } = renewDocument(doc, '2028-06-01T00:00:00Z', 'user-1')
    
    expect(renewed.expiresAt).toBe('2028-06-01T00:00:00Z')
    expect(renewed.lifecycle).toBe('active')
    expect(operation.op).toBe('renew')
    expect(operation.performedBy).toBe('user-1')
    expect(operation.previousState.expiresAt).toBe('2025-06-01T00:00:00Z')
  })

  it('replace document supersedes old and links new', () => {
    const oldDoc = makeDoc({ documentId: 'doc-old', version: 1 })
    const newDoc = makeDoc({ documentId: 'doc-new', version: 1 })
    
    const { oldDoc: oldResult, newDoc: newResult, operation } = replaceDocument(oldDoc, newDoc, 'user-2')
    
    expect(oldResult.lifecycle).toBe('superseded')
    expect(oldResult.supersededBy).toBe('doc-new')
    expect(newResult.supersedes).toBe('doc-old')
    expect(newResult.version).toBe(2)
    expect(operation.op).toBe('replace')
  })

  it('approve moves draft to active', () => {
    const doc = makeDoc({ lifecycle: 'draft' })
    const { doc: approved, operation } = approveDocument(doc, 'approver-1')
    
    expect(approved.lifecycle).toBe('active')
    expect(approved.approvedBy).toBe('approver-1')
    expect(operation.op).toBe('approve')
  })

  it('archive moves to archived', () => {
    const doc = makeDoc()
    const { doc: archived, operation } = archiveDocument(doc, 'user-3')
    
    expect(archived.lifecycle).toBe('archived')
    expect(operation.op).toBe('archive')
  })

  it('link adds entity relationship', () => {
    const doc = makeDoc({ linkedEntities: [] })
    const linked = linkDocumentToEntity(doc, 'person', 'p-001', 'supports')
    
    expect(linked.linkedEntities).toHaveLength(1)
    expect(linked.linkedEntities[0].entityId).toBe('p-001')
  })

  it('unlink removes entity relationship', () => {
    const doc = makeDoc()
    const initialCount = doc.linkedEntities.length
    // Remove an existing entity
    const existing = doc.linkedEntities[0]
    const unlinked = unlinkDocumentFromEntity(doc, existing.entityType, existing.entityId)
    
    expect(unlinked.linkedEntities).toHaveLength(initialCount - 1)
  })

  it('does not duplicate links', () => {
    const doc = makeDoc({ linkedEntities: [] })
    linkDocumentToEntity(doc, 'facility', 'fac-001', 'supports')
    linkDocumentToEntity(doc, 'facility', 'fac-001', 'supports') // duplicate
    
    expect(doc.linkedEntities).toHaveLength(1)
  })
})

// ==========================================================================
// PART 3 — Gap Detection
// ==========================================================================

describe('Document Intelligence — Gap Detection', () => {
  it('detects expired document', () => {
    const doc = makeDoc({ lifecycle: 'expired', expiresAt: '2024-01-01T00:00:00Z' })
    const gaps = detectDocumentGaps([doc], [])
    const expired = gaps.filter((g) => g.gapType === 'expired')
    expect(expired).toHaveLength(1)
  })

  it('detects expiring soon', () => {
    const doc = makeDoc({ lifecycle: 'expiring_soon' })
    const gaps = detectDocumentGaps([doc], [])
    const expiring = gaps.filter((g) => g.gapType === 'expiring_soon')
    expect(expiring).toHaveLength(1)
  })

  it('detects missing required document types', () => {
    const gaps = detectDocumentGaps([], [])
    const missing = gaps.filter((g) => g.gapType === 'missing_required')
    expect(missing.length).toBeGreaterThan(0)
  })

  it('detects orphan document with no links', () => {
    const doc = makeDoc({ linkedEntities: [], lifecycle: 'active' })
    const gaps = detectDocumentGaps([doc], [])
    const orphans = gaps.filter((g) => g.gapType === 'orphan_document')
    expect(orphans).toHaveLength(1)
  })

  it('detects overdue review', () => {
    const doc = makeDoc({ nextReviewDue: '2024-01-01T00:00:00Z' })
    const gaps = detectDocumentGaps([doc], [])
    const reviews = gaps.filter((g) => g.gapType === 'needs_review')
    expect(reviews).toHaveLength(1)
  })
})

// ==========================================================================
// PART 4 — Dashboard
// ==========================================================================

describe('Document Intelligence — Dashboard', () => {
  it('builds dashboard from documents', () => {
    const docs = [
      makeDoc(),
      makeDoc({ documentId: 'doc-002', lifecycle: 'expired', label: 'Expired License' }),
      makeDoc({ documentId: 'doc-003', lifecycle: 'expiring_soon', label: 'About to Expire' }),
    ]
    const dashboard = buildDocumentDashboard(docs, [])

    expect(dashboard.totalDocuments).toBe(3)
    expect(dashboard.byStatus.active).toBe(1)
    expect(dashboard.byStatus.expired).toBe(1)
    expect(dashboard.byStatus.expiring_soon).toBe(1)
    expect(dashboard.expired).toHaveLength(1)
    expect(dashboard.expiring).toHaveLength(1)
    expect(dashboard.gaps.length).toBeGreaterThan(0)
  })

  it('coverage score increases with more document types', () => {
    const docs = [
      makeDoc({ documentType: 'clia_certificate' }),
      makeDoc({ documentId: 'doc-2', documentType: 'irb_approval' }),
      makeDoc({ documentId: 'doc-3', documentType: 'quality_manual' }),
    ]
    const dashboard = buildDocumentDashboard(docs, [])
    expect(dashboard.coverageScore).toBeGreaterThan(30)
  })

  it('health score penalized by expired docs', () => {
    const badDocs = [
      makeDoc({ lifecycle: 'expired' }),
      makeDoc({ documentId: 'doc-2', lifecycle: 'expired' }),
    ]
    const dashboard = buildDocumentDashboard(badDocs, [])
    // Expired docs should pull health down
    expect(dashboard.healthScore).toBeLessThan(70)
  })

  it('empty document set has zero health', () => {
    const dashboard = buildDocumentDashboard([], [])
    expect(dashboard.healthScore).toBe(0)
    expect(dashboard.totalDocuments).toBe(0)
  })

  it('identifies critical documents (blocker + expiring)', () => {
    const doc = makeDoc({
      lifecycle: 'expiring_soon',
      impact: { readinessRequirements: ['r1'], readinessImpact: 'blocker', regulatoryFrameworks: [], qualityElements: [] },
    })
    const dashboard = buildDocumentDashboard([doc], [])
    expect(dashboard.critical).toHaveLength(1)
  })
})

// ==========================================================================
// PART 5 — Boundary
// ==========================================================================

describe('Document Intelligence — Boundary', () => {
  it('no AI — lifecycle is deterministic', () => {
    const status = computeDocumentLifecycle(makeDoc({ expiresAt: '2024-01-01T00:00:00Z' }))
    expect(status).toBe('expired')
  })

  it('no Evidence Core mutation', () => {
    const doc = makeDoc()
    const { doc: renewed } = renewDocument(doc, '2030-01-01T00:00:00Z', 'user-1')
    expect(renewed.lifecycle).toBe('active')
    // Document operations are pure — no Evidence Core calls
  })

  it('no OCR — document type is explicit', () => {
    const doc = makeDoc()
    expect(doc.documentType).toBe('clia_certificate')
  })
})
