// ==========================================================================
// Workflow Runtime — Signal dispatcher
// ==========================================================================

import { handleExchangeRequestSignal } from './handlers/exchange-request';
import type {
  WorkflowDispatchResult,
  WorkflowSignalCommand,
  WorkflowSignalHandler,
} from './types';

const handlers = new Map<string, WorkflowSignalHandler>([
  ['exchange-request-workflow', handleExchangeRequestSignal],
]);

export function registerWorkflowHandler(
  workflowType: string,
  handler: WorkflowSignalHandler,
): void {
  handlers.set(workflowType, handler);
}

export function listRegisteredWorkflowTypes(): string[] {
  return [...handlers.keys()];
}

export async function dispatchWorkflowSignal(
  command: WorkflowSignalCommand,
): Promise<WorkflowDispatchResult> {
  const handler = handlers.get(command.workflowType);
  if (!handler) {
    return {
      workflowType: command.workflowType,
      signal: command.signal,
      status: 'ignored',
    };
  }

  return handler(command);
}

export { resetExchangeRequestInstances, getExchangeRequestInstance } from './handlers/exchange-request';
