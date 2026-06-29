import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
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
    const result = await submitForReview(
      supabase as any,
      { actorId: user.id, organizationId: user.user_metadata?.active_org_id ?? '' },
      claimId,
    )

    return Response.json({ data: result, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
