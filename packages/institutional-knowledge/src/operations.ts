// ==========================================================================
// Institutional Knowledge — Operations v2 (IKM/EVM Sprint 3)
// ==========================================================================

import type {
  KnowledgeItem,
  KnowledgeHealthReport,
  MissingDocument,
  MissingRelationship,
  KnowledgeDashboardState,
  KnowledgeExplorerState,
  EvidenceCandidate,
} from './types'
import {
  getItemsByOrg,
  getExpiringDocuments,
  getActiveReminders,
  getCandidatesByItem,
  getReadyCandidates,
  getRelationships,
} from './runtime'
import { buildKnowledgeGraph, findDuplicates, suggestRelationships } from './graph'

// ==========================================================================
// HEALTH REPORT (extended)
// ==========================================================================

export function generateHealthReport(organizationId: string): KnowledgeHealthReport {
  const items = getItemsByOrg(organizationId)
  const graph = buildKnowledgeGraph(organizationId)
  const expiringDocs = getExpiringDocuments(organizationId, 90)
  const reminders = getActiveReminders(organizationId)
  const duplicates = findDuplicates(organizationId)
  const readyCandidates = getReadyCandidates(organizationId)

  const byType: Record<string, number> = {}
  const byMaturity: Record<string, number> = {}

  for (const item of items) {
    byType[item.itemType] = (byType[item.itemType] ?? 0) + 1
    byMaturity[item.maturityLevel as string] = (byMaturity[item.maturityLevel as string] ?? 0) + 1
  }

  // Self-reported only
  const selfReportedOnly = items.filter(
    (i) => i.documentRefs.length === 0 && !i.externallyConfirmed
  )

  // Undocumented items
  const undocumentedItems = items.filter((i) => i.documentRefs.length === 0)

  // Ready for external validation (EM4+ internally, not yet external)
  const readyForExternal = items.filter(
    (i) =>
      i.documentRefs.length >= 2 &&
      i.hasOperationalHistory &&
      !i.externallyConfirmed &&
      i.status === 'active'
  )

  // Missing relationships
  const missingRelationships: MissingRelationship[] = []
  for (const item of items) {
    if (item.relationships.length === 0 && item.status !== 'draft') {
      const suggestions = suggestRelationships(item, items)
      for (const s of suggestions.slice(0, 2)) {
        missingRelationships.push({
          itemId: item.id,
          itemStatement: item.statement,
          suggestedRelationshipType: s.suggestedRelationshipType as never,
          suggestedTargetType: 'other',
          reason: s.reason,
        })
      }
    }
  }

  return {
    organizationId,
    totalItems: items.length,
    byType,
    byMaturity,
    expiringDocuments: reminders,
    expiredDocuments: expiringDocs, // approximate
    selfReportedOnly,
    isolatedItems: graph.isolates,
    undocumentedItems,
    duplicateItems: duplicates,
    readyForEvidence: readyCandidates,
    readyForExternalValidation: readyForExternal,
    missingRelationships,
    generatedAt: new Date().toISOString(),
  }
}

// ==========================================================================
// DASHBOARD
// ==========================================================================

export function buildKnowledgeDashboard(organizationId: string): KnowledgeDashboardState {
  const items = getItemsByOrg(organizationId)
  const health = generateHealthReport(organizationId)
  const graph = buildKnowledgeGraph(organizationId)
  const readyCandidates = getReadyCandidates(organizationId)

  const byType: Record<string, number> = {}
  const byMaturity: Record<string, number> = {}
  const byStatus: Record<string, number> = {}

  for (const item of items) {
    byType[item.itemType] = (byType[item.itemType] ?? 0) + 1
    byMaturity[item.maturityLevel as string] = (byMaturity[item.maturityLevel as string] ?? 0) + 1
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1
  }

  const itemsWithDocs = items.filter((i) => i.documentRefs.length > 0).length

  const allCandidates = items.flatMap((i) => i.evidenceCandidates)
  const needsWork = allCandidates.filter((c) => c.validationStatus !== 'ready_for_evidence').length

  const actions = generateBestActions(health)

  return {
    institutionMemory: {
      totalItems: items.length,
      byType,
      byMaturity,
      byStatus,
    },
    evidenceGaps: health.undocumentedItems.map((i) => ({
      itemId: i.id,
      itemStatement: i.statement,
      requiredDocumentType: 'supporting_document',
      recommendation: `Upload supporting document for "${i.statement}"`,
    })),
    expiringDocuments: health.expiringDocuments,
    maturityDistribution: byMaturity,
    nextBestActions: actions,
    graphHealth: {
      totalRelationships: graph.relationships.length,
      orphanCount: graph.orphans.length,
      isolateCount: graph.isolates.length,
      hubCount: graph.hubItems.length,
    },
    evidenceCandidates: {
      total: allCandidates.length,
      ready: readyCandidates.length,
      needsWork,
    },
    capabilityProgress: {
      itemsLinked: itemsWithDocs,
      itemsUnlinked: items.length - itemsWithDocs,
      coveragePercent: items.length > 0 ? Math.round((itemsWithDocs / items.length) * 100) : 0,
    },
    programReadinessProgress: {
      programsWithEvidence: itemsWithDocs > 0 ? 1 : 0,
      programsWithoutEvidence: itemsWithDocs > 0 ? 0 : 1,
      overallReadiness: itemsWithDocs > 0 ? 'partial' : 'not_ready',
    },
    passportStatus: {
      isPublished: itemsWithDocs > 0,
      readinessLevel: itemsWithDocs > 0 ? 'partial' : 'not_ready',
    },
  }
}

function generateBestActions(health: KnowledgeHealthReport): string[] {
  const actions: string[] = []

  if (health.selfReportedOnly.length > 0) {
    actions.push(`${health.selfReportedOnly.length} item(s) self-reported only. Upload documents to advance maturity.`)
  }
  if (health.expiringDocuments.length > 0) {
    actions.push(`${health.expiringDocuments.length} document(s) expiring within 90 days.`)
  }
  if (health.isolatedItems.length > 0) {
    actions.push(`${health.isolatedItems.length} item(s) have no relationships. Connect to equipment, people, or facilities.`)
  }
  if (health.duplicateItems.length > 0) {
    actions.push(`${health.duplicateItems.length} duplicate group(s) detected. Review and merge.`)
  }
  if (health.readyForEvidence.length > 0) {
    actions.push(`${health.readyForEvidence.length} candidate(s) ready for evidence promotion.`)
  }
  if (health.readyForExternalValidation.length > 0) {
    actions.push(`${health.readyForExternalValidation.length} item(s) ready for external validation.`)
  }
  if (health.missingRelationships.length > 0) {
    actions.push(`${health.missingRelationships.length} suggested relationship(s) available.`)
  }

  return actions
}

// ==========================================================================
// KNOWLEDGE EXPLORER STATE
// ==========================================================================

export function buildExplorerState(
  organizationId: string,
  itemId?: string
): KnowledgeExplorerState {
  const items = getItemsByOrg(organizationId)
  const graph = buildKnowledgeGraph(organizationId)
  const selectedItem = itemId ? items.find((i) => i.id === itemId) : undefined
  const rels = selectedItem ? getRelationships(selectedItem.id) : { incoming: [], outgoing: [] }
  const candidates = selectedItem ? getCandidatesByItem(selectedItem.id) : []
  const readyCandidates = getReadyCandidates(organizationId)

  const missingInfo = selectedItem
    ? buildMissingInfo(selectedItem)
    : []

  const actions = selectedItem ? buildItemActions(selectedItem, candidates) : []

  return {
    selectedItem,
    view: selectedItem ? 'item_detail' : 'health',
    relationships: rels,
    attachedDocuments: selectedItem?.documentRefs ?? [],
    evidenceCandidates: candidates,
    missingInformation: missingInfo,
    relatedCapabilities: [],
    relatedPrograms: [],
    nextBestActions: actions,
    graphStats: {
      totalItems: items.length,
      totalRelationships: graph.relationships.length,
      orphans: graph.orphans.length,
      isolates: graph.isolates.length,
      hubs: graph.hubItems.length,
      candidatesTotal: items.flatMap((i) => i.evidenceCandidates).length,
      candidatesReady: readyCandidates.length,
    },
  }
}

function buildMissingInfo(item: KnowledgeItem): KnowledgeExplorerState['missingInformation'] {
  const missing: KnowledgeExplorerState['missingInformation'] = []

  if (item.documentRefs.length === 0) {
    missing.push({
      itemType: item.itemType,
      description: 'No supporting documents attached',
      whyNeeded: `Documents are required to advance ${item.statement} beyond EM1 maturity`,
      acquisitionMethod: 'document_upload',
    })
  }

  if (item.relationships.length === 0) {
    missing.push({
      itemType: item.itemType,
      description: 'No relationships to other knowledge items',
      whyNeeded: 'Relationships provide corroboration context',
      acquisitionMethod: 'guided_form',
    })
  }

  return missing
}

function buildItemActions(item: KnowledgeItem, candidates: EvidenceCandidate[]): string[] {
  const actions: string[] = []

  if (item.documentRefs.length === 0) {
    actions.push('Upload a supporting document')
  }
  if (item.relationships.length === 0) {
    actions.push('Connect this item to a related person, facility, or process')
  }
  if (candidates.some((c) => c.validationStatus === 'ready_for_evidence')) {
    actions.push('Promote ready candidates to Evidence Objects')
  }
  if (item.status === 'draft') {
    actions.push('Activate this knowledge item')
  }

  return actions
}
