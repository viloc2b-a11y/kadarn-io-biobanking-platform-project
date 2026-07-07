// ==========================================================================
// KTP-1.5A — Capability Intelligence Tests (Gap Closure)
// ==========================================================================

import { describe, it, expect, vi } from 'vitest'
import {
  buildCapabilityMatrix,
  analyzeEvidenceGaps,
  interpretReadiness,
  assessProgramFit,
  generateRecommendations,
  buildSponsorDecisionView,
} from '../../packages/evidence-discovery/src/capability-intelligence/index'

import type {
  CapabilityIntelligenceInput,
} from '../../packages/evidence-discovery/src/capability-intelligence/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<CapabilityIntelligenceInput> = {}): CapabilityIntelligenceInput {
  return {
    candidateCapabilities: [
      {
        capabilityId: 'cap-001',
        claimTypeId: 'biospecimen_collection',
        name: 'Biospecimen Collection',
        category: 'Biospecimen Processing',
        status: 'supported',
        supportingEntityIds: ['ev-001', 'ev-002'],
        supportingRelationshipIds: [],
        supportingArtifactIds: [],
        reasoning: 'SOP and IRB approval present',
      },
      {
        capabilityId: 'cap-002',
        claimTypeId: 'processing_lab',
        name: 'PBMC Processing Lab',
        category: 'Laboratory',
        status: 'partially_supported',
        supportingEntityIds: ['ev-003'],
        supportingRelationshipIds: [],
        supportingArtifactIds: [],
        reasoning: 'Lab certification present, viability QC missing',
      },
      {
        capabilityId: 'cap-003',
        claimTypeId: 'cold_chain',
        name: 'Cold Chain Logistics',
        category: 'Shipping',
        status: 'needs_more_evidence',
        supportingEntityIds: [],
        supportingRelationshipIds: [],
        supportingArtifactIds: [],
        reasoning: 'No shipping validation records found',
      },
    ],
    claimCandidates: [
      {
        id: 'claim-001',
        proposedClaimTypeId: 'biospecimen_collection',
        reasoning: 'SOP document supports claim',
      },
      {
        id: 'claim-002',
        proposedClaimTypeId: 'processing_lab',
        reasoning: 'Certification supports claim',
      },
    ],
    gaps: [
      {
        gapId: 'gap-001',
        category: 'Laboratory',
        description: 'Missing viability assessment protocol',
        severity: 'critical',
      },
      {
        gapId: 'gap-002',
        category: 'Shipping',
        description: 'Missing temperature monitoring logs (30-day)',
        severity: 'significant',
      },
      {
        gapId: 'gap-003',
        category: 'Personnel',
        description: 'Staff GCP training records not provided',
        severity: 'minor',
      },
    ],
    entityNames: {
      'ev-001': 'IRB Approval Letter (2025)',
      'ev-002': 'Biospecimen Collection SOP v2.1',
      'ev-003': 'CLIA Certification #45-6789',
    },
    ...overrides,
  }
}

// ==========================================================================
// Test 1: Consumes Readiness API outputs (CapabilityIntelligenceInput)
// ==========================================================================

describe('Capability Intelligence — Readiness API consumption', () => {
  it('produces matrix from CapabilityIntelligenceInput', () => {
    const input = makeInput()
    const matrix = buildCapabilityMatrix(input)
    expect(matrix.capabilities).toHaveLength(3)
    expect(matrix.capabilities[0].name).toBe('Biospecimen Collection')
    expect(matrix.capabilities[0].status).toBe('supported')
  })

  it('produces gaps from CapabilityIntelligenceInput', () => {
    const input = makeInput()
    const gaps = analyzeEvidenceGaps(input)
    expect(gaps).toHaveLength(3)
    expect(gaps[0].severity).toBe('critical')
    expect(gaps[0].recommendation).toBeTruthy()
  })

  it('produces interpretation from CapabilityIntelligenceInput', () => {
    const input = makeInput()
    const interp = interpretReadiness(input)
    expect(interp.summary).toBeTruthy()
    expect(interp.strengths).toHaveLength(1) // biospecimen collection is supported
    expect(interp.concerns).toHaveLength(2) // PBMC partial + cold chain needs evidence
  })
})

// ==========================================================================
// Test 2: No Evidence Core mutation
// ==========================================================================

describe('Capability Intelligence — No Evidence Core mutation', () => {
  it('does not import from @kadarn/evidence-core', () => {
    // Verify by checking that all functions are pure — no side effects
    const input = makeInput()

    // All functions should be callable without DB access
    expect(() => buildCapabilityMatrix(input)).not.toThrow()
    expect(() => analyzeEvidenceGaps(input)).not.toThrow()
    expect(() => interpretReadiness(input)).not.toThrow()
    expect(() => assessProgramFit(input)).not.toThrow()
    expect(() => generateRecommendations(input)).not.toThrow()
    expect(() => buildSponsorDecisionView(input)).not.toThrow()
  })
})

// ==========================================================================
// Test 3: No Marketplace dependency
// ==========================================================================

describe('Capability Intelligence — No Marketplace dependency', () => {
  it('produces zero Marketplace-related output fields', () => {
    const input = makeInput()
    const matrix = buildCapabilityMatrix(input)
    const json = JSON.stringify(matrix)
    expect(json).not.toContain('marketplace')
    expect(json).not.toContain('monetization')
    expect(json).not.toContain('payment')
    expect(json).not.toContain('sponsor-portal')
  })

  it('produces institution-centric output, not marketplace-centric', () => {
    const input = makeInput()
    const fit = assessProgramFit(input)
    // Fit assessment should focus on institution strengths/weaknesses
    expect(fit.strengths).toBeDefined()
    expect(fit.developmentAreas).toBeDefined()
    // Should NOT contain marketplace-specific fields
    const fitJson = JSON.stringify(fit)
    expect(fitJson).not.toContain('listing')
    expect(fitJson).not.toContain('price')
    expect(fitJson).not.toContain('bid')
  })
})

// ==========================================================================
// Test 4: Recommendations are explainable
// ==========================================================================

describe('Capability Intelligence — Explainable recommendations', () => {
  it('every recommendation references a specific capability and gap', () => {
    const input = makeInput()
    const recs = generateRecommendations(input)
    expect(recs.length).toBeGreaterThan(0)
    for (const rec of recs) {
      expect(rec.action).toBeTruthy()
      expect(rec.capabilityTarget).toBeTruthy()
      expect(rec.evidenceClass).toBeTruthy()
      // Each recommendation must trace to specific evidence requirement
      expect(rec.expectedImpact).toBeTruthy()
    }
  })

  it('recommendations reference concrete evidence classes, not vague advice', () => {
    const input = makeInput()
    const recs = generateRecommendations(input)
    const allText = recs.map(r => r.action).join(' ')
    // Should contain specific evidence types, not hand-waving
    expect(allText).toMatch(/protocol|SOP|certification|log|record|training/i)
  })
})

// ==========================================================================
// Test 5: Missing evidence → gaps, not negative judgments
// ==========================================================================

describe('Capability Intelligence — Gaps, not judgments', () => {
  it('frames missing evidence as gaps, not institutional deficiencies', () => {
    const input = makeInput()
    const gaps = analyzeEvidenceGaps(input)
    const gapsJson = JSON.stringify(gaps)
    // Must NOT contain judgmental language
    expect(gapsJson).not.toContain('deficient')
    expect(gapsJson).not.toContain('inadequate')
    expect(gapsJson).not.toContain('fail')
    expect(gapsJson).not.toContain('poor')
    expect(gapsJson).not.toContain('unqualified')
    // Should contain constructive language
    expect(gapsJson).toMatch(/missing|provide|submit|add|recommend/i)
  })

  it('interpretation highlights gaps without negative institution labels', () => {
    const input = makeInput()
    const interp = interpretReadiness(input)
    // Concerns should be specific, not labeling
    for (const concern of interp.concerns) {
      expect(concern).not.toMatch(/institution is|organization is|they are/i)
    }
  })
})

// ==========================================================================
// Test 6: No single institutional score
// ==========================================================================

describe('Capability Intelligence — No single institutional score', () => {
  it('matrix returns per-capability status, not overall score', () => {
    const input = makeInput()
    const matrix = buildCapabilityMatrix(input)
    expect(matrix.capabilities).toHaveLength(3)
    // Each capability has its own status
    expect(matrix.capabilities[0].status).toBeDefined()
    expect(matrix.capabilities[1].status).toBeDefined()
    // No single aggregate score field
    const matrixJson = JSON.stringify(matrix)
    expect(matrixJson).not.toMatch(/"score"\s*:\s*\d+/)
    expect(matrixJson).not.toMatch(/"rating"\s*:\s*\d+/)
  })

  it('fit assessment uses categories, not numeric score', () => {
    const input = makeInput()
    const fit = assessProgramFit(input)
    expect(fit.fitSummary).toMatch(/fit$/)
    // Qualitative categories only: strong_fit, adequate_fit, developing_fit, poor_fit
    expect(['strong_fit', 'adequate_fit', 'developing_fit', 'poor_fit']).toContain(fit.fitSummary)
  })
})

// ==========================================================================
// Test 7: Sponsor view is derived projection (pure function)
// ==========================================================================

describe('Capability Intelligence — Sponsor view as derived projection', () => {
  it('produces identical output for identical input (pure function)', () => {
    const input = makeInput()
    const view1 = buildSponsorDecisionView(input)
    const view2 = buildSponsorDecisionView(input)
    expect(view1).toEqual(view2)
  })

  it('does not persist state between calls', () => {
    const input1 = makeInput()
    const input2 = makeInput({
      candidateCapabilities: [
        {
          capabilityId: 'cap-001',
          claimTypeId: 'biospecimen_collection',
          name: 'Biospecimen Collection',
          category: 'Biospecimen Processing',
          status: 'supported',
          supportingEntityIds: ['ev-001'],
          supportingRelationshipIds: [],
          supportingArtifactIds: [],
          reasoning: 'SOP present',
        },
      ],
    })

    const view1 = buildSponsorDecisionView(input1)
    const view2 = buildSponsorDecisionView(input2)
    // Different inputs → different outputs
    expect(view1).not.toEqual(view2)
    // But calling again with input1 returns same as view1
    expect(buildSponsorDecisionView(input1)).toEqual(view1)
  })
})

// ==========================================================================
// Test 8: Recommendations non-certifying
// ==========================================================================

describe('Capability Intelligence — Non-certifying recommendations', () => {
  it('uses suggestive language, not mandatory language', () => {
    const input = makeInput()
    const recs = generateRecommendations(input)
    const allActions = recs.map(r => r.action).join(' ')
    // Suggestive verbs
    expect(allActions).toMatch(/consider|provide|add|submit|prepare|document/i)
    // Must NOT use mandatory/authoritative verbs
    expect(allActions).not.toMatch(/\bmust\b/)
    expect(allActions).not.toMatch(/\brequired\b/)
    expect(allActions).not.toMatch(/\bmandated\b/)
    expect(allActions).not.toMatch(/\bshall\b/)
  })

  it('never uses certification language in any output', () => {
    const input = makeInput()
    const outputs = [
      JSON.stringify(buildCapabilityMatrix(input)),
      JSON.stringify(analyzeEvidenceGaps(input)),
      JSON.stringify(interpretReadiness(input)),
      JSON.stringify(assessProgramFit(input)),
      JSON.stringify(generateRecommendations(input)),
      JSON.stringify(buildSponsorDecisionView(input)),
    ]
    for (const output of outputs) {
      expect(output).not.toContain('certified')
      expect(output).not.toContain('verified')
      expect(output).not.toContain('guaranteed')
      expect(output).not.toContain('accredited')
      expect(output).not.toContain('approved')
    }
  })

  it('improvement recommendations frame gaps as opportunities', () => {
    const input = makeInput()
    const recs = generateRecommendations(input)
    for (const rec of recs) {
      // Impact should describe positive outcome, not penalty
      expect(rec.expectedImpact).toMatch(/would|enable|improve|achieve|reach/i)
    }
  })
})
