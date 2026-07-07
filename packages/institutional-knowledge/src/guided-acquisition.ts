// ==========================================================================
// Sprint A6 — Guided Knowledge Acquisition
// ==========================================================================
// Kadarn se convierte en mentor institucional.
// Guía a los usuarios a través de la adquisición de conocimiento.
// Detecta gaps, genera next best actions, roadmaps, y growth paths.
// Todo determinístico. Sin AI.
// ==========================================================================

import type { PeopleRisk } from './people-intelligence'
import type { LabRisk } from './lab-intelligence'
import type { DocumentGap } from './document-intelligence'
import type { GraphHealthReport } from './relationship-graph'
import type { KnowledgeCoverage, ExplorerDomain } from './knowledge-explorer'

// ==========================================================================
// NEXT BEST ACTION
// ==========================================================================

export type ActionType =
  | 'add_person'
  | 'upload_document'
  | 'renew_document'
  | 'add_certification'
  | 'add_training'
  | 'add_equipment'
  | 'add_laboratory'
  | 'add_capability'
  | 'add_relationship'
  | 'resolve_risk'
  | 'complete_profile'
  | 'review_document'
  | 'add_program'
  | 'add_facility'
  | 'expand_storage'
  | 'add_backup'
  | 'calibrate_equipment'
  | 'qualify_storage'

export interface NextBestAction {
  actionId: string
  actionType: ActionType
  title: string
  description: string
  impact: ActionImpact
  effort: 'low' | 'medium' | 'high'
  domain: ExplorerDomain
  relatedItemId: string | null
  relatedItemLabel: string | null
  prerequisites: string[]
  unlocks: string[]           // what becomes available after completing this
  recommendedOrder: number    // 1 = highest priority
  estimatedMinutes: number
}

export interface ActionImpact {
  readinessImprovement: number    // 0-100
  complianceImprovement: number
  capabilityUnlock: number        // how many new capabilities this enables
  riskResolution: number          // how many risks this resolves
  overallScore: number            // composite priority score
}

/**
 * Generate next best actions from all intelligence layers.
 * Aggregates gaps, risks, and missing items across People, Labs, Documents, Graph.
 */
export function generateNextBestActions(params: {
  institutionId: string
  peopleRisks: PeopleRisk[]
  labRisks: LabRisk[]
  documentGaps: DocumentGap[]
  graphHealth: GraphHealthReport | null
  coverage: KnowledgeCoverage | null
  existingCounts: {
    people: number; documents: number; equipment: number
    facilities: number; laboratories: number; capabilities: number
    programs: number; relationships: number
  }
}): NextBestAction[] {
  const actions: NextBestAction[] = []
  let order = 1

  // From People risks
  for (const risk of params.peopleRisks) {
    if (risk.severity === 'critical' || risk.severity === 'high') {
      actions.push({
        actionId: `nba-p-${order}`,
        actionType: risk.riskType === 'missing_license' ? 'add_certification'
          : risk.riskType === 'expired_training' ? 'add_training'
          : risk.riskType === 'no_backup' ? 'add_person'
          : risk.riskType === 'missing_cv' ? 'upload_document'
          : 'resolve_risk',
        title: risk.recommendedAction,
        description: risk.description,
        impact: computeImpact('resolve_risk', risk.severity),
        effort: 'low',
        domain: 'people',
        relatedItemId: risk.personId,
        relatedItemLabel: risk.personName,
        prerequisites: [],
        unlocks: ['Readiness improvement', 'Compliance score increase'],
        recommendedOrder: order++,
        estimatedMinutes: 30,
      })
    }
  }

  // From Document gaps
  for (const gap of params.documentGaps) {
    if (gap.severity === 'critical') {
      actions.push({
        actionId: `nba-d-${order}`,
        actionType: gap.gapType === 'expired' ? 'renew_document'
          : gap.gapType === 'missing_required' ? 'upload_document'
          : gap.gapType === 'needs_review' ? 'review_document'
          : 'upload_document',
        title: gap.recommendedAction,
        description: gap.description,
        impact: computeImpact(
          gap.gapType === 'expired' ? 'renew_document' : 'upload_document',
          gap.severity
        ),
        effort: gap.gapType === 'missing_required' ? 'high' : 'low',
        domain: 'documents',
        relatedItemId: gap.documentId,
        relatedItemLabel: gap.documentLabel,
        prerequisites: [],
        unlocks: ['Readiness enabled', 'Compliance gap closed'],
        recommendedOrder: order++,
        estimatedMinutes: gap.gapType === 'missing_required' ? 120 : 15,
      })
    }
  }

  // From Lab risks
  for (const risk of params.labRisks) {
    if (risk.severity === 'critical' || risk.severity === 'high') {
      actions.push({
        actionId: `nba-l-${order}`,
        actionType: risk.riskType === 'capacity_risk' ? 'expand_storage'
          : risk.riskType === 'temperature_risk' ? 'calibrate_equipment'
          : risk.riskType === 'qualification_overdue' ? 'qualify_storage'
          : risk.riskType === 'storage_gap' ? 'add_equipment'
          : risk.riskType === 'staffing_shortage' ? 'add_person'
          : 'resolve_risk',
        title: risk.recommendedAction,
        description: risk.description,
        impact: computeImpact('resolve_risk', risk.severity),
        effort: risk.riskType === 'capacity_risk' ? 'high' : 'medium',
        domain: 'laboratories',
        relatedItemId: risk.labId,
        relatedItemLabel: null,
        prerequisites: [],
        unlocks: ['Operational capacity restored', 'Risk resolved'],
        recommendedOrder: order++,
        estimatedMinutes: 60,
      })
    }
  }

  // Structural gaps
  if (params.existingCounts.people < 3) {
    actions.push({
      actionId: `nba-struct-${order}`, actionType: 'add_person',
      title: 'Add key personnel',
      description: 'Your institution has fewer than 3 people documented. Add PI, coordinator, and lab staff.',
      impact: { readinessImprovement: 30, complianceImprovement: 20, capabilityUnlock: 5, riskResolution: 2, overallScore: 75 },
      effort: 'medium', domain: 'people',
      relatedItemId: null, relatedItemLabel: null,
      prerequisites: [], unlocks: ['All personnel-dependent capabilities'],
      recommendedOrder: order++, estimatedMinutes: 90,
    })
  }

  if (params.existingCounts.documents < 5) {
    actions.push({
      actionId: `nba-struct-${order}`, actionType: 'upload_document',
      title: 'Upload critical documents',
      description: 'Less than 5 documents uploaded. Start with CLIA, IRB, insurance, and licenses.',
      impact: { readinessImprovement: 50, complianceImprovement: 40, capabilityUnlock: 10, riskResolution: 4, overallScore: 90 },
      effort: 'high', domain: 'documents',
      relatedItemId: null, relatedItemLabel: null,
      prerequisites: [], unlocks: ['Readiness assessment', 'Sponsor visibility'],
      recommendedOrder: order++, estimatedMinutes: 180,
    })
  }

  if (params.existingCounts.laboratories < 1) {
    actions.push({
      actionId: `nba-struct-${order}`, actionType: 'add_laboratory',
      title: 'Document your laboratory',
      description: 'No laboratories documented. Add your processing, storage, and testing labs.',
      impact: { readinessImprovement: 40, complianceImprovement: 30, capabilityUnlock: 15, riskResolution: 1, overallScore: 80 },
      effort: 'medium', domain: 'laboratories',
      relatedItemId: null, relatedItemLabel: null,
      prerequisites: [], unlocks: ['All lab-dependent capabilities', 'Biospecimen intelligence'],
      recommendedOrder: order++, estimatedMinutes: 60,
    })
  }

  if ((params.graphHealth?.orphans?.length ?? 0) > 5) {
    actions.push({
      actionId: `nba-graph-${order}`, actionType: 'add_relationship',
      title: `Connect ${params.graphHealth!.orphans.length} orphan nodes`,
      description: 'Many items have no relationships. Create connections between people, equipment, facilities, and capabilities.',
      impact: { readinessImprovement: 20, complianceImprovement: 10, capabilityUnlock: 3, riskResolution: 0, overallScore: 55 },
      effort: 'medium', domain: 'relationships',
      relatedItemId: null, relatedItemLabel: null,
      prerequisites: [], unlocks: ['Graph explainability', 'Impact analysis'],
      recommendedOrder: order++, estimatedMinutes: 45,
    })
  }

  // Sort by recommended order (priority)
  return actions.sort((a, b) => a.recommendedOrder - b.recommendedOrder)
}

function computeImpact(type: ActionType, severity: string): ActionImpact {
  const sevMult = severity === 'critical' ? 1.5 : severity === 'high' ? 1.0 : 0.5
  const baseMap: Partial<Record<ActionType, ActionImpact>> = {
    upload_document: { readinessImprovement: 25, complianceImprovement: 30, capabilityUnlock: 5, riskResolution: 1, overallScore: 0 },
    renew_document: { readinessImprovement: 20, complianceImprovement: 25, capabilityUnlock: 0, riskResolution: 1, overallScore: 0 },
    add_certification: { readinessImprovement: 15, complianceImprovement: 20, capabilityUnlock: 2, riskResolution: 1, overallScore: 0 },
    add_training: { readinessImprovement: 10, complianceImprovement: 15, capabilityUnlock: 1, riskResolution: 1, overallScore: 0 },
    resolve_risk: { readinessImprovement: 15, complianceImprovement: 15, capabilityUnlock: 2, riskResolution: 2, overallScore: 0 },
    add_person: { readinessImprovement: 20, complianceImprovement: 10, capabilityUnlock: 5, riskResolution: 1, overallScore: 0 },
    expand_storage: { readinessImprovement: 10, complianceImprovement: 5, capabilityUnlock: 3, riskResolution: 2, overallScore: 0 },
    add_equipment: { readinessImprovement: 15, complianceImprovement: 10, capabilityUnlock: 4, riskResolution: 0, overallScore: 0 },
  }
  const base = baseMap[type] ?? { readinessImprovement: 10, complianceImprovement: 10, capabilityUnlock: 1, riskResolution: 1, overallScore: 0 }
  return {
    ...base,
    overallScore: Math.round(
      (base.readinessImprovement + base.complianceImprovement + base.capabilityUnlock * 5 + base.riskResolution * 10) * sevMult
    ),
  }
}

// ==========================================================================
// PROGRESS PATH
// ==========================================================================

export interface ProgressPath {
  pathId: string
  institutionId: string
  name: string
  description: string
  steps: ProgressStep[]
  totalSteps: number
  completedSteps: number
  estimatedTotalMinutes: number
  estimatedRemainingMinutes: number
  completionPercentage: number
}

export interface ProgressStep {
  stepNumber: number
  action: NextBestAction
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  completedAt: string | null
  notes: string | null
}

/**
 * Build a progress path from next best actions.
 * Groups actions into a logical completion sequence.
 */
export function buildProgressPath(params: {
  institutionId: string
  actions: NextBestAction[]
  completedActionIds: string[]
}): ProgressPath {
  const steps: ProgressStep[] = params.actions.map((action, idx) => ({
    stepNumber: idx + 1,
    action,
    status: params.completedActionIds.includes(action.actionId) ? 'completed' as const : 'pending' as const,
    completedAt: params.completedActionIds.includes(action.actionId) ? new Date().toISOString() : null,
    notes: null,
  }))

  const completed = steps.filter((s) => s.status === 'completed').length
  const total = steps.length
  const remainingMinutes = steps
    .filter((s) => s.status !== 'completed')
    .reduce((sum, s) => sum + s.action.estimatedMinutes, 0)

  return {
    pathId: `path-${params.institutionId}`,
    institutionId: params.institutionId,
    name: 'Institutional Knowledge Completion Path',
    description: 'Step-by-step guide to achieve complete institutional knowledge.',
    steps,
    totalSteps: total,
    completedSteps: completed,
    estimatedTotalMinutes: steps.reduce((sum, s) => sum + s.action.estimatedMinutes, 0),
    estimatedRemainingMinutes: remainingMinutes,
    completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

// ==========================================================================
// COMPLETION ROADMAP
// ==========================================================================

export interface CompletionRoadmap {
  institutionId: string
  generatedAt: string
  phases: CompletionPhase[]
  overallCompletion: number // 0-100
  estimatedTimeToComplete: string
  criticalPath: string[]
}

export interface CompletionPhase {
  phaseNumber: number
  name: string
  description: string
  actions: NextBestAction[]
  completionCriteria: string[]
  estimatedDurationDays: number
  unlocks: string[]
}

/**
 * Generate a phased completion roadmap.
 * Phase 1: Critical documents + key people
 * Phase 2: Facilities + Equipment + Laboratories
 * Phase 3: Capabilities + Programs
 * Phase 4: Relationships + Graph completion
 * Phase 5: Continuous improvement
 */
export function generateCompletionRoadmap(params: {
  institutionId: string
  actions: NextBestAction[]
}): CompletionRoadmap {
  const now = new Date().toISOString()

  const phase1Actions = params.actions.filter((a) =>
    a.actionType === 'upload_document' || a.actionType === 'renew_document' ||
    a.actionType === 'add_certification' || a.actionType === 'add_training' ||
    (a.actionType === 'add_person' && a.domain === 'people')
  ).slice(0, 10)

  const phase2Actions = params.actions.filter((a) =>
    a.actionType === 'add_laboratory' || a.actionType === 'add_facility' ||
    a.actionType === 'add_equipment' || a.actionType === 'expand_storage'
  ).slice(0, 8)

  const phase3Actions = params.actions.filter((a) =>
    a.actionType === 'add_capability' || a.actionType === 'add_program'
  ).slice(0, 10)

  const phase4Actions = params.actions.filter((a) =>
    a.actionType === 'add_relationship'
  ).slice(0, 10)

  const phase5Actions = params.actions.filter((a) =>
    a.actionType === 'resolve_risk' || a.actionType === 'complete_profile' ||
    a.actionType === 'review_document' || a.actionType === 'qualify_storage' ||
    a.actionType === 'calibrate_equipment'
  ).slice(0, 10)

  const allPhased = [...phase1Actions, ...phase2Actions, ...phase3Actions, ...phase4Actions, ...phase5Actions]
  const completion = allPhased.length > 0
    ? Math.round((params.actions.filter((a) => !allPhased.includes(a)).length / params.actions.length) * 100)
    : 0

  const totalDays = Math.ceil(
    [phase1Actions, phase2Actions, phase3Actions, phase4Actions, phase5Actions]
      .reduce((sum, actions) => sum + actions.reduce((s, a) => s + a.estimatedMinutes, 0), 0) / 480
  )

  return {
    institutionId: params.institutionId,
    generatedAt: now,
    phases: [
      {
        phaseNumber: 1, name: 'Foundation — Documents & People',
        description: 'Establish the core documentation and personnel profile. This unlocks readiness assessment.',
        actions: phase1Actions,
        completionCriteria: ['All critical documents uploaded', 'Key personnel documented with licenses and certifications'],
        estimatedDurationDays: Math.ceil(phase1Actions.reduce((s, a) => s + a.estimatedMinutes, 0) / 480),
        unlocks: ['Readiness baseline', 'Compliance status', 'Sponsor visibility'],
      },
      {
        phaseNumber: 2, name: 'Infrastructure — Labs, Facilities & Equipment',
        description: 'Document the physical and operational infrastructure.',
        actions: phase2Actions,
        completionCriteria: ['All laboratories documented', 'Critical equipment cataloged', 'Storage capacity mapped'],
        estimatedDurationDays: Math.ceil(phase2Actions.reduce((s, a) => s + a.estimatedMinutes, 0) / 480),
        unlocks: ['Capability intelligence', 'Biospecimen operations', 'Operational dashboard'],
      },
      {
        phaseNumber: 3, name: 'Capabilities — What You Can Do',
        description: 'Map institutional capabilities to evidence and programs.',
        actions: phase3Actions,
        completionCriteria: ['Capabilities documented with evidence', 'Programs mapped to capabilities'],
        estimatedDurationDays: Math.ceil(phase3Actions.reduce((s, a) => s + a.estimatedMinutes, 0) / 480),
        unlocks: ['Program matching', 'Gap analysis', 'Growth planning'],
      },
      {
        phaseNumber: 4, name: 'Graph — Connecting Everything',
        description: 'Create relationships between all institutional entities.',
        actions: phase4Actions,
        completionCriteria: ['No orphan nodes', 'All critical relationships established', 'Graph density > 0.05'],
        estimatedDurationDays: Math.ceil(phase4Actions.reduce((s, a) => s + a.estimatedMinutes, 0) / 480),
        unlocks: ['Impact analysis', 'Explainability', 'Relationship explorer'],
      },
      {
        phaseNumber: 5, name: 'Excellence — Continuous Improvement',
        description: 'Resolve remaining risks, complete profiles, maintain currency.',
        actions: phase5Actions,
        completionCriteria: ['Zero critical risks', 'All documents current', 'All profiles complete'],
        estimatedDurationDays: Math.ceil(phase5Actions.reduce((s, a) => s + a.estimatedMinutes, 0) / 480),
        unlocks: ['Evidence promotion readiness', 'Full institutional profile', 'Sponsor intelligence readiness'],
      },
    ],
    overallCompletion: completion,
    estimatedTimeToComplete: `${totalDays} business days across 5 phases`,
    criticalPath: [
      'Upload CLIA, IRB, insurance, licenses',
      'Document PI, coordinator, lab staff',
      'Add laboratories and equipment',
      'Map capabilities to evidence',
      'Create all relationships',
      'Resolve all critical risks',
    ],
  }
}

// ==========================================================================
// INSTITUTION GROWTH PATH
// ==========================================================================

export type InstitutionMaturityStage =
  | 'emerging'
  | 'developing'
  | 'established'
  | 'advanced'
  | 'leading'

export interface InstitutionGrowthPath {
  institutionId: string
  currentStage: InstitutionMaturityStage
  nextStage: InstitutionMaturityStage | null
  stageRequirements: StageRequirement[]
  growthIndicators: GrowthPathIndicator[]
  recommendedFocus: string
}

export interface StageRequirement {
  stage: InstitutionMaturityStage
  requirements: string[]
  met: boolean[]
  allMet: boolean
}

export interface GrowthPathIndicator {
  name: string
  currentValue: number
  targetValue: number
  percentage: number
  trend: 'improving' | 'stable' | 'declining'
}

/**
 * Determine institutional maturity stage from knowledge coverage and health.
 */
export function determineGrowthPath(params: {
  institutionId: string
  coverageScore: number         // 0-100
  documentHealth: number
  peopleHealth: number
  labHealth: number
  graphHealth: number
  hasEvidencePromotion: boolean
}): InstitutionGrowthPath {
  const overall = Math.round(
    (params.coverageScore + params.documentHealth + params.peopleHealth + params.labHealth + params.graphHealth) / 5
  )

  const currentStage: InstitutionMaturityStage =
    overall >= 90 ? 'leading'
    : overall >= 70 ? 'advanced'
    : overall >= 50 ? 'established'
    : overall >= 30 ? 'developing'
    : 'emerging'

  const nextStageMap: Record<InstitutionMaturityStage, InstitutionMaturityStage | null> = {
    emerging: 'developing',
    developing: 'established',
    established: 'advanced',
    advanced: 'leading',
    leading: null,
  }

  const stageRequirements: StageRequirement[] = [
    {
      stage: 'emerging',
      requirements: ['At least 1 person documented', 'At least 1 document uploaded'],
      met: [true, true], allMet: true,
    },
    {
      stage: 'developing',
      requirements: ['3+ people documented', '5+ documents uploaded', 'At least 1 lab documented', 'Coverage > 30%'],
      met: [
        params.peopleHealth > 30, params.documentHealth > 30,
        params.labHealth > 30, params.coverageScore > 30,
      ],
      allMet: false, // computed below
    },
    {
      stage: 'established',
      requirements: ['All critical docs uploaded', 'People health > 60%', 'Lab health > 60%', 'Graph density adequate'],
      met: [
        params.documentHealth > 60, params.peopleHealth > 60,
        params.labHealth > 60, params.graphHealth > 50,
      ],
      allMet: false,
    },
    {
      stage: 'advanced',
      requirements: ['Coverage > 70%', 'All health scores > 75%', 'No critical risks', 'Evidence pipeline active'],
      met: [
        params.coverageScore > 70, params.documentHealth > 75 && params.peopleHealth > 75,
        params.labHealth > 75, params.hasEvidencePromotion,
      ],
      allMet: false,
    },
    {
      stage: 'leading',
      requirements: ['Coverage > 90%', 'All scores > 85%', 'Evidence promoted', 'Continuous intelligence active'],
      met: [
        params.coverageScore > 90, params.documentHealth > 85,
        params.labHealth > 85, params.hasEvidencePromotion && params.graphHealth > 85,
      ],
      allMet: false,
    },
  ]

  // Compute allMet for each stage
  for (const req of stageRequirements) {
    req.allMet = req.met.every((m) => m)
  }

  return {
    institutionId: params.institutionId,
    currentStage,
    nextStage: nextStageMap[currentStage],
    stageRequirements,
    growthIndicators: [
      { name: 'Knowledge Coverage', currentValue: params.coverageScore, targetValue: 90, percentage: Math.round((params.coverageScore / 90) * 100), trend: params.coverageScore > 50 ? 'improving' : 'stable' },
      { name: 'Document Health', currentValue: params.documentHealth, targetValue: 90, percentage: Math.round((params.documentHealth / 90) * 100), trend: 'stable' },
      { name: 'People Health', currentValue: params.peopleHealth, targetValue: 90, percentage: Math.round((params.peopleHealth / 90) * 100), trend: 'stable' },
      { name: 'Lab Health', currentValue: params.labHealth, targetValue: 90, percentage: Math.round((params.labHealth / 90) * 100), trend: 'stable' },
      { name: 'Graph Health', currentValue: params.graphHealth, targetValue: 90, percentage: Math.round((params.graphHealth / 90) * 100), trend: 'stable' },
    ],
    recommendedFocus: currentStage === 'emerging'
      ? 'Focus on documenting key people and uploading critical documents (CLIA, IRB, licenses).'
      : currentStage === 'developing'
      ? 'Document your laboratories, equipment, and capabilities. Build the institutional profile.'
      : currentStage === 'established'
      ? 'Create relationships between all entities. Complete the knowledge graph.'
      : currentStage === 'advanced'
      ? 'Promote evidence to claims. Activate continuous intelligence. Close remaining gaps.'
      : 'Maintain excellence. Share institutional profile. Explore new capabilities.',
  }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const GUIDED_ACQUISITION = {
  generateNextBestActions,
  buildProgressPath,
  generateCompletionRoadmap,
  determineGrowthPath,
}
