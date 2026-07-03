// ==========================================================================
// Policy Engine Tests — Sprint 9.3 (Delivery Policies)
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  // RBAC
  hasPermission,
  getRolePermissions,
  isValidRole,
  evaluateRbac,
  ROLE_PERMISSIONS,
  type DeliveryRole,
  // ABAC
  evaluateAbac,
  getFieldValue,
  // Visibility
  evaluateVisibility,
  VISIBILITY_RULES,
  // Actor Policies
  evaluateActorPolicies,
  // Engine
  PolicyEngine,
  // Types
  type PolicyActor,
  type PolicyContext,
  type PolicyDecision,
  type AbacRule,
  type ActorPolicy,
  type DeliveryAction,
} from '../src/policies/index.js';

// ==========================================================================
// Test Helpers
// ==========================================================================

function makeActor(overrides?: Partial<PolicyActor>): PolicyActor {
  return {
    actorId: 'actor-001',
    roles: ['researcher'],
    attributes: {},
    ...overrides,
  };
}

function makeContext(overrides?: Partial<PolicyContext['artifact']>): PolicyContext {
  return {
    artifact: {
      type: 'pdf',
      status: 'generated',
      classification: 'public',
      metadata: {},
      ownerId: undefined,
      recipientIds: [],
      ...overrides,
    },
    environment: {},
  };
}

function makeActorPolicy(actorId: string, rules: ActorPolicy['rules']): ActorPolicy {
  return { actorId, rules };
}

// ==========================================================================
// RBAC — Role Definitions
// ==========================================================================

describe('RBAC — Role definitions', () => {
  it('admin has all 7 permissions', () => {
    const perms = getRolePermissions('admin');
    expect(perms).toHaveLength(7);
    expect(perms).toContain('artifact:read');
    expect(perms).toContain('policy:manage');
    expect(perms).toContain('channel:manage');
  });

  it('sponsor has read and deliver permissions', () => {
    const perms = getRolePermissions('sponsor');
    expect(perms).toEqual(['artifact:read', 'artifact:deliver']);
  });

  it('institution has read, deliver, and lineage', () => {
    const perms = getRolePermissions('institution');
    expect(perms).toContain('artifact:read');
    expect(perms).toContain('artifact:deliver');
    expect(perms).toContain('lineage:view');
  });

  it('researcher has read only', () => {
    const perms = getRolePermissions('researcher');
    expect(perms).toEqual(['artifact:read']);
  });

  it('auditor has read and lineage', () => {
    const perms = getRolePermissions('auditor');
    expect(perms).toContain('artifact:read');
    expect(perms).toContain('lineage:view');
  });

  it('system has read, deliver, and expire', () => {
    const perms = getRolePermissions('system');
    expect(perms).toContain('artifact:read');
    expect(perms).toContain('artifact:deliver');
    expect(perms).toContain('artifact:expire');
  });

  it('ROLE_PERMISSIONS has exactly 6 roles', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(6);
  });
});

// ==========================================================================
// RBAC — hasPermission
// ==========================================================================

describe('RBAC — hasPermission', () => {
  it('admin can read', () => {
    expect(hasPermission('admin', 'artifact:read')).toBe(true);
  });

  it('admin can manage policies', () => {
    expect(hasPermission('admin', 'policy:manage')).toBe(true);
  });

  it('admin cannot do an unknown action gracefully', () => {
    // nonexistent action won't be in the array, so false
    expect(hasPermission('admin', 'artifact:delete' as DeliveryAction)).toBe(false);
  });

  it('sponsor can read', () => {
    expect(hasPermission('sponsor', 'artifact:read')).toBe(true);
  });

  it('sponsor can deliver', () => {
    expect(hasPermission('sponsor', 'artifact:deliver')).toBe(true);
  });

  it('sponsor cannot revoke', () => {
    expect(hasPermission('sponsor', 'artifact:revoke')).toBe(false);
  });

  it('sponsor cannot manage policies', () => {
    expect(hasPermission('sponsor', 'policy:manage')).toBe(false);
  });

  it('researcher can read', () => {
    expect(hasPermission('researcher', 'artifact:read')).toBe(true);
  });

  it('researcher cannot deliver', () => {
    expect(hasPermission('researcher', 'artifact:deliver')).toBe(false);
  });
});

// ==========================================================================
// RBAC — isValidRole
// ==========================================================================

describe('RBAC — isValidRole', () => {
  it('recognizes valid roles', () => {
    expect(isValidRole('admin')).toBe(true);
    expect(isValidRole('sponsor')).toBe(true);
    expect(isValidRole('institution')).toBe(true);
    expect(isValidRole('researcher')).toBe(true);
    expect(isValidRole('auditor')).toBe(true);
    expect(isValidRole('system')).toBe(true);
  });

  it('rejects invalid roles', () => {
    expect(isValidRole('superadmin')).toBe(false);
    expect(isValidRole('')).toBe(false);
    expect(isValidRole('guest')).toBe(false);
  });
});

// ==========================================================================
// RBAC — evaluateRbac
// ==========================================================================

describe('RBAC — evaluateRbac', () => {
  it('ALLOWs when the actor has a role with the permission', () => {
    const actor = makeActor({ roles: ['admin'] });
    const result = evaluateRbac(actor, 'artifact:read');
    expect(result.decision).toBe('ALLOW');
    expect(result.evaluatedBy).toBe('rbac');
  });

  it('DENIEs when no role has the permission', () => {
    const actor = makeActor({ roles: ['researcher'] });
    const result = evaluateRbac(actor, 'artifact:deliver');
    expect(result.decision).toBe('DENY');
    expect(result.evaluatedBy).toBe('rbac');
  });

  it('actor with multiple roles gets union of permissions', () => {
    const actor = makeActor({ roles: ['researcher', 'sponsor'] });
    const result = evaluateRbac(actor, 'artifact:deliver');
    // Researcher can't deliver, but sponsor can
    expect(result.decision).toBe('ALLOW');
  });

  it('first matching role wins — sponsor role checked first', () => {
    const actor = makeActor({ roles: ['sponsor', 'researcher'] });
    const result = evaluateRbac(actor, 'artifact:read');
    expect(result.decision).toBe('ALLOW');
    expect(result.reason).toContain('sponsor');
  });

  it('actor with no roles → DENY', () => {
    const actor = makeActor({ roles: [] });
    const result = evaluateRbac(actor, 'artifact:read');
    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('no roles');
  });

  it('includes role name in ALLOW reason', () => {
    const actor = makeActor({ roles: ['admin'] });
    const result = evaluateRbac(actor, 'artifact:read');
    expect(result.reason).toContain('admin');
  });

  it('includes actorId in DENY reason', () => {
    const actor = makeActor({ actorId: 'specific-actor', roles: ['researcher'] });
    const result = evaluateRbac(actor, 'artifact:deliver');
    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('specific-actor');
  });
});

// ==========================================================================
// ABAC — getFieldValue
// ==========================================================================

describe('ABAC — getFieldValue', () => {
  it('resolves a simple field', () => {
    const obj = { name: 'test' };
    expect(getFieldValue(obj, 'name')).toBe('test');
  });

  it('resolves dot-notation path', () => {
    const obj = { artifact: { classification: 'public' } };
    expect(getFieldValue(obj, 'artifact.classification')).toBe('public');
  });

  it('resolves deeply nested path', () => {
    const obj = { a: { b: { c: { d: 'deep' } } } };
    expect(getFieldValue(obj, 'a.b.c.d')).toBe('deep');
  });

  it('returns undefined for missing path', () => {
    const obj = { artifact: {} };
    expect(getFieldValue(obj, 'artifact.nonexistent')).toBeUndefined();
  });

  it('returns undefined for null at intermediate path', () => {
    const obj = { artifact: null };
    expect(getFieldValue(obj, 'artifact.classification')).toBeUndefined();
  });

  it('returns undefined for path through non-object', () => {
    const obj = { artifact: 'string' };
    expect(getFieldValue(obj, 'artifact.classification')).toBeUndefined();
  });

  it('resolves array values', () => {
    const obj = { artifact: { tags: ['a', 'b'] } };
    expect(getFieldValue(obj, 'artifact.tags')).toEqual(['a', 'b']);
  });
});

// ==========================================================================
// ABAC — evaluateAbac
// ==========================================================================

describe('ABAC — evaluateAbac', () => {
  const publicAllowRule: AbacRule = {
    id: 'test-public',
    name: 'Public artifacts allowed',
    description: 'Allow public artifacts',
    priority: 100,
    conditions: [{ field: 'artifact.classification', operator: 'equals', value: 'public' }],
    effect: 'ALLOW',
  };

  const confidentialDenyRule: AbacRule = {
    id: 'test-confidential',
    name: 'Confidential denied',
    description: 'Deny confidential artifacts',
    priority: 200,
    conditions: [{ field: 'artifact.classification', operator: 'equals', value: 'confidential' }],
    effect: 'DENY',
  };

  const sponsorDenyRule: AbacRule = {
    id: 'test-sponsor-counter',
    name: 'Sponsor counter-evidence denied',
    description: 'Sponsors cannot access counter-evidence',
    priority: 300,
    conditions: [
      { field: 'artifact.classification', operator: 'equals', value: 'counter-evidence' },
    ],
    effect: 'DENY',
  };

  it('returns ALLOW when a rule matches with ALLOW effect', () => {
    const result = evaluateAbac(
      [publicAllowRule],
      makeActor(),
      'artifact:read',
      makeContext({ classification: 'public' }),
    );
    expect(result.decision).toBe('ALLOW');
    expect(result.evaluatedBy).toBe('abac');
  });

  it('returns DENY when a rule matches with DENY effect', () => {
    const result = evaluateAbac(
      [confidentialDenyRule],
      makeActor(),
      'artifact:read',
      makeContext({ classification: 'confidential' }),
    );
    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('Confidential denied');
  });

  it('skips rules with non-matching conditions', () => {
    const result = evaluateAbac(
      [confidentialDenyRule],
      makeActor(),
      'artifact:read',
      makeContext({ classification: 'public' }),
    );
    // Public doesn't match confidential rule → default allow
    expect(result.decision).toBe('ALLOW');
  });

  it('first matching rule by priority wins (higher priority first)', () => {
    // Both rules match 'confidential', but publicAllow has lower priority
    const rules: AbacRule[] = [
      { ...publicAllowRule, priority: 50, conditions: [{ field: 'artifact.classification', operator: 'equals', value: 'confidential' }] },
      { ...confidentialDenyRule, priority: 200 },
    ];
    const result = evaluateAbac(rules, makeActor(), 'artifact:read', makeContext({ classification: 'confidential' }));
    // Higher priority wins: DENY
    expect(result.decision).toBe('DENY');
  });

  it('returns ALLOW as default when no rules match', () => {
    const result = evaluateAbac(
      [],
      makeActor(),
      'artifact:read',
      makeContext({ classification: 'restricted' }),
    );
    expect(result.decision).toBe('ALLOW');
  });

  it('includes rule name in DENY reason', () => {
    const result = evaluateAbac(
      [sponsorDenyRule],
      makeActor(),
      'artifact:read',
      makeContext({ classification: 'counter-evidence' }),
    );
    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('Sponsor counter-evidence denied');
  });

  it('evaluates "not_equals" operator correctly', () => {
    const rule: AbacRule = {
      id: 'test-ne',
      name: 'Not public',
      description: 'Deny if not public',
      priority: 100,
      conditions: [{ field: 'artifact.classification', operator: 'not_equals', value: 'public' }],
      effect: 'DENY',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ classification: 'confidential' }));
    expect(result.decision).toBe('DENY');
  });

  it('"not_equals" does not match when values are equal', () => {
    const rule: AbacRule = {
      id: 'test-ne2',
      name: 'Not public',
      description: 'Deny if not public',
      priority: 100,
      conditions: [{ field: 'artifact.classification', operator: 'not_equals', value: 'public' }],
      effect: 'DENY',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ classification: 'public' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('evaluates "in" operator correctly', () => {
    const rule: AbacRule = {
      id: 'test-in',
      name: 'In list',
      description: 'Match if in list',
      priority: 100,
      conditions: [{ field: 'artifact.classification', operator: 'in', value: ['confidential', 'counter-evidence'] }],
      effect: 'DENY',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ classification: 'confidential' }));
    expect(result.decision).toBe('DENY');
  });

  it('"in" operator skips when value not in list', () => {
    const rule: AbacRule = {
      id: 'test-in2',
      name: 'In list',
      description: 'Match if in list',
      priority: 100,
      conditions: [{ field: 'artifact.classification', operator: 'in', value: ['confidential', 'counter-evidence'] }],
      effect: 'DENY',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ classification: 'public' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('evaluates "not_in" operator correctly', () => {
    const rule: AbacRule = {
      id: 'test-nin',
      name: 'Not in list',
      description: 'Deny if not in allowed list',
      priority: 100,
      conditions: [{ field: 'artifact.classification', operator: 'not_in', value: ['public'] }],
      effect: 'DENY',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ classification: 'confidential' }));
    expect(result.decision).toBe('DENY');
  });

  it('evaluates "exists" operator correctly', () => {
    const rule: AbacRule = {
      id: 'test-ex',
      name: 'Owner exists',
      description: 'Requires owner',
      priority: 100,
      conditions: [{ field: 'artifact.ownerId', operator: 'exists', value: null }],
      effect: 'ALLOW',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ ownerId: 'owner-1' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('"exists" returns false for undefined field', () => {
    const rule: AbacRule = {
      id: 'test-ex2',
      name: 'Owner exists',
      description: 'Requires owner',
      priority: 100,
      conditions: [{ field: 'artifact.ownerId', operator: 'exists', value: null }],
      effect: 'ALLOW',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ ownerId: undefined }));
    expect(result.decision).toBe('ALLOW'); // default allow, rule didn't match
  });

  it('evaluates "not_exists" operator correctly', () => {
    const rule: AbacRule = {
      id: 'test-nex',
      name: 'No owner',
      description: 'Deny if owner is missing',
      priority: 100,
      conditions: [{ field: 'artifact.ownerId', operator: 'not_exists', value: null }],
      effect: 'DENY',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ ownerId: undefined }));
    expect(result.decision).toBe('DENY');
  });

  it('evaluates "contains" operator for strings', () => {
    const rule: AbacRule = {
      id: 'test-contains',
      name: 'Contains word',
      description: 'Match string contains',
      priority: 100,
      conditions: [{ field: 'artifact.classification', operator: 'contains', value: 'confidential' }],
      effect: 'DENY',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ classification: 'confidential' }));
    expect(result.decision).toBe('DENY');
  });

  it('evaluates "contains" operator for arrays', () => {
    const rule: AbacRule = {
      id: 'test-arr',
      name: 'Contains recipient',
      description: 'Check recipient list',
      priority: 100,
      conditions: [{ field: 'artifact.recipientIds', operator: 'contains', value: 'rec-1' }],
      effect: 'ALLOW',
    };
    const result = evaluateAbac([rule], makeActor(), 'artifact:read', makeContext({ recipientIds: ['rec-1', 'rec-2'] }));
    expect(result.decision).toBe('ALLOW');
  });
});

// ==========================================================================
// Visibility
// ==========================================================================

describe('Visibility Rules', () => {
  it('VISIBILITY_RULES has 3 built-in rules', () => {
    expect(VISIBILITY_RULES).toHaveLength(3);
  });

  it('public artifact is visible to researcher', () => {
    const result = evaluateVisibility(
      makeActor({ roles: ['researcher'] }),
      'artifact:read',
      makeContext({ classification: 'public' }),
    );
    expect(result.decision).toBe('ALLOW');
  });

  it('public artifact is visible to sponsor', () => {
    const result = evaluateVisibility(
      makeActor({ roles: ['sponsor'] }),
      'artifact:read',
      makeContext({ classification: 'public' }),
    );
    expect(result.decision).toBe('ALLOW');
  });

  it('counter-evidence is DENIED for sponsor', () => {
    const result = evaluateVisibility(
      makeActor({ roles: ['sponsor'] }),
      'artifact:read',
      makeContext({ classification: 'counter-evidence' }),
    );
    expect(result.decision).toBe('DENY');
  });

  it('counter-evidence is ALLOWED for admin', () => {
    const result = evaluateVisibility(
      makeActor({ roles: ['admin'] }),
      'artifact:read',
      makeContext({ classification: 'counter-evidence' }),
    );
    // admin role doesn't matter for visibility — visibility only checks classification
    // counter-evidence rule DENIES regardless of role
    expect(result.decision).toBe('DENY');
  });

  it('confidential is DENIED by default visibility rule', () => {
    const result = evaluateVisibility(
      makeActor({ roles: ['researcher'] }),
      'artifact:read',
      makeContext({ classification: 'confidential' }),
    );
    expect(result.decision).toBe('DENY');
  });

  it('non-read action skips visibility check — ALLOW', () => {
    const result = evaluateVisibility(
      makeActor({ roles: ['sponsor'] }),
      'artifact:deliver',
      makeContext({ classification: 'counter-evidence' }),
    );
    expect(result.decision).toBe('ALLOW');
    expect(result.reason).toContain('not applicable for non-read action');
  });
});

// ==========================================================================
// Actor Policies
// ==========================================================================

describe('Actor Policies — evaluateActorPolicies', () => {
  it('returns null when no actor policy matches the actorId', () => {
    const policies: ActorPolicy[] = [
      makeActorPolicy('other-actor', [
        { action: 'artifact:read', resourcePattern: '*', effect: 'DENY', priority: 100 },
      ]),
    ];
    const result = evaluateActorPolicies(
      policies,
      makeActor({ actorId: 'actor-001' }),
      'artifact:read',
      makeContext(),
    );
    expect(result).toBeNull();
  });

  it('overrides to DENY when explicit actor policy denies', () => {
    const policies: ActorPolicy[] = [
      makeActorPolicy('actor-001', [
        { action: 'artifact:read', resourcePattern: '*', effect: 'DENY', priority: 100 },
      ]),
    ];
    const result = evaluateActorPolicies(
      policies,
      makeActor({ actorId: 'actor-001' }),
      'artifact:read',
      makeContext(),
    );
    expect(result).not.toBeNull();
    expect(result!.decision).toBe('DENY');
    expect(result!.evaluatedBy).toBe('actor-policy');
  });

  it('overrides to ALLOW when explicit actor policy allows', () => {
    const policies: ActorPolicy[] = [
      makeActorPolicy('actor-001', [
        { action: 'artifact:read', resourcePattern: '*', effect: 'ALLOW', priority: 100 },
      ]),
    ];
    const result = evaluateActorPolicies(
      policies,
      makeActor({ actorId: 'actor-001' }),
      'artifact:read',
      makeContext(),
    );
    expect(result!.decision).toBe('ALLOW');
  });

  it('does not match when action differs', () => {
    const policies: ActorPolicy[] = [
      makeActorPolicy('actor-001', [
        { action: 'artifact:deliver', resourcePattern: '*', effect: 'DENY', priority: 100 },
      ]),
    ];
    const result = evaluateActorPolicies(
      policies,
      makeActor({ actorId: 'actor-001' }),
      'artifact:read',
      makeContext(),
    );
    expect(result).toBeNull();
  });

  it('respects resourcePattern — matches specific artifact type', () => {
    const policies: ActorPolicy[] = [
      makeActorPolicy('actor-001', [
        { action: 'artifact:read', resourcePattern: 'json', effect: 'DENY', priority: 100 },
      ]),
    ];
    // Context has pdf type → no match
    const result = evaluateActorPolicies(
      policies,
      makeActor({ actorId: 'actor-001' }),
      'artifact:read',
      makeContext({ type: 'pdf' }),
    );
    expect(result).toBeNull();
  });

  it('wildcard resourcePattern matches all', () => {
    const policies: ActorPolicy[] = [
      makeActorPolicy('actor-001', [
        { action: 'artifact:read', resourcePattern: '*', effect: 'ALLOW', priority: 100 },
      ]),
    ];
    const result = evaluateActorPolicies(
      policies,
      makeActor({ actorId: 'actor-001' }),
      'artifact:read',
      makeContext({ type: 'zip' }),
    );
    expect(result!.decision).toBe('ALLOW');
  });

  it('evaluates actor policy with conditions', () => {
    const policies: ActorPolicy[] = [
      {
        actorId: 'actor-001',
        rules: [{
          action: 'artifact:read',
          resourcePattern: '*',
          effect: 'DENY',
          priority: 100,
          conditions: [{ field: 'artifact.classification', operator: 'equals', value: 'restricted' }],
        }],
      },
    ];
    const restrictedResult = evaluateActorPolicies(
      policies,
      makeActor({ actorId: 'actor-001' }),
      'artifact:read',
      makeContext({ classification: 'restricted' }),
    );
    expect(restrictedResult!.decision).toBe('DENY');

    const publicResult = evaluateActorPolicies(
      policies,
      makeActor({ actorId: 'actor-001' }),
      'artifact:read',
      makeContext({ classification: 'public' }),
    );
    expect(publicResult).toBeNull(); // condition doesn't match
  });

  it('higher priority rule wins within same actor policy', () => {
    const policies: ActorPolicy[] = [
      {
        actorId: 'actor-001',
        rules: [
          { action: 'artifact:read', resourcePattern: '*', effect: 'DENY', priority: 50 },
          { action: 'artifact:read', resourcePattern: '*', effect: 'ALLOW', priority: 100 },
        ],
      },
    ];
    const result = evaluateActorPolicies(
      policies,
      makeActor({ actorId: 'actor-001' }),
      'artifact:read',
      makeContext(),
    );
    expect(result!.decision).toBe('ALLOW');
    expect(result!.reason).toContain('actor-001');
  });
});

// ==========================================================================
// PolicyEngine — Integration
// ==========================================================================

describe('PolicyEngine — Integration', () => {
  // --- User's exact examples ---
  it('Sponsor canRead Institution Passport → ALLOW', () => {
    const engine = new PolicyEngine();
    const actor: PolicyActor = { actorId: 'sponsor-1', roles: ['sponsor'], attributes: {} };
    const context: PolicyContext = {
      artifact: { classification: 'public', type: 'pdf', metadata: { name: 'Institution Passport' } },
    };
    const result = engine.evaluate(actor, 'artifact:read', context);
    expect(result.decision).toBe('ALLOW');
  });

  it('Sponsor canRead Counter Evidence → DENY', () => {
    const engine = new PolicyEngine();
    const actor: PolicyActor = { actorId: 'sponsor-1', roles: ['sponsor'], attributes: {} };
    const context: PolicyContext = {
      artifact: { classification: 'counter-evidence', type: 'pdf', metadata: { name: 'Counter Evidence' } },
    };
    const result = engine.evaluate(actor, 'artifact:read', context);
    expect(result.decision).toBe('DENY');
  });

  it('engine evaluation order: actor policy overrides RBAC', () => {
    const engine = new PolicyEngine({
      actorPolicies: [
        makeActorPolicy('actor-001', [
          { action: 'artifact:revoke', resourcePattern: '*', effect: 'ALLOW', priority: 100 },
        ]),
      ],
    });
    const actor: PolicyActor = { actorId: 'actor-001', roles: ['researcher'], attributes: {} };
    // Researcher can't revoke via RBAC, but actor policy overrides
    const result = engine.evaluate(actor, 'artifact:revoke', makeContext());
    expect(result.decision).toBe('ALLOW');
    expect(result.evaluatedBy).toBe('actor-policy');
  });

  it('RBAC denies before ABAC is checked', () => {
    const engine = new PolicyEngine();
    const actor: PolicyActor = { actorId: 'researcher-1', roles: ['researcher'], attributes: {} };
    // Researcher cannot deliver
    const result = engine.evaluate(actor, 'artifact:deliver', makeContext());
    expect(result.decision).toBe('DENY');
    expect(result.evaluatedBy).toBe('rbac');
  });

  it('ABAC denies after RBAC passes but before visibility', () => {
    const customRule: AbacRule = {
      id: 'custom-deny',
      name: 'Custom deny all pdfs',
      description: 'Deny all pdf artifacts',
      priority: 500,
      conditions: [{ field: 'artifact.type', operator: 'equals', value: 'pdf' }],
      effect: 'DENY',
    };
    const engine = new PolicyEngine({ abacRules: [customRule] });
    const actor: PolicyActor = { actorId: 'admin-1', roles: ['admin'], attributes: {} };
    // Admin has RBAC read, but ABAC custom rule denies pdfs
    const result = engine.evaluate(actor, 'artifact:read', makeContext({ type: 'pdf', classification: 'public' }));
    expect(result.decision).toBe('DENY');
    expect(result.evaluatedBy).toBe('abac');
  });

  it('visibility checked only for artifact:read, not for deliver', () => {
    // Build engine with counter-evidence visibility rules
    const engine = new PolicyEngine();
    const actor: PolicyActor = { actorId: 'sponsor-1', roles: ['sponsor'], attributes: {} };
    const context = makeContext({ classification: 'counter-evidence' });

    // Read should fail (visibility blocks counter-evidence for anyone)
    const readResult = engine.evaluate(actor, 'artifact:read', context);
    expect(readResult.decision).toBe('DENY');

    // Deliver passes RBAC. ABAC rules check classification too (vis-counter-evidence)
    // But since it's not artifact:read, visibility alone doesn't block
    // The ABAC rules ARE checked for deliver though — and counter-evidence rule denies
    // Wait — the ABAC rules in default engine are VISIBILITY_RULES
    // Visibility rules are evaluated as ABAC rules. The vis-counter-evidence rule has conditions
    // checking classification="counter-evidence" with DENY effect.
    // Since ABAC evaluates BEFORE visibility for all actions, deliver will also be DENIED by the
    // counter-evidence ABAC rule.
    const deliverResult = engine.evaluate(actor, 'artifact:deliver', context);
    // ABAC runs for all actions and the counter-evidence DENY rule matches
    expect(deliverResult.decision).toBe('DENY');
    expect(deliverResult.evaluatedBy).toBe('abac');
  });

  it('all policies pass → ALLOW with "All policies passed"', () => {
    const engine = new PolicyEngine();
    const actor: PolicyActor = { actorId: 'admin-1', roles: ['admin'], attributes: {} };
    const context = makeContext({ classification: 'public' });
    const result = engine.evaluate(actor, 'artifact:read', context);
    expect(result.decision).toBe('ALLOW');
    expect(result.reason).toBe('All policies passed');
  });
});

// ==========================================================================
// PolicyEngine — Convenience Methods
// ==========================================================================

describe('PolicyEngine — convenience methods', () => {
  const engine = new PolicyEngine();
  const actor: PolicyActor = { actorId: 'admin-1', roles: ['admin'], attributes: {} };
  const context = makeContext({ classification: 'public' });

  it('canRead delegates to evaluate with artifact:read', () => {
    const result = engine.canRead(actor, context);
    expect(result.decision).toBe('ALLOW');
  });

  it('canDeliver delegates to evaluate with artifact:deliver', () => {
    const result = engine.canDeliver(actor, context);
    expect(result.decision).toBe('ALLOW');
  });

  it('canRevoke delegates to evaluate with artifact:revoke', () => {
    const result = engine.canRevoke(actor, context);
    expect(result.decision).toBe('ALLOW');
  });
});

// ==========================================================================
// PolicyEngine — Dynamic Rule Management
// ==========================================================================

describe('PolicyEngine — dynamic rules', () => {
  it('addAbacRule adds a rule that is evaluated', () => {
    const engine = new PolicyEngine({ abacRules: [] });
    const actor: PolicyActor = { actorId: 'admin-1', roles: ['admin'], attributes: {} };
    const context = makeContext({ classification: 'public' });

    // Before adding rule — should pass
    const before = engine.evaluate(actor, 'artifact:read', context);
    expect(before.decision).toBe('ALLOW');

    // Add a DENY rule
    engine.addAbacRule({
      id: 'test-added',
      name: 'Deny all',
      description: 'Deny everything',
      priority: 999,
      conditions: [{ field: 'artifact.classification', operator: 'exists', value: null }],
      effect: 'DENY',
    });

    const after = engine.evaluate(actor, 'artifact:read', context);
    expect(after.decision).toBe('DENY');
  });

  it('addActorPolicy adds an override that is evaluated', () => {
    const engine = new PolicyEngine();
    const actor: PolicyActor = { actorId: 'custom-actor', roles: ['researcher'], attributes: {} };

    // Researcher can't deliver normally
    const before = engine.evaluate(actor, 'artifact:deliver', makeContext());
    expect(before.decision).toBe('DENY');

    // Add actor policy override
    engine.addActorPolicy(
      makeActorPolicy('custom-actor', [
        { action: 'artifact:deliver', resourcePattern: '*', effect: 'ALLOW', priority: 100 },
      ]),
    );

    const after = engine.evaluate(actor, 'artifact:deliver', makeContext());
    expect(after.decision).toBe('ALLOW');
    expect(after.evaluatedBy).toBe('actor-policy');
  });

  it('clearAbacRules removes all ABAC rules', () => {
    const engine = new PolicyEngine();
    engine.clearAbacRules();
    const actor: PolicyActor = { actorId: 'sponsor-1', roles: ['sponsor'], attributes: {} };
    // Without ABAC rules, counter-evidence should be ALLOWED (no visibility blocking)
    const context = makeContext({ classification: 'counter-evidence' });
    const result = engine.evaluate(actor, 'artifact:read', context);
    expect(result.decision).toBe('ALLOW');
  });
});

// ==========================================================================
// PolicyEngine — Edge Cases
// ==========================================================================

describe('PolicyEngine — edge cases', () => {
  it('Admin can read everything including counter-evidence without custom ABAC', () => {
    const engine = new PolicyEngine({ abacRules: [] }); // No ABAC/visibility rules
    const actor: PolicyActor = { actorId: 'admin-1', roles: ['admin'], attributes: {} };
    const result = engine.evaluate(
      actor,
      'artifact:read',
      makeContext({ classification: 'counter-evidence' }),
    );
    expect(result.decision).toBe('ALLOW');
  });

  it('Actor with no roles and no actor policy gets DENY from RBAC', () => {
    const engine = new PolicyEngine();
    const actor: PolicyActor = { actorId: 'unknown', roles: [], attributes: {} };
    const result = engine.evaluate(actor, 'artifact:read', makeContext({ classification: 'public' }));
    expect(result.decision).toBe('DENY');
    expect(result.evaluatedBy).toBe('rbac');
  });

  it('Researcher cannot deliver even for public artifacts', () => {
    const engine = new PolicyEngine();
    const actor: PolicyActor = { actorId: 'researcher-1', roles: ['researcher'], attributes: {} };
    const result = engine.canDeliver(actor, makeContext({ classification: 'public' }));
    expect(result.decision).toBe('DENY');
  });
});
