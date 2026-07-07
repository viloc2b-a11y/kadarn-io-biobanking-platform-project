/**
 * GET /api/v1/sponsor/passports
 * Sponsor Passport portfolio index via PassportStore.
 *
 * Envelope: success uses RC-10.2 { data, error: null }.
 * Auth errors (401/403) use instrumented envelope until AF-4.0 unification.
 */

import { withAuth, requireOrgMembership } from '@/lib/auth-guards'
import { rateLimit, WORKSPACE_RATE_LIMIT } from '@/lib/rate-limit'
import { successResponse } from '@/lib/api-response'
import { getPassportStore } from '@/lib/sponsor-passport/factory'

export const dynamic = 'force-dynamic'

export const GET = rateLimit(
  WORKSPACE_RATE_LIMIT,
  withAuth(requireOrgMembership(async (_request, _user, sponsorOrgId) => {
    const store = getPassportStore()
    const index = await store.getPortfolioIndex(sponsorOrgId)
    return Response.json(successResponse(index))
  })),
)
