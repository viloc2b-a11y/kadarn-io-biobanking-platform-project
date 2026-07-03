import { describe, it, expect } from 'vitest'
import { PublishedViewService, type AgentOutputMap } from '@kadarn/published-view'

const dashboardFixture: AgentOutputMap = {
  capability_detector: {
    output: {
      capabilities: [
        {
          capabilityId: 'cap-dash-1',
          name: 'Flow Cytometry',
          category: 'analytics',
          status: 'proposed',
        },
      ],
    },
    confidence: 0.8,
    status: 'completed',
    created_at: '2026-07-03T12:00:00.000Z',
  },
  claim_candidate_detector: {
    output: {
      candidates: [
        { id: 'cand-dash-1', proposedClaimTypeId: 'lab_capability', reasoning: 'Flow lab mentioned' },
      ],
    },
    confidence: 0.75,
    status: 'completed',
    created_at: '2026-07-03T12:00:00.000Z',
  },
}

describe('Discovery dashboard legacy equivalence', () => {
  it('agentOutputs capability and claim sections unchanged after view adaptation', () => {
    const before = JSON.parse(JSON.stringify(dashboardFixture)) as AgentOutputMap
    const svc = new PublishedViewService()

    const adapted = svc.adaptDiscoveryDashboard({
      orgId: 'org-dash-1',
      sessionId: 'sess-dash-1',
      agentOutputs: before,
      candidates: [{ id: 'row-1', current_state: 'proposed' }],
    })

    expect(adapted.agentOutputs['capability_detector']?.output).toEqual(
      before['capability_detector']?.output,
    )
    expect(adapted.agentOutputs['claim_candidate_detector']?.output).toEqual(
      before['claim_candidate_detector']?.output,
    )
    expect(adapted.candidates).toEqual([{ id: 'row-1', current_state: 'proposed' }])
  })

  it('registers published views for each capability and claim candidate', () => {
    const svc = new PublishedViewService()
    const adapted = svc.adaptDiscoveryDashboard({
      orgId: 'org-dash-1',
      sessionId: 'sess-dash-1',
      agentOutputs: dashboardFixture,
      candidates: [],
    })

    expect(adapted.views.length).toBe(2)
    expect(adapted.views.every(v => v.adapter_version === 'discovery-read:1.0.0')).toBe(true)
  })
})
