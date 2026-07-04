/**
 * GET /api/v1/sponsor/passports
 * RC-10.3 — Mock portfolio index (no DB).
 *
 * Envelope: success uses RC-10.2 { data, error: null }.
 * Auth errors (401/403) use instrumented envelope until AF-4.0 unification.
 */

import { withAuth, requireOrgMembership } from '@/lib/auth-guards'
import { rateLimit, WORKSPACE_RATE_LIMIT } from '@/lib/rate-limit'
import { successResponse } from '@/lib/api-response'
import { getPortfolioIndex } from '@/lib/sponsor-passport/mock-store'

export const dynamic = 'force-dynamic'

export const GET = rateLimit(
  WORKSPACE_RATE_LIMIT,
  withAuth(requireOrgMembership(async () => {
    return Response.json(successResponse(getPortfolioIndex()))
  })),
)
