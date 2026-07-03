// ==========================================================================
// Institution Profile API — Sprint 25D
// ==========================================================================
// GET /api/v1/institution/profile
// Returns executive profile data from canonical engines.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import { buildAllEngineOutputs } from '@/lib/dashboard-engines'
import { rateLimit, WORKSPACE_RATE_LIMIT } from '@/lib/rate-limit'

export const GET = rateLimit(WORKSPACE_RATE_LIMIT, withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const organizationId = await requireValidatedActiveOrg(user)

    // Get latest session
    const { data: sessions } = await supabase
      .from('discovery_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)

    const session = sessions?.[0]
    if (!session) {
      return Response.json({ data: null, error: 'No discovery session found' }, { status: 404 })
    }

    // Get agent outputs
    const { data: runs } = await supabase
      .from('discovery_runs')
      .select('*')
      .eq('session_id', session.id)
      .order('started_at', { ascending: false })
      .limit(1)

    const latestRun = runs?.[0] ?? null
    const agentOutputs: Record<string, { output: Record<string, unknown>; confidence: number; status: string; created_at: string }> = {}

    if (latestRun) {
      const { data: artifacts } = await supabase
        .from('discovery_artifacts')
        .select('id')
        .eq('run_id', latestRun.id)

      const artifactIds = (artifacts ?? []).map((a) => a.id)

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

    const engines = buildAllEngineOutputs(agentOutputs)

    return Response.json({
      data: {
        institution_name: session.site_name ?? session.name ?? 'Institution',
        institution_slug: organizationId,
        institution_story: session.description ?? '',
        location: session.location ?? null,
        capabilities: engines.capabilityIntelligence,
        assessment: engines.assessmentIntelligence,
        gaps: engines.gapIntelligence,
        readiness: engines.sponsorReadiness,
        recommendations: engines.recommendations,
        generated_at: new Date().toISOString(),
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}))
