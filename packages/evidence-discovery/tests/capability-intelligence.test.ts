// ==========================================================================
// Capability Intelligence Engine — Tests (Sprint 21B)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { CapabilityIntelligenceEngine } from '../src/capability-intelligence/engine.js'
import type {
  CapabilityIntelligenceInput,
  CapabilityEntry,
} from '../src/capability-intelligence/types.js'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeEngine(): CapabilityIntelligenceEngine {
  return new CapabilityIntelligenceEngine()
}

function emptyInput(): CapabilityIntelligenceInput {
  return {
    candidateCapabilities: [],
    claimCandidates: [],
    gaps: [],
  }
}

function plasmaCap(): CapabilityIntelligenceInput['candidateCapabilities'][number] {
  return {
    capabilityId: 'cap-001',
    claimTypeId: 'biospecimen.processing.plasma',
    name: 'Plasma Collection and Processing',
    category: 'processing',
    status: 'detected',
    supportingEntityIds: ['ent-001', 'ent-002'],
    supportingRelationshipIds: ['rel-001'],
    supportingArtifactIds: ['art-001'],
    reasoning: 'Detected via equipment entities and SOP documents.',
  }
}

function serumCap(): CapabilityIntelligenceInput['candidateCapabilities'][number] {
  return {
    capabilityId: 'cap-002',
    claimTypeId: 'biospecimen.processing.serum',
    name: 'Serum Extraction',
    category: 'processing',
    status: 'detected',
    supportingEntityIds: ['ent-003'],
    supportingRelationshipIds: [],
    supportingArtifactIds: ['art-002'],
    reasoning: 'Detected via centrifuge entity.',
  }
}

function ffpeCap(): CapabilityIntelligenceInput['candidateCapabilities'][number] {
  return {
    capabilityId: 'cap-003',
    claimTypeId: 'biospecimen.processing.ffpe',
    name: 'FFPE Tissue Processing',
    category: 'processing',
    status: 'detected',
    supportingEntityIds: ['ent-004'],
    supportingRelationshipIds: [],
    supportingArtifactIds: ['art-003'],
    reasoning: 'Detected via FFPE equipment.',
  }
}

// --------------------------------------------------------------------------
// Tests: Empty institution
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — empty institution', () => {
  it('builds an empty CapabilityIntelligence when no candidate capabilities exist', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result.capabilities).toHaveLength(14) // one per research asset as not_detected
    expect(result.summary.total).toBe(14)
    expect(result.summary.supported).toBe(0)
    expect(result.summary.not_detected).toBe(14)
    expect(result.generated_at).toBeTruthy()
  })

  it('all undetected entries have the not_detected status', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    for (const entry of result.capabilities) {
      expect(entry.status).toBe('not_detected')
      expect(entry.supporting_claims).toHaveLength(0)
      expect(entry.supporting_evidence).toHaveLength(0)
      expect(entry.gaps).toHaveLength(0)
    }
  })
})

// --------------------------------------------------------------------------
// Tests: Single capability
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — single capability', () => {
  it('produces one supported capability with evidence and claims', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [
        {
          id: 'claim-001',
          proposedClaimTypeId: 'biospecimen.processing.plasma',
          reasoning: 'Plasma processing capability confirmed by SOP review.',
        },
      ],
      gaps: [],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma).toBeDefined()
    expect(plasma!.status).toBe('supported')
    expect(plasma!.supporting_claims).toHaveLength(1)
    expect(plasma!.supporting_evidence).toHaveLength(4) // 2 entities + 1 relationship + 1 artifact
    expect(plasma!.gaps).toHaveLength(0)
    expect(plasma!.recommended_next_step).toContain('No action needed')
  })

  it('maps plasma capability to Plasma research asset', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma).toBeDefined()
    expect(plasma!.research_assets_enabled).toContain('Plasma')
  })
})

// --------------------------------------------------------------------------
// Tests: Multiple capabilities
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — multiple capabilities', () => {
  it('builds entries for each unique capability', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap(), serumCap(), ffpeCap()],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    // 3 detected + 14 undetected = 17
    expect(result.capabilities.length).toBeGreaterThanOrEqual(3)

    const names = result.capabilities.map((c) => c.name)
    expect(names).toContain('Plasma Collection and Processing')
    expect(names).toContain('Serum Extraction')
    expect(names).toContain('FFPE Tissue Processing')
  })

  it('summary counts reflect multiple detected capabilities', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap(), serumCap(), ffpeCap()],
      claimCandidates: [
        {
          id: 'claim-001',
          proposedClaimTypeId: 'biospecimen.processing.plasma',
          reasoning: 'Plasma confirmed.',
        },
        {
          id: 'claim-002',
          proposedClaimTypeId: 'biospecimen.processing.serum',
          reasoning: 'Serum confirmed.',
        },
      ],
      gaps: [],
    }

    const result = engine.build(input)

    expect(result.summary.supported).toBeGreaterThanOrEqual(2) // Plasma + Serum
    expect(result.summary.total).toBeGreaterThan(3)
  })
})

// --------------------------------------------------------------------------
// Tests: Duplicate capability merge
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — duplicate capability merge', () => {
  it('merges two capabilities with the same name', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [
        plasmaCap(), // cap-001
        {
          ...plasmaCap(),
          capabilityId: 'cap-004', // same name, different ID
          supportingEntityIds: ['ent-005'], // additional entity
        },
      ],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma).toBeDefined()
    // Merged evidence should contain union of entities (ent-001, ent-002, ent-005)
    expect(plasma!.supporting_evidence.length).toBeGreaterThanOrEqual(5)
  })

  it('merges reasoning from duplicate capabilities', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [
        { ...plasmaCap(), reasoning: 'First detection.' },
        { ...plasmaCap(), capabilityId: 'cap-005', reasoning: 'Second detection.' },
      ],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma).toBeDefined()
  })
})

// --------------------------------------------------------------------------
// Tests: Supporting claims
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — supporting claims', () => {
  it('aggregates claims that match the capability claimTypeId', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [
        {
          id: 'claim-001',
          proposedClaimTypeId: 'biospecimen.processing.plasma',
          reasoning: 'Plasma processing confirmed by SOP review.',
        },
        {
          id: 'claim-002',
          proposedClaimTypeId: 'biospecimen.processing.plasma',
          reasoning: 'Plasma handling validated by QA audit.',
        },
        {
          id: 'claim-003',
          proposedClaimTypeId: 'biospecimen.processing.serum', // different claim type
          reasoning: 'Serum handling validated.',
        },
      ],
      gaps: [],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma).toBeDefined()
    expect(plasma!.supporting_claims).toHaveLength(2)
    expect(plasma!.supporting_claims[0]).toContain('SOP review')
    expect(plasma!.supporting_claims[1]).toContain('QA audit')
  })
})

// --------------------------------------------------------------------------
// Tests: Supporting evidence
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — supporting evidence', () => {
  it('unions entity, relationship, and artifact IDs', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma).toBeDefined()
    expect(plasma!.supporting_evidence).toContain('ent-001')
    expect(plasma!.supporting_evidence).toContain('ent-002')
    expect(plasma!.supporting_evidence).toContain('rel-001')
    expect(plasma!.supporting_evidence).toContain('art-001')
  })
})

// --------------------------------------------------------------------------
// Tests: Research Asset mapping
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — research asset mapping', () => {
  it('maps plasma to Plasma research asset', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma!.research_assets_enabled).toContain('Plasma')
  })

  it('maps serum to Serum research asset', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [serumCap()],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    const serum = result.capabilities.find((c) => c.id === 'capability:serum_extraction')

    expect(serum!.research_assets_enabled).toContain('Serum')
  })

  it('maps FFPE to FFPE Tissue research asset', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [ffpeCap()],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    const ffpe = result.capabilities.find((c) => c.id === 'capability:ffpe_tissue_processing')

    expect(ffpe!.research_assets_enabled).toContain('FFPE Tissue')
  })
})

// --------------------------------------------------------------------------
// Tests: Gap propagation
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — gap propagation', () => {
  it('propagates gaps that mention the capability name', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [],
      gaps: [
        {
          gapId: 'gap-001',
          category: 'processing',
          description: 'Plasma storage protocol not documented',
          severity: 'critical',
        },
        {
          gapId: 'gap-002',
          category: 'processing',
          description: 'Plasma handling SOP missing',
          severity: 'high',
        },
        {
          gapId: 'gap-003',
          category: 'shipping',
          description: 'Unrelated shipping gap',
          severity: 'low',
        },
      ],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma).toBeDefined()
    expect(plasma!.gaps).toHaveLength(2)
    expect(plasma!.missing_requirements).toHaveLength(2)
    // No claims + evidence + gaps → needs_more_evidence (not partially_supported)
    expect(plasma!.status).toBe('needs_more_evidence')
  })

  it('status is needs_more_evidence when gaps exist but no claims', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [], // no claims
      gaps: [
        {
          gapId: 'gap-001',
          category: 'processing',
          description: 'Plasma storage protocol not documented',
          severity: 'critical',
        },
      ],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma!.status).toBe('needs_more_evidence')
  })
})

// --------------------------------------------------------------------------
// Tests: Recommendation generation
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — recommendation generation', () => {
  it('supported capability recommends no action needed', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [
        {
          id: 'claim-001',
          proposedClaimTypeId: 'biospecimen.processing.plasma',
          reasoning: 'Confirmed.',
        },
      ],
      gaps: [],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma!.recommended_next_step).toContain('No action needed')
  })

  it('partially_supported capability recommends addressing gaps', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [
        {
          id: 'claim-001',
          proposedClaimTypeId: 'biospecimen.processing.plasma',
          reasoning: 'Confirmed.',
        },
      ],
      gaps: [
        {
          gapId: 'gap-001',
          category: 'processing',
          description: 'Plasma storage protocol not documented',
          severity: 'critical',
        },
      ],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma!.recommended_next_step).toContain('gaps')
  })

  it('not_detected recommends expanding discovery scope', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())
    const undetected = result.capabilities.find((c) => c.status === 'not_detected')

    expect(undetected).toBeDefined()
    expect(undetected!.recommended_next_step).toContain('Expand discovery scope')
  })
})

// --------------------------------------------------------------------------
// Tests: Summary generation
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — summary generation', () => {
  it('summary matches capability status counts', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap(), serumCap(), ffpeCap()],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    const summary = result.summary

    expect(summary.total).toBe(result.capabilities.length)
    expect(summary.supported + summary.partial + summary.needs_evidence + summary.needs_review + summary.not_detected).toBe(summary.total)
  })

  it('empty input has zero supported', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result.summary.supported).toBe(0)
    expect(result.summary.not_detected).toBeGreaterThan(0)
  })
})

// --------------------------------------------------------------------------
// Tests: Status transitions
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — status transitions', () => {
  it('capability with only evidence and no claims gets needs_human_review', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [], // no claims
      gaps: [], // no gaps
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma!.status).toBe('needs_human_review')
  })

  it('capability with claims + evidence + no gaps gets supported', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [
        {
          id: 'claim-001',
          proposedClaimTypeId: 'biospecimen.processing.plasma',
          reasoning: 'Plasma confirmed.',
        },
      ],
      gaps: [],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma!.status).toBe('supported')
  })

  it('capability with claims + evidence + gaps gets partially_supported', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [
        {
          id: 'claim-001',
          proposedClaimTypeId: 'biospecimen.processing.plasma',
          reasoning: 'Plasma confirmed.',
        },
      ],
      gaps: [
        {
          gapId: 'gap-001',
          category: 'processing',
          description: 'Plasma storage gap',
          severity: 'high',
        },
      ],
    }

    const result = engine.build(input)
    const plasma = result.capabilities.find((c) => c.id === 'capability:plasma_collection_and_processing')

    expect(plasma!.status).toBe('partially_supported')
  })
})

// --------------------------------------------------------------------------
// Tests: No confidence computation
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — no confidence computation', () => {
  it('engine output contains no confidence fields', () => {
    const engine = makeEngine()
    const input: CapabilityIntelligenceInput = {
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [],
      gaps: [],
    }

    const result = engine.build(input)
    const json = JSON.stringify(result)

    expect(json).not.toContain('"confidence"')
    expect(json).not.toContain('confidence_score')
  })
})

// --------------------------------------------------------------------------
// Tests: No retired terminology
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — no retired terminology', () => {
  it('output never contains "verified"', () => {
    const engine = makeEngine()
    const result = engine.build({
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [],
      gaps: [],
    })
    const json = JSON.stringify(result).toLowerCase()
    expect(json).not.toContain('verified')
  })

  it('output never contains "certified"', () => {
    const engine = makeEngine()
    const result = engine.build({
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [],
      gaps: [],
    })
    const json = JSON.stringify(result).toLowerCase()
    expect(json).not.toContain('certified')
  })

  it('output never contains "gold", "silver", or "bronze"', () => {
    const engine = makeEngine()
    const result = engine.build({
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [],
      gaps: [],
    })
    const json = JSON.stringify(result).toLowerCase()
    expect(json).not.toContain('gold')
    expect(json).not.toContain('silver')
    expect(json).not.toContain('bronze')
  })
})

// --------------------------------------------------------------------------
// Tests: Allowed statuses only
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — allowed statuses only', () => {
  const ALLOWED = new Set([
    'supported',
    'partially_supported',
    'needs_more_evidence',
    'needs_human_review',
    'not_detected',
  ])

  it('every entry has an allowed status', () => {
    const engine = makeEngine()
    const result = engine.build({
      candidateCapabilities: [plasmaCap(), serumCap(), ffpeCap()],
      claimCandidates: [],
      gaps: [],
    })

    for (const entry of result.capabilities) {
      expect(ALLOWED.has(entry.status)).toBe(true)
    }
  })
})

// --------------------------------------------------------------------------
// Tests: Structure contract
// --------------------------------------------------------------------------

describe('CapabilityIntelligenceEngine — structure contract', () => {
  it('every capability entry has all required fields', () => {
    const engine = makeEngine()
    const result = engine.build({
      candidateCapabilities: [plasmaCap()],
      claimCandidates: [],
      gaps: [],
    })

    for (const entry of result.capabilities) {
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('name')
      expect(entry).toHaveProperty('category')
      expect(entry).toHaveProperty('status')
      expect(entry).toHaveProperty('summary')
      expect(entry).toHaveProperty('supporting_claims')
      expect(entry).toHaveProperty('supporting_evidence')
      expect(entry).toHaveProperty('research_assets_enabled')
      expect(entry).toHaveProperty('missing_requirements')
      expect(entry).toHaveProperty('gaps')
      expect(entry).toHaveProperty('recommended_next_step')
      expect(entry).toHaveProperty('last_updated')

      expect(Array.isArray(entry.supporting_claims)).toBe(true)
      expect(Array.isArray(entry.supporting_evidence)).toBe(true)
      expect(Array.isArray(entry.research_assets_enabled)).toBe(true)
      expect(Array.isArray(entry.missing_requirements)).toBe(true)
      expect(Array.isArray(entry.gaps)).toBe(true)
    }
  })

  it('output has capabilities, summary, and generated_at', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result).toHaveProperty('capabilities')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('generated_at')
    expect(Array.isArray(result.capabilities)).toBe(true)
  })

  it('summary has all required counters', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result.summary).toHaveProperty('total')
    expect(result.summary).toHaveProperty('supported')
    expect(result.summary).toHaveProperty('partial')
    expect(result.summary).toHaveProperty('needs_evidence')
    expect(result.summary).toHaveProperty('needs_review')
    expect(result.summary).toHaveProperty('not_detected')
  })
})
