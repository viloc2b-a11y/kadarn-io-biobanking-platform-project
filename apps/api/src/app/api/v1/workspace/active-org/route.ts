import { withAuth, handleApiError, createRouteClient, createServiceClient, ApiError } from '@/lib/supabase-server'
import { z } from 'zod'
import { emitAuditEvent } from '@/lib/audit'
import { rateLimit, WORKSPACE_RATE_LIMIT } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic';
const bodySchema = z.object({
  org_id: z.string().uuid(),
})

export const POST = withAuth(async (request, user) => {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)

    const admin = createServiceClient()

    const { data: membership, error: membershipError } = await admin
      .from('organization_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', parsed.data.org_id)
      .eq('status', 'active')
      .maybeSingle()

    if (membershipError) {
      throw new ApiError(500, 'Failed to verify organization membership', membershipError.message)
    }
    if (!membership) {
      throw new ApiError(403, 'You are not an active member of this organization')
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        active_org_id: parsed.data.org_id,
      },
    })

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
