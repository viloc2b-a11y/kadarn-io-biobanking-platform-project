import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { uuidParamSchema } from '@/lib/validation'

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id: programId } = uuidParamSchema.parse(params)
    const supabase = await createRouteClient()

    const { data, error } = await supabase
      .from('exchange_deals')
      .select(`
        id, request_id, sponsor_org_id, provider_org_id, program_id,
        title, description, status,
        total_value, currency, milestone_amounts,
        mta_signed_by_sponsor, mta_signed_by_provider, mta_signed_at,
        expected_start_date, expected_end_date,
        actual_start_date, actual_end_date,
        sample_count_expected, sample_count_delivered, delivery_percentage,
        created_at, updated_at,
        exchange_escrow ( id, status, total_amount, released_amount, refunded_amount )
      `)
      .eq('program_id', programId)
      .order('created_at', { ascending: false })

    if (error) {
      return Response.json(
        { error: { code: 500, message: error.message } },
        { status: 500 },
      )
    }

    return Response.json({
      data: (data ?? []).map(d => ({
        id: d.id,
        request_id: d.request_id,
        sponsor_org_id: d.sponsor_org_id,
        provider_org_id: d.provider_org_id,
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
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
