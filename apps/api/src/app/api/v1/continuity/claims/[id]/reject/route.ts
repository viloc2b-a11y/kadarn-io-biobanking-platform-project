import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { reviewClaim } from '@/lib/continuity-claim-service'

/**
 * POST /api/v1/continuity/claims/:id/reject
 *
 * Admin: reject a claim. Requires kadarn_internal role.
 * Body: { reviewer_notes?: string }
 */
export const POST = withAuth(async (request, user, params) => {
  try {
    const claimId = params?.id
    if (!claimId) throw new ApiError(400, 'Claim ID is required')
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      throw new ApiError(403, 'KOC admin access required')
    }

    const body = await request.json() as { reviewer_notes?: string }
    const supabase = await createRouteClient()
    const result = await reviewClaim(
      supabase as any,
      { actorId: user.id, organizationId: '' },
      claimId,
      'reject',
      body.reviewer_notes,
    )

    return Response.json({ data: result, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
