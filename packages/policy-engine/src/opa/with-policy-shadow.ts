// ==========================================================================
// Kadarn Policy Engine — withPolicyShadow Middleware
// ==========================================================================
// KAA-001 §6 (Shadow Mode)
//
// Wraps an existing withAuth handler to add parallel OPA evaluation.
// The OPA decision is NEVER used to block — it's recorded for comparison.
//
// Usage:
//
//   import { withPolicyShadow, createOpaClient, loadConfig, DEFAULT_POLICIES } from '@kadarn/policy-engine';
//
//   const config = loadConfig();
//   const opaClient = createOpaClient(DEFAULT_POLICIES);
//
//   export const GET = withPolicyShadow(
//     withAuth(async (request, user) => { ... }),
//     { config, opaClient, policies: DEFAULT_POLICIES },
//   );
// ==========================================================================

import type { OpaClient, PolicyDefinition } from './types';
import type { PolicyEngineConfig } from './config';
import { loadConfig } from './config';
import { ShadowModeRunner, createDefaultShadowRecorder, NullDecisionRecorder } from './shadow-mode';

export interface PolicyShadowOptions {
  config?: PolicyEngineConfig;
  opaClient?: OpaClient;
  policies?: PolicyDefinition[];
}

/**
 * Wraps an existing route handler with OPA Shadow Mode evaluation.
 * The OPA result is recorded but NEVER blocks the request.
 * Existing authorization remains authoritative.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withPolicyShadow<
  T extends (...args: any[]) => Promise<Response>,
>(
  handler: T,
  options?: PolicyShadowOptions,
): T {
  const config = options?.config ?? loadConfig();
  const opaClient = options?.opaClient ?? null;
  const policies = options?.policies ?? [];
  const recorder = config.opaShadowMode
    ? createDefaultShadowRecorder()
    : new NullDecisionRecorder();

  const runner = opaClient
    ? new ShadowModeRunner(opaClient, recorder, config, policies)
    : null;

  const wrapped = async (...args: unknown[]): Promise<Response> => {
    // Execute the original handler first — it runs to completion
    const response = await handler(...args);

    // Fire-and-forget OPA shadow evaluation (non-blocking)
    if (runner && config.opaShadowMode && response.status < 500) {
      // Extract auth context from handler args (withAuth passes [request, user, params])
      const [request, user] = args as [Request, { id: string; email?: string; user_metadata?: Record<string, unknown> } | undefined];
      
      if (request && user) {
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/').filter(Boolean);
        const resourceType = pathParts[0] ?? 'unknown';
        const resourceId = pathParts[pathParts.length - 1]?.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
          ? pathParts[pathParts.length - 1]
          : null;

        const role = (user.user_metadata?.kadarn_role as string) ?? 'marketplace_user';

        runner.evaluate({
          actor: { id: user.id, role, email: user.email },
          organization: { id: null },
          resource: { type: resourceType, id: resourceId },
          action: request.method.toLowerCase(),
          context: {
            path: url.pathname,
            responseStatus: response.status,
          },
        }).catch((err: unknown) => {
          console.error('[OPA-SHADOW] Async evaluation error:', err);
        });
      }
    }

    return response;
  };

  return wrapped as unknown as T;
}
