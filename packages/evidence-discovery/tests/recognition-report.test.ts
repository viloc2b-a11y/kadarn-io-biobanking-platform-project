// ==========================================================================
// Institution Recognition Report — Tests (Sprint 22A)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { InstitutionRecognitionReportGenerator } from '../src/recognition-report/generator.js'
import type { ReportInput } from '../src/recognition-report/generator.js'

function makeGenerator(): InstitutionRecognitionReportGenerator {
  return new InstitutionRecognitionReportGenerator()
}

function emptyInput(): ReportInput {
  return { institutionName: 'Test Institution', capabilities: [], gaps: [] }
}

function fullInput(): ReportInput {
  return {
    institutionName: 'Vilo Research Center',
    capabilities: [
      {
        id: 'c1', name: 'Plasma Collection', category: 'Biospecimen Processing',
        assessment_status: 'healthy', operational_maturity: 'advanced',
        supporting_claims: ['SOP confirmed.', 'QA validated.'],
        supporting_evidence: ['e1', 'e2', 'e3'], research_assets_enabled: ['Plasma'],
        assessment_summary: 'Healthy.',
      },
      {
        id: 'c2', name: 'FFPE Processing', category: 'Biospecimen Processing',
        assessment_status: 'blocked', operational_maturity: 'developing',
        supporting_claims: [], supporting_evidence: ['e4'],
        research_assets_enabled: ['FFPE Tissue'], assessment_summary: 'Blocked.',
      },
    ],
    assessmentSummary: { healthy: 1, attention_needed: 0, limited: 0, blocked: 1, unknown: 0 },
    gaps: [
      {
        title: 'FFPE SOP missing', severity: 'blocking', blocking: true,
        affected_capabilities: ['c2'], affected_research_assets: ['FFPE Tissue'],
        recommended_next_action: 'Upload SOP',
      },
    ],
    readiness: {
      readiness_label: 'Needs Additional Evidence',
      summary: 'One blocking gap.',
      strengths: ['Strong plasma processing'],
      concerns: ['FFPE documentation missing'],
    },
    recommendations: [
      {
        priority: 'critical', title: 'Upload FFPE SOP',
        reason: 'Blocking gap', recommended_action: 'Upload SOP',
        blocking: true,
      },
    ],
    story: 'A research center with strong plasma processing.',
    artifactsProcessed: 12,
    sessionCount: 3,
  }
}

// --------------------------------------------------------------------------
// Empty institution
// --------------------------------------------------------------------------

describe('RecognitionReport — empty institution', () => {
  it('generates a minimal report for empty institution', () => {
    const gen = makeGenerator()
    const report = gen.generate(emptyInput())
    expect(report.executive_summary).toBeTruthy()
    expect(report.institution_overview.capabilities_detected).toBe(0)
    expect(report.capabilities).toHaveLength(0)
    expect(report.research_assets).toHaveLength(0)
  })
})

// --------------------------------------------------------------------------
// Complete institution
// --------------------------------------------------------------------------

describe('RecognitionReport — complete institution', () => {
  it('generates all sections with data', () => {
    const gen = makeGenerator()
    const report = gen.generate(fullInput())

    expect(report.institution_overview.capabilities_detected).toBe(2)
    expect(report.institution_overview.research_assets_enabled).toBe(2)
    expect(report.capabilities.length).toBeGreaterThan(0)
    expect(report.research_assets.length).toBeGreaterThan(0)
    expect(report.evidence_highlights.length).toBeGreaterThan(0)
    expect(report.evidence_gaps.length).toBeGreaterThan(0)
    expect(report.sponsor_readiness).not.toBeNull()
    expect(report.recommendations.length).toBeGreaterThan(0)
    expect(report.appendix.source_trace.length).toBe(5)
  })
})

// --------------------------------------------------------------------------
// Institution with blocking gaps
// --------------------------------------------------------------------------

describe('RecognitionReport — blocking gaps', () => {
  it('report reflects blocking gaps in executive summary', () => {
    const gen = makeGenerator()
    const report = gen.generate(fullInput())
    expect(report.executive_summary).toContain('1 blocking gap')
  })

  it('gap sections include blocking flag', () => {
    const gen = makeGenerator()
    const report = gen.generate(fullInput())
    expect(report.evidence_gaps[0].blocking).toBe(true)
  })
})

// --------------------------------------------------------------------------
// Recommendations integration
// --------------------------------------------------------------------------

describe('RecognitionReport — recommendations', () => {
  it('includes recommendations in report', () => {
    const gen = makeGenerator()
    const report = gen.generate(fullInput())
    expect(report.recommendations[0].priority).toBe('critical')
    expect(report.recommendations[0].title).toBe('Upload FFPE SOP')
  })

  it('no recommendations → empty array', () => {
    const gen = makeGenerator()
    const report = gen.generate(emptyInput())
    expect(report.recommendations).toHaveLength(0)
  })
})

// --------------------------------------------------------------------------
// Report completeness
// --------------------------------------------------------------------------

describe('RecognitionReport — completeness', () => {
  it('report has all 11 required top-level fields', () => {
    const gen = makeGenerator()
    const report = gen.generate(fullInput())
    expect(report).toHaveProperty('executive_summary')
    expect(report).toHaveProperty('institution_overview')
    expect(report).toHaveProperty('institution_story')
    expect(report).toHaveProperty('capabilities')
    expect(report).toHaveProperty('research_assets')
    expect(report).toHaveProperty('evidence_highlights')
    expect(report).toHaveProperty('evidence_gaps')
    expect(report).toHaveProperty('sponsor_readiness')
    expect(report).toHaveProperty('recommendations')
    expect(report).toHaveProperty('appendix')
    expect(report).toHaveProperty('generated_at')
  })
})

// --------------------------------------------------------------------------
// No confidence
// --------------------------------------------------------------------------

describe('RecognitionReport — no confidence', () => {
  it('report does not contain confidence fields', () => {
    const gen = makeGenerator()
    const report = gen.generate(fullInput())
    const json = JSON.stringify(report)
    expect(json).not.toContain('"confidence"')
    expect(json).not.toContain('confidence_score')
  })
})

// --------------------------------------------------------------------------
// No forbidden terminology
// --------------------------------------------------------------------------

describe('RecognitionReport — no forbidden terms', () => {
  it('never uses verified or certified', () => {
    const gen = makeGenerator()
    const report = gen.generate(fullInput())
    const json = JSON.stringify(report).toLowerCase()
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('gold')
    expect(json).not.toContain('silver')
    expect(json).not.toContain('bronze')
  })
})
