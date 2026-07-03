import { describe, it, expect } from 'vitest'
import {
  buildAllEngineOutputs,
  PublishedViewService,
  type AgentOutputMap,
} from '@kadarn/published-view'

function stripVolatileTimestamps<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, val) => {
      if (key === 'last_updated' || key === 'generated_at') return '[timestamp]'
      return val
    }),
  ) as T
}

const institutionFixture: AgentOutputMap = {
  capability_detector: {
    output: {
      capabilities: [
        {
          capabilityId: 'cap-inst-1',
          claimTypeId: 'cold_chain',
          name: 'Cold Chain Storage',
          category: 'infrastructure',
          status: 'confirmed',
          supportingEntityIds: [],
          reasoning: 'Facility description mentions -80C storage',
        },
      ],
    },
    confidence: 0.9,
    status: 'completed',
    created_at: '2026-07-03T12:00:00.000Z',
  },
  claim_candidate_detector: {
    output: { candidates: [] },
    confidence: 1,
    status: 'completed',
    created_at: '2026-07-03T12:00:00.000Z',
  },
  evidence_gap_detector: {
    output: { reports: [{ gaps: [] }] },
    confidence: 1,
    status: 'completed',
    created_at: '2026-07-03T12:00:00.000Z',
  },
}

describe('Institution public legacy equivalence', () => {
  it('Published View path preserves institution public response semantics', () => {
    const legacyDirect = buildAllEngineOutputs(institutionFixture)

    const svc = new PublishedViewService()
    const viaViews = svc.getInstitutionPublicResponse({
      org: {
        id: 'org-inst-1',
        name: 'Northern Biobank',
        city: 'Chicago',
        state: 'IL',
        description: 'Regional biobank network',
      },
      slug: 'org-inst-1',
      agentOutputs: institutionFixture,
      sessionId: 'sess-inst-1',
    })

    expect(viaViews.institution_name).toBe('Northern Biobank')
    expect(viaViews.institution_slug).toBe('org-inst-1')
    expect(viaViews.location).toBe('Chicago, IL')
    expect(stripVolatileTimestamps(viaViews.capabilities)).toEqual(
      stripVolatileTimestamps(legacyDirect.capabilityIntelligence),
    )
    expect(stripVolatileTimestamps(viaViews.assessment)).toEqual(
      stripVolatileTimestamps(legacyDirect.assessmentIntelligence),
    )
    expect(viaViews.gaps).toBeNull()
    expect(viaViews.recommendations).toBeNull()
  })
})
