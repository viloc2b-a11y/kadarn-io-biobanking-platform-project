// ==========================================================================
// Institutional Capability Assessment Engine (Sprint 21D)
// ==========================================================================
//
// The canonical assessment layer of Kadarn.
// Evaluates the current state of institutional capabilities.
//
// Consumes Capability Intelligence + Evidence Gap Intelligence.
// Produces InstitutionCapabilityAssessment.
//
// All future readiness modules must consume this engine.
//
// No AI reasoning. No confidence computation. No Evidence Core writes.
// No "verified", "certified", "gold", "silver", "bronze", "pass", "fail".
// ==========================================================================

import type {
  AssessmentInput,
  AssessmentStatus,
  AssessmentSummary,
  CapabilityAssessmentEntry,
  DashboardPriority,
  InstitutionCapabilityAssessment,
  OperationalMaturity,
  RecommendedAction,
  SponsorRelevance,
} from './types'

// --------------------------------------------------------------------------
// Assessment status — deterministic mapping from capability + gap state
// --------------------------------------------------------------------------

function determineAssessmentStatus(
  capabilityStatus: string,
  blockingGapCount: number,
  nonBlockingGapCount: number,
  hasEvidence: boolean,
): AssessmentStatus {
  // Not detected → unknown
  if (capabilityStatus === 'not_detected') return 'unknown'

  // Blocking gaps → blocked
  if (blockingGapCount > 0) return 'blocked'

  // No evidence at all → limited
  if (!hasEvidence) return 'limited'

  // needs_more_evidence or needs_human_review → limited
  if (capabilityStatus === 'needs_more_evidence' || capabilityStatus === 'needs_human_review') {
    return 'limited'
  }

  // partially_supported with non-blocking gaps → attention_needed
  if (capabilityStatus === 'partially_supported' && nonBlockingGapCount > 0) {
    return 'attention_needed'
  }

  // partially_supported without gaps → healthy
  if (capabilityStatus === 'partially_supported') return 'healthy'

  // supported → healthy
  if (capabilityStatus === 'supported') return 'healthy'

  return 'unknown'
}

// --------------------------------------------------------------------------
// Operational maturity — evidence completeness + status
// --------------------------------------------------------------------------

function determineOperationalMaturity(
  assessmentStatus: AssessmentStatus,
  capabilityStatus: string,
  claimCount: number,
  evidenceCount: number,
  assetCount: number,
  gapCount: number,
): OperationalMaturity {
  // unknown or blocked → at most developing
  if (assessmentStatus === 'unknown') return 'emerging'
  if (assessmentStatus === 'blocked' && capabilityStatus === 'not_detected') return 'emerging'

  // Strong evidence base → advanced
  if (
    capabilityStatus === 'supported' &&
    claimCount >= 2 &&
    evidenceCount >= 3 &&
    assetCount >= 2 &&
    gapCount === 0
  ) {
    return 'advanced'
  }

  // Healthy or supported with decent evidence → established
  if (
    assessmentStatus === 'healthy' &&
    evidenceCount >= 2 &&
    (claimCount >= 1 || assetCount >= 1)
  ) {
    return 'established'
  }

  // Limited or partially supported → developing
  if (
    assessmentStatus === 'limited' ||
    assessmentStatus === 'attention_needed'
  ) {
    return 'developing'
  }

  // Blocked but was previously detected → developing
  if (assessmentStatus === 'blocked') return 'developing'

  return 'emerging'
}

// --------------------------------------------------------------------------
// Dashboard priority — presentation ordering only, not scoring
// --------------------------------------------------------------------------

function determineDashboardPriority(
  assessmentStatus: AssessmentStatus,
  blockingGapCount: number,
): DashboardPriority {
  if (assessmentStatus === 'blocked' || blockingGapCount > 0) return 'critical'
  if (assessmentStatus === 'attention_needed') return 'high'
  if (assessmentStatus === 'limited') return 'high'
  if (assessmentStatus === 'healthy') return 'normal'
  return 'informational'
}

// --------------------------------------------------------------------------
// Future sponsor relevance — preparation for Sprint 21E
// --------------------------------------------------------------------------

const HIGH_RELEVANCE_CATEGORIES = new Set([
  'Biospecimen Processing',
  'Clinical Operations',
  'Clinical Data',
  'Laboratory',
  'Regulatory',
])

const MEDIUM_RELEVANCE_CATEGORIES = new Set([
  'Storage',
  'Shipping',
  'Digital Pathology',
  'Imaging',
  'Quality',
  'Personnel',
])

function determineSponsorRelevance(
  assessmentStatus: AssessmentStatus,
  category: string,
): SponsorRelevance {
  if (assessmentStatus === 'unknown') return 'unknown'

  if (assessmentStatus === 'blocked') return 'low'

  if (HIGH_RELEVANCE_CATEGORIES.has(category)) {
    return assessmentStatus === 'healthy' ? 'high' : 'medium'
  }

  if (MEDIUM_RELEVANCE_CATEGORIES.has(category)) {
    return assessmentStatus === 'healthy' ? 'medium' : 'low'
  }

  return 'low'
}

// --------------------------------------------------------------------------
// Recommended actions — derived from status, gaps, and context
// --------------------------------------------------------------------------

function determineRecommendedActions(
  assessmentStatus: AssessmentStatus,
  blockingGapCount: number,
  nonBlockingGapCount: number,
  missingRequirements: string[],
  gaps: AssessmentInput['gaps'],
  capabilityId: string,
): RecommendedAction[] {
  const actions: RecommendedAction[] = []

  if (assessmentStatus === 'healthy' && nonBlockingGapCount === 0) {
    actions.push('No action required')
    return actions
  }

  // Blocking gaps → urgent evidence upload
  if (blockingGapCount > 0) {
    actions.push('Upload evidence')

    // Check if any blocking gaps suggest review
    const blockingGaps = (gaps ?? []).filter(
      (g) => g.blocking && g.affected_capabilities.includes(capabilityId),
    )
    if (blockingGaps.some((g) => g.category.includes('inconsistent'))) {
      actions.push('Review inconsistency')
    }
    if (blockingGaps.some((g) => g.category.includes('external'))) {
      actions.push('Request external confirmation')
    }
  }

  // Non-blocking gaps
  if (nonBlockingGapCount > 0) {
    if (!actions.includes('Upload evidence')) {
      actions.push('Upload evidence')
    }

    const nonBlocking = (gaps ?? []).filter(
      (g) => !g.blocking && g.affected_capabilities.includes(capabilityId),
    )
    if (nonBlocking.some((g) => g.category.includes('metadata') || g.category.includes('insufficient'))) {
      actions.push('Complete missing metadata')
    }
    if (nonBlocking.some((g) => g.category.includes('documentation') || g.category.includes('missing'))) {
      actions.push('Update documentation')
    }
  }

  // Missing requirements
  if (missingRequirements.length > 0 && assessmentStatus !== 'healthy') {
    if (!actions.includes('Update documentation')) {
      actions.push('Update documentation')
    }
  }

  // Limited or unknown → human review
  if (
    (assessmentStatus === 'limited' || assessmentStatus === 'unknown') &&
    !actions.includes('Review manually')
  ) {
    actions.push('Review manually')
  }

  // Cap at 4 actions
  return actions.slice(0, 4)
}

// --------------------------------------------------------------------------
// Assessment summary builder — human-readable
// --------------------------------------------------------------------------

function buildAssessmentSummary(
  capabilityName: string,
  assessmentStatus: AssessmentStatus,
  operationalMaturity: OperationalMaturity,
  blockingGapCount: number,
  researchAssetCount: number,
): string {
  const statusLabels: Record<AssessmentStatus, string> = {
    healthy: 'operating with sufficient evidence and no blocking gaps',
    attention_needed: 'requires attention — non-blocking gaps or partial evidence',
    limited: 'evidence is limited — more documentation or human review needed',
    blocked: 'blocked by critical evidence gaps',
    unknown: 'not yet detected in current discovery data',
  }

  const maturityLabels: Record<OperationalMaturity, string> = {
    advanced: 'Advanced maturity',
    established: 'Established maturity',
    developing: 'Developing maturity',
    emerging: 'Emerging maturity',
  }

  const parts: string[] = [
    `${capabilityName}: ${statusLabels[assessmentStatus]}.`,
    `${maturityLabels[operationalMaturity]}.`,
  ]

  if (researchAssetCount > 0) {
    parts.push(`Enables ${researchAssetCount} research asset(s).`)
  }

  if (blockingGapCount > 0) {
    parts.push(`${blockingGapCount} blocking gap(s) require immediate attention.`)
  }

  return parts.join(' ')
}

// --------------------------------------------------------------------------
// Summary builder
// --------------------------------------------------------------------------

function buildSummary(assessments: CapabilityAssessmentEntry[]): AssessmentSummary {
  return {
    healthy: assessments.filter((a) => a.assessment_status === 'healthy').length,
    attention_needed: assessments.filter((a) => a.assessment_status === 'attention_needed').length,
    limited: assessments.filter((a) => a.assessment_status === 'limited').length,
    blocked: assessments.filter((a) => a.assessment_status === 'blocked').length,
    unknown: assessments.filter((a) => a.assessment_status === 'unknown').length,
  }
}

// --------------------------------------------------------------------------
// Gap matching helpers
// --------------------------------------------------------------------------

function findGapsForCapability(
  capabilityId: string,
  gaps: AssessmentInput['gaps'],
): { blocking: string[]; nonBlocking: string[] } {
  const matching = (gaps ?? []).filter((g) =>
    g.affected_capabilities.includes(capabilityId),
  )

  return {
    blocking: matching.filter((g) => g.blocking).map((g) => g.title),
    nonBlocking: matching.filter((g) => !g.blocking).map((g) => g.title),
  }
}

// --------------------------------------------------------------------------
// InstitutionalCapabilityAssessmentEngine
// --------------------------------------------------------------------------

export class InstitutionalCapabilityAssessmentEngine {
  /**
   * Build the canonical institutional capability assessment from
   * Capability Intelligence and Evidence Gap Intelligence outputs.
   */
  build(input: AssessmentInput): InstitutionCapabilityAssessment {
    const now = new Date().toISOString()
    const assessments = this.buildAssessments(input)

    return {
      assessment: assessments,
      summary: buildSummary(assessments),
      generated_at: now,
    }
  }

  private buildAssessments(input: AssessmentInput): CapabilityAssessmentEntry[] {
    const { capabilities, gaps } = input
    const now = new Date().toISOString()

    return capabilities.map((cap) => {
      const capGaps = findGapsForCapability(cap.id, gaps)
      const blockingGapCount = capGaps.blocking.length
      const nonBlockingGapCount = capGaps.nonBlocking.length
      const hasEvidence = cap.supporting_evidence.length > 0
      const claimCount = cap.supporting_claims.length
      const evidenceCount = cap.supporting_evidence.length
      const assetCount = cap.research_assets_enabled.length

      const assessmentStatus = determineAssessmentStatus(
        cap.status,
        blockingGapCount,
        nonBlockingGapCount,
        hasEvidence,
      )

      const operationalMaturity = determineOperationalMaturity(
        assessmentStatus,
        cap.status,
        claimCount,
        evidenceCount,
        assetCount,
        capGaps.blocking.length + capGaps.nonBlocking.length,
      )

      const dashboardPriority = determineDashboardPriority(assessmentStatus, blockingGapCount)

      const sponsorRelevance = determineSponsorRelevance(assessmentStatus, cap.category)

      const recommendedActions = determineRecommendedActions(
        assessmentStatus,
        blockingGapCount,
        nonBlockingGapCount,
        cap.missing_requirements,
        gaps,
        cap.id,
      )

      const assessmentSummary = buildAssessmentSummary(
        cap.name,
        assessmentStatus,
        operationalMaturity,
        blockingGapCount,
        assetCount,
      )

      return {
        capability_id: cap.id,
        capability_name: cap.name,
        category: cap.category,
        assessment_status: assessmentStatus,
        operational_maturity: operationalMaturity,
        assessment_summary: assessmentSummary,
        research_assets_enabled: cap.research_assets_enabled,
        blocking_gaps: capGaps.blocking,
        non_blocking_gaps: capGaps.nonBlocking,
        missing_requirements: cap.missing_requirements,
        recommended_actions: recommendedActions,
        dashboard_priority: dashboardPriority,
        future_sponsor_relevance: sponsorRelevance,
        last_updated: now,
      }
    })
  }
}
