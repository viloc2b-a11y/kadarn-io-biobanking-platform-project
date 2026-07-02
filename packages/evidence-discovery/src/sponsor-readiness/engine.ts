// ==========================================================================
// Sponsor Readiness Engine (Sprint 21E)
// ==========================================================================
//
// A presentation layer over canonical assessment data.
// Translates institutional state into sponsor-facing language.
//
// Never evaluates. Never computes confidence. Never owns business logic.
// No "verified", "certified", "gold", "silver", "bronze", "pass", "fail".
// ==========================================================================

import type {
  SponsorReadiness,
  SponsorReadinessInput,
  SponsorReadinessLabel,
} from './types.js'

// --------------------------------------------------------------------------
// Readiness label — deterministic mapping from assessment summary
// --------------------------------------------------------------------------

function determineReadinessLabel(
  summary: SponsorReadinessInput['assessmentSummary'],
  totalCaps: number,
): SponsorReadinessLabel {
  // No capabilities at all
  if (totalCaps === 0) return 'Not Enough Evidence Yet'

  const { healthy, attention_needed, limited, blocked } = summary

  // Any blocking → needs additional evidence
  if (blocked > 0) return 'Needs Additional Evidence'

  // Mostly healthy with few concerns → presentation ready
  if (healthy >= totalCaps * 0.5 && (attention_needed + limited) <= totalCaps * 0.3) {
    return 'Presentation Ready'
  }

  // Significant limited or attention_needed → needs additional evidence
  if (limited > 0 || attention_needed > healthy) {
    return 'Needs Additional Evidence'
  }

  // Unknowns dominate → needs human review
  if (summary.unknown > totalCaps * 0.5) {
    return 'Needs Human Review'
  }

  // Fallback
  return 'Needs Additional Evidence'
}

// --------------------------------------------------------------------------
// Summary builder
// --------------------------------------------------------------------------

function buildSummary(label: SponsorReadinessLabel, summary: SponsorReadinessInput['assessmentSummary']): string {
  const { healthy, blocked, limited, attention_needed } = summary

  switch (label) {
    case 'Presentation Ready':
      return `${healthy} institutional capabilities are operating with sufficient evidence and no blocking gaps. The institution's evidence profile is ready for sponsor presentation.`

    case 'Needs Additional Evidence':
      if (blocked > 0) {
        return `${blocked} blocking gap(s) require attention before this profile can be presented. Addressing evidence gaps will significantly improve readiness.`
      }
      return `${limited + attention_needed} capabilities need additional evidence or attention. Uploading supporting documentation will improve the presentation profile.`

    case 'Needs Human Review':
      return 'A significant portion of institutional capabilities have not been detected or assessed. Manual review is recommended to identify additional evidence sources.'

    case 'Not Enough Evidence Yet':
      return 'Insufficient discovery data is available to assess sponsor readiness. Expand the discovery scope or upload additional documentation to begin building an evidence profile.'
  }
}

// --------------------------------------------------------------------------
// Strength generation — from assessment statuses
// --------------------------------------------------------------------------

function generateStrengths(input: SponsorReadinessInput): string[] {
  const strengths: string[] = []
  const { assessment, capabilities } = input

  // Supported/healthy capabilities
  const supported = assessment.filter((a) => a.assessment_status === 'healthy')
  if (supported.length >= 3) {
    strengths.push('Multiple supported institutional capabilities')
  }

  // Strong evidence for key categories
  const biospecimenHealthy = assessment.filter(
    (a) => a.assessment_status === 'healthy' && a.category === 'Biospecimen Processing',
  )
  if (biospecimenHealthy.length > 0) {
    strengths.push('Strong evidence for biospecimen processing')
  }

  const clinicalHealthy = assessment.filter(
    (a) => a.assessment_status === 'healthy' && a.category === 'Clinical Operations',
  )
  if (clinicalHealthy.length > 0) {
    strengths.push('Established clinical operations')
  }

  // Established/advanced maturity
  const advancedCaps = assessment.filter(
    (a) => a.operational_maturity === 'established' || a.operational_maturity === 'advanced',
  )
  if (advancedCaps.length >= 2) {
    strengths.push('Evidence-supported operational maturity across multiple capabilities')
  }

  // Longitudinal follow-up
  for (const cap of capabilities ?? []) {
    if (cap.name.toLowerCase().includes('longitudinal') || cap.name.toLowerCase().includes('follow')) {
      strengths.push('Evidence-supported longitudinal follow-up')
      break
    }
  }

  // Research asset portfolio
  const allAssets = new Set<string>()
  for (const a of assessment) {
    for (const asset of a.research_assets_enabled) {
      allAssets.add(asset)
    }
  }
  if (allAssets.size >= 4) {
    strengths.push('Research asset portfolio enabled across multiple biospecimen types')
  }

  // Cap at 5
  return strengths.slice(0, 5)
}

// --------------------------------------------------------------------------
// Concern generation — from gaps and assessment
// --------------------------------------------------------------------------

function generateConcerns(input: SponsorReadinessInput): string[] {
  const concerns: string[] = []
  const { assessment, gaps } = input

  // Blocking gaps → concerns
  const allBlocking = assessment.flatMap((a) => a.blocking_gaps)
  if (allBlocking.length > 0) {
    concerns.push('Critical evidence gaps remain')
  }

  // Missing supporting documentation
  const needsEvidence = assessment.filter((a) =>
    a.recommended_actions.includes('Upload evidence'),
  )
  if (needsEvidence.length > 0) {
    concerns.push('Supporting documentation missing for key capabilities')
  }

  // External confirmation needed
  const needsExternal = assessment.filter((a) =>
    a.recommended_actions.includes('Request external confirmation'),
  )
  if (needsExternal.length > 0) {
    concerns.push('External confirmation required for some capabilities')
  }

  // Incomplete evidence
  const needsDoc = assessment.filter((a) =>
    a.recommended_actions.includes('Update documentation'),
  )
  if (needsDoc.length > 0) {
    concerns.push('Operational evidence incomplete')
  }

  // Governance gaps
  if (gaps?.some((g) => g.severity === 'high' && !g.blocking)) {
    concerns.push('Governance documentation gaps identified')
  }

  // Cap at 5
  return concerns.slice(0, 5)
}

// --------------------------------------------------------------------------
// Blocking items — from assessment
// --------------------------------------------------------------------------

function generateBlockingItems(input: SponsorReadinessInput): string[] {
  const blocking: string[] = []

  for (const a of input.assessment) {
    for (const gap of a.blocking_gaps) {
      blocking.push(`${a.capability_name}: ${gap}`)
    }
  }

  return blocking.slice(0, 10)
}

// --------------------------------------------------------------------------
// Recommended preparation — from assessment recommended_actions
// --------------------------------------------------------------------------

function generatePreparation(input: SponsorReadinessInput): string[] {
  const actions = new Set<string>()

  for (const a of input.assessment) {
    for (const action of a.recommended_actions) {
      if (action !== 'No action required') {
        actions.add(action)
      }
    }
  }

  const ordered = [
    'Upload evidence',
    'Update documentation',
    'Complete missing metadata',
    'Review inconsistency',
    'Request external confirmation',
    'Review manually',
  ]

  const result: string[] = []
  for (const action of ordered) {
    if (actions.has(action)) result.push(action)
  }

  if (result.length === 0) result.push('No action required')

  return result.slice(0, 6)
}

// --------------------------------------------------------------------------
// Relevant research assets — from assessment
// --------------------------------------------------------------------------

function generateRelevantAssets(input: SponsorReadinessInput): string[] {
  const assets = new Set<string>()
  for (const a of input.assessment) {
    for (const asset of a.research_assets_enabled) {
      assets.add(asset)
    }
  }
  return Array.from(assets).sort().slice(0, 14)
}

// --------------------------------------------------------------------------
// Capability highlights — for sponsor view
// --------------------------------------------------------------------------

function generateHighlights(input: SponsorReadinessInput): string[] {
  const highlights: string[] = []

  // Prioritize healthy + advanced
  const sorted = [...input.assessment].sort((a, b) => {
    const priority: Record<string, number> = { healthy: 0, attention_needed: 1, limited: 2, blocked: 3, unknown: 4 }
    return (priority[a.assessment_status] ?? 5) - (priority[b.assessment_status] ?? 5)
  })

  for (const a of sorted.slice(0, 5)) {
    const assetStr = a.research_assets_enabled.length > 0
      ? ` — Enables: ${a.research_assets_enabled.join(', ')}`
      : ''
    highlights.push(`${a.capability_name} (${a.assessment_status}${a.operational_maturity !== 'emerging' ? `, ${a.operational_maturity}` : ''})${assetStr}`)
  }

  return highlights
}

// --------------------------------------------------------------------------
// Assessment references
// --------------------------------------------------------------------------

function buildReferences(input: SponsorReadinessInput): string[] {
  const refs: string[] = []
  const { assessmentSummary: s } = input
  refs.push(`Assessment: ${s.healthy} healthy, ${s.attention_needed} attention, ${s.limited} limited, ${s.blocked} blocked, ${s.unknown} unknown`)
  refs.push(`Total capabilities assessed: ${input.assessment.length}`)
  return refs
}

// --------------------------------------------------------------------------
// SponsorReadinessEngine
// --------------------------------------------------------------------------

export class SponsorReadinessEngine {
  /**
   * Build sponsor readiness from Institutional Capability Assessment.
   * Pure translation — no evaluation, no confidence, no business logic.
   */
  build(input: SponsorReadinessInput): SponsorReadiness {
    const totalCaps = input.assessment.length
    const readinessLabel = determineReadinessLabel(input.assessmentSummary, totalCaps)
    const summary = buildSummary(readinessLabel, input.assessmentSummary)
    const strengths = generateStrengths(input)
    const concerns = generateConcerns(input)
    const blockingItems = generateBlockingItems(input)
    const preparation = generatePreparation(input)
    const relevantAssets = generateRelevantAssets(input)
    const highlights = generateHighlights(input)
    const references = buildReferences(input)

    return {
      readiness_label: readinessLabel,
      summary,
      strengths,
      concerns,
      blocking_items: blockingItems,
      recommended_preparation: preparation,
      relevant_research_assets: relevantAssets,
      capability_highlights: highlights,
      assessment_references: references,
      last_updated: new Date().toISOString(),
    }
  }
}
