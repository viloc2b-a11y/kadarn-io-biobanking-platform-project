// ==========================================================================
// Kadarn Workflow Engine 2.0 — Unit Tests
// ==========================================================================
// Tests cover: start instance, advance through steps, policy check (allow/deny/conditional),
// suspend/resume/cancel, definition validation, multi-step workflow completion.
// ==========================================================================

import { describe, it, expect, vi } from 'vitest';
import {
  startInstance,
  advance,
  suspendInstance,
  resumeInstance,
  cancelInstance,
  validateDefinition,
  getNextStep,
} from '../packages/workflow-engine/src/engine.js';

import type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowTask,
  WorkflowAdapter,
  PolicyEvaluator,
} from '../packages/workflow-engine/src/types.js';

// --------------------------------------------------------------------------
// Mock adapter
// --------------------------------------------------------------------------

function createMockAdapter(): WorkflowAdapter {
  const tasks: WorkflowTask[] = [];
  let instanceCounter = 0;

  return {
    async createInstance(def, context, actorId, orgId) {
      instanceCounter++;
      return {
        id: `wf-${instanceCounter}`,
        definitionId: def.id,
        status: 'running',
        context,
        currentStepIndex: 0,
        startedAt: new Date().toISOString(),
      };
    },

    async updateInstanceStatus(id, status) { /* no-op for mock */ },

    async getInstance(id) {
      return null; // simplified for tests that don't need it
    },

    async createTask(task) {
      const newTask: WorkflowTask = {
        id: `task-${tasks.length + 1}`,
        ...task,
      };
      tasks.push(newTask);
      return newTask;
    },

    async updateTask(id, updates) {
      const task = tasks.find((t) => t.id === id);
      if (task) Object.assign(task, updates);
    },

    async getPendingTasks(instanceId) {
      return tasks.filter(
        (t) => t.instanceId === instanceId && t.status === 'pending',
      );
    },
  };
}

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

const approvalWorkflow: WorkflowDefinition = {
  id: 'wf-access-request',
  name: 'Specimen Access Request',
  description: 'Standard workflow for requesting specimen access',
  version: 1,
  status: 'active',
  steps: [
    { id: 'submit', type: 'human_task', label: 'Submit Request' },
    { id: 'governance', type: 'policy_check', label: 'Governance Check', policyRefs: ['consent-scope'] },
    { id: 'irb_review', type: 'human_task', label: 'IRB Review' },
    { id: 'mta_sign', type: 'human_task', label: 'MTA Signing' },
    { id: 'fulfill', type: 'auto_action', label: 'Trigger Fulfillment' },
  ],
  metadata: {},
};

// --------------------------------------------------------------------------
// startInstance
// --------------------------------------------------------------------------

describe('startInstance()', () => {
  it('should start a new workflow instance', async () => {
    const adapter = createMockAdapter();
    const instance = await startInstance(
      adapter,
      approvalWorkflow,
      { requestId: 'req-001' },
      'user-1',
      'org-1',
    );

    expect(instance.status).toBe('running');
    expect(instance.definitionId).toBe('wf-access-request');
    expect(instance.currentStepIndex).toBe(0);
  });

  it('should reject inactive definitions', async () => {
    const adapter = createMockAdapter();
    const inactive = { ...approvalWorkflow, status: 'draft' as const };

    await expect(
      startInstance(adapter, inactive, {}, 'user-1'),
    ).rejects.toThrow('not active');
  });

  it('should reject definitions with no steps', async () => {
    const adapter = createMockAdapter();
    const empty = { ...approvalWorkflow, steps: [] };

    await expect(
      startInstance(adapter, empty, {}, 'user-1'),
    ).rejects.toThrow('has no steps');
  });
});

// --------------------------------------------------------------------------
// advance — policy checks
// --------------------------------------------------------------------------

describe('advance() — policy check', () => {
  it('should continue when policy allows', async () => {
    const adapter = createMockAdapter();
    const instance = await startInstance(adapter, approvalWorkflow, {}, 'user-1');
    const policyEval: PolicyEvaluator = async () => ({ outcome: 'allow' });

    const result = await advance(adapter, instance, approvalWorkflow, policyEval, 'user-1');

    expect(result.instance.status).toBe('running');
    expect(result.instance.currentStepIndex).toBe(1); // advanced past step 0
  });

  it('should block when policy denies', async () => {
    const adapter = createMockAdapter();
    const instance = await startInstance(adapter, approvalWorkflow, {}, 'user-1');
    const allowEval: PolicyEvaluator = async () => ({ outcome: 'allow' });

    // Advance past step 0 (human_task) to reach step 1 (policy_check)
    const step1 = await advance(adapter, instance, approvalWorkflow, allowEval, 'user-1', {});

    // Now step 1 is policy_check — test deny
    const denyEval: PolicyEvaluator = async () => ({ outcome: 'deny' });
    const result = await advance(adapter, step1.instance, approvalWorkflow, denyEval, 'user-1');

    expect(result.instance.status).toBe('blocked');
  });

  it('should create review task when policy is conditional', async () => {
    const adapter = createMockAdapter();
    const instance = await startInstance(adapter, approvalWorkflow, {}, 'user-1');
    const allowEval: PolicyEvaluator = async () => ({ outcome: 'allow' });

    // Advance past step 0 (human_task) to reach step 1 (policy_check)
    const step1 = await advance(adapter, instance, approvalWorkflow, allowEval, 'user-1', {});

    const conditionalEval: PolicyEvaluator = async () => ({
      outcome: 'conditional',
      conditions: ['Requires IRB review for oncology use'],
    });

    const result = await advance(adapter, step1.instance, approvalWorkflow, conditionalEval, 'user-1');

    // Should create a human review task and suspend
    expect(result.instance.status).toBe('suspended');
    expect(result.nextTasks.length).toBeGreaterThan(0);
    expect(result.nextTasks[0].stepType).toBe('human_task');
  });
});

// --------------------------------------------------------------------------
// advance — multi-step workflow
// --------------------------------------------------------------------------

describe('advance() — multi-step', () => {
  it('should advance through all steps and complete', async () => {
    const adapter = createMockAdapter();
    const instance = await startInstance(adapter, approvalWorkflow, {}, 'user-1');
    const policyEval: PolicyEvaluator = async () => ({ outcome: 'allow' });

    // Step 0 → 1 (human_task, submit)
    let r1 = await advance(adapter, instance, approvalWorkflow, policyEval, 'user-1', { submitted: true });
    expect(r1.instance.currentStepIndex).toBe(1);

    // Step 1 → 2 (policy_check, governance)
    // Need to advance with updated instance
    let current = r1.instance;
    let r2 = await advance(adapter, current, approvalWorkflow, policyEval, 'user-1');
    expect(r2.instance.currentStepIndex).toBe(2);

    // Step 2 → 3 (human_task, irb_review)
    current = r2.instance;
    let r3 = await advance(adapter, current, approvalWorkflow, policyEval, 'user-1', { approved: true });
    expect(r3.instance.currentStepIndex).toBe(3);

    // Step 3 → 4 (human_task, mta_sign)
    current = r3.instance;
    let r4 = await advance(adapter, current, approvalWorkflow, policyEval, 'user-1', { signed: true });
    expect(r4.instance.currentStepIndex).toBe(4);

    // Step 4 → complete (auto_action, fulfill)
    current = r4.instance;
    let r5 = await advance(adapter, current, approvalWorkflow, policyEval, 'user-1');
    expect(r5.instance.status).toBe('completed');
  });

  it('should pass policy context to evaluator', async () => {
    const adapter = createMockAdapter();
    const instance = await startInstance(
      adapter,
      approvalWorkflow,
      { consentScope: 'oncology', purpose: 'research' },
      'user-1',
    );

    const policyEval: PolicyEvaluator = vi.fn(async () => ({ outcome: 'allow' }));

    // Advance past step 0 (human_task) to reach step 1 (policy_check)
    const step1 = await advance(adapter, instance, approvalWorkflow, policyEval, 'user-1', {});

    // Now advance policy_check step — this should call the evaluator
    await advance(adapter, step1.instance, approvalWorkflow, policyEval, 'user-1');

    expect(policyEval).toHaveBeenCalled();
    const context = (policyEval as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(context.consentScope).toBe('oncology');
  });
});

// --------------------------------------------------------------------------
// suspend / resume / cancel
// --------------------------------------------------------------------------

describe('lifecycle management', () => {
  it('should suspend and resume an instance', async () => {
    const adapter = createMockAdapter();
    const instance = await startInstance(adapter, approvalWorkflow, {}, 'user-1');

    await suspendInstance(adapter, instance.id);
    await resumeInstance(adapter, instance.id);
    await cancelInstance(adapter, instance.id);
    // No error means success
    expect(true).toBe(true);
  });
});

// --------------------------------------------------------------------------
// getNextStep
// --------------------------------------------------------------------------

describe('getNextStep()', () => {
  it('should return the next step', () => {
    const step = getNextStep(approvalWorkflow, 0);
    expect(step).not.toBeNull();
    expect(step!.id).toBe('governance');
  });

  it('should return null for last step', () => {
    const step = getNextStep(approvalWorkflow, 4);
    expect(step).toBeNull();
  });
});

// --------------------------------------------------------------------------
// validateDefinition
// --------------------------------------------------------------------------

describe('validateDefinition()', () => {
  it('should pass for valid definition', () => {
    const errors = validateDefinition(approvalWorkflow);
    expect(errors).toHaveLength(0);
  });

  it('should catch missing name', () => {
    const errors = validateDefinition({ ...approvalWorkflow, name: '' });
    expect(errors).toContain('Workflow name is required');
  });

  it('should catch empty steps', () => {
    const errors = validateDefinition({ ...approvalWorkflow, steps: [] });
    expect(errors).toContain('Workflow must have at least one step');
  });

  it('should catch duplicate step ids', () => {
    const errors = validateDefinition({
      ...approvalWorkflow,
      steps: [
        { id: 'same', type: 'human_task', label: 'First' },
        { id: 'same', type: 'human_task', label: 'Second' },
      ],
    });
    expect(errors).toContain('Duplicate step id: same');
  });

  it('should catch steps without labels', () => {
    const errors = validateDefinition({
      ...approvalWorkflow,
      steps: [{ id: 'x', type: 'human_task', label: '' }],
    });
    expect(errors).toContain('Step "x" must have a label');
  });
});
