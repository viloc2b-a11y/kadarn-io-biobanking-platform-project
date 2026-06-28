import { withErrorHandling, createRouteClient } from '@/lib/supabase-server'

const SERVICE_TYPES = ['laboratory_service', 'clinical_service', 'storage_logistics', 'equipment_capability'] as const

type ServiceResult = {
  id: unknown
  type: unknown
  title: unknown
  description: unknown
  service_categories: unknown
  country: unknown
  org_id: unknown
  org_name: unknown
  search_rank: unknown
}

export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url)

  const q       = searchParams.get('q') ?? undefined
  const country = searchParams.get('country') ?? undefined
  const cats    = searchParams.getAll('category')
  const limit   = Math.min(Number(searchParams.get('limit') ?? 20), 100)
  const offset  = Number(searchParams.get('offset') ?? 0)

  const supabase = await createRouteClient()

  const { data, error } = await supabase.rpc('discovery_search', {
    p_search_text:     q ?? null,
    p_types:           SERVICE_TYPES as unknown as string[],
    p_sample_types:    null,
    p_disease_icd10:   null,
    p_country:         country ?? null,
    p_commercial_only: null,
    p_limit:           limit,
    p_offset:          offset,
  })

  if (error) {
    return Response.json({ error: { code: 500, message: error.message } }, { status: 500 })
  }

  const orgIds = [...new Set((data ?? []).map((r: { organization_id: string }) => r.organization_id))]
  const { data: orgs } = orgIds.length > 0
    ? await supabase.from('organizations').select('id, name').in('id', orgIds)
    : { data: [] }

  const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]))

  let results: ServiceResult[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id:                 r.id,
    type:               r.type,
    title:              r.title,
    description:        r.description,
    service_categories: r.service_categories,
    country:            r.country,
    org_id:             r.organization_id,
    org_name:           orgMap[r.organization_id as string] ?? null,
    search_rank:        r.search_rank,
  }))

  // Client-side category filter (service_categories is an array column)
  if (cats.length > 0) {
    results = results.filter(r =>
      (r.service_categories as string[] | null)?.some(c => cats.includes(c))
    )
  }

  const total = (data?.[0] as { total_count?: number } | undefined)?.total_count ?? 0

  return Response.json({
    data: { results, total, limit, offset },
    error: null,
  })
})
