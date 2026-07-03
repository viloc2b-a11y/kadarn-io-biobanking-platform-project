import { withErrorHandling } from '@/lib/auth-guards'
import {
  getPhase8CutoverStatus,
  VIEW_MIGRATED_ROUTES,
  VIEW_PENDING_ROUTES,
} from '@/lib/phase8-cutover-status'

/**
 * GET /api/v1/operations/phase8-cutover
 * Ops smoke — cutover flag, Published View path, deferred routes.
 */
export const GET = withErrorHandling(async () => {
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
})
