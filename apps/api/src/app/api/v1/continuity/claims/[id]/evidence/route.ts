import { ApiError, createRouteClient, handleApiError, withAuth } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import { type EvidenceInput, submitEvidence } from '@/lib/continuity-claim-service'

export const POST = withAuth(async (request, user, params) => {
  try {
    const claimId = params?.id
    if (!claimId) throw new ApiError(400, 'claim id is required')

    const supabase = await createRouteClient()
    const body = await request.json() as Omit<EvidenceInput, 'claimId'>

    // Organization ownership ALWAYS comes from the authenticated session,
    // never from the request body (prevents cross-org IDOR).
    const organizationId = await requireValidatedActiveOrg(user)

    const evidence = await submitEvidence(
      supabase,
      { actorId: user.id, organizationId },
      { ...body, claimId },
    )

    return Response.json({ data: { evidence }, error: null }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
})
