// ==========================================================================
// Workflow Runtime — Exchange Request Handler
// ==========================================================================
// Executes exchange-request-workflow PoC logic as the Sprint 8 reference
// runner. State is in-memory until Postgres WorkflowAdapter lands.
// ==========================================================================

import {
  createExchangeRequestWorkflow,
  processSignal,
  runExchangeRequestWorkflow,
  type ExchangeRequestState,
} from '../../temporal/exchange-request-workflow';
import type { TemporalSignal } from '../../temporal/types';
import type { WorkflowDispatchResult, WorkflowSignalCommand } from '../types';

const instances = new Map<string, ExchangeRequestState>();

export function resetExchangeRequestInstances(): void {
  instances.clear();
}

function toSignal(command: WorkflowSignalCommand): TemporalSignal {
  return {
    type: command.signal,
    payload: command.payload,
    receivedAt: new Date().toISOString(),
  };
}

export async function handleExchangeRequestSignal(
  command: WorkflowSignalCommand,
): Promise<WorkflowDispatchResult> {
  const requestId = String(command.payload.requestId ?? command.payload.request_id ?? '');
  if (!requestId) {
    return {
      workflowType: command.workflowType,
      signal: command.signal,
      status: 'failed',
      error: 'missing requestId',
    };
  }

  try {
    if (command.signal === 'submit') {
      const state = createExchangeRequestWorkflow(
        requestId,
        String(command.payload.requesterOrgId ?? command.organizationId ?? ''),
        String(command.payload.providerOrgId ?? 'unknown'),
        String(command.payload.requesterName ?? command.actorId),
      );

      const finalState = await runExchangeRequestWorkflow(state, [toSignal(command)]);
      instances.set(requestId, finalState);

      return {
        workflowType: command.workflowType,
        signal: command.signal,
        status: finalState.finalDecision ? 'completed' : 'started',
        instanceKey: requestId,
        finalDecision: finalState.finalDecision,
      };
    }

    let state = instances.get(requestId);
    if (!state) {
      state = createExchangeRequestWorkflow(
        requestId,
        String(command.payload.requesterOrgId ?? command.organizationId ?? ''),
        String(command.payload.providerOrgId ?? 'unknown'),
        String(command.payload.requesterName ?? command.actorId),
      );
      state.currentStatus = 'under_review';
    }

    const { state: nextState } = processSignal(state, toSignal(command));
    instances.set(requestId, nextState);

    return {
      workflowType: command.workflowType,
      signal: command.signal,
      status: nextState.finalDecision ? 'completed' : 'signaled',
      instanceKey: requestId,
      finalDecision: nextState.finalDecision,
    };
  } catch (err) {
    return {
      workflowType: command.workflowType,
      signal: command.signal,
      status: 'failed',
      instanceKey: requestId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getExchangeRequestInstance(requestId: string): ExchangeRequestState | undefined {
  return instances.get(requestId);
}
