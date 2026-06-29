// ==========================================================================
// Kadarn Workflow Engine — Temporal Module Public API
// ==========================================================================
// KAA-002: Temporal Adoption
//
// Temporal-compatible workflow types, activities, and workflow definitions.
// No Temporal SDK dependency — pure TypeScript interfaces for unit testing.
// ==========================================================================

export { EXCHANGE_REQUEST_WORKFLOW_DEFINITION } from './exchange-request-workflow';

export {
  createExchangeRequestWorkflow,
  processSignal,
  executeStep,
  runExchangeRequestWorkflow,
  EXCHANGE_REQUEST_WORKFLOW_STEPS,
  REVIEW_TIMEOUT_MS,
  NEGOTIATION_TIMEOUT_MS,
} from './exchange-request-workflow';

export type { ExchangeRequestState, ExchangeRequestStep } from './exchange-request-workflow';

export {
  registerActivity,
  executeActivity,
  getActivityHandler,
} from './activities';

export type { ActivityType } from './activities';

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
} from './types';
