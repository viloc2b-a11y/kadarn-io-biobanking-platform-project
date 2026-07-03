// ==========================================================================
// Actor Policies — per-actor policy overrides (highest priority)
// ==========================================================================

import type {
  ActorPolicy,
  AbacCondition,
  PolicyActor,
  PolicyDecision,
  DeliveryAction,
  PolicyContext,
} from './types.js';
import { getFieldValue } from './abac.js';

/**
 * Evaluate actor-specific override policies.
 *
 * Actor policies take precedence over RBAC, ABAC, and visibility.
 * If an actor has an explicit policy rule matching the action and resource,
 * its decision is final.
 *
 * @returns PolicyDecision if an override rule matched, null otherwise.
 */
export function evaluateActorPolicies(
  actorPolicies: ActorPolicy[],
  actor: PolicyActor,
  action: DeliveryAction,
  context: PolicyContext,
): PolicyDecision | null {
  // Find the actor's policy
  const actorPolicy = actorPolicies.find((ap) => ap.actorId === actor.actorId);
  if (!actorPolicy) return null;

  // Filter rules that match the action
  const matchingRules = actorPolicy.rules.filter(
    (rule) => rule.action === action,
  );

  if (matchingRules.length === 0) return null;

  // Sort by priority descending
  const sorted = [...matchingRules].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    // Check resource pattern: '*' matches all, otherwise match against artifact type
    if (!matchesResourcePattern(rule.resourcePattern, context)) {
      continue;
    }

    // Evaluate optional conditions
    if (rule.conditions && rule.conditions.length > 0) {
      if (!evaluateActorConditions(rule.conditions, context)) {
        continue;
      }
    }

    // Match found — return the actor's override decision
    return {
      decision: rule.effect,
      reason: `Actor policy: actor ${actor.actorId} — ${rule.effect} ${action}`,
      evaluatedBy: 'actor-policy',
    };
  }

  return null;
}

/**
 * Check if a resource pattern matches the artifact in context.
 * '*' matches everything. Otherwise, exact match against artifact.type.
 */
function matchesResourcePattern(pattern: string, context: PolicyContext): boolean {
  if (pattern === '*') return true;
  return context.artifact.type === pattern;
}

/**
 * Evaluate ABAC-style conditions attached to an actor policy rule.
 */
function evaluateActorConditions(
  conditions: AbacCondition[],
  context: PolicyContext,
): boolean {
  for (const condition of conditions) {
    const fieldValue = getFieldValue(context as unknown as Record<string, unknown>, condition.field);

    switch (condition.operator) {
      case 'equals':
        if (fieldValue !== condition.value) return false;
        break;
      case 'not_equals':
        if (fieldValue === condition.value) return false;
        break;
      case 'exists':
        if (fieldValue === undefined || fieldValue === null) return false;
        break;
      case 'not_exists':
        if (fieldValue !== undefined && fieldValue !== null) return false;
        break;
      default:
        // For other operators, use deepEqual as fallback
        if (fieldValue !== condition.value) return false;
        break;
    }
  }

  return true;
}
