import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { getVerificationQueue } from '@/lib/continuity-claim-service'

/**
 * GET /api/v1/continuity/admin/queue
 *
 * Admin review queue for continuity claims.
 * Returns claims ordered by submission date (most recent first).
 *
 * Query params:
 *   status     — filter by status (under_review, verified, rejected)
 *   badge_level — filter by badge level
 *   limit      — max results (default 50, max 200)
 *   offset     — pagination offset
 */
export const GET = withAuth(async (request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      throw new ApiError(403, 'KOC admin access required')
    }

    const { searchParams } = new URL(request.url)
    const supabase = await createRouteClient()

    const result = await getVerificationQueue(supabase as any, {
      status: searchParams.get('status') ?? undefined,
      badgeLevel: searchParams.get('badge_level') ?? undefined,
      limit: Number(searchParams.get('limit') ?? 50),
      offset: Number(searchParams.get('offset') ?? 0),
    })

    return Response.json({ data: result, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
