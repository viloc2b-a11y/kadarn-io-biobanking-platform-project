// ==========================================================================
// Kadarn Policy Engine — Shadow Mode Runner
// ==========================================================================
// KAA-001 §6 (Shadow Mode / Enforce Mode)
//
// Shadow Mode runs OPA evaluation in parallel with existing authorization.
// OPA never blocks. Decisions are recorded for comparison.
//
// The runner wraps existing auth handlers, adding OPA evaluation as a
// fire-and-forget side effect. The existing Kadarn decision (from RLS +
// route checks) remains authoritative.
//
// Only policies matching the request's resource type are evaluated.
// Non-matching policies are skipped (they don't apply).
// ==========================================================================

import type {
  OpaClient,
  PolicyDecision,
  OpaEvaluationInput,
  PolicyDefinition,
} from './types';
import type { PolicyEngineConfig } from './config';

// --------------------------------------------------------------------------
// Decision Recorder
// --------------------------------------------------------------------------

export interface DecisionRecorder {
  record(decision: PolicyDecision): void;
}

let policyShadowDecisionSink: ((decision: PolicyDecision) => void) | null = null;

/** Wire shadow decisions to the domain event runtime (API bootstrap). */
export function setPolicyShadowDecisionSink(
  sink: ((decision: PolicyDecision) => void) | null,
): void {
  policyShadowDecisionSink = sink;
}

export function getPolicyShadowDecisionSink(): ((decision: PolicyDecision) => void) | null {
  return policyShadowDecisionSink;
}

/**
 * Callback decision recorder — forwards to an injected sink (event bus, tests).
 */
export class CallbackDecisionRecorder implements DecisionRecorder {
  constructor(private readonly onRecord: (decision: PolicyDecision) => void) {}

  record(decision: PolicyDecision): void {
    this.onRecord(decision);
  }
}

/**
 * In-memory decision recorder — collects decisions for tests and diagnostics.
 */
export class InMemoryDecisionRecorder implements DecisionRecorder {
  readonly decisions: PolicyDecision[] = [];

  record(decision: PolicyDecision): void {
    this.decisions.push(decision);
  }

  clear(): void {
    this.decisions.length = 0;
  }
}

/**
 * Null decision recorder — drops all decisions (used when shadow mode is off).
 */
export class NullDecisionRecorder implements DecisionRecorder {
  record(_decision: PolicyDecision): void {
    // no-op
  }
}

export function createDefaultShadowRecorder(): DecisionRecorder {
  const sink = policyShadowDecisionSink;
  if (sink) {
    return new CallbackDecisionRecorder(sink);
  }
  return new NullDecisionRecorder();
}

// --------------------------------------------------------------------------
// ShadowModeRunner
// --------------------------------------------------------------------------

export class ShadowModeRunner {
  constructor(
    private readonly client: OpaClient,
    private readonly recorder: DecisionRecorder,
    private readonly config: PolicyEngineConfig,
    private readonly policies: PolicyDefinition[],
  ) {}

  /**
   * Run OPA evaluation in shadow mode.
   * Only policies matching the request's resource type are evaluated.
   * Returns the OPA decision but NEVER uses it to block.
   * Existing authorization remains authoritative.
   */
  async evaluate(input: OpaEvaluationInput): Promise<PolicyDecision | null> {
    if (!this.config.opaShadowMode) {
      return null;
    }

    try {
      // Filter policies by resource type
      const applicablePolicies = this.policies.filter((p) => {
        if (!p.resourceTypes || p.resourceTypes.length === 0) return true;
        return p.resourceTypes.includes(input.resource.type);
      });

      if (applicablePolicies.length === 0) {
        // No policies apply to this resource — nothing to evaluate
        return null;
      }

      // Evaluate each applicable policy through the OPA client
      const results = await Promise.all(
        applicablePolicies.map(async (policy) => {
          const result = await this.client.evaluate(policy.id, input);
          return { policy, result };
        }),
      );

      // Compose results: we use the engine's compose() semantics
      // (deny wins, conditional treated as allow-with-warning)
      const opaAllow = results.every((r) => r.result.allow);
      const reasons = results.flatMap((r) => r.result.reasons);

      const decision: PolicyDecision = {
        decisionId: crypto.randomUUID(),
        policyId: applicablePolicies.map((p) => p.id).join(','),
        policyVersion: this.config.defaultPolicyVersion,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        organizationId: input.organization.id,
        resourceType: input.resource.type,
        resourceId: input.resource.id,
        action: input.action,
        kadarnDecision: 'allow', // Existing auth already approved (we're in the handler)
        opaDecision: opaAllow ? 'allow' : 'deny',
        match: true, // In shadow mode, existing auth is the truth
        mode: 'shadow',
        reasons,
        evaluatedAt: new Date().toISOString(),
      };

      // Record disagreement if OPA denied
      if (!opaAllow) {
        decision.match = false;
      }

      this.recorder.record(decision);
      return decision;
    } catch (error) {
      if (this.config.opaFailOpen) {
        console.error('[OPA-SHADOW] Evaluation error (fail-open):', error);
        return null;
      }
      // Fail-close would be used in enforcement mode
      console.error('[OPA-SHADOW] Evaluation error (fail-close):', error);
      return null;
    }
  }
}
