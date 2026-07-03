import { describe, it, expect } from 'vitest'
import {
  buildDiscoveryReportDirect,
  PublishedViewService,
  type AgentOutputMap,
} from '@kadarn/published-view'

function stripVolatileTimestamps<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, val) => {
      if (
        key === 'last_updated'
        || key === 'generated_at'
        || key === 'generation_timestamp'
      ) return '[timestamp]'
      if (key === 'provenance' && typeof val === 'string') return '[provenance]'
      return val
    }),
  ) as T
}

const reportGolden: AgentOutputMap = {
  capability_detector: {
    output: {
      capabilities: [
        {
          capabilityId: 'cap-golden-1',
          name: 'Sample Processing',
          category: 'operations',
          status: 'confirmed',
          claimTypeId: 'processing',
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

describe('Discovery report legacy equivalence', () => {
  it('Published View path matches direct engine report output', () => {
    const input = {
      orgId: 'org-golden-rep',
      sessionId: 'sess-golden-rep',
      institutionName: 'Golden Biorepository',
      agentOutputs: JSON.parse(JSON.stringify(reportGolden)) as AgentOutputMap,
      artifactsProcessed: 5,
      sessionCount: 1,
    }

    const legacyDirect = buildDiscoveryReportDirect(input)
    const viaPublishedView = new PublishedViewService().getDiscoveryReport(input)

    expect(stripVolatileTimestamps(viaPublishedView)).toEqual(
      stripVolatileTimestamps(legacyDirect),
    )
    expect(viaPublishedView.executive_summary).toContain('Golden Biorepository')
  })
})
