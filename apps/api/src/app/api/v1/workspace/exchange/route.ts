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

      const [requestsRes, dealsRes] = await Promise.all([
        supabase
          .from('exchange_requests')
          .select('id, title, status, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .range(0, limit - 1),
        supabase
          .from('exchange_deals')
          .select('id, title, status, total_value, created_at')
          .or(`sponsor_org_id.eq.${orgId},provider_org_id.eq.${orgId}`)
          .order('created_at', { ascending: false })
          .range(0, limit - 1),
      ])

      if (requestsRes.error) throw new ApiError(500, 'Failed to fetch requests', requestsRes.error.message)
      if (dealsRes.error) throw new ApiError(500, 'Failed to fetch deals', dealsRes.error.message)

      const items = [
        ...(requestsRes.data ?? []).map(r => ({ ...r, kind: 'request' as const })),
        ...(dealsRes.data ?? []).map(d => ({ ...d, kind: 'deal' as const })),
      ].slice(offset, offset + limit)

      return workspaceListResponse(orgId, items)
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
