import { withErrorHandling, createRouteClient } from '@/lib/supabase-server'

type CapabilityType = { key: string; name: string }

// Unified search across supply_items + organizations
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url)
  const q      = searchParams.get('q') ?? ''
  const limit  = Math.min(Number(searchParams.get('limit') ?? 5), 20)

  if (!q.trim()) {
    return Response.json({ data: { items: [], organizations: [] }, error: null })
  }

  const supabase = await createRouteClient()

  const [itemsRes, orgsRes] = await Promise.all([
    supabase.rpc('discovery_search', {
      p_search_text:     q,
      p_types:           null,
      p_sample_types:    null,
      p_disease_icd10:   null,
      p_country:         null,
      p_commercial_only: null,
      p_limit:           limit,
      p_offset:          0,
    }),
    supabase
      .from('organizations')
      .select('id, name, country, organization_capabilities(organization_capability_types(key, name))')
      .ilike('name', `%${q}%`)
      .eq('is_active', true)
      .in('visibility_scope', ['network', 'public'])
      .limit(limit),
  ])

  return Response.json({
    data: {
      items:         (itemsRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id, type: r.type, title: r.title, disease_label: r.disease_label, org_id: r.organization_id,
      })),
      organizations: (orgsRes.data ?? []).map(o => ({
        id: o.id, name: o.name, country: o.country,
        capabilities: (o.organization_capabilities ?? [])
          .map(c => {
            const capabilityType = Array.isArray(c.organization_capability_types)
              ? c.organization_capability_types[0] as CapabilityType | undefined
              : c.organization_capability_types as CapabilityType | null

            return capabilityType?.key
          })
          .filter(Boolean),
      })),
    },
    error: null,
  })
})
