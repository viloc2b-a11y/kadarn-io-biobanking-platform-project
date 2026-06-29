// ==========================================================================
// Kadarn Workflow Engine — Temporal-Compatible Types
// ==========================================================================
// KAA-002 §6 (Core Concepts), §8 (Workflow Example)
//
// These types model Temporal concepts at the interface level:
//   - Workflow: durable function that orchestrates steps
//   - Activity: a single I/O step (call engine, notify, write)
//   - Signal: external event received by a running workflow
//   - Timer: a timeout set by the workflow
//
// No Temporal SDK dependency. These are pure TypeScript interfaces
// that can be replaced with real Temporal types when the SDK is added.
// ==========================================================================

// --------------------------------------------------------------------------
// Workflow identity
// --------------------------------------------------------------------------

export interface TemporalWorkflow {
  /** Unique workflow instance ID */
  id: string;
  /** Workflow type name (e.g. "exchange-request-workflow") */
  type: string;
  /** Current execution state */
  status: WorkflowStatus;
  /** Business context passed through all activities */
  context: Record<string, unknown>;
  /** Current step index in the workflow definition */
  currentStepIndex: number;
  /** When the workflow was started */
  startedAt: string;
  /** When the workflow completed or failed */
  completedAt?: string;
  /** Error reason if status is 'failed' */
  errorReason?: string;
}

export type WorkflowStatus =
  | 'running'
  | 'waiting_for_signal'
  | 'waiting_for_timer'
  | 'completed'
  | 'failed'
  | 'cancelled';

// --------------------------------------------------------------------------
// Activity
// --------------------------------------------------------------------------
// An activity is a single step that does I/O. In Temporal, activities are
// the only place where side effects (DB, API, filesystem) happen.
// Workflows are deterministic — they only schedule activities and wait.
// --------------------------------------------------------------------------

export interface TemporalActivity {
  /** Activity instance ID */
  id: string;
  /** Activity type name */
  type: string;
  /** ID of the workflow that owns this activity */
  workflowId: string;
  /** Input parameters */
  input: Record<string, unknown>;
  /** Output result (populated on completion) */
  output?: Record<string, unknown>;
  /** Error if the activity failed */
  error?: string;
  /** Activity status */
  status: 'pending' | 'running' | 'completed' | 'failed';
  /** When the activity was started */
  startedAt: string;
  /** When the activity completed */
  completedAt?: string;
  /** Number of retry attempts */
  retryAttempt: number;
}

/**
 * Activity result returned to the workflow after execution.
 */
export interface ActivityResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
}

/**
 * Function signature for an activity handler.
 */
export type ActivityHandler = (
  input: Record<string, unknown>,
  context: Record<string, unknown>,
) => Promise<ActivityResult>;

// --------------------------------------------------------------------------
// Signal
// --------------------------------------------------------------------------
// A signal is an external event delivered to a running workflow.
// Workflows can wait on signals — they pause until a signal arrives
// or a timer expires.
// --------------------------------------------------------------------------

export interface TemporalSignal {
  /** Signal type name */
  type: string;
  /** Signal payload */
  payload: Record<string, unknown>;
  /** When the signal was received */
  receivedAt: string;
}

// --------------------------------------------------------------------------
// Timer
// --------------------------------------------------------------------------
// A timer is a scheduled wake-up for timeout enforcement.
// When the timer fires, the workflow checks the deadline and acts.
// --------------------------------------------------------------------------

export interface TemporalTimer {
  /** Timer ID */
  id: string;
  /** Workflow ID */
  workflowId: string;
  /** ISO 8601 deadline */
  fireAt: string;
  /** Timer purpose (e.g. "review_timeout", "negotiation_timeout") */
  reason: string;
  /** Whether the timer has fired */
  fired: boolean;
}

// --------------------------------------------------------------------------
// Workflow execution context (passed through activities)
// --------------------------------------------------------------------------

export interface WorkflowContext {
  workflowId: string;
  workflowType: string;
  currentStep: string;
  state: Record<string, unknown>;
}

// --------------------------------------------------------------------------
// Workflow definition (what Temporal registers as a workflow type)
// --------------------------------------------------------------------------

export interface WorkflowDefinition {
  /** Workflow type name */
  name: string;
  /** Human-readable description */
  description: string;
  /** List of step names in execution order */
  steps: string[];
  /** Default timeout for waiting on signals (ms) */
  defaultSignalTimeoutMs: number;
}

// --------------------------------------------------------------------------
// Temporal engine interface
// --------------------------------------------------------------------------
// The engine is the bridge between Kadarn's existing WorkflowAdapter
// and Temporal-compatible workflow logic. It manages the execution
// loop: schedule activities, wait for signals/timers, advance steps.
//
// This interface can be implemented by:
//   - In-memory engine (unit tests)
//   - Temporal SDK adapter (production)
// --------------------------------------------------------------------------

export interface TemporalEngine {
  startWorkflow(workflowType: string, context: Record<string, unknown>): Promise<TemporalWorkflow>;
  signalWorkflow(workflowId: string, signal: TemporalSignal): Promise<void>;
  getWorkflowStatus(workflowId: string): Promise<TemporalWorkflow | null>;
}
