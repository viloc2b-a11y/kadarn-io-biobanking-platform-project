// ==========================================================================
// Kadarn Workflow Engine — Exchange Request Activities
// ==========================================================================
// KAA-002 §8 (Workflow Example)
//
// Activities are the I/O layer of Temporal workflows. Each activity:
//   - Performs one unit of work (DB call, notification, engine call)
//   - Can be retried independently with configurable backoff
//   - Returns a result to the workflow for state decisions
//
// In Temporal, activities are the ONLY place side effects happen.
// Workflows are deterministic — they schedule activities and wait.
//
// These stubs are Temporal-compatible interfaces. The actual
// implementations (email, DB, notification) are injected at runtime.
// ==========================================================================

import type {
  TemporalActivity,
  ActivityResult,
  ActivityHandler,
} from './types.js';

// --------------------------------------------------------------------------
// Activity registry
// --------------------------------------------------------------------------
// Maps activity type names to their handler functions.
// Used by the test engine to dispatch activity execution.
// --------------------------------------------------------------------------

export type ActivityType =
  | 'notify_reviewer'
  | 'update_request_status'
  | 'notify_parties'
  | 'assess_request_timeout'
  | 'log_activity';

const activityRegistry = new Map<ActivityType, ActivityHandler>();

// --------------------------------------------------------------------------
// Register an activity handler
// --------------------------------------------------------------------------

export function registerActivity(
  type: ActivityType,
  handler: ActivityHandler,
): void {
  activityRegistry.set(type, handler);
}

// --------------------------------------------------------------------------
// Get an activity handler by type
// --------------------------------------------------------------------------

export function getActivityHandler(
  type: ActivityType,
): ActivityHandler | undefined {
  return activityRegistry.get(type);
}

// --------------------------------------------------------------------------
// Execute an activity and return the result
// --------------------------------------------------------------------------

export async function executeActivity(
  type: ActivityType,
  input: Record<string, unknown>,
  context: Record<string, unknown>,
): Promise<ActivityResult> {
  const handler = activityRegistry.get(type);
  if (!handler) {
    return {
      success: false,
      error: `Unknown activity type: ${type}`,
    };
  }
  try {
    return await handler(input, context);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------------------------
// Default activity stubs (replaceable at runtime)
// --------------------------------------------------------------------------

/**
 * Notify a human reviewer that a new exchange request needs assessment.
 *
 * Input:
 *   - organizationId: string
 *   - requestId: string
 *   - requesterName: string
 *   - submittedAt: string
 *
 * In production, this would send email, push notification, or create
 * a platform task. For the PoC, it records the notification.
 */
registerActivity('notify_reviewer', async (input) => {
  const { organizationId, requestId } = input;

  if (!organizationId || !requestId) {
    return {
      success: false,
      error: 'notify_reviewer requires organizationId and requestId',
    };
  }

  return {
    success: true,
    output: {
      notified: true,
      notifiedAt: new Date().toISOString(),
      organizationId,
      requestId,
      channel: 'stub',
    },
  };
});

/**
 * Update the exchange request status in the database.
 *
 * Input:
 *   - requestId: string
 *   - newStatus: string
 *   - updatedBy: string
 *   - reason?: string
 *
 * In production, calls the Exchange Engine to transition status.
 * For the PoC, returns success.
 */
registerActivity('update_request_status', async (input) => {
  const { requestId, newStatus } = input;

  if (!requestId || !newStatus) {
    return {
      success: false,
      error: 'update_request_status requires requestId and newStatus',
    };
  }

  return {
    success: true,
    output: {
      requestId,
      previousStatus: input['previousStatus'] ?? 'unknown',
      newStatus,
      updatedAt: new Date().toISOString(),
    },
  };
});

/**
 * Notify all relevant parties about a status change.
 *
 * Input:
 *   - requestId: string
 *   - status: string
 *   - parties: Array<{ organizationId: string; role: string }>
 *   - message?: string
 */
registerActivity('notify_parties', async (input) => {
  const { requestId, status, parties } = input;

  if (!requestId) {
    return {
      success: false,
      error: 'notify_parties requires requestId',
    };
  }

  return {
    success: true,
    output: {
      notified: true,
      requestId,
      status,
      partiesNotified: Array.isArray(parties) ? parties.length : 0,
      notifiedAt: new Date().toISOString(),
    },
  };
});

/**
 * Check if a review or negotiation has timed out.
 *
 * Input:
 *   - requestId: string
 *   - deadline: string (ISO 8601)
 *   - currentStatus: string
 *
 * Returns:
 *   - timedOut: boolean
 *   - message: string
 */
registerActivity('assess_request_timeout', async (input) => {
  const { deadline } = input;

  if (!deadline) {
    return { success: false, error: 'assess_request_timeout requires deadline' };
  }

  const deadlineDate = new Date(deadline as string);
  const now = new Date();
  const timedOut = now > deadlineDate;

  return {
    success: true,
    output: {
      timedOut,
      deadline,
      now: now.toISOString(),
      message: timedOut
        ? 'Review deadline has expired'
        : 'Review deadline has not yet expired',
    },
  };
});

/**
 * Log a workflow event for audit.
 *
 * Input:
 *   - workflowId: string
 *   - event: string
 *   - details?: Record<string, unknown>
 */
registerActivity('log_activity', async (input) => {
  return {
    success: true,
    output: {
      logged: true,
      loggedAt: new Date().toISOString(),
      event: input['event'],
    },
  };
});
