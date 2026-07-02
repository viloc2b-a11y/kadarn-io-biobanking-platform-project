// ==========================================================================
// Evidence Gap Intelligence Engine — Tests (Sprint 21C)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { EvidenceGapIntelligenceEngine } from '../src/evidence-gap-intelligence/engine.js'
import type { GapIntelligenceInput } from '../src/evidence-gap-intelligence/types.js'

function makeEngine(): EvidenceGapIntelligenceEngine {
  return new EvidenceGapIntelligenceEngine()
}

function emptyInput(): GapIntelligenceInput {
  return { discoveryGaps: [] }
}

// --------------------------------------------------------------------------
// Tests: Empty gaps
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — empty gaps', () => {
  it('produces empty gaps array and zero summary', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result.gaps).toHaveLength(0)
    expect(result.summary.total).toBe(0)
    expect(result.summary.blocking).toBe(0)
    expect(result.summary.high).toBe(0)
    expect(result.generated_at).toBeTruthy()
  })
})

// --------------------------------------------------------------------------
// Tests: Missing evidence gap
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — missing evidence', () => {
  it('categorizes missing evidence gaps correctly', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        {
          gapId: 'gap-001',
          category: 'evidence',
          description: 'Plasma storage protocol not found',
          severity: 'critical',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.gaps).toHaveLength(1)
    expect(result.gaps[0].category).toBe('missing_evidence')
    expect(result.gaps[0].severity).toBe('blocking')
    expect(result.gaps[0].blocking).toBe(true)
  })

  it('suggests evidence for missing documentation', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        {
          gapId: 'gap-002',
          category: 'document',
          description: 'SOP document missing for PBMC processing',
          severity: 'high',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.gaps[0].evidence_needed.length).toBeGreaterThan(0)
    expect(result.gaps[0].evidence_needed.some((e) => e.includes('SOP'))).toBe(true)
  })
})

// --------------------------------------------------------------------------
// Tests: Expired evidence gap
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — expired evidence', () => {
  it('categorizes expired evidence gaps', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        {
          gapId: 'gap-003',
          category: 'document',
          description: 'Calibration certificate is expired and needs renewal',
          severity: 'moderate',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.gaps[0].category).toBe('expired_evidence')
    expect(result.gaps[0].severity).toBe('moderate')
    expect(result.gaps[0].blocking).toBe(false)
  })
})

// --------------------------------------------------------------------------
// Tests: Inconsistent evidence gap
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — inconsistent evidence', () => {
  it('categorizes inconsistent evidence gaps', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        {
          gapId: 'gap-004',
          category: 'evidence',
          description: 'Data discrepancy between study protocol and reported results',
          severity: 'high',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.gaps[0].category).toBe('inconsistent_evidence')
    expect(result.gaps[0].blocking).toBe(true) // high + not insufficient_metadata
  })
})

// --------------------------------------------------------------------------
// Tests: External confirmation gap
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — external confirmation', () => {
  it('categorizes external confirmation gaps', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        {
          gapId: 'gap-005',
          category: 'review',
          description: 'Third-party verification needed for assay validation',
          severity: 'moderate',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.gaps[0].category).toBe('needs_external_confirmation')
  })
})

// --------------------------------------------------------------------------
// Tests: Capability association
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — capability association', () => {
  it('cross-references gaps with capabilities by keyword', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        {
          gapId: 'gap-006',
          category: 'processing',
          description: 'Plasma storage protocol not documented',
          severity: 'critical',
        },
      ],
      capabilities: [
        {
          id: 'capability:plasma_collection_and_processing',
          name: 'Plasma Collection and Processing',
          status: 'supported',
          research_assets_enabled: ['Plasma'],
          gaps: [],
          missing_requirements: [],
          recommended_next_step: 'No action needed',
        },
        {
          id: 'capability:serum_extraction',
          name: 'Serum Extraction',
          status: 'supported',
          research_assets_enabled: ['Serum'],
          gaps: [],
          missing_requirements: [],
          recommended_next_step: 'No action needed',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.gaps[0].affected_capabilities).toContain('capability:plasma_collection_and_processing')
    expect(result.gaps[0].affected_capabilities).not.toContain('capability:serum_extraction')
  })

  it('finds affected research assets from capabilities', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        {
          gapId: 'gap-007',
          category: 'processing',
          description: 'Plasma handling SOP missing',
          severity: 'high',
        },
      ],
      capabilities: [
        {
          id: 'capability:plasma_collection_and_processing',
          name: 'Plasma Collection and Processing',
          status: 'supported',
          research_assets_enabled: ['Plasma'],
          gaps: [],
          missing_requirements: [],
          recommended_next_step: 'No action needed',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.gaps[0].affected_research_assets).toContain('Plasma')
  })
})

// --------------------------------------------------------------------------
// Tests: Severity assignment
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — severity assignment', () => {
  it('maps critical to blocking', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Missing critical SOP', severity: 'critical' },
      ],
    }
    const result = engine.build(input)
    expect(result.gaps[0].severity).toBe('blocking')
  })

  it('maps high to high', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'High priority gap', severity: 'high' },
      ],
    }
    const result = engine.build(input)
    expect(result.gaps[0].severity).toBe('high')
  })

  it('maps moderate to moderate', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Moderate gap', severity: 'moderate' },
      ],
    }
    const result = engine.build(input)
    expect(result.gaps[0].severity).toBe('moderate')
  })

  it('maps unknown to low', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Minor gap', severity: 'unknown' },
      ],
    }
    const result = engine.build(input)
    expect(result.gaps[0].severity).toBe('low')
  })
})

// --------------------------------------------------------------------------
// Tests: Blocking assignment
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — blocking assignment', () => {
  it('blocking severity is always blocking', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Critical gap', severity: 'critical' },
      ],
    }
    const result = engine.build(input)
    expect(result.gaps[0].blocking).toBe(true)
  })

  it('high severity with non-metadata category is blocking', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Missing evidence gap', severity: 'high' },
      ],
    }
    const result = engine.build(input)
    expect(result.gaps[0].blocking).toBe(true)
  })

  it('moderate severity is not blocking', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Moderate gap', severity: 'moderate' },
      ],
    }
    const result = engine.build(input)
    expect(result.gaps[0].blocking).toBe(false)
  })
})

// --------------------------------------------------------------------------
// Tests: Summary counts
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — summary counts', () => {
  it('counts gaps by severity correctly', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Critical missing SOP', severity: 'critical' },
        { gapId: 'g2', category: 'doc', description: 'High priority missing doc', severity: 'high' },
        { gapId: 'g3', category: 'ev', description: 'Moderate gap', severity: 'moderate' },
        { gapId: 'g4', category: 'meta', description: 'Low priority metadata gap', severity: 'low' },
      ],
      hasValidationNotes: true,
    }

    const result = engine.build(input)

    expect(result.summary.total).toBe(4)
    expect(result.summary.blocking).toBe(2) // critical + high
    expect(result.summary.high).toBe(2) // critical + high
    expect(result.summary.needs_review).toBe(4) // all 4 have validation notes
    expect(result.summary.resolved).toBe(0)
  })

  it('summary totals match gaps array length', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Gap A', severity: 'critical' },
        { gapId: 'g2', category: 'ev', description: 'Gap B', severity: 'moderate' },
      ],
    }

    const result = engine.build(input)
    expect(result.summary.total).toBe(result.gaps.length)
  })
})

// --------------------------------------------------------------------------
// Tests: Recommended next action
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — recommended next action', () => {
  it('generates priority action for blocking gaps', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Critical SOP missing for plasma', severity: 'critical' },
      ],
    }

    const result = engine.build(input)
    expect(result.gaps[0].recommended_next_action).toContain('Priority action')
  })

  it('generates recommended action for non-blocking gaps', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Minor metadata issue', severity: 'low' },
      ],
    }

    const result = engine.build(input)
    expect(result.gaps[0].recommended_next_action).toContain('Recommended')
  })
})

// --------------------------------------------------------------------------
// Tests: Structure contract
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — structure contract', () => {
  it('every gap entry has all required fields', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Test gap', severity: 'critical' },
      ],
    }

    const result = engine.build(input)
    for (const gap of result.gaps) {
      expect(gap).toHaveProperty('id')
      expect(gap).toHaveProperty('title')
      expect(gap).toHaveProperty('category')
      expect(gap).toHaveProperty('severity')
      expect(gap).toHaveProperty('blocking')
      expect(gap).toHaveProperty('affected_capabilities')
      expect(gap).toHaveProperty('affected_research_assets')
      expect(gap).toHaveProperty('evidence_needed')
      expect(gap).toHaveProperty('recommended_next_action')
      expect(gap).toHaveProperty('review_status')
      expect(gap).toHaveProperty('source_refs')
      expect(gap).toHaveProperty('last_updated')

      expect(Array.isArray(gap.affected_capabilities)).toBe(true)
      expect(Array.isArray(gap.affected_research_assets)).toBe(true)
      expect(Array.isArray(gap.evidence_needed)).toBe(true)
      expect(Array.isArray(gap.source_refs)).toBe(true)
    }
  })

  it('output has gaps, summary, and generated_at', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result).toHaveProperty('gaps')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('generated_at')
    expect(Array.isArray(result.gaps)).toBe(true)
  })

  it('summary has all required counters', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result.summary).toHaveProperty('total')
    expect(result.summary).toHaveProperty('blocking')
    expect(result.summary).toHaveProperty('high')
    expect(result.summary).toHaveProperty('needs_review')
    expect(result.summary).toHaveProperty('resolved')
  })
})

// --------------------------------------------------------------------------
// Tests: Allowed categories only
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — allowed categories only', () => {
  const ALLOWED_CATEGORIES = new Set([
    'missing_evidence',
    'weak_evidence',
    'expired_evidence',
    'inconsistent_evidence',
    'needs_external_confirmation',
    'needs_human_review',
    'insufficient_metadata',
    'governance_gap',
    'operational_gap',
  ])

  const ALLOWED_SEVERITIES = new Set(['low', 'moderate', 'high', 'blocking'])
  const ALLOWED_REVIEW = new Set(['open', 'needs_review', 'deferred', 'resolved'])

  it('every gap has an allowed category', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Missing evidence', severity: 'critical' },
        { gapId: 'g2', category: 'doc', description: 'Weak documentation', severity: 'moderate' },
        { gapId: 'g3', category: 'ev', description: 'Expired certificate', severity: 'high' },
      ],
    }

    const result = engine.build(input)
    for (const gap of result.gaps) {
      expect(ALLOWED_CATEGORIES.has(gap.category)).toBe(true)
      expect(ALLOWED_SEVERITIES.has(gap.severity)).toBe(true)
      expect(ALLOWED_REVIEW.has(gap.review_status)).toBe(true)
    }
  })
})

// --------------------------------------------------------------------------
// Tests: No forbidden language
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — no forbidden language', () => {
  it('output never contains verified or certified', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Missing SOP', severity: 'critical' },
      ],
    }

    const result = engine.build(input)
    const json = JSON.stringify(result).toLowerCase()
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('gold')
    expect(json).not.toContain('silver')
    expect(json).not.toContain('bronze')
    expect(json).not.toContain('"confidence"')
    expect(json).not.toContain('confidence_score')
  })
})

// --------------------------------------------------------------------------
// Tests: Review status
// --------------------------------------------------------------------------

describe('EvidenceGapIntelligenceEngine — review status', () => {
  it('blocking gaps are open', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Critical gap', severity: 'critical' },
      ],
    }
    const result = engine.build(input)
    expect(result.gaps[0].review_status).toBe('open')
  })

  it('gaps with validation notes are needs_review', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'ev', description: 'Moderate gap', severity: 'moderate' },
      ],
      hasValidationNotes: true,
    }
    const result = engine.build(input)
    expect(result.gaps[0].review_status).toBe('needs_review')
  })

  it('low severity gaps without validation are deferred', () => {
    const engine = makeEngine()
    const input: GapIntelligenceInput = {
      discoveryGaps: [
        { gapId: 'g1', category: 'meta', description: 'Low priority gap', severity: 'low' },
      ],
    }
    const result = engine.build(input)
    expect(result.gaps[0].review_status).toBe('deferred')
  })
})
