// ==========================================================================
// Sprint A8 — Institution Operating System (IOS)
// ==========================================================================
// Convierte el Digital Twin en un sistema operativo institucional.
// Observa, entiende, recomienda y orquesta el crecimiento institucional.
// Todo determinístico. Graph-derived. Sin AI.
// ==========================================================================

import type { InstitutionDigitalTwin, DomainSnapshots } from './institution-twin'
import type { RelationshipGraph, GraphEdge } from './relationship-graph'
import { findPaths, impactAnalysis, getNeighborhood } from './relationship-graph'
import type { ExplorerDomain } from './knowledge-explorer'
import type { RelationshipTypeKey } from './taxonomy'

// ==========================================================================
// ALIAS — InstitutionIntelligenceGraph
// ==========================================================================

/** Conceptual alias. Digital Twin remains for snapshots. IIG is the active runtime. */
export type InstitutionIntelligenceGraph = InstitutionDigitalTwin

/** Operating System runtime — the active layer on top of the twin. */
export interface InstitutionOperatingSystem {
  iig: InstitutionIntelligenceGraph
  observe: Observation[]
  understand: ImpactAnalysis[]
  recommend: Recommendation[]
  orchestrate: ActionPlan[]
  health: IOSHealth
  dashboard: IOSDashboardState
}

// ==========================================================================
// PART 2 — OBSERVE LAYER
// ==========================================================================

export type ObservationType =
  | 'new_knowledge_item'
  | 'updated_knowledge_item'
  | 'expired_document'
  | 'expiring_document'
  | 'document_renewed'
  | 'new_person'
  | 'person_inactive'
  | 'person_departed'
  | 'new_equipment'
  | 'equipment_retired'
  | 'new_facility'
  | 'facility_inactive'
  | 'new_laboratory'
  | 'lab_capability_gained'
  | 'capability_lost'
  | 'new_relationship'
  | 'broken_relationship'
  | 'new_evidence_candidate'
  | 'evidence_promoted'
  | 'claim_accepted'
  | 'claim_rejected'
  | 'readiness_changed'
  | 'training_expired'
  | 'license_renewed'
  | 'license_expired'
  | 'sop_replaced'
  | 'capa_closed'
  | 'audit_completed'
  | 'certification_gained'
  | 'certification_expired'
  | 'storage_capacity_warning'
  | 'temperature_excursion'
  | 'domain_completeness_changed'

export interface Observation {
  observationId: string
  observationType: ObservationType
  source: string
  relatedEntities: string[]
  relatedDocuments: string[]
  relatedKnowledgeItems: string[]
  occurredAt: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  description: string
  previousState: Record<string, unknown> | null
  newState: Record<string, unknown> | null
}

/**
 * Observe meaningful institutional changes.
 * Deterministic comparison of two twin snapshots.
 */
export function observe(twin: InstitutionDigitalTwin, previousTwin: InstitutionDigitalTwin | null): Observation[] {
  const observations: Observation[] = []
  const now = new Date().toISOString()

  if (!previousTwin) {
    observations.push({
      observationId: `obs-init-${Date.now()}`,
      observationType: 'new_knowledge_item', source: 'system',
      relatedEntities: [], relatedDocuments: [], relatedKnowledgeItems: [],
      occurredAt: now, severity: 'info',
      description: 'Initial institutional observation baseline established.',
      previousState: null, newState: null,
    })
    return observations
  }

  const prevDomains = previousTwin.domains
  const currDomains = twin.domains
  const domainKeys = Object.keys(currDomains) as (keyof DomainSnapshots)[]

  // Domain completeness changes
  for (const key of domainKeys) {
    const prev = prevDomains[key]?.completeness ?? 0
    const curr = currDomains[key]?.completeness ?? 0
    if (curr !== prev) {
      observations.push({
        observationId: `obs-domain-${key}-${Date.now()}`,
        observationType: 'domain_completeness_changed',
        source: 'domain_tracker',
        relatedEntities: [], relatedDocuments: [], relatedKnowledgeItems: [],
        occurredAt: now,
        severity: curr > prev ? 'info' : curr < prev - 10 ? 'high' : 'medium',
        description: `${key} domain completeness changed from ${prev}% to ${curr}%.`,
        previousState: { completeness: prev },
        newState: { completeness: curr },
      })
    }
  }

  // Lost capabilities (items that were documented before but not now)
  for (const key of domainKeys) {
    const prev = prevDomains[key]
    const curr = currDomains[key]
    if (prev && curr && curr.documentedCount < prev.documentedCount) {
      observations.push({
        observationId: `obs-lost-${key}-${Date.now()}`,
        observationType: 'capability_lost',
        source: 'domain_tracker',
        relatedEntities: [key], relatedDocuments: [], relatedKnowledgeItems: [],
        occurredAt: now, severity: 'high',
        description: `${key} lost ${prev.documentedCount - curr.documentedCount} documented items.`,
        previousState: { documentedCount: prev.documentedCount },
        newState: { documentedCount: curr.documentedCount },
      })
    }
  }

  // New capabilities
  for (const key of domainKeys) {
    const prev = prevDomains[key]
    const curr = currDomains[key]
    if (prev && curr && curr.documentedCount > prev.documentedCount) {
      observations.push({
        observationId: `obs-gained-${key}-${Date.now()}`,
        observationType: 'lab_capability_gained',
        source: 'domain_tracker',
        relatedEntities: [key], relatedDocuments: [], relatedKnowledgeItems: [],
        occurredAt: now, severity: 'info',
        description: `${key} gained ${curr.documentedCount - prev.documentedCount} documented items.`,
        previousState: { documentedCount: prev.documentedCount },
        newState: { documentedCount: curr.documentedCount },
      })
    }
  }

  return observations
}

// ==========================================================================
// PART 3 — UNDERSTAND / IMPACT LAYER
// ==========================================================================

export interface ImpactAnalysis {
  analysisId: string
  observationId: string
  affectedDomains: string[]
  affectedPeople: string[]
  affectedFacilities: string[]
  affectedEquipment: string[]
  affectedLaboratories: string[]
  affectedCapabilities: string[]
  affectedPrograms: string[]
  affectedDocuments: string[]
  affectedEvidenceCandidates: string[]
  affectedClaims: string[]
  affectedReadinessAreas: string[]
  explanation: string
  analyzedAt: string
}

/**
 * Compute deterministic impact analysis for an observation.
 * Uses relationship graph traversal — no AI reasoning.
 */
export function analyzeImpact(params: {
  observation: Observation
  graph: RelationshipGraph
  twin: InstitutionDigitalTwin
}): ImpactAnalysis {
  const now = new Date().toISOString()
  const allAffected: string[] = []

  // All entities mentioned in the observation + their neighborhoods
  for (const entityId of params.observation.relatedEntities) {
    const subgraph = getNeighborhood(params.graph, entityId, 2)
    allAffected.push(...subgraph.nodes)
  }

  const uniqueAffected = [...new Set(allAffected)]
  const nodeMap = new Map(params.graph.nodes.map((n) => [n.nodeId, n]))

  // Classify affected nodes by type
  const byType: Record<string, string[]> = {}
  for (const nodeId of uniqueAffected) {
    const node = nodeMap.get(nodeId)
    if (node) {
      const type = node.nodeType
      byType[type] = byType[type] ?? []
      byType[type].push(nodeId)
    }
  }

  // Build human-readable explanation
  const entityLabels = params.observation.relatedEntities
    .map((id) => nodeMap.get(id)?.label ?? id)
    .join(', ')

  const explanation = `${params.observation.observationType.replace(/_/g, ' ')} affecting "${entityLabels}". ` +
    `Impact spans ${uniqueAffected.length} related entities across ${Object.keys(byType).length} domains.`

  return {
    analysisId: `impact-${params.observation.observationId}`,
    observationId: params.observation.observationId,
    affectedDomains: Object.keys(byType),
    affectedPeople: byType['person'] ?? [],
    affectedFacilities: byType['facility'] ?? [],
    affectedEquipment: byType['equipment'] ?? [],
    affectedLaboratories: byType['laboratory'] ?? [],
    affectedCapabilities: byType['capability'] ?? [],
    affectedPrograms: byType['program'] ?? [],
    affectedDocuments: byType['document'] ?? [],
    affectedEvidenceCandidates: [],
    affectedClaims: [],
    affectedReadinessAreas: [],
    explanation,
    analyzedAt: now,
  }
}

// ==========================================================================
// PART 4 — RECOMMEND LAYER
// ==========================================================================

export type RecommendationType =
  | 'renew_document'
  | 'upload_document'
  | 'replace_document'
  | 'assign_owner'
  | 'add_person'
  | 'train_person'
  | 'certify_person'
  | 'add_equipment'
  | 'calibrate_equipment'
  | 'qualify_equipment'
  | 'add_relationship'
  | 'fix_relationship'
  | 'expand_storage'
  | 'add_laboratory'
  | 'add_capability'
  | 'review_claim'
  | 'promote_evidence'
  | 'renew_license'
  | 'close_capa'
  | 'complete_audit'
  | 'review_document'
  | 'resolve_risk'
  | 'improve_domain'
  | 'add_backup_power'

export interface Recommendation {
  recommendationId: string
  type: RecommendationType
  priority: number  // 1=highest, lower number = more urgent
  reason: string
  sourceObservationId: string | null
  requiredAction: string
  expectedEffect: string
  affectedCapabilities: string[]
  affectedReadinessAreas: string[]
  dueDate: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  createdBy: 'system' | string
  createdAt: string
}

/**
 * Generate recommendations from observations and impact analysis.
 * Rule-based — no AI.
 */
export function generateRecommendations(params: {
  observations: Observation[]
  impacts: ImpactAnalysis[]
  twin: InstitutionDigitalTwin
}): Recommendation[] {
  const recs: Recommendation[] = []
  const now = new Date().toISOString()
  let priority = 1

  for (const obs of params.observations) {
    const impact = params.impacts.find((i) => i.observationId === obs.observationId)

    switch (obs.observationType) {
      case 'expired_document':
        recs.push({
          recommendationId: `rec-${obs.observationId}`,
          type: 'renew_document', priority: priority++,
          reason: obs.description,
          sourceObservationId: obs.observationId,
          requiredAction: `Renew or replace expired document: ${obs.relatedDocuments.join(', ') || 'unknown'}.`,
          expectedEffect: 'Restore compliance and readiness. Unblock affected capabilities.',
          affectedCapabilities: impact?.affectedCapabilities ?? [],
          affectedReadinessAreas: impact?.affectedReadinessAreas ?? [],
          dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          status: 'pending', createdBy: 'system', createdAt: now,
        })
        break

      case 'expiring_document':
        recs.push({
          recommendationId: `rec-${obs.observationId}`,
          type: 'renew_document', priority: priority + 5, // Lower priority than expired
          reason: obs.description,
          sourceObservationId: obs.observationId,
          requiredAction: `Plan renewal for expiring document.`,
          expectedEffect: 'Prevent expiration and maintain continuous compliance.',
          affectedCapabilities: impact?.affectedCapabilities ?? [],
          affectedReadinessAreas: impact?.affectedReadinessAreas ?? [],
          dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
          status: 'pending', createdBy: 'system', createdAt: now,
        })
        break

      case 'capability_lost':
        recs.push({
          recommendationId: `rec-${obs.observationId}`,
          type: 'add_capability', priority: priority++,
          reason: obs.description,
          sourceObservationId: obs.observationId,
          requiredAction: `Restore lost capability. Re-document or re-validate.`,
          expectedEffect: `Restore ${impact?.affectedCapabilities.length ?? 0} affected capabilities and downstream readiness.`,
          affectedCapabilities: impact?.affectedCapabilities ?? [],
          affectedReadinessAreas: impact?.affectedReadinessAreas ?? [],
          dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
          status: 'pending', createdBy: 'system', createdAt: now,
        })
        break

      case 'training_expired':
        recs.push({
          recommendationId: `rec-${obs.observationId}`,
          type: 'train_person', priority: priority++,
          reason: obs.description,
          sourceObservationId: obs.observationId,
          requiredAction: `Schedule renewal training immediately.`,
          expectedEffect: 'Restore personnel compliance and capability.',
          affectedCapabilities: impact?.affectedCapabilities ?? [],
          affectedReadinessAreas: [],
          dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          status: 'pending', createdBy: 'system', createdAt: now,
        })
        break

      case 'domain_completeness_changed':
        if (obs.severity === 'high') {
          recs.push({
            recommendationId: `rec-${obs.observationId}`,
            type: 'improve_domain', priority: priority++,
            reason: obs.description,
            sourceObservationId: obs.observationId,
            requiredAction: `Review and restore completeness in affected domain.`,
            expectedEffect: 'Restore institutional knowledge coverage.',
            affectedCapabilities: [], affectedReadinessAreas: [],
            dueDate: null, status: 'pending', createdBy: 'system', createdAt: now,
          })
        }
        break

      case 'storage_capacity_warning':
        recs.push({
          recommendationId: `rec-${obs.observationId}`,
          type: 'expand_storage', priority: priority++,
          reason: obs.description,
          sourceObservationId: obs.observationId,
          requiredAction: `Plan storage capacity expansion or specimen archival.`,
          expectedEffect: 'Prevent operational disruption and specimen risk.',
          affectedCapabilities: ['biobanking', 'cold_chain'],
          affectedReadinessAreas: ['Biospecimen Capacity'],
          dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
          status: 'pending', createdBy: 'system', createdAt: now,
        })
        break

      case 'temperature_excursion':
        recs.push({
          recommendationId: `rec-${obs.observationId}`,
          type: 'calibrate_equipment', priority: priority++,
          reason: obs.description,
          sourceObservationId: obs.observationId,
          requiredAction: `Investigate temperature excursion. Service equipment. Verify specimen integrity.`,
          expectedEffect: 'Restore cold chain reliability and prevent specimen loss.',
          affectedCapabilities: ['cold_chain', 'biobanking'],
          affectedReadinessAreas: ['Sample Integrity'],
          dueDate: new Date(Date.now() + 1 * 86_400_000).toISOString(),
          status: 'pending', createdBy: 'system', createdAt: now,
        })
        break

      default:
        // For other observation types, generate generic recommendations
        if (obs.severity === 'critical' || obs.severity === 'high') {
          recs.push({
            recommendationId: `rec-${obs.observationId}`,
            type: 'resolve_risk', priority: priority++,
            reason: obs.description,
            sourceObservationId: obs.observationId,
            requiredAction: `Address ${obs.observationType.replace(/_/g, ' ')}.`,
            expectedEffect: `Resolve ${obs.severity} severity observation.`,
            affectedCapabilities: impact?.affectedCapabilities ?? [],
            affectedReadinessAreas: [],
            dueDate: obs.severity === 'critical' ? new Date(Date.now() + 3 * 86_400_000).toISOString() : null,
            status: 'pending', createdBy: 'system', createdAt: now,
          })
        }
        break
    }
  }

  return recs.sort((a, b) => a.priority - b.priority)
}

// ==========================================================================
// PART 5 — ORCHESTRATE LAYER (Action Plans)
// ==========================================================================

export type GoalType =
  | 'improve_domain_health'
  | 'restore_expired_compliance'
  | 'increase_evidence_maturity'
  | 'prepare_for_program_readiness'
  | 'close_documentation_gaps'
  | 'complete_capability_dependencies'
  | 'improve_biospecimen_readiness'
  | 'prepare_sponsor_passport'

export interface ActionPlan {
  planId: string
  goal: GoalType
  goalDescription: string
  targetCapabilityOrProgram: string | null
  steps: ActionPlanStep[]
  dependencies: string[][]  // step index → prerequisite step indices
  estimatedCompletionDate: string | null
  expectedImpact: string
  completionPercentage: number
  blockingItems: string[]
  createdAt: string
  status: 'draft' | 'active' | 'completed' | 'blocked'
}

export interface ActionPlanStep {
  stepNumber: number
  recommendationId: string
  recommendation: Recommendation
  assignedTo: string | null
  dueDate: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  blockingReasons: string[]
}

/**
 * Orchestrate an action plan from recommendations toward a goal.
 */
export function createActionPlan(params: {
  goal: GoalType
  goalDescription: string
  targetCapabilityOrProgram: string | null
  recommendations: Recommendation[]
}): ActionPlan {
  const now = new Date().toISOString()
  const relevantRecs = params.recommendations.filter((r) => r.status === 'pending')

  const steps: ActionPlanStep[] = relevantRecs.map((rec, idx) => ({
    stepNumber: idx + 1,
    recommendationId: rec.recommendationId,
    recommendation: rec,
    assignedTo: null,
    dueDate: rec.dueDate,
    status: 'pending' as const,
    blockingReasons: [],
  }))

  // Simple dependency chain: each step depends on previous
  const dependencies: string[][] = []
  for (let i = 1; i < steps.length; i++) {
    dependencies.push([String(i - 1)])
  }

  const completed = steps.filter((s) => s.status === 'completed').length

  return {
    planId: `plan-${params.goal}-${Date.now()}`,
    goal: params.goal,
    goalDescription: params.goalDescription,
    targetCapabilityOrProgram: params.targetCapabilityOrProgram,
    steps,
    dependencies,
    estimatedCompletionDate: steps.length > 0
      ? new Date(Date.now() + steps.length * 2 * 86_400_000).toISOString()
      : null,
    expectedImpact: `Completing ${steps.length} actions toward "${params.goalDescription}".`,
    completionPercentage: steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0,
    blockingItems: [],
    createdAt: now,
    status: steps.length > 0 ? 'active' : 'draft',
  }
}

// ==========================================================================
// PART 6 — GROWTH PATH RUNTIME
// ==========================================================================

export interface GrowthPath {
  pathId: string
  targetCapabilityOrProgram: string
  currentState: GrowthPathState
  missingKnowledge: string[]
  missingDocuments: string[]
  missingRelationships: string[]
  missingEvidenceCandidates: string[]
  expiredAssets: string[]
  highestImpactActions: Recommendation[]
  estimatedReadinessBlockers: string[]
  progressPercentage: number
}

export interface GrowthPathState {
  knowledgeItemsDocumented: number
  knowledgeItemsRequired: number
  documentsUploaded: number
  documentsRequired: number
  relationshipsEstablished: number
  relationshipsRequired: number
  evidenceMaturity: string
  readinessStatus: string
}

/**
 * Given a target capability or program, identify the growth path.
 * Deterministic gap analysis — no AI.
 */
export function generateGrowthPath(params: {
  targetCapabilityOrProgram: string
  twin: InstitutionDigitalTwin
  graph: RelationshipGraph
  recommendations: Recommendation[]
}): GrowthPath {
  const twin = params.twin
  const domainMap: Record<string, number> = {
    people: twin.domains.people.completeness,
    facilities: twin.domains.facilities.completeness,
    equipment: twin.domains.equipment.completeness,
    laboratory: twin.domains.laboratory.completeness,
    biospecimen: twin.domains.biospecimen.completeness,
    researchCapability: twin.domains.researchCapability.completeness,
    regulatory: twin.domains.regulatory.completeness,
    quality: twin.domains.quality.completeness,
    programCatalog: twin.domains.programCatalog.completeness,
  }

  const missingKnowledge: string[] = []
  const missingDocuments: string[] = []
  const missingRelationships: string[] = []

  for (const [domain, completeness] of Object.entries(domainMap)) {
    if (completeness < 50) {
      missingKnowledge.push(`${domain} domain is at ${completeness}% completeness.`)
    }
  }

  if (twin.intelligence.document) {
    const docGaps = twin.intelligence.document.gaps
    for (const gap of docGaps.filter((g) => g.severity === 'critical')) {
      missingDocuments.push(gap.description)
    }
  }

  // Missing relationships: check graph orphans
  if (twin.intelligence.relationshipGraph) {
    const orphanCount = twin.intelligence.relationshipGraph.stats.orphans
    if (orphanCount > 0) {
      missingRelationships.push(`${orphanCount} orphan nodes need relationships.`)
    }
  }

  // Highest impact actions: top 5 recommendations
  const bestActions = params.recommendations
    .filter((r) => r.status === 'pending')
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)

  // Progress percentage
  const scores = Object.values(domainMap)
  const avgCompleteness = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0

  return {
    pathId: `gp-${params.targetCapabilityOrProgram}-${Date.now()}`,
    targetCapabilityOrProgram: params.targetCapabilityOrProgram,
    currentState: {
      knowledgeItemsDocumented: Object.values(twin.domains).reduce((s, d) => s + d.documentedCount, 0),
      knowledgeItemsRequired: Object.values(twin.domains).reduce((s, d) => s + d.itemCount, 0),
      documentsUploaded: twin.intelligence.document?.totalDocuments ?? 0,
      documentsRequired: 42, // From taxonomy
      relationshipsEstablished: twin.intelligence.relationshipGraph?.stats.totalEdges ?? 0,
      relationshipsRequired: 0,
      evidenceMaturity: 'EM2',
      readinessStatus: 'unknown',
    },
    missingKnowledge,
    missingDocuments,
    missingRelationships,
    missingEvidenceCandidates: [],
    expiredAssets: [],
    highestImpactActions: bestActions,
    estimatedReadinessBlockers: missingKnowledge.slice(0, 3),
    progressPercentage: avgCompleteness,
  }
}

// ==========================================================================
// PART 7 — OPERATING DASHBOARD STATE
// ==========================================================================

export interface IOSDashboardState {
  institutionId: string
  lastUpdated: string
  overview: {
    activeObservations: number
    criticalObservations: number
    pendingRecommendations: number
    activeActionPlans: number
    healthScore: number
  }
  whatChanged: Observation[]
  whatMatters: ImpactAnalysis[]
  atRisk: Observation[]
  recommendedActions: Recommendation[]
  actionPlans: ActionPlan[]
  growthPaths: GrowthPath[]
  upcomingDeadlines: { item: string; dueDate: string; type: string }[]
  recentlyImproved: Observation[]
  blockedCapabilities: string[]
  readinessPreview: string
}

/**
 * Build the operating dashboard from IOS state.
 */
export function buildIOSDashboard(params: {
  institutionId: string
  observations: Observation[]
  impacts: ImpactAnalysis[]
  recommendations: Recommendation[]
  actionPlans: ActionPlan[]
  growthPaths: GrowthPath[]
}): IOSDashboardState {
  const now = new Date().toISOString()
  const critical = params.observations.filter((o) => o.severity === 'critical')
  const atRisk = params.observations.filter((o) => o.severity === 'critical' || o.severity === 'high')
  const improved = params.observations.filter((o) => o.severity === 'info' && o.observationType.includes('gained'))
  const pending = params.recommendations.filter((r) => r.status === 'pending')

  const deadlines = pending
    .filter((r) => r.dueDate)
    .map((r) => ({ item: r.requiredAction.slice(0, 60), dueDate: r.dueDate!, type: r.type }))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10)

  return {
    institutionId: params.institutionId,
    lastUpdated: now,
    overview: {
      activeObservations: params.observations.length,
      criticalObservations: critical.length,
      pendingRecommendations: pending.length,
      activeActionPlans: params.actionPlans.filter((p) => p.status === 'active').length,
      healthScore: critical.length === 0 ? 85 : Math.max(20, 85 - critical.length * 10),
    },
    whatChanged: params.observations.filter((o) => o.severity !== 'info'),
    whatMatters: params.impacts.filter((i) =>
      i.affectedCapabilities.length > 0 || i.affectedReadinessAreas.length > 0
    ),
    atRisk,
    recommendedActions: pending.sort((a, b) => a.priority - b.priority),
    actionPlans: params.actionPlans,
    growthPaths: params.growthPaths,
    upcomingDeadlines: deadlines,
    recentlyImproved: improved,
    blockedCapabilities: [],
    readinessPreview: critical.length > 0
      ? `${critical.length} critical observations may impact readiness.`
      : 'No critical issues — readiness is stable.',
  }
}

// ==========================================================================
// PART 8 — IOS HEALTH
// ==========================================================================

export interface IOSHealth {
  observationVolume: 'low' | 'normal' | 'high' | 'overwhelming'
  criticalRiskCount: number
  pendingActionCount: number
  actionCompletionRate: number  // 0-100
  responsivenessScore: number   // 0-100
  stabilityScore: number        // 0-100
  overall: number
}

export function computeIOSHealth(params: {
  observations: Observation[]
  recommendations: Recommendation[]
  actionPlans: ActionPlan[]
}): IOSHealth {
  const critical = params.observations.filter((o) => o.severity === 'critical').length
  const pending = params.recommendations.filter((r) => r.status === 'pending').length
  const total = params.recommendations.length
  const completed = params.recommendations.filter((r) => r.status === 'completed').length

  const actionCompletionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const stabilityScore = critical === 0 ? 100 : Math.max(0, 100 - critical * 15)
  const responsivenessScore = pending === 0 ? 100 : Math.max(0, 100 - pending * 5)

  const volume: IOSHealth['observationVolume'] =
    params.observations.length > 20 ? 'overwhelming'
    : params.observations.length > 10 ? 'high'
    : params.observations.length > 3 ? 'normal'
    : 'low'

  return {
    observationVolume: volume,
    criticalRiskCount: critical,
    pendingActionCount: pending,
    actionCompletionRate,
    responsivenessScore,
    stabilityScore,
    overall: Math.round((actionCompletionRate + responsivenessScore + stabilityScore) / 3),
  }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const INSTITUTION_OS = {
  observe,
  analyzeImpact,
  generateRecommendations,
  createActionPlan,
  generateGrowthPath,
  buildIOSDashboard,
  computeIOSHealth,
}
