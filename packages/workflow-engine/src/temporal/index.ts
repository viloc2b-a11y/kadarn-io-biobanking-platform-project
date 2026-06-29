// ==========================================================================
// Kadarn Workflow Engine — Temporal Module Public API
// ==========================================================================
// KAA-002: Temporal Adoption
//
// Temporal-compatible workflow types, activities, and workflow definitions.
// No Temporal SDK dependency — pure TypeScript interfaces for unit testing.
// ==========================================================================

export { EXCHANGE_REQUEST_WORKFLOW_DEFINITION } from './exchange-request-workflow.js';

export {
  createExchangeRequestWorkflow,
  processSignal,
  executeStep,
  runExchangeRequestWorkflow,
  EXCHANGE_REQUEST_WORKFLOW_STEPS,
  REVIEW_TIMEOUT_MS,
  NEGOTIATION_TIMEOUT_MS,
} from './exchange-request-workflow.js';

export type { ExchangeRequestState, ExchangeRequestStep } from './exchange-request-workflow.js';

export {
  registerActivity,
  executeActivity,
  getActivityHandler,
} from './activities.js';

export type { ActivityType } from './activities.js';

export type {
  TemporalWorkflow,
  WorkflowStatus,
  TemporalActivity,
  TemporalSignal,
  TemporalTimer,
  ActivityResult,
  ActivityHandler,
  WorkflowContext,
  WorkflowDefinition,
  TemporalEngine,
} from './types.js';
