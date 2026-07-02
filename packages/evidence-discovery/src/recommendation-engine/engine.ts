// ==========================================================================
// Recommendation Engine (Sprint 21F)
// ==========================================================================
//
// Canonical action orchestration layer of Kadarn.
// Translates assessment, gaps, and readiness into prioritized actions.
//
// Never evaluates. Never computes confidence. Never infers evidence.
// Every recommendation is explainable and traceable.
// ==========================================================================

import type {
  Recommendation,
  RecommendationCategory,
  RecommendationEngineOutput,
  RecommendationInput,
  RecommendationPriority,
  RecommendationStatus,
  RecommendationSummary,
  SourceEngine,
} from './types.js'

// --------------------------------------------------------------------------
// Category mapping — from action keywords
// --------------------------------------------------------------------------

function mapCategory(action: string): RecommendationCategory {
  const a = action.toLowerCase()
  if (a.includes('upload') || a.includes('missing')) return 'evidence'
  if (a.includes('document') || a.includes('update')) return 'documentation'
  if (a.includes('metadata') || a.includes('complete')) return 'metadata'
  if (a.includes('external') || a.includes('confirm')) return 'external_confirmation'
  if (a.includes('review') || a.includes('inconsist')) return 'manual_review'
  if (a.includes('governance') || a.includes('policy')) return 'governance'
  if (a.includes('quality') || a.includes('qa')) return 'quality'
  if (a.includes('training')) return 'training'
  return 'operations'
}

// --------------------------------------------------------------------------
// Priority mapping — from gap severity
// --------------------------------------------------------------------------

function mapPriority(severity: string, isBlocking: boolean): RecommendationPriority {
  if (isBlocking || severity === 'blocking' || severity === 'critical') return 'critical'
  if (severity === 'high') return 'high'
  if (severity === 'moderate') return 'medium'
  return 'low'
}

// --------------------------------------------------------------------------
// Dashboard section routing
// --------------------------------------------------------------------------

function mapDashboardSection(category: RecommendationCategory): string {
  switch (category) {
    case 'evidence': return 'Evidence Gaps'
    case 'documentation': return 'Evidence Gaps'
    case 'metadata': return 'Evidence Documents'
    case 'external_confirmation': return 'Evidence Gaps'
    case 'manual_review': return 'Review & Improve Evidence'
    case 'governance': return 'Institution Profile'
    case 'quality': return 'Institution Profile'
    case 'training': return 'Institution Profile'
    default: return 'Recognition Overview'
  }
}

// --------------------------------------------------------------------------
// Build recommendations from gaps
// --------------------------------------------------------------------------

function buildFromGaps(input: RecommendationInput): Recommendation[] {
  const recs: Recommendation[] = []
  const now = new Date().toISOString()

  for (const gap of input.gaps ?? []) {
    const priority = mapPriority(gap.severity, gap.blocking)

    recs.push({
      id: `rec:gap:${gap.id}`,
      title: gap.title,
      description: `Evidence gap detected: ${gap.title}. ${gap.recommended_next_action}`,
      category: mapCategory(gap.recommended_next_action || gap.category),
      priority,
      status: 'recommended' as RecommendationStatus,
      reason: `Derived from evidence gap: ${gap.title} (${gap.severity} severity)`,
      affected_capabilities: gap.affected_capabilities,
      affected_research_assets: gap.affected_research_assets,
      affected_readiness: gap.blocking ? 'Needs Additional Evidence' : 'Presentation Ready',
      blocking: gap.blocking,
      recommended_action: gap.recommended_next_action || 'Address this evidence gap',
      source_engine: 'evidence_gap_intelligence' as SourceEngine,
      references: [gap.id],
      dashboard_section: mapDashboardSection(mapCategory(gap.recommended_next_action || gap.category)),
      last_updated: now,
    })
  }

  return recs
}

// --------------------------------------------------------------------------
// Build recommendations from assessment
// --------------------------------------------------------------------------

function buildFromAssessment(input: RecommendationInput): Recommendation[] {
  const recs: Recommendation[] = []
  const now = new Date().toISOString()

  for (const cap of input.assessment) {
    // Only generate recs for blocked or limited capabilities
    if (cap.assessment_status === 'healthy' || cap.assessment_status === 'unknown') continue

    const isBlocking = cap.blocking_gaps.length > 0
    const priority: RecommendationPriority = isBlocking ? 'critical'
      : cap.assessment_status === 'limited' ? 'high'
      : 'medium'

    for (const action of cap.recommended_actions) {
      if (action === 'No action required') continue

      recs.push({
        id: `rec:assessment:${cap.capability_id}:${action.toLowerCase().replace(/\s+/g, '_')}`,
        title: `${action} — ${cap.capability_name}`,
        description: `Capability "${cap.capability_name}" is ${cap.assessment_status}. Recommended: ${action}.`,
        category: mapCategory(action),
        priority,
        status: 'recommended' as RecommendationStatus,
        reason: `Capability "${cap.capability_name}" assessment status: ${cap.assessment_status}${isBlocking ? ' with blocking gaps' : ''}`,
        affected_capabilities: [cap.capability_id],
        affected_research_assets: cap.research_assets_enabled,
        affected_readiness: isBlocking ? 'Needs Additional Evidence' : 'Needs Human Review',
        blocking: isBlocking,
        recommended_action: action,
        source_engine: 'institutional_capability_assessment' as SourceEngine,
        references: [cap.capability_id, ...cap.blocking_gaps, ...cap.non_blocking_gaps],
        dashboard_section: mapDashboardSection(mapCategory(action)),
        last_updated: now,
      })
    }
  }

  return recs
}

// --------------------------------------------------------------------------
// Build recommendations from sponsor readiness
// --------------------------------------------------------------------------

function buildFromReadiness(input: RecommendationInput): Recommendation[] {
  const recs: Recommendation[] = []
  const now = new Date().toISOString()

  if (!input.readiness) return recs

  for (const item of input.readiness.recommended_preparation) {
    if (item === 'No action required') continue

    const isBlocking = input.readiness.blocking_items.length > 0
    recs.push({
      id: `rec:readiness:${item.toLowerCase().replace(/\s+/g, '_').slice(0, 40)}`,
      title: item,
      description: `Sponsor readiness preparation: ${item}. Current readiness: ${input.readiness.readiness_label}.`,
      category: mapCategory(item),
      priority: isBlocking ? 'high' : 'medium',
      status: 'recommended' as RecommendationStatus,
      reason: `Required for sponsor readiness improvement. Current label: ${input.readiness.readiness_label}`,
      affected_capabilities: [],
      affected_research_assets: [],
      affected_readiness: input.readiness.readiness_label,
      blocking: isBlocking,
      recommended_action: item,
      source_engine: 'sponsor_readiness' as SourceEngine,
      references: [],
      dashboard_section: 'Sponsor Readiness',
      last_updated: now,
    })
  }

  return recs
}

// --------------------------------------------------------------------------
// Deduplicate and sort
// --------------------------------------------------------------------------

function deduplicateAndSort(recs: Recommendation[]): Recommendation[] {
  // Deduplicate by title
  const seen = new Set<string>()
  const unique = recs.filter((r) => {
    const key = r.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort by priority: critical → high → medium → low
  const order: Record<RecommendationPriority, number> = {
    critical: 0, high: 1, medium: 2, low: 3,
  }
  unique.sort((a, b) => {
    const pa = order[a.priority] ?? 4
    const pb = order[b.priority] ?? 4
    if (pa !== pb) return pa - pb
    // Blocking first within same priority
    if (a.blocking && !b.blocking) return -1
    if (!a.blocking && b.blocking) return 1
    return 0
  })

  return unique
}

// --------------------------------------------------------------------------
// Summary builder
// --------------------------------------------------------------------------

function buildSummary(recs: Recommendation[]): RecommendationSummary {
  return {
    critical: recs.filter((r) => r.priority === 'critical').length,
    high: recs.filter((r) => r.priority === 'high').length,
    medium: recs.filter((r) => r.priority === 'medium').length,
    low: recs.filter((r) => r.priority === 'low').length,
    blocking: recs.filter((r) => r.blocking).length,
    completed: recs.filter((r) => r.status === 'completed').length,
    pending: recs.filter((r) => r.status === 'recommended' || r.status === 'pending').length,
  }
}

// --------------------------------------------------------------------------
// RecommendationEngine
// --------------------------------------------------------------------------

export class RecommendationEngine {
  /**
   * Build institutional recommendations from Assessment, Gaps, and Readiness.
   * Pure orchestration — no evaluation, no confidence, no inference.
   */
  build(input: RecommendationInput): RecommendationEngineOutput {
    const gapRecs = buildFromGaps(input)
    const assessmentRecs = buildFromAssessment(input)
    const readinessRecs = buildFromReadiness(input)

    const allRecs = deduplicateAndSort([...gapRecs, ...assessmentRecs, ...readinessRecs])
    const summary = buildSummary(allRecs)

    return {
      recommendations: allRecs,
      summary,
      generated_at: new Date().toISOString(),
    }
  }
}
