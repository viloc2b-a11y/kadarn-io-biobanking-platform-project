import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const dealStatusEnum = z.enum([
  'pending_acceptance',
  'active',
  'fulfillment',
  'completed',
  'cancelled',
  'disputed',
])

const escrowStatusEnum = z.enum([
  'pending',
  'funded',
  'partially_released',
  'released',
  'refunded',
  'disputed',
])

const updateDealSchema = z.object({
  status: dealStatusEnum.optional(),
  mta_signed_by_sponsor: z.boolean().optional(),
  mta_signed_by_provider: z.boolean().optional(),
  sample_count_delivered: z.number().int().min(0).optional(),
  escrow: z.object({
    status: escrowStatusEnum.optional(),
    released_amount: z.number().min(0).optional(),
  }).optional(),
})

// ---------------------------------------------------------------------------
// PATCH /api/v1/exchange/deals/:id
// ---------------------------------------------------------------------------
export const PATCH = withAuth(async (request, user, params) => {
  try {
    const supabase = await createRouteClient()

    // Extract id from params or URL path
    const id = params?.id as string | undefined
    if (!id) {
      throw new ApiError(400, 'Deal ID is required')
    }

    // Fetch existing deal
    const { data: existingDeal, error: fetchError } = await supabase
      .from('exchange_deals')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingDeal) {
      throw new ApiError(404, 'Exchange deal not found')
    }

    // Parse and validate body
    const body = (await request.json()) as Record<string, unknown>
    const parsed = updateDealSchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)
    }

    const { escrow: escrowUpdate, ...dealUpdates } = parsed.data
    const dealPayload: Record<string, unknown> = {}

    // Build deal update payload
    if (dealUpdates.status !== undefined) {
      dealPayload.status = dealUpdates.status
    }
    if (dealUpdates.sample_count_delivered !== undefined) {
      dealPayload.sample_count_delivered = dealUpdates.sample_count_delivered
    }

    // MTA signing logic: auto-set mta_signed_at when one party signs,
    // and when both sign set it if not already set
    if (dealUpdates.mta_signed_by_sponsor !== undefined) {
      dealPayload.mta_signed_by_sponsor = dealUpdates.mta_signed_by_sponsor
    }
    if (dealUpdates.mta_signed_by_provider !== undefined) {
      dealPayload.mta_signed_by_provider = dealUpdates.mta_signed_by_provider
    }

    const sponsorSigned = dealUpdates.mta_signed_by_sponsor ?? existingDeal.mta_signed_by_sponsor
    const providerSigned = dealUpdates.mta_signed_by_provider ?? existingDeal.mta_signed_by_provider
    if (sponsorSigned || providerSigned) {
      // Set mta_signed_at if either party just signed and it's not already set
      if (!existingDeal.mta_signed_at) {
        dealPayload.mta_signed_at = new Date().toISOString()
      }
      // If both are now signed, auto-transition status to active
      if (sponsorSigned && providerSigned && existingDeal.status === 'pending_acceptance') {
        dealPayload.status = 'active'
      }
    }

    // Update the deal
    if (Object.keys(dealPayload).length > 0) {
      const { error: updateError } = await supabase
        .from('exchange_deals')
        .update(dealPayload)
        .eq('id', id)

      if (updateError) {
        throw new ApiError(500, 'Failed to update deal', updateError.message)
      }
    }

    // Handle escrow update
    let escrow = null
    if (escrowUpdate) {
      const { data: existingEscrow } = await supabase
        .from('exchange_escrow')
        .select('*')
        .eq('deal_id', id)
        .single()

      if (existingEscrow) {
        const escrowPayload: Record<string, unknown> = {}
        if (escrowUpdate.status !== undefined) {
          escrowPayload.status = escrowUpdate.status
        }
        if (escrowUpdate.released_amount !== undefined) {
          escrowPayload.released_amount = escrowUpdate.released_amount
        }

        if (Object.keys(escrowPayload).length > 0) {
          const { error: escrowError } = await supabase
            .from('exchange_escrow')
            .update(escrowPayload)
            .eq('deal_id', id)

          if (escrowError) {
            console.error('Failed to update escrow for deal', id, escrowError.message)
          }
        }
      }

      // Fetch updated escrow
      const { data: updatedEscrow } = await supabase
        .from('exchange_escrow')
        .select('id, status, total_amount, released_amount, refunded_amount')
        .eq('deal_id', id)
        .single()

      if (updatedEscrow) {
        escrow = {
          id: updatedEscrow.id,
          status: updatedEscrow.status,
          total_amount: updatedEscrow.total_amount,
          released_amount: updatedEscrow.released_amount,
          refunded_amount: updatedEscrow.refunded_amount,
        }
      }
    }

    // Fetch the final deal state
    const { data: updatedDeal } = await supabase
      .from('exchange_deals')
      .select('*')
      .eq('id', id)
      .single()

    if (!updatedDeal) {
      throw new ApiError(500, 'Failed to fetch updated deal')
    }

    return Response.json({
      data: {
        deal: {
          id: updatedDeal.id,
          request_id: updatedDeal.request_id,
          sponsor_org_id: updatedDeal.sponsor_org_id,
          provider_org_id: updatedDeal.provider_org_id,
          program_id: updatedDeal.program_id,
          title: updatedDeal.title,
          description: updatedDeal.description,
          status: updatedDeal.status,
          total_value: updatedDeal.total_value,
          currency: updatedDeal.currency,
          mta: {
            sponsor_signed: updatedDeal.mta_signed_by_sponsor,
            provider_signed: updatedDeal.mta_signed_by_provider,
            signed_at: updatedDeal.mta_signed_at,
          },
          timeline: {
            expected_start: updatedDeal.expected_start_date,
            expected_end: updatedDeal.expected_end_date,
            actual_start: updatedDeal.actual_start_date,
            actual_end: updatedDeal.actual_end_date,
          },
          samples: {
            expected: updatedDeal.sample_count_expected,
            delivered: updatedDeal.sample_count_delivered,
            delivery_pct: updatedDeal.delivery_percentage,
          },
          created_at: updatedDeal.created_at,
          updated_at: updatedDeal.updated_at,
        },
        escrow,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
