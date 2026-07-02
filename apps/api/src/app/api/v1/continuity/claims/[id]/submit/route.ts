import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import { submitForReview } from '@/lib/continuity-claim-service'

/**
 * POST /api/v1/continuity/claims/:id/submit
 *
 * Submit a claim for admin review.
 * Transitions status to 'under_review'.
 */
export const POST = withAuth(async (request, user, params) => {
  try {
    const claimId = params?.id
    if (!claimId) throw new ApiError(400, 'Claim ID is required')

    const supabase = await createRouteClient()
        // Organization ownership ALWAYS comes from the authenticated session,
        // never from JWT metadata alone (prevents stale/mismatched org IDOR).
        const organizationId = await requireValidatedActiveOrg(user)
        const result = await submitForReview(
          supabase as any,
          { actorId: user.id, organizationId },
          claimId,
        )

    return Response.json({ data: result, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
