import { withErrorHandling, createRouteClient } from '@/lib/supabase-server'

type CapabilityType = { key: string; name: string; category: string }

export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url)
  const q      = searchParams.get('q') ?? undefined
  const cap    = searchParams.get('capability') ?? undefined
  const country = searchParams.get('country') ?? undefined
  const limit  = Math.min(Number(searchParams.get('limit') ?? 20), 100)
  const offset = Number(searchParams.get('offset') ?? 0)

  const supabase = await createRouteClient()

  let query = supabase
    .from('organizations')
    .select(`
      id, name, description, country, region, website, certifications,
      organization_capabilities (
        is_primary,
        organization_capability_types ( key, name, category )
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .in('visibility_scope', ['network', 'public'])
    .order('name')
    .range(offset, offset + limit - 1)

  if (country) query = query.eq('country', country)
  if (q)       query = query.ilike('name', `%${q}%`)

  const { data, error, count } = await query

  if (error) {
    return Response.json({ error: { code: 500, message: error.message } }, { status: 500 })
  }

  let results = (data ?? []).map(org => {
    const caps = (org.organization_capabilities ?? []).map(c => {
      const capabilityType = Array.isArray(c.organization_capability_types)
        ? c.organization_capability_types[0] as CapabilityType | undefined
        : c.organization_capability_types as CapabilityType | null

      return {
        key:      capabilityType?.key,
        name:     capabilityType?.name,
        category: capabilityType?.category,
        primary:  c.is_primary,
      }
    }).filter(c => c.key)

    return {
      id:              org.id,
      name:            org.name,
      description:     org.description,
      country:         org.country,
      region:          org.region,
      website:         org.website,
      certifications:  org.certifications ?? [],
      capabilities:    caps,
    }
  })

  if (cap) {
    results = results.filter(r => r.capabilities.some(c => c.key === cap))
  }

  return Response.json({
    data: { results, total: count ?? results.length, limit, offset },
    error: null,
  })
})
