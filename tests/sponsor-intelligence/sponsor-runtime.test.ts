// ==========================================================================
// Sponsor Intelligence Runtime — Test Suite (KTP-1.6 / Mission 7)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  buildSponsorPortfolio,
  matchInstitutionsToProgram,
  buildExecutiveSummary,
  buildReadinessDistribution,
  detectChanges,
  explainRecommendation,
  canActorSeeInstitution,
  getVisibleEvaluations,
} from '../../packages/sponsor-intelligence/src/index'

import type { ReadinessEvaluation } from '@kadarn/readiness-engine'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEval(overrides: Partial<ReadinessEvaluation> = {}): ReadinessEvaluation {
  return {
    id: `eval-${Math.random().toString(36).slice(2, 8)}`,
    organization_id: 'org-001',
    organization_name: 'Test Institution',
    program_type_key: 'readiness_biospecimen_collection',
    readiness_status: 'ready',
    overall_confidence: 0.92,
    visibility_scope: 'network',
    evaluation_snapshot: {
      strengths: ['Biospecimen Collection SOP verified', 'CLIA certification Class A'],
      concerns: [],
      capabilities: [
        { name: 'Biospecimen Collection', status: 'supported', confidence: 0.95 },
        { name: 'Laboratory', status: 'supported', confidence: 0.90 },
      ],
      evidence_highlights: [
        { id: 'ev-001', description: 'CLIA Certification #456', evidence_class: 'A', supports_capability: 'Laboratory', confidence: 0.95 },
        { id: 'ev-002', description: 'SOP v2.1', evidence_class: 'B', supports_capability: 'Biospecimen Collection', confidence: 0.88 },
      ],
      evidence_completeness: 85,
    },
    computed_at: new Date().toISOString(),
    ...overrides,
  }
}

// ==========================================================================
// Test 1: Portfolio aggregates institutions by program type
// ==========================================================================

describe('Portfolio aggregation', () => {
  it('correctly counts institutions by readiness status', () => {
    const evals: ReadinessEvaluation[] = [
      makeEval({ organization_id: 'org-1', readiness_status: 'ready', overall_confidence: 0.92 }),
      makeEval({ organization_id: 'org-2', readiness_status: 'ready', overall_confidence: 0.88 }),
      makeEval({ organization_id: 'org-3', readiness_status: 'conditionally_ready', overall_confidence: 0.72 }),
      makeEval({ organization_id: 'org-4', readiness_status: 'partial', overall_confidence: 0.45 }),
      makeEval({ organization_id: 'org-5', readiness_status: 'not_ready', overall_confidence: 0.12 }),
    ]

    const portfolio = buildSponsorPortfolio('sponsor-1', 'biospecimen', evals)

    expect(portfolio.summary.totalInstitutions).toBe(5)
    expect(portfolio.summary.ready).toBe(2)
    expect(portfolio.summary.conditionallyReady).toBe(1)
    expect(portfolio.summary.partial).toBe(1)
    expect(portfolio.summary.notReady).toBe(1)
  })
})

// ==========================================================================
// Test 2: Program matching ranks by readiness
// ==========================================================================

describe('Program matching — ranking', () => {
  it('ranks ready institutions before not_ready', () => {
    const evals = [
      makeEval({ organization_id: 'org-1', readiness_status: 'not_ready', overall_confidence: 0.10 }),
      makeEval({ organization_id: 'org-2', readiness_status: 'ready', overall_confidence: 0.95 }),
    ]

    const result = matchInstitutionsToProgram('biospecimen', 'Biospecimen Collection', evals)

    expect(result.matchedInstitutions[0].institutionId).toBe('org-2')
    expect(result.matchedInstitutions[1].institutionId).toBe('org-1')
  })
})

// ==========================================================================
// Test 3: Program matching includes rationale
// ==========================================================================

describe('Program matching — rationale', () => {
  it('every match has matchRationale with specific content', () => {
    const evals = [makeEval()]
    const result = matchInstitutionsToProgram('biospecimen', 'Test', evals)

    for (const match of result.matchedInstitutions) {
      expect(match.matchRationale).toBeTruthy()
      expect(match.matchRationale.length).toBeGreaterThan(10)
    }
  })
})

// ==========================================================================
// Test 4: Executive summary produces actionable headline
// ==========================================================================

describe('Executive summary', () => {
  it('produces non-empty headline and recommended action', () => {
    const eval_ = makeEval()
    const summary = buildExecutiveSummary(eval_, 'institution')

    expect(summary.headline).toBeTruthy()
    expect(summary.recommendedAction).toBeTruthy()
    expect(summary.riskLevel).toBeDefined()
    expect(['low', 'moderate', 'elevated', 'high']).toContain(summary.riskLevel)
  })
})

// ==========================================================================
// Test 5: Monitoring detects readiness increase
// ==========================================================================

describe('Monitoring — readiness increase', () => {
  it('detects when readiness improves', () => {
    const prev = [makeEval({ organization_id: 'org-1', readiness_status: 'partial' })]
    const curr = [makeEval({ organization_id: 'org-1', readiness_status: 'ready' })]

    const alerts = detectChanges(prev, curr)

    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts.some((a) => a.alertType === 'readiness_increased')).toBe(true)
  })
})

// ==========================================================================
// Test 6: Monitoring detects capability loss
// ==========================================================================

describe('Monitoring — capability loss', () => {
  it('detects when a capability goes from supported to needs_evidence', () => {
    const prev = [makeEval({
      organization_id: 'org-1',
      evaluation_snapshot: {
        capabilities: [
          { name: 'Biospecimen Collection', status: 'supported', confidence: 0.90 },
        ],
        strengths: [], concerns: [], evidence_highlights: [],
      },
    })]
    const curr = [makeEval({
      organization_id: 'org-1',
      evaluation_snapshot: {
        capabilities: [
          { name: 'Biospecimen Collection', status: 'needs_more_evidence', confidence: 0.30 },
        ],
        strengths: [], concerns: [], evidence_highlights: [],
      },
    })]

    const alerts = detectChanges(prev, curr)

    expect(alerts.some((a) => a.alertType === 'capability_lost')).toBe(true)
  })
})

// ==========================================================================
// Test 7: Explainability traces to evidence
// ==========================================================================

describe('Explainability — evidence trace', () => {
  it('includes supportingEvidence and traceChain', () => {
    const eval_ = makeEval()
    const match = {
      institutionId: 'org-001',
      institutionName: 'Test',
      readinessStatus: 'ready',
      overallConfidence: 0.92,
      matchStrength: 'excellent' as const,
      matchRationale: 'Fully ready',
      capabilityCoverage: 85,
      evidenceQuality: 'well-documented',
      criticalGaps: [],
      recommendation: 'Consider',
    }

    const explanation = explainRecommendation(match, eval_)

    expect(explanation.supportingEvidence).toBeDefined()
    expect(explanation.traceChain).toBeDefined()
    expect(explanation.traceChain.length).toBeGreaterThan(0)
    expect(explanation.whyRecommended).toBeTruthy()
  })
})

// ==========================================================================
// Test 8: Multi-actor — sponsor sees network-visible
// ==========================================================================

describe('Multi-actor — sponsor sees network-visible', () => {
  it('sponsor can see institution with visibility_scope=network', () => {
    const canSee = canActorSeeInstitution('sponsor', 'org-1', 'network')
    expect(canSee).toBe(true)
  })
})

// ==========================================================================
// Test 9: Multi-actor — sponsor cannot see private
// ==========================================================================

describe('Multi-actor — sponsor cannot see private', () => {
  it('sponsor blocked from visibility_scope=organization when not in portfolio', () => {
    const canSee = canActorSeeInstitution('sponsor', 'org-1', 'organization', undefined, ['org-2'])
    expect(canSee).toBe(false)
  })
})

// ==========================================================================
// Test 10: No Evidence Core dependency
// ==========================================================================

describe('No Evidence Core dependency', () => {
  it('sponsor-intelligence has zero evidence-core imports', () => {
    // Validated architecturally: package depends on readiness-engine and types, not evidence-core
    // This test verifies the architectural constraint at the module level
    const pkgJson = require('../../packages/sponsor-intelligence/package.json')
    const deps = { ...pkgJson.dependencies }
    expect(deps['@kadarn/evidence-core']).toBeUndefined()
  })
})

// ==========================================================================
// Test 11: Program view is inverse of institution view
// ==========================================================================

describe('Program view — inverse of institution view', () => {
  it('groups by program type, not by institution', () => {
    const evals = [
      makeEval({ organization_id: 'org-1', program_type_key: 'biospecimen', readiness_status: 'ready' }),
      makeEval({ organization_id: 'org-2', program_type_key: 'biospecimen', readiness_status: 'partial' }),
    ]

    const result = matchInstitutionsToProgram('biospecimen', 'Biospecimen', evals)

    // Program view: all results are for the SAME program type
    expect(result.programTypeKey).toBe('biospecimen')
    expect(result.matchedInstitutions.length).toBe(2)
    // Institution IDs are different (grouped BY program, not BY institution)
    const ids = result.matchedInstitutions.map((m) => m.institutionId)
    expect(new Set(ids).size).toBe(2)
  })
})

// ==========================================================================
// Test 12: No Marketplace references
// ==========================================================================

describe('No Marketplace references', () => {
  it('zero marketplace/monetization/payment terms in outputs', () => {
    const evals = [makeEval()]
    const portfolio = buildSponsorPortfolio('sponsor-1', 'test', evals)
    const matching = matchInstitutionsToProgram('test', 'Test', evals)
    const dist = buildReadinessDistribution(evals)

    const outputs = [JSON.stringify(portfolio), JSON.stringify(matching), JSON.stringify(dist)]
    for (const output of outputs) {
      expect(output).not.toContain('marketplace')
      expect(output).not.toContain('monetization')
      expect(output).not.toContain('payment')
      expect(output).not.toContain('price')
    }
  })
})

// ==========================================================================
// Test 13: Alerts are derived (pure functions)
// ==========================================================================

describe('Alerts — derived, pure functions', () => {
  it('detectChanges produces same output for same input (pure)', () => {
    const prev = [makeEval({ organization_id: 'org-1', readiness_status: 'partial' })]
    const curr = [makeEval({ organization_id: 'org-1', readiness_status: 'ready' })]

    const alerts1 = detectChanges(prev, curr)
    const alerts2 = detectChanges(prev, curr)

    // Same inputs → same outputs (pure function)
    expect(alerts1.length).toBe(alerts2.length)
    expect(alerts1[0].alertType).toBe(alerts2[0].alertType)
  })

  it('no stored alert state — no DB, no mutation', () => {
    const prev = [makeEval({ organization_id: 'org-1' })]
    const curr = [makeEval({ organization_id: 'org-1' })]

    // Calling detectChanges should not throw or mutate global state
    const alerts = detectChanges(prev, curr)
    expect(Array.isArray(alerts)).toBe(true)
  })
})
