// ==========================================================================
// Capability Intelligence — Program Fit Assessment (KTP-1.5A)
// ==========================================================================

import type { CapabilityIntelligenceInput } from './types'

export interface ProgramFitAssessment {
  organizationId?: string
  programTypeKey: string
  fitSummary: 'strong_fit' | 'adequate_fit' | 'developing_fit' | 'poor_fit'
  strengths: string[]
  developmentAreas: string[]
  criticalGaps: string[]
  nextMilestone: string
  generatedAt: string
}

export function assessProgramFit(input: CapabilityIntelligenceInput): ProgramFitAssessment {
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
  const weakRatio = weak.length / total

  let fitSummary: ProgramFitAssessment['fitSummary'] = 'poor_fit'
  if (supportedRatio >= 0.9 && weakRatio === 0) fitSummary = 'strong_fit'
  else if (supportedRatio >= 0.7 && weakRatio <= 0.1) fitSummary = 'adequate_fit'
  else if (supportedRatio >= 0.5) fitSummary = 'developing_fit'

  const strengths = supported.map((c) => c.name)
  const developmentAreas = [...partial, ...weak].map((c) => c.name)

  const criticalGaps = input.gaps
    .filter((g) => g.severity === 'critical')
    .map((g) => g.description)

  let nextMilestone = ''

  if (fitSummary === 'poor_fit') {
    nextMilestone = `Address ${criticalGaps.length} critical gaps before reassessment`
  } else if (fitSummary === 'developing_fit') {
    nextMilestone = `Resolve critical gaps in: ${criticalGaps.slice(0, 2).join(', ') || 'evidence requirements'}`
  } else if (fitSummary === 'adequate_fit') {
    nextMilestone = `Provide remaining evidence for: ${developmentAreas.slice(0, 2).join(', ') || 'optional capabilities'}`
  } else {
    nextMilestone = 'Maintain current evidence levels and update as capabilities evolve'
  }

  return {
    programTypeKey: 'institutional',
    fitSummary,
    strengths,
    developmentAreas,
    criticalGaps,
    nextMilestone,
    generatedAt: new Date().toISOString(),
  }
}
