// ==========================================================================
// dashboard-next-best-action Phase A — deriveClaimState() table test
// ==========================================================================
// Design ref: sdd/dashboard-next-best-action/design D4 (ordered rule table).
// Pure function, no institution-level aggregation — one Claim in, one
// DerivedClaimState out, always explainable via the caller's own reasons.

import { describe, it, expect } from 'vitest'
import {
  deriveClaimState,
  type ClaimStateInput,
  type DerivationEvidenceLink,
} from '../../packages/types/src/claim-derived-state'

function link(overrides: Partial<DerivationEvidenceLink> = {}): DerivationEvidenceLink {
  return {
    relationshipType: 'SUPPORTS',
    evidenceClass: 'A',
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function baseInput(overrides: Partial<ClaimStateInput> = {}): ClaimStateInput {
  return {
    workflowState: 'published',
    decays: false,
    decayPeriodMonths: null,
    requiredEvidenceClasses: [],
    evidenceLinks: [link()],
    now: new Date('2026-08-06T00:00:00.000Z'),
    ...overrides,
  }
}

describe('deriveClaimState — D4 ordered rule table', () => {
  it('rule 1: workflow_state=disputed wins over everything else', () => {
    const state = deriveClaimState(
      baseInput({ workflowState: 'disputed', evidenceLinks: [link({ relationshipType: 'CONTRADICTS' })] }),
    )
    expect(state).toBe('disputed')
  })

  it('rule 2: workflow_state=archived', () => {
    const state = deriveClaimState(baseInput({ workflowState: 'archived' }))
    expect(state).toBe('archived')
  })

  it('rule 3: no SUPPORTS/PARTIALLY_SUPPORTS link => awaiting_evidence', () => {
    const state = deriveClaimState(baseInput({ evidenceLinks: [] }))
    expect(state).toBe('awaiting_evidence')
  })

  it('rule 3: only a CONTRADICTS/REQUIRES_REVIEW link (no support) => awaiting_evidence', () => {
    const state = deriveClaimState(
      baseInput({ evidenceLinks: [link({ relationshipType: 'REQUIRES_REVIEW' })] }),
    )
    expect(state).toBe('awaiting_evidence')
  })

  it('rule 4: every supporting item expired => stale', () => {
    const state = deriveClaimState(
      baseInput({
        evidenceLinks: [link({ expiresAt: '2020-01-01T00:00:00.000Z' })],
      }),
    )
    expect(state).toBe('stale')
  })

  it('rule 4: decays=true and newest supporting item older than decay period => stale', () => {
    const state = deriveClaimState(
      baseInput({
        decays: true,
        decayPeriodMonths: 6,
        evidenceLinks: [link({ createdAt: '2024-01-01T00:00:00.000Z' })],
      }),
    )
    expect(state).toBe('stale')
  })

  it('boundary: decays=false never produces stale via decay, even with an old item', () => {
    const state = deriveClaimState(
      baseInput({
        decays: false,
        decayPeriodMonths: 1,
        evidenceLinks: [link({ createdAt: '2020-01-01T00:00:00.000Z' })],
      }),
    )
    expect(state).not.toBe('stale')
  })

  it('boundary: expired evidence but a required evidence class is still present => stale wins over partially_supported', () => {
    const state = deriveClaimState(
      baseInput({
        requiredEvidenceClasses: ['A'],
        evidenceLinks: [link({ evidenceClass: 'A', expiresAt: '2020-01-01T00:00:00.000Z' })],
      }),
    )
    expect(state).toBe('stale')
  })

  it('rule 5: any CONTRADICTS link => partially_supported', () => {
    const state = deriveClaimState(
      baseInput({
        evidenceLinks: [link(), link({ relationshipType: 'CONTRADICTS' })],
      }),
    )
    expect(state).toBe('partially_supported')
  })

  it('rule 5: a required evidence class with no matching supporting evidence => partially_supported', () => {
    const state = deriveClaimState(
      baseInput({
        requiredEvidenceClasses: ['A', 'B'],
        evidenceLinks: [link({ evidenceClass: 'A' })],
      }),
    )
    expect(state).toBe('partially_supported')
  })

  it('rule 5: only PARTIALLY_SUPPORTS links => partially_supported', () => {
    const state = deriveClaimState(
      baseInput({ evidenceLinks: [link({ relationshipType: 'PARTIALLY_SUPPORTS' })] }),
    )
    expect(state).toBe('partially_supported')
  })

  it('boundary: CONTRADICTS wins over an otherwise-fully-supported claim', () => {
    const state = deriveClaimState(
      baseInput({
        requiredEvidenceClasses: ['A'],
        evidenceLinks: [
          link({ evidenceClass: 'A' }),
          link({ relationshipType: 'CONTRADICTS', evidenceClass: 'A' }),
        ],
      }),
    )
    expect(state).toBe('partially_supported')
  })

  it('rule 6: SUPPORTS link, no contradictions, no missing required class, not expired => supported', () => {
    const state = deriveClaimState(
      baseInput({
        requiredEvidenceClasses: ['A'],
        evidenceLinks: [link({ evidenceClass: 'A' })],
      }),
    )
    expect(state).toBe('supported')
  })
})
