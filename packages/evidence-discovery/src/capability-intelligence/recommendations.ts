// ==========================================================================
// Capability Intelligence — Improvement Recommendations (KTP-1.5A)
// ==========================================================================

import type { CapabilityIntelligenceInput } from './types'

export interface ImprovementRecommendation {
  id: string
  priority: 1 | 2 | 3
  action: string
  capabilityTarget: string
  evidenceClass: string
  expectedImpact: string
  estimatedEffort: 'low' | 'medium' | 'high'
  relatedGaps: string[]
}

let recCounter = 0

export function generateRecommendations(
  input: CapabilityIntelligenceInput
): ImprovementRecommendation[] {
  const recs: ImprovementRecommendation[] = []

  // Build capability name map
  const capNameMap = new Map<string, string>()
  for (const c of input.candidateCapabilities) {
    capNameMap.set(c.category, c.name)
  }

  // Generate recommendations from gaps
  for (const gap of input.gaps) {
    recCounter++
    const capName = capNameMap.get(gap.category) ?? gap.category

    let priority: 1 | 2 | 3 = 3
    let estimatedEffort: 'low' | 'medium' | 'high' = 'low'
    let evidenceClass = 'C'
    let expectedImpact = ''

    if (gap.severity === 'critical') {
      priority = 1
      estimatedEffort = 'high'
      evidenceClass = 'A'
      expectedImpact = `Resolving this gap would enable ${capName} to reach supported status`
    } else if (gap.severity === 'significant') {
      priority = 2
      estimatedEffort = 'medium'
      evidenceClass = 'B'
      expectedImpact = `Addressing this would strengthen the ${capName} capability assessment`
    } else {
      priority = 3
      estimatedEffort = 'low'
      evidenceClass = 'C'
      expectedImpact = `This improvement would enhance the overall ${capName} evaluation`
    }

    const action =
      gap.severity === 'critical'
        ? `Submit Class ${evidenceClass} evidence for ${capName}: ${gap.description}`
        : gap.severity === 'significant'
          ? `Provide documentation addressing: ${gap.description}`
          : `Consider adding evidence for: ${gap.description}`

    recs.push({
      id: `rec-${String(recCounter).padStart(3, '0')}`,
      priority,
      action,
      capabilityTarget: capName,
      evidenceClass,
      expectedImpact,
      estimatedEffort,
      relatedGaps: [gap.gapId],
    })
  }

  // Sort by priority (1 highest)
  recs.sort((a, b) => a.priority - b.priority)

  return recs
}
