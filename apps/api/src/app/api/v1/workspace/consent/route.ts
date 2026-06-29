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

      const [icfRes, specimenRes, provRes] = await Promise.all([
        supabase
          .from('regulatory_icf_templates')
          .select('id, name, version, status, language, updated_at')
          .eq('organization_id', orgId)
          .order('updated_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase
          .from('specimen_twins')
          .select('id, external_id, consent_status, consent_id, updated_at')
          .eq('organization_id', orgId)
          .not('consent_status', 'is', null)
          .order('updated_at', { ascending: false })
          .range(0, limit - 1),
        supabase
          .from('provenance_nodes')
          .select('id, external_id, label, recorded_at')
          .eq('organization_id', orgId)
          .eq('node_type', 'consent')
          .order('recorded_at', { ascending: false })
          .range(0, limit - 1),
      ])

      if (icfRes.error) throw new ApiError(500, 'Failed to fetch consent templates', icfRes.error.message)
      if (specimenRes.error) throw new ApiError(500, 'Failed to fetch specimen consent', specimenRes.error.message)
      if (provRes.error) throw new ApiError(500, 'Failed to fetch provenance consent', provRes.error.message)

      const items = [
        ...(icfRes.data ?? []).map(r => ({ ...r, source: 'icf_template' as const })),
        ...(specimenRes.data ?? []).map(r => ({ ...r, source: 'specimen_twin' as const })),
        ...(provRes.data ?? []).map(r => ({ ...r, source: 'provenance' as const })),
      ]

      return workspaceListResponse(orgId, items)
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
