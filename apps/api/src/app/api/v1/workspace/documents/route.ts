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
        .from('regulatory_documents')
        .select('id, title, document_type, status, version, effective_date, updated_at')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw new ApiError(500, 'Failed to fetch documents', error.message)
      return workspaceListResponse(orgId, data ?? [])
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
