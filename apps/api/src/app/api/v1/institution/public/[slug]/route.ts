// ==========================================================================
// Public Institution Profile API — Sprint 25D
// ==========================================================================
// GET /api/v1/institution/public/{slug}
// Public-facing profile. No private evidence. No identity exposure.
// RC-0.3: Wrapped with withErrorHandling for consistent error handling.
// ==========================================================================

import { withErrorHandling, createRouteClient } from '@/lib/auth-guards'
import { buildAllEngineOutputs } from '@/lib/dashboard-engines'

export const GET = withErrorHandling(async (_request: Request) => {
  const url = new URL(_request.url)
  const slug = url.pathname.split('/').pop()!

  const supabase = await createRouteClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, city, state, description')
    .eq('id', slug)
    .single()

  if (!org) {
    return Response.json({ error: 'Institution not found' }, { status: 404 })
  }

  // Get latest session for this org
  const { data: sessions } = await supabase
    .from('discovery_sessions')
    .select('id')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const session = sessions?.[0]

  // Build engine outputs (if session exists)
  let capabilities = null
  let assessment = null
  let readiness = null

  if (session) {
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
    capabilities = engines.capabilityIntelligence
    assessment = engines.assessmentIntelligence
    readiness = engines.sponsorReadiness
  }

  // Public profile: no private evidence, no recommendations (sponsor-specific)
  return Response.json({
    data: {
      institution_name: org.name,
      institution_slug: slug,
      institution_story: org.description ?? `${org.name} is a Kadarn-enrolled institution.`,
      location: [org.city, org.state].filter(Boolean).join(', '),
      capabilities,
      assessment,
      gaps: null, // Gaps are sponsor/internal only
      readiness: readiness ? {
        readiness_label: readiness.readiness_label,
        summary: readiness.summary,
        strengths: readiness.strengths,
        concerns: readiness.concerns,
      } : null,
      recommendations: null, // Not public
      generated_at: new Date().toISOString(),
    },
    error: null,
  })
})
