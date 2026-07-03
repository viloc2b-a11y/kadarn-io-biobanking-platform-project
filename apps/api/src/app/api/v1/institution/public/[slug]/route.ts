// ==========================================================================
// Public Institution Profile API — Sprint 25D / Phase 8 28D convergence
// ==========================================================================
// GET /api/v1/institution/public/{slug}
// All capability/claim outputs via Published View service (ADR-030).
// ==========================================================================

import { withErrorHandling } from '@/lib/auth-guards'
import { createServiceClient } from '@/lib/supabase-server'
import { rateLimit, PUBLIC_RATE_LIMIT } from '@/lib/rate-limit'
import { getPublishedViewService } from '@/lib/published-view-service'

export const GET = rateLimit(PUBLIC_RATE_LIMIT, withErrorHandling(async (_request: Request) => {
  const url = new URL(_request.url)
  const slug = url.pathname.split('/').pop()!

  const supabase = createServiceClient()

  const { data: orgRow } = await supabase
    .from('organizations')
    .select('id, name, city, region, description')
    .eq('id', slug)
    .single()

  if (!orgRow) {
    return Response.json({ error: 'Institution not found' }, { status: 404 })
  }

  const org = {
    id: orgRow.id,
    name: orgRow.name,
    city: orgRow.city,
    state: orgRow.region,
    description: orgRow.description,
  }

  const { data: sessions } = await supabase
    .from('discovery_sessions')
    .select('id')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const session = sessions?.[0]
  const agentOutputs: Record<string, { output: Record<string, unknown>; confidence: number; status: string; created_at: string }> = {}

  if (session) {
    const { data: runs } = await supabase
      .from('discovery_runs')
      .select('*')
      .eq('session_id', session.id)
      .order('started_at', { ascending: false })
      .limit(1)

    const latestRun = runs?.[0] ?? null

    if (latestRun) {
      const { data: artifacts } = await supabase
        .from('discovery_artifacts')
        .select('id')
        .eq('run_id', latestRun.id)

      const artifactIds = (artifacts ?? []).map(a => a.id)

      if (artifactIds.length > 0) {
        const { data: outputs } = await supabase
          .from('discovery_agent_outputs')
          .select('agent_name, output, confidence, status, created_at')
          .in('artifact_id', artifactIds)
          .order('created_at', { ascending: false })

        for (const row of outputs ?? []) {
          if (!agentOutputs[row.agent_name]) {
            agentOutputs[row.agent_name] = {
              output: (row.output ?? {}) as Record<string, unknown>,
              confidence: Number(row.confidence ?? 0),
              status: row.status,
              created_at: row.created_at,
            }
          }
        }
      }
    }
  }

  const viewService = getPublishedViewService()
  const data = viewService.getInstitutionPublicResponse({
    org,
    slug,
    agentOutputs,
    sessionId: session?.id,
  })

  return Response.json({ data, error: null })
}))
