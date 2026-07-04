/**
 * GET /api/v1/sponsor/passports/:institutionId
 * RC-10.3 — Mock passport detail (no DB).
 */

import { withAuth, requireOrgMembership } from '@/lib/auth-guards'
import { notFound, successResponse } from '@/lib/api-response'
import { rateLimit, WORKSPACE_RATE_LIMIT } from '@/lib/rate-limit'
import { getInstitutionalPassport } from '@/lib/sponsor-passport/mock-store'

export const dynamic = 'force-dynamic'

export const GET = rateLimit(
  WORKSPACE_RATE_LIMIT,
  withAuth(requireOrgMembership(async (_request, _user, params) => {
    const institutionId = params?.institutionId
    if (!institutionId) {
      return notFound('Institution id required')
    }

    const passport = getInstitutionalPassport(institutionId)
    if (!passport) {
      return notFound(`Passport not found for institution ${institutionId}`)
    }

    return Response.json(successResponse(passport))
  })),
)
