import { withErrorHandling, createRouteClient } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { createCorrelationId } from '@/lib/exchange-helper'

const RESEARCH_TYPES = ['existing_collection', 'prospective_collection', 'data_resource'] as const

export const GET = withAsyncTracing(
  withErrorHandling(async (request) => {
    const { searchParams } = new URL(request.url)
    const correlationId = createCorrelationId()

    const q        = searchParams.get('q') ?? undefined
    const disease  = searchParams.get('disease') ?? undefined
    const country  = searchParams.get('country') ?? undefined
    const samples  = searchParams.getAll('sample_type')
    const commercial = searchParams.get('commercial') === 'true' ? true : undefined
    const limit    = Math.min(Number(searchParams.get('limit') ?? 20), 100)
    const offset   = Number(searchParams.get('offset') ?? 0)

    const supabase = await createRouteClient()

    const { data, error } = await supabase.rpc('discovery_search', {
      p_search_text:     q ?? null,
      p_types:           RESEARCH_TYPES as unknown as string[],
      p_sample_types:    samples.length > 0 ? samples : null,
      p_disease_icd10:   disease ?? null,
      p_country:         country ?? null,
      p_commercial_only: commercial ?? null,
      p_limit:           limit,
      p_offset:          offset,
    })

    if (error) {
      return Response.json({ error: { code: 500, message: error.message } }, { status: 500 })
    }

    // ── Cross-engine hooks (fire-and-forget) ────────────────────────────
    console.log(JSON.stringify({
      type: 'catalog_search',
      correlationId,
      query: q ?? '',
      disease: disease ?? '',
      country: country ?? '',
      resultCount: (data ?? []).length,
      timestamp: new Date().toISOString(),
    }))

    return Response.json({
      data: (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id, type: r.type, title: r.title, description: r.description,
        disease_icd10: r.disease_icd10, disease_label: r.disease_label,
        sample_types: r.sample_types, country: r.country,
        organization_id: r.organization_id, organization_name: r.organization_name,
        price: r.price, currency: r.currency,
      })),
      error: null,
    })
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'marketplace.specimens', 'kadarn.api.method': 'GET' } },
)
