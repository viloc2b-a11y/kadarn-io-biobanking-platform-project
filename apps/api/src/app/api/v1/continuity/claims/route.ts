import { ApiError, createRouteClient, handleApiError, withAuth } from '@/lib/supabase-server'
import {
  type ExperienceClaimInput,
  createExperienceClaim,
  listClaimsForSite,
} from '@/lib/continuity-claim-service'

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organization_id') ?? user.user_metadata?.active_org_id
    const profileId = url.searchParams.get('profile_id')

    if (!organizationId || typeof organizationId !== 'string') {
      throw new ApiError(400, 'organization_id is required')
    }
    if (!profileId) throw new ApiError(400, 'profile_id is required')

    const claims = await listClaimsForSite(supabase, organizationId, profileId)
    return Response.json({ data: { claims }, error: null })
  } catch (error) {
    return handleApiError(error)
  }
})

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const body = await request.json() as ExperienceClaimInput & { organizationId?: string }
    const organizationId = body.organizationId ?? user.user_metadata?.active_org_id

    if (!organizationId || typeof organizationId !== 'string') {
      throw new ApiError(400, 'organizationId is required')
    }

    const claim = await createExperienceClaim(
      supabase,
      { actorId: user.id, organizationId },
      body,
    )

    return Response.json({ data: { claim }, error: null }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
})
