// ==========================================================================
// IKM/EVM Sprint 1 — Evidence Maturity Model Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  EvidenceMaturityLevel,
  evaluateMaturity,
  computeMaturityLevel,
  computeFreshnessStatus,
  computeConflictImpact,
  computeProvenanceCap,
  applyCapsAndConflicts,
  generateNextActions,
} from '../../packages/evidence-validation/src/index'
import type { MaturityEvaluationInput } from '../../packages/evidence-validation/src/index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<MaturityEvaluationInput> = {}): MaturityEvaluationInput {
  return {
    subjectId: 'fact-001',
    hasSelfReport: false,
    documentCount: 0,
    internalCorroborationCount: 0,
    hasOperationalHistory: false,
    externalConfirmationCount: 0,
    repeatedValidationCount: 0,
    provenanceComplete: false,
    evidenceAgeDays: 0,
    hasConflicts: false,
    evidenceIds: [],
    ...overrides,
  }
}

// ==========================================================================
// Test 1: EM0 — no fact/evidence exists
// ==========================================================================

describe('EM0 — Not Documented', () => {
  it('returns EM0 when no self-report and no documents', () => {
    const input = makeInput({ hasSelfReport: false, documentCount: 0 })
    const result = evaluateMaturity(input)
    expect(result.maturityLevel).toBe(EvidenceMaturityLevel.EM0_NOT_DOCUMENTED)
    expect(result.maturityScore).toBe(0)
  })

  it('produces next best actions for EM0', () => {
    const input = makeInput({ hasSelfReport: false, documentCount: 0 })
    const result = evaluateMaturity(input)
    expect(result.nextBestActions.length).toBeGreaterThan(0)
    expect(result.nextBestActions[0]).toContain('self-reported')
  })
})

// ==========================================================================
// Test 2: EM1 — self-reported only
// ==========================================================================

describe('EM1 — Self Reported', () => {
  it('returns EM1 when self-report exists but no documents', () => {
    const input = makeInput({ hasSelfReport: true, documentCount: 0 })
    const result = evaluateMaturity(input)
    expect(result.maturityLevel).toBe(EvidenceMaturityLevel.EM1_SELF_REPORTED)
    expect(result.maturityScore).toBe(1)
  })

  it('recommends providing documentation', () => {
    const input = makeInput({ hasSelfReport: true, documentCount: 0 })
    const result = evaluateMaturity(input)
    expect(result.nextBestActions.some((a) => a.includes('document'))).toBe(true)
  })
})

// ==========================================================================
// Test 3: EM2 — document supported
// ==========================================================================

describe('EM2 — Document Supported', () => {
  it('returns EM2 with 1+ documents and no corroboration', () => {
    const input = makeInput({ hasSelfReport: true, documentCount: 2, internalCorroborationCount: 0 })
    const result = evaluateMaturity(input)
    expect(result.maturityLevel).toBe(EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED)
    expect(result.maturityScore).toBe(2)
  })
})

// ==========================================================================
// Test 4: EM3 — internally corroborated
// ==========================================================================

describe('EM3 — Internally Corroborated', () => {
  it('returns EM3 with documents + 2+ internal corroborations', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 3,
      internalCorroborationCount: 2,
    })
    const result = evaluateMaturity(input)
    expect(result.maturityLevel).toBe(EvidenceMaturityLevel.EM3_INTERNALLY_CORROBORATED)
    expect(result.maturityScore).toBe(3)
  })
})

// ==========================================================================
// Test 5: EM4 — operationally demonstrated
// ==========================================================================

describe('EM4 — Operationally Demonstrated', () => {
  it('returns EM4 with operational history + corroboration + documents', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 2,
      internalCorroborationCount: 2,
      hasOperationalHistory: true,
    })
    const result = evaluateMaturity(input)
    expect(result.maturityLevel).toBe(EvidenceMaturityLevel.EM4_OPERATIONALLY_DEMONSTRATED)
    expect(result.maturityScore).toBe(4)
  })
})

// ==========================================================================
// Test 6: EM5 — externally confirmed
// ==========================================================================

describe('EM5 — Externally Confirmed', () => {
  it('returns EM5 with external confirmation + operational history + corroboration', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 3,
      internalCorroborationCount: 3,
      hasOperationalHistory: true,
      externalConfirmationCount: 1,
    })
    const result = evaluateMaturity(input)
    expect(result.maturityLevel).toBe(EvidenceMaturityLevel.EM5_EXTERNALLY_CONFIRMED)
    expect(result.maturityScore).toBe(5)
  })
})

// ==========================================================================
// Test 7: EM6 — continuously validated
// ==========================================================================

describe('EM6 — Continuously Validated', () => {
  it('returns EM6 with all conditions met', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 5,
      internalCorroborationCount: 4,
      hasOperationalHistory: true,
      externalConfirmationCount: 2,
      repeatedValidationCount: 3,
      provenanceComplete: true,
      evidenceAgeDays: 90,
    })
    const result = evaluateMaturity(input)
    expect(result.maturityLevel).toBe(EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED)
    expect(result.maturityScore).toBe(6)
  })

  it('does NOT return EM6 if evidence is older than 365 days', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 5,
      internalCorroborationCount: 4,
      hasOperationalHistory: true,
      externalConfirmationCount: 2,
      repeatedValidationCount: 3,
      provenanceComplete: true,
      evidenceAgeDays: 400,
    })
    const result = evaluateMaturity(input)
    expect(result.maturityLevel).not.toBe(EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED)
  })
})

// ==========================================================================
// Test 8: Conflicts reduce maturity
// ==========================================================================

describe('Conflicts reduce maturity', () => {
  it('minor conflict reduces by 1 level', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 2,
      internalCorroborationCount: 2,
      hasOperationalHistory: true,
      hasConflicts: true,
      conflictSeverity: 'minor',
    })
    const result = evaluateMaturity(input)
    // EM4 reduced by 1 → EM3
    expect(result.maturityScore).toBeLessThanOrEqual(3)
    expect(result.conflictStatus).toBe('minor_conflict')
  })

  it('major conflict reduces by 2 levels', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 2,
      internalCorroborationCount: 2,
      hasOperationalHistory: true,
      hasConflicts: true,
      conflictSeverity: 'major',
    })
    const result = evaluateMaturity(input)
    // EM4 reduced by 2 → EM2
    expect(result.maturityScore).toBeLessThanOrEqual(2)
    expect(result.conflictStatus).toBe('major_conflict')
  })
})

// ==========================================================================
// Test 9: Stale evidence caps maturity
// ==========================================================================

describe('Stale evidence caps maturity', () => {
  it('caps at EM3 when evidence is stale (365-730 days)', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 3,
      internalCorroborationCount: 3,
      hasOperationalHistory: true,
      externalConfirmationCount: 1,
      evidenceAgeDays: 500,
    })
    const result = evaluateMaturity(input)
    // Would be EM5, capped at EM3 by freshness
    expect(result.maturityScore).toBeLessThanOrEqual(3)
    expect(result.freshnessStatus).toBe('stale')
  })

  it('caps at EM1 when evidence is expired (>730 days)', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 3,
      internalCorroborationCount: 3,
      hasOperationalHistory: true,
      evidenceAgeDays: 800,
    })
    const result = evaluateMaturity(input)
    expect(result.maturityScore).toBeLessThanOrEqual(1)
    expect(result.freshnessStatus).toBe('expired')
  })
})

// ==========================================================================
// Test 10: Evaluator produces next best actions
// ==========================================================================

describe('Next best actions', () => {
  it('produces at least one action per level', () => {
    for (const level of Object.values(EvidenceMaturityLevel)) {
      const actions = generateNextActions(level)
      expect(actions.length).toBeGreaterThanOrEqual(1)
      expect(actions[0].length).toBeGreaterThan(10) // non-trivial
    }
  })

  it('EM6 actions include maintaining validation', () => {
    const actions = generateNextActions(EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED)
    expect(actions.some((a) => a.includes('re-validation') || a.includes('periodic'))).toBe(true)
  })
})

// ==========================================================================
// Test 11: Provenance incomplete caps maturity
// ==========================================================================

describe('Provenance caps maturity', () => {
  it('caps at EM3 when provenance is incomplete', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 3,
      internalCorroborationCount: 3,
      hasOperationalHistory: true,
      externalConfirmationCount: 1,
      provenanceComplete: false,
      evidenceAgeDays: 50,
    })
    const result = evaluateMaturity(input)
    expect(result.maturityScore).toBeLessThanOrEqual(3)
    expect(result.provenanceStatus).toBe('partial')
  })

  it('allows EM5+ when provenance is complete', () => {
    const input = makeInput({
      hasSelfReport: true,
      documentCount: 3,
      internalCorroborationCount: 3,
      hasOperationalHistory: true,
      externalConfirmationCount: 1,
      provenanceComplete: true,
      evidenceAgeDays: 50,
    })
    const result = evaluateMaturity(input)
    expect(result.maturityScore).toBeGreaterThanOrEqual(5)
  })
})

// ==========================================================================
// Test 12: EM6 requires current evidence
// ==========================================================================

describe('EM6 requires current evidence', () => {
  it('EM6 only achievable with evidenceAgeDays < 365', () => {
    const fullInput = makeInput({
      hasSelfReport: true,
      documentCount: 5,
      internalCorroborationCount: 4,
      hasOperationalHistory: true,
      externalConfirmationCount: 2,
      repeatedValidationCount: 3,
      provenanceComplete: true,
      evidenceAgeDays: 90,
    })
    const result = evaluateMaturity(fullInput)
    expect(result.maturityLevel).toBe(EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED)

    const staleInput = makeInput({
      hasSelfReport: true,
      documentCount: 5,
      internalCorroborationCount: 4,
      hasOperationalHistory: true,
      externalConfirmationCount: 2,
      repeatedValidationCount: 3,
      provenanceComplete: true,
      evidenceAgeDays: 400,
    })
    const staleResult = evaluateMaturity(staleInput)
    expect(staleResult.maturityLevel).not.toBe(EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED)
  })
})
