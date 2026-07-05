/**
 * GET /api/v1/sponsor/passports/:institutionId
 * RC-10.3 — Mock passport detail (no DB).
 */

import { withAuth, requireOrgMembership } from '@/lib/auth-guards'
import { notFound, successResponse } from '@/lib/api-response'
import { rateLimit, WORKSPACE_RATE_LIMIT } from '@/lib/rate-limit'
import { getPassportStore } from '@/lib/sponsor-passport/factory'

export const dynamic = 'force-dynamic'

export const GET = rateLimit(
  WORKSPACE_RATE_LIMIT,
  withAuth(requireOrgMembership(async (_request, _user, sponsorOrgId, params) => {
    const institutionId = params?.institutionId
    if (!institutionId) {
      return notFound('Institution id required')
    }

    const store = getPassportStore()
    const passport = await store.getInstitutionalPassport(sponsorOrgId, institutionId)
    if (!passport) {
      return notFound(`Passport not found for institution ${institutionId}`)
    }

    return Response.json(successResponse(passport))
  })),
)
