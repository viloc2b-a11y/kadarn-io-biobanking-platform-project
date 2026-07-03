// ==========================================================================
// Visibility Rules — controls which artifacts are visible to which actors
// ==========================================================================

import type { AbacRule, PolicyActor, PolicyDecision, DeliveryAction, PolicyContext } from './types.js';
import { evaluateAbac } from './abac.js';

/**
 * Built-in visibility rules.
 *
 * These are evaluated as ABAC rules with standard priorities:
 * - 100: public artifacts visible to all
 * - 200: confidential artifacts restricted
 * - 300: counter-evidence blocked for sponsors
 *
 * Custom rules can override these via the PolicyEngine constructor.
 */
export const VISIBILITY_RULES: AbacRule[] = [
  {
    id: 'vis-public',
    name: 'Public artifacts visible to all',
    description: 'Artifacts classified as "public" are visible to all authenticated actors',
    priority: 100,
    conditions: [{ field: 'artifact.classification', operator: 'equals', value: 'public' }],
    effect: 'ALLOW',
  },
  {
    id: 'vis-confidential-owner',
    name: 'Confidential visible only to owner',
    description: 'Confidential artifacts are only visible to their designated owner',
    priority: 200,
    conditions: [
      { field: 'artifact.classification', operator: 'equals', value: 'confidential' },
    ],
    effect: 'DENY',
  },
  {
    id: 'vis-counter-evidence',
    name: 'Counter-evidence blocked for sponsors',
    description: 'Counter-evidence artifacts are not visible to sponsors',
    priority: 300,
    conditions: [
      { field: 'artifact.classification', operator: 'equals', value: 'counter-evidence' },
    ],
    effect: 'DENY',
  },
];

/**
 * Evaluate visibility for a given actor, action, and context.
 *
 * Visibility only applies to 'artifact:read' actions. For all other actions
 * (deliver, revoke, etc.), visibility is not checked and ALLOW is returned.
 *
 * Uses ABAC rules from the engine (defaults to VISIBILITY_RULES if none provided).
 */
export function evaluateVisibility(
  actor: PolicyActor,
  action: DeliveryAction,
  context: PolicyContext,
  abacRules: AbacRule[] = VISIBILITY_RULES,
): PolicyDecision {
  // Visibility only applies to read actions
  if (action !== 'artifact:read') {
    return {
      decision: 'ALLOW',
      reason: 'Visibility: not applicable for non-read action',
      evaluatedBy: 'visibility',
    };
  }

  return evaluateAbac(abacRules, actor, action, context);
}
