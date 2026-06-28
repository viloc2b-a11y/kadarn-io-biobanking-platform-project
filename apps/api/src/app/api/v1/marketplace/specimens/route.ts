import { withErrorHandling, createRouteClient } from '@/lib/supabase-server'

const RESEARCH_TYPES = ['existing_collection', 'prospective_collection', 'data_resource'] as const

export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url)

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

  // Enrich with org names in a single query
  const orgIds = [...new Set((data ?? []).map((r: { organization_id: string }) => r.organization_id))]
  const { data: orgs } = orgIds.length > 0
    ? await supabase.from('organizations').select('id, name').in('id', orgIds)
    : { data: [] }

  const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]))

  const results = (data ?? []).map((r: Record<string, unknown>) => ({
    id:                    r.id,
    type:                  r.type,
    title:                 r.title,
    description:           r.description,
    disease_icd10:         r.disease_icd10,
    disease_label:         r.disease_label,
    sample_types:          r.sample_types,
    country:               r.country,
    commercial_use_allowed: r.commercial_use_allowed,
    org_id:                r.organization_id,
    org_name:              orgMap[r.organization_id as string] ?? null,
    search_rank:           r.search_rank,
  }))

  const total = (data?.[0] as { total_count?: number } | undefined)?.total_count ?? 0

  return Response.json({
    data: { results, total, limit, offset },
    error: null,
  })
})
