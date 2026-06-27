// ==========================================================================
// Kadarn Policy Engine — Public API
// ==========================================================================

export { evaluate, compose, validateCondition } from './engine.js';

export type {
  Policy,
  PolicyRule,
  PolicyCondition,
  PolicyConditionVar,
  PolicyConditionLiteral,
  ConditionOperand,
  PolicyDomain,
  PolicyStatus,
  PolicyOutcome,
  PolicyEvaluation,
  EvaluationTrace,
  CompositionResult,
  ComposeOptions,
} from './types.js';
