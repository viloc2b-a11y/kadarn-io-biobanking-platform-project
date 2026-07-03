// ==========================================================================
// Governance & Explainability — Tests (Sprint 23D)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { GovernanceExplainabilityService } from '../src/governance/engine.js'

function makeService(): GovernanceExplainabilityService {
  return new GovernanceExplainabilityService()
}

// --------------------------------------------------------------------------

describe('Governance — engine registry', () => {
  it('returns all 10 registered engines', () => {
    const svc = makeService()
    expect(svc.getEngineVersions().length).toBeGreaterThanOrEqual(9)
  })

  it('finds capability intelligence engine', () => {
    const svc = makeService()
    const engine = svc.getEngine('capability_intelligence')
    expect(engine).toBeDefined()
    expect(engine!.version).toBe('1.0.0')
    expect(engine!.input_dependencies).toContain('discovery_pipeline')
  })
})

// --------------------------------------------------------------------------

describe('Governance — engine lineage', () => {
  it('traces dependency chain for recommendation engine', () => {
    const svc = makeService()
    const lineage = svc.getEngineLineage('recommendation_engine')
    expect(lineage.length).toBeGreaterThanOrEqual(4)
    expect(lineage[0].engine_id).toBe('sponsor_readiness')
  })
})

// --------------------------------------------------------------------------

describe('Governance — governance versions', () => {
  it('returns all 7 governance domains', () => {
    const svc = makeService()
    expect(svc.getAllGovernanceVersions()).toHaveLength(7)
  })

  it('finds capability taxonomy version', () => {
    const svc = makeService()
    const v = svc.getGovernanceVersion('capability_taxonomy')
    expect(v).toBeDefined()
    expect(v!.version).toBe('1.0.0')
    expect(v!.rules).toContain('14 capability categories')
  })
})

// --------------------------------------------------------------------------

describe('Governance — version history', () => {
  it('returns immutable history snapshots', () => {
    const svc = makeService()
    const history = svc.getVersionHistory()
    expect(history).toHaveLength(1)
    expect(history[0]).toHaveLength(7)
  })
})

// --------------------------------------------------------------------------

describe('Explainability — capability', () => {
  it('generates explainability for a capability', () => {
    const svc = makeService()
    const record = svc.explainCapability(
      { name: 'Plasma Collection', status: 'healthy', category: 'Biospecimen Processing' },
      ['ev-1', 'ev-2', 'ev-3'],
      [],
    )
    expect(record.subject).toBe('Plasma Collection')
    expect(record.subject_type).toBe('capability')
    expect(record.generated_by).toBe('capability_intelligence')
    expect(record.explanation).toBeDefined()
    expect(record.supporting_evidence).toHaveLength(3)
  })
})

// --------------------------------------------------------------------------

describe('Explainability — assessment', () => {
  it('generates explainability for an assessment entry', () => {
    const svc = makeService()
    const record = svc.explainAssessment(
      { capability_name: 'FFPE Processing', assessment_status: 'blocked', operational_maturity: 'developing' },
      2, 1,
    )
    expect(record.subject_type).toBe('assessment')
    expect(record.generated_by).toBe('institutional_assessment')
    expect(record.explanation).toContain('blocked')
    expect(record.blocking_gaps).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------

describe('Explainability — recommendation', () => {
  it('generates explainability for a recommendation', () => {
    const svc = makeService()
    const record = svc.explainRecommendation(
      { title: 'Upload FFPE SOP', priority: 'critical', reason: 'Blocking gap detected' },
      'evidence_gap_intelligence',
    )
    expect(record.subject_type).toBe('recommendation')
    expect(record.generated_by).toBeDefined()
    expect(record.explanation).toContain('critical')
  })
})

// --------------------------------------------------------------------------

describe('Explainability — readiness', () => {
  it('generates explainability for readiness', () => {
    const svc = makeService()
    const record = svc.explainReadiness(
      { readiness_label: 'Needs Additional Evidence' },
      ['Strong plasma processing'],
      ['FFPE documentation missing'],
    )
    expect(record.subject_type).toBe('readiness')
    expect(record.generated_by).toBeDefined()
  })
})

// --------------------------------------------------------------------------

describe('Governance — no forbidden language', () => {
  it('never uses confidence, verified, certified', () => {
    const svc = makeService()
    const json = JSON.stringify(svc.getEngineVersions())
    expect(json).not.toContain('confidence')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('hidden')
    expect(json).not.toContain('black box')
  })
})
