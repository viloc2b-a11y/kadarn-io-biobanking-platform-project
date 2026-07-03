// ==========================================================================
// PolicyEngine — Authorization orchestrator (KEMS-007 §D)
// Combines RBAC → ABAC → Visibility with actor-policy overrides.
// ==========================================================================

import type {
  AbacRule,
  ActorPolicy,
  PolicyActor,
  PolicyDecision,
  DeliveryAction,
  PolicyContext,
} from './types.js';
import { evaluateRbac } from './rbac.js';
import { evaluateAbac } from './abac.js';
import { evaluateVisibility, VISIBILITY_RULES } from './visibility.js';
import { evaluateActorPolicies } from './actor-policies.js';

/**
 * The PolicyEngine is the single entry point for authorization decisions
 * in the Delivery Domain.
 *
 * Evaluation order (first to win):
 * 1. Actor-specific override policies (highest priority)
 * 2. RBAC — does the actor's role have the required permission?
 * 3. ABAC — attribute-based rules evaluated against artifact + context
 * 4. Visibility — is the artifact visible to this actor? (read-only)
 *
 * If all layers pass, the default is ALLOW.
 */
export class PolicyEngine {
  private abacRules: AbacRule[];
  private actorPolicies: ActorPolicy[];

  constructor(options?: { abacRules?: AbacRule[]; actorPolicies?: ActorPolicy[] }) {
    this.abacRules = options?.abacRules ?? [...VISIBILITY_RULES];
    this.actorPolicies = options?.actorPolicies ?? [];
  }

  /**
   * Evaluate whether an actor can perform an action on an artifact in context.
   *
   * @returns PolicyDecision with ALLOW or DENY and a human-readable reason.
   */
  evaluate(actor: PolicyActor, action: DeliveryAction, context: PolicyContext): PolicyDecision {
    // 1. Actor-specific override policies (highest priority)
    const actorDecision = evaluateActorPolicies(this.actorPolicies, actor, action, context);
    if (actorDecision) return actorDecision;

    // 2. RBAC check — role-based permissions
    const rbacDecision = evaluateRbac(actor, action);
    if (rbacDecision.decision === 'DENY') return rbacDecision;

    // 3. ABAC rules — attribute-based restrictions
    const abacDecision = evaluateAbac(this.abacRules, actor, action, context);
    if (abacDecision.decision === 'DENY') return abacDecision;

    // 4. Visibility rules — only for read actions (uses engine's ABAC rule pool)
    if (action === 'artifact:read') {
      const visDecision = evaluateVisibility(actor, action, context, this.abacRules);
      if (visDecision.decision === 'DENY') return visDecision;
    }

    return {
      decision: 'ALLOW',
      reason: 'All policies passed',
      evaluatedBy: 'rbac',
    };
  }

  /** Convenience: check read access. */
  canRead(actor: PolicyActor, context: PolicyContext): PolicyDecision {
    return this.evaluate(actor, 'artifact:read', context);
  }

  /** Convenience: check deliver access. */
  canDeliver(actor: PolicyActor, context: PolicyContext): PolicyDecision {
    return this.evaluate(actor, 'artifact:deliver', context);
  }

  /** Convenience: check revoke access. */
  canRevoke(actor: PolicyActor, context: PolicyContext): PolicyDecision {
    return this.evaluate(actor, 'artifact:revoke', context);
  }

  /** Add an ABAC rule to the engine at runtime. */
  addAbacRule(rule: AbacRule): void {
    this.abacRules.push(rule);
  }

  /** Add an actor-specific policy override. */
  addActorPolicy(policy: ActorPolicy): void {
    this.actorPolicies.push(policy);
  }

  /** Remove all ABAC rules (useful for testing). */
  clearAbacRules(): void {
    this.abacRules = [];
  }
}
