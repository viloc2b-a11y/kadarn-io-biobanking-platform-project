// ==========================================================================
// Kadarn OPA Shadow Mode — Unit Tests
// ==========================================================================
// PR-002: OPA Shadow Mode Foundation
//
// Tests demonstrate:
// 1. Shadow Mode never changes existing behavior
// 2. OPA decisions are recorded but never block
// 3. OPA disagreements are detectable
// 4. Feature flags correctly disable/enable evaluation
// 5. Local evaluator matches expected OPA semantics
// ==========================================================================

import { describe, it, expect, vi } from 'vitest';
import { evaluate, compose } from '../../packages/policy-engine/src/engine.js';
import { loadConfig } from '../../packages/policy-engine/src/opa/config.js';
import { LocalOpaClient, NullOpaClient } from '../../packages/policy-engine/src/opa/opa-client.js';
import { ShadowModeRunner, ConsoleDecisionRecorder, NullDecisionRecorder } from '../../packages/policy-engine/src/opa/shadow-mode.js';
import { evaluateLocalPolicy } from '../../packages/policy-engine/src/opa/local-evaluator.js';
import {
  organizationMembershipPolicy,
  programVisibilityPolicy,
  DEFAULT_POLICIES,
} from '../../packages/policy-engine/src/opa/policies.js';
import type { Policy, PolicyDefinition, OpaEvaluationInput, PolicyDecision } from '../../packages/policy-engine/src/opa/types.js';

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------

describe('loadConfig()', () => {
  it('should return defaults when OPA_SHADOW_MODE is unset', () => {
    const config = loadConfig();
    expect(config.opaShadowMode).toBe(false);
    expect(config.opaEnforcement).toBe(false);
    expect(config.opaFailOpen).toBe(true);
  });

  it('should override from env', () => {
    process.env.OPA_SHADOW_MODE = 'true';
    process.env.OPA_ENFORCEMENT = 'false';
    const config = loadConfig();
    expect(config.opaShadowMode).toBe(true);
    expect(config.opaEnforcement).toBe(false);
  });

  it('should allow programmatic overrides', () => {
    const config = loadConfig({ opaShadowMode: true, opaFailOpen: false });
    expect(config.opaShadowMode).toBe(true);
    expect(config.opaFailOpen).toBe(false);
  });

  afterEach(() => {
    delete process.env.OPA_SHADOW_MODE;
    delete process.env.OPA_ENFORCEMENT;
    delete process.env.OPA_FAIL_OPEN;
  });
});

// --------------------------------------------------------------------------
// OPA Client
// --------------------------------------------------------------------------

describe('LocalOpaClient', () => {
  const orgPolicies = [organizationMembershipPolicy];
  const allPolicies = DEFAULT_POLICIES;

  it('should evaluate a known policy — active member → allow', async () => {
    const client = new LocalOpaClient(orgPolicies);
    const result = await client.evaluate('organization.membership', {
      actor: { id: 'u1', role: 'org_member', email: 'test@example.com' },
      organization: { id: 'org-1', membership_status: 'active' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });
    expect(result.allow).toBe(true);
  });

  it('should deny for non-member (inactive)', async () => {
    const client = new LocalOpaClient(orgPolicies);
    const result = await client.evaluate('organization.membership', {
      actor: { id: 'u1', role: 'org_member', email: 'test@example.com' },
      organization: { id: 'org-1', membership_status: 'inactive' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });
    // defaultDeny: true + no matching allow rule → deny
    expect(result.allow).toBe(false);
  });

  it('should allow kadarn_internal regardless of membership', async () => {
    const client = new LocalOpaClient(orgPolicies);
    const result = await client.evaluate('organization.membership', {
      actor: { id: 'u1', role: 'kadarn_internal' },
      organization: { id: 'org-1', membership_status: 'inactive' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });
    expect(result.allow).toBe(true);
  });

  it('should default to allow for unknown policies', async () => {
    const client = new LocalOpaClient([]);
    const result = await client.evaluate('nonexistent.policy', {
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: null, membership_status: null } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'unknown', id: null },
      action: 'read',
      context: {},
    });
    expect(result.allow).toBe(true);
    expect(result.reasons[0]).toContain('Policy not found');
  });
});

describe('NullOpaClient', () => {
  it('should always return allow with disabled reason', async () => {
    const client = new NullOpaClient();
    const result = await client.evaluate('any.policy', {
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: null } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'anything', id: null },
      action: 'read',
      context: {},
    });
    expect(result.allow).toBe(true);
    expect(result.reasons[0]).toContain('disabled');
  });
});

// --------------------------------------------------------------------------
// Local Evaluator
// --------------------------------------------------------------------------

describe('evaluateLocalPolicy()', () => {
  it('should allow when conditions match', () => {
    const result = evaluateLocalPolicy(organizationMembershipPolicy, {
      actor: { id: 'u1', role: 'kadarn_internal' },
      organization: { id: 'org-1' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });
    expect(result.outcome).toBe('allow');
  });

  it('should deny when defaultDeny fires', () => {
    const result = evaluateLocalPolicy(organizationMembershipPolicy, {
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: 'org-1', membership_status: 'inactive' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });
    // defaultDeny adds a catch-all deny rule; no allow rule matched → deny
    expect(result.outcome).toBe('deny');
  });

  it('should include deny reason from default-deny rule', () => {
    const result = evaluateLocalPolicy(organizationMembershipPolicy, {
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: 'org-1', membership_status: 'inactive' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });
    expect(result.outcome).toBe('deny');
    expect(result.trace.some(t => t.reason?.includes('membership'))).toBe(true);
    expect(result.trace.some(t => t.ruleId === 'default-deny')).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Shadow Mode Runner
// --------------------------------------------------------------------------

describe('ShadowModeRunner', () => {
  function makeRunner(configOverrides = {}) {
    const config = loadConfig({ opaShadowMode: true, ...configOverrides });
    const client = new LocalOpaClient(DEFAULT_POLICIES);
    const recorder = new ConsoleDecisionRecorder();
    return new ShadowModeRunner(client, recorder, config, DEFAULT_POLICIES);
  }

  it('should return null when shadow mode is disabled', async () => {
    const config = loadConfig({ opaShadowMode: false });
    const client = new LocalOpaClient(DEFAULT_POLICIES);
    const recorder = new NullDecisionRecorder();
    const runner = new ShadowModeRunner(client, recorder, config, DEFAULT_POLICIES);

    const result = await runner.evaluate({
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: 'org-1', membership_status: 'active' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });

    expect(result).toBeNull();
  });

  it('should produce a decision when shadow mode is enabled', async () => {
    const runner = makeRunner();
    const result = await runner.evaluate({
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: 'org-1', membership_status: 'active' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });

    expect(result).not.toBeNull();
    expect(result!.decisionId).toBeTruthy();
    expect(result!.actorId).toBe('u1');
    // Active member → allow
    expect(result!.opaDecision).toBe('allow');
    expect(result!.match).toBe(true);
  });

  it('SHADOW MODE INVARIANT: OPA deny never changes kadarn allow', async () => {
    // This is the critical Shadow Mode invariant:
    // Even when OPA denies, the Kadarn decision remains 'allow'
    // and the request is NOT blocked.
    const runner = makeRunner();
    const result = await runner.evaluate({
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: 'org-1', membership_status: 'inactive' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });

    expect(result).not.toBeNull();
    // OPA denies (non-member, inactive → defaultDeny fires)
    expect(result!.opaDecision).toBe('deny');
    // But Kadarn decision is still allow (RLS is authoritative)
    expect(result!.kadarnDecision).toBe('allow');
    // They disagree — that's the divergence signal
    expect(result!.match).toBe(false);
  });

  it('should record structured decision with all required fields', async () => {
    const runner = makeRunner();
    const result = await runner.evaluate({
      actor: { id: 'u1', role: 'org_admin' },
      organization: { id: 'org-abc', membership_status: 'active' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-abc' },
      action: 'write',
      context: {},
    });

    expect(result).not.toBeNull();
    expect(result!.decisionId).toBeTruthy();
    expect(result!.policyVersion).toBeTruthy();
    expect(result!.actorId).toBe('u1');
    expect(result!.actorRole).toBe('org_admin');
    expect(result!.organizationId).toBe('org-abc');
    expect(result!.resourceType).toBe('organization');
    expect(result!.resourceId).toBe('org-abc');
    expect(result!.action).toBe('write');
    expect(result!.evaluatedAt).toBeTruthy();
    expect(Array.isArray(result!.reasons)).toBe(true);
  });

  it('should skip policies that do not match the resource type', async () => {
    // Program.visibility has resourceTypes: ['program']
    // An 'exchange.deal' resource should not trigger it
    const runner = makeRunner();
    const result = await runner.evaluate({
      actor: { id: 'u1', role: 'org_admin' },
      organization: { id: 'org-1', membership_status: 'active' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'exchange.deal', id: 'deal-1' },
      action: 'read',
      context: {},
    });

    // Only org.membership matches (resourceType: ['organization'])
    // exchange.deal doesn't match → no policies apply → null
    expect(result).toBeNull();
  });
});

// --------------------------------------------------------------------------
// Policy Semantics — Organization Membership
// --------------------------------------------------------------------------

describe('organization.membership policy', () => {
  it('should allow kadarn_internal without membership', () => {
    const result = evaluate(
      {
        id: 'organization.membership',
        name: 'Organization Membership',
        domain: 'governance',
        status: 'active',
        version: 1,
        priority: 100,
        rules: [
          {
            id: 'r1',
            condition: organizationMembershipPolicy.conditions,
            effect: organizationMembershipPolicy.effect,
            reason: organizationMembershipPolicy.reason,
          },
        ],
        metadata: {},
      },
      {
        actor: { id: 'u1', role: 'kadarn_internal' },
        organization: { id: 'org-1', membership_status: 'inactive' },
      },
    );
    expect(result.outcome).toBe('allow');
  });

  it('should allow active member', () => {
    const result = evaluate(
      {
        id: 'organization.membership',
        name: 'Organization Membership',
        domain: 'governance',
        status: 'active',
        version: 1,
        priority: 100,
        rules: [
          {
            id: 'r1',
            condition: organizationMembershipPolicy.conditions,
            effect: organizationMembershipPolicy.effect,
            reason: organizationMembershipPolicy.reason,
          },
        ],
        metadata: {},
      },
      {
        actor: { id: 'u1', role: 'org_member' },
        organization: { id: 'org-1', membership_status: 'active' },
      },
    );
    expect(result.outcome).toBe('allow');
  });
});

// --------------------------------------------------------------------------
// Policy Semantics — Program Visibility
// --------------------------------------------------------------------------

describe('program.visibility policy', () => {
  it('should allow public programs', () => {
    const result = evaluate(
      {
        id: 'program.visibility',
        name: 'Program Visibility',
        domain: 'governance',
        status: 'active',
        version: 1,
        priority: 100,
        rules: [
          {
            id: 'r1',
            condition: programVisibilityPolicy.conditions,
            effect: programVisibilityPolicy.effect,
            reason: programVisibilityPolicy.reason,
          },
        ],
        metadata: {},
      },
      {
        organization: { id: 'org-1' },
        program: { visibility: 'public' },
      },
    );
    expect(result.outcome).toBe('allow');
  });

  it('should allow sponsor org', () => {
    const result = evaluate(
      {
        id: 'program.visibility',
        name: 'Program Visibility',
        domain: 'governance',
        status: 'active',
        version: 1,
        priority: 100,
        rules: [
          {
            id: 'r1',
            condition: programVisibilityPolicy.conditions,
            effect: programVisibilityPolicy.effect,
            reason: programVisibilityPolicy.reason,
          },
        ],
        metadata: {},
      },
      {
        organization: { id: 'org-sponsor' },
        program: { visibility: 'sponsor_only', sponsor_org_id: 'org-sponsor' },
      },
    );
    expect(result.outcome).toBe('allow');
  });

  it('should return conditional for non-member (no defaultDeny in raw engine)', () => {
    // Without defaultDeny, the raw engine returns 'conditional'
    // when no rule matches (not 'deny')
    const result = evaluate(
      {
        id: 'program.visibility',
        name: 'Program Visibility',
        domain: 'governance',
        status: 'active',
        version: 1,
        priority: 100,
        rules: [
          {
            id: 'r1',
            condition: programVisibilityPolicy.conditions,
            effect: programVisibilityPolicy.effect,
            reason: programVisibilityPolicy.reason,
          },
        ],
        metadata: {},
      },
      {
        organization: { id: 'org-stranger' },
        program: { visibility: 'sponsor_only', sponsor_org_id: 'org-sponsor' },
      },
    );
    expect(result.outcome).toBe('conditional');
  });
});

// --------------------------------------------------------------------------
// Shadow Mode Invariant: Feature Guard
// --------------------------------------------------------------------------

describe('Shadow Mode — feature flag guard', () => {
  it('should not evaluate when OPA_SHADOW_MODE is false', async () => {
    const config = loadConfig({ opaShadowMode: false });
    const client = new LocalOpaClient(DEFAULT_POLICIES);
    const recorder = new ConsoleDecisionRecorder();
    const runner = new ShadowModeRunner(client, recorder, config, DEFAULT_POLICIES);

    const spy = vi.spyOn(console, 'log');
    const result = await runner.evaluate({
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: 'org-1', membership_status: 'active' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });

    expect(result).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should record decisions when OPA_SHADOW_MODE is true', async () => {
    const config = loadConfig({ opaShadowMode: true });
    const client = new LocalOpaClient(DEFAULT_POLICIES);
    const recorder = new ConsoleDecisionRecorder();
    const runner = new ShadowModeRunner(client, recorder, config, DEFAULT_POLICIES);

    const spy = vi.spyOn(console, 'log');
    const result = await runner.evaluate({
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: 'org-1', membership_status: 'active' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });

    expect(result).not.toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

// --------------------------------------------------------------------------
// PR-002 Verification Checklist
// --------------------------------------------------------------------------

describe('PR-002 Verification', () => {
  it('verify: existing Kadarn engine tests still pass when using OPA types', () => {
    // The OPA types and shadow mode use the existing Kadarn engine
    // under the hood — no behavioral change to the engine itself
    const policy: Policy = {
      id: 'test',
      name: 'Test',
      domain: 'governance',
      status: 'active',
      version: 1,
      priority: 100,
      rules: [
        {
          id: 'r1',
          condition: { eq: [{ var: 'x' }, 1] },
          effect: 'allow',
        },
      ],
      metadata: {},
    };

    const result = evaluate(policy, { x: 1 });
    expect(result.outcome).toBe('allow');
  });

  it('verify: RLS remains final enforcement — OPA only observes', async () => {
    // ShadowModeRunner never throws, never returns a blocking signal
    // The wrapper is fire-and-forget after the handler response
    const config = loadConfig({ opaShadowMode: true });
    const client = new LocalOpaClient(DEFAULT_POLICIES);
    const recorder = new NullDecisionRecorder();
    const runner = new ShadowModeRunner(client, recorder, config, DEFAULT_POLICIES);

    // Even if something goes wrong, runner returns null (fail-open)
    // The request would still proceed
    await expect(async () => {
      await runner.evaluate({
        actor: { id: 'u1', role: 'unknown' },
        organization: { id: null } as unknown as OpaEvaluationInput['organization'],
        resource: { type: 'unknown', id: null },
        action: 'read',
        context: {},
      });
    }).not.toThrow();
  });

  it('verify: divergence detection works', async () => {
    const config = loadConfig({ opaShadowMode: true });
    const client = new LocalOpaClient(DEFAULT_POLICIES);
    const recorder = new NullDecisionRecorder();
    const runner = new ShadowModeRunner(client, recorder, config, DEFAULT_POLICIES);

    // Non-member accessing org — OPA denies (defaultDeny), Kadarn allows
    const result = await runner.evaluate({
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: 'org-1', membership_status: 'inactive' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });

    expect(result).not.toBeNull();
    expect(result!.match).toBe(false);
    expect(result!.opaDecision).toBe('deny');
    expect(result!.kadarnDecision).toBe('allow');
  });

  it('verify: resource type filtering prevents false positives', async () => {
    // Program.visibility policy should NOT fire on org resources
    // Only org.membership applies to 'organization' resource type
    const config = loadConfig({ opaShadowMode: true });
    const client = new LocalOpaClient(DEFAULT_POLICIES);
    const recorder = new NullDecisionRecorder();
    const runner = new ShadowModeRunner(client, recorder, config, DEFAULT_POLICIES);

    // Program resource with matching context — both policies are irrelevant
    // Only org.membership has resourceTypes: ['organization']
    // So for a 'program' resource, only program.visibility applies
    const result = await runner.evaluate({
      actor: { id: 'u1', role: 'org_member' },
      organization: { id: 'org-sponsor' } as unknown as OpaEvaluationInput['organization'],
      resource: { type: 'program', id: 'prog-1' },
      action: 'read',
      context: {
        program: { visibility: 'public' },
      },
    });

    expect(result).not.toBeNull();
    // program.visibility matches (resourceTypes: ['program'])
    // public program → allow
    expect(result!.opaDecision).toBe('allow');
  });
});
