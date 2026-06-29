// ==========================================================================
// Kadarn Policy Engine — Declarative Policy Evaluation
// ==========================================================================
// ADR-010: Declarative Policy Evaluation
// KRM-RAO §2.4 (Policy), §5.2 (Policy Engine)
//
// The engine is a pure function — zero external dependencies, zero database
// calls. All policy data is passed in as arguments.
// ==========================================================================

import type {
  Policy,
  PolicyCondition,
  PolicyEvaluation,
  PolicyOutcome,
  PolicyRule,
  EvaluationTrace,
  CompositionResult,
  ComposeOptions,
  ConditionOperand,
} from './types';

// --------------------------------------------------------------------------
// evaluate — evaluate a single policy against a context
// --------------------------------------------------------------------------

export function evaluate(
  policy: Policy,
  context: Record<string, unknown>,
): PolicyEvaluation {
  const traces: EvaluationTrace[] = [];
  const matchedRules: string[] = [];
  let outcome: PolicyOutcome = 'allow';

  for (const rule of policy.rules) {
    const evalResult = evaluateCondition(rule.condition, context);
    const trace: EvaluationTrace = {
      ruleId: rule.id,
      condition: rule.condition,
      result: evalResult,
      reason: (!evalResult || (evalResult && rule.effect === 'deny')) ? rule.reason : undefined,
    };
    traces.push(trace);

    if (evalResult && rule.effect === 'deny') {
      outcome = 'deny';
      matchedRules.push(rule.id);
      break; // deny wins — stop evaluating further rules
    }

    if (evalResult && rule.effect === 'allow') {
      matchedRules.push(rule.id);
    }
  }

  // If no rule matched at all → conditional (allowed but with caveat)
  if (matchedRules.length === 0) {
    outcome = 'conditional';
  }

  return {
    policyId: policy.id,
    policyName: policy.name,
    outcome,
    matchedRules,
    trace: traces,
    evaluatedAt: new Date().toISOString(),
  };
}

// --------------------------------------------------------------------------
// compose — compose multiple evaluation results
// --------------------------------------------------------------------------

export function compose(
  evaluations: PolicyEvaluation[],
  options?: ComposeOptions,
): CompositionResult {
  const denyWins = options?.denyWins ?? true;
  const conditions: string[] = [];

  if (denyWins) {
    const denies = evaluations.filter((e) => e.outcome === 'deny');
    if (denies.length > 0) {
      return {
        outcome: 'deny',
        evaluations,
        conditions: denies.flatMap((d) =>
          d.trace
            .filter((t) => !t.result && t.reason)
            .map((t) => t.reason!),
        ),
      };
    }
  }

  const conditionals = evaluations.filter((e) => e.outcome === 'conditional');
  if (conditionals.length > 0) {
    return {
      outcome: 'allow',
      evaluations,
      conditions: conditionals.map(
        (e) => `Policy "${e.policyName}" had no matching rules — review required`,
      ),
    };
  }

  // All policies produced allow
  return {
    outcome: 'allow',
    evaluations,
    conditions: [],
  };
}

// --------------------------------------------------------------------------
// evaluateCondition — recursively evaluate a condition tree
// --------------------------------------------------------------------------

function evaluateCondition(
  condition: PolicyCondition,
  context: Record<string, unknown>,
): boolean {
  // --- Var reference ---
  if ('var' in condition && Object.keys(condition).length === 1) {
    return !!resolveValue(condition as { var: string }, context);
  }

  // --- Literal values ---
  if ('bool' in condition) {
    return (condition as { bool: boolean }).bool;
  }
  if ('string' in condition) {
    return !!(condition as { string: string }).string;
  }
  if ('number' in condition) {
    return !!(condition as { number: number }).number;
  }

  // --- Logical operators ---

  // all (AND)
  if ('all' in condition) {
    const conds = (condition as { all: PolicyCondition[] }).all;
    if (!Array.isArray(conds)) return false;
    return conds.every((c) => evaluateCondition(c, context));
  }

  // any (OR)
  if ('any' in condition) {
    const conds = (condition as { any: PolicyCondition[] }).any;
    if (!Array.isArray(conds)) return false;
    return conds.some((c) => evaluateCondition(c, context));
  }

  // not (negation)
  if ('not' in condition) {
    const inner = (condition as { not: PolicyCondition }).not;
    if (!inner) return false;
    return !evaluateCondition(inner, context);
  }

  // --- Comparison operators ---

  // eq (equality)
  if ('eq' in condition) {
    const [a, b] = (condition as { eq: [ConditionOperand, ConditionOperand] }).eq;
    return resolveValue(a, context) === resolveValue(b, context);
  }

  // neq (inequality)
  if ('neq' in condition) {
    const [a, b] = (condition as { neq: [ConditionOperand, ConditionOperand] }).neq;
    return resolveValue(a, context) !== resolveValue(b, context);
  }

  // gt (greater than)
  if ('gt' in condition) {
    const [a, b] = (condition as { gt: [ConditionOperand, ConditionOperand] }).gt;
    const va = resolveValue(a, context);
    const vb = resolveValue(b, context);
    if (typeof va === 'number' && typeof vb === 'number') return va > vb;
    if (typeof va === 'string' && typeof vb === 'string') return va > vb;
    return false;
  }

  // gte (greater than or equal)
  if ('gte' in condition) {
    const [a, b] = (condition as { gte: [ConditionOperand, ConditionOperand] }).gte;
    const va = resolveValue(a, context);
    const vb = resolveValue(b, context);
    if (typeof va === 'number' && typeof vb === 'number') return va >= vb;
    if (typeof va === 'string' && typeof vb === 'string') return va >= vb;
    return false;
  }

  // lt (less than)
  if ('lt' in condition) {
    const [a, b] = (condition as { lt: [ConditionOperand, ConditionOperand] }).lt;
    const va = resolveValue(a, context);
    const vb = resolveValue(b, context);
    if (typeof va === 'number' && typeof vb === 'number') return va < vb;
    if (typeof va === 'string' && typeof vb === 'string') return va < vb;
    return false;
  }

  // lte (less than or equal)
  if ('lte' in condition) {
    const [a, b] = (condition as { lte: [ConditionOperand, ConditionOperand] }).lte;
    const va = resolveValue(a, context);
    const vb = resolveValue(b, context);
    if (typeof va === 'number' && typeof vb === 'number') return va <= vb;
    if (typeof va === 'string' && typeof vb === 'string') return va <= vb;
    return false;
  }

  // in (membership)
  if ('in' in condition) {
    const [a, arr] = (condition as { in: [ConditionOperand, unknown[]] }).in;
    if (!Array.isArray(arr)) return false;
    const va = resolveValue(a, context);
    return arr.some((item) => {
      const resolved = resolveValue(item as ConditionOperand, context);
      return resolved === va;
    });
  }

  // contains (string contains)
  if ('contains' in condition) {
    const [a, substr] = (condition as { contains: [ConditionOperand, string] }).contains;
    const va = resolveValue(a, context);
    if (typeof va === 'string' && typeof substr === 'string') {
      return va.toLowerCase().includes(substr.toLowerCase());
    }
    if (Array.isArray(va)) {
      return va.some((item) =>
        String(item).toLowerCase().includes(substr.toLowerCase()),
      );
    }
    return false;
  }

  // Unknown condition — treat as non-matching (safe default)
  return false;
}

// --------------------------------------------------------------------------
// resolveValue — resolve an operand against context
// --------------------------------------------------------------------------

function resolveValue(
  operand: ConditionOperand,
  context: Record<string, unknown>,
): unknown {
  if (operand === null || operand === undefined) {
    return operand;
  }

  if (typeof operand === 'string' || typeof operand === 'number' || typeof operand === 'boolean') {
    return operand;
  }

  if (typeof operand !== 'object') {
    return operand;
  }

  // Var reference — resolve using dot notation
  if ('var' in operand && typeof (operand as { var: unknown }).var === 'string') {
    const path = (operand as { var: string }).var;
    return resolvePath(path, context);
  }

  // Literal values
  if ('bool' in operand) return (operand as { bool: boolean }).bool;
  if ('string' in operand) return (operand as { string: string }).string;
  if ('number' in operand) return (operand as { number: number }).number;

  // Fallback
  return operand;
}

// --------------------------------------------------------------------------
// resolvePath — resolve a dot-notation path against an object
// --------------------------------------------------------------------------
// Examples:
//   "request.consent.scope" → context.request.consent.scope
//   "org.trustScore"        → context.org.trustScore
// --------------------------------------------------------------------------

function resolvePath(path: string, obj: Record<string, unknown>): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

// --------------------------------------------------------------------------
// validateCondition — type guard for runtime safety
// --------------------------------------------------------------------------

export function validateCondition(condition: unknown): condition is PolicyCondition {
  if (condition === null || condition === undefined) return false;
  if (typeof condition !== 'object') return false;

  const c = condition as Record<string, unknown>;
  const keys = Object.keys(c);

  if (keys.length === 0) return false;

  // Literal / var types
  if ('var' in c && typeof c.var === 'string') return true;
  if ('bool' in c && typeof c.bool === 'boolean') return true;
  if ('string' in c && typeof c.string === 'string') return true;
  if ('number' in c && typeof c.number === 'number') return true;

  // Logical operators
  if ('all' in c) {
    return Array.isArray(c.all) && c.all.every((child: unknown) => validateCondition(child));
  }
  if ('any' in c) {
    return Array.isArray(c.any) && c.any.every((child: unknown) => validateCondition(child));
  }
  if ('not' in c) {
    return validateCondition(c.not);
  }

  // Comparison operators
  if ('eq' in c) return validatePair(c.eq);
  if ('neq' in c) return validatePair(c.neq);
  if ('gt' in c) return validatePair(c.gt);
  if ('gte' in c) return validatePair(c.gte);
  if ('lt' in c) return validatePair(c.lt);
  if ('lte' in c) return validatePair(c.lte);

  if ('in' in c) {
    return Array.isArray(c.in) && c.in.length === 2;
  }
  if ('contains' in c) {
    return Array.isArray(c.contains) && c.contains.length === 2;
  }

  return false;
}

function validatePair(value: unknown): boolean {
  return Array.isArray(value) && value.length === 2;
}
