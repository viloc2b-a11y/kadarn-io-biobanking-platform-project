// ==========================================================================
// Workflow runtime integration — signal → dispatch → instance state
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  dispatchWorkflowSignal,
  resetExchangeRequestInstances,
  getExchangeRequestInstance,
} from '../../packages/workflow-engine/src/runtime'

describe('Workflow runtime integration', () => {
  beforeEach(() => {
    resetExchangeRequestInstances()
  })

  it('submit → reviewerAction approve progresses workflow state', async () => {
    await dispatchWorkflowSignal({
      workflowType: 'exchange-request-workflow',
      signal: 'submit',
      payload: {
        requestId: 'req-int-1',
        requesterOrgId: 'org-req',
        providerOrgId: 'org-prov',
        requesterName: 'Researcher',
      },
      correlationId: 'corr-1',
      actorId: 'user-req',
      organizationId: 'org-req',
    })

    const approve = await dispatchWorkflowSignal({
      workflowType: 'exchange-request-workflow',
      signal: 'reviewerAction',
      payload: { requestId: 'req-int-1', action: 'approve' },
      correlationId: 'corr-2',
      actorId: 'user-prov',
      organizationId: 'org-prov',
    })

    expect(approve.status).toMatch(/signaled|completed/)
    const state = getExchangeRequestInstance('req-int-1')
    expect(state?.currentStatus).toBe('negotiation')
  })

  it('unknown workflow type returns ignored', async () => {
    const result = await dispatchWorkflowSignal({
      workflowType: 'shipment-logistics-workflow',
      signal: 'schedule',
      payload: { shipmentId: 'ship-1' },
      correlationId: 'corr-3',
      actorId: 'user-1',
    })

    expect(result.status).toBe('ignored')
  })
})
