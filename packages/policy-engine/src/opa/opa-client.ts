// ==========================================================================
// Kadarn Policy Engine — OPA Client Abstraction
// ==========================================================================
// KAA-001 §5 (Technology), §14 (Exit Strategy)
//
// Thin abstraction over OPA evaluation. In Shadow Mode, evaluation is
// performed by the local Kadarn engine using JSON policy definitions.
// When OPA server is available, the same interface delegates to HTTP.
//
// The wrapper approach ensures KAA-001's exit strategy: Rego syntax is
// the only coupling; replacing OPA means replacing this file, not every
// call site.
// ==========================================================================

import type {
  OpaClient,
  OpaEvaluationInput,
  OpaEvaluationResult,
  PolicyDefinition,
} from './types';
import { evaluateLocalPolicy } from './local-evaluator';
import { HttpOpaClient, ResilientOpaClient } from './http-opa-client';
import { loadConfig } from './config';

// --------------------------------------------------------------------------
// LocalOpaClient — evaluates policies using the Kadarn engine
// --------------------------------------------------------------------------
// Used during Shadow Mode when no OPA server is available.
// Evaluates JSON policy definitions against the input context.
// Returns the composed result across all loaded policies.
// --------------------------------------------------------------------------

export class LocalOpaClient implements OpaClient {
  private policies = new Map<string, PolicyDefinition>();

  constructor(policies: PolicyDefinition[]) {
    for (const policy of policies) {
      this.policies.set(policy.id, policy);
    }
  }

  async evaluate(
    policyPath: string,
    input: OpaEvaluationInput,
  ): Promise<OpaEvaluationResult> {
    const policy = this.policies.get(policyPath);
    if (!policy) {
      // Unknown policy → allow (safe default in shadow mode)
      return {
        allow: true,
        reasons: [`Policy not found: ${policyPath} — defaulting to allow`],
        policyVersion: '0.0.0',
        evaluatedAt: new Date().toISOString(),
      };
    }

    const result = evaluateLocalPolicy(policy, input);

    // Map Kadarn engine outcome to OPA boolean:
    // - allow → true
    // - deny → false
    // - conditional → depends on defaultDeny
    //   (local-evaluator uses defaultDeny to convert conditional to deny)
    const allow = result.outcome !== 'deny';

    const reasons: string[] = [];
    if (!allow) {
      for (const trace of result.trace) {
        if (!trace.result && trace.reason) {
          reasons.push(trace.reason);
        }
      }
      if (reasons.length === 0) {
        reasons.push(`Policy "${policy.name}" evaluated to ${result.outcome}`);
      }
    }

    return {
      allow,
      reasons,
      policyVersion: policy.version,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /** Add or replace a policy at runtime */
  setPolicy(policy: PolicyDefinition): void {
    this.policies.set(policy.id, policy);
  }
}

// --------------------------------------------------------------------------
// NullOpaClient — no-op, used when shadow mode is disabled
// --------------------------------------------------------------------------

export class NullOpaClient implements OpaClient {
  async evaluate(
    _policyPath: string,
    _input: OpaEvaluationInput,
  ): Promise<OpaEvaluationResult> {
    return {
      allow: true,
      reasons: ['OPA evaluation is disabled'],
      policyVersion: '0.0.0',
      evaluatedAt: new Date().toISOString(),
    };
  }
}

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

export function createOpaClient(policies?: PolicyDefinition[]): OpaClient {
  const local = policies && policies.length > 0
    ? new LocalOpaClient(policies)
    : new NullOpaClient();

  const serverUrl = loadConfig().opaServerUrl ?? process.env.OPA_SERVER_URL;
  if (serverUrl) {
    return new ResilientOpaClient(
      new HttpOpaClient({ baseUrl: serverUrl }),
      local,
    );
  }

  return local;
}
