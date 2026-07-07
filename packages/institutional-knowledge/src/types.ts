// ==========================================================================
// Institutional Knowledge — Canonical Types v2 (IKM/EVM Sprint 3)
// ==========================================================================

import type { EvidenceMaturityLevel } from '@kadarn/evidence-validation'

// ==========================================================================
// KnowledgeItem — replaces InstitutionalFact
// ==========================================================================

/**
 * A KnowledgeItem is the canonical acquisition object for institutional knowledge.
 * It represents anything an institution knows, declares, documents, or maintains
 * about itself — far broader than just "facts."
 */
export interface KnowledgeItem {
  id: string
  organizationId: string
  /** What the institution declares or knows */
  statement: string
  /** Type: asset, equipment, person, facility, process, policy, regulatory, historical, capability, decision, relationship, goal */
  itemType: KnowledgeItemType
  /** Subcategory for finer classification */
  category: string
  /** Current lifecycle status */
  status: KnowledgeAssetStatus
  /** Current evidence maturity */
  maturityLevel: EvidenceMaturityLevel
  /** Relationships to other knowledge items */
  relationships: KnowledgeRelationship[]
  /** Associated document references */
  documentRefs: DocumentReference[]
  /** Evidence candidates derived from this knowledge */
  evidenceCandidates: EvidenceCandidate[]
  /** External confirmation */
  externallyConfirmed: boolean
  externalConfirmationCount: number
  hasOperationalHistory: boolean
  declaredAt: string
  updatedAt: string
  tags: string[]
  metadata: Record<string, unknown>
}

export type KnowledgeItemType =
  | 'asset'
  | 'equipment'
  | 'person'
  | 'facility'
  | 'process'
  | 'policy'
  | 'regulatory'
  | 'historical_event'
  | 'capability'
  | 'decision'
  | 'relationship'
  | 'goal'
  | 'other'

export type KnowledgeAssetStatus =
  | 'draft'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'replaced'
  | 'archived'

// ==========================================================================
// Knowledge Relationships
// ==========================================================================

export type RelationshipType =
  | 'operated_by'       // equipment → person
  | 'located_in'        // equipment → facility
  | 'part_of'           // process → program
  | 'governed_by'       // process → policy
  | 'produces'          // facility → capability
  | 'depends_on'        // capability → equipment
  | 'certified_by'      // facility → regulatory
  | 'employs'           // facility → person
  | 'supports'          // document → process
  | 'evidences'         // document → capability
  | 'precedes'          // historical → current
  | 'related_to'        // generic

export interface KnowledgeRelationship {
  id: string
  sourceId: string       // this knowledge item
  targetId: string       // related knowledge item
  relationshipType: RelationshipType
  description?: string
  createdAt: string
}

// ==========================================================================
// Document Reference (unchanged from Sprint 2)
// ==========================================================================

export interface DocumentReference {
  documentId: string
  name: string
  documentType: string
  issueDate?: string
  expires: boolean
  expirationDate?: string
  relatedEntityId: string
  relatedEntityType: string
  uploadedAt: string
}

// ==========================================================================
// Evidence Candidate (NEW — Sprint 3)
// ==========================================================================

/**
 * An EvidenceCandidate is NOT Evidence.
 * It represents information that MAY become evidence after validation.
 * It is the bridge between Knowledge and Evidence — without modifying Evidence Core.
 */
export interface EvidenceCandidate {
  id: string
  /** The knowledge item this candidate derives from */
  knowledgeItemId: string
  /** What type of evidence this could become */
  candidateType: EvidenceCandidateType
  /** Origin: document, self-report, relationship inference */
  source: 'document' | 'self_report' | 'relationship_inference' | 'operational_record' | 'external_source'
  /** Documents supporting this candidate */
  supportingDocumentIds: string[]
  /** Validation status */
  validationStatus: EvidenceCandidateStatus
  /** What's missing before this can become real evidence */
  missingRequirements: string[]
  /** Recommended actions to advance */
  recommendedActions: string[]
  /** Proposed evidence class if promoted */
  proposedEvidenceClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null
  createdAt: string
  updatedAt: string
}

export type EvidenceCandidateType =
  | 'certification'
  | 'sop'
  | 'record'
  | 'license'
  | 'audit_report'
  | 'training_record'
  | 'equipment_log'
  | 'quality_record'
  | 'regulatory_submission'
  | 'operational_data'
  | 'external_validation'
  | 'other'

export type EvidenceCandidateStatus =
  | 'draft'
  | 'needs_document'
  | 'needs_corroboration'
  | 'needs_review'
  | 'ready_for_evidence'
  | 'invalid'

// ==========================================================================
// Knowledge Graph (NEW — Sprint 3)
// ==========================================================================

export interface KnowledgeGraph {
  organizationId: string
  items: KnowledgeItem[]
  relationships: KnowledgeRelationship[]
  orphans: KnowledgeItem[]          // items with no relationships
  isolates: KnowledgeItem[]         // items with no documents AND no relationships
  hubItems: KnowledgeItem[]         // items with the most connections
  evidenceCandidates: EvidenceCandidate[]
  generatedAt: string
}

// ==========================================================================
// Document Upload (unchanged)
// ==========================================================================

export interface DocumentUploadInput {
  organizationId: string
  documentType: string
  name: string
  relatedEntityId: string
  relatedEntityType: string
  issueDate?: string
  expires: boolean
  expirationDate?: string
}

export interface DocumentUploadResult {
  documentRef: DocumentReference
  linkedItems: string[]
  candidatesGenerated: number
  maturityUpdated: boolean
  remindersScheduled: boolean
}

// ==========================================================================
// Acquisition (unchanged)
// ==========================================================================

export type AcquisitionChannel =
  | 'guided_form' | 'adaptive_questionnaire' | 'document_upload'
  | 'bulk_import' | 'api' | 'manual_review' | 'integration'

export interface AcquisitionSession {
  id: string
  organizationId: string
  channel: AcquisitionChannel
  startedAt: string
  completedAt?: string
  itemsAcquired: number
  documentsUploaded: number
  candidatesGenerated: number
  status: 'in_progress' | 'completed' | 'abandoned'
}

// ==========================================================================
// Reminders (unchanged)
// ==========================================================================

export interface ExpirationReminder {
  documentId: string
  documentName: string
  expirationDate: string
  daysUntilExpiration: number
  reminderDays: number[]
  triggeredReminders: number[]
  status: 'active' | 'dismissed' | 'expired'
}

export const REMINDER_WINDOWS = [90, 60, 30, 15, 7] as const

// ==========================================================================
// Health Report (extended — Sprint 3)
// ==========================================================================

export interface KnowledgeHealthReport {
  organizationId: string
  totalItems: number
  byType: Record<string, number>
  byMaturity: Record<string, number>
  expiringDocuments: ExpirationReminder[]
  expiredDocuments: DocumentReference[]
  selfReportedOnly: KnowledgeItem[]
  isolatedItems: KnowledgeItem[]         // no relationships
  undocumentedItems: KnowledgeItem[]     // no supporting docs
  duplicateItems: KnowledgeItem[][]      // groups of similar items
  readyForEvidence: EvidenceCandidate[]  // candidates ready for promotion
  readyForExternalValidation: KnowledgeItem[]
  missingRelationships: MissingRelationship[]
  generatedAt: string
}

export interface MissingRelationship {
  itemId: string
  itemStatement: string
  suggestedRelationshipType: RelationshipType
  suggestedTargetType: KnowledgeItemType
  reason: string
}

export interface MissingDocument {
  itemId: string
  itemStatement: string
  requiredDocumentType: string
  recommendation: string
}

// ==========================================================================
// Knowledge Explorer UX State (NEW — Sprint 3)
// ==========================================================================

export interface KnowledgeExplorerState {
  selectedItem?: KnowledgeItem
  view:
    | 'item_detail'
    | 'relationships'
    | 'documents'
    | 'evidence_candidates'
    | 'missing_information'
    | 'health'
  relationships: {
    incoming: KnowledgeRelationship[]
    outgoing: KnowledgeRelationship[]
  }
  attachedDocuments: DocumentReference[]
  evidenceCandidates: EvidenceCandidate[]
  missingInformation: MissingInformation[]
  relatedCapabilities: string[]     // capability IDs
  relatedPrograms: string[]         // program IDs
  nextBestActions: string[]
  graphStats: {
    totalItems: number
    totalRelationships: number
    orphans: number
    isolates: number
    hubs: number
    candidatesTotal: number
    candidatesReady: number
  }
}

export interface MissingInformation {
  itemType: KnowledgeItemType
  description: string
  whyNeeded: string
  acquisitionMethod: AcquisitionChannel
}

// ==========================================================================
// Dashboard State (updated — Sprint 3)
// ==========================================================================

export interface KnowledgeDashboardState {
  institutionMemory: {
    totalItems: number
    byType: Record<string, number>
    byMaturity: Record<string, number>
    byStatus: Record<string, number>
  }
  evidenceGaps: MissingDocument[]
  expiringDocuments: ExpirationReminder[]
  maturityDistribution: Record<string, number>
  nextBestActions: string[]
  graphHealth: {
    totalRelationships: number
    orphanCount: number
    isolateCount: number
    hubCount: number
  }
  evidenceCandidates: {
    total: number
    ready: number
    needsWork: number
  }
  capabilityProgress: {
    itemsLinked: number
    itemsUnlinked: number
    coveragePercent: number
  }
  programReadinessProgress: {
    programsWithEvidence: number
    programsWithoutEvidence: number
    overallReadiness: string
  }
  passportStatus: {
    isPublished: boolean
    lastPublishedAt?: string
    readinessLevel: string
  }
}
