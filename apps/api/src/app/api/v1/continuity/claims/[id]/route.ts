import { ApiError, createRouteClient, handleApiError, withAuth } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
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
      reason?: string
    }

    // Organization ownership ALWAYS comes from the authenticated session,
    // never from the request body (prevents cross-org IDOR). This scopes
    // the underlying .eq('organization_id', ...) update filter in
    // continuity-claim-service.ts to the caller's own validated org.
    const organizationId = await requireValidatedActiveOrg(user)

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
