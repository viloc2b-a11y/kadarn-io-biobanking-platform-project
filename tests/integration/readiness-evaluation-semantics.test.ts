// ==========================================================================
// LOOP 12B — Readiness Status Semantic Matrix
// ==========================================================================
// Exercises evaluateReadiness() status semantics for UNKNOWN / NOT_APPLICABLE
// without changing the public readiness-engine API.
// ==========================================================================

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EvidenceSupport } from '../../packages/readiness-engine/src/readiness-evaluation'

const TEST_ORG = '00000000-0000-0000-0000-000000000001'

function mockTaxonomy() {
  return {
    id: 'tax-biospecimen',
    type_key: 'readiness_biospecimen_collection',
    name: 'Prospective Biospecimen Collection Readiness',
    category: 'readiness',
    readiness_threshold: 0.75,
  }
}

function mockCapabilityRequirements() {
  return [
    {
      id: 'req-1',
      capability_type_id: 'cap-biospecimen-collection',
      is_mandatory: true,
      minimum_confidence: null as number | null,
      display_order: 1,
      capability_type: { key: 'biospecimen_collection', name: 'Biospecimen Collection' },
      evidence_reqs: [],
    },
    {
      id: 'req-2',
      capability_type_id: 'cap-processing-lab',
      is_mandatory: true,
      minimum_confidence: null,
      display_order: 2,
      capability_type: { key: 'processing_lab', name: 'Processing Lab' },
      evidence_reqs: [],
    },
    {
      id: 'req-3',
      capability_type_id: 'cap-cold-chain',
      is_mandatory: false,
      minimum_confidence: 0.6,
      display_order: 3,
      capability_type: { key: 'cold_chain', name: 'Cold Chain Logistics' },
      evidence_reqs: [],
    },
  ]
}

function createMockDb(): Record<string, unknown> {
  const state: Record<string, unknown> = {
    claims: [],
    program_type_taxonomy: mockTaxonomy(),
    readiness_capability_requirements: mockCapabilityRequirements(),
  }

  const makeChainedQuery = (table: string): Record<string, unknown> => {
    const chain: Record<string, unknown> = {
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      select: () => chain,
      single: async () => ({ data: state[table], error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      then: (resolve: (v: unknown) => void) => resolve({ data: state[table], error: null }),
    }
    return chain
  }

  return {
    from: (table: string) => ({
      select: () => makeChainedQuery(table),
    }),
  }
}

async function evaluateWithSupportMatrix(matrix: Array<{ evidenceSupport: EvidenceSupport; cappedConfidence: number }>) {
  vi.resetModules()
  let index = 0

  vi.doMock('../../packages/readiness-engine/src/readiness-helpers.js', () => ({
    computeEvidenceSupportLevel: () => matrix[index++] ?? matrix[matrix.length - 1],
  }))

  const { evaluateReadiness } = await import('../../packages/readiness-engine/src/readiness-evaluation')

  return evaluateReadiness({
    organizationId: TEST_ORG,
    programTypeKey: 'readiness_biospecimen_collection',
    db: createMockDb(),
  })
}

afterEach(() => {
  vi.doUnmock('../../packages/readiness-engine/src/readiness-helpers.js')
  vi.resetModules()
})

describe('Readiness status semantic matrix', () => {
  it('all UNKNOWN is not ready', async () => {
    const result = await evaluateWithSupportMatrix([
      { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 },
      { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 },
      { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 },
    ])

    expect(result.readinessStatus).toBe('not_ready')
    expect(result.mandatoryCapsTotal).toBe(0)
    expect(result.optionalCapsTotal).toBe(0)
  })

  it('all NOT_APPLICABLE is not ready', async () => {
    const result = await evaluateWithSupportMatrix([
      { evidenceSupport: 'NOT_APPLICABLE', cappedConfidence: 0 },
      { evidenceSupport: 'NOT_APPLICABLE', cappedConfidence: 0 },
      { evidenceSupport: 'NOT_APPLICABLE', cappedConfidence: 0 },
    ])

    expect(result.readinessStatus).toBe('not_ready')
    expect(result.mandatoryCapsTotal).toBe(0)
    expect(result.optionalCapsTotal).toBe(0)
  })

  it('mixed UNKNOWN and NOT_APPLICABLE is not ready', async () => {
    const result = await evaluateWithSupportMatrix([
      { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 },
      { evidenceSupport: 'NOT_APPLICABLE', cappedConfidence: 0 },
      { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 },
    ])

    expect(result.readinessStatus).toBe('not_ready')
    expect(result.mandatoryCapsTotal).toBe(0)
    expect(result.optionalCapsTotal).toBe(0)
  })

  it('one mandatory satisfied and the rest UNKNOWN remains ready when all evaluated mandatory counts are met', async () => {
    const result = await evaluateWithSupportMatrix([
      { evidenceSupport: 'SUPPORTED_BY_EVIDENCE', cappedConfidence: 0.9 },
      { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 },
      { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 },
    ])

    expect(result.readinessStatus).toBe('ready')
    expect(result.mandatoryCapsMet).toBe(1)
    expect(result.mandatoryCapsTotal).toBe(1)
  })

  it('mandatory missing is not ready', async () => {
    const result = await evaluateWithSupportMatrix([
      { evidenceSupport: 'NEEDS_EVIDENCE', cappedConfidence: 0.2 },
      { evidenceSupport: 'SUPPORTED_BY_EVIDENCE', cappedConfidence: 0.9 },
      { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 },
    ])

    expect(result.readinessStatus).toBe('not_ready')
    expect(result.mandatoryCapsMet).toBe(1)
    expect(result.mandatoryCapsTotal).toBe(2)
  })

  it('mandatory satisfied and optional absent is ready by current canonical status policy', async () => {
    const result = await evaluateWithSupportMatrix([
      { evidenceSupport: 'SUPPORTED_BY_EVIDENCE', cappedConfidence: 0.9 },
      { evidenceSupport: 'SUPPORTED_BY_EVIDENCE', cappedConfidence: 0.9 },
      { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 },
    ])

    expect(result.readinessStatus).toBe('ready')
    expect(result.mandatoryCapsMet).toBe(2)
    expect(result.mandatoryCapsTotal).toBe(2)
    expect(result.optionalCapsTotal).toBe(0)
  })

  it('fully evaluated capabilities use the normal readiness calculation', async () => {
    const result = await evaluateWithSupportMatrix([
      { evidenceSupport: 'SUPPORTED_BY_EVIDENCE', cappedConfidence: 0.9 },
      { evidenceSupport: 'SUPPORTED_BY_EVIDENCE', cappedConfidence: 0.9 },
      { evidenceSupport: 'SUPPORTED_BY_EVIDENCE', cappedConfidence: 0.8 },
    ])

    expect(result.readinessStatus).toBe('ready')
    expect(result.mandatoryCapsMet).toBe(2)
    expect(result.mandatoryCapsTotal).toBe(2)
    expect(result.optionalCapsMet).toBe(1)
    expect(result.optionalCapsTotal).toBe(1)
  })
})
