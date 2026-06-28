import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { z } from 'zod'
import { emitAuditEvent } from '@/lib/audit'

const bodySchema = z.object({
  org_id: z.string().uuid(),
})

export const POST = withAuth(async (request, user) => {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)

    const supabase = await createRouteClient()

    // Update user's active_org_id in their metadata
    // Note: The actual session update happens client-side after this response
    const { error } = await supabase
      .from('user_profiles')
      .update({ active_org_id: parsed.data.org_id })
      .eq('id', user.id)

    if (error) throw new ApiError(500, 'Failed to set active organization', error.message)

    const correlationId = crypto.randomUUID()
    // --- Audit ---
    void emitAuditEvent({
      action: 'active-org.set',
      resourceType: 'organization',
      resourceId: parsed.data.org_id,
      actorId: user.id,
      organizationId: parsed.data.org_id,
      correlationId,
      result: 'success',
      summary: null,
    })

    return Response.json({ data: { organization_id: parsed.data.org_id }, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
