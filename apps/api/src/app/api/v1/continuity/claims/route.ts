import { ApiError, createRouteClient, handleApiError, withAuth } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import {
  type ExperienceClaimInput,
  createExperienceClaim,
  listClaimsForSite,
} from '@/lib/continuity-claim-service'

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const profileId = url.searchParams.get('profile_id')

    if (!profileId) throw new ApiError(400, 'profile_id is required')

    // Organization ownership ALWAYS comes from the authenticated session,
    // never from a client-supplied query param (prevents cross-org IDOR).
    const organizationId = await requireValidatedActiveOrg(user)

    const claims = await listClaimsForSite(supabase, organizationId, profileId)
    return Response.json({ data: { claims }, error: null })
  } catch (error) {
    return handleApiError(error)
  }
})

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const body = await request.json() as ExperienceClaimInput

    // Organization ownership ALWAYS comes from the authenticated session,
    // never from the request body (prevents cross-org IDOR).
    const organizationId = await requireValidatedActiveOrg(user)

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
