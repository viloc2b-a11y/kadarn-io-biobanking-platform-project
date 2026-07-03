import { describe, it, expect } from 'vitest'
import {
  buildDiscoveryReportDirect,
  PublishedViewService,
  type AgentOutputMap,
} from '../src/index.js'
import { stripVolatileTimestamps } from './equivalence-helpers.js'

const reportFixture: AgentOutputMap = {
  capability_detector: {
    output: {
      capabilities: [
        {
          capabilityId: 'cap-rep-1',
          claimTypeId: 'cold_storage',
          name: 'Ultra-Low Temperature Storage',
          category: 'infrastructure',
          status: 'confirmed',
          supportingEntityIds: [],
          reasoning: 'Facility has -80C freezers',
        },
      ],
    },
    confidence: 0.88,
    status: 'completed',
    created_at: '2026-07-03T14:00:00.000Z',
  },
  claim_candidate_detector: {
    output: {
      candidates: [
        {
          id: 'cand-rep-1',
          proposedClaimTypeId: 'biospecimen_storage',
          reasoning: 'Cold chain capability documented',
        },
      ],
    },
    confidence: 0.7,
    status: 'completed',
    created_at: '2026-07-03T14:00:00.000Z',
  },
  evidence_gap_detector: {
    output: { reports: [{ gaps: [] }] },
    confidence: 1,
    status: 'completed',
    created_at: '2026-07-03T14:00:00.000Z',
  },
}

describe('Discovery report via Published View', () => {
  it('preserves report semantics after Compatibility Layer adaptation', () => {
    const input = {
      orgId: 'org-rep-1',
      sessionId: 'sess-rep-1',
      institutionName: 'Metro Biobank',
      agentOutputs: JSON.parse(JSON.stringify(reportFixture)) as AgentOutputMap,
      artifactsProcessed: 3,
      sessionCount: 1,
    }

    const direct = buildDiscoveryReportDirect(input)
    const viaViews = new PublishedViewService().getDiscoveryReport(input)

    expect(stripVolatileTimestamps(viaViews)).toEqual(stripVolatileTimestamps(direct))
    expect(viaViews.institution_overview.institution_name).toBe('Metro Biobank')
    expect(viaViews.institution_overview.artifacts_processed).toBe(3)
    expect(viaViews.capabilities.length).toBeGreaterThan(0)
  })
})
