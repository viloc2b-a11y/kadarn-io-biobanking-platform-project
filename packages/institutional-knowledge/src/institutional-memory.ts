// ==========================================================================
// IKM/EVM Sprint — Institutional Memory & Continuous Intelligence
// ==========================================================================
// Transforms Institutional Knowledge into Institutional Memory.
// Nothing is overwritten. Everything becomes part of the institutional timeline.
// Sits between IKM and Evidence Core — permanent historical layer.
// ==========================================================================

import type { KnowledgeItem, KnowledgeAssetStatus } from './types'

// ==========================================================================
// PART 1 — Knowledge Timeline (Temporal States)
// ==========================================================================

export type TemporalState =
  | 'created'
  | 'updated'
  | 'superseded'
  | 'archived'
  | 'reactivated'
  | 'expired'
  | 'renewed'
  | 'removed'

export interface TemporalEvent {
  eventId: string
  knowledgeItemId: string
  state: TemporalState
  previousState: TemporalState | null
  occurredAt: string
  description: string
  actorId?: string
  metadata: Record<string, unknown>
  /** What category of institutional change this represents */
  changeCategory: ChangeCategory
}

export type ChangeCategory =
  | 'knowledge_created'
  | 'knowledge_updated'
  | 'knowledge_retired'
  | 'knowledge_renewed'
  | 'equipment_change'
  | 'facility_change'
  | 'personnel_change'
  | 'capability_change'
  | 'compliance_change'
  | 'organizational_change'
  | 'research_milestone'
  | 'quality_event'

/**
 * Create a temporal event for a Knowledge Item state change.
 * Every event is immutable — the institutional timeline is append-only.
 */
export function recordTemporalEvent(params: {
  knowledgeItemId: string
  state: TemporalState
  previousState: TemporalState | null
  description: string
  changeCategory: ChangeCategory
  actorId?: string
  metadata?: Record<string, unknown>
}): TemporalEvent {
  return {
    eventId: `te-${params.knowledgeItemId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    knowledgeItemId: params.knowledgeItemId,
    state: params.state,
    previousState: params.previousState,
    occurredAt: new Date().toISOString(),
    description: params.description,
    actorId: params.actorId,
    metadata: params.metadata ?? {},
    changeCategory: params.changeCategory,
  }
}

/**
 * Generate the timeline for a single Knowledge Item from its events.
 */
export function buildItemTimeline(events: TemporalEvent[]): TemporalEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  )
}

// ==========================================================================
// PART 2 — Institutional Memory Objects
// ==========================================================================

export type MemoryEventType =
  | 'equipment_acquired'
  | 'equipment_replaced'
  | 'equipment_retired'
  | 'pi_joined'
  | 'pi_left'
  | 'laboratory_expanded'
  | 'laboratory_opened'
  | 'freezer_installed'
  | 'freezer_decommissioned'
  | 'clia_renewed'
  | 'clia_expired'
  | 'capa_completed'
  | 'capa_opened'
  | 'irb_changed'
  | 'irb_renewed'
  | 'network_expanded'
  | 'network_contracted'
  | 'facility_opened'
  | 'facility_closed'
  | 'program_completed'
  | 'program_started'
  | 'capability_acquired'
  | 'capability_lost'
  | 'license_renewed'
  | 'license_expired'
  | 'training_completed'
  | 'sop_published'
  | 'sop_revised'
  | 'audit_completed'
  | 'certification_gained'
  | 'certification_lost'
  | 'insurance_updated'
  | 'organization_restructured'
  | 'research_milestone_reached'
  | 'quality_system_improved'

export interface MemoryEvent {
  id: string
  type: MemoryEventType
  institutionId: string
  occurredAt: string
  recordedAt: string
  description: string
  category: MemoryCategory
  relatedItemIds: string[]
  relatedDocumentIds: string[]
  significance: 'major' | 'minor' | 'routine'
  metadata: Record<string, unknown>
}

export type MemoryCategory =
  | 'equipment'
  | 'facility'
  | 'personnel'
  | 'compliance'
  | 'quality'
  | 'research'
  | 'capability'
  | 'organization'
  | 'network'
  | 'licensing'

/**
 * Create an institutional memory event.
 * These are higher-level than Knowledge timeline events —
 * they represent meaningful institutional changes.
 */
export function recordMemoryEvent(params: {
  type: MemoryEventType
  institutionId: string
  occurredAt?: string
  description: string
  category: MemoryCategory
  relatedItemIds?: string[]
  relatedDocumentIds?: string[]
  significance?: MemoryEvent['significance']
  metadata?: Record<string, unknown>
}): MemoryEvent {
  return {
    id: `me-${params.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: params.type,
    institutionId: params.institutionId,
    occurredAt: params.occurredAt ?? new Date().toISOString(),
    recordedAt: new Date().toISOString(),
    description: params.description,
    category: params.category,
    relatedItemIds: params.relatedItemIds ?? [],
    relatedDocumentIds: params.relatedDocumentIds ?? [],
    significance: params.significance ?? 'routine',
    metadata: params.metadata ?? {},
  }
}

// ==========================================================================
// PART 3 — Institutional Evolution
// ==========================================================================

export interface EvolutionSnapshot {
  snapshotId: string
  institutionId: string
  capturedAt: string
  period: { start: string; end: string }
  metrics: EvolutionMetrics
  deltas: InstitutionalDelta[]
  insights: ContinuousInsight[]
}

export interface EvolutionMetrics {
  totalKnowledgeItems: number
  activeItems: number
  archivedItems: number
  totalMemoryEvents: number
  capabilitiesGained: number
  capabilitiesLost: number
  equipmentAdded: number
  equipmentRetired: number
  personnelChanges: number
  complianceEvents: number
  qualityEvents: number
  researchMilestones: number
  networkChanges: number
}

export interface InstitutionalDelta {
  type: DeltaType
  description: string
  itemId?: string
  previousValue?: string
  newValue?: string
  detectedAt: string
  significance: 'major' | 'minor' | 'routine'
}

export type DeltaType =
  | 'new_capability'
  | 'lost_capability'
  | 'new_equipment'
  | 'retired_equipment'
  | 'new_laboratory'
  | 'facility_expansion'
  | 'facility_closure'
  | 'license_renewal'
  | 'license_expiration'
  | 'training_completion'
  | 'major_document_revision'
  | 'organization_restructuring'
  | 'research_milestone'
  | 'personnel_change'
  | 'quality_improvement'
  | 'compliance_update'
  | 'network_change'
  | 'knowledge_retirement'

export interface ContinuousInsight {
  insightId: string
  title: string
  description: string
  category: InsightCategory
  confidence: 'high' | 'medium' | 'low'
  supportingEventCount: number
  timespan: { start: string; end: string }
  derivedAt: string
  explainability: string
}

export type InsightCategory =
  | 'growth'
  | 'maturation'
  | 'expansion'
  | 'improvement'
  | 'decline'
  | 'stabilization'
  | 'diversification'
  | 'specialization'

// ==========================================================================
// PART 4 — Delta Detection Engine
// ===========================================================================

/**
 * Compare two temporal snapshots and detect what changed.
 * Deterministic — rules-based, not AI.
 */
export function detectDeltas(params: {
  institutionId: string
  previousEvents: TemporalEvent[]
  currentEvents: TemporalEvent[]
  referenceDate?: string
}): InstitutionalDelta[] {
  const deltas: InstitutionalDelta[] = []
  const prevMap = new Map(params.previousEvents.map((e) => [e.knowledgeItemId, e]))
  const currMap = new Map(params.currentEvents.map((e) => [e.knowledgeItemId, e]))
  const now = params.referenceDate ?? new Date().toISOString()

  // Items that exist now but didn't before → new
  for (const [id, curr] of currMap) {
    if (!prevMap.has(id)) {
      deltas.push(mapToDelta(curr, 'new', now))
    }
  }

  // Items that existed before but not now → removed/lost
  for (const [id, prev] of prevMap) {
    if (!currMap.has(id)) {
      deltas.push(mapToDelta(prev, 'removed', now))
    }
  }

  // Items that changed state
  for (const [id, curr] of currMap) {
    const prev = prevMap.get(id)
    if (prev && prev.state !== curr.state) {
      deltas.push({
        type: mapStateToDeltaType(curr.state, curr.changeCategory),
        description: `"${id}" changed from "${prev.state}" to "${curr.state}": ${curr.description}`,
        itemId: id,
        previousValue: prev.state,
        newValue: curr.state,
        detectedAt: now,
        significance: determineSignificance(curr.state, curr.changeCategory),
      })
    }
  }

  return deltas
}

function mapToDelta(event: TemporalEvent, direction: 'new' | 'removed', now: string): InstitutionalDelta {
  const isNew = direction === 'new'
  return {
    type: isNew
      ? determineNewDeltaType(event.changeCategory)
      : determineRemovedDeltaType(event.changeCategory),
    description: isNew
      ? `New ${event.changeCategory.replace(/_/g, ' ')}: ${event.description}`
      : `${event.changeCategory.replace(/_/g, ' ')} removed: ${event.description}`,
    itemId: event.knowledgeItemId,
    previousValue: isNew ? undefined : event.state,
    newValue: isNew ? event.state : undefined,
    detectedAt: now,
    significance: isNew ? 'major' : 'minor',
  }
}

function determineNewDeltaType(cat: ChangeCategory): DeltaType {
  const map: Record<ChangeCategory, DeltaType> = {
    knowledge_created: 'new_capability',
    knowledge_updated: 'quality_improvement',
    knowledge_retired: 'knowledge_retirement',
    knowledge_renewed: 'license_renewal',
    equipment_change: 'new_equipment',
    facility_change: 'facility_expansion',
    personnel_change: 'personnel_change',
    capability_change: 'new_capability',
    compliance_change: 'compliance_update',
    organizational_change: 'organization_restructuring',
    research_milestone: 'research_milestone',
    quality_event: 'quality_improvement',
  }
  return map[cat] ?? 'new_capability'
}

function determineRemovedDeltaType(cat: ChangeCategory): DeltaType {
  const map: Record<ChangeCategory, DeltaType> = {
    knowledge_created: 'knowledge_retirement',
    knowledge_updated: 'knowledge_retirement',
    knowledge_retired: 'lost_capability',
    knowledge_renewed: 'license_expiration',
    equipment_change: 'retired_equipment',
    facility_change: 'facility_closure',
    personnel_change: 'personnel_change',
    capability_change: 'lost_capability',
    compliance_change: 'compliance_update',
    organizational_change: 'organization_restructuring',
    research_milestone: 'research_milestone',
    quality_event: 'quality_improvement',
  }
  return map[cat] ?? 'lost_capability'
}

function mapStateToDeltaType(state: TemporalState, cat: ChangeCategory): DeltaType {
  if (state === 'renewed') return 'license_renewal'
  if (state === 'expired') return 'license_expiration'
  if (state === 'removed') return 'lost_capability'
  if (state === 'superseded') return 'major_document_revision'
  return determineNewDeltaType(cat)
}

function determineSignificance(state: TemporalState, cat: ChangeCategory): InstitutionalDelta['significance'] {
  if (cat === 'capability_change' && (state === 'created' || state === 'removed')) return 'major'
  if (cat === 'facility_change' && state === 'created') return 'major'
  if (cat === 'compliance_change' && state === 'expired') return 'major'
  if (cat === 'research_milestone') return 'major'
  if (state === 'renewed' || state === 'updated') return 'routine'
  return 'minor'
}

// ==========================================================================
// PART 5 — Continuous Intelligence Engine
// ==========================================================================

/**
 * Generate deterministic, explainable insights from institutional memory.
 * No AI. Rules-based. Every insight traces to specific events.
 */
export function generateContinuousInsights(params: {
  institutionId: string
  events: MemoryEvent[]
  periodMonths?: number
}): ContinuousInsight[] {
  const insights: ContinuousInsight[] = []
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - (params.periodMonths ?? 12))

  const recentEvents = params.events.filter(
    (e) => new Date(e.occurredAt) >= cutoff
  )

  if (recentEvents.length === 0) return insights

  const categoryCounts = countByCategory(recentEvents)

  // Insight 1: Growth detection
  const capabilityEvents = recentEvents.filter(
    (e) => e.type === 'capability_acquired' || e.type === 'capability_lost'
  )
  const gained = capabilityEvents.filter((e) => e.type === 'capability_acquired').length
  const lost = capabilityEvents.filter((e) => e.type === 'capability_lost').length

  if (gained > lost && gained > 0) {
    insights.push({
      insightId: `ci-growth-${Date.now()}`,
      title: 'Institution is growing capabilities',
      description: `${gained} new capabilities acquired vs ${lost} lost in the last ${params.periodMonths ?? 12} months.`,
      category: 'growth',
      confidence: gained > lost * 2 ? 'high' : 'medium',
      supportingEventCount: capabilityEvents.length,
      timespan: { start: cutoff.toISOString(), end: now.toISOString() },
      derivedAt: now.toISOString(),
      explainability: `Detected from ${gained} capability_acquired events and ${lost} capability_lost events. Net gain: ${gained - lost}.`,
    })
  }

  if (lost > gained && lost > 0) {
    insights.push({
      insightId: `ci-decline-${Date.now()}`,
      title: 'Institution has lost capabilities',
      description: `${lost} capabilities lost vs ${gained} gained. Consider reviewing lost capabilities.`,
      category: 'decline',
      confidence: 'medium',
      supportingEventCount: capabilityEvents.length,
      timespan: { start: cutoff.toISOString(), end: now.toISOString() },
      derivedAt: now.toISOString(),
      explainability: `Detected from ${lost} capability_lost events vs ${gained} capability_acquired events.`,
    })
  }

  // Insight 2: Equipment expansion
  const equipAdded = recentEvents.filter((e) => e.type === 'equipment_acquired').length
  const equipRemoved = recentEvents.filter(
    (e) => e.type === 'equipment_retired' || e.type === 'equipment_replaced'
  ).length

  if (equipAdded > 0 && equipAdded >= equipRemoved) {
    insights.push({
      insightId: `ci-equipment-${Date.now()}`,
      title: 'Equipment infrastructure expanding',
      description: `${equipAdded} equipment items added vs ${equipRemoved} retired. Infrastructure is growing.`,
      category: 'expansion',
      confidence: equipAdded > equipRemoved * 2 ? 'high' : 'medium',
      supportingEventCount: equipAdded + equipRemoved,
      timespan: { start: cutoff.toISOString(), end: now.toISOString() },
      derivedAt: now.toISOString(),
      explainability: `Net equipment change: +${equipAdded - equipRemoved}.`,
    })
  }

  // Insight 3: Quality system improvement
  const qualityEvents = recentEvents.filter(
    (e) =>
      e.type === 'capa_completed' ||
      e.type === 'quality_system_improved' ||
      e.type === 'audit_completed'
  )

  if (qualityEvents.length >= 3) {
    insights.push({
      insightId: `ci-quality-${Date.now()}`,
      title: 'Quality system actively maintained',
      description: `${qualityEvents.length} quality events (CAPAs, audits, improvements) recorded. System is actively managed.`,
      category: 'improvement',
      confidence: qualityEvents.length >= 5 ? 'high' : 'medium',
      supportingEventCount: qualityEvents.length,
      timespan: { start: cutoff.toISOString(), end: now.toISOString() },
      derivedAt: now.toISOString(),
      explainability: `${qualityEvents.length} quality-related events in period. Includes ${recentEvents.filter((e) => e.type === 'capa_completed').length} CAPA completions.`,
    })
  }

  // Insight 4: Compliance maturation
  const complianceEvents = recentEvents.filter(
    (e) =>
      e.type === 'clia_renewed' ||
      e.type === 'license_renewed' ||
      e.type === 'certification_gained' ||
      e.type === 'irb_renewed'
  )

  if (complianceEvents.length >= 2) {
    insights.push({
      insightId: `ci-compliance-${Date.now()}`,
      title: 'Compliance profile is maturing',
      description: `${complianceEvents.length} compliance renewals or certifications completed. Regulatory posture is strengthening.`,
      category: 'maturation',
      confidence: 'high',
      supportingEventCount: complianceEvents.length,
      timespan: { start: cutoff.toISOString(), end: now.toISOString() },
      derivedAt: now.toISOString(),
      explainability: `Compliance events: ${complianceEvents.map((e) => e.type).join(', ')}.`,
    })
  }

  // Insight 5: Research activity
  const researchEvents = recentEvents.filter(
    (e) =>
      e.type === 'program_completed' ||
      e.type === 'program_started' ||
      e.type === 'research_milestone_reached'
  )

  if (researchEvents.length > 0) {
    insights.push({
      insightId: `ci-research-${Date.now()}`,
      title: 'Research program activity',
      description: `${researchEvents.length} research milestones or program changes detected.`,
      category: researchEvents.length >= 2 ? 'diversification' : 'growth',
      confidence: researchEvents.length >= 3 ? 'high' : 'medium',
      supportingEventCount: researchEvents.length,
      timespan: { start: cutoff.toISOString(), end: now.toISOString() },
      derivedAt: now.toISOString(),
      explainability: `Research events: ${researchEvents.map((e) => e.type).join(', ')}.`,
    })
  }

  // Insight 6: Facility expansion
  const facilityEvents = recentEvents.filter(
    (e) =>
      e.type === 'facility_opened' ||
      e.type === 'laboratory_expanded' ||
      e.type === 'laboratory_opened'
  )

  if (facilityEvents.length > 0) {
    insights.push({
      insightId: `ci-facility-${Date.now()}`,
      title: 'Facility footprint expanding',
      description: `${facilityEvents.length} facility or laboratory expansions detected. Physical infrastructure is growing.`,
      category: 'expansion',
      confidence: 'high',
      supportingEventCount: facilityEvents.length,
      timespan: { start: cutoff.toISOString(), end: now.toISOString() },
      derivedAt: now.toISOString(),
      explainability: `Facility events: ${facilityEvents.map((e) => e.description).join('; ')}.`,
    })
  }

  // Insight 7: Network growth
  const networkEvents = recentEvents.filter(
    (e) => e.type === 'network_expanded' || e.type === 'network_contracted'
  )
  const expanded = networkEvents.filter((e) => e.type === 'network_expanded').length

  if (expanded > 0) {
    insights.push({
      insightId: `ci-network-${Date.now()}`,
      title: 'Research network is growing',
      description: `${expanded} network expansions recorded. Institutional reach is increasing.`,
      category: 'expansion',
      confidence: expanded >= 2 ? 'high' : 'medium',
      supportingEventCount: networkEvents.length,
      timespan: { start: cutoff.toISOString(), end: now.toISOString() },
      derivedAt: now.toISOString(),
      explainability: `Network events: ${expanded} expansions, ${networkEvents.filter((e) => e.type === 'network_contracted').length} contractions.`,
    })
  }

  // Insight 8: Stabilization — no significant change
  if (insights.length === 0 && recentEvents.length > 0) {
    insights.push({
      insightId: `ci-stable-${Date.now()}`,
      title: 'Institution is stable',
      description: `${recentEvents.length} events recorded but no significant directional trend detected. Operations are steady-state.`,
      category: 'stabilization',
      confidence: 'medium',
      supportingEventCount: recentEvents.length,
      timespan: { start: cutoff.toISOString(), end: now.toISOString() },
      derivedAt: now.toISOString(),
      explainability: `No threshold-exceeding patterns detected across ${Object.keys(categoryCounts).length} categories.`,
    })
  }

  return insights
}

function countByCategory(events: MemoryEvent[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of events) {
    counts[e.category] = (counts[e.category] ?? 0) + 1
  }
  return counts
}

// ==========================================================================
// PART 6 — Memory Health
// ==========================================================================

export interface MemoryHealthReport {
  institutionId: string
  calculatedAt: string
  scores: {
    /** 0-100: How complete is the knowledge record? */
    memoryCompleteness: number
    /** 0-100: Are there gaps in the historical timeline? */
    historicalContinuity: number
    /** 0-100: How fresh is the most recent knowledge? */
    knowledgeFreshness: number
    /** 0-100: How continuous is the document trail? */
    documentationContinuity: number
    /** 0-100: Has the organization maintained consistent records? */
    organizationalContinuity: number
    /** 0-100: How well covered is institutional evolution? */
    evolutionCoverage: number
    /** 0-100: Overall memory health */
    overall: number
  }
  gaps: MemoryGap[]
  recommendations: string[]
}

export interface MemoryGap {
  type: 'timeline_gap' | 'missing_event' | 'stale_knowledge' | 'incomplete_evolution' | 'documentation_gap'
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  affectedPeriod?: { start: string; end: string }
}

/**
 * Calculate memory health scores.
 * Deterministic — no AI.
 */
export function calculateMemoryHealth(params: {
  institutionId: string
  temporalEvents: TemporalEvent[]
  memoryEvents: MemoryEvent[]
  knowledgeItems: KnowledgeItem[]
  referenceDate?: string
}): MemoryHealthReport {
  const now = params.referenceDate ?? new Date().toISOString()
  const nowDate = new Date(now)
  const gaps: MemoryGap[] = []
  const recommendations: string[] = []

  // --- Completeness: events vs items ratio ---
  const itemCount = params.knowledgeItems.length
  const eventCount = params.temporalEvents.length
  const completeness = itemCount > 0
    ? Math.min(100, Math.round((eventCount / (itemCount * 2)) * 100))
    : 0

  if (eventCount < itemCount) {
    gaps.push({
      type: 'incomplete_evolution',
      description: `${itemCount - eventCount} knowledge items have no temporal events recorded.`,
      severity: eventCount < itemCount * 0.5 ? 'high' : 'medium',
    })
    recommendations.push('Record temporal events for undocumented knowledge items.')
  }

  // --- Historical continuity: check for gaps > 90 days between events ---
  const sorted = [...params.temporalEvents].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  )
  let continuity = 100
  if (sorted.length >= 2) {
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].occurredAt).getTime()
      const curr = new Date(sorted[i].occurredAt).getTime()
      const gapDays = (curr - prev) / 86_400_000
      if (gapDays > 180) {
        gaps.push({
          type: 'timeline_gap',
          description: `${Math.round(gapDays)} day gap between events for item "${sorted[i].knowledgeItemId}".`,
          severity: gapDays > 365 ? 'high' : 'medium',
          affectedPeriod: { start: sorted[i - 1].occurredAt, end: sorted[i].occurredAt },
        })
        continuity -= 5
      }
    }
  }

  // --- Knowledge freshness: newest event age ---
  let freshness = 0
  if (sorted.length > 0) {
    const newest = new Date(sorted[sorted.length - 1].occurredAt).getTime()
    const ageDays = (nowDate.getTime() - newest) / 86_400_000
    freshness = Math.max(0, Math.round(100 - (ageDays / 365) * 100))

    if (ageDays > 180) {
      gaps.push({
        type: 'stale_knowledge',
        description: `Most recent temporal event is ${Math.round(ageDays)} days old.`,
        severity: ageDays > 365 ? 'high' : 'medium',
      })
      recommendations.push('Update knowledge items that have not been reviewed recently.')
    }
  }

  // --- Documentation continuity: check for expiring docs ---
  const activeItems = params.knowledgeItems.filter((ki) => ki.status === 'active').length
  const archivedItems = params.knowledgeItems.filter(
    (ki) => ki.status === 'archived' || ki.status === 'expired'
  ).length
  const docContinuity = activeItems > 0 ? Math.round((activeItems / (activeItems + archivedItems)) * 100) : 0

  if (archivedItems > activeItems * 0.3) {
    recommendations.push('Too many archived/expired items — consider reviewing institutional knowledge base.')
  }

  // --- Organizational continuity: personnel events ---
  const personnelEvents = params.memoryEvents.filter(
    (e) => e.category === 'personnel'
  ).length
  const orgContinuity = params.memoryEvents.length > 0
    ? Math.max(60, 100 - (personnelEvents > 3 ? 10 : 0))
    : 0

  // --- Evolution coverage: category diversity ---
  const categories = new Set(params.memoryEvents.map((e) => e.category))
  const evolutionCoverage = Math.min(100, categories.size * 10)

  if (categories.size < 3) {
    recommendations.push('Institutional memory is narrow — events from fewer than 3 categories. Broaden tracking.')
  }

  const scores = {
    memoryCompleteness: completeness,
    historicalContinuity: Math.max(0, Math.min(100, continuity)),
    knowledgeFreshness: freshness,
    documentationContinuity: docContinuity,
    organizationalContinuity: orgContinuity,
    evolutionCoverage,
    overall: Math.round(
      (completeness + Math.max(0, Math.min(100, continuity)) + freshness + docContinuity + orgContinuity + evolutionCoverage) / 6
    ),
  }

  return { institutionId: params.institutionId, calculatedAt: now, scores, gaps, recommendations }
}

// ==========================================================================
// PART 7 — Timeline Dashboard States
// ==========================================================================

export interface TimelineDashboardState {
  institutionId: string
  recentChanges: TemporalEvent[]
  upcomingChanges: TemporalEvent[]
  historicalMilestones: MemoryEvent[]
  evolutionSnapshots: EvolutionSnapshot[]
  insights: ContinuousInsight[]
  memoryHealth: MemoryHealthReport | null
}

export type TimelineViewMode =
  | 'timeline'
  | 'growth'
  | 'capabilities'
  | 'compliance'
  | 'equipment'
  | 'facilities'
  | 'personnel'
  | 'overview'

export interface TimelineFilter {
  categories: MemoryCategory[]
  dateRange: { start: string; end: string } | null
  significance: ('major' | 'minor' | 'routine')[]
  searchText: string | null
}

// ==========================================================================
// PART 8 — Comparison Engine
// ==========================================================================

export interface HistoricalComparison {
  institutionId: string
  pointA: { date: string; label: string }
  pointB: { date: string; label: string }
  changes: {
    capabilitiesGained: string[]
    capabilitiesLost: string[]
    equipmentAdded: string[]
    equipmentRemoved: string[]
    facilitiesChanged: string[]
    personnelChanged: string[]
    complianceUpdated: string[]
    totalChanges: number
  }
  summary: string
}

/**
 * Compare institutional state at two points in time.
 */
export function compareInstitutionalState(params: {
  institutionId: string
  pointA: { date: string; label: string }
  pointB: { date: string; label: string }
  eventsA: MemoryEvent[]
  eventsB: MemoryEvent[]
}): HistoricalComparison {
  const aTypes = new Set(params.eventsA.map((e) => e.type))
  const bTypes = new Set(params.eventsB.map((e) => e.type))

  const capabilitiesGained: string[] = []
  const capabilitiesLost: string[] = []
  const equipmentAdded: string[] = []
  const equipmentRemoved: string[] = []
  const facilitiesChanged: string[] = []
  const personnelChanged: string[] = []
  const complianceUpdated: string[] = []

  // Events unique to point B (things that happened between A and B)
  const bOnly = params.eventsB.filter(
    (e) => !params.eventsA.some((a) => a.id === e.id)
  )

  for (const e of bOnly) {
    if (e.type === 'capability_acquired') capabilitiesGained.push(e.description)
    if (e.type === 'capability_lost') capabilitiesLost.push(e.description)
    if (e.type === 'equipment_acquired') equipmentAdded.push(e.description)
    if (e.type === 'equipment_retired') equipmentRemoved.push(e.description)
    if (e.type.includes('facility') || e.type.includes('laboratory')) facilitiesChanged.push(e.description)
    if (e.type.includes('pi_') || e.type.includes('personnel')) personnelChanged.push(e.description)
    if (e.type.includes('license') || e.type.includes('clia') || e.type.includes('certification')) complianceUpdated.push(e.description)
  }

  const totalChanges =
    capabilitiesGained.length + capabilitiesLost.length +
    equipmentAdded.length + equipmentRemoved.length +
    facilitiesChanged.length + personnelChanged.length + complianceUpdated.length

  return {
    institutionId: params.institutionId,
    pointA: params.pointA,
    pointB: params.pointB,
    changes: {
      capabilitiesGained, capabilitiesLost,
      equipmentAdded, equipmentRemoved,
      facilitiesChanged,
      personnelChanged,
      complianceUpdated,
      totalChanges,
    },
    summary: `Between ${params.pointA.label} and ${params.pointB.label}: ${totalChanges} changes detected — ${capabilitiesGained.length} capabilities gained, ${capabilitiesLost.length} lost, ${equipmentAdded.length} equipment added, ${complianceUpdated.length} compliance updates.`,
  }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const INSTITUTIONAL_MEMORY = {
  // Timeline
  recordTemporalEvent,
  buildItemTimeline,
  // Memory
  recordMemoryEvent,
  // Evolution
  detectDeltas,
  generateContinuousInsights,
  calculateMemoryHealth,
  compareInstitutionalState,
}
