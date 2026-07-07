// ==========================================================================
// Knowledge Domain Runtime (IKM/EVM Sprint 4)
// ==========================================================================

import type {
  KnowledgeDomain,
  KnowledgeDomainId,
  DomainProgress,
  DomainRequiredItem,
  KnowledgeCompleteness,
} from './domain-types'
import { KNOWLEDGE_DOMAIN_CATALOG } from './domain-types'
import { getItemsByOrg } from './runtime'
import type { KnowledgeItem } from './types'

// ==========================================================================
// DOMAIN BUILDING
// ==========================================================================

/**
 * Build all domains for an organization, populating them with knowledge items.
 */
export function buildDomains(organizationId: string): KnowledgeDomain[] {
  const items = getItemsByOrg(organizationId)

  return KNOWLEDGE_DOMAIN_CATALOG.map((template) => {
    // Match items to domain by itemType and category
    const domainItems = matchItemsToDomain(items, template.id)

    // Build required items (from catalog template)
    const requiredItems: DomainRequiredItem[] = template.requiredItems.map((req) => ({
      ...req,
      fulfilled: domainItems.some(
        (i) => i.itemType === req.itemType || i.tags.includes(req.label.toLowerCase())
      ),
      fulfilledById: domainItems.find(
        (i) => i.itemType === req.itemType || i.tags.includes(req.label.toLowerCase())
      )?.id,
    }))

    const missingItems = requiredItems.filter((r) => !r.fulfilled)
    const progress = computeDomainProgress(domainItems)

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      knowledgeItems: domainItems,
      requiredItems,
      missingItems,
      progress,
      assessedAt: new Date().toISOString(),
    }
  })
}

/**
 * Get a single domain by ID.
 */
export function getDomain(organizationId: string, domainId: KnowledgeDomainId): KnowledgeDomain | undefined {
  return buildDomains(organizationId).find((d) => d.id === domainId)
}

// ==========================================================================
// DOMAIN PROGRESS
// ==========================================================================

function computeDomainProgress(items: KnowledgeItem[]): DomainProgress {
  const total = items.length
  const withDocs = items.filter((i) => i.documentRefs.length > 0).length
  const knowledgeCoverage = total > 0 ? Math.round((withDocs / total) * 100) : 0

  // Count documents
  const allDocs = items.flatMap((i) => i.documentRefs)
  const now = new Date()
  const expiringDocs = allDocs.filter((d) => {
    if (!d.expires || !d.expirationDate) return false
    const daysUntil = Math.ceil((new Date(d.expirationDate).getTime() - now.getTime()) / 86400000)
    return daysUntil > 0 && daysUntil <= 90
  }).length
  const expiredDocs = allDocs.filter((d) => {
    if (!d.expires || !d.expirationDate) return false
    return new Date(d.expirationDate) < now
  }).length

  const documentCoverage = total > 0 ? Math.round((allDocs.length / Math.max(1, total)) * 100) : 0
  const evidenceCoverage = withDocs > 0 ? Math.round((withDocs / Math.max(1, total)) * 100) : 0

  // Average maturity (EM0=0, EM6=6)
  const totalMaturity = items.reduce((sum, i) => {
    const levelMap: Record<string, number> = {
      EM0_NOT_DOCUMENTED: 0, EM1_SELF_REPORTED: 1,
      EM2_DOCUMENT_SUPPORTED: 2, EM3_INTERNALLY_CORROBORATED: 3,
      EM4_OPERATIONALLY_DEMONSTRATED: 4, EM5_EXTERNALLY_CONFIRMED: 5,
      EM6_CONTINUOUSLY_VALIDATED: 6,
    }
    return sum + (levelMap[i.maturityLevel as string] ?? 0)
  }, 0)
  const averageMaturity = total > 0 ? Math.round((totalMaturity / total) * 100) / 100 : 0

  const completeness = computeCompleteness(total, withDocs, allDocs.length, expiringDocs + expiredDocs)

  return {
    knowledgeCoverage,
    documentCoverage,
    averageMaturity,
    evidenceCoverage,
    completeness,
    missingDocs: total - withDocs,
    expiringDocs,
    expiredDocs,
    totalItems: total,
    itemsWithDocs: withDocs,
    nextBestActions: generateDomainActions(total, withDocs, expiringDocs, expiredDocs, completeness),
  }
}

// ==========================================================================
// COMPLETENESS ENGINE
// ==========================================================================

function computeCompleteness(
  total: number,
  withDocs: number,
  docCount: number,
  problemDocs: number
): KnowledgeCompleteness {
  if (total === 0) return 'not_started'
  if (withDocs === 0) return 'started'

  const ratio = withDocs / total
  if (ratio < 0.3) return 'partially_documented'
  if (ratio < 0.6) return 'partially_documented'
  if (ratio < 0.85 || problemDocs > 0) return 'well_documented'
  if (ratio < 1.0) return 'nearly_complete'
  return 'complete'
}

// ==========================================================================
// DOMAIN ACTIONS (Guided Growth — rules only, no AI)
// ==========================================================================

function generateDomainActions(
  total: number,
  withDocs: number,
  expiring: number,
  expired: number,
  completeness: KnowledgeCompleteness
): string[] {
  const actions: string[] = []

  if (total === 0) {
    actions.push('Add your first knowledge item to this domain')
    return actions
  }

  if (withDocs === 0) {
    actions.push('Upload supporting documents for your knowledge items')
    return actions
  }

  if (expired > 0) {
    actions.push(`${expired} document(s) have expired — replace immediately`)
  }

  if (expiring > 0) {
    actions.push(`${expiring} document(s) expiring within 90 days — plan renewal`)
  }

  if (completeness === 'partially_documented') {
    actions.push('Upload documents for items without supporting evidence')
  }

  if (completeness === 'well_documented') {
    actions.push('Review items without documents to reach Nearly Complete')
  }

  if (completeness === 'nearly_complete') {
    actions.push('Address remaining document gaps to reach Complete')
  }

  if (completeness === 'complete') {
    actions.push('Maintain evidence currency — review expiring documents')
  }

  return actions
}

// ==========================================================================
// ITEM-TO-DOMAIN MATCHING
// ==========================================================================

function matchItemsToDomain(items: KnowledgeItem[], domainId: KnowledgeDomainId): KnowledgeItem[] {
  const matchers: Record<KnowledgeDomainId, (item: KnowledgeItem) => boolean> = {
    organization: (i) => i.itemType === 'regulatory' && i.tags.some((t) => t.includes('org') || t.includes('registration')),
    people: (i) => i.itemType === 'person',
    facilities: (i) => i.itemType === 'facility',
    equipment: (i) => i.itemType === 'equipment',
    laboratory: (i) => i.itemType === 'certification' || i.category === 'laboratory' || i.tags.includes('lab'),
    regulatory: (i) => i.itemType === 'regulatory' || i.itemType === 'policy',
    quality: (i) => i.itemType === 'quality' || i.category === 'quality' || i.tags.includes('qms') || i.tags.includes('iso'),
    programs: (i) => i.itemType === 'capability' || i.itemType === 'goal',
    research_experience: (i) => i.itemType === 'historical_event',
    biospecimen_operations: (i) =>
      i.itemType === 'process' && (i.tags.includes('biospecimen') || i.tags.includes('sample') || i.tags.includes('collection')),
    technology: (i) => i.itemType === 'asset' || i.tags.includes('lims') || i.tags.includes('system'),
    community: (i) => i.tags.includes('population') || i.tags.includes('community'),
    documents: (i) => i.itemType === 'other',
    custom: () => false, // custom domains get no automatic matching
  }

  const matcher = matchers[domainId]
  return matcher ? items.filter(matcher) : []
}

// ==========================================================================
// DASHBOARD AGGREGATION
// ==========================================================================

import type { InstitutionDashboardState, DomainCompletionEntry } from './domain-types'
import { findDuplicates, buildKnowledgeGraph } from './graph'
import { getReadyCandidates, getExpiringDocuments } from './runtime'

export function buildInstitutionDashboard(organizationId: string): InstitutionDashboardState {
  const domains = buildDomains(organizationId)
  const allItems = domains.flatMap((d) => d.knowledgeItems)
  const graph = buildKnowledgeGraph(organizationId)
  const duplicates = findDuplicates(organizationId)
  const readyCandidates = getReadyCandidates(organizationId)
  const expiringDocs = getExpiringDocuments(organizationId, 90)

  // Institution memory
  const byType: Record<string, number> = {}
  for (const item of allItems) {
    byType[item.itemType] = (byType[item.itemType] ?? 0) + 1
  }

  const domainsCompleted = domains.filter((d) => d.progress.completeness === 'complete').length

  // Domain completion
  const domainCompletion: DomainCompletionEntry[] = domains.map((d) => ({
    domainId: d.id,
    name: d.name,
    completeness: d.progress.completeness,
    coverage: d.progress.knowledgeCoverage,
    maturity: d.progress.averageMaturity,
    itemCount: d.knowledgeItems.length,
  }))

  // Evidence maturity
  const byLevel: Record<string, number> = {}
  let totalMaturity = 0
  let aboveEM3 = 0
  let belowEM2 = 0
  for (const item of allItems) {
    byLevel[item.maturityLevel as string] = (byLevel[item.maturityLevel as string] ?? 0) + 1
    const levelMap: Record<string, number> = {
      EM0_NOT_DOCUMENTED: 0, EM1_SELF_REPORTED: 1, EM2_DOCUMENT_SUPPORTED: 2,
      EM3_INTERNALLY_CORROBORATED: 3, EM4_OPERATIONALLY_DEMONSTRATED: 4,
      EM5_EXTERNALLY_CONFIRMED: 5, EM6_CONTINUOUSLY_VALIDATED: 6,
    }
    const lvl = levelMap[item.maturityLevel as string] ?? 0
    totalMaturity += lvl
    if (lvl >= 3) aboveEM3++
    if (lvl <= 1) belowEM2++
  }

  // Document status
  const allDocs = allItems.flatMap((i) => i.documentRefs)
  const now = new Date()
  const expired = allDocs.filter((d) => d.expires && d.expirationDate && new Date(d.expirationDate) < now).length
  const withoutDocs = allItems.filter((i) => i.documentRefs.length === 0).length

  // Recommended actions
  const actions: string[] = []
  if (belowEM2 > 0) actions.push(`${belowEM2} item(s) at EM1 or below — upload supporting documents`)
  if (expired > 0) actions.push(`${expired} document(s) expired — replace immediately`)
  if (expiringDocs.length > 0) actions.push(`${expiringDocs.length} document(s) expiring within 90 days`)
  if (graph.isolates.length > 0) actions.push(`${graph.isolates.length} isolated item(s) — connect to people, facilities, or equipment`)
  if (duplicates.length > 0) actions.push(`${duplicates.length} duplicate group(s) detected — review`)
  if (readyCandidates.length > 0) actions.push(`${readyCandidates.length} evidence candidate(s) ready for promotion`)
  if (domainsCompleted < domains.length) actions.push(`${domains.length - domainsCompleted} domain(s) incomplete`)

  return {
    organizationId,
    institutionMemory: {
      totalItems: allItems.length,
      totalDomains: domains.length,
      domainsCompleted,
      byType,
    },
    domainCompletion,
    evidenceMaturity: {
      byLevel,
      averageMaturity: allItems.length > 0 ? Math.round((totalMaturity / allItems.length) * 100) / 100 : 0,
      itemsAboveEM3: aboveEM3,
      itemsBelowEM2: belowEM2,
    },
    documentStatus: {
      total: allDocs.length,
      expiring: expiringDocs.length,
      expired,
      missing: withoutDocs,
    },
    knowledgeHealth: {
      orphans: graph.orphans.length,
      isolates: graph.isolates.length,
      duplicates: duplicates.length,
      readyForEvidence: readyCandidates.length,
    },
    recentChanges: [],
    upcomingExpirations: expiringDocs.map((d) => ({
      documentId: d.documentId,
      documentName: d.name,
      expirationDate: d.expirationDate ?? '',
      daysUntil: d.expirationDate
        ? Math.ceil((new Date(d.expirationDate).getTime() - Date.now()) / 86400000)
        : 0,
    })),
    recommendedActions: actions,
    generatedAt: new Date().toISOString(),
  }
}
