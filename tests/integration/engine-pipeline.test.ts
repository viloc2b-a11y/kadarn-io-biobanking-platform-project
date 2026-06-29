// ==========================================================================
// Sprint 6 — Engine pipeline integration (correlationId across stages)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { runPipeline, createPipelineContext, PIPELINE_STAGES } from '../../apps/api/src/lib/engine-orchestrator'

describe('Engine pipeline integration', () => {
  it('settlement pipeline completes financial and provenance stages', () => {
    const correlationId = crypto.randomUUID()
    const result = runPipeline(
      'settlement',
      createPipelineContext({
        correlationId,
        actorId: 'user-sett',
        organizationId: 'org-fin',
      }),
      {
        settlementId: 'sett-001',
        dealId: 'deal-001',
        amount: 25000,
      },
    )

    expect(result.correlationId).toBe(correlationId)
    expect(result.stagesCompleted).toEqual(PIPELINE_STAGES.settlement)
    expect(result.stagesCompleted).toContain('provenance')
    expect(result.stagesCompleted).toContain('financial')
    expect(result.stagesCompleted).toContain('trust')
  })

  it('shipment pipeline includes twins and workflow stages', () => {
    const result = runPipeline(
      'shipment',
      createPipelineContext({
        correlationId: crypto.randomUUID(),
        actorId: 'user-ship',
        organizationId: 'org-log',
      }),
      {
        shipmentId: 'ship-001',
        carrier: 'FedEx',
        programId: 'prog-1',
      },
    )

    expect(result.stagesCompleted).toContain('twins')
    expect(result.stagesCompleted).toContain('workflow')
    expect(result.stagesCompleted).toContain('exchange')
  })

  it('feasibility pipeline runs discovery and knowledge first', () => {
    const stages = PIPELINE_STAGES.feasibility
    const discoveryIdx = stages.indexOf('discovery')
    const knowledgeIdx = stages.indexOf('knowledge')
    const exchangeIdx = stages.indexOf('exchange')

    expect(discoveryIdx).toBeLessThan(knowledgeIdx)
    expect(knowledgeIdx).toBeLessThan(exchangeIdx)
  })

  it('collection-twin pipeline records provenance via orchestrator', () => {
    const correlationId = crypto.randomUUID()
    const result = runPipeline(
      'collection-twin',
      createPipelineContext({
        correlationId,
        actorId: 'user-twin',
        organizationId: 'org-bio',
      }),
      {
        collectionId: 'col-001',
        name: 'Oncology Cohort A',
      },
    )

    expect(result.stagesCompleted).toContain('provenance')
    expect(result.stagesCompleted).toContain('twins')
    expect(result.correlationId).toBe(correlationId)
  })
})
