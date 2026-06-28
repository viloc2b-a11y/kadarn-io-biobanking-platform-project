import { withErrorHandling, createRouteClient } from '@/lib/supabase-server'

// Returns all active capability types with org counts — used for faceted browsing
export const GET = withErrorHandling(async (_request) => {
  const supabase = await createRouteClient()

  const { data, error } = await supabase
    .from('organization_capability_types')
    .select(`
      key, name, description, category, display_order,
      organization_capabilities ( organization_id )
    `)
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    return Response.json({ error: { code: 500, message: error.message } }, { status: 500 })
  }

  const capabilities = (data ?? []).map(cap => ({
    key:         cap.key,
    name:        cap.name,
    description: cap.description,
    category:    cap.category,
    org_count:   (cap.organization_capabilities ?? []).length,
  }))

  // Group by category
  const byCategory = capabilities.reduce<Record<string, typeof capabilities>>((acc, c) => {
    const cat = c.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(c)
    return acc
  }, {})

  return Response.json({
    data: { capabilities, by_category: byCategory },
    error: null,
  })
})
