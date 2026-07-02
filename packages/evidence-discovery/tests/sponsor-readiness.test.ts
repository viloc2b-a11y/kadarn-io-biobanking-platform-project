// ==========================================================================
// Sponsor Readiness Engine — Tests (Sprint 21E)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { SponsorReadinessEngine } from '../src/sponsor-readiness/engine.js'
import type { SponsorReadinessInput } from '../src/sponsor-readiness/types.js'

function makeEngine(): SponsorReadinessEngine {
  return new SponsorReadinessEngine()
}

function healthyAssessment(): SponsorReadinessInput {
  return {
    assessment: [
      {
        capability_id: 'cap:plasma', capability_name: 'Plasma Collection', category: 'Biospecimen Processing',
        assessment_status: 'healthy', operational_maturity: 'advanced',
        research_assets_enabled: ['Plasma'], blocking_gaps: [], non_blocking_gaps: [],
        recommended_actions: ['No action required'], assessment_summary: 'Healthy.',
      },
      {
        capability_id: 'cap:serum', capability_name: 'Serum Extraction', category: 'Biospecimen Processing',
        assessment_status: 'healthy', operational_maturity: 'established',
        research_assets_enabled: ['Serum'], blocking_gaps: [], non_blocking_gaps: [],
        recommended_actions: ['No action required'], assessment_summary: 'Healthy.',
      },
      {
        capability_id: 'cap:clinical', capability_name: 'Clinical Operations', category: 'Clinical Operations',
        assessment_status: 'healthy', operational_maturity: 'established',
        research_assets_enabled: ['Clinical Dataset'], blocking_gaps: [], non_blocking_gaps: [],
        recommended_actions: ['No action required'], assessment_summary: 'Healthy.',
      },
    ],
    assessmentSummary: { healthy: 3, attention_needed: 0, limited: 0, blocked: 0, unknown: 0 },
  }
}

function blockedAssessment(): SponsorReadinessInput {
  return {
    assessment: [
      {
        capability_id: 'cap:plasma', capability_name: 'Plasma Collection', category: 'Biospecimen Processing',
        assessment_status: 'blocked', operational_maturity: 'developing',
        research_assets_enabled: ['Plasma'], blocking_gaps: ['SOP missing'],
        non_blocking_gaps: [], recommended_actions: ['Upload evidence'],
        assessment_summary: 'Blocked by SOP gap.',
      },
      {
        capability_id: 'cap:serum', capability_name: 'Serum Extraction', category: 'Biospecimen Processing',
        assessment_status: 'healthy', operational_maturity: 'established',
        research_assets_enabled: ['Serum'], blocking_gaps: [], non_blocking_gaps: [],
        recommended_actions: ['No action required'], assessment_summary: 'Healthy.',
      },
    ],
    assessmentSummary: { healthy: 1, attention_needed: 0, limited: 0, blocked: 1, unknown: 0 },
  }
}

function emptyAssessment(): SponsorReadinessInput {
  return { assessment: [], assessmentSummary: { healthy: 0, attention_needed: 0, limited: 0, blocked: 0, unknown: 0 } }
}

// --------------------------------------------------------------------------
// Presentation Ready
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — Presentation Ready', () => {
  it('mostly healthy institution → Presentation Ready', () => {
    const engine = makeEngine()
    const result = engine.build(healthyAssessment())
    expect(result.readiness_label).toBe('Presentation Ready')
    expect(result.strengths.length).toBeGreaterThan(0)
    expect(result.concerns.length).toBe(0)
  })
})

// --------------------------------------------------------------------------
// Needs Additional Evidence
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — Needs Additional Evidence', () => {
  it('institution with blocking gap → Needs Additional Evidence', () => {
    const engine = makeEngine()
    const result = engine.build(blockedAssessment())
    expect(result.readiness_label).toBe('Needs Additional Evidence')
    expect(result.blocking_items.length).toBeGreaterThan(0)
    expect(result.recommended_preparation).toContain('Upload evidence')
  })
})

// --------------------------------------------------------------------------
// Not Enough Evidence Yet
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — Not Enough Evidence Yet', () => {
  it('empty institution → Not Enough Evidence Yet', () => {
    const engine = makeEngine()
    const result = engine.build(emptyAssessment())
    expect(result.readiness_label).toBe('Not Enough Evidence Yet')
    expect(result.strengths).toHaveLength(0)
  })
})

// --------------------------------------------------------------------------
// Blocking gap handling
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — blocking gaps', () => {
  it('blocking items include capability name and gap description', () => {
    const engine = makeEngine()
    const result = engine.build(blockedAssessment())
    expect(result.blocking_items[0]).toContain('Plasma Collection')
    expect(result.blocking_items[0]).toContain('SOP missing')
  })
})

// --------------------------------------------------------------------------
// Strength generation
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — strength generation', () => {
  it('generates strengths from healthy capabilities', () => {
    const engine = makeEngine()
    const result = engine.build(healthyAssessment())
    expect(result.strengths).toContain('Strong evidence for biospecimen processing')
    expect(result.strengths).toContain('Established clinical operations')
  })

  it('empty assessment → no strengths', () => {
    const engine = makeEngine()
    const result = engine.build(emptyAssessment())
    expect(result.strengths).toHaveLength(0)
  })
})

// --------------------------------------------------------------------------
// Concern generation
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — concern generation', () => {
  it('blocking gaps generate critical concerns', () => {
    const engine = makeEngine()
    const result = engine.build(blockedAssessment())
    expect(result.concerns).toContain('Critical evidence gaps remain')
  })

  it('healthy assessment → no concerns', () => {
    const engine = makeEngine()
    const result = engine.build(healthyAssessment())
    expect(result.concerns).toHaveLength(0)
  })
})

// --------------------------------------------------------------------------
// Preparation generation
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — preparation generation', () => {
  it('blocked assessment recommends uploading evidence', () => {
    const engine = makeEngine()
    const result = engine.build(blockedAssessment())
    expect(result.recommended_preparation).toContain('Upload evidence')
  })

  it('healthy assessment recommends no action', () => {
    const engine = makeEngine()
    const result = engine.build(healthyAssessment())
    expect(result.recommended_preparation).toContain('No action required')
  })
})

// --------------------------------------------------------------------------
// Research asset propagation
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — research assets', () => {
  it('propagates research assets from assessment', () => {
    const engine = makeEngine()
    const result = engine.build(healthyAssessment())
    expect(result.relevant_research_assets).toContain('Plasma')
    expect(result.relevant_research_assets).toContain('Serum')
    expect(result.relevant_research_assets).toContain('Clinical Dataset')
  })
})

// --------------------------------------------------------------------------
// Assessment references
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — assessment references', () => {
  it('includes summary counts in references', () => {
    const engine = makeEngine()
    const result = engine.build(healthyAssessment())
    expect(result.assessment_references[0]).toContain('3 healthy')
  })
})

// --------------------------------------------------------------------------
// No confidence computation
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — no confidence', () => {
  it('output does not contain confidence', () => {
    const engine = makeEngine()
    const result = engine.build(healthyAssessment())
    const json = JSON.stringify(result)
    expect(json).not.toContain('"confidence"')
    expect(json).not.toContain('confidence_score')
  })
})

// --------------------------------------------------------------------------
// No forbidden terminology
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — no retired terminology', () => {
  it('never uses verified, certified, gold, silver, bronze, pass, fail', () => {
    const engine = makeEngine()
    const result = engine.build(healthyAssessment())
    const json = JSON.stringify(result).toLowerCase()
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('gold')
    expect(json).not.toContain('silver')
    expect(json).not.toContain('bronze')
    expect(json).not.toContain('"pass"')
    expect(json).not.toContain('"fail"')
  })
})

// --------------------------------------------------------------------------
// Structure contract
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — structure contract', () => {
  it('output has all required fields', () => {
    const engine = makeEngine()
    const result = engine.build(healthyAssessment())
    expect(result).toHaveProperty('readiness_label')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('strengths')
    expect(result).toHaveProperty('concerns')
    expect(result).toHaveProperty('blocking_items')
    expect(result).toHaveProperty('recommended_preparation')
    expect(result).toHaveProperty('relevant_research_assets')
    expect(result).toHaveProperty('capability_highlights')
    expect(result).toHaveProperty('assessment_references')
    expect(result).toHaveProperty('last_updated')
  })
})

// --------------------------------------------------------------------------
// Allowed labels only
// --------------------------------------------------------------------------

describe('SponsorReadinessEngine — allowed labels only', () => {
  const ALLOWED = new Set([
    'Presentation Ready',
    'Needs Additional Evidence',
    'Needs Human Review',
    'Not Enough Evidence Yet',
  ])

  it('readiness label is always one of the 4 allowed values', () => {
    const engine = makeEngine()
    for (const input of [healthyAssessment(), blockedAssessment(), emptyAssessment()]) {
      const result = engine.build(input)
      expect(ALLOWED.has(result.readiness_label)).toBe(true)
    }
  })
})
