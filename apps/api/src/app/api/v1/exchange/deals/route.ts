import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { createExchangeDealSchema, paginationSchema } from '@/lib/validation'

/**
 * GET /api/v1/exchange/deals
 * List exchange deals with pagination.
 */
export const GET = withAuth(async (request) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const { limit, offset } = paginationSchema.parse({
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    })

    const status = url.searchParams.get('status')
    const programId = url.searchParams.get('program_id')

    let query = supabase
      .from('exchange_deals')
      .select(`
        *,
        exchange_escrow ( id, status, total_amount, released_amount, refunded_amount )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (programId) query = query.eq('program_id', programId)

    const { data, error, count } = await query

    if (error) {
      throw new ApiError(500, 'Failed to fetch exchange deals', error.message)
    }

    return Response.json({
      data: (data ?? []).map(d => ({
        id: d.id,
        request_id: d.request_id,
        sponsor_org_id: d.sponsor_org_id,
        provider_org_id: d.provider_org_id,
        program_id: d.program_id,
        title: d.title,
        description: d.description,
        status: d.status,
        total_value: d.total_value,
        currency: d.currency,
        mta: {
          sponsor_signed: d.mta_signed_by_sponsor,
          provider_signed: d.mta_signed_by_provider,
          signed_at: d.mta_signed_at,
        },
        timeline: {
          expected_start: d.expected_start_date,
          expected_end: d.expected_end_date,
          actual_start: d.actual_start_date,
          actual_end: d.actual_end_date,
        },
        samples: {
          expected: d.sample_count_expected,
          delivered: d.sample_count_delivered,
          delivery_pct: d.delivery_percentage,
        },
        escrow: (d.exchange_escrow ?? [])[0] ?? null,
        created_at: d.created_at,
        updated_at: d.updated_at,
      })),
      pagination: { total: count ?? 0, limit, offset },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})

/**
 * POST /api/v1/exchange/deals
 * Create a new exchange deal. If total_value is provided, also creates
 * an exchange_escrow record for the deal.
 */
export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const body = (await request.json()) as Record<string, unknown>

    const parsed = createExchangeDealSchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)
    }

    const { total_value, ...dealFields } = parsed.data

    // Verify the exchange request exists
    const { data: exchangeReq } = await supabase
      .from('exchange_requests')
      .select('id')
      .eq('id', dealFields.request_id)
      .single()

    if (!exchangeReq) {
      throw new ApiError(400, 'Exchange request not found')
    }

    // Insert the deal
    const { data: deal, error: dealError } = await supabase
      .from('exchange_deals')
      .insert({
        request_id: dealFields.request_id,
        sponsor_org_id: dealFields.sponsor_org_id,
        provider_org_id: dealFields.provider_org_id,
        program_id: dealFields.program_id ?? null,
        title: dealFields.title,
        description: dealFields.description ?? null,
        total_value: total_value ?? null,
        currency: dealFields.currency ?? 'USD',
        expected_start_date: dealFields.expected_start_date ?? null,
        expected_end_date: dealFields.expected_end_date ?? null,
        sample_count_expected: dealFields.sample_count_expected ?? null,
        status: 'pending_acceptance',
        created_by: user.id,
      })
      .select()
      .single()

    if (dealError) {
      throw new ApiError(500, 'Failed to create exchange deal', dealError.message)
    }

    // If total_value provided, create escrow record
    let escrow = null
    if (total_value != null) {
      const { data: escrowRecord, error: escrowError } = await supabase
        .from('exchange_escrow')
        .insert({
          deal_id: deal.id,
          total_amount: total_value,
          released_amount: 0,
          refunded_amount: 0,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single()

      if (escrowError) {
        // Log but don't fail — deal was created. Escrow can be added later.
        console.error('Failed to create escrow for deal', deal.id, escrowError.message)
      } else {
        escrow = {
          id: escrowRecord.id,
          status: escrowRecord.status,
          total_amount: escrowRecord.total_amount,
          released_amount: escrowRecord.released_amount,
          refunded_amount: escrowRecord.refunded_amount,
        }
      }
    }

    return Response.json({
      data: {
        deal: {
          id: deal.id,
          request_id: deal.request_id,
          sponsor_org_id: deal.sponsor_org_id,
          provider_org_id: deal.provider_org_id,
          program_id: deal.program_id,
          title: deal.title,
          description: deal.description,
          status: deal.status,
          total_value: deal.total_value,
          currency: deal.currency,
          timeline: {
            expected_start: deal.expected_start_date,
            expected_end: deal.expected_end_date,
          },
          samples: {
            expected: deal.sample_count_expected,
            delivered: deal.sample_count_delivered,
            delivery_pct: deal.delivery_percentage,
          },
          created_at: deal.created_at,
          updated_at: deal.updated_at,
        },
        escrow,
      },
      error: null,
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
})
