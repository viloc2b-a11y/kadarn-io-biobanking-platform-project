// ==========================================================================
// Capability Intelligence — Readiness Interpretation (KTP-1.5A)
// ==========================================================================

import type { CapabilityIntelligenceInput } from './types'

export interface ReadinessInterpretation {
  summary: string
  strengths: string[]
  concerns: string[]
  evidenceQuality: 'well-documented' | 'adequate' | 'sparse' | 'unverified'
  trend: 'improving' | 'stable' | 'declining'
  generatedAt: string
}

export function interpretReadiness(input: CapabilityIntelligenceInput): ReadinessInterpretation {
  const supported = input.candidateCapabilities.filter((c) => c.status === 'supported')
  const partial = input.candidateCapabilities.filter((c) => c.status === 'partially_supported')
  const needsEvidence = input.candidateCapabilities.filter(
    (c) => c.status === 'needs_more_evidence' || c.status === 'needs_human_review'
  )
  const notDetected = input.candidateCapabilities.filter((c) => c.status === 'not_detected')

  const strengths = supported.map(
    (c) => `${c.name}: ${c.reasoning || 'Evidence supports this capability'}`
  )
  const concerns: string[] = []

  for (const c of partial) {
    const relatedGaps = input.gaps.filter((g) => g.category === c.category)
    const gapDescs = relatedGaps.map((g) => g.description).join('; ')
    concerns.push(`${c.name} is partially supported${gapDescs ? ` — ${gapDescs}` : ''}`)
  }
  for (const c of needsEvidence) {
    const relatedGaps = input.gaps.filter((g) => g.category === c.category)
    const gapDescs = relatedGaps.map((g) => g.description).join('; ')
    concerns.push(`${c.name} requires additional evidence${gapDescs ? ` — ${gapDescs}` : ''}`)
  }

  // Evidence quality assessment
  const totalCaps = input.candidateCapabilities.length
  const supportedRatio = supported.length / (totalCaps || 1)
  let evidenceQuality: ReadinessInterpretation['evidenceQuality'] = 'unverified'
  if (supportedRatio >= 0.8) evidenceQuality = 'well-documented'
  else if (supportedRatio >= 0.5) evidenceQuality = 'adequate'
  else if (supportedRatio >= 0.2) evidenceQuality = 'sparse'

  const summary =
    totalCaps === 0
      ? 'No institutional capabilities have been evaluated yet.'
      : `This institution has ${supported.length} supported, ${partial.length} partially supported, and ${needsEvidence.length + notDetected.length} capabilities needing evidence across ${totalCaps} total categories. Evidence quality is ${evidenceQuality}.`

  return {
    summary,
    strengths,
    concerns,
    evidenceQuality,
    trend: 'stable',
    generatedAt: new Date().toISOString(),
  }
}
