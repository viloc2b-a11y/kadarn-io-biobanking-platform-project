// ==========================================================================
// Recognition Report API — Sprint 25D / Phase 8 28D convergence
// ==========================================================================
// GET /api/v1/discovery/report?sessionId=xxx
// All claim/capability/report outputs via Published View service (ADR-030).
// ==========================================================================

import { withAuth, handleApiError, createServiceClient } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import { getPublishedViewService } from '@/lib/published-view-service'
import { rateLimit, COMPUTE_RATE_LIMIT } from '@/lib/rate-limit'

export const GET = rateLimit(COMPUTE_RATE_LIMIT, withAuth(async (request, user) => {
  try {
    const supabase = createServiceClient()
    const organizationId = await requireValidatedActiveOrg(user)
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId) {
      return Response.json({ error: 'sessionId required' }, { status: 400 })
    }

    const { data: session } = await supabase
      .from('discovery_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('organization_id', organizationId)
      .single()

    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: runs } = await supabase
      .from('discovery_runs')
      .select('*')
      .eq('session_id', sessionId)
      .order('started_at', { ascending: false })
      .limit(1)

    const latestRun = runs?.[0] ?? null
    const agentOutputs: Record<string, { output: Record<string, unknown>; confidence: number; status: string; created_at: string }> = {}

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

    const { count: artifactCount } = latestRun
      ? await supabase
          .from('discovery_artifacts')
          .select('*', { count: 'exact', head: true })
          .eq('run_id', latestRun.id)
      : { count: 0 }

    const viewService = getPublishedViewService()
    const report = viewService.getDiscoveryReport({
      orgId: organizationId,
      sessionId,
      institutionName: session.site_name ?? session.name ?? 'Institution',
      agentOutputs,
      artifactsProcessed: artifactCount ?? 0,
      sessionCount: 1,
    })

    return Response.json({ data: report, error: null })
  } catch (err) {
    return handleApiError(err)
  }
}))
