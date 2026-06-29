// ==========================================================================
// Kadarn Workflow Engine 2.0 — Public API
// ==========================================================================

export {
  startInstance,
  advance,
  suspendInstance,
  resumeInstance,
  cancelInstance,
  getNextStep,
  validateDefinition,
} from './engine';

export {
  dispatchWorkflowSignal,
  registerWorkflowHandler,
  listRegisteredWorkflowTypes,
  EXCHANGE_REQUEST_DEFINITION,
} from './runtime';

export type {
  WorkflowSignalCommand,
  WorkflowDispatchResult,
} from './runtime';

export type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowInstance,
  WorkflowTask,
  StepType,
  InstanceStatus,
  TaskStatus,
  WorkflowAdapter,
  PolicyEvaluator,
  PolicyResult,
} from './types';
