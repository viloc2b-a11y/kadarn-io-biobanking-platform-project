// ==========================================================================
// Sprint A5 — Knowledge Explorer
// ==========================================================================
// Single navigation experience across all institutional knowledge.
// Consume todos los dominios e intelligence layers existentes.
// Solo runtime y state models — sin UI.
// ==========================================================================

import type {
  PersonProfile, PeopleDashboardState,
} from './people-intelligence'
import type {
  LabProfile, LabDashboardState,
} from './lab-intelligence'
import type {
  DocumentIntelligence, DocumentDashboardState,
} from './document-intelligence'
import type {
  RelationshipGraph,
} from './relationship-graph'
import type { TherapeuticAreaKey, CapabilityTypeKey, ProgramTypeKey, SpecimenTypeKey } from './taxonomy'

// ==========================================================================
// UNIFIED EXPLORER VIEW
// ==========================================================================

export type ExplorerDomain =
  | 'people'
  | 'capabilities'
  | 'programs'
  | 'documents'
  | 'equipment'
  | 'facilities'
  | 'laboratories'
  | 'relationships'
  | 'timeline'
  | 'overview'

export interface KnowledgeExplorerState {
  institutionId: string
  currentDomain: ExplorerDomain
  searchText: string | null
  activeFilters: ExplorerFilters
  sortBy: ExplorerSortField
  sortDirection: 'asc' | 'desc'
  selectedItemId: string | null
  expandedItems: string[]
  viewMode: 'list' | 'grid' | 'detail' | 'graph'
  
  // Cross-domain context
  relatedItems: RelatedItem[]
  dependencies: DependencyChain[]
  impactPreview: ImpactSummary | null
}

export interface ExplorerFilters {
  therapeuticAreas: TherapeuticAreaKey[]
  capabilityTypes: CapabilityTypeKey[]
  programTypes: ProgramTypeKey[]
  specimenTypes: SpecimenTypeKey[]
  statusFilter: string[]
  dateRange: { start: string; end: string } | null
  hasDocuments: boolean | null
  hasRelationships: boolean | null
}

export type ExplorerSortField =
  | 'name'
  | 'date'
  | 'relevance'
  | 'documents'
  | 'studies'
  | 'experience'
  | 'compliance'

export interface RelatedItem {
  itemId: string
  itemType: ExplorerDomain
  label: string
  relationship: string     // e.g., 'supports', 'located_in', 'certified_by'
  direction: 'from' | 'to'  // is this item pointing TO the selected item or FROM it
  strength: 'strong' | 'moderate' | 'weak'
}

export interface DependencyChain {
  fromItem: { id: string; label: string; type: ExplorerDomain }
  toItem: { id: string; label: string; type: ExplorerDomain }
  path: string[]             // "PI → Capability → Equipment → Facility"
  depth: number
  criticality: 'critical' | 'important' | 'supporting'
}

export interface ImpactSummary {
  itemId: string
  itemLabel: string
  directlyAffected: number
  indirectlyAffected: number
  severity: 'critical' | 'high' | 'moderate' | 'low'
  description: string
}

// ==========================================================================
// DOMAIN-SPECIFIC EXPLORER STATES
// ==========================================================================

export interface PeopleExplorerDetail {
  profile: PersonProfile
  dashboard: PeopleDashboardState
  relatedCapabilities: { capability: CapabilityTypeKey; label: string }[]
  relatedPrograms: { program: ProgramTypeKey; label: string }[]
  relatedDocuments: { documentId: string; label: string; type: string }[]
  timeline: { date: string; event: string }[]
}

export interface CapabilityExplorerDetail {
  capabilityType: CapabilityTypeKey
  label: string
  category: string
  demonstratedBy: { personId: string; personName: string; proficiency: string }[]
  supportedByEquipment: { equipmentId: string; label: string }[]
  supportedByFacilities: { facilityId: string; label: string }[]
  supportedByDocuments: { documentId: string; label: string }[]
  requiredForPrograms: { program: ProgramTypeKey; label: string }[]
  evidenceStrength: 'strong' | 'moderate' | 'weak' | 'none'
}

export interface ProgramExplorerDetail {
  programType: ProgramTypeKey
  label: string
  phase: string
  requiredCapabilities: { capability: CapabilityTypeKey; fulfilled: boolean }[]
  participatingPeople: { personId: string; personName: string; role: string }[]
  supportingDocuments: { documentId: string; label: string }[]
  readinessStatus: 'eligible' | 'partial' | 'not_eligible' | 'unknown'
  gapSummary: string | null
}

export interface DocumentExplorerDetail {
  document: DocumentIntelligence
  linkedTo: { entityType: string; entityId: string; label: string; relationship: string }[]
  proves: CapabilityTypeKey[]
  enables: ProgramTypeKey[]
  expiresIn: number | null  // days
  lifecycleProgress: number // 0-100
}

export interface EquipmentExplorerDetail {
  equipmentId: string
  category: string
  label: string
  labName: string | null
  facilityName: string | null
  usedInWorkflows: string[]
  supportsCapabilities: CapabilityTypeKey[]
  status: string
  healthScore: number
  nextMaintenanceDue: string | null
}

export interface FacilityExplorerDetail {
  facilityId: string
  facilityType: string
  label: string
  labs: { labId: string; labName: string }[]
  equipment: { equipmentId: string; label: string }[]
  people: { personId: string; personName: string; role: string }[]
  capabilities: CapabilityTypeKey[]
  programs: ProgramTypeKey[]
  documents: { documentId: string; label: string; type: string }[]
}

export interface LaboratoryExplorerDetail {
  labProfile: LabProfile
  equipmentList: { equipmentId: string; label: string; status: string }[]
  workflows: { workflowId: string; name: string; utilization: number }[]
  storageHealth: number
  keyCapabilities: CapabilityTypeKey[]
}

// ==========================================================================
// SEARCH ENGINE
// ==========================================================================

export interface SearchResult {
  itemId: string
  itemType: ExplorerDomain
  label: string
  description: string | null
  relevanceScore: number
  matchedOn: string[]  // which fields matched
  highlights: string[] // excerpts with match highlighted
}

export interface SearchIndex {
  institutionId: string
  indexedAt: string
  totalEntries: number
  entries: SearchEntry[]
}

export interface SearchEntry {
  itemId: string
  itemType: ExplorerDomain
  label: string
  description: string | null
  keywords: string[]
  tags: string[]
  relatedItemIds: string[]
  relatedItemLabels: string[]
}

/**
 * Search across the unified knowledge index.
 * Simple token-based matching — deterministic, no AI.
 */
export function searchKnowledge(params: {
  index: SearchIndex
  query: string
  domainFilter?: ExplorerDomain[]
  maxResults?: number
}): SearchResult[] {
  const query = params.query.toLowerCase().trim()
  if (!query) return []

  const tokens = query.split(/\s+/)
  const results: SearchResult[] = []

  for (const entry of params.index.entries) {
    if (params.domainFilter && !params.domainFilter.includes(entry.itemType)) continue

    const searchableText = [
      entry.label,
      entry.description ?? '',
      ...entry.keywords,
      ...entry.tags,
      ...entry.relatedItemLabels,
    ].join(' ').toLowerCase()

    const matchedTokens: string[] = []
    let score = 0

    for (const token of tokens) {
      if (searchableText.includes(token)) {
        matchedTokens.push(token)
        // Exact label match = highest relevance
        if (entry.label.toLowerCase().includes(token)) score += 10
        // Keyword match
        else if (entry.keywords.some((k) => k.toLowerCase().includes(token))) score += 7
        // Tag match
        else if (entry.tags.some((t) => t.toLowerCase().includes(token))) score += 5
        // Description match
        else score += 3
      }
    }

    if (matchedTokens.length > 0) {
      results.push({
        itemId: entry.itemId,
        itemType: entry.itemType,
        label: entry.label,
        description: entry.description,
        relevanceScore: score,
        matchedOn: matchedTokens,
        highlights: generateHighlights(searchableText, tokens),
      })
    }
  }

  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, params.maxResults ?? 20)
}

function generateHighlights(text: string, tokens: string[]): string[] {
  const highlights: string[] = []
  for (const token of tokens) {
    const idx = text.indexOf(token)
    if (idx >= 0) {
      const start = Math.max(0, idx - 30)
      const end = Math.min(text.length, idx + token.length + 30)
      highlights.push(`...${text.slice(start, end)}...`)
    }
  }
  return highlights.slice(0, 3)
}

// ==========================================================================
// KNOWLEDGE COVERAGE MAP
// ==========================================================================

export interface KnowledgeCoverage {
  institutionId: string
  calculatedAt: string
  domains: DomainCoverage[]
  overallCoverage: number // 0-100
  strongestAreas: string[]
  weakestAreas: string[]
  recommendations: string[]
}

export interface DomainCoverage {
  domain: ExplorerDomain
  totalExpected: number
  documented: number
  percentage: number
  status: 'complete' | 'good' | 'partial' | 'minimal' | 'empty'
  gaps: string[]
}

export function calculateKnowledgeCoverage(params: {
  institutionId: string
  peopleCount: number
  capabilitiesCount: number
  programsCount: number
  documentsCount: number
  equipmentCount: number
  facilitiesCount: number
  laboratoriesCount: number
  relationshipsCount: number
}): KnowledgeCoverage {
  const now = new Date().toISOString()
  const domains: DomainCoverage[] = [
    { domain: 'people', totalExpected: 15, documented: params.peopleCount, percentage: Math.round((params.peopleCount / 15) * 100), status: coverageStatus(params.peopleCount / 15), gaps: params.peopleCount < 5 ? ['Few people documented'] : [] },
    { domain: 'capabilities', totalExpected: 57, documented: params.capabilitiesCount, percentage: Math.round((params.capabilitiesCount / 57) * 100), status: coverageStatus(params.capabilitiesCount / 57), gaps: [] },
    { domain: 'programs', totalExpected: 20, documented: params.programsCount, percentage: Math.round((params.programsCount / 20) * 100), status: coverageStatus(params.programsCount / 20), gaps: [] },
    { domain: 'documents', totalExpected: 42, documented: params.documentsCount, percentage: Math.round((params.documentsCount / 42) * 100), status: coverageStatus(params.documentsCount / 42), gaps: params.documentsCount < 8 ? ['Missing critical documents'] : [] },
    { domain: 'equipment', totalExpected: 10, documented: params.equipmentCount, percentage: Math.round((params.equipmentCount / 10) * 100), status: coverageStatus(params.equipmentCount / 10), gaps: [] },
    { domain: 'facilities', totalExpected: 3, documented: params.facilitiesCount, percentage: Math.round((params.facilitiesCount / 3) * 100), status: coverageStatus(params.facilitiesCount / 3), gaps: [] },
    { domain: 'laboratories', totalExpected: 5, documented: params.laboratoriesCount, percentage: Math.round((params.laboratoriesCount / 5) * 100), status: coverageStatus(params.laboratoriesCount / 5), gaps: [] },
    { domain: 'relationships', totalExpected: 20, documented: params.relationshipsCount, percentage: Math.round((params.relationshipsCount / 20) * 100), status: coverageStatus(params.relationshipsCount / 20), gaps: [] },
  ]

  const overall = Math.round(domains.reduce((sum, d) => sum + d.percentage, 0) / domains.length)
  const strongest = domains.filter((d) => d.percentage >= 80).map((d) => d.domain)
  const weakest = domains.filter((d) => d.percentage < 30).map((d) => d.domain)

  const recommendations: string[] = []
  for (const d of domains) {
    if (d.percentage < 30) recommendations.push(`Expand ${d.domain} knowledge — only ${d.percentage}% covered.`)
  }

  return { institutionId: params.institutionId, calculatedAt: now, domains, overallCoverage: overall, strongestAreas: strongest, weakestAreas: weakest, recommendations }
}

function coverageStatus(ratio: number): DomainCoverage['status'] {
  if (ratio >= 1) return 'complete'
  if (ratio >= 0.7) return 'good'
  if (ratio >= 0.3) return 'partial'
  if (ratio > 0) return 'minimal'
  return 'empty'
}

// ==========================================================================
// TIMELINE EXPLORER
// ==========================================================================

export interface TimelineExplorerState {
  institutionId: string
  dateRange: { start: string; end: string }
  domains: ExplorerDomain[]
  events: TimelineEvent[]
  milestones: TimelineMilestone[]
  growthIndicators: GrowthIndicator[]
}

export interface TimelineEvent {
  eventId: string
  domain: ExplorerDomain
  occurredAt: string
  label: string
  description: string
  significance: 'major' | 'minor' | 'routine'
  relatedItemIds: string[]
}

export interface TimelineMilestone {
  milestoneId: string
  date: string
  label: string
  description: string
  category: 'certification' | 'expansion' | 'personnel' | 'study' | 'capability' | 'infrastructure'
  impactedDomains: ExplorerDomain[]
}

export interface GrowthIndicator {
  indicator: string
  trend: 'increasing' | 'stable' | 'decreasing'
  currentValue: number
  previousValue: number
  percentageChange: number
  period: string
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const KNOWLEDGE_EXPLORER = {
  searchKnowledge,
  calculateKnowledgeCoverage,
}
