// ==========================================================================
// Kadarn Workflow Engine — Exchange Request Workflow Tests
// ==========================================================================
// KAA-002 §8 (Workflow Example)
//
// Unit tests for the Exchange Request Temporal workflow.
// No Temporal server required — workflow is tested in-memory.
//
// Tests prove:
//   1. Workflow progresses through all states
//   2. Signals (approve, decline, withdraw) are handled correctly
//   3. Timeout assessment works
//   4. Activities execute and return results
//   5. Terminal states (accepted, declined, withdrawn) end the workflow
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createExchangeRequestWorkflow,
  processSignal,
  runExchangeRequestWorkflow,
  EXCHANGE_REQUEST_WORKFLOW_STEPS,
} from '../src/temporal/exchange-request-workflow.js';
import { executeActivity } from '../src/temporal/activities.js';
import type { TemporalSignal, ActivityResult } from '../src/temporal/types.js';

// ---------------------------------------------------------------------------
// createExchangeRequestWorkflow
// ---------------------------------------------------------------------------

describe('createExchangeRequestWorkflow()', () => {
  it('creates initial state with submitted status', () => {
    const state = createExchangeRequestWorkflow(
      'req-001', 'org-requester', 'org-provider', 'Dr. Smith',
    );

    expect(state.requestId).toBe('req-001');
    expect(state.requesterOrgId).toBe('org-requester');
    expect(state.providerOrgId).toBe('org-provider');
    expect(state.requesterName).toBe('Dr. Smith');
    expect(state.currentStatus).toBe('submitted');
    expect(state.currentStepIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// processSignal
// ---------------------------------------------------------------------------

describe('processSignal()', () => {
  let state: ReturnType<typeof createExchangeRequestWorkflow>;

  beforeEach(() => {
    state = createExchangeRequestWorkflow('req-001', 'org-r', 'org-p', 'Dr. Smith');
  });

  it('handles submit signal: draft → submitted', () => {
    state.currentStatus = 'draft';
    const signal: TemporalSignal = {
      type: 'submit',
      payload: {},
      receivedAt: new Date().toISOString(),
    };
    const { state: newState, actions } = processSignal(state, signal);
    expect(newState.currentStatus).toBe('submitted');
    expect(actions).toContain('status_changed: draft → submitted');
  });

  it('handles reviewerAction approve signal: → negotiation', () => {
    state.currentStatus = 'under_review';
    const signal: TemporalSignal = {
      type: 'reviewerAction',
      payload: { action: 'approve', reason: 'Looks good' },
      receivedAt: new Date().toISOString(),
    };
    const { state: newState, actions } = processSignal(state, signal);
    expect(newState.currentStatus).toBe('negotiation');
    expect(actions[0]).toContain('negotiation');
  });

  it('handles reviewerAction decline signal: → declined', () => {
    state.currentStatus = 'under_review';
    const signal: TemporalSignal = {
      type: 'reviewerAction',
      payload: { action: 'decline', reason: 'Insufficient documentation' },
      receivedAt: new Date().toISOString(),
    };
    const { state: newState, actions } = processSignal(state, signal);
    expect(newState.currentStatus).toBe('declined');
    expect(newState.finalDecision).toBe('declined');
    expect(newState.decisionReason).toBe('Insufficient documentation');
  });

  it('handles mtaSigned signal: → accepted', () => {
    state.currentStatus = 'negotiation';
    const signal: TemporalSignal = {
      type: 'mtaSigned',
      payload: { organizationId: 'org-p' },
      receivedAt: new Date().toISOString(),
    };
    const { state: newState } = processSignal(state, signal);
    expect(newState.currentStatus).toBe('accepted');
    expect(newState.finalDecision).toBe('accepted');
  });

  it('handles withdraw signal from any active status', () => {
    state.currentStatus = 'under_review';
    const signal: TemporalSignal = {
      type: 'withdraw',
      payload: { reason: 'Change of scope' },
      receivedAt: new Date().toISOString(),
    };
    const { state: newState } = processSignal(state, signal);
    expect(newState.currentStatus).toBe('withdrawn');
    expect(newState.finalDecision).toBe('withdrawn');
  });

  it('handles escalate signal without status change', () => {
    state.currentStatus = 'under_review';
    const signal: TemporalSignal = {
      type: 'escalate',
      payload: { reason: 'No response in 7 days' },
      receivedAt: new Date().toISOString(),
    };
    const { state: newState } = processSignal(state, signal);
    // Escalation doesn't change status — it's a notification
    expect(newState.currentStatus).toBe('under_review');
  });

  it('returns empty actions for unknown signal types', () => {
    const signal: TemporalSignal = {
      type: 'unknown_signal_type',
      payload: {},
      receivedAt: new Date().toISOString(),
    };
    const { actions } = processSignal(state, signal);
    expect(actions[0]).toContain('unknown_signal');
  });
});

// ---------------------------------------------------------------------------
// executeActivity
// ---------------------------------------------------------------------------

describe('executeActivity()', () => {
  it('calls registered handler and returns result', async () => {
    const result = await executeActivity('notify_reviewer', {
      organizationId: 'org-p',
      requestId: 'req-001',
      requesterName: 'Dr. Smith',
      submittedAt: new Date().toISOString(),
    }, {});

    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
    expect(result.output!['notified']).toBe(true);
    expect(result.output!['requestId']).toBe('req-001');
  });

  it('returns error for unknown activity type', async () => {
    const result = await executeActivity('nonexistent_activity' as never, {}, {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown activity type');
  });

  it('validates required input parameters', async () => {
    const result = await executeActivity('notify_reviewer', {
      // Missing organizationId and requestId
      requesterName: 'Dr. Smith',
    }, {});

    expect(result.success).toBe(false);
    expect(result.error).toContain('organizationId');
  });

  it('update_request_status returns expected output shape', async () => {
    const result = await executeActivity('update_request_status', {
      requestId: 'req-001',
      newStatus: 'accepted',
      previousStatus: 'negotiation',
    }, {});

    expect(result.success).toBe(true);
    expect(result.output!['newStatus']).toBe('accepted');
    expect(result.output!['requestId']).toBe('req-001');
  });

  it('assess_request_timeout detects timeout correctly', async () => {
    const past = new Date(Date.now() - 1000).toISOString(); // 1 second ago
    const result = await executeActivity('assess_request_timeout', {
      requestId: 'req-001',
      deadline: past,
      currentStatus: 'under_review',
    }, {});

    expect(result.success).toBe(true);
    expect(result.output!['timedOut']).toBe(true);
  });

  it('assess_request_timeout identifies non-expired deadlines', async () => {
    const future = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
    const result = await executeActivity('assess_request_timeout', {
      requestId: 'req-001',
      deadline: future,
      currentStatus: 'under_review',
    }, {});

    expect(result.success).toBe(true);
    expect(result.output!['timedOut']).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Full workflow execution
// ---------------------------------------------------------------------------

describe('runExchangeRequestWorkflow() — full flow', () => {
  it('completes happy path: submitted → under_review → negotiation → accepted', async () => {
    const initialState = createExchangeRequestWorkflow(
      'req-001', 'org-r', 'org-p', 'Dr. Smith',
    );

    // Simulate a reviewer approving mid-workflow
    const signals: TemporalSignal[] = [
      {
        type: 'reviewerAction',
        payload: { action: 'approve', reason: 'Approved' },
        receivedAt: new Date().toISOString(),
      },
      {
        type: 'mtaSigned',
        payload: { organizationId: 'org-p' },
        receivedAt: new Date().toISOString(),
      },
    ];

    const finalState = await runExchangeRequestWorkflow(initialState, signals);

    expect(finalState.finalDecision).toBe('accepted');
    expect(finalState.currentStatus).toBe('accepted');
  });

  it('completes declined path: submitted → under_review → declined', async () => {
    const initialState = createExchangeRequestWorkflow(
      'req-002', 'org-r', 'org-p', 'Dr. Jones',
    );

    const signals: TemporalSignal[] = [
      {
        type: 'reviewerAction',
        payload: { action: 'decline', reason: 'Out of scope' },
        receivedAt: new Date().toISOString(),
      },
    ];

    const finalState = await runExchangeRequestWorkflow(initialState, signals);

    expect(finalState.finalDecision).toBe('declined');
    expect(finalState.currentStatus).toBe('declined');
    expect(finalState.decisionReason).toBe('Out of scope');
  });

  it('completes withdrawn path: submitted → withdrawn', async () => {
    const initialState = createExchangeRequestWorkflow(
      'req-003', 'org-r', 'org-p', 'Dr. Lee',
    );

    const signals: TemporalSignal[] = [
      {
        type: 'withdraw',
        payload: { reason: 'No longer needed' },
        receivedAt: new Date().toISOString(),
      },
    ];

    const finalState = await runExchangeRequestWorkflow(initialState, signals);

    expect(finalState.finalDecision).toBe('withdrawn');
    expect(finalState.currentStatus).toBe('withdrawn');
  });

  it('processes signals at the correct workflow step', async () => {
    const initialState = createExchangeRequestWorkflow(
      'req-004', 'org-r', 'org-p', 'Dr. X',
    );

    // Withdraw signal comes before reviewer action
    const signals: TemporalSignal[] = [
      {
        type: 'withdraw',
        payload: { reason: 'Duplicate request' },
        receivedAt: new Date().toISOString(),
      },
      {
        type: 'reviewerAction',
        payload: { action: 'approve' },
        receivedAt: new Date().toISOString(),
      },
    ];

    const finalState = await runExchangeRequestWorkflow(initialState, signals);

    // Withdraw happens first → terminal state → approve is skipped
    expect(finalState.finalDecision).toBe('withdrawn');
  });

  it('workflow steps are defined in correct order', () => {
    expect(EXCHANGE_REQUEST_WORKFLOW_STEPS).toEqual([
      'receive_submission',
      'notify_reviewer',
      'wait_review',
      'assess_review',
      'notify_negotiation',
      'wait_mta',
      'assess_mta',
      'finalize',
    ]);
  });
});

// ---------------------------------------------------------------------------
// Activity registry isolation
// ---------------------------------------------------------------------------

describe('Activity isolation', () => {
  it('each workflow run has independent activity results', async () => {
    // Run two workflows with different outcomes
    const acceptedState = createExchangeRequestWorkflow('a', 'org-1', 'org-2', 'A');
    const declinedState = createExchangeRequestWorkflow('b', 'org-1', 'org-2', 'B');

    const acceptedResult = await runExchangeRequestWorkflow(acceptedState, [
      { type: 'reviewerAction', payload: { action: 'approve' }, receivedAt: new Date().toISOString() },
      { type: 'mtaSigned', payload: {}, receivedAt: new Date().toISOString() },
    ]);

    const declinedResult = await runExchangeRequestWorkflow(declinedState, [
      { type: 'reviewerAction', payload: { action: 'decline', reason: 'N/A' }, receivedAt: new Date().toISOString() },
    ]);

    expect(acceptedResult.finalDecision).toBe('accepted');
    expect(declinedResult.finalDecision).toBe('declined');
    expect(acceptedResult.requestId).not.toBe(declinedResult.requestId);
  });
});
