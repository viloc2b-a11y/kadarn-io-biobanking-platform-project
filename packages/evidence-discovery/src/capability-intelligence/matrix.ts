// ==========================================================================
// Capability Intelligence — Capability Matrix (Sprint 21B / KTP-1.5A)
// ==========================================================================

import type { CapabilityIntelligenceInput } from './types'

export interface CapabilityMatrix {
  programTypeKey: string
  capabilities: CapabilityMatrixRow[]
  generatedAt: string
}

export interface CapabilityMatrixRow {
  capabilityId: string
  name: string
  category: string
  status: string
  evidenceCount: number
  gapCount: number
  researchAssetsEnabled: string[]
  interpretation: string
}

export function buildCapabilityMatrix(input: CapabilityIntelligenceInput): CapabilityMatrix {
  const gapMap = new Map<string, number>()
  for (const g of input.gaps) {
    gapMap.set(g.category, (gapMap.get(g.category) ?? 0) + 1)
  }

  const capabilities: CapabilityMatrixRow[] = input.candidateCapabilities.map((c) => {
    const gapCount = gapMap.get(c.category) ?? 0
    const evidenceCount = c.supportingEntityIds.length + c.supportingArtifactIds.length

    let interpretation = ''
    if (c.status === 'supported') interpretation = `Fully supported with ${evidenceCount} evidence item(s)`
    else if (c.status === 'partially_supported') interpretation = `Partially supported — ${gapCount} gap(s) remain`
    else if (c.status === 'needs_more_evidence') interpretation = `Requires additional evidence — ${gapCount} gap(s) identified`
    else if (c.status === 'needs_human_review') interpretation = 'Pending human review'
    else interpretation = 'No evidence detected'

    return {
      capabilityId: c.capabilityId,
      name: c.name,
      category: c.category,
      status: c.status,
      evidenceCount,
      gapCount,
      researchAssetsEnabled: [],
      interpretation,
    }
  })

  return {
    programTypeKey: 'institutional',
    capabilities,
    generatedAt: new Date().toISOString(),
  }
}
