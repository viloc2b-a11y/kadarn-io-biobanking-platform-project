import { ApiError, createRouteClient, handleApiError, withAuth } from '@/lib/supabase-server'
import {
  type ExperienceClaimInput,
  markClaimVerified,
  rejectClaim,
  updateExperienceClaim,
} from '@/lib/continuity-claim-service'

export const PATCH = withAuth(async (request, user, params) => {
  try {
    const claimId = params?.id
    if (!claimId) throw new ApiError(400, 'claim id is required')

    const supabase = await createRouteClient()
    const body = await request.json() as Partial<ExperienceClaimInput> & {
      action?: 'verify' | 'reject'
      organizationId?: string
      reason?: string
    }
    const organizationId = body.organizationId ?? user.user_metadata?.active_org_id
    if (!organizationId || typeof organizationId !== 'string') {
      throw new ApiError(400, 'organizationId is required')
    }

    if (body.action === 'verify') {
      const result = await markClaimVerified(supabase, { actorId: user.id, organizationId }, claimId)
      return Response.json({ data: result, error: null })
    }

    if (body.action === 'reject') {
      const result = await rejectClaim(
        supabase,
        { actorId: user.id, organizationId },
        claimId,
        body.reason ?? 'Rejected during continuity review',
      )
      return Response.json({ data: result, error: null })
    }

    const claim = await updateExperienceClaim(
      supabase,
      { actorId: user.id, organizationId },
      claimId,
      body,
    )
    return Response.json({ data: { claim }, error: null })
  } catch (error) {
    return handleApiError(error)
  }
})
