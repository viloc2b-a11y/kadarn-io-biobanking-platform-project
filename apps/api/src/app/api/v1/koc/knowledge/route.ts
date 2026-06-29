import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

/**
 * GET /api/v1/koc/knowledge
 * Knowledge Fabric dashboard: ontology stats, graph links, candidate queue
 */
export const GET = withAuth(async (_request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    const [termsRes, synonymsRes, mappingsRes, linksRes, candidatesRes, nodesRes] = await Promise.all([
      supabase.from('ontology_terms').select('id, vocabulary', { count: 'exact' }),
      supabase.from('ontology_synonyms').select('id', { count: 'exact' }),
      supabase.from('ontology_mappings').select('id, coding_system', { count: 'exact' }),
      supabase.from('knowledge_entity_links').select('id, entity_type', { count: 'exact' }),
      supabase.from('ontology_term_candidates').select('id, status', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('provenance_nodes').select('id, node_type').limit(100),
    ])

    const terms = termsRes.data ?? []

    return Response.json({
      data: {
        total_terms: termsRes.count ?? terms.length,
        total_synonyms: synonymsRes.count ?? 0,
        total_mappings: mappingsRes.count ?? 0,
        total_entity_links: linksRes.count ?? 0,
        pending_candidates: candidatesRes.count ?? 0,
        total_nodes: nodesRes.data?.length ?? 0,
        by_vocabulary: (() => {
          const map: Record<string, number> = {}
          for (const term of terms) {
            const vocabulary = term.vocabulary ?? 'unknown'
            map[vocabulary] = (map[vocabulary] ?? 0) + 1
          }
          return map
        })(),
        by_coding_system: (() => {
          const map: Record<string, number> = {}
          for (const mapping of mappingsRes.data ?? []) {
            const system = mapping.coding_system ?? 'unknown'
            map[system] = (map[system] ?? 0) + 1
          }
          return map
        })(),
        fabric_status: 'active',
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
