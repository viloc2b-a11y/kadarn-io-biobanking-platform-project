import { ApiError, createRouteClient, handleApiError, withAuth } from '@/lib/supabase-server'
import { type EvidenceInput, submitEvidence } from '@/lib/continuity-claim-service'

export const POST = withAuth(async (request, user, params) => {
  try {
    const claimId = params?.id
    if (!claimId) throw new ApiError(400, 'claim id is required')

    const supabase = await createRouteClient()
    const body = await request.json() as Omit<EvidenceInput, 'claimId'> & { organizationId?: string }
    const organizationId = body.organizationId ?? user.user_metadata?.active_org_id
    if (!organizationId || typeof organizationId !== 'string') {
      throw new ApiError(400, 'organizationId is required')
    }

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
