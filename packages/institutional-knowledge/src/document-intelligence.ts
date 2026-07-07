// ==========================================================================
// Sprint A3 — Document Intelligence
// ==========================================================================
// Transforma documentos en activos institucionales inteligentes.
// Extiende DocumentReference — no lo reemplaza.
// Cada documento sabe qué demuestra, qué soporta, qué vence, qué reemplaza.
// ==========================================================================

import type {
  DocumentTypeKey, CapabilityTypeKey, SpecimenTypeKey,
  ProgramTypeKey,
} from '../taxonomy'
import type { KnowledgeItem } from '../types'

// ==========================================================================
// DOCUMENT INTELLIGENCE — Core Model
// ==========================================================================

export type DocumentLifecycleStatus =
  | 'draft'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'superseded'
  | 'archived'

export interface DocumentIntelligence {
  documentId: string
  institutionId: string
  label: string
  documentType: DocumentTypeKey
  description: string | null
  
  // File metadata
  fileName: string | null
  fileSizeBytes: number | null
  mimeType: string | null
  uploadedAt: string | null
  uploadedBy: string | null
  
  // Lifecycle
  lifecycle: DocumentLifecycleStatus
  issuedAt: string | null
  expiresAt: string | null
  expires: boolean
  renewalWindowMonths: number | null
  lastReviewedAt: string | null
  reviewCycleMonths: number | null
  nextReviewDue: string | null
  
  // What this document proves / supports / enables
  demonstrates: DocumentDemonstration
  supports: DocumentSupport
  impact: DocumentImpact
  
  // Versioning & replacement
  version: number
  supersededBy: string | null      // documentId that replaces this
  supersedes: string | null        // documentId this replaces
  replaces: string[]               // documentIds made obsolete
  invalidatedBy: string | null     // documentId that invalidates this
  
  // Evidence pipeline
  generatesCandidates: string[]    // EvidenceCandidate IDs
  supportsClaims: string[]         // Claim IDs this document can support
  
  // Relationships
  linkedEntities: LinkedEntity[]
  
  // Metadata
  tags: string[]
  createdBy: string | null
  approvedBy: string | null
  lastModifiedAt: string
}

export interface DocumentDemonstration {
  /** What capabilities this document proves the institution has */
  capabilities: CapabilityTypeKey[]
  /** What specimens this document validates handling for */
  specimenTypes: SpecimenTypeKey[]
  /** What programs this document enables participation in */
  programs: ProgramTypeKey[]
  /** Knowledge items this document corroborates */
  knowledgeItems: string[]
  /** Concise statement of what this document demonstrates */
  summary: string
}

export interface DocumentSupport {
  /** People this document supports (personIds) */
  people: string[]
  /** Facilities this document supports (facilityIds) */
  facilities: string[]
  /** Equipment this document supports (equipmentIds) */
  equipment: string[]
  /** Laboratories this document supports (labIds) */
  laboratories: string[]
}

export interface DocumentImpact {
  /** Readiness requirements affected by this document */
  readinessRequirements: string[]
  /** Criticality: blocker = must have, enhancer = improves readiness, supporting = nice to have */
  readinessImpact: 'blocker' | 'enhancer' | 'supporting'
  /** Regulatory frameworks this document satisfies */
  regulatoryFrameworks: string[]
  /** Quality system elements this document feeds */
  qualityElements: string[]
}

export interface LinkedEntity {
  entityType: 'person' | 'facility' | 'equipment' | 'laboratory' | 'knowledge_item' | 'evidence_candidate' | 'claim' | 'program'
  entityId: string
  relationship: 'supports' | 'evidences' | 'certifies' | 'qualifies' | 'authorizes' | 'records'
}

// ==========================================================================
// DOCUMENT LIFECYCLE ENGINE
// ==========================================================================

export function computeDocumentLifecycle(doc: DocumentIntelligence, referenceDate: Date = new Date()): DocumentLifecycleStatus {
  if (doc.lifecycle === 'draft' || doc.lifecycle === 'superseded' || doc.lifecycle === 'archived') {
    return doc.lifecycle
  }

  if (!doc.expires || !doc.expiresAt) return 'active'

  const expiry = new Date(doc.expiresAt).getTime()
  const now = referenceDate.getTime()
  const daysUntil = Math.ceil((expiry - now) / 86_400_000)

  if (daysUntil < 0) return 'expired'
  if (daysUntil <= 90) return 'expiring_soon'
  return 'active'
}

export function computeReviewStatus(doc: DocumentIntelligence, referenceDate: Date = new Date()): { status: 'ok' | 'due' | 'overdue'; nextReview: string | null } {
  if (!doc.nextReviewDue) return { status: 'ok', nextReview: null }
  const due = new Date(doc.nextReviewDue).getTime()
  const now = referenceDate.getTime()
  if (due < now) return { status: 'overdue', nextReview: doc.nextReviewDue }
  return { status: 'due', nextReview: doc.nextReviewDue }
}

// ==========================================================================
// DOCUMENT OPERATIONS
// ==========================================================================

export interface DocumentOperation {
  op: string
  documentId: string
  previousState: Partial<DocumentIntelligence>
  newState: Partial<DocumentIntelligence>
  performedAt: string
  performedBy: string | null
}

export function renewDocument(
  doc: DocumentIntelligence,
  newExpiryDate: string,
  actorId: string | null,
): { doc: DocumentIntelligence; operation: DocumentOperation } {
  const previous = { expiresAt: doc.expiresAt, lifecycle: doc.lifecycle }
  doc.expiresAt = newExpiryDate
  doc.lifecycle = computeDocumentLifecycle(doc)
  doc.lastModifiedAt = new Date().toISOString()

  return {
    doc,
    operation: {
      op: 'renew',
      documentId: doc.documentId,
      previousState: previous,
      newState: { expiresAt: newExpiryDate, lifecycle: doc.lifecycle },
      performedAt: new Date().toISOString(),
      performedBy: actorId,
    },
  }
}

export function replaceDocument(
  oldDoc: DocumentIntelligence,
  newDoc: DocumentIntelligence,
  actorId: string | null,
): { oldDoc: DocumentIntelligence; newDoc: DocumentIntelligence; operation: DocumentOperation } {
  const now = new Date().toISOString()
  
  // Old document becomes superseded
  oldDoc.lifecycle = 'superseded'
  oldDoc.supersededBy = newDoc.documentId
  oldDoc.lastModifiedAt = now

  // New document replaces old
  newDoc.supersedes = oldDoc.documentId
  newDoc.replaces = [...newDoc.replaces, oldDoc.documentId]
  newDoc.version = oldDoc.version + 1
  newDoc.lastModifiedAt = now

  return {
    oldDoc, newDoc,
    operation: {
      op: 'replace',
      documentId: oldDoc.documentId,
      previousState: { lifecycle: 'active' },
      newState: { lifecycle: 'superseded', supersededBy: newDoc.documentId },
      performedAt: now,
      performedBy: actorId,
    },
  }
}

export function approveDocument(
  doc: DocumentIntelligence,
  approverId: string,
): { doc: DocumentIntelligence; operation: DocumentOperation } {
  const previous = { lifecycle: doc.lifecycle }
  doc.lifecycle = 'active'
  doc.approvedBy = approverId
  doc.lastModifiedAt = new Date().toISOString()

  return {
    doc,
    operation: {
      op: 'approve',
      documentId: doc.documentId,
      previousState: previous,
      newState: { lifecycle: 'active', approvedBy: approverId },
      performedAt: new Date().toISOString(),
      performedBy: approverId,
    },
  }
}

export function archiveDocument(
  doc: DocumentIntelligence,
  actorId: string | null,
): { doc: DocumentIntelligence; operation: DocumentOperation } {
  const previous = { lifecycle: doc.lifecycle }
  doc.lifecycle = 'archived'
  doc.lastModifiedAt = new Date().toISOString()

  return {
    doc,
    operation: {
      op: 'archive',
      documentId: doc.documentId,
      previousState: previous,
      newState: { lifecycle: 'archived' },
      performedAt: new Date().toISOString(),
      performedBy: actorId,
    },
  }
}

export function linkDocumentToEntity(
  doc: DocumentIntelligence,
  entityType: LinkedEntity['entityType'],
  entityId: string,
  relationship: LinkedEntity['relationship'],
): DocumentIntelligence {
  if (!doc.linkedEntities.some((e) => e.entityType === entityType && e.entityId === entityId)) {
    doc.linkedEntities.push({ entityType, entityId, relationship })
    doc.lastModifiedAt = new Date().toISOString()
  }
  return doc
}

export function unlinkDocumentFromEntity(
  doc: DocumentIntelligence,
  entityType: LinkedEntity['entityType'],
  entityId: string,
): DocumentIntelligence {
  doc.linkedEntities = doc.linkedEntities.filter(
    (e) => !(e.entityType === entityType && e.entityId === entityId)
  )
  doc.lastModifiedAt = new Date().toISOString()
  return doc
}

// ==========================================================================
// AUTO-DETECTION — Document Gaps & Risks
// ==========================================================================

export interface DocumentGap {
  gapType: 'missing_required' | 'expired' | 'expiring_soon' | 'needs_review' | 'unsupported_capability' | 'unsupported_person' | 'unsupported_facility' | 'orphan_document'
  documentId: string | null
  documentLabel: string | null
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  recommendedAction: string
  detectedAt: string
}

export function detectDocumentGaps(
  documents: DocumentIntelligence[],
  knowledgeItems: KnowledgeItem[],
): DocumentGap[] {
  const gaps: DocumentGap[] = []
  const now = new Date().toISOString()

  for (const doc of documents) {
    // Expired
    if (doc.lifecycle === 'expired') {
      gaps.push({
        gapType: 'expired',
        documentId: doc.documentId, documentLabel: doc.label,
        severity: 'critical',
        description: `Document "${doc.label}" has expired${doc.expiresAt ? ` on ${doc.expiresAt}` : ''}.`,
        recommendedAction: `Renew or replace "${doc.label}" immediately.`,
        detectedAt: now,
      })
    }

    // Expiring soon
    if (doc.lifecycle === 'expiring_soon') {
      gaps.push({
        gapType: 'expiring_soon',
        documentId: doc.documentId, documentLabel: doc.label,
        severity: 'high',
        description: `Document "${doc.label}" expires on ${doc.expiresAt}.`,
        recommendedAction: `Plan renewal of "${doc.label}".`,
        detectedAt: now,
      })
    }

    // Needs review
    if (doc.nextReviewDue) {
      const reviewDue = new Date(doc.nextReviewDue).getTime()
      if (reviewDue < Date.now()) {
        gaps.push({
          gapType: 'needs_review',
          documentId: doc.documentId, documentLabel: doc.label,
          severity: 'medium',
          description: `Document "${doc.label}" review overdue since ${doc.nextReviewDue}.`,
          recommendedAction: `Complete periodic review of "${doc.label}".`,
          detectedAt: now,
        })
      }
    }

    // Orphan — no linked entities
    if (doc.linkedEntities.length === 0 && doc.lifecycle === 'active') {
      gaps.push({
        gapType: 'orphan_document',
        documentId: doc.documentId, documentLabel: doc.label,
        severity: 'low',
        description: `Document "${doc.label}" is not linked to any entity.`,
        recommendedAction: `Link "${doc.label}" to relevant people, facilities, equipment, or knowledge items.`,
        detectedAt: now,
      })
    }
  }

  // Missing required documents for knowledge items with document requirements
  const docTypesPresent = new Set(documents.map((d) => d.documentType))
  const requiredDocTypes: DocumentTypeKey[] = [
    'clia_certificate', 'irb_approval', 'insurance_certificate',
    'medical_license', 'state_lab_license', 'iata_certificate',
    'quality_manual', 'business_license',
  ]

  for (const reqType of requiredDocTypes) {
    if (!docTypesPresent.has(reqType)) {
      gaps.push({
        gapType: 'missing_required',
        documentId: null, documentLabel: reqType,
        severity: 'critical',
        description: `Required document type "${reqType}" is not present.`,
        recommendedAction: `Upload or create "${reqType}" document.`,
        detectedAt: now,
      })
    }
  }

  // Unsupported capabilities (capabilities without any document proving them)
  const provenCapabilities = new Set(
    documents.flatMap((d) => d.demonstrates.capabilities)
  )
  // This would need capability data — placeholder

  return gaps.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3 }
    return sev[a.severity] - sev[b.severity]
  })
}

// ==========================================================================
// DOCUMENT DASHBOARD
// ==========================================================================

export interface DocumentDashboardState {
  institutionId: string
  totalDocuments: number
  byStatus: Record<DocumentLifecycleStatus, number>
  byType: Record<string, number>
  expiring: DocumentIntelligence[]
  expired: DocumentIntelligence[]
  recentlyAdded: DocumentIntelligence[]
  critical: DocumentIntelligence[]
  missingRequired: DocumentGap[]
  coverageScore: number       // 0-100
  gaps: DocumentGap[]
  healthScore: number         // 0-100
}

export function buildDocumentDashboard(
  documents: DocumentIntelligence[],
  knowledgeItems: KnowledgeItem[],
): DocumentDashboardState {
  const now = new Date().toISOString()
  const DAY_MS = 86_400_000

  const byStatus: Record<string, number> = { draft: 0, active: 0, expiring_soon: 0, expired: 0, superseded: 0, archived: 0 }
  const byType: Record<string, number> = {}

  for (const doc of documents) {
    byStatus[doc.lifecycle] = (byStatus[doc.lifecycle] ?? 0) + 1
    byType[doc.documentType] = (byType[doc.documentType] ?? 0) + 1
  }

  const expired = documents.filter((d) => d.lifecycle === 'expired')
  const expiring = documents.filter((d) => d.lifecycle === 'expiring_soon')

  // Recently added (last 30 days)
  const thirtyDaysAgo = new Date(now).getTime() - 30 * DAY_MS
  const recentlyAdded = documents.filter(
    (d) => d.uploadedAt && new Date(d.uploadedAt).getTime() > thirtyDaysAgo
  )

  // Critical documents (blocker impact, active but expiring soon)
  const critical = documents.filter(
    (d) =>
      d.impact.readinessImpact === 'blocker' &&
      (d.lifecycle === 'expiring_soon' || d.lifecycle === 'expired')
  )

  const gaps = detectDocumentGaps(documents, knowledgeItems)
  const missingRequired = gaps.filter((g) => g.gapType === 'missing_required')
  const criticalGaps = gaps.filter((g) => g.severity === 'critical').length

  // Coverage: what % of expected document types are present
  const expectedTypes = 8 // key required types
  const presentTypes = new Set(documents.map((d) => d.documentType)).size
  const coverageScore = Math.min(100, Math.round((presentTypes / expectedTypes) * 100))

  // Health: penalized by expired, expiring, missing
  const baseHealth = documents.length > 0 ? 70 : 0
  const penalty = (expired.length * 10) + (expiring.length * 5) + (criticalGaps * 15)
  const healthScore = Math.max(0, Math.min(100, baseHealth - penalty))

  return {
    institutionId: documents[0]?.institutionId ?? '',
    totalDocuments: documents.length,
    byStatus: byStatus as Record<DocumentLifecycleStatus, number>,
    byType,
    expiring,
    expired,
    recentlyAdded,
    critical,
    missingRequired,
    coverageScore,
    gaps,
    healthScore,
  }
}

// ==========================================================================
// DOCUMENT EXPLORER STATE
// ==========================================================================

export type DocumentExplorerView = 'all' | 'by_type' | 'by_status' | 'expiring' | 'expired' | 'critical' | 'recent'

export interface DocumentExplorerState {
  institutionId: string
  currentView: DocumentExplorerView
  totalDocuments: number
  selectedDocumentId: string | null
  filters: {
    documentTypes: DocumentTypeKey[]
    lifecycleStatuses: DocumentLifecycleStatus[]
    readinessImpact: ('blocker' | 'enhancer' | 'supporting')[]
    searchText: string | null
  }
  sortBy: 'name' | 'date' | 'status' | 'type' | 'impact'
  sortDirection: 'asc' | 'desc'
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const DOCUMENT_INTELLIGENCE = {
  computeDocumentLifecycle,
  computeReviewStatus,
  renewDocument,
  replaceDocument,
  approveDocument,
  archiveDocument,
  linkDocumentToEntity,
  unlinkDocumentFromEntity,
  detectDocumentGaps,
  buildDocumentDashboard,
}
