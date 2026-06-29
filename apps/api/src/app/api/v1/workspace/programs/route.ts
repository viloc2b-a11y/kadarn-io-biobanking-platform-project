import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withRateLimit } from '@/lib/rate-limit'
import {
  requireActiveOrg,
  parseWorkspacePagination,
  workspaceListResponse,
} from '@/lib/workspace'

export const GET = withRateLimit(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const orgId = requireActiveOrg(user)
      const { limit, offset } = parseWorkspacePagination(request)

      const { data, error } = await supabase
        .from('programs')
        .select('id, name, short_name, status, sponsor_org_id, lead_org_id, updated_at')
        .or(`sponsor_org_id.eq.${orgId},lead_org_id.eq.${orgId}`)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw new ApiError(500, 'Failed to fetch programs', error.message)
      return workspaceListResponse(orgId, data ?? [])
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
