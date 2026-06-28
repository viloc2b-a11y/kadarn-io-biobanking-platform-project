// ==========================================================================
// KPR-02 — Financial Engine MVP
// POST /api/v1/financial/settlements
// GET  /api/v1/financial/settlements
// ==========================================================================
// Settlement lifecycle: pending → funded → released → completed
//                                         → cancelled
//                            → refunded
//
// Backed by the existing exchange_escrow table.
// No payment gateway integration — this is settlement orchestration.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { z } from 'zod'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createSettlementSchema = z.object({
  deal_id: z.string().uuid('Deal ID must be a valid UUID'),
  total_amount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3).default('USD'),
})

// ---------------------------------------------------------------------------
// GET /api/v1/financial/settlements
// List settlements with optional filters
// ---------------------------------------------------------------------------
export const GET = withAuth(async (request) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const dealId = url.searchParams.get('deal_id')
    const status = url.searchParams.get('status')
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200)

    let query = supabase
      .from('exchange_escrow')
      .select('*, exchange_deals!inner(title, sponsor_org_id, provider_org_id, status)')
      .limit(limit)

    if (dealId) query = query.eq('deal_id', dealId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw new ApiError(500, 'Failed to fetch settlements', error.message)

    return Response.json({
      data: (data ?? []).map(s => ({
        id: s.id,
        deal_id: s.deal_id,
        deal_title: s.exchange_deals?.title ?? null,
        status: s.status,
        total_amount: s.total_amount,
        released_amount: s.released_amount,
        refunded_amount: s.refunded_amount,
        milestones: s.milestones,
        funded_at: s.funded_at,
        released_at: s.released_at,
        created_at: s.created_at,
        updated_at: s.updated_at,
      })),
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})

// ---------------------------------------------------------------------------
// POST /api/v1/financial/settlements
// Initialize a settlement for a deal
// ---------------------------------------------------------------------------
export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const body = (await request.json()) as Record<string, unknown>
      const correlationId = crypto.randomUUID()

      const parsed = createSettlementSchema.safeParse(body)
      if (!parsed.success) {
        throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)
      }

      // Verify the deal exists
      const { data: deal } = await supabase
        .from('exchange_deals')
        .select('id, title, sponsor_org_id, provider_org_id, status')
        .eq('id', parsed.data.deal_id)
        .single()

      if (!deal) throw new ApiError(404, 'Deal not found')
      if (deal.status !== 'active' && deal.status !== 'fulfillment') {
        throw new ApiError(409, `Cannot create settlement for deal with status "${deal.status}"`)
      }

      // Check for existing settlement (prevent duplicates)
      const { data: existing } = await supabase
        .from('exchange_escrow')
        .select('id, status')
        .eq('deal_id', parsed.data.deal_id)
        .maybeSingle()

      if (existing) {
        throw new ApiError(409, `Settlement already exists for this deal (status: ${existing.status})`)
      }

      // Create the settlement record
      const { data: settlement, error: insertError } = await supabase
        .from('exchange_escrow')
        .insert({
          deal_id: parsed.data.deal_id,
          total_amount: parsed.data.total_amount,
          released_amount: 0,
          refunded_amount: 0,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) throw new ApiError(500, 'Failed to create settlement', insertError.message)

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      const orgId = user.user_metadata?.active_org_id as string | null
      console.log(JSON.stringify({
        type: 'domain_event',
        event: {
          type: 'SettlementInitiated',
          payload: {
            dealId: parsed.data.deal_id,
            organizationId: orgId,
            amount: parsed.data.total_amount,
            initiatedBy: user.id,
          },
          actorId: user.id,
          organizationId: orgId,
          correlationId,
        },
        timestamp: new Date().toISOString(),
      }))

      console.log(JSON.stringify({
        type: 'provenance_record',
        data: {
          node_type: 'settlement',
          external_id: settlement.id,
          label: `Settlement ${parsed.data.total_amount} ${parsed.data.currency} for deal ${parsed.data.deal_id}`,
          properties: {
            deal_id: parsed.data.deal_id,
            total_amount: parsed.data.total_amount,
            currency: parsed.data.currency,
            correlationId,
          },
          organization_id: orgId,
        },
        timestamp: new Date().toISOString(),
      }))

      return Response.json({
        data: {
          id: settlement.id,
          deal_id: settlement.deal_id,
          status: settlement.status,
          total_amount: settlement.total_amount,
          released_amount: 0,
          refunded_amount: 0,
          correlationId,
          created_at: settlement.created_at,
        },
        error: null,
      }, { status: 201 })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'financial.settlements', 'kadarn.api.method': 'POST' } },
)
