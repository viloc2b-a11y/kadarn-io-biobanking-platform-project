// ==========================================================================
// Kadarn Policy Engine — Local Policy Evaluator
// ==========================================================================
// Evaluates JSON policy definitions against an OPA-style input context.
// Uses the Kadarn engine's condition tree evaluator underneath.
// This is the bridge between the OPA interface and the existing engine.
// ==========================================================================

import { evaluate } from '../engine';
import type { Policy, PolicyEvaluation } from '../types';
import type { PolicyDefinition, OpaEvaluationInput } from './types';

// --------------------------------------------------------------------------
// evaluateLocalPolicy
// --------------------------------------------------------------------------
// Maps Kadarn engine outcomes to OPA-compatible semantics:
//   - allow → allow
//   - deny → deny
//   - conditional → depends on defaultDeny flag
//
// When defaultDeny is true (matching Rego's "default allow := false"),
// a `conditional` outcome (no rules matched) becomes `deny`.
//
// This does NOT add a catch-all rule to the policy — instead it maps
// the outcome after evaluation. This avoids the engine's deny-wins
// semantics from overriding explicit allow rules.
// --------------------------------------------------------------------------

export function evaluateLocalPolicy(
  policy: PolicyDefinition,
  input: OpaEvaluationInput,
): PolicyEvaluation {
  // Convert the OPA-style input into the Kadarn engine context
  const context: Record<string, unknown> = {
    actor: input.actor,
    organization: input.organization,
    resource: input.resource,
    action: input.action,
    ...input.context,
  };

  const kadarnPolicy: Policy = {
    id: policy.id,
    name: policy.name,
    domain: 'governance',
    status: 'active',
    version: 1,
    priority: 100,
    rules: [
      {
        id: 'r1',
        condition: policy.conditions as Parameters<typeof evaluate>[0]['rules'][0]['condition'],
        effect: policy.effect,
        reason: policy.reason,
      },
    ],
    metadata: { opaVersion: policy.version },
  };

  const result = evaluate(kadarnPolicy, context);

  // Apply defaultDeny: if no rule matched (= conditional) and the
  // policy declares defaultDeny (= Rego's "default allow := false"),
  // convert conditional to deny.
  if (
    policy.defaultDeny &&
    result.outcome === 'conditional' &&
    result.matchedRules.length === 0
  ) {
    return {
      ...result,
      outcome: 'deny',
      trace: [
        ...result.trace,
        {
          ruleId: 'default-deny',
          condition: { string: 'default deny' },
          result: false,
          reason: policy.denyReason ?? 'Default deny — no applicable allow rule matched',
        },
      ],
    };
  }

  return result;
}
