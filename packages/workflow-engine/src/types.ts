// ==========================================================================
// Kadarn Workflow Engine 2.0 — Type Definitions
// ==========================================================================
// ADR-017: Dynamic, Policy-Driven Orchestration
// KRM-RAO §5.3 (Workflow Engine)
// ==========================================================================

export type StepType = 'human_task' | 'policy_check' | 'auto_action' | 'sub_workflow' | 'wait';

export type WorkflowDefStatus = 'draft' | 'active' | 'deprecated';
export type InstanceStatus = 'running' | 'suspended' | 'completed' | 'blocked' | 'cancelled';
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'skipped' | 'failed';

// --------------------------------------------------------------------------
// Workflow definition
// --------------------------------------------------------------------------
export interface WorkflowStep {
  id: string;
  type: StepType;
  label: string;
  config?: Record<string, unknown>;
  assigneeRole?: string;
  timeoutMinutes?: number;
  /** For policy_check steps: which policy IDs or domains to evaluate */
  policyRefs?: string[];
  /** For auto_action: which function/task to execute */
  actionHandler?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: WorkflowDefStatus;
  steps: WorkflowStep[];
  metadata: Record<string, unknown>;
}

// --------------------------------------------------------------------------
// Workflow instance
// --------------------------------------------------------------------------
export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: InstanceStatus;
  context: Record<string, unknown>;
  currentStepId?: string;
  currentStepIndex: number;
  startedAt: string;
  completedAt?: string;
}

// --------------------------------------------------------------------------
// Workflow task
// --------------------------------------------------------------------------
export interface WorkflowTask {
  id: string;
  instanceId: string;
  stepId: string;
  stepType: StepType;
  status: TaskStatus;
  assignedTo?: string;
  config?: Record<string, unknown>;
  result?: Record<string, unknown>;
  notes?: string;
  completedAt?: string;
}

// --------------------------------------------------------------------------
// Adapter
// --------------------------------------------------------------------------
export interface WorkflowAdapter {
  createInstance(def: WorkflowDefinition, context: Record<string, unknown>, actorId: string, orgId?: string): Promise<WorkflowInstance>;
  updateInstanceStatus(id: string, status: InstanceStatus): Promise<void>;
  getInstance(id: string): Promise<WorkflowInstance | null>;
  createTask(task: Omit<WorkflowTask, 'id'>): Promise<WorkflowTask>;
  updateTask(id: string, updates: Partial<WorkflowTask>): Promise<void>;
  getPendingTasks(instanceId: string): Promise<WorkflowTask[]>;
}

// --------------------------------------------------------------------------
// Policy evaluation result (external — from Policy Engine)
// --------------------------------------------------------------------------
export interface PolicyResult {
  outcome: 'allow' | 'deny' | 'conditional';
  conditions?: string[];
}

/**
 * Policy evaluator function injected by the application layer.
 * This keeps the Workflow Engine decoupled from the Policy Engine.
 */
export type PolicyEvaluator = (
  context: Record<string, unknown>,
  policyRefs?: string[],
) => Promise<PolicyResult>;
