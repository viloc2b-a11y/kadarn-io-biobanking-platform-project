// ==========================================================================
// Discovery Recognition Report — via Published View boundary (28D)
// ==========================================================================

import {
  InstitutionRecognitionReportGenerator,
  type InstitutionRecognitionReport,
  type ReportInput,
} from '@kadarn/evidence-discovery'
import { buildAllEngineOutputs, type AgentOutputMap } from './engine-output-builder'
import { adaptDiscoveryAgentOutputs, type DiscoveryAdaptContext } from './discovery-agent-adapter'

export interface DiscoveryReportInput {
  orgId: string
  sessionId: string
  institutionName: string
  agentOutputs: AgentOutputMap
  artifactsProcessed: number
  sessionCount?: number
}

function buildReportInputFromEngines(
  institutionName: string,
  engines: ReturnType<typeof buildAllEngineOutputs>,
  artifactsProcessed: number,
  sessionCount: number,
): ReportInput {
  return {
    institutionName,
    capabilities: engines.assessmentIntelligence?.assessment.map(a => ({
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
    gaps: engines.gapIntelligence?.gaps.map(g => ({
      title: g.title,
      severity: g.severity,
      blocking: g.blocking,
      affected_capabilities: g.affected_capabilities,
      affected_research_assets: g.affected_research_assets,
      recommended_next_action: g.recommended_next_action,
    })) ?? [],
    readiness: engines.sponsorReadiness
      ? {
          readiness_label: engines.sponsorReadiness.readiness_label,
          summary: engines.sponsorReadiness.summary,
          strengths: engines.sponsorReadiness.strengths,
          concerns: engines.sponsorReadiness.concerns,
        }
      : undefined,
    recommendations: engines.recommendations?.recommendations.map(r => ({
      priority: r.priority,
      title: r.title,
      reason: r.reason,
      recommended_action: r.recommended_action,
      blocking: r.blocking,
    })),
    artifactsProcessed,
    sessionCount,
  }
}

/** Generate recognition report with capability/claim outputs via Compatibility Layer */
export function generateDiscoveryReport(input: DiscoveryReportInput): InstitutionRecognitionReport {
  const ctx: DiscoveryAdaptContext = {
    orgId: input.orgId,
    sessionId: input.sessionId,
    audience: 'canonical',
  }

  const { agentOutputs } = adaptDiscoveryAgentOutputs(input.agentOutputs, ctx)
  const engines = buildAllEngineOutputs(agentOutputs)
  const reportInput = buildReportInputFromEngines(
    input.institutionName,
    engines,
    input.artifactsProcessed,
    input.sessionCount ?? 1,
  )

  return new InstitutionRecognitionReportGenerator().generate(reportInput)
}

/** Build engines from raw agent outputs (direct path for equivalence tests) */
export function buildDiscoveryReportDirect(input: DiscoveryReportInput): InstitutionRecognitionReport {
  const engines = buildAllEngineOutputs(input.agentOutputs)
  const reportInput = buildReportInputFromEngines(
    input.institutionName,
    engines,
    input.artifactsProcessed,
    input.sessionCount ?? 1,
  )
  return new InstitutionRecognitionReportGenerator().generate(reportInput)
}

export type { InstitutionRecognitionReport }
