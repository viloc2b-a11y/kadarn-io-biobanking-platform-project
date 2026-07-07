// ==========================================================================
// GET /api/v1/readiness/capabilities/{capabilityId}
// ==========================================================================
// Single capability type with readiness context — which programs require it.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'

export const GET = withAsyncTracing(
  withAuth(async (_request, _user, params) => {
    try {
      const supabase = await createRouteClient()
      const capabilityId = params?.capabilityId
      if (!capabilityId) throw new ApiError(400, 'Missing capabilityId parameter')

      // 1. Fetch capability type
      const { data: capType, error: capError } = await supabase
        .from('organization_capability_types')
        .select('id, key, name, description, category')
        .eq('id', capabilityId)
        .eq('is_active', true)
        .single()

      if (capError || !capType) {
        if (capError?.code === 'PGRST116') throw new ApiError(404, 'Capability not found', capabilityId)
        throw new ApiError(500, 'Failed to fetch capability', capError?.message)
      }

      // 2. Find which readiness programs require this capability
      const { data: reqs, error: reqError } = await supabase
        .from('readiness_capability_requirements')
        .select(`
          id, is_mandatory, minimum_confidence,
          program_type_taxonomy!inner(type_key, name, readiness_threshold)
        `)
        .eq('capability_type_id', capabilityId)

      if (reqError) throw new ApiError(500, 'Failed to fetch requirements', reqError.message)

      const programs = (reqs ?? []).map((r: Record<string, unknown>) => {
        const taxonomy = r.program_type_taxonomy as Record<string, unknown> | null
        return {
          programTypeKey: taxonomy?.type_key ?? null,
          programTypeName: taxonomy?.name ?? null,
          isMandatory: r.is_mandatory ?? true,
          minimumConfidence: r.minimum_confidence ?? null,
        }
      })

      return Response.json({
        data: {
          id: capType.id,
          key: capType.key,
          name: capType.name,
          description: capType.description,
          requiredByPrograms: programs,
        },
      })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'readiness/capabilities/{id}', 'kadarn.api.method': 'GET' } },
)
