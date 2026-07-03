import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

/**
 * GET /api/v1/koc/knowledge
 * Knowledge Dashboard: ontology stats, knowledge graph metrics, recommendations
 */
export const GET = withAuth(async (_request, user) => {
  try {
    // RC-0.3: KOC access restricted to kadarn_internal role
    const userRole = user.user_metadata?.kadarn_role as string | undefined
    if (userRole !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access restricted' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    const [termsRes, synonymsRes, mappingsRes, nodesRes] = await Promise.all([
      supabase.from('ontology_terms').select('id, domain, vocabulary', { count: 'exact' }),
      supabase.from('ontology_synonyms').select('id', { count: 'exact' }),
      supabase.from('ontology_mappings').select('id, relationship_type', { count: 'exact' }),
      supabase.from('provenance_nodes').select('id, node_type').limit(100),
    ])

    const terms = termsRes.data ?? []

    return Response.json({
      data: {
        total_terms: terms.length,
        total_synonyms: synonymsRes.count ?? 0,
        total_mappings: mappingsRes.count ?? 0,
        total_nodes: nodesRes.data?.length ?? 0,
        by_domain: (() => {
          const map: Record<string, number> = {}
          for (const t of terms) {
            const d = t.domain ?? 'unknown'
            map[d] = (map[d] ?? 0) + 1
          }
          return map
        })(),
        by_vocabulary: (() => {
          const map: Record<string, number> = {}
          for (const t of terms) {
            const v = t.vocabulary ?? 'unknown'
            map[v] = (map[v] ?? 0) + 1
          }
          return map
        })(),
        term_coverage: terms.length > 0 ? Math.round((terms.filter(t => t.domain).length / terms.length) * 100) : 0,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
