// ==========================================================================
// Kadarn Workflow Engine — Exchange Request Workflow
// ==========================================================================
// KAA-002 §8 (Workflow Example)
//
// This is the Temporal PoC workflow selected in KPE-06.
//
// The Exchange Request workflow coordinates the lifecycle of a research
// access request from submission through review, negotiation, and
// final disposition (accepted / declined / withdrawn).
//
// Workflow states (matching exchange_request_status enum):
//   draft → submitted → under_review → negotiation → accepted / declined
//
// Signals:
//   - submit(requestId, orgId, requester)    → start the workflow
//   - reviewerAction(requestId, action, reason) → approve, decline, or request changes
//   - mtaSigned(requestId, orgId)             → MTA countersigned
//   - withdraw(requestId, reason)             → requester withdraws
//   - escalate(requestId, reason)             → escalate to platform admin
//
// Timers:
//   - review_timeout: if no reviewer action within N days → auto-escalate
//   - negotiation_timeout: if MTA not signed within N days → auto-decline
// ==========================================================================

import type {
  TemporalWorkflow,
  WorkflowStatus,
  TemporalSignal,
  ActivityResult,
} from './types.js';
import { executeActivity } from './activities.js';

// --------------------------------------------------------------------------
// Workflow steps (matching Temporal step definitions)
// --------------------------------------------------------------------------

export const EXCHANGE_REQUEST_WORKFLOW_STEPS = [
  'receive_submission',
  'notify_reviewer',
  'wait_review',
  'assess_review',
  'notify_negotiation',
  'wait_mta',
  'assess_mta',
  'finalize',
] as const;

export type ExchangeRequestStep = (typeof EXCHANGE_REQUEST_WORKFLOW_STEPS)[number];

// --------------------------------------------------------------------------
// Exchange Request workflow state
// --------------------------------------------------------------------------
// In Temporal, this is the workflow state that lives across activity
// executions and is persisted in Temporal's event log.
// --------------------------------------------------------------------------

export interface ExchangeRequestState {
  /** Exchange request ID from the database */
  requestId: string;
  /** Current Kadarn exchange_request status */
  currentStatus: string;
  /** Organization that submitted the request */
  requesterOrgId: string;
  /** Organization that will review (provider) */
  providerOrgId: string;
  /** User who submitted */
  requesterName: string;
  /** Workflow step index */
  currentStepIndex: number;
  /** ISO 8601 deadline for review timeout */
  reviewDeadline?: string;
  /** ISO 8601 deadline for MTA negotiation timeout */
  negotiationDeadline?: string;
  /** Final decision */
  finalDecision?: 'accepted' | 'declined' | 'withdrawn';
  /** Final decision reason */
  decisionReason?: string;
  /** Error if workflow failed */
  error?: string;
}

// --------------------------------------------------------------------------
// Default timeout values (milliseconds)
// --------------------------------------------------------------------------

export const REVIEW_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;  // 7 days
export const NEGOTIATION_TIMEOUT_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// --------------------------------------------------------------------------
// Create initial workflow state
// --------------------------------------------------------------------------

export function createExchangeRequestWorkflow(
  requestId: string,
  requesterOrgId: string,
  providerOrgId: string,
  requesterName: string,
): ExchangeRequestState {
  return {
    requestId,
    currentStatus: 'submitted',
    requesterOrgId,
    providerOrgId,
    requesterName,
    currentStepIndex: 0,
  };
}

// --------------------------------------------------------------------------
// Process a signal against the workflow
// --------------------------------------------------------------------------

export function processSignal(
  state: ExchangeRequestState,
  signal: TemporalSignal,
): { state: ExchangeRequestState; actions: string[] } {
  const actions: string[] = [];

  switch (signal.type) {
    case 'submit': {
      if (state.currentStatus === 'draft') {
        state.currentStatus = 'submitted';
        actions.push('status_changed: draft → submitted');
      }
      break;
    }

    case 'reviewerAction': {
      const action = signal.payload['action'] as string;
      const reason = (signal.payload['reason'] as string) ?? '';

      if (action === 'approve') {
        state.currentStatus = 'negotiation';
        state.currentStepIndex = 4; // notify_negotiation
        actions.push(`status_changed: under_review → negotiation`);
      } else if (action === 'decline') {
        state.currentStatus = 'declined';
        state.finalDecision = 'declined';
        state.decisionReason = reason;
        state.currentStepIndex = EXCHANGE_REQUEST_WORKFLOW_STEPS.length - 1; // finalize
        actions.push(`status_changed: under_review → declined`);
      }
      break;
    }

    case 'mtaSigned': {
      if (state.currentStatus === 'negotiation') {
        state.currentStatus = 'accepted';
        state.finalDecision = 'accepted';
        state.currentStepIndex = EXCHANGE_REQUEST_WORKFLOW_STEPS.length - 1; // finalize
        actions.push(`status_changed: negotiation → accepted`);
      }
      break;
    }

    case 'withdraw': {
      if (['submitted', 'under_review', 'negotiation'].includes(state.currentStatus)) {
        state.currentStatus = 'withdrawn';
        state.finalDecision = 'withdrawn';
        state.decisionReason = (signal.payload['reason'] as string) ?? '';
        state.currentStepIndex = EXCHANGE_REQUEST_WORKFLOW_STEPS.length - 1; // finalize
        actions.push(`status_changed: ${state.currentStatus} → withdrawn`);
      }
      break;
    }

    case 'escalate': {
      actions.push(`escalated: ${(signal.payload['reason'] as string) ?? 'no reason'}`);
      break;
    }

    default:
      actions.push(`unknown_signal: ${signal.type}`);
  }

  return { state, actions };
}

// --------------------------------------------------------------------------
// Execute one workflow step and return the next state
// --------------------------------------------------------------------------
// In Temporal, each step is either:
//   - An activity execution (I/O)
//   - A signal wait (pause until human action or timer)
//   - A decision based on previous activity results
//
// For the PoC, this is a synchronous function that returns
// the next status. In production with Temporal, each step
// would be a separate activity execution.
// --------------------------------------------------------------------------

export async function executeStep(
  state: ExchangeRequestState,
  stepName: string,
): Promise<{ state: ExchangeRequestState; result: ActivityResult | null }> {
  let result: ActivityResult | null = null;

  switch (stepName) {
    case 'receive_submission': {
      result = await executeActivity(
        'log_activity',
        { workflowId: state.requestId, event: 'request_submitted', details: { requester: state.requesterName } },
        {},
      );
      break;
    }

    case 'notify_reviewer': {
      result = await executeActivity('notify_reviewer', {
        organizationId: state.providerOrgId,
        requestId: state.requestId,
        requesterName: state.requesterName,
        submittedAt: new Date().toISOString(),
      }, {});

      if (result.success) {
        state.currentStatus = 'under_review';
        state.reviewDeadline = new Date(Date.now() + REVIEW_TIMEOUT_MS).toISOString();
      }
      break;
    }

    case 'wait_review': {
      // In Temporal, this step blocks until a signal or timer fires.
      // In the PoC, it's a pass-through — the test engine handles waiting.
      break;
    }

    case 'assess_review': {
      if (state.currentStatus === 'under_review' && state.reviewDeadline) {
        result = await executeActivity('assess_request_timeout', {
          requestId: state.requestId,
          deadline: state.reviewDeadline,
          currentStatus: state.currentStatus,
        }, {});

        if (result.success && result.output?.['timedOut']) {
          // Auto-escalate on timeout
          result = await executeActivity('notify_parties', {
            requestId: state.requestId,
            status: 'escalated',
            parties: [{ organizationId: state.providerOrgId, role: 'admin' }],
            message: 'Review deadline expired — auto-escalated',
          }, {});
        }
      }
      break;
    }

    case 'notify_negotiation': {
      result = await executeActivity('notify_parties', {
        requestId: state.requestId,
        status: 'negotiation',
        parties: [
          { organizationId: state.requesterOrgId, role: 'requester' },
          { organizationId: state.providerOrgId, role: 'provider' },
        ],
        message: 'Request approved — MTA negotiation phase',
      }, {});

      if (result.success) {
        state.negotiationDeadline = new Date(Date.now() + NEGOTIATION_TIMEOUT_MS).toISOString();
      }
      break;
    }

    case 'wait_mta': {
      // In Temporal, this step blocks until MTA signed signal or timer.
      break;
    }

    case 'assess_mta': {
      if (state.currentStatus === 'negotiation' && state.negotiationDeadline) {
        result = await executeActivity('assess_request_timeout', {
          requestId: state.requestId,
          deadline: state.negotiationDeadline,
          currentStatus: state.currentStatus,
        }, {});

        if (result.success && result.output?.['timedOut']) {
          // Auto-decline on MTA timeout
          state.currentStatus = 'declined';
          state.finalDecision = 'declined';
          state.decisionReason = 'MTA negotiation deadline expired';
        }
      }
      break;
    }

    case 'finalize': {
      const finalStatus = state.finalDecision ?? 'declined';

      // Update the request in the database
      result = await executeActivity('update_request_status', {
        requestId: state.requestId,
        newStatus: finalStatus === 'accepted' ? 'accepted' : 'declined',
        updatedBy: 'exchange-request-workflow',
        reason: state.decisionReason,
      }, {});

      // Notify all parties
      await executeActivity('notify_parties', {
        requestId: state.requestId,
        status: finalStatus,
        parties: [
          { organizationId: state.requesterOrgId, role: 'requester' },
          { organizationId: state.providerOrgId, role: 'provider' },
        ],
        message: `Exchange request ${finalStatus}`,
      }, {});

      state.currentStatus = finalStatus;

      // Log finalization
      await executeActivity('log_activity', {
        event: 'workflow_completed',
        details: { requestId: state.requestId, decision: finalStatus },
      }, {});
      break;
    }

    default:
      return {
        state,
        result: { success: false, error: `Unknown step: ${stepName}` },
      };
  }

  return { state, result };
}

// --------------------------------------------------------------------------
// Run the full workflow (for test engine / in-memory execution)
// --------------------------------------------------------------------------
// In Temporal, this is the workflow function registered with the worker.
// The Temporal runtime handles retries, timers, and signal delivery.
//
// For unit tests, we call this function directly — it executes
// each step sequentially, processing signals in between.
// --------------------------------------------------------------------------

export async function runExchangeRequestWorkflow(
  initialState: ExchangeRequestState,
  signals: TemporalSignal[] = [],
): Promise<ExchangeRequestState> {
  let state = { ...initialState };
  let signalIndex = 0;

  for (let i = 0; i < EXCHANGE_REQUEST_WORKFLOW_STEPS.length; i++) {
    const stepName = EXCHANGE_REQUEST_WORKFLOW_STEPS[i];
    state.currentStepIndex = i;

    // Process any pending signals before this step
    while (signalIndex < signals.length) {
      const signal = signals[signalIndex];

      // Check if the signal is relevant to the current step
      if (isSignalRelevant(signal, stepName, state)) {
        const { state: newState } = processSignal(state, signal);
        state = newState;
        signalIndex++;

        // If the signal changed the status to a terminal state, jump to finalize
        if (state.finalDecision) {
          i = EXCHANGE_REQUEST_WORKFLOW_STEPS.length - 2; // finalize is last
          break;
        }
      } else {
        // Signal not relevant yet — skip and keep it for later
        signalIndex++;
        continue;
      }
    }

    // Execute this step
    const { state: stepState } = await executeStep(state, stepName);
    state = stepState;

    // If we reached a terminal state, stop
    if (state.finalDecision && stepName === 'finalize') {
      break;
    }
  }

  return state;
}

// --------------------------------------------------------------------------
// Helper: determine if a signal is relevant for the current step
// --------------------------------------------------------------------------

function isSignalRelevant(
  signal: TemporalSignal,
  _stepName: string,
  state: ExchangeRequestState,
): boolean {
  // After the workflow is in a terminal state, no more signals
  if (state.finalDecision) return false;

  return true;
}

// --------------------------------------------------------------------------
// Workflow definition metadata
// --------------------------------------------------------------------------

export const EXCHANGE_REQUEST_WORKFLOW_DEFINITION = {
  name: 'exchange-request-workflow',
  description: 'Coordinates the lifecycle of a research access request from submission through review, negotiation, and final disposition',
  steps: [...EXCHANGE_REQUEST_WORKFLOW_STEPS],
  defaultSignalTimeoutMs: 7 * 24 * 60 * 60 * 1000,
};
