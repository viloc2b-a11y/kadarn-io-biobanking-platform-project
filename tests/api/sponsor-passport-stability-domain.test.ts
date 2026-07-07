/**
 * RC-12.2B - Sponsor Passport Stability Domain Model tests.
 */

import { describe, expect, it } from 'vitest'
import {
  evaluateStabilityDomain,
  STABILITY_DOMAIN_STATE,
  STABILITY_REVIEW_STATUS,
  STABILITY_TRANSITION_REASON,
  type StabilityKnowledgeSignal,
  type StabilityLifecycleSnapshot,
} from '../../apps/api/src/lib/sponsor-passport/stability'

const REFERENCE_DATE = new Date('2026-07-05T12:00:00.000Z')

function supportedFreshClaim(overrides: Partial<StabilityKnowledgeSignal> = {}): StabilityKnowledgeSignal {
  return {
    claimId: 'claim-current',
    confidence: 'High',
    temporalState: 'fresh',
    hasSupportingEvidence: true,
    hasCounterEvidence: false,
    contested: false,
    ...overrides,
  }
}

function snapshot(overrides: Partial<StabilityLifecycleSnapshot> = {}): StabilityLifecycleSnapshot {
  return {
    institutionId: 'org-site-rc122b',
    knowledgeSignals: [supportedFreshClaim()],
    reviewSignals: [],
    movementSignals: [],
    ...overrides,
  }
}

describe('Sponsor Passport Stability Domain Model (RC-12.2B)', () => {
  it('uses the RC-10.2 stability vocabulary without adding public states', () => {
    expect(Object.values(STABILITY_DOMAIN_STATE)).toEqual([
      'Stable',
      'Evolving',
      'Under Review',
      'Evidence Refresh Needed',
    ])
  })

  it('returns Under Review when a review workflow is open', () => {
    const decision = evaluateStabilityDomain(
      snapshot({
        reviewSignals: [
          {
            id: 'review-1',
            subjectId: 'claim-current',
            status: STABILITY_REVIEW_STATUS.OPEN,
          },
        ],
      }),
      { referenceDate: REFERENCE_DATE },
    )

    expect(decision).toMatchObject({
      state: STABILITY_DOMAIN_STATE.UNDER_REVIEW,
      supportingReviewIds: ['review-1'],
    })
    expect(decision.transition.reason).toBe(STABILITY_TRANSITION_REASON.OPEN_REVIEW)
  })

  it('prioritizes contested knowledge over refresh signals', () => {
    const decision = evaluateStabilityDomain(
      snapshot({
        knowledgeSignals: [
          supportedFreshClaim({
            claimId: 'claim-contested',
            temporalState: 'decayed',
            hasCounterEvidence: true,
          }),
        ],
      }),
      { referenceDate: REFERENCE_DATE },
    )

    expect(decision).toMatchObject({
      state: STABILITY_DOMAIN_STATE.UNDER_REVIEW,
      supportingClaimIds: ['claim-contested'],
    })
    expect(decision.transition.reason).toBe(
      STABILITY_TRANSITION_REASON.CONTESTED_KNOWLEDGE,
    )
  })

  it('returns Evidence Refresh Needed when no knowledge signals exist', () => {
    const decision = evaluateStabilityDomain(
      snapshot({ knowledgeSignals: [] }),
      { referenceDate: REFERENCE_DATE },
    )

    expect(decision.state).toBe(STABILITY_DOMAIN_STATE.EVIDENCE_REFRESH_NEEDED)
    expect(decision.transition.reason).toBe(
      STABILITY_TRANSITION_REASON.NO_KNOWLEDGE_SIGNALS,
    )
  })

  it('returns Evidence Refresh Needed for insufficient or unsupported knowledge', () => {
    const insufficient = evaluateStabilityDomain(
      snapshot({
        knowledgeSignals: [
          supportedFreshClaim({
            claimId: 'claim-insufficient',
            confidence: 'Insufficient',
          }),
        ],
      }),
      { referenceDate: REFERENCE_DATE },
    )

    const unsupported = evaluateStabilityDomain(
      snapshot({
        knowledgeSignals: [
          supportedFreshClaim({
            claimId: 'claim-unsupported',
            hasSupportingEvidence: false,
          }),
        ],
      }),
      { referenceDate: REFERENCE_DATE },
    )

    expect(insufficient).toMatchObject({
      state: STABILITY_DOMAIN_STATE.EVIDENCE_REFRESH_NEEDED,
      supportingClaimIds: ['claim-insufficient'],
    })
    expect(insufficient.transition.reason).toBe(
      STABILITY_TRANSITION_REASON.INSUFFICIENT_CONFIDENCE,
    )

    expect(unsupported).toMatchObject({
      state: STABILITY_DOMAIN_STATE.EVIDENCE_REFRESH_NEEDED,
      supportingClaimIds: ['claim-unsupported'],
    })
    expect(unsupported.transition.reason).toBe(
      STABILITY_TRANSITION_REASON.MISSING_SUPPORT,
    )
  })

  it('returns Evidence Refresh Needed when evidence is decayed', () => {
    const decision = evaluateStabilityDomain(
      snapshot({
        knowledgeSignals: [
          supportedFreshClaim({
            claimId: 'claim-decayed',
            temporalState: 'decayed',
          }),
        ],
      }),
      { referenceDate: REFERENCE_DATE },
    )

    expect(decision).toMatchObject({
      state: STABILITY_DOMAIN_STATE.EVIDENCE_REFRESH_NEEDED,
      supportingClaimIds: ['claim-decayed'],
    })
    expect(decision.transition.reason).toBe(STABILITY_TRANSITION_REASON.DECAYED_EVIDENCE)
  })

  it('returns Evolving for recent lifecycle movement', () => {
    const decision = evaluateStabilityDomain(
      snapshot({
        movementSignals: [
          {
            id: 'movement-1',
            occurredAt: '2026-06-30T12:00:00.000Z',
          },
        ],
      }),
      {
        referenceDate: REFERENCE_DATE,
        recentMovementWindowDays: 30,
      },
    )

    expect(decision).toMatchObject({
      state: STABILITY_DOMAIN_STATE.EVOLVING,
      supportingMovementIds: ['movement-1'],
    })
    expect(decision.transition.reason).toBe(STABILITY_TRANSITION_REASON.RECENT_MOVEMENT)
  })

  it('returns Evolving for aging evidence when stronger signals are absent', () => {
    const decision = evaluateStabilityDomain(
      snapshot({
        knowledgeSignals: [
          supportedFreshClaim({
            claimId: 'claim-aging',
            temporalState: 'aging',
          }),
        ],
      }),
      { referenceDate: REFERENCE_DATE },
    )

    expect(decision).toMatchObject({
      state: STABILITY_DOMAIN_STATE.EVOLVING,
      supportingClaimIds: ['claim-aging'],
    })
    expect(decision.transition.reason).toBe(STABILITY_TRANSITION_REASON.AGING_EVIDENCE)
  })

  it('returns Stable only for quiet current knowledge', () => {
    const decision = evaluateStabilityDomain(snapshot(), {
      referenceDate: REFERENCE_DATE,
    })

    expect(decision).toMatchObject({
      state: STABILITY_DOMAIN_STATE.STABLE,
      supportingClaimIds: [],
      supportingReviewIds: [],
      supportingMovementIds: [],
    })
    expect(decision.transition.reason).toBe(
      STABILITY_TRANSITION_REASON.QUIET_CURRENT_KNOWLEDGE,
    )
  })

  it('preserves previous state on the domain transition without changing the output enum', () => {
    const decision = evaluateStabilityDomain(
      snapshot({
        previousState: STABILITY_DOMAIN_STATE.EVOLVING,
      }),
      { referenceDate: REFERENCE_DATE },
    )

    expect(decision.transition).toEqual({
      from: STABILITY_DOMAIN_STATE.EVOLVING,
      to: STABILITY_DOMAIN_STATE.STABLE,
      reason: STABILITY_TRANSITION_REASON.QUIET_CURRENT_KNOWLEDGE,
    })
  })
})
