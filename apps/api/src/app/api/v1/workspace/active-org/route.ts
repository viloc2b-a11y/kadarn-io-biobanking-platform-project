import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { z } from 'zod'

const bodySchema = z.object({
  org_id: z.string().uuid(),
})

export const POST = withAuth(async (request, user) => {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const { org_id } = bodySchema.parse(body)

    const supabase = await createRouteClient()

    // Verify the user actually belongs to this org (active membership)
    const { data: membership, error } = await supabase
      .from('organization_memberships')
      .select('id, organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .eq('status', 'active')
      .single()

    if (error || !membership) {
      return Response.json(
        { error: { code: 403, message: 'No active membership in this organization' } },
        { status: 403 },
      )
    }

    // Persist active_org_id in user_metadata — middleware reads this
    const { error: updateError } = await supabase.auth.updateUser({
      data: { active_org_id: org_id },
    })

    if (updateError) {
      return Response.json(
        { error: { code: 500, message: 'Failed to update active organization' } },
        { status: 500 },
      )
    }

    return Response.json({ data: { active_org_id: org_id }, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
