// ==========================================================================
// GET /api/v1/institutions/{id}/readiness/{programTypeKey}
// ==========================================================================
// Specific program type readiness for an institution. Returns full evaluation
// with capability breakdown, evidence gaps, and confidence scores.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import type { ReadinessEvaluation, CapabilitySummary, EvidenceGap } from '@kadarn/readiness-engine/dto'

export const GET = withAsyncTracing(
  withAuth(async (_request, _user, params) => {
    try {
      const supabase = await createRouteClient()
      const institutionId = params?.id
      const programTypeKey = params?.programTypeKey
      if (!institutionId || !programTypeKey) throw new ApiError(400, 'Missing institution id or programTypeKey')

      // 1. Get taxonomy entry
      const { data: taxonomy } = await supabase
        .from('program_type_taxonomy')
        .select('id, type_key, name, readiness_threshold')
        .eq('type_key', programTypeKey)
        .eq('category', 'readiness')
        .single()

      if (!taxonomy) throw new ApiError(404, 'Program type not found', programTypeKey)

      // 2. Get evaluation (RLS handles access)
      const { data: evalData, error } = await supabase
        .from('readiness_evaluations')
        .select('*')
        .eq('organization_id', institutionId)
        .eq('program_type_id', taxonomy.id)
        .maybeSingle()

      if (error) throw new ApiError(500, 'Failed to fetch evaluation', error.message)

      if (!evalData) {
        return Response.json({
          data: {
            evaluationId: null,
            organizationId: institutionId,
            programTypeKey,
            programTypeName: taxonomy.name,
            status: 'not_ready',
            overallConfidence: 0,
            capabilitiesBreakdown: [],
            evidenceGaps: [],
            computedAt: null,
            evidenceGraphCorrelationId: null,
            visibilityScope: 'organization',
          } satisfies ReadinessEvaluation,
        })
      }

      const snapshot = (evalData.evaluation_snapshot ?? {}) as Record<string, unknown>

      const result: ReadinessEvaluation = {
        evaluationId: evalData.id as string,
        organizationId: institutionId,
        programTypeKey,
        programTypeName: taxonomy.name as string,
        status: (evalData.readiness_status as string ?? 'not_ready') as ReadinessEvaluation['status'],
        overallConfidence: (evalData.overall_confidence as number) ?? 0,
        capabilitiesBreakdown: (snapshot.capabilitiesBreakdown as CapabilitySummary[]) ?? [],
        evidenceGaps: (snapshot.evidenceGaps as EvidenceGap[]) ?? [],
        computedAt: (evalData.computed_at as string) ?? '',
        evidenceGraphCorrelationId: (evalData.evidence_graph_correlation_id as string) ?? '',
        visibilityScope: (evalData.visibility_scope as string) ?? 'organization',
      }

      return Response.json({ data: result })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'institutions/{id}/readiness/{typeKey}', 'kadarn.api.method': 'GET' } },
)
