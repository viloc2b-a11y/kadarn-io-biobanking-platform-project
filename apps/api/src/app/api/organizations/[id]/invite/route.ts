import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { uuidParamSchema } from '@/lib/validation'
import { z } from 'zod'

const inviteUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
})

/**
 * POST /api/v1/organizations/:id/invite
 * Invite a user to join an organization.
 * The caller must be an admin of the organization.
 * The target user must already have an account (user_profiles entry).
 */
export const POST = withAuth(async (request, user, params) => {
  try {
    const { id: orgId } = uuidParamSchema.parse(params)
    const supabase = await createRouteClient()

    // Verify caller is org admin
    const { data: callerMembership } = await supabase
      .from('organization_memberships')
      .select('id, role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!callerMembership) {
      throw new ApiError(403, 'You are not a member of this organization')
    }

    const body = (await request.json()) as Record<string, unknown>
    const parsed = inviteUserSchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)
    }

    // Find the user by email in user_profiles
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', parsed.data.email)
      .maybeSingle()

    if (!targetProfile) {
      throw new ApiError(404, 'User not found. They must create an account first.')
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('organization_memberships')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('user_id', targetProfile.id)
      .maybeSingle()

    if (existing) {
      throw new ApiError(409, `User is already a member (status: ${existing.status})`)
    }

    // Create membership with invited status
    const now = new Date().toISOString()
    const { data: membership, error: insertErr } = await supabase
      .from('organization_memberships')
      .insert({
        organization_id: orgId,
        user_id: targetProfile.id,
        status: 'invited',
        invited_by: user.id,
        invited_at: now,
      })
      .select()
      .single()

    if (insertErr) {
      throw new ApiError(500, 'Failed to invite user', insertErr.message)
    }

    return Response.json({
      data: {
        id: membership.id,
        organization_id: membership.organization_id,
        user_id: membership.user_id,
        email: targetProfile.email,
        status: membership.status,
        invited_at: membership.invited_at,
      },
      error: null,
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
})
