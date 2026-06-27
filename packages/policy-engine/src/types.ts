// ==========================================================================
// Kadarn Policy Engine — Type Definitions
// ==========================================================================
// ADR-010: Declarative Policy Evaluation
// KRM-RAO §2.4 (Policy), §5.2 (Policy Engine)
// ==========================================================================

// --------------------------------------------------------------------------
// Policy Condition — JSON expression tree
// --------------------------------------------------------------------------
// A condition is a recursive tree of operators. Leaf nodes are var
// references or literal values. Branch nodes are logical operators
// (all, any, not) or comparison operators (eq, neq, gt, gte, lt, lte,
// in, contains).
//
// Examples:
//   { "eq": [{ "var": "request.consent.scope" }, "oncology"] }
//   { "all": [cond1, { "not": cond2 }] }
//   { "in": [{ "var": "request.purpose" }, ["research", "qa"]] }
// --------------------------------------------------------------------------

export interface PolicyConditionVar {
  var: string;
}

export interface PolicyConditionLiteral {
  bool?: boolean;
  string?: string;
  number?: number;
}

export interface PolicyConditionComparison {
  eq?: [ConditionOperand, ConditionOperand];
  neq?: [ConditionOperand, ConditionOperand];
  gt?: [ConditionOperand, ConditionOperand];
  gte?: [ConditionOperand, ConditionOperand];
  lt?: [ConditionOperand, ConditionOperand];
  lte?: [ConditionOperand, ConditionOperand];
  in?: [ConditionOperand, unknown[]];
  contains?: [ConditionOperand, string];
}

export interface PolicyConditionLogical {
  all?: PolicyCondition[];
  any?: PolicyCondition[];
  not?: PolicyCondition;
}

export type ConditionOperand =
  | PolicyConditionVar
  | PolicyConditionLiteral
  | string
  | number
  | boolean
  | null;

export type PolicyCondition =
  | PolicyConditionVar
  | PolicyConditionLiteral
  | PolicyConditionComparison
  | PolicyConditionLogical;

// --------------------------------------------------------------------------
// Policy Rule
// --------------------------------------------------------------------------

export interface PolicyRule {
  /** Unique rule ID within its policy */
  id: string;
  /** Condition tree — evaluated against context */
  condition: PolicyCondition;
  /** What happens when this rule matches */
  effect: 'allow' | 'deny';
  /** Human-readable explanation (shown in trace) */
  reason?: string;
}

// --------------------------------------------------------------------------
// Policy
// --------------------------------------------------------------------------

export type PolicyDomain = 'governance' | 'financial' | 'regulatory' | 'operational';
export type PolicyStatus = 'draft' | 'active' | 'inactive' | 'deprecated';

export interface Policy {
  id: string;
  name: string;
  description?: string;
  domain: PolicyDomain;
  status: PolicyStatus;
  version: number;
  /** Lower values = higher priority */
  priority: number;
  /** Ordered list of rules (evaluated in order, first match wins) */
  rules: PolicyRule[];
  /** Free-form metadata (IRB reference, category, thresholds, etc.) */
  metadata: Record<string, unknown>;
}

// --------------------------------------------------------------------------
// Evaluation
// --------------------------------------------------------------------------

export type PolicyOutcome = 'allow' | 'deny' | 'conditional';

export interface EvaluationTrace {
  /** Rule ID that was evaluated */
  ruleId: string;
  /** The condition as evaluated */
  condition: PolicyCondition;
  /** Whether the condition matched */
  result: boolean;
  /** Human-readable explanation (present when denied) */
  reason?: string;
}

export interface PolicyEvaluation {
  policyId: string;
  policyName: string;
  outcome: PolicyOutcome;
  /** IDs of rules that matched and determined the outcome */
  matchedRules: string[];
  /** Full trace of all rule evaluations */
  trace: EvaluationTrace[];
  /** ISO 8601 timestamp */
  evaluatedAt: string;
}

// --------------------------------------------------------------------------
// Composition
// --------------------------------------------------------------------------

export interface CompositionResult {
  /** Final composed outcome */
  outcome: PolicyOutcome;
  /** Individual evaluation results */
  evaluations: PolicyEvaluation[];
  /** Human-readable conditions or caveats attached to the outcome */
  conditions: string[];
}

// --------------------------------------------------------------------------
// Composition options
// --------------------------------------------------------------------------

export interface ComposeOptions {
  /**
   * If true (default), any deny from any policy produces a final deny.
   * This is the safety invariant — a single hard block stops the flow.
   */
  denyWins?: boolean;
}
