import { withAuth, handleApiError, ApiError } from '@/lib/auth-guards'
import {
  getPhase8CutoverStatus,
  VIEW_MIGRATED_ROUTES,
  VIEW_PENDING_ROUTES,
} from '@/lib/phase8-cutover-status'
import type { KadarnRole } from '@kadarn/types'

/**
 * GET /api/v1/operations/phase8-cutover
 * Kadarn internal ops — cutover flag, Published View path, deferred routes.
 */
export const GET = withAuth(async (_request, user) => {
  try {
    const role = (user.user_metadata?.kadarn_role as KadarnRole | undefined) ?? 'marketplace_user'
    if (role !== 'kadarn_internal') {
      throw new ApiError(403, 'Access restricted to Kadarn Operations Center')
    }

    const status = getPhase8CutoverStatus()

    return Response.json({
      data: {
        ...status,
        migrated_routes: VIEW_MIGRATED_ROUTES,
        deferred_routes: VIEW_PENDING_ROUTES,
        timestamp: new Date().toISOString(),
      },
      error: null,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
