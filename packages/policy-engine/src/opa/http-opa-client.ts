// ==========================================================================
// Kadarn Policy Engine — HTTP OPA Client
// ==========================================================================
// Delegates evaluation to a real OPA server when OPA_SERVER_URL is set.
// Used in Shadow Mode only — never blocks; ResilientOpaClient falls back
// to LocalOpaClient on timeout or connection errors.
// ==========================================================================

import type { OpaClient, OpaEvaluationInput, OpaEvaluationResult } from './types';

export interface HttpOpaClientOptions {
  baseUrl: string;
  timeoutMs?: number;
}

export class HttpOpaClient implements OpaClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: HttpOpaClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? 2000;
  }

  async evaluate(
    policyPath: string,
    input: OpaEvaluationInput,
  ): Promise<OpaEvaluationResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v1/data/kadarn/${policyPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OPA HTTP ${response.status}: ${response.statusText}`);
      }

      const payload = await response.json() as {
        result?: { allow?: boolean; reasons?: string[]; policy_version?: string };
      };

      const result = payload.result ?? {};
      return {
        allow: result.allow ?? false,
        reasons: result.reasons ?? [],
        policyVersion: result.policy_version ?? '0.0.0',
        evaluatedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export class ResilientOpaClient implements OpaClient {
  constructor(
    private readonly primary: OpaClient,
    private readonly fallback: OpaClient,
  ) {}

  async evaluate(
    policyPath: string,
    input: OpaEvaluationInput,
  ): Promise<OpaEvaluationResult> {
    try {
      return await this.primary.evaluate(policyPath, input);
    } catch {
      return this.fallback.evaluate(policyPath, input);
    }
  }
}
