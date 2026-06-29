// ==========================================================================
// Kadarn Workflow Engine 2.0 — Core Engine
// ==========================================================================
// State machine for workflow execution. Integrates with the Policy Engine
// at every decision point.
// ==========================================================================

import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowInstance,
  WorkflowTask,
  InstanceStatus,
  TaskStatus,
  WorkflowAdapter,
  PolicyEvaluator,
} from './types';

// --------------------------------------------------------------------------
// startInstance — begin a new workflow
// --------------------------------------------------------------------------

export async function startInstance(
  adapter: WorkflowAdapter,
  definition: WorkflowDefinition,
  context: Record<string, unknown>,
  actorId: string,
  orgId?: string,
): Promise<WorkflowInstance> {
  if (definition.status !== 'active') {
    throw new Error(`Workflow definition "${definition.name}" is not active (status: ${definition.status})`);
  }

  if (definition.steps.length === 0) {
    throw new Error(`Workflow definition "${definition.name}" has no steps`);
  }

  const instance = await adapter.createInstance(definition, context, actorId, orgId);

  // Create the first task
  const firstStep = definition.steps[0];
  await adapter.createTask({
    instanceId: instance.id,
    stepId: firstStep.id,
    stepType: firstStep.type,
    status: stepHasAutoTrigger(firstStep) ? 'pending' : 'pending',
    config: firstStep.config,
  });

  return instance;
}

// --------------------------------------------------------------------------
// advance — process the current step and advance
// --------------------------------------------------------------------------

export async function advance(
  adapter: WorkflowAdapter,
  instance: WorkflowInstance,
  definition: WorkflowDefinition,
  policyEvaluator: PolicyEvaluator,
  actorId: string,
  taskResult?: Record<string, unknown>,
): Promise<{ instance: WorkflowInstance; nextTasks: WorkflowTask[] }> {
  const currentStep = definition.steps[instance.currentStepIndex];
  const nextTasks: WorkflowTask[] = [];

  // Process the current step
  let stepStatus: TaskStatus = 'completed';

  switch (currentStep.type) {
    case 'policy_check': {
      // Invoke Policy Engine
      const policyResult = await policyEvaluator(instance.context, currentStep.policyRefs);

      if (policyResult.outcome === 'deny') {
        await adapter.updateInstanceStatus(instance.id, 'blocked');
        return {
          instance: { ...instance, status: 'blocked' },
          nextTasks: [],
        };
      }

      if (policyResult.outcome === 'conditional') {
        // Keep instance at current step — human review required
        const reviewTask = await adapter.createTask({
          instanceId: instance.id,
          stepId: `review-${currentStep.id}`,
          stepType: 'human_task',
          status: 'pending',
          assignedTo: undefined,
          config: {
            ...currentStep.config,
            conditions: policyResult.conditions,
            originalStepId: currentStep.id,
          },
        });
        nextTasks.push(reviewTask);
        return {
          instance: { ...instance, status: 'suspended' },
          nextTasks,
        };
      }
      // allow: continue
      break;
    }

    case 'human_task': {
      stepStatus = taskResult ? 'completed' : 'pending';
      break;
    }

    case 'auto_action': {
      // Auto actions complete immediately (actual handler is app-layer)
      stepStatus = 'completed';
      break;
    }

    case 'wait': {
      stepStatus = 'completed'; // wait is just a marker; duration tracked via timeout
      break;
    }

    case 'sub_workflow': {
      stepStatus = 'completed'; // sub-workflow spawning is app-layer
      break;
    }
  }

  // Complete the current task
  const pendingTasks = await adapter.getPendingTasks(instance.id);
  for (const task of pendingTasks) {
    if (task.stepId === currentStep.id) {
      await adapter.updateTask(task.id, {
        status: stepStatus,
        result: taskResult,
        completedAt: new Date().toISOString(),
      });
    }
  }

  // Move to next step
  const nextIndex = instance.currentStepIndex + 1;

  if (nextIndex >= definition.steps.length) {
    // Workflow complete
    await adapter.updateInstanceStatus(instance.id, 'completed');
    return {
      instance: { ...instance, status: 'completed', currentStepIndex: nextIndex },
      nextTasks: [],
    };
  }

  // Create next step's task
  const nextStep = definition.steps[nextIndex];
  const nextTask = await adapter.createTask({
    instanceId: instance.id,
    stepId: nextStep.id,
    stepType: nextStep.type,
    status: 'pending',
    config: nextStep.config,
  });
  nextTasks.push(nextTask);

  return {
    instance: { ...instance, currentStepIndex: nextIndex, currentStepId: nextStep.id },
    nextTasks,
  };
}

// --------------------------------------------------------------------------
// suspend / resume / cancel
// --------------------------------------------------------------------------

export async function suspendInstance(
  adapter: WorkflowAdapter,
  instanceId: string,
): Promise<void> {
  await adapter.updateInstanceStatus(instanceId, 'suspended');
}

export async function resumeInstance(
  adapter: WorkflowAdapter,
  instanceId: string,
): Promise<void> {
  await adapter.updateInstanceStatus(instanceId, 'running');
}

export async function cancelInstance(
  adapter: WorkflowAdapter,
  instanceId: string,
): Promise<void> {
  await adapter.updateInstanceStatus(instanceId, 'cancelled');
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function stepHasAutoTrigger(step: WorkflowStep): boolean {
  return step.type === 'auto_action' || step.type === 'policy_check';
}

// --------------------------------------------------------------------------
// getNextStep — determine which step should execute next
// --------------------------------------------------------------------------

export function getNextStep(
  definition: WorkflowDefinition,
  currentIndex: number,
): WorkflowStep | null {
  if (currentIndex + 1 >= definition.steps.length) return null;
  return definition.steps[currentIndex + 1];
}

// --------------------------------------------------------------------------
// validateDefinition — check that a workflow definition is valid
// --------------------------------------------------------------------------

export function validateDefinition(definition: WorkflowDefinition): string[] {
  const errors: string[] = [];

  if (!definition.name) errors.push('Workflow name is required');
  if (!definition.steps || definition.steps.length === 0) errors.push('Workflow must have at least one step');

  const stepIds = new Set<string>();
  for (const step of definition.steps ?? []) {
    if (!step.id) errors.push('Each step must have an id');
    else if (stepIds.has(step.id)) errors.push(`Duplicate step id: ${step.id}`);
    else stepIds.add(step.id);

    if (!step.type) errors.push(`Step "${step.id}" must have a type`);
    if (!step.label) errors.push(`Step "${step.id}" must have a label`);
  }

  return errors;
}
