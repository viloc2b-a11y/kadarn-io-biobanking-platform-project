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
        .from('exchange_escrow')
        .select(`
          id, deal_id, status, total_amount, released_amount, refunded_amount,
          funded_at, released_at, created_at, updated_at,
          exchange_deals!inner(title, sponsor_org_id, provider_org_id)
        `)
        .or(`exchange_deals.sponsor_org_id.eq.${orgId},exchange_deals.provider_org_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw new ApiError(500, 'Failed to fetch settlements', error.message)
      return workspaceListResponse(orgId, data ?? [])
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
