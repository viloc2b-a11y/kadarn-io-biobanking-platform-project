import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { promoteToLedger } from '@/lib/continuity-claim-service'

/**
 * POST /api/v1/continuity/claims/:id/promote
 *
 * Admin: promote a verified claim to the durable ledger.
 * Requires kadarn_internal role.
 */
export const POST = withAuth(async (request, user, params) => {
  try {
    const claimId = params?.id
    if (!claimId) throw new ApiError(400, 'Claim ID is required')
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      throw new ApiError(403, 'KOC admin access required')
    }

    const supabase = await createRouteClient()
    const result = await promoteToLedger(
      supabase as any,
      { actorId: user.id, organizationId: '' },
      claimId,
    )

    return Response.json({ data: result, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
