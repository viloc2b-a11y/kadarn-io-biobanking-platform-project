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
} from './engine.js';

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
} from './types.js';
