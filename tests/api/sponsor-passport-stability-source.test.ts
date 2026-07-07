/**
 * RC-12.2C - Sponsor Passport Stability Source Layer tests.
 */

import { describe, expect, it } from 'vitest'
import type { Claim, EvidenceNode } from '../../packages/evidence-core/src/index.js'
import {
  buildStabilityLifecycleSnapshotFromSource,
  evaluateStabilityDomain,
  mapAuditEventsToStabilityMovementSignals,
  mapAuditEventsToStabilityReviewSignals,
  STABILITY_DOMAIN_STATE,
  STABILITY_TRANSITION_REASON,
  type StabilitySourceAuditEvent,
} from '../../apps/api/src/lib/sponsor-passport/stability'

const REFERENCE_DATE = new Date('2026-07-05T12:00:00.000Z')
const INSTITUTION_ID = 'org-site-rc122c'

function claim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: 'claim-current',
    claimTypeId: 'biospecimen.processing.pbmc',
    name: 'PBMC processing',
    description: 'On-site PBMC processing',
    organizationId: INSTITUTION_ID,
    status: 'active',
    domain: 'biospecimen',
    decays: true,
    decayPeriodMonths: 12,
    validEvidenceClasses: ['B'] as never,
    requiredEvidenceClasses: ['B'] as never,
    temporal: {
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      decayPeriodMonths: 12,
    },
    provenance: {
      createdByActorId: 'actor-rc122c',
      createdByOrganizationId: INSTITUTION_ID,
      correlationId: 'corr-rc122c',
      summary: 'Seed claim',
    },
    visibility: {
      owningOrganizationId: INSTITUTION_ID,
      scope: 'site',
      authorizedSponsorIds: [],
    },
    ...overrides,
  }
}

function evidenceNode(overrides: Partial<EvidenceNode> = {}): EvidenceNode {
  return {
    id: 'evidence-current',
    claimId: 'claim-current',
    evidenceClass: 'B' as never,
    content: 'Supporting evidence',
    source: 'Institutional record',
    date: '2026-06-01',
    status: 'active',
    weight: 0.5,
    provenance: {
      createdByActorId: 'actor-rc122c',
      createdByOrganizationId: INSTITUTION_ID,
      correlationId: 'corr-rc122c',
      summary: 'Seed evidence',
    },
    visibility: {
      owningOrganizationId: INSTITUTION_ID,
      scope: 'site',
      authorizedSponsorIds: [],
    },
    temporal: {
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
      decayPeriodMonths: null,
    },
    ...overrides,
  }
}

function auditEvent(overrides: Partial<StabilitySourceAuditEvent>): StabilitySourceAuditEvent {
  return {
    id: 'audit-1',
    action: 'claim.created',
    resourceType: 'evidence_core',
    resourceId: 'claim-current',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('Sponsor Passport Stability Source Layer (RC-12.2C)', () => {
  it('builds knowledge signals from productive claim and evidence inputs', () => {
    const snapshot = buildStabilityLifecycleSnapshotFromSource({
      read: {
        institutionId: INSTITUTION_ID,
        claims: [claim()],
        evidenceByClaimId: {
          'claim-current': [evidenceNode()],
        },
      },
      actorId: 'actor-rc122c',
      correlationId: 'corr-rc122c',
      referenceDate: REFERENCE_DATE,
    })

    expect(snapshot).toMatchObject({
      institutionId: INSTITUTION_ID,
      reviewSignals: [],
      movementSignals: [],
    })
    expect(snapshot.knowledgeSignals).toHaveLength(1)
    expect(snapshot.knowledgeSignals[0]).toMatchObject({
      claimId: 'claim-current',
      temporalState: 'fresh',
      hasSupportingEvidence: true,
      hasCounterEvidence: false,
      contested: false,
    })
    expect(snapshot.knowledgeSignals[0].confidence).not.toBe('Insufficient')
  })

  it('captures missing support as a source signal for refresh decisions', () => {
    const snapshot = buildStabilityLifecycleSnapshotFromSource({
      read: {
        institutionId: INSTITUTION_ID,
        claims: [claim()],
        evidenceByClaimId: {},
      },
      actorId: 'actor-rc122c',
      correlationId: 'corr-rc122c',
      referenceDate: REFERENCE_DATE,
    })

    expect(snapshot.knowledgeSignals[0]).toMatchObject({
      claimId: 'claim-current',
      hasSupportingEvidence: false,
      temporalState: 'aging',
    })

    const decision = evaluateStabilityDomain(snapshot, {
      referenceDate: REFERENCE_DATE,
    })

    expect(decision.state).toBe(STABILITY_DOMAIN_STATE.EVIDENCE_REFRESH_NEEDED)
    expect(decision.transition.reason).toBe(
      STABILITY_TRANSITION_REASON.MISSING_SUPPORT,
    )
  })

  it('captures counter-evidence as contested knowledge', () => {
    const snapshot = buildStabilityLifecycleSnapshotFromSource({
      read: {
        institutionId: INSTITUTION_ID,
        claims: [claim()],
        evidenceByClaimId: {
          'claim-current': [
            evidenceNode(),
            evidenceNode({
              id: 'counter-current',
              content: 'Counter-evidence',
              weight: -0.5,
            }),
          ],
        },
      },
      actorId: 'actor-rc122c',
      correlationId: 'corr-rc122c',
      referenceDate: REFERENCE_DATE,
    })

    expect(snapshot.knowledgeSignals[0]).toMatchObject({
      claimId: 'claim-current',
      hasSupportingEvidence: true,
      hasCounterEvidence: true,
    })

    const decision = evaluateStabilityDomain(snapshot, {
      referenceDate: REFERENCE_DATE,
    })

    expect(decision.state).toBe(STABILITY_DOMAIN_STATE.UNDER_REVIEW)
    expect(decision.transition.reason).toBe(
      STABILITY_TRANSITION_REASON.CONTESTED_KNOWLEDGE,
    )
  })

  it('maps audit source rows into review and movement signals', () => {
    const rows: StabilitySourceAuditEvent[] = [
      auditEvent({ id: 'claim-created', action: 'claim.created' }),
      auditEvent({
        id: 'counter-submitted',
        action: 'counter_evidence.submitted',
        resourceId: 'counter-current',
      }),
      auditEvent({
        id: 'relationship-created',
        action: 'relationship.created',
        resourceId: 'rel-current',
      }),
      auditEvent({
        id: 'external-event',
        action: 'claim.created',
        resourceType: 'program',
      }),
    ]

    expect(mapAuditEventsToStabilityReviewSignals(rows)).toEqual([
      {
        id: 'counter-submitted',
        subjectId: 'counter-current',
        status: 'open',
      },
    ])

    expect(mapAuditEventsToStabilityMovementSignals(rows)).toEqual([
      {
        id: 'claim-created',
        occurredAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'counter-submitted',
        occurredAt: '2026-07-01T00:00:00.000Z',
      },
    ])
  })

  it('builds a full lifecycle snapshot from claims, evidence, and audit events', () => {
    const snapshot = buildStabilityLifecycleSnapshotFromSource({
      read: {
        institutionId: INSTITUTION_ID,
        claims: [claim()],
        evidenceByClaimId: {
          'claim-current': [evidenceNode()],
        },
      },
      auditEvents: [
        auditEvent({
          id: 'process-review',
          action: 'process_state.updated',
          resourceId: 'claim-current',
        }),
      ],
      actorId: 'actor-rc122c',
      correlationId: 'corr-rc122c',
      referenceDate: REFERENCE_DATE,
      previousState: STABILITY_DOMAIN_STATE.EVOLVING,
    })

    expect(snapshot.previousState).toBe(STABILITY_DOMAIN_STATE.EVOLVING)
    expect(snapshot.knowledgeSignals).toHaveLength(1)
    expect(snapshot.reviewSignals.map((signal) => signal.id)).toEqual(['process-review'])
    expect(snapshot.movementSignals.map((signal) => signal.id)).toEqual(['process-review'])
  })

  it('preserves decay information from productive source evidence', () => {
    const snapshot = buildStabilityLifecycleSnapshotFromSource({
      read: {
        institutionId: INSTITUTION_ID,
        claims: [
          claim({
            id: 'claim-decayed',
            decayPeriodMonths: 6,
            temporal: {
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-01T00:00:00.000Z',
              decayPeriodMonths: 6,
            },
          }),
        ],
        evidenceByClaimId: {
          'claim-decayed': [
            evidenceNode({
              id: 'evidence-decayed',
              claimId: 'claim-decayed',
              date: '2025-01-01',
            }),
          ],
        },
      },
      actorId: 'actor-rc122c',
      correlationId: 'corr-rc122c',
      referenceDate: REFERENCE_DATE,
    })

    expect(snapshot.knowledgeSignals[0]).toMatchObject({
      claimId: 'claim-decayed',
      temporalState: 'decayed',
      hasSupportingEvidence: true,
    })
  })
})
