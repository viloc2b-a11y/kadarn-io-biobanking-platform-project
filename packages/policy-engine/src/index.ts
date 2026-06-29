// ==========================================================================
// Kadarn Policy Engine — Public API
// ==========================================================================

export { evaluate, compose, validateCondition } from './engine';

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
} from './types';

// ─── OPA Shadow Mode ──────────────────────────────────────────────────────

export { LocalOpaClient, NullOpaClient, createOpaClient } from './opa/opa-client';

export { ShadowModeRunner, ConsoleDecisionRecorder, NullDecisionRecorder } from './opa/shadow-mode';
export type { DecisionRecorder } from './opa/shadow-mode';

export { loadConfig } from './opa/config';
export type { PolicyEngineConfig } from './opa/config';

export {
  DEFAULT_POLICIES,
  organizationMembershipPolicy,
  programVisibilityPolicy,
} from './opa/policies';

export { withPolicyShadow } from './opa/with-policy-shadow';
export type { PolicyShadowOptions } from './opa/with-policy-shadow';

export type {
  PolicyDecision,
  OpaEvaluationInput,
  OpaClient,
  OpaEvaluationResult,
  ShadowModeConfig,
  PolicyDefinition,
} from './opa/types';
