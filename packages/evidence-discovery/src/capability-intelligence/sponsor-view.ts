// ==========================================================================
// Capability Intelligence — Sponsor Decision View (KTP-1.5A)
// ==========================================================================
//
// DERIVED PROJECTION. Pure function. Never stored. Never persisted.
// Consumed by Sponsor Intelligence Runtime (Mission 7).
// ==========================================================================

import type { CapabilityIntelligenceInput } from './types'

export interface SponsorDecisionView {
  organizationId?: string
  organizationName?: string
  programTypeKey: string
  readinessSummary: string
  fitAssessment: 'strong' | 'adequate' | 'developing' | 'not_assessed'
  keyStrengths: string[]
  keyRisks: string[]
  evidenceCompleteness: number
  recommendationSummary: string
  lastUpdated: string
  verifiableVia: string
}

export interface SponsorDecisionViewMetadata {
  generatedAt?: string
  verifiableVia?: string
}

export function buildSponsorDecisionView(
  input: CapabilityIntelligenceInput,
  metadata: SponsorDecisionViewMetadata = {},
): SponsorDecisionView {
  const supported = input.candidateCapabilities.filter((c) => c.status === 'supported')
  const partial = input.candidateCapabilities.filter((c) => c.status === 'partially_supported')
  const weak = input.candidateCapabilities.filter(
    (c) =>
      c.status === 'needs_more_evidence' ||
      c.status === 'needs_human_review' ||
      c.status === 'not_detected'
  )

  const total = input.candidateCapabilities.length || 1
  const supportedRatio = supported.length / total

  let fitAssessment: SponsorDecisionView['fitAssessment'] = 'not_assessed'
  if (supportedRatio >= 0.9 && weak.length === 0) fitAssessment = 'strong'
  else if (supportedRatio >= 0.7 && weak.length <= 1) fitAssessment = 'adequate'
  else if (supportedRatio >= 0.4) fitAssessment = 'developing'

  const readinessSummary =
    total === 0
      ? 'Not yet assessed'
      : `${supported.length} of ${total} capabilities fully supported (${Math.round(supportedRatio * 100)}%)`

  const keyStrengths = supported.slice(0, 3).map((c) => c.name)
  const keyRisks: string[] = []

  for (const g of input.gaps.filter((g) => g.severity === 'critical')) {
    keyRisks.push(g.description)
  }
  for (const c of partial) {
    const relatedGaps = input.gaps.filter((g) => g.category === c.category)
    if (relatedGaps.length > 0) {
      keyRisks.push(`${c.name}: ${relatedGaps.map((g) => g.description).join('; ')}`)
    }
  }

  const criticalGaps = input.gaps.filter((g) => g.severity === 'critical')
  let recommendationSummary = ''
  if (fitAssessment === 'strong') recommendationSummary = 'Ready for engagement — all core capabilities supported'
  else if (fitAssessment === 'adequate') recommendationSummary = 'Monitor progress — minor evidence gaps remain'
  else if (fitAssessment === 'developing') recommendationSummary = `Not yet suitable — ${criticalGaps.length} critical gap(s) to resolve`
  else recommendationSummary = 'Insufficient data for assessment'

  // Evidence completeness: % of capabilities with at least some evidence
  const withEvidence = [...supported, ...partial].length
  const evidenceCompleteness = Math.round((withEvidence / total) * 100)

  return {
    programTypeKey: 'institutional',
    readinessSummary,
    fitAssessment,
    keyStrengths,
    keyRisks: keyRisks.slice(0, 5),
    evidenceCompleteness,
    recommendationSummary,
    lastUpdated: metadata.generatedAt ?? 'not_provided',
    verifiableVia: metadata.verifiableVia ?? 'not_available',
  }
}
