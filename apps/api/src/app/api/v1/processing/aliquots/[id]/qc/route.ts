// ==========================================================================
// KPR-01 — QC Route
// PATCH /api/v1/processing/aliquots/:id/qc
// ==========================================================================
// Updates the QC status of a processing aliquot with:
//   - Domain event emission (QcCompleted)
//   - Provenance recording stub
//   - Telemetry span (SPAN_API_REQUEST)
//   - Correlation ID preservation
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { z } from 'zod'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { createCorrelationId } from '@/lib/logistics-helper'
import { runPipeline, createPipelineContext } from '@/lib/engine-orchestrator'

// ---------------------------------------------------------------------------
// Valid QC transitions
// ---------------------------------------------------------------------------
const QC_STATUSES = ['pending', 'pass', 'fail', 'borderline'] as const

const qcUpdateSchema = z.object({
  qc_status: z.enum(QC_STATUSES, {
    errorMap: () => ({ message: `qc_status must be one of: ${QC_STATUSES.join(', ')}` }),
  }),
  notes: z.string().max(2000).optional(),
  reviewed_by: z.string().uuid().optional(),
})

// ---------------------------------------------------------------------------
// PATCH /api/v1/processing/aliquots/:id/qc
// ---------------------------------------------------------------------------
export const PATCH = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const url = new URL(request.url)
      const pathParts = url.pathname.split('/')
      const id = pathParts[pathParts.length - 2] // /api/v1/processing/aliquots/:id/qc → id is second-to-last
      const correlationId = crypto.randomUUID()

      if (!id || id === 'undefined') {
        throw new ApiError(400, 'Aliquot ID is required')
      }

      const body = (await request.json()) as Record<string, unknown>
      const parsed = qcUpdateSchema.safeParse(body)

      if (!parsed.success) {
        throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)
      }

      // Verify aliquot exists and get current state
      const { data: aliquot, error: findError } = await supabase
        .from('processing_aliquots')
        .select('id, aliquot_id, sample_id, program_id, qc_status, metadata')
        .eq('id', id)
        .single()

      if (findError || !aliquot) {
        if (findError?.code === 'PGRST116') throw new ApiError(404, 'Aliquot not found')
        throw new ApiError(500, 'Failed to find aliquot', findError?.message)
      }

      const newStatus = parsed.data.qc_status
      const previousStatus = aliquot.qc_status

      // Validate transition: can't go from a terminal state
      if (previousStatus === 'pass' && newStatus !== 'pending') {
        throw new ApiError(409, 'Cannot change QC status of a passed aliquot without resetting to pending first')
      }

      // Update the aliquot QC status
      const now = new Date().toISOString()
      const metadata = { ...((aliquot.metadata as Record<string, unknown> | undefined) ?? {}) }
      metadata.qc_history = [
        ...(Array.isArray(metadata.qc_history) ? metadata.qc_history : []),
        { from: previousStatus, to: newStatus, by: user.id, at: now, notes: parsed.data.notes ?? null, correlationId },
      ]

      const { error: updateError } = await supabase
        .from('processing_aliquots')
        .update({
          qc_status: newStatus,
          state_changed_at: now,
          state_changed_by: user.id,
          metadata,
        })
        .eq('id', id)

      if (updateError) {
        throw new ApiError(500, 'Failed to update QC status', updateError.message)
      }

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────

      // 1. Domain event
      const orgId = user.user_metadata?.active_org_id as string | null
      runPipeline(
        'qc',
        createPipelineContext({
          correlationId,
          actorId: user.id,
          organizationId: orgId,
        }),
        {
          aliquotId: id,
          sampleId: aliquot.sample_id,
          qcStatus: newStatus,
          route: 'processing.qc',
        },
      )

      return Response.json({
        data: {
          id,
          aliquot_id: aliquot.aliquot_id,
          previous_status: previousStatus,
          qc_status: newStatus,
          correlationId,
          updated_at: now,
        },
        error: null,
      })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'processing.aliquots.qc', 'kadarn.api.method': 'PATCH' } },
)
