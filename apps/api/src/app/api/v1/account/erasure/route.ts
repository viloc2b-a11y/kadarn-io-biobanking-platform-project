// ==========================================================================
// KPR-03 — GDPR Erasure Endpoint
// POST /api/v1/account/erasure
// ==========================================================================
// Implements GDPR Art.17 Right to Erasure (Right to be Forgotten).
//
// Strategy:
//   - Anonymize personal identifiers
//   - Preserve provenance (append-only invariant — legally justified)
//   - Maintain referential integrity
//   - Preserve audit trail
//
// Legal basis for provenance retention:
//   GDPR Art.17(3)(d) — archiving purposes in the public interest
//   GDPR Art.17(3)(e) — scientific or historical research purposes
// ==========================================================================

import { withAuth, handleApiError, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { executeErasure } from '@/lib/gdpr'
import { logger } from '@/lib/logger'

/**
 * POST /api/v1/account/erasure
 * Request full erasure of the authenticated user's personal data.
 * 
 * This is idempotent — calling it multiple times for the same user
 * returns the same result (already anonymized).
 */
export const POST = withAsyncTracing(
  withAuth(async (_request, user) => {
    try {
      const correlationId = crypto.randomUUID()
      const result = await executeErasure(user.id)

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      const orgId = user.user_metadata?.active_org_id as string | null
      console.log(JSON.stringify({
        type: 'domain_event',
        event: {
          type: 'UserErasureCompleted',
          payload: {
            userId: user.id,
            organizationId: orgId,
            profilesAnonymized: result.profiles_anonymized,
            membershipsAnonymized: result.memberships_anonymized,
            provenancePreserved: result.provenance_preserved,
          },
          actorId: user.id,
          organizationId: orgId,
          correlationId,
        },
        timestamp: new Date().toISOString(),
      }))

      return Response.json({
        data: {
          ...result,
          message: 'Your personal data has been anonymized. Provenance records are preserved for scientific research purposes (GDPR Art.17(3)(e)).',
          correlationId,
        },
        error: null,
      })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'account.erasure', 'kadarn.api.method': 'POST' } },
)
