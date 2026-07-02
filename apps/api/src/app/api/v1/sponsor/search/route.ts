// ==========================================================================
// Sponsor Search API — Sprint 25D
// ==========================================================================
// POST /api/v1/sponsor/search
// Anonymous capability search. No institution identity exposed.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { VisibilityPolicyEngine, CapabilityGraphEngine } from '@kadarn/evidence-discovery'
import type { CapabilityQuery } from '@kadarn/evidence-discovery'

export const POST = withAuth(async (request) => {
  try {
    const supabase = await createRouteClient()
    const body = await request.json() as CapabilityQuery

    // Build visibility engine
    const visibilityEngine = new VisibilityPolicyEngine()

    // Build capability graph
    const graphEngine = new CapabilityGraphEngine(visibilityEngine)

    // Register institutions from database
    const { data: institutions } = await supabase
      .from('organizations')
      .select('id, name, city, state')

    if (institutions) {
      for (const inst of institutions) {
        // Get capability data for this institution
        const { data: sessions } = await supabase
          .from('discovery_sessions')
          .select('id')
          .eq('organization_id', inst.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const sessionId = sessions?.[0]?.id
        if (!sessionId) continue

        // Get agent outputs (simplified — in production, use cached engine outputs)
        graphEngine.registerInstitution({
          id: inst.id,
          name: inst.name,
          geography: [inst.city, inst.state].filter(Boolean).join(', '),
          capabilities: [], // Would be populated from cached engine outputs in production
        })
      }
    }

    const result = graphEngine.search(body, 'sponsor')

    return Response.json({ data: result, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
