// ==========================================================================
// KPR-02 — Financial Engine MVP
// PATCH /api/v1/financial/settlements/:id
// ==========================================================================
// Update settlement status with transition validation.
//
// Valid transitions:
//   pending → funded       (reserve funds)
//   funded → released      (release full amount)
//   funded → partially_released → released (milestone-based)
//   funded → cancelled     (cancel before release)
//   released → completed   (mark as completed)
//   released → refunded    (refund after release)
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { z } from 'zod'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { publishIntegrationEvent } from '@/lib/event-runtime'
import { createCorrelationId } from '@/lib/logistics-helper'
import { runPipeline, createPipelineContext } from '@/lib/engine-orchestrator'

// ---------------------------------------------------------------------------
// Valid transition map
// ---------------------------------------------------------------------------

const TRANSITIONS: Record<string, string[]> = {
  pending: ['funded', 'cancelled'],
  funded: ['released', 'partially_released', 'cancelled'],
  partially_released: ['released', 'funded', 'cancelled'],
  released: ['completed', 'refunded'],
  completed: [],
  cancelled: [],
  refunded: [],
}

const VALID_STATUSES = Object.keys(TRANSITIONS)

const updateSettlementSchema = z.object({
  status: z.enum(VALID_STATUSES as [string, ...string[]], {
    errorMap: () => ({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` }),
  }),
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
})

// ---------------------------------------------------------------------------
// PATCH /api/v1/financial/settlements/:id
// ---------------------------------------------------------------------------
export const PATCH = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const url = new URL(request.url)
      const pathParts = url.pathname.split('/')
      const id = pathParts[pathParts.length - 1]
      const correlationId = crypto.randomUUID()

      if (!id || id === 'undefined') {
        throw new ApiError(400, 'Settlement ID is required')
      }

      const body = (await request.json()) as Record<string, unknown>
      const parsed = updateSettlementSchema.safeParse(body)

      if (!parsed.success) {
        throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)
      }

      // Get current settlement
      const { data: settlement, error: findError } = await supabase
        .from('exchange_escrow')
        .select('*')
        .eq('id', id)
        .single()

      if (findError || !settlement) {
        if (findError?.code === 'PGRST116') throw new ApiError(404, 'Settlement not found')
        throw new ApiError(500, 'Failed to find settlement', findError?.message)
      }

      const currentStatus = settlement.status
      const newStatus = parsed.data.status

      // Validate transition
      const allowed = TRANSITIONS[currentStatus]
      if (!allowed || !allowed.includes(newStatus)) {
        throw new ApiError(409, `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${(allowed ?? []).join(', ') || 'none'}`)
      }

      // Build update payload
      const now = new Date().toISOString()
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: now,
      }

      if (newStatus === 'funded') updates.funded_at = now
      if (newStatus === 'released' || newStatus === 'completed') {
        updates.released_amount = settlement.total_amount
        updates.released_at = now
      }
      if (newStatus === 'partially_released' && parsed.data.amount) {
        updates.released_amount = Math.min(
          (settlement.released_amount ?? 0) + parsed.data.amount,
          settlement.total_amount,
        )
      }
      if (newStatus === 'refunded') {
        updates.refunded_amount = settlement.total_amount
      }

      // Apply update
      const { error: updateError } = await supabase
        .from('exchange_escrow')
        .update(updates)
        .eq('id', id)

      if (updateError) throw new ApiError(500, 'Failed to update settlement', updateError.message)

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      const orgId = user.user_metadata?.active_org_id as string | null
      publishIntegrationEvent('SettlementStatusChanged', {
        settlementId: id,
        dealId: settlement.deal_id,
        fromStatus: currentStatus,
        toStatus: newStatus,
        amount: parsed.data.amount ?? settlement.total_amount,
        organizationId: orgId,
        changedBy: user.id,
        reason: parsed.data.reason ?? null,
      }, {
        actorId: user.id,
        organizationId: orgId,
        correlationId,
        idempotencyKey: `SettlementStatusChanged:${id}:${newStatus}`,
      })

      runPipeline(
        'settlement-update',
        createPipelineContext({
          correlationId,
          actorId: user.id,
          organizationId: orgId,
        }),
        {
          settlementId: id,
          dealId: settlement.deal_id,
          amount: parsed.data.amount ?? settlement.total_amount,
          totalValue: settlement.total_amount,
          statusChange: newStatus,
          fromStatus: currentStatus,
          releasedAmount: (updates.released_amount as number) ?? settlement.released_amount,
          refundedAmount: (updates.refunded_amount as number) ?? settlement.refunded_amount,
          route: 'financial.settlements.id',
        },
      )

      return Response.json({
        data: {
          id,
          deal_id: settlement.deal_id,
          previous_status: currentStatus,
          status: newStatus,
          total_amount: settlement.total_amount,
          released_amount: (updates.released_amount as number) ?? settlement.released_amount,
          refunded_amount: (updates.refunded_amount as number) ?? settlement.refunded_amount,
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
  { attributes: { 'kadarn.api.route': 'financial.settlements.id', 'kadarn.api.method': 'PATCH' } },
)
