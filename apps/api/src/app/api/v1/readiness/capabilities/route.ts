// ==========================================================================
// GET /api/v1/readiness/capabilities
// ==========================================================================
// List all organization capability types that are relevant to readiness programs.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'

export const GET = withAsyncTracing(
  withAuth(async (_request) => {
    try {
      const supabase = await createRouteClient()

      const { data, error } = await supabase
        .from('organization_capability_types')
        .select('id, key, name, description, category, is_required_for_basic_org')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw new ApiError(500, 'Failed to fetch capabilities', error.message)

      const capabilities = (data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id,
        key: c.key,
        name: c.name,
        description: c.description ?? null,
        category: c.category ?? null,
        isRequired: c.is_required_for_basic_org ?? false,
      }))

      return Response.json({ data: capabilities, meta: { total: capabilities.length } })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'readiness/capabilities', 'kadarn.api.method': 'GET' } },
)
