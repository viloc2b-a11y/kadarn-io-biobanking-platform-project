/**
 * GET /api/v1/sponsor/passports/:institutionId/claims/:claimId/provenance
 * RC-10.3 — Mock Evidence Tree provenance (lazy sub-resource, no DB).
 */

import { withAuth, requireOrgMembership } from '@/lib/auth-guards'
import { notFound, successResponse } from '@/lib/api-response'
import { rateLimit, WORKSPACE_RATE_LIMIT } from '@/lib/rate-limit'
import { getClaimProvenanceDetail } from '@/lib/sponsor-passport/mock-store'

export const dynamic = 'force-dynamic'

export const GET = rateLimit(
  WORKSPACE_RATE_LIMIT,
  withAuth(requireOrgMembership(async (_request, _user, params) => {
    const institutionId = params?.institutionId
    const claimId = params?.claimId

    if (!institutionId || !claimId) {
      return notFound('Institution id and claim id required')
    }

    const provenance = getClaimProvenanceDetail(institutionId, claimId)
    if (!provenance) {
      return notFound(`Provenance not found for claim ${claimId}`)
    }

    return Response.json(successResponse(provenance))
  })),
)
