// ==========================================================================
// Institutional Capability Assessment Engine — Tests (Sprint 21D)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { InstitutionalCapabilityAssessmentEngine } from '../src/institutional-capability-assessment/engine.js'
import type { AssessmentInput } from '../src/institutional-capability-assessment/types.js'

function makeEngine(): InstitutionalCapabilityAssessmentEngine {
  return new InstitutionalCapabilityAssessmentEngine()
}

function emptyInput(): AssessmentInput {
  return { capabilities: [] }
}

function healthyCap(): AssessmentInput['capabilities'][number] {
  return {
    id: 'capability:plasma_collection_and_processing',
    name: 'Plasma Collection and Processing',
    category: 'Biospecimen Processing',
    status: 'supported',
    summary: 'Plasma processing supported by evidence.',
    supporting_claims: ['SOP review confirmed plasma processing.', 'QA audit validated.'],
    supporting_evidence: ['ent-001', 'ent-002', 'art-001'],
    research_assets_enabled: ['Plasma', 'Serum'],
    missing_requirements: [],
    gaps: [],
    recommended_next_step: 'No action needed',
  }
}

function limitedCap(): AssessmentInput['capabilities'][number] {
  return {
    id: 'capability:ffpe_tissue_processing',
    name: 'FFPE Tissue Processing',
    category: 'Biospecimen Processing',
    status: 'needs_more_evidence',
    summary: 'FFPE needs more evidence.',
    supporting_claims: [],
    supporting_evidence: ['ent-004'],
    research_assets_enabled: ['FFPE Tissue'],
    missing_requirements: ['FFPE storage protocol missing'],
    gaps: ['FFPE handling gap'],
    recommended_next_step: 'Upload evidence',
  }
}

// --------------------------------------------------------------------------
// Empty institution
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — empty institution', () => {
  it('produces empty assessment and zero summary', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result.assessment).toHaveLength(0)
    expect(result.summary.healthy).toBe(0)
    expect(result.summary.blocked).toBe(0)
    expect(result.generated_at).toBeTruthy()
  })
})

// --------------------------------------------------------------------------
// Healthy capability
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — healthy capability', () => {
  it('assesses a fully supported capability as healthy', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })

    expect(result.assessment).toHaveLength(1)
    expect(result.assessment[0].assessment_status).toBe('healthy')
    expect(result.assessment[0].operational_maturity).toBe('advanced')
    expect(result.assessment[0].dashboard_priority).toBe('normal')
    expect(result.assessment[0].recommended_actions).toContain('No action required')
  })

  it('summary reflects healthy count', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })

    expect(result.summary.healthy).toBe(1)
    expect(result.summary.blocked).toBe(0)
  })
})

// --------------------------------------------------------------------------
// Capability with blocking gaps
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — blocked capability', () => {
  it('assesses a capability with blocking gaps as blocked', () => {
    const engine = makeEngine()
    const input: AssessmentInput = {
      capabilities: [healthyCap()],
      gaps: [
        {
          id: 'gap:plasma_storage',
          title: 'Plasma storage protocol missing',
          category: 'missing_evidence',
          severity: 'blocking',
          blocking: true,
          affected_capabilities: ['capability:plasma_collection_and_processing'],
          affected_research_assets: ['Plasma'],
          evidence_needed: ['SOP document'],
          recommended_next_action: 'Upload SOP',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.assessment[0].assessment_status).toBe('blocked')
    expect(result.assessment[0].dashboard_priority).toBe('critical')
    expect(result.assessment[0].recommended_actions).toContain('Upload evidence')
  })
})

// --------------------------------------------------------------------------
// Capability with multiple gaps
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — capability with multiple gaps', () => {
  it('separates blocking and non-blocking gaps', () => {
    const engine = makeEngine()
    const input: AssessmentInput = {
      capabilities: [healthyCap()],
      gaps: [
        {
          id: 'gap:blocking',
          title: 'Critical SOP missing',
          category: 'missing_evidence',
          severity: 'blocking',
          blocking: true,
          affected_capabilities: ['capability:plasma_collection_and_processing'],
          affected_research_assets: ['Plasma'],
          evidence_needed: ['SOP'],
          recommended_next_action: 'Upload SOP',
        },
        {
          id: 'gap:nonblocking',
          title: 'Metadata incomplete',
          category: 'insufficient_metadata',
          severity: 'moderate',
          blocking: false,
          affected_capabilities: ['capability:plasma_collection_and_processing'],
          affected_research_assets: ['Plasma'],
          evidence_needed: ['Metadata'],
          recommended_next_action: 'Complete metadata',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.assessment[0].blocking_gaps).toHaveLength(1)
    expect(result.assessment[0].non_blocking_gaps).toHaveLength(1)
    expect(result.assessment[0].blocking_gaps[0]).toBe('Critical SOP missing')
  })
})

// --------------------------------------------------------------------------
// Capability enabling research assets
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — research assets', () => {
  it('preserves research_assets_enabled from capability intelligence', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })

    expect(result.assessment[0].research_assets_enabled).toContain('Plasma')
  })
})

// --------------------------------------------------------------------------
// Assessment summary generation
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — assessment summary', () => {
  it('generates human-readable summary for healthy capability', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })

    expect(result.assessment[0].assessment_summary).toContain('operating with sufficient evidence')
    expect(result.assessment[0].assessment_summary).toContain('Advanced maturity')
    expect(result.assessment[0].assessment_summary).toContain('2 research asset')
  })

  it('generates summary mentioning blocking gaps', () => {
    const engine = makeEngine()
    const input: AssessmentInput = {
      capabilities: [healthyCap()],
      gaps: [
        {
          id: 'gap:block',
          title: 'SOP missing',
          category: 'missing_evidence',
          severity: 'blocking',
          blocking: true,
          affected_capabilities: ['capability:plasma_collection_and_processing'],
          affected_research_assets: [],
          evidence_needed: [],
          recommended_next_action: '',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.assessment[0].assessment_summary).toContain('1 blocking gap')
  })
})

// --------------------------------------------------------------------------
// Operational maturity assignment
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — operational maturity', () => {
  it('healthy with strong evidence → advanced', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })
    expect(result.assessment[0].operational_maturity).toBe('advanced')
  })

  it('limited capability → developing', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [limitedCap()] })
    expect(result.assessment[0].operational_maturity).toBe('developing')
  })

  it('unknown capability → emerging', () => {
    const engine = makeEngine()
    const input: AssessmentInput = {
      capabilities: [
        {
          ...healthyCap(),
          id: 'capability:unknown',
          name: 'Unknown Capability',
          status: 'not_detected',
          supporting_claims: [],
          supporting_evidence: [],
          research_assets_enabled: [],
          missing_requirements: [],
          gaps: [],
        },
      ],
    }

    const result = engine.build(input)
    expect(result.assessment[0].operational_maturity).toBe('emerging')
  })
})

// --------------------------------------------------------------------------
// Dashboard priority assignment
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — dashboard priority', () => {
  it('blocked → critical', () => {
    const engine = makeEngine()
    const input: AssessmentInput = {
      capabilities: [healthyCap()],
      gaps: [
        {
          id: 'g1', title: 'Gap', category: 'missing_evidence', severity: 'blocking',
          blocking: true, affected_capabilities: ['capability:plasma_collection_and_processing'],
          affected_research_assets: [], evidence_needed: [], recommended_next_action: '',
        },
      ],
    }
    const result = engine.build(input)
    expect(result.assessment[0].dashboard_priority).toBe('critical')
  })

  it('healthy → normal', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })
    expect(result.assessment[0].dashboard_priority).toBe('normal')
  })

  it('limited → high', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [limitedCap()] })
    expect(result.assessment[0].dashboard_priority).toBe('high')
  })
})

// --------------------------------------------------------------------------
// Future sponsor relevance
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — sponsor relevance', () => {
  it('healthy biospecimen → high', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })
    expect(result.assessment[0].future_sponsor_relevance).toBe('high')
  })

  it('limited biospecimen → medium', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [limitedCap()] })
    expect(result.assessment[0].future_sponsor_relevance).toBe('medium')
  })

  it('unknown → unknown', () => {
    const engine = makeEngine()
    const input: AssessmentInput = {
      capabilities: [{ ...healthyCap(), id: 'c:u', name: 'U', status: 'not_detected', supporting_claims: [], supporting_evidence: [], research_assets_enabled: [] }],
    }
    const result = engine.build(input)
    expect(result.assessment[0].future_sponsor_relevance).toBe('unknown')
  })
})

// --------------------------------------------------------------------------
// Recommended actions
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — recommended actions', () => {
  it('healthy with no gaps → No action required', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })
    expect(result.assessment[0].recommended_actions).toEqual(['No action required'])
  })

  it('blocked → Upload evidence', () => {
    const engine = makeEngine()
    const input: AssessmentInput = {
      capabilities: [healthyCap()],
      gaps: [
        {
          id: 'g1', title: 'Gap', category: 'missing_evidence', severity: 'blocking',
          blocking: true, affected_capabilities: ['capability:plasma_collection_and_processing'],
          affected_research_assets: [], evidence_needed: [], recommended_next_action: '',
        },
      ],
    }
    const result = engine.build(input)
    expect(result.assessment[0].recommended_actions).toContain('Upload evidence')
  })

  it('limited → Review manually', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [limitedCap()] })
    expect(result.assessment[0].recommended_actions).toContain('Review manually')
  })
})

// --------------------------------------------------------------------------
// Unknown capability
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — unknown capability', () => {
  it('not_detected capability → unknown assessment', () => {
    const engine = makeEngine()
    const input: AssessmentInput = {
      capabilities: [
        {
          id: 'capability:not_found',
          name: 'Not Found',
          category: 'Research Operations',
          status: 'not_detected',
          summary: 'Not detected.',
          supporting_claims: [],
          supporting_evidence: [],
          research_assets_enabled: [],
          missing_requirements: [],
          gaps: [],
          recommended_next_step: 'Expand discovery scope',
        },
      ],
    }

    const result = engine.build(input)
    expect(result.assessment[0].assessment_status).toBe('unknown')
    expect(result.assessment[0].operational_maturity).toBe('emerging')
    expect(result.assessment[0].dashboard_priority).toBe('informational')
  })
})

// --------------------------------------------------------------------------
// No confidence computation
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — no confidence', () => {
  it('output does not contain confidence fields', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })
    const json = JSON.stringify(result)
    expect(json).not.toContain('"confidence"')
    expect(json).not.toContain('confidence_score')
    expect(json).not.toContain('"score"')
  })
})

// --------------------------------------------------------------------------
// No retired terminology
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — no retired terminology', () => {
  it('output never contains forbidden terms', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })
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

describe('InstitutionalCapabilityAssessmentEngine — structure contract', () => {
  it('every entry has all required fields', () => {
    const engine = makeEngine()
    const result = engine.build({ capabilities: [healthyCap()] })

    for (const entry of result.assessment) {
      expect(entry).toHaveProperty('capability_id')
      expect(entry).toHaveProperty('capability_name')
      expect(entry).toHaveProperty('category')
      expect(entry).toHaveProperty('assessment_status')
      expect(entry).toHaveProperty('operational_maturity')
      expect(entry).toHaveProperty('assessment_summary')
      expect(entry).toHaveProperty('research_assets_enabled')
      expect(entry).toHaveProperty('blocking_gaps')
      expect(entry).toHaveProperty('non_blocking_gaps')
      expect(entry).toHaveProperty('missing_requirements')
      expect(entry).toHaveProperty('recommended_actions')
      expect(entry).toHaveProperty('dashboard_priority')
      expect(entry).toHaveProperty('future_sponsor_relevance')
      expect(entry).toHaveProperty('last_updated')
    }
  })

  it('output has assessment, summary, and generated_at', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result).toHaveProperty('assessment')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('generated_at')
    expect(Array.isArray(result.assessment)).toBe(true)
  })

  it('summary has all required counters', () => {
    const engine = makeEngine()
    const result = engine.build(emptyInput())

    expect(result.summary).toHaveProperty('healthy')
    expect(result.summary).toHaveProperty('attention_needed')
    expect(result.summary).toHaveProperty('limited')
    expect(result.summary).toHaveProperty('blocked')
    expect(result.summary).toHaveProperty('unknown')
  })
})

// --------------------------------------------------------------------------
// Allowed values only
// --------------------------------------------------------------------------

describe('InstitutionalCapabilityAssessmentEngine — allowed values only', () => {
  const ALLOWED_STATUS = new Set(['healthy', 'attention_needed', 'limited', 'blocked', 'unknown'])
  const ALLOWED_MATURITY = new Set(['emerging', 'developing', 'established', 'advanced'])
  const ALLOWED_PRIORITY = new Set(['critical', 'high', 'normal', 'informational'])
  const ALLOWED_RELEVANCE = new Set(['high', 'medium', 'low', 'unknown'])

  it('all entries use allowed values', () => {
    const engine = makeEngine()
    const result = engine.build({
      capabilities: [healthyCap(), limitedCap()],
      gaps: [
        {
          id: 'g1', title: 'Blocking', category: 'missing', severity: 'blocking',
          blocking: true, affected_capabilities: ['capability:plasma_collection_and_processing'],
          affected_research_assets: [], evidence_needed: [], recommended_next_action: '',
        },
      ],
    })

    for (const entry of result.assessment) {
      expect(ALLOWED_STATUS.has(entry.assessment_status)).toBe(true)
      expect(ALLOWED_MATURITY.has(entry.operational_maturity)).toBe(true)
      expect(ALLOWED_PRIORITY.has(entry.dashboard_priority)).toBe(true)
      expect(ALLOWED_RELEVANCE.has(entry.future_sponsor_relevance)).toBe(true)
    }
  })
})
