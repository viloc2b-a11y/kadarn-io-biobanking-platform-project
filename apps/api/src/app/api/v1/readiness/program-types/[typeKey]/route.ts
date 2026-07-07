// ==========================================================================
// GET /api/v1/readiness/program-types/{typeKey}
// ==========================================================================
// Single readiness program type with its capability and evidence requirements.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'

/**
 * GET /api/v1/readiness/program-types/{typeKey}
 * @openapi
 * /api/v1/readiness/program-types/{typeKey}:
 *   get:
 *     summary: Get readiness program type with requirements
 *     parameters:
 *       - name: typeKey
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Program type with capability and evidence requirements
 */
export const GET = withAsyncTracing(
  withAuth(async (_request, _user, params) => {
    try {
      const supabase = await createRouteClient()
      const typeKey = params?.typeKey
      if (!typeKey) throw new ApiError(400, 'Missing typeKey parameter')

      // 1. Fetch taxonomy entry
      const { data: taxonomy, error: taxError } = await supabase
        .from('program_type_taxonomy')
        .select('id, type_key, name, description, category, readiness_threshold')
        .eq('type_key', typeKey)
        .eq('category', 'readiness')
        .eq('is_active', true)
        .single()

      if (taxError || !taxonomy) {
        if (taxError?.code === 'PGRST116') throw new ApiError(404, 'Program type not found', typeKey)
        throw new ApiError(500, 'Failed to fetch program type', taxError?.message)
      }

      // 2. Fetch capability requirements
      const { data: capReqs, error: capError } = await supabase
        .from('readiness_capability_requirements')
        .select(`
          id,
          is_mandatory,
          minimum_confidence,
          description,
          display_order,
          capability_type_id,
          organization_capability_types!inner(key, name, description)
        `)
        .eq('program_type_id', taxonomy.id)
        .order('display_order', { ascending: true })

      if (capError) throw new ApiError(500, 'Failed to fetch capability requirements', capError.message)

      // 3. Fetch evidence requirements for all capability requirements
      const capReqIds = (capReqs ?? []).map((c: Record<string, unknown>) => c.id)
      const { data: evReqs, error: evError } = capReqIds.length > 0
        ? await supabase
            .from('readiness_evidence_requirements')
            .select('capability_requirement_id, evidence_class, is_mandatory, minimum_count, description')
            .in('capability_requirement_id', capReqIds)
            .order('display_order', { ascending: true })
        : { data: [], error: null }

      if (evError) throw new ApiError(500, 'Failed to fetch evidence requirements', evError.message)

      // 4. Build capability requirements with evidence
      const evidenceByCapReq = new Map<string, Array<Record<string, unknown>>>()
      for (const e of (evReqs ?? [])) {
        const key = e.capability_requirement_id as string
        if (!evidenceByCapReq.has(key)) evidenceByCapReq.set(key, [])
        evidenceByCapReq.get(key)!.push(e)
      }

      const capabilities = (capReqs ?? []).map((c: Record<string, unknown>) => {
        const capType = c.organization_capability_types as Record<string, unknown> | null
        const evList = evidenceByCapReq.get(c.id as string) ?? []
        return {
          capabilityTypeId: c.capability_type_id,
          capabilityTypeName: capType?.name ?? 'Unknown',
          isMandatory: c.is_mandatory ?? true,
          minimumConfidence: c.minimum_confidence ?? null,
          description: c.description ?? null,
          evidenceRequirements: evList.map((e: Record<string, unknown>) => ({
            evidenceClass: e.evidence_class,
            isMandatory: e.is_mandatory ?? true,
            minimumCount: e.minimum_count ?? 1,
            description: e.description ?? '',
          })),
        }
      })

      return Response.json({
        data: {
          typeKey: taxonomy.type_key,
          name: taxonomy.name,
          description: taxonomy.description,
          readinessThreshold: taxonomy.readiness_threshold,
          capabilities,
        },
      })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'readiness/program-types/{typeKey}', 'kadarn.api.method': 'GET' } },
)
