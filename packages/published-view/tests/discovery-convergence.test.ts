import { describe, it, expect } from 'vitest'
import {
  adaptDiscoveryAgentOutputs,
  buildAllEngineOutputs,
  PublishedViewService,
} from '../src/index.js'
import type { AgentOutputMap } from '../src/engine-output-builder.js'
import { stripVolatileTimestamps } from './equivalence-helpers.js'

const goldenAgentOutputs: AgentOutputMap = {
  capability_detector: {
    output: {
      capabilities: [
        {
          capabilityId: 'cap-1',
          claimTypeId: 'laboratory_capability',
          name: 'PBMC Processing',
          category: 'sample_processing',
          status: 'confirmed',
          supportingEntityIds: ['e1'],
          reasoning: 'Detected in protocol',
        },
      ],
    },
    confidence: 0.85,
    status: 'completed',
    created_at: '2026-07-03T00:00:00.000Z',
  },
  claim_candidate_detector: {
    output: {
      candidates: [
        {
          id: 'cand-1',
          proposedClaimTypeId: 'biospecimen_collection',
          reasoning: 'Site maintains 500 plasma samples',
        },
      ],
    },
    confidence: 0.72,
    status: 'completed',
    created_at: '2026-07-03T00:00:00.000Z',
  },
  evidence_gap_detector: {
    output: {
      reports: [{ gaps: [] }],
    },
    confidence: 1,
    status: 'completed',
    created_at: '2026-07-03T00:00:00.000Z',
  },
}

describe('Discovery agent adapter equivalence', () => {
  it('preserves capability_detector output shape after Published View adaptation', () => {
    const before = JSON.parse(JSON.stringify(goldenAgentOutputs))
    const { agentOutputs, views } = adaptDiscoveryAgentOutputs(before, {
      orgId: 'org-eq-1',
      sessionId: 'session-eq-1',
    })

    expect(views).toHaveLength(2)
    expect(agentOutputs['capability_detector']?.output?.capabilities).toEqual(
      before['capability_detector']?.output?.capabilities,
    )
    expect(agentOutputs['claim_candidate_detector']?.output?.candidates).toEqual(
      before['claim_candidate_detector']?.output?.candidates,
    )
  })

  it('institution engine outputs match before/after view adaptation', () => {
    const before = JSON.parse(JSON.stringify(goldenAgentOutputs))
    const directEngines = buildAllEngineOutputs(before)

    const svc = new PublishedViewService()
    const response = svc.getInstitutionPublicResponse({
      org: { id: 'org-eq-1', name: 'Test Biobank', city: 'Boston', state: 'MA' },
      slug: 'org-eq-1',
      agentOutputs: before,
      sessionId: 'session-eq-1',
    })

    expect(stripVolatileTimestamps(response.capabilities)).toEqual(
      stripVolatileTimestamps(directEngines.capabilityIntelligence),
    )
    expect(stripVolatileTimestamps(response.assessment)).toEqual(
      stripVolatileTimestamps(directEngines.assessmentIntelligence),
    )
    expect(response.readiness?.readiness_label).toBe(directEngines.sponsorReadiness?.readiness_label)
  })
})

describe('Discovery dashboard adaptation', () => {
  it('returns same candidate rows with views registered', () => {
    const svc = new PublishedViewService()
    const candidates = [{ id: 'dc-1', current_state: 'proposed', claim_type_id: 'cap_x' }]
    const result = svc.adaptDiscoveryDashboard({
      orgId: 'org-1',
      sessionId: 'sess-1',
      agentOutputs: goldenAgentOutputs,
      candidates,
    })

    expect(result.candidates).toEqual(candidates)
    expect(result.views.length).toBeGreaterThanOrEqual(3)
    expect(result.agentOutputs['capability_detector']).toBeDefined()
  })
})
