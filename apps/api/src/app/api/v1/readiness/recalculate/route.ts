// ==========================================================================
// POST /api/v1/readiness/recalculate
// ==========================================================================
// Force recalculation of a readiness evaluation. Invalidates cache and re-runs
// the evaluation pipeline. Same semantics as POST /evaluate but explicit intent.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { requireActiveOrg } from '@/lib/workspace'
import { z } from 'zod'

const recalculateSchema = z.object({
  programTypeKey: z.string().min(1),
})

export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const body = await request.json().catch(() => ({}))
      const parsed = recalculateSchema.safeParse(body)
      if (!parsed.success) throw new ApiError(400, 'Invalid request body', parsed.error.message)

      const { programTypeKey } = parsed.data
      const orgId = requireActiveOrg(user)

      // 1. Invalidate existing cache by clearing snapshot
      const { data: taxonomy } = await supabase
        .from('program_type_taxonomy')
        .select('id')
        .eq('type_key', programTypeKey)
        .eq('category', 'readiness')
        .single()

      if (!taxonomy) throw new ApiError(404, 'Program type not found', programTypeKey)

      await supabase
        .from('readiness_evaluations')
        .update({
          evaluation_snapshot: null,
          overall_confidence: null,
          readiness_status: 'not_ready',
          computed_at: null,
          evidence_graph_correlation_id: null,
        })
        .eq('organization_id', orgId)
        .eq('program_type_id', taxonomy.id)

      // 2. Redirect to evaluate for a fresh run
      // In production, this would trigger async evaluation + webhook callback.
      // For MVP, return 202 Accepted with instruction to call /evaluate.

      return Response.json({
        data: {
          message: 'Evaluation cache invalidated. Call POST /api/v1/readiness/evaluate to recompute.',
          organizationId: orgId,
          programTypeKey,
        },
      }, { status: 202 })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'readiness/recalculate', 'kadarn.api.method': 'POST' } },
)
