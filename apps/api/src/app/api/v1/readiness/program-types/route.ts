// ==========================================================================
// GET /api/v1/readiness/program-types
// ==========================================================================
// List all readiness program types from taxonomy. Network-visible reference data.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'

/**
 * GET /api/v1/readiness/program-types
 * @openapi
 * /api/v1/readiness/program-types:
 *   get:
 *     summary: List readiness program types
 *     description: Returns all active readiness program types from the taxonomy.
 *     responses:
 *       200:
 *         description: OK — array of program types
 */
export const GET = withAsyncTracing(
  withAuth(async (_request) => {
    try {
      const supabase = await createRouteClient()

      const { data, error } = await supabase
        .from('program_type_taxonomy')
        .select('id, type_key, name, description, category, readiness_threshold')
        .eq('category', 'readiness')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw new ApiError(500, 'Failed to fetch program types', error.message)

      const types = (data ?? []).map((t: Record<string, unknown>) => ({
        id: t.id,
        typeKey: t.type_key,
        name: t.name,
        description: t.description ?? null,
        category: t.category,
        readinessThreshold: t.readiness_threshold,
      }))

      return Response.json({ data: types, meta: { total: types.length } })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'readiness/program-types', 'kadarn.api.method': 'GET' } },
)
