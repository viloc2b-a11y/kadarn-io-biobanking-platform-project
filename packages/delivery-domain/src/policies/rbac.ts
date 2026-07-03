// ==========================================================================
// RBAC Evaluator — Role-Based Access Control
// ==========================================================================

import type { PolicyActor, PolicyDecision, DeliveryAction } from './types.js';
import { hasPermission } from './roles.js';

/**
 * Evaluate whether an actor's roles grant the requested action.
 *
 * Checks every role assigned to the actor. If ANY role grants the action,
 * the decision is ALLOW. If no role grants it, DENY.
 */
export function evaluateRbac(actor: PolicyActor, action: DeliveryAction): PolicyDecision {
  // Actor with no roles cannot perform any action
  if (actor.roles.length === 0) {
    return {
      decision: 'DENY',
      reason: `RBAC: actor ${actor.actorId} has no roles assigned`,
      evaluatedBy: 'rbac',
    };
  }

  // Check each role — first ALLOW wins
  for (const role of actor.roles) {
    if (hasPermission(role, action)) {
      return {
        decision: 'ALLOW',
        reason: `RBAC: role "${role}" grants ${action}`,
        evaluatedBy: 'rbac',
      };
    }
  }

  // No role granted the action
  return {
    decision: 'DENY',
    reason: `RBAC: no role of actor ${actor.actorId} grants ${action}`,
    evaluatedBy: 'rbac',
  };
}
