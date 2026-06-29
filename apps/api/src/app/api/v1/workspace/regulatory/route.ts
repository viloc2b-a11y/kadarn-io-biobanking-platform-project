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

      const [protocolsRes, submissionsRes] = await Promise.all([
        supabase
          .from('regulatory_protocols')
          .select('id, title, protocol_number, status, therapeutic_area, updated_at')
          .eq('organization_id', orgId)
          .order('updated_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase
          .from('regulatory_submissions')
          .select('id, submission_type, status, authority, submitted_at, updated_at')
          .eq('organization_id', orgId)
          .order('updated_at', { ascending: false })
          .range(0, limit - 1),
      ])

      if (protocolsRes.error) throw new ApiError(500, 'Failed to fetch protocols', protocolsRes.error.message)
      if (submissionsRes.error) throw new ApiError(500, 'Failed to fetch submissions', submissionsRes.error.message)

      const items = [
        ...(protocolsRes.data ?? []).map(r => ({ ...r, record_type: 'protocol' as const })),
        ...(submissionsRes.data ?? []).map(r => ({ ...r, record_type: 'submission' as const })),
      ]

      return workspaceListResponse(orgId, items)
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
