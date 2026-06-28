import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim() ?? ''

    if (!q || q.length < 2) {
      return Response.json({ data: { results: [], total: 0 }, error: null })
    }

    const query = `%${q}%`

    const [orgs, programs, specimens, shipments, collections] = await Promise.all([
      supabase.from('organizations').select('id, name, country').ilike('name', query).limit(5),
      supabase.from('programs').select('id, name, short_name, status').ilike('name', query).limit(5),
      supabase.from('specimen_twins').select('id, external_id, specimen_type, status').ilike('external_id', query).limit(5),
      supabase.from('shipment_twins').select('id, external_id, status').ilike('external_id', query).limit(5),
      supabase.from('collection_twins').select('id, name, status').ilike('name', query).limit(5),
    ])

    const results = [
      ...(orgs.data ?? []).map(o => ({ type: 'organization', id: o.id, label: o.name, detail: o.country })),
      ...(programs.data ?? []).map(p => ({ type: 'program', id: p.id, label: p.name, detail: p.status })),
      ...(specimens.data ?? []).map(s => ({ type: 'specimen', id: s.id, label: s.external_id, detail: s.specimen_type })),
      ...(shipments.data ?? []).map(s => ({ type: 'shipment', id: s.id, label: s.external_id, detail: s.status })),
      ...(collections.data ?? []).map(c => ({ type: 'collection', id: c.id, label: c.name, detail: c.status })),
    ]

    return Response.json({ data: { results, total: results.length, query: q }, error: null })
  } catch (err) { return handleApiError(err) }
})
