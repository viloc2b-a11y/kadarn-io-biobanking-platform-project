// ==========================================================================
// Sponsor Intelligence — Explainability (KTP-1.6 / Mission 7)
// ==========================================================================

import type { RecommendationExplanation } from './dto'
import type { ProgramInstitutionMatch } from './dto'
import type { ReadinessEvaluation } from '@kadarn/readiness-engine'

export function explainRecommendation(
  match: ProgramInstitutionMatch,
  evaluation: ReadinessEvaluation
): RecommendationExplanation {
  const evidence = evaluation.evaluation_snapshot?.evidence_highlights ?? []
  const gaps = evaluation.evaluation_snapshot?.concerns ?? []

  const supportingEvidence = evidence.slice(0, 3).map((e: any) => ({
    evidenceClass: e.evidence_class ?? 'C',
    description: e.description ?? 'Evidence record',
    confidence: e.confidence ?? 0,
  }))

  const whatIsMissing = gaps.map((g: string) => g)

  // Build trace chain: capability → evidence → confidence → readiness
  const traceChain = [
    `readiness_evaluation:${evaluation.id}`,
    `evaluation_snapshot:confidence=${evaluation.overall_confidence}`,
    `institution:${evaluation.organization_id}`,
    ...evidence.map((e: any) => `evidence:${e.id ?? 'unknown'}`),
  ]

  const whyRecommended = match.matchStrength === 'excellent' || match.matchStrength === 'good'
    ? `${evaluation.organization_name ?? evaluation.organization_id} is ${match.matchStrength} match with ${match.overallConfidence * 100}% confidence. ${supportingEvidence.length} evidence items support key capabilities.`
    : `${evaluation.organization_name ?? evaluation.organization_id} is ${match.matchStrength} match. ${whatIsMissing.length} evidence gaps identified.`

  return {
    recommendationId: `rec-${evaluation.organization_id}-${evaluation.program_type_key ?? 'institutional'}`,
    institutionId: evaluation.organization_id,
    whyRecommended,
    supportingEvidence,
    whatIsMissing,
    whatChanged: match.matchRationale.includes('previously') ? match.matchRationale : null,
    traceChain,
  }
}
