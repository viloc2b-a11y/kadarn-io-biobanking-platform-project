// ==========================================================================
// Workflow Runtime — Types
// ==========================================================================

export interface WorkflowSignalCommand {
  workflowType: string;
  signal: string;
  payload: Record<string, unknown>;
  correlationId: string;
  actorId: string;
  organizationId?: string | null;
}

export type WorkflowDispatchStatus =
  | 'started'
  | 'signaled'
  | 'completed'
  | 'ignored'
  | 'failed';

export interface WorkflowDispatchResult {
  workflowType: string;
  signal: string;
  status: WorkflowDispatchStatus;
  instanceKey?: string;
  finalDecision?: string;
  error?: string;
}

export type WorkflowSignalHandler = (
  command: WorkflowSignalCommand,
) => Promise<WorkflowDispatchResult>;
