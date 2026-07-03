import { describe, it, expect } from 'vitest'
import { agentOutputsToLineageExtraction } from '../src/lineage/agent-output-mapper.js'

describe('agentOutputsToLineageExtraction (28B)', () => {
  it('maps claim candidates to extraction claims (facts), not direct claims', () => {
    const input = agentOutputsToLineageExtraction({
      claim_candidate_detector: {
        candidates: [{ id: 'cand-1', proposedClaimTypeId: 'biospecimen_collection', reasoning: 'Site has 500 samples' }],
      },
    })

    expect(input.claims).toHaveLength(1)
    expect(input.claims[0].statement).toContain('500 samples')
    expect(input.claims[0].type).toBe('biospecimen_collection')
  })

  it('includes capabilities from capability_detector', () => {
    const input = agentOutputsToLineageExtraction({
      capability_detector: {
        capabilities: [{ id: 'cap-1', name: 'PBMC', category: 'processing', line: 3, sectionId: 's1' }],
      },
    })
    expect(input.capabilities).toHaveLength(1)
  })
})
