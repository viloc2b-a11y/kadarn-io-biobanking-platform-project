// ==========================================================================
// Kadarn Policy Engine — OPA Shadow Mode Types
// ==========================================================================
// KAA-001 §6 (Core Concepts), §7 (Policy Evaluations)
//
// These types model the OPA evaluation interface for Shadow Mode.
// They are designed to be compatible with real OPA decision logs
// while remaining evaluable by the local Kadarn engine.
// ==========================================================================

// --------------------------------------------------------------------------
// Policy Decision
// --------------------------------------------------------------------------

export interface PolicyDecision {
  /** Unique decision ID */
  decisionId: string;
  /** Which policy was evaluated */
  policyId: string;
  /** Policy version */
  policyVersion: string;
  /** Actor (user) who triggered the evaluation */
  actorId: string;
  /** Actor's Kadarn role */
  actorRole: string;
  /** Active organization context */
  organizationId: string | null;
  /** Type of resource being accessed */
  resourceType: string;
  /** Specific resource ID */
  resourceId: string | null;
  /** Action being performed */
  action: string;
  /** Decision from existing Kadarn authorization */
  kadarnDecision: 'allow' | 'deny';
  /** Decision from OPA evaluation */
  opaDecision: 'allow' | 'deny';
  /** Whether Kadarn and OPA agreed */
  match: boolean;
  /** Human-readable reasons */
  reasons: string[];
  /** ISO 8601 timestamp */
  evaluatedAt: string;
  /** Evaluation mode: shadow (non-blocking) or enforce (authoritative) */
  mode: 'shadow' | 'enforce';
}

// --------------------------------------------------------------------------
// OPA Evaluation Input
// --------------------------------------------------------------------------

export interface OpaEvaluationInput {
  actor: {
    id: string;
    role: string;
    email?: string;
  };
  organization: {
    id: string | null;
    capabilities?: string[];
  };
  resource: {
    type: string;
    id: string | null;
  };
  action: string;
  context: Record<string, unknown>;
}

// --------------------------------------------------------------------------
// OPA Client Interface
// --------------------------------------------------------------------------

export interface OpaClient {
  /** Evaluate a single policy */
  evaluate(
    policyPath: string,
    input: OpaEvaluationInput,
  ): Promise<OpaEvaluationResult>;
}

export interface OpaEvaluationResult {
  allow: boolean;
  reasons: string[];
  policyVersion: string;
  evaluatedAt: string;
}

// --------------------------------------------------------------------------
// Shadow Mode Runner Config
// --------------------------------------------------------------------------

export interface ShadowModeConfig {
  /** Master switch: enable OPA evaluation */
  enabled: boolean;
  /** Fail-open: if OPA errors, request still proceeds */
  failOpen: boolean;
  /** Policy directory path */
  policyDir: string;
  /** Default policy version */
  defaultPolicyVersion: string;
}

// --------------------------------------------------------------------------
// Policy Definition (JSON-form, evaluated by local engine)
// --------------------------------------------------------------------------

export interface PolicyDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  /** Rego source (reference only in shadow mode) */
  rego?: string;
  /** JSON condition tree for local evaluation */
  conditions: Record<string, unknown>;
  /** Effect when conditions match */
  effect: 'allow' | 'deny';
  reason: string;
  /**
   * If true, adds a default-deny catch-all rule.
   * Mirrors Rego's "default allow := false".
   * When no allow rule matches, the policy denies.
   */
  defaultDeny?: boolean;
  /** Reason used when the default-deny rule fires */
  denyReason?: string;
  /**
   * Resource types this policy applies to.
   * If empty/undefined, applies to all resources.
   * Examples: ['organization', 'program', 'exchange.deal']
   */
  resourceTypes?: string[];
}
