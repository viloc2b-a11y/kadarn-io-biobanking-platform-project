// ==========================================================================
// ABAC Rule Engine — Attribute-Based Access Control
// Evaluates ABAC rules against the policy context.
// ==========================================================================

import type {
  AbacRule,
  AbacCondition,
  PolicyActor,
  PolicyDecision,
  DeliveryAction,
  PolicyContext,
} from './types.js';

/**
 * Evaluate a set of ABAC rules against the current context.
 *
 * Rules are sorted by priority (descending). The first rule whose ALL
 * conditions match determines the outcome. If no rules match, defaults to ALLOW
 * (RBAC has already passed at this point — ABAC can only tighten, not loosen).
 */
export function evaluateAbac(
  rules: AbacRule[],
  _actor: PolicyActor,
  _action: DeliveryAction,
  context: PolicyContext,
): PolicyDecision {
  // Sort by priority descending — higher priority evaluated first
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (evaluateAllConditions(rule.conditions, context)) {
      return {
        decision: rule.effect,
        reason: `${rule.effect === 'ALLOW' ? 'ABAC' : 'ABAC'}: rule "${rule.name}" — ${rule.description}`,
        evaluatedBy: 'abac',
      };
    }
  }

  // No rules matched — default allow (RBAC already granted base permission)
  return {
    decision: 'ALLOW',
    reason: 'ABAC: no matching rules — default allow',
    evaluatedBy: 'abac',
  };
}

/**
 * Check if all conditions in a rule match the given context.
 * Short-circuits on first failure.
 */
function evaluateAllConditions(conditions: AbacCondition[], context: PolicyContext): boolean {
  for (const condition of conditions) {
    if (!evaluateCondition(condition, context)) {
      return false;
    }
  }
  return true;
}

/**
 * Evaluate a single ABAC condition against the policy context.
 */
function evaluateCondition(condition: AbacCondition, context: PolicyContext): boolean {
  const fieldValue = getFieldValue(context as unknown as Record<string, unknown>, condition.field);
  const expectedValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return deepEqual(fieldValue, expectedValue);

    case 'not_equals':
      return !deepEqual(fieldValue, expectedValue);

    case 'in': {
      if (!Array.isArray(expectedValue)) return false;
      return expectedValue.some((v) => deepEqual(fieldValue, v));
    }

    case 'not_in': {
      if (!Array.isArray(expectedValue)) return true;
      return !expectedValue.some((v) => deepEqual(fieldValue, v));
    }

    case 'contains': {
      if (typeof fieldValue === 'string' && typeof expectedValue === 'string') {
        return fieldValue.includes(expectedValue);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((v) => deepEqual(v, expectedValue));
      }
      return false;
    }

    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;

    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;

    default:
      return false;
  }
}

/**
 * Resolve a dot-notation field path from an object.
 *
 * @example getFieldValue({ artifact: { classification: 'public' } }, 'artifact.classification')
 * // Returns 'public'
 *
 * @example getFieldValue({ artifact: { metadata: { tier: 1 } } }, 'artifact.metadata.tier')
 * // Returns 1
 */
export function getFieldValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Deep equality comparison for condition evaluation.
 * Handles primitives, arrays, and simple objects.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

  // Stringify comparison for types that don't match reference equality
  return String(a) === String(b);
}
