// ==========================================================================
// Sponsor Intelligence — Program Matching (Inverse Query) (KTP-1.6)
// ==========================================================================
//
// Program View: "What institutions can execute this program?"
// Inverse of Institution View. Same data, different navigation.
// ==========================================================================

import type { ProgramMatchResult, ProgramInstitutionMatch } from './dto'

import type { ReadinessEvaluation } from '@kadarn/readiness-engine'

export function matchInstitutionsToProgram(
  programTypeKey: string,
  programTypeName: string,
  evaluations: ReadinessEvaluation[]
): ProgramMatchResult {
  const matched: ProgramInstitutionMatch[] = evaluations.map((e) => {
    const confidence = e.overall_confidence ?? 0
    const status = e.readiness_status
    const gaps = e.evaluation_snapshot?.concerns ?? []

    let matchStrength: ProgramInstitutionMatch['matchStrength'] = 'limited'
    if (status === 'ready' && confidence >= 0.85) matchStrength = 'excellent'
    else if (status === 'ready' || (status === 'conditionally_ready' && confidence >= 0.70)) matchStrength = 'good'
    else if (status === 'conditionally_ready' || status === 'partial') matchStrength = 'adequate'

    const rationale = buildRationale(status, confidence, e.evaluation_snapshot?.strengths ?? [])
    const capabilityCoverage = e.evaluation_snapshot?.evidence_completeness ?? 0
    const evidenceQuality = confidence >= 0.80 ? 'well-documented' : confidence >= 0.60 ? 'adequate' : 'sparse'
    const criticalGaps = gaps.filter((g: string) =>
      g.toLowerCase().includes('critical') || g.toLowerCase().includes('mandatory')
    )
    const recommendation = buildRecommendation(status, matchStrength, criticalGaps)

    return {
      institutionId: e.organization_id,
      institutionName: e.organization_name ?? e.organization_id,
      readinessStatus: status,
      overallConfidence: confidence,
      matchStrength,
      matchRationale: rationale,
      capabilityCoverage,
      evidenceQuality,
      criticalGaps,
      recommendation,
    }
  })

  // Sort by match strength (excellent first)
  matched.sort((a, b) => {
    const order: Record<string, number> = { excellent: 0, good: 1, adequate: 2, limited: 3 }
    return (order[a.matchStrength] ?? 99) - (order[b.matchStrength] ?? 99)
  })

  return {
    programTypeKey,
    programTypeName,
    matchedInstitutions: matched,
    totalCandidates: matched.length,
    generatedAt: new Date().toISOString(),
  }
}

function buildRationale(status: string, confidence: number, strengths: string[]): string {
  if (status === 'ready') return `Fully ready with ${Math.round(confidence * 100)}% confidence. Key strengths: ${strengths.slice(0, 2).join(', ') || 'multiple capabilities supported'}.`
  if (status === 'conditionally_ready') return `Conditionally ready at ${Math.round(confidence * 100)}% confidence. Most requirements met with minor gaps.`
  if (status === 'partial') return `Partially ready. Some capability evidence is present but gaps remain that affect program execution readiness.`
  return 'Not yet ready. Critical capability and evidence gaps need to be addressed before program participation.'
}

function buildRecommendation(status: string, matchStrength: string, criticalGaps: string[]): string {
  if (matchStrength === 'excellent' || matchStrength === 'good') {
    return 'Consider for program participation. Monitor for continued readiness maintenance.'
  }
  if (criticalGaps.length > 0) {
    return `Address critical gaps before consideration: ${criticalGaps.slice(0, 2).join('; ')}`
  }
  return 'Build core capabilities and submit supporting evidence for program evaluation.'
}
