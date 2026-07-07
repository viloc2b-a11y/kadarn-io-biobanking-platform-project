// ==========================================================================
// GET /api/v1/institutions/{id}/readiness
// ==========================================================================
// All readiness evaluations for a specific institution. RLS-scoped: users
// can only see their own org unless visibility_scope = 'network'.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import type { ReadinessSummary, ProgramReadiness, CapabilitySummary, EvidenceGap } from '@kadarn/readiness-engine/dto'

export const GET = withAsyncTracing(
  withAuth(async (_request, _user, params) => {
    try {
      const supabase = await createRouteClient()
      const institutionId = params?.id
      if (!institutionId) throw new ApiError(400, 'Missing institution id')

      // 1. Get org name
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', institutionId)
        .single()

      // 2. Fetch evaluations (RLS handles access)
      const { data: evals, error } = await supabase
        .from('readiness_evaluations')
        .select(`
          id, readiness_status, overall_confidence, computed_at,
          evidence_graph_correlation_id, visibility_scope,
          program_type_taxonomy!inner(type_key, name, readiness_threshold)
        `)
        .eq('organization_id', institutionId)
        .order('computed_at', { ascending: false })

      if (error) throw new ApiError(500, 'Failed to fetch evaluations', error.message)

      // 3. For each evaluation, get capability breakdown from snapshot
      const evaluations: ProgramReadiness[] = (evals ?? []).map((ev: Record<string, unknown>) => {
        const snapshot = (ev.evaluation_snapshot ?? {}) as Record<string, unknown>
        const taxonomy = ev.program_type_taxonomy as Record<string, unknown> | null
        return {
          programTypeKey: taxonomy?.type_key as string ?? '',
          programTypeName: taxonomy?.name as string ?? '',
          readinessStatus: (ev.readiness_status as string ?? 'not_ready') as ProgramReadiness['readinessStatus'],
          overallConfidence: (ev.overall_confidence as number) ?? 0,
          capabilities: (snapshot.capabilitiesBreakdown as CapabilitySummary[]) ?? [],
          evidenceGaps: (snapshot.evidenceGaps as EvidenceGap[]) ?? [],
          lastEvaluatedAt: (ev.computed_at as string) ?? '',
          evaluationId: ev.id as string,
        }
      })

      const worstStatus = getWorstStatus(evaluations.map(e => e.readinessStatus))

      const summary: ReadinessSummary = {
        organizationId: institutionId,
        organizationName: (org?.name as string) ?? 'Unknown',
        evaluations,
        overallReadiness: worstStatus,
      }

      return Response.json({ data: summary })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'institutions/{id}/readiness', 'kadarn.api.method': 'GET' } },
)

function getWorstStatus(statuses: string[]): ReadinessSummary['overallReadiness'] {
  const order = ['ready', 'conditionally_ready', 'partial', 'not_ready']
  for (const s of order) {
    if (statuses.includes(s)) return s as ReadinessSummary['overallReadiness']
  }
  return 'not_ready'
}
