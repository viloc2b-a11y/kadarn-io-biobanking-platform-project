// ==========================================================================
// Capability Intelligence — Evidence Gap Analysis (KTP-1.5A)
// ==========================================================================

import type { CapabilityIntelligenceInput } from './types'

export interface EvidenceGap {
  gapId: string
  category: string
  description: string
  severity: 'critical' | 'significant' | 'minor'
  affectedCapability: string
  recommendation: string
  estimatedEffort: 'low' | 'medium' | 'high'
}

export function analyzeEvidenceGaps(input: CapabilityIntelligenceInput): EvidenceGap[] {
  // Map capabilities to categories for gap → capability linking
  const categoryToCap = new Map<string, string>()
  for (const c of input.candidateCapabilities) {
    if (!categoryToCap.has(c.category)) {
      categoryToCap.set(c.category, c.name)
    }
  }

  return input.gaps.map((g) => {
    const affectedCap = categoryToCap.get(g.category) ?? g.category

    let recommendation = ''
    let estimatedEffort: 'low' | 'medium' | 'high' = 'medium'

    if (g.severity === 'critical') {
      recommendation = `Submit evidence for ${affectedCap}: ${g.description}. This is a mandatory requirement.`
      estimatedEffort = 'high'
    } else if (g.severity === 'significant') {
      recommendation = `Provide documentation for ${g.description} to strengthen the ${affectedCap} capability.`
      estimatedEffort = 'medium'
    } else {
      recommendation = `Consider adding ${g.description} to improve the ${affectedCap} assessment.`
      estimatedEffort = 'low'
    }

    return {
      gapId: g.gapId,
      category: g.category,
      description: g.description,
      severity: g.severity as 'critical' | 'significant' | 'minor',
      affectedCapability: affectedCap,
      recommendation,
      estimatedEffort,
    }
  })
}
