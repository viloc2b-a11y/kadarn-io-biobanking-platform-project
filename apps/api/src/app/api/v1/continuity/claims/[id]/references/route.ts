import { ApiError, createRouteClient, handleApiError, withAuth } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import {
  type ReferenceInput,
  addReference,
  markReferenceConfirmed,
} from '@/lib/continuity-claim-service'

export const POST = withAuth(async (request, user, params) => {
  try {
    const claimId = params?.id
    if (!claimId) throw new ApiError(400, 'claim id is required')

    const supabase = await createRouteClient()
        const body = await request.json() as Omit<ReferenceInput, 'claimId'> & {
          action?: 'confirm'
          referenceId?: string
        }

        // Organization ownership ALWAYS comes from the authenticated session,
        // never from the request body (prevents cross-org IDOR).
        const organizationId = await requireValidatedActiveOrg(user)

    if (body.action === 'confirm') {
      if (!body.referenceId) throw new ApiError(400, 'referenceId is required')
      const reference = await markReferenceConfirmed(
        supabase,
        { actorId: user.id, organizationId },
        claimId,
        body.referenceId,
      )
      return Response.json({ data: { reference }, error: null })
    }

    const reference = await addReference(
      supabase,
      { actorId: user.id, organizationId },
      { ...body, claimId },
    )

    return Response.json({ data: { reference }, error: null }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
})
