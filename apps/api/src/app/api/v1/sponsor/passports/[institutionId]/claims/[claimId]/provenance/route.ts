/**
 * GET /api/v1/sponsor/passports/:institutionId/claims/:claimId/provenance
 * RC-10.3 — Mock Evidence Tree provenance (lazy sub-resource, no DB).
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
    const claimId = params?.claimId

    if (!institutionId || !claimId) {
      return notFound('Institution id and claim id required')
    }

    const store = getPassportStore()
    const provenance = await store.getClaimProvenanceDetail(sponsorOrgId, institutionId, claimId)
    if (!provenance) {
      return notFound(`Provenance not found for claim ${claimId}`)
    }

    return Response.json(successResponse(provenance))
  })),
)
