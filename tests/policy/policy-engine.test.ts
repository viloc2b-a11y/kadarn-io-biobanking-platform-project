// ==========================================================================
// Kadarn Policy Engine — Unit Tests
// ==========================================================================
// Tests cover: simple conditions, logical operators (AND/OR/NOT),
// comparison operators (eq, neq, gt, gte, lt, lte, in, contains),
// var resolution (dot notation), composition (deny-wins), validation.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { evaluate, compose, validateCondition } from '../packages/policy-engine/src/engine.js';
import type { Policy, PolicyEvaluation, CompositionResult } from '../packages/policy-engine/src/types.js';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: 'test-policy-001',
    name: 'Test Policy',
    domain: 'governance',
    status: 'active',
    version: 1,
    priority: 100,
    rules: [],
    metadata: {},
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// evaluate() — simple conditions
// --------------------------------------------------------------------------

describe('evaluate() — simple conditions', () => {
  it('should allow when eq condition matches', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { eq: [{ var: 'request.consent.scope' }, 'oncology'] },
          effect: 'allow',
          reason: 'Consent scope is oncology',
        },
      ],
    });

    const result = evaluate(policy, { request: { consent: { scope: 'oncology' } } });

    expect(result.outcome).toBe('allow');
    expect(result.matchedRules).toContain('r1');
    expect(result.trace).toHaveLength(1);
    expect(result.trace[0].result).toBe(true);
  });

  it('should deny when deny rule condition matches', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { eq: [{ var: 'specimen.type' }, 'whole_blood'] },
          effect: 'deny',
          reason: 'Whole blood specimens cannot be exported',
        },
      ],
    });

    const result = evaluate(policy, { specimen: { type: 'whole_blood' } });

    expect(result.outcome).toBe('deny');
    expect(result.matchedRules).toContain('r1');
    expect(result.trace[0].reason).toBe('Whole blood specimens cannot be exported');
  });

  it('should produce conditional when no rule matches', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { eq: [{ var: 'specimen.type' }, 'ffpe'] },
          effect: 'allow',
          reason: 'FFPE specimens are allowed',
        },
      ],
    });

    const result = evaluate(policy, { specimen: { type: 'whole_blood' } });

    expect(result.outcome).toBe('conditional');
    expect(result.matchedRules).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// evaluate() — logical operators
// --------------------------------------------------------------------------

describe('evaluate() — logical operators', () => {
  it('should handle all (AND) — both conditions pass', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: {
            all: [
              { eq: [{ var: 'request.consent.scope' }, 'oncology'] },
              { eq: [{ var: 'request.purpose' }, 'research'] },
            ],
          },
          effect: 'allow',
        },
      ],
    });

    const result = evaluate(policy, {
      request: { consent: { scope: 'oncology' }, purpose: 'research' },
    });

    expect(result.outcome).toBe('allow');
  });

  it('should handle all (AND) — one condition fails', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: {
            all: [
              { eq: [{ var: 'request.consent.scope' }, 'oncology'] },
              { eq: [{ var: 'request.purpose' }, 'research'] },
            ],
          },
          effect: 'allow',
        },
      ],
    });

    const result = evaluate(policy, {
      request: { consent: { scope: 'oncology' }, purpose: 'commercial' },
    });

    expect(result.outcome).toBe('conditional');
    expect(result.trace[0].result).toBe(false);
  });

  it('should handle any (OR) — one condition passes', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: {
            any: [
              { eq: [{ var: 'request.role' }, 'admin'] },
              { eq: [{ var: 'request.role' }, 'coordinator'] },
            ],
          },
          effect: 'allow',
        },
      ],
    });

    const result = evaluate(policy, { request: { role: 'coordinator' } });

    expect(result.outcome).toBe('allow');
  });

  it('should handle any (OR) — all fail', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: {
            any: [
              { eq: [{ var: 'request.role' }, 'admin'] },
              { eq: [{ var: 'request.role' }, 'coordinator'] },
            ],
          },
          effect: 'allow',
        },
      ],
    });

    const result = evaluate(policy, { request: { role: 'viewer' } });

    expect(result.outcome).toBe('conditional');
  });

  it('should handle not (negation)', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: {
            not: { eq: [{ var: 'shipment.temperature' }, 'breached'] },
          },
          effect: 'allow',
        },
      ],
    });

    const result = evaluate(policy, { shipment: { temperature: 'normal' } });

    expect(result.outcome).toBe('allow');
  });

  it('should deny when not negates a deny condition', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: {
            not: { eq: [{ var: 'org.isActive' }, true] },
          },
          effect: 'deny',
          reason: 'Organization is not active',
        },
      ],
    });

    const result = evaluate(policy, { org: { isActive: false } });

    expect(result.outcome).toBe('deny');
  });
});

// --------------------------------------------------------------------------
// evaluate() — comparison operators
// --------------------------------------------------------------------------

describe('evaluate() — comparison operators', () => {
  it('should handle neq (not equal)', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { neq: [{ var: 'specimen.type' }, 'whole_blood'] },
          effect: 'allow',
        },
      ],
    });

    expect(evaluate(policy, { specimen: { type: 'ffpe' } }).outcome).toBe('allow');
    expect(evaluate(policy, { specimen: { type: 'whole_blood' } }).outcome).toBe('conditional');
  });

  it('should handle gt (greater than)', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { gt: [{ var: 'fulfillment.estimatedValue' }, 10000] },
          effect: 'deny',
          reason: 'Value exceeds threshold',
        },
      ],
    });

    expect(evaluate(policy, { fulfillment: { estimatedValue: 15000 } }).outcome).toBe('deny');
    expect(evaluate(policy, { fulfillment: { estimatedValue: 5000 } }).outcome).toBe('conditional');
  });

  it('should handle gte (greater than or equal)', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { gte: [{ var: 'org.trustScore' }, 0.7] },
          effect: 'allow',
        },
      ],
    });

    expect(evaluate(policy, { org: { trustScore: 0.7 } }).outcome).toBe('allow');
    expect(evaluate(policy, { org: { trustScore: 0.85 } }).outcome).toBe('allow');
    expect(evaluate(policy, { org: { trustScore: 0.69 } }).outcome).toBe('conditional');
  });

  it('should handle lt (less than)', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { lt: [{ var: 'specimen.freezeThawCount' }, 3] },
          effect: 'allow',
        },
      ],
    });

    expect(evaluate(policy, { specimen: { freezeThawCount: 2 } }).outcome).toBe('allow');
    expect(evaluate(policy, { specimen: { freezeThawCount: 5 } }).outcome).toBe('conditional');
  });

  it('should handle lte (less than or equal)', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { lte: [{ var: 'specimen.freezeThawCount' }, 3] },
          effect: 'allow',
        },
      ],
    });

    expect(evaluate(policy, { specimen: { freezeThawCount: 3 } }).outcome).toBe('allow');
    expect(evaluate(policy, { specimen: { freezeThawCount: 4 } }).outcome).toBe('conditional');
  });

  it('should handle in (membership)', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { in: [{ var: 'request.purpose' }, ['research', 'qa', 'assay_development']] },
          effect: 'allow',
        },
      ],
    });

    expect(evaluate(policy, { request: { purpose: 'research' } }).outcome).toBe('allow');
    expect(evaluate(policy, { request: { purpose: 'qa' } }).outcome).toBe('allow');
    expect(evaluate(policy, { request: { purpose: 'commercial' } }).outcome).toBe('conditional');
  });

  it('should handle contains (string contains)', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { contains: [{ var: 'specimen.id' }, 'TMA-'] },
          effect: 'allow',
        },
      ],
    });

    expect(evaluate(policy, { specimen: { id: 'TMA-0042-B' } }).outcome).toBe('allow');
    expect(evaluate(policy, { specimen: { id: 'FFPE-0088-A' } }).outcome).toBe('conditional');
  });
});

// --------------------------------------------------------------------------
// evaluate() — complex nested conditions
// --------------------------------------------------------------------------

describe('evaluate() — complex nested conditions', () => {
  it('should handle deeply nested all/any/not', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: {
            all: [
              { eq: [{ var: 'request.consent.scope' }, 'oncology'] },
              {
                any: [
                  { eq: [{ var: 'request.purpose' }, 'research'] },
                  { eq: [{ var: 'request.purpose' }, 'qa'] },
                ],
              },
              {
                not: { eq: [{ var: 'specimen.type' }, 'whole_blood'] },
              },
            ],
          },
          effect: 'allow',
        },
      ],
    });

    const context = {
      request: { consent: { scope: 'oncology' }, purpose: 'research' },
      specimen: { type: 'ffpe' },
    };

    expect(evaluate(policy, context).outcome).toBe('allow');
  });

  it('should stop at first deny rule', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { eq: [{ var: 'specimen.type' }, 'whole_blood'] },
          effect: 'deny',
          reason: 'Export restricted',
        },
        {
          id: 'r2',
          condition: { eq: [{ var: 'specimen.type' }, 'ffpe'] },
          effect: 'allow',
        },
      ],
    });

    const result = evaluate(policy, { specimen: { type: 'whole_blood' } });

    expect(result.outcome).toBe('deny');
    expect(result.matchedRules).toEqual(['r1']);
    // r2 should not have been evaluated
    expect(result.trace).toHaveLength(1);
  });

  it('should evaluate remaining rules after allow', () => {
    const policy = makePolicy({
      rules: [
        {
          id: 'r1',
          condition: { eq: [{ var: 'specimen.type' }, 'ffpe'] },
          effect: 'allow',
        },
        {
          id: 'r2',
          condition: { eq: [{ var: 'specimen.type' }, 'whole_blood'] },
          effect: 'deny',
          reason: 'Export restricted',
        },
      ],
    });

    const result = evaluate(policy, { specimen: { type: 'ffpe' } });

    // First rule matches (allow), but we continue evaluating
    // The second rule doesn't match (type is ffpe, not whole_blood)
    expect(result.outcome).toBe('allow');
    expect(result.trace).toHaveLength(2);
  });
});

// --------------------------------------------------------------------------
// compose() — composition strategy
// --------------------------------------------------------------------------

describe('compose()', () => {
  function makeEvaluation(overrides: Partial<PolicyEvaluation> = {}): PolicyEvaluation {
    return {
      policyId: 'p1',
      policyName: 'Policy 1',
      outcome: 'allow',
      matchedRules: [],
      trace: [],
      evaluatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  it('should allow when all policies allow', () => {
    const result = compose([
      makeEvaluation({ outcome: 'allow' }),
      makeEvaluation({ outcome: 'allow' }),
    ]);

    expect(result.outcome).toBe('allow');
  });

  it('should deny when denyWins and any policy denies', () => {
    const result = compose([
      makeEvaluation({ outcome: 'allow' }),
      makeEvaluation({ outcome: 'deny', policyName: 'High-Value Check' }),
    ]);

    expect(result.outcome).toBe('deny');
  });

  it('should include deny reasons as conditions', () => {
    const denyEval = makeEvaluation({
      outcome: 'deny',
      policyName: 'High-Value Check',
      trace: [
        {
          ruleId: 'r1',
          condition: { gt: [{ var: 'value' }, 10000] },
          result: false,
          reason: 'Shipments over $10,000 require dual authorization',
        },
      ],
    });

    const result = compose([denyEval]);

    expect(result.outcome).toBe('deny');
    expect(result.conditions).toContain('Shipments over $10,000 require dual authorization');
  });

  it('should allow with conditions when conditional and allow', () => {
    const result = compose([
      makeEvaluation({ outcome: 'allow' }),
      makeEvaluation({ outcome: 'conditional', policyName: 'Optional Check' }),
    ]);

    expect(result.outcome).toBe('allow');
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toContain('Optional Check');
  });

  it('should allow when denyWins is false and policies deny', () => {
    const result = compose(
      [
        makeEvaluation({ outcome: 'deny' }),
      ],
      { denyWins: false },
    );

    expect(result.outcome).toBe('allow');
  });
});

// --------------------------------------------------------------------------
// validateCondition()
// --------------------------------------------------------------------------

describe('validateCondition()', () => {
  it('should accept valid var condition', () => {
    expect(validateCondition({ var: 'request.consent.scope' })).toBe(true);
  });

  it('should accept valid eq condition', () => {
    expect(validateCondition({ eq: [{ var: 'a' }, 'b'] })).toBe(true);
  });

  it('should accept valid all condition', () => {
    expect(validateCondition({ all: [{ eq: [{ var: 'a' }, 1] }, { eq: [{ var: 'b' }, 2] }] })).toBe(true);
  });

  it('should accept valid any condition', () => {
    expect(validateCondition({ any: [{ eq: [{ var: 'a' }, 1] }] })).toBe(true);
  });

  it('should accept valid not condition', () => {
    expect(validateCondition({ not: { eq: [{ var: 'a' }, 1] } })).toBe(true);
  });

  it('should accept valid in condition', () => {
    expect(validateCondition({ in: [{ var: 'a' }, ['x', 'y']] })).toBe(true);
  });

  it('should accept valid contains condition', () => {
    expect(validateCondition({ contains: [{ var: 'a' }, 'test'] })).toBe(true);
  });

  it('should reject null', () => {
    expect(validateCondition(null)).toBe(false);
  });

  it('should reject empty object', () => {
    expect(validateCondition({})).toBe(false);
  });

  it('should reject number', () => {
    expect(validateCondition(42)).toBe(false);
  });

  it('should reject invalid eq (not an array)', () => {
    expect(validateCondition({ eq: 'invalid' })).toBe(false);
  });

  it('should accept literal conditions', () => {
    expect(validateCondition({ bool: true })).toBe(true);
    expect(validateCondition({ string: 'hello' })).toBe(true);
    expect(validateCondition({ number: 42 })).toBe(true);
  });
});
