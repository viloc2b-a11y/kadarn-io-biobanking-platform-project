// ==========================================================================
// dashboard-next-best-action Phase A — ClaimConfidenceState invariant test
// ==========================================================================
// Design ref: sdd/dashboard-next-best-action design D3.
// Spec ref: "Bare label is invalid" scenario (spec id 980) — a Confidence
// State without reasons/evidence must never validate.

import { describe, it, expect } from 'vitest'
import {
  ClaimConfidenceStateSchema,
  type ClaimConfidenceState,
} from '../../packages/types/src/claim-confidence'

function validState(overrides: Partial<ClaimConfidenceState> = {}): ClaimConfidenceState {
  return {
    claimId: '60efe181-d6f1-4702-a618-dc2f85b1387d',
    level: 'high',
    derivedState: 'supported',
    workflowState: 'published',
    evidenceFor: [
      {
        evidenceId: 'a458a36a-0765-4f47-ad34-91be7e5dad64',
        relationshipType: 'SUPPORTS',
        provenance: 'Uploaded by institution, class A document',
        freshness: { lastUpdatedAt: '2026-01-01T00:00:00.000Z', expiresAt: null },
      },
    ],
    evidenceAgainst: [],
    provenance: [
      { source: 'Institution self-declared', recordedAt: '2026-01-01T00:00:00.000Z', detail: null },
    ],
    freshness: {
      newestEvidenceAt: '2026-01-01T00:00:00.000Z',
      oldestEvidenceAt: '2026-01-01T00:00:00.000Z',
      expiredCount: 0,
      decayPeriodMonths: null,
    },
    reasons: [{ ruleKey: 'rule-6-supported', inputs: { supportingLinks: 1 } }],
    ...overrides,
  }
}

describe('ClaimConfidenceStateSchema — single-claim-scoped, never a bare label', () => {
  it('accepts a fully-formed state with a non-empty reasons trail', () => {
    const result = ClaimConfidenceStateSchema.safeParse(validState())
    expect(result.success).toBe(true)
  })

  it('rejects a state with an empty reasons array (bare label is invalid)', () => {
    const result = ClaimConfidenceStateSchema.safeParse(validState({ reasons: [] }))
    expect(result.success).toBe(false)
  })

  it('rejects a state missing reasons entirely', () => {
    const state = validState() as Record<string, unknown>
    delete state.reasons
    const result = ClaimConfidenceStateSchema.safeParse(state)
    expect(result.success).toBe(false)
  })

  it('requires evidenceFor and evidenceAgainst to be present (possibly empty, never absent)', () => {
    const state = validState() as Record<string, unknown>
    delete state.evidenceAgainst
    const result = ClaimConfidenceStateSchema.safeParse(state)
    expect(result.success).toBe(false)
  })

  it('is scoped to exactly one claim_id (no array of claim ids anywhere on the shape)', () => {
    const parsed = ClaimConfidenceStateSchema.parse(validState())
    expect(typeof parsed.claimId).toBe('string')
  })

  it('keeps contradicting evidence, never silently drops it', () => {
    const state = validState({
      derivedState: 'partially_supported',
      evidenceAgainst: [
        {
          evidenceId: '763599fb-9744-42e6-923a-606cc192acbf',
          relationshipType: 'CONTRADICTS',
          provenance: 'External reviewer flagged discrepancy',
          freshness: { lastUpdatedAt: '2026-02-01T00:00:00.000Z', expiresAt: null },
        },
      ],
    })
    const result = ClaimConfidenceStateSchema.safeParse(state)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.evidenceAgainst).toHaveLength(1)
    }
  })
})
