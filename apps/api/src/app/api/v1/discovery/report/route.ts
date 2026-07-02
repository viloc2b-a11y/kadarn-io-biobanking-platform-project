// ==========================================================================
// Recognition Report API — Sprint 25D
// ==========================================================================
// GET /api/v1/discovery/report?sessionId=xxx
// Generates an Institution Recognition Report from canonical engines.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import { buildAllEngineOutputs } from '@/lib/dashboard-engines'
import { InstitutionRecognitionReportGenerator } from '@kadarn/evidence-discovery'
import type { ReportInput } from '@kadarn/evidence-discovery'

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
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

    // Get agent outputs
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

    // Build engine outputs
    const engines = buildAllEngineOutputs(agentOutputs)

    // Count artifacts
    const { count: artifactCount } = latestRun
      ? await supabase
          .from('discovery_artifacts')
          .select('*', { count: 'exact', head: true })
          .eq('run_id', latestRun.id)
      : { count: 0 }

    // Generate report
    const generator = new InstitutionRecognitionReportGenerator()
    const reportInput: ReportInput = {
      institutionName: session.site_name ?? session.name ?? 'Institution',
      capabilities: engines.assessmentIntelligence?.assessment.map((a) => ({
        id: a.capability_id,
        name: a.capability_name,
        category: a.category,
        assessment_status: a.assessment_status,
        operational_maturity: a.operational_maturity,
        supporting_claims: [],
        supporting_evidence: [],
        research_assets_enabled: a.research_assets_enabled,
        assessment_summary: a.assessment_summary,
      })) ?? [],
      assessmentSummary: engines.assessmentIntelligence?.summary,
      gaps: engines.gapIntelligence?.gaps.map((g) => ({
        title: g.title,
        severity: g.severity,
        blocking: g.blocking,
        affected_capabilities: g.affected_capabilities,
        affected_research_assets: g.affected_research_assets,
        recommended_next_action: g.recommended_next_action,
      })) ?? [],
      readiness: engines.sponsorReadiness ? {
        readiness_label: engines.sponsorReadiness.readiness_label,
        summary: engines.sponsorReadiness.summary,
        strengths: engines.sponsorReadiness.strengths,
        concerns: engines.sponsorReadiness.concerns,
      } : undefined,
      recommendations: engines.recommendations?.recommendations.map((r) => ({
        priority: r.priority,
        title: r.title,
        reason: r.reason,
        recommended_action: r.recommended_action,
        blocking: r.blocking,
      })),
      artifactsProcessed: artifactCount ?? 0,
      sessionCount: 1,
    }

    const report = generator.generate(reportInput)

    return Response.json({ data: report, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
