// ==========================================================================
// Institutional Knowledge — Runtime v2 (IKM/EVM Sprint 3)
// ==========================================================================

import type {
  KnowledgeItem,
  KnowledgeItemType,
  KnowledgeAssetStatus,
  KnowledgeRelationship,
  RelationshipType,
  DocumentReference,
  DocumentUploadInput,
  DocumentUploadResult,
  EvidenceCandidate,
  EvidenceCandidateType,
  EvidenceCandidateStatus,
  AcquisitionSession,
  AcquisitionChannel,
  ExpirationReminder,
} from './types'
import { REMINDER_WINDOWS } from './types'

// ---------------------------------------------------------------------------
// Registries (in-memory MVP)
// ---------------------------------------------------------------------------

const itemRegistry = new Map<string, KnowledgeItem>()
const documentRegistry = new Map<string, DocumentReference>()
const relationshipRegistry = new Map<string, KnowledgeRelationship>()
const candidateRegistry = new Map<string, EvidenceCandidate>()
const sessionRegistry = new Map<string, AcquisitionSession>()

let idCounter = 0
function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${(idCounter++).toString(36)}`
}

// ==========================================================================
// KNOWLEDGE ITEM MANAGEMENT
// ==========================================================================

export function declareKnowledgeItem(params: {
  organizationId: string
  statement: string
  itemType: KnowledgeItemType
  category?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}): KnowledgeItem {
  const now = new Date().toISOString()
  const item: KnowledgeItem = {
    id: nextId('ki'),
    organizationId: params.organizationId,
    statement: params.statement,
    itemType: params.itemType,
    category: params.category ?? params.itemType,
    status: 'draft',
    maturityLevel: 'EM1_SELF_REPORTED' as never,
    relationships: [],
    documentRefs: [],
    evidenceCandidates: [],
    externallyConfirmed: false,
    externalConfirmationCount: 0,
    hasOperationalHistory: false,
    declaredAt: now,
    updatedAt: now,
    tags: params.tags ?? [],
    metadata: params.metadata ?? {},
  }
  itemRegistry.set(item.id, item)
  return item
}

export function getKnowledgeItem(id: string): KnowledgeItem | undefined {
  return itemRegistry.get(id)
}

export function getItemsByOrg(organizationId: string): KnowledgeItem[] {
  return Array.from(itemRegistry.values()).filter((i) => i.organizationId === organizationId)
}

export function updateItemStatus(id: string, status: KnowledgeAssetStatus): KnowledgeItem | null {
  const item = itemRegistry.get(id)
  if (!item) return null
  item.status = status
  item.updatedAt = new Date().toISOString()
  return item
}

// ==========================================================================
// RELATIONSHIP ENGINE
// ==========================================================================

export function createRelationship(params: {
  sourceId: string
  targetId: string
  relationshipType: RelationshipType
  description?: string
}): KnowledgeRelationship | null {
  const source = itemRegistry.get(params.sourceId)
  const target = itemRegistry.get(params.targetId)
  if (!source || !target) return null

  const rel: KnowledgeRelationship = {
    id: nextId('rel'),
    sourceId: params.sourceId,
    targetId: params.targetId,
    relationshipType: params.relationshipType,
    description: params.description,
    createdAt: new Date().toISOString(),
  }

  relationshipRegistry.set(rel.id, rel)
  source.relationships.push(rel)
  target.relationships.push(rel)
  source.updatedAt = new Date().toISOString()
  target.updatedAt = new Date().toISOString()

  if (source.status === 'draft') source.status = 'active'
  if (target.status === 'draft') target.status = 'active'

  return rel
}

export function getRelationships(itemId: string): {
  incoming: KnowledgeRelationship[]
  outgoing: KnowledgeRelationship[]
} {
  const all = Array.from(relationshipRegistry.values())
  return {
    incoming: all.filter((r) => r.targetId === itemId),
    outgoing: all.filter((r) => r.sourceId === itemId),
  }
}

// ==========================================================================
// EVIDENCE CANDIDATE GENERATION
// ==========================================================================

export function generateEvidenceCandidates(itemId: string): EvidenceCandidate[] {
  const item = itemRegistry.get(itemId)
  if (!item) return []

  const candidates: EvidenceCandidate[] = []

  // Rule 1: Each supporting document may generate a candidate
  for (const doc of item.documentRefs) {
    const candidate = createCandidate(item, doc, 'document')
    candidates.push(candidate)
  }

  // Rule 2: Self-reported items without documents get a candidate with needs_document status
  if (item.documentRefs.length === 0) {
    const candidate = createCandidate(item, null, 'self_report')
    candidates.push(candidate)
  }

  // Rule 3: Items with operational history generate operational candidates
  if (item.hasOperationalHistory) {
    const exists = candidates.find((c) => c.candidateType === 'operational_data')
    if (!exists) {
      const candidate = createCandidate(item, null, 'operational_record')
      candidates.push(candidate)
    }
  }

  item.evidenceCandidates = candidates
  item.updatedAt = new Date().toISOString()

  return candidates
}

function createCandidate(
  item: KnowledgeItem,
  doc: DocumentReference | null,
  source: EvidenceCandidate['source']
): EvidenceCandidate {
  const now = new Date().toISOString()
  const candidateType = inferCandidateType(item, doc)

  let validationStatus: EvidenceCandidateStatus = 'draft'
  const missing: string[] = []

  if (!doc) {
    validationStatus = 'needs_document'
    missing.push('supporting_document')
  } else if (item.relationships.length === 0) {
    validationStatus = 'needs_corroboration'
    missing.push('relationship_corroboration')
  } else if (item.externalConfirmationCount === 0 && candidateType === 'certification') {
    validationStatus = 'needs_review'
    missing.push('external_verification')
  } else {
    validationStatus = 'ready_for_evidence'
  }

  const candidate: EvidenceCandidate = {
    id: nextId('ec'),
    knowledgeItemId: item.id,
    candidateType,
    source,
    supportingDocumentIds: doc ? [doc.documentId] : [],
    validationStatus,
    missingRequirements: missing,
    recommendedActions: generateCandidateActions(validationStatus, candidateType),
    proposedEvidenceClass: inferEvidenceClass(candidateType),
    createdAt: now,
    updatedAt: now,
  }

  candidateRegistry.set(candidate.id, candidate)
  return candidate
}

function inferCandidateType(item: KnowledgeItem, doc: DocumentReference | null): EvidenceCandidateType {
  if (item.itemType === 'certification' || item.category === 'certification') return 'certification'
  if (item.itemType === 'regulatory') return 'regulatory_submission'
  if (item.itemType === 'process' || item.itemType === 'policy') return 'sop'
  if (item.itemType === 'equipment') return 'equipment_log'
  if (item.itemType === 'person') return 'training_record'
  if (item.itemType === 'facility') return 'audit_report'
  if (doc?.documentType === 'certification') return 'certification'
  if (doc?.documentType === 'sop') return 'sop'
  return 'record'
}

function inferEvidenceClass(candidateType: EvidenceCandidateType): EvidenceCandidate['proposedEvidenceClass'] {
  switch (candidateType) {
    case 'certification': return 'A'
    case 'license': return 'A'
    case 'audit_report': return 'B'
    case 'regulatory_submission': return 'B'
    case 'sop': return 'B'
    case 'external_validation': return 'B'
    case 'training_record': return 'C'
    case 'quality_record': return 'C'
    case 'equipment_log': return 'C'
    case 'operational_data': return 'D'
    case 'record': return 'D'
    default: return null
  }
}

function generateCandidateActions(status: EvidenceCandidateStatus, type: EvidenceCandidateType): string[] {
  switch (status) {
    case 'needs_document':
      return [`Upload a supporting document for this ${type}`, `Link an existing document from your inventory`]
    case 'needs_corroboration':
      return [`Create a relationship to another knowledge item`, `Link to a related process or facility`]
    case 'needs_review':
      return [`Submit for internal review`, `Seek external confirmation or third-party validation`]
    case 'ready_for_evidence':
      return [`Ready for promotion to Evidence Object`, `All requirements met — schedule evidence registration`]
    default:
      return [`Review candidate requirements`, `Add supporting documentation`]
  }
}

export function getCandidatesByItem(itemId: string): EvidenceCandidate[] {
  return Array.from(candidateRegistry.values()).filter((c) => c.knowledgeItemId === itemId)
}

export function getReadyCandidates(orgId: string): EvidenceCandidate[] {
  const items = getItemsByOrg(orgId)
  const itemIds = new Set(items.map((i) => i.id))
  return Array.from(candidateRegistry.values()).filter(
    (c) => itemIds.has(c.knowledgeItemId) && c.validationStatus === 'ready_for_evidence'
  )
}

// ==========================================================================
// DOCUMENT UPLOAD
// ==========================================================================

export function uploadDocument(input: DocumentUploadInput): DocumentUploadResult {
  const docId = nextId('doc')
  const now = new Date().toISOString()

  const docRef: DocumentReference = {
    documentId: docId,
    name: input.name,
    documentType: input.documentType,
    issueDate: input.issueDate,
    expires: input.expires,
    expirationDate: input.expirationDate,
    relatedEntityId: input.relatedEntityId,
    relatedEntityType: input.relatedEntityType,
    uploadedAt: now,
  }

  documentRegistry.set(docId, docRef)

  const linkedItems: string[] = []
  let candidatesGenerated = 0

  for (const item of itemRegistry.values()) {
    if (item.organizationId !== input.organizationId) continue

    const matches =
      item.id === input.relatedEntityId ||
      item.tags.includes(input.documentType) ||
      item.category === input.relatedEntityType ||
      item.itemType === input.relatedEntityType

    if (matches) {
      item.documentRefs.push(docRef)
      item.updatedAt = now
      if (item.status === 'draft') item.status = 'active'
      linkedItems.push(item.id)

      // Generate candidates for items that now have documents
      const candidates = generateEvidenceCandidates(item.id)
      candidatesGenerated += candidates.length
    }
  }

  return {
    documentRef: docRef,
    linkedItems,
    candidatesGenerated,
    maturityUpdated: linkedItems.length > 0,
    remindersScheduled: input.expires && !!input.expirationDate,
  }
}

// ==========================================================================
// ACQUISITION SESSIONS
// ==========================================================================

export function startAcquisitionSession(orgId: string, channel: AcquisitionChannel): AcquisitionSession {
  const session: AcquisitionSession = {
    id: nextId('sess'),
    organizationId: orgId,
    channel,
    startedAt: new Date().toISOString(),
    itemsAcquired: 0,
    documentsUploaded: 0,
    candidatesGenerated: 0,
    status: 'in_progress',
  }
  sessionRegistry.set(session.id, session)
  return session
}

export function completeAcquisitionSession(sessionId: string): AcquisitionSession | null {
  const session = sessionRegistry.get(sessionId)
  if (!session) return null
  session.status = 'completed'
  session.completedAt = new Date().toISOString()
  return session
}

// ==========================================================================
// LIFECYCLE
// ==========================================================================

export function computeAssetStatus(item: KnowledgeItem): KnowledgeAssetStatus {
  if (item.status === 'archived' || item.status === 'replaced') return item.status
  if (item.status === 'draft') return 'draft'

  const now = new Date()
  for (const doc of item.documentRefs) {
    if (doc.expires && doc.expirationDate) {
      const daysUntil = Math.ceil(
        (new Date(doc.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntil <= 0) return 'expired'
      if (daysUntil <= 90) return 'expiring_soon'
    }
  }

  return 'active'
}

// ==========================================================================
// REMINDERS
// ==========================================================================

export function scheduleReminders(doc: DocumentReference): ExpirationReminder[] {
  if (!doc.expires || !doc.expirationDate) return []
  const expDate = new Date(doc.expirationDate)
  const now = new Date()
  const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil <= 0) return []

  const triggered = REMINDER_WINDOWS.filter((w) => daysUntil <= w)
  if (triggered.length === 0) return []

  return [
    {
      documentId: doc.documentId,
      documentName: doc.name,
      expirationDate: doc.expirationDate,
      daysUntilExpiration: daysUntil,
      reminderDays: [...REMINDER_WINDOWS],
      triggeredReminders: triggered,
      status: 'active',
    },
  ]
}

export function getActiveReminders(orgId: string): ExpirationReminder[] {
  const reminders: ExpirationReminder[] = []
  for (const doc of documentRegistry.values()) {
    reminders.push(...scheduleReminders(doc))
  }
  return reminders
}

export function getExpiringDocuments(orgId: string, withinDays: number): DocumentReference[] {
  const now = new Date()
  const threshold = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000)
  return Array.from(documentRegistry.values()).filter((doc) => {
    if (!doc.expires || !doc.expirationDate) return false
    const expDate = new Date(doc.expirationDate)
    return expDate <= threshold && expDate > now
  })
}
