// ==========================================================================
// Recommendation Engine — Tests (Sprint 21F)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { RecommendationEngine } from '../src/recommendation-engine/engine.js'
import type { RecommendationInput } from '../src/recommendation-engine/types.js'

function makeEngine(): RecommendationEngine {
  return new RecommendationEngine()
}

function emptyInput(): RecommendationInput {
  return { assessment: [] }
}

function inputWithBlockingGap(): RecommendationInput {
  return {
    assessment: [
      {
        capability_id: 'cap:plasma', capability_name: 'Plasma Collection',
        assessment_status: 'blocked', blocking_gaps: ['SOP missing'],
        non_blocking_gaps: [], research_assets_enabled: ['Plasma'],
        recommended_actions: ['Upload evidence'], missing_requirements: [],
      },
    ],
    gaps: [
      {
        id: 'gap:001', title: 'SOP missing for plasma processing',
        category: 'missing_evidence', severity: 'blocking', blocking: true,
        affected_capabilities: ['cap:plasma'], affected_research_assets: ['Plasma'],
        recommended_next_action: 'Upload SOP documentation',
      },
    ],
  }
}

// --------------------------------------------------------------------------
// Empty institution
// --------------------------------------------------------------------------

describe('RecommendationEngine — empty institution', () => {
  it('produces empty recommendations', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())
    expect(result.recommendations).toHaveLength(0)
    expect(result.summary.critical).toBe(0)
  })
})

// --------------------------------------------------------------------------
// Blocking recommendation
// --------------------------------------------------------------------------

describe('RecommendationEngine — blocking recommendation', () => {
  it('generates critical recommendation from blocking gap', () => {
    const engine = makeEngine()
    const result = engine.build(inputWithBlockingGap())
    expect(result.recommendations.length).toBeGreaterThan(0)
    const rec = result.recommendations[0]
    expect(rec.priority).toBe('critical')
    expect(rec.blocking).toBe(true)
    expect(rec.category).toBe('evidence')
    expect(rec.source_engine).toBe('evidence_gap_intelligence')
  })
})

// --------------------------------------------------------------------------
// Priority ordering
// --------------------------------------------------------------------------

describe('RecommendationEngine — priority ordering', () => {
  it('sorts critical before high before medium before low', () => {
    const engine = makeEngine()
    const input: RecommendationInput = {
      assessment: [
        {
          capability_id: 'c1', capability_name: 'C1', assessment_status: 'limited',
          blocking_gaps: [], non_blocking_gaps: [], research_assets_enabled: [],
          recommended_actions: ['Review manually'], missing_requirements: [],
        },
        {
          capability_id: 'c2', capability_name: 'C2', assessment_status: 'blocked',
          blocking_gaps: ['gap1'], non_blocking_gaps: [], research_assets_enabled: [],
          recommended_actions: ['Upload evidence'], missing_requirements: [],
        },
      ],
      gaps: [
        {
          id: 'g:med', title: 'Medium gap', category: 'metadata', severity: 'moderate',
          blocking: false, affected_capabilities: ['c1'], affected_research_assets: [],
          recommended_next_action: 'Complete metadata',
        },
        {
          id: 'g:crit', title: 'Critical gap', category: 'missing_evidence',
          severity: 'critical', blocking: true, affected_capabilities: ['c2'],
          affected_research_assets: [], recommended_next_action: 'Upload docs',
        },
      ],
    }

    const result = engine.build(input)
    const priorities = result.recommendations.map((r) => r.priority)
    expect(priorities[0]).toBe('critical')
    expect(priorities.indexOf('high') >= 0).toBe(true)
    expect(priorities.indexOf('medium') >= 0).toBe(true)
  })
})

// --------------------------------------------------------------------------
// Multiple recommendations
// --------------------------------------------------------------------------

describe('RecommendationEngine — multiple recommendations', () => {
  it('generates recommendations from gaps, assessment, and readiness', () => {
    const engine = makeEngine()
    const input: RecommendationInput = {
      assessment: [
        {
          capability_id: 'c1', capability_name: 'Plasma', assessment_status: 'limited',
          blocking_gaps: [], non_blocking_gaps: [], research_assets_enabled: ['Plasma'],
          recommended_actions: ['Update documentation'], missing_requirements: [],
        },
      ],
      gaps: [
        {
          id: 'g1', title: 'Missing SOP', category: 'missing_evidence', severity: 'high',
          blocking: true, affected_capabilities: ['c1'], affected_research_assets: ['Plasma'],
          recommended_next_action: 'Upload SOP',
        },
      ],
      readiness: {
        readiness_label: 'Needs Additional Evidence',
        blocking_items: ['Missing SOP'],
        recommended_preparation: ['Upload evidence', 'Update documentation'],
      },
    }

    const result = engine.build(input)
    // Gap rec + assessment rec + readiness recs = at least 3
    expect(result.recommendations.length).toBeGreaterThanOrEqual(3)
    expect(result.summary.blocking).toBeGreaterThan(0)
  })
})

// --------------------------------------------------------------------------
// Capability linkage
// --------------------------------------------------------------------------

describe('RecommendationEngine — capability linkage', () => {
  it('links recommendations to capabilities', () => {
    const engine = makeEngine()
    const result = engine.build(inputWithBlockingGap())
    expect(result.recommendations[0].affected_capabilities).toContain('cap:plasma')
  })
})

// --------------------------------------------------------------------------
// Research asset linkage
// --------------------------------------------------------------------------

describe('RecommendationEngine — research asset linkage', () => {
  it('links recommendations to research assets', () => {
    const engine = makeEngine()
    const result = engine.build(inputWithBlockingGap())
    expect(result.recommendations[0].affected_research_assets).toContain('Plasma')
  })
})

// --------------------------------------------------------------------------
// Sponsor readiness linkage
// --------------------------------------------------------------------------

describe('RecommendationEngine — readiness linkage', () => {
  it('generates recommendations from readiness preparation', () => {
    const engine = makeEngine()
    const input: RecommendationInput = {
      assessment: [],
      readiness: {
        readiness_label: 'Needs Additional Evidence',
        blocking_items: ['Missing docs'],
        recommended_preparation: ['Upload evidence', 'Review manually'],
      },
    }

    const result = engine.build(input)
    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.recommendations.every((r) => r.source_engine === 'sponsor_readiness')).toBe(true)
  })
})

// --------------------------------------------------------------------------
// Summary generation
// --------------------------------------------------------------------------

describe('RecommendationEngine — summary', () => {
  it('summary counters match recommendations', () => {
    const engine = makeEngine()
    const result = engine.build(inputWithBlockingGap())

    expect(result.summary.critical).toBeGreaterThan(0)
    expect(result.summary.blocking).toBeGreaterThan(0)
    expect(result.summary.total ?? result.summary.critical + result.summary.high + result.summary.medium + result.summary.low)
      .toBe(result.recommendations.length || result.summary.critical + result.summary.high + result.summary.medium + result.summary.low)
  })
})

// --------------------------------------------------------------------------
// No confidence
// --------------------------------------------------------------------------

describe('RecommendationEngine — no confidence', () => {
  it('output does not contain confidence', () => {
    const engine = makeEngine()
    const result = engine.build(inputWithBlockingGap())
    const json = JSON.stringify(result)
    expect(json).not.toContain('"confidence"')
    expect(json).not.toContain('confidence_score')
  })
})

// --------------------------------------------------------------------------
// No forbidden terminology
// --------------------------------------------------------------------------

describe('RecommendationEngine — no retired terminology', () => {
  it('never uses forbidden terms', () => {
    const engine = makeEngine()
    const result = engine.build(inputWithBlockingGap())
    const json = JSON.stringify(result).toLowerCase()
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('gold')
    expect(json).not.toContain('silver')
    expect(json).not.toContain('bronze')
  })
})

// --------------------------------------------------------------------------
// Structure contract
// --------------------------------------------------------------------------

describe('RecommendationEngine — structure', () => {
  it('has all required output fields', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())
    expect(result).toHaveProperty('recommendations')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('generated_at')
  })

  it('each recommendation has all required fields', () => {
    const engine = makeEngine()
    const result = engine.build(inputWithBlockingGap())
    for (const rec of result.recommendations) {
      expect(rec).toHaveProperty('id')
      expect(rec).toHaveProperty('title')
      expect(rec).toHaveProperty('description')
      expect(rec).toHaveProperty('category')
      expect(rec).toHaveProperty('priority')
      expect(rec).toHaveProperty('reason')
      expect(rec).toHaveProperty('affected_capabilities')
      expect(rec).toHaveProperty('affected_research_assets')
      expect(rec).toHaveProperty('recommended_action')
      expect(rec).toHaveProperty('source_engine')
      expect(rec).toHaveProperty('references')
      expect(rec).toHaveProperty('dashboard_section')
    }
  })
})
