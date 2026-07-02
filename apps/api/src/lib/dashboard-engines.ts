// ==========================================================================
// Dashboard Engine Output Builder — Sprint 25D
// ==========================================================================
// Builds canonical engine outputs from agent data for the dashboard API.
// No new business logic — pure aggregation of existing engine calls.
// ==========================================================================

import { CapabilityIntelligenceEngine } from '@kadarn/evidence-discovery'
import type { CapabilityIntelligenceInput } from '@kadarn/evidence-discovery'
import { EvidenceGapIntelligenceEngine } from '@kadarn/evidence-discovery'
import type { GapIntelligenceInput } from '@kadarn/evidence-discovery'
import { InstitutionalCapabilityAssessmentEngine } from '@kadarn/evidence-discovery'
import type { AssessmentInput } from '@kadarn/evidence-discovery'
import { SponsorReadinessEngine } from '@kadarn/evidence-discovery'
import type { SponsorReadinessInput } from '@kadarn/evidence-discovery'
import { RecommendationEngine } from '@kadarn/evidence-discovery'
import type { RecommendationInput } from '@kadarn/evidence-discovery'

interface AgentOutputMap {
  [agentName: string]: {
    output: Record<string, unknown>
    confidence: number
    status: string
    created_at: string
  }
}

/**
 * Build CapabilityIntelligence from agent outputs.
 */
function buildCapabilityIntelligence(agentOutputs: AgentOutputMap) {
  const capOutput = agentOutputs['capability_detector']?.output
  const claimOutput = agentOutputs['claim_candidate_detector']?.output
  const gapOutput = agentOutputs['evidence_gap_detector']?.output

  if (!capOutput) return null

  const capabilities = (capOutput.capabilities as Array<Record<string, unknown>>) ?? []
  const claims = (claimOutput?.candidates as Array<Record<string, unknown>>) ?? []
  const gapReports = (gapOutput?.reports as Array<Record<string, unknown>>) ?? []
  const gaps = gapReports.flatMap((r) => (r.gaps as Array<Record<string, unknown>>) ?? [])

  const engine = new CapabilityIntelligenceEngine()
  const input: CapabilityIntelligenceInput = {
    candidateCapabilities: capabilities.map((c) => ({
      capabilityId: String(c.capabilityId ?? ''),
      claimTypeId: String(c.claimTypeId ?? ''),
      name: String(c.name ?? ''),
      category: String(c.category ?? ''),
      status: String(c.status ?? ''),
      supportingEntityIds: (c.supportingEntityIds as string[]) ?? [],
      supportingRelationshipIds: (c.supportingRelationshipIds as string[]) ?? [],
      supportingArtifactIds: (c.supportingArtifactIds as string[]) ?? [],
      reasoning: String(c.reasoning ?? ''),
    })),
    claimCandidates: claims.map((c) => ({
      id: String(c.id ?? ''),
      proposedClaimTypeId: String(c.proposedClaimTypeId ?? ''),
      reasoning: String(c.reasoning ?? ''),
    })),
    gaps: gaps.map((g) => ({
      gapId: String(g.gapId ?? ''),
      category: String(g.category ?? ''),
      description: String(g.description ?? ''),
      severity: String(g.severity ?? ''),
    })),
  }

  return engine.build(input)
}

/**
 * Build EvidenceGapIntelligence from agent outputs.
 */
function buildGapIntelligence(agentOutputs: AgentOutputMap) {
  const gapOutput = agentOutputs['evidence_gap_detector']?.output
  if (!gapOutput) return null

  const gapReports = (gapOutput.reports as Array<Record<string, unknown>>) ?? []
  const gaps = gapReports.flatMap((r) => (r.gaps as Array<Record<string, unknown>>) ?? [])

  const engine = new EvidenceGapIntelligenceEngine()
  const input: GapIntelligenceInput = {
    discoveryGaps: gaps.map((g) => ({
      gapId: String(g.gapId ?? ''),
      category: String(g.category ?? ''),
      description: String(g.description ?? ''),
      severity: String(g.severity ?? ''),
    })),
  }

  return engine.build(input)
}

/**
 * Build InstitutionalCapabilityAssessment from CI + GI.
 */
function buildAssessment(capIntelligence: ReturnType<typeof buildCapabilityIntelligence>, gapIntelligence: ReturnType<typeof buildGapIntelligence>) {
  if (!capIntelligence || !gapIntelligence) return null

  const engine = new InstitutionalCapabilityAssessmentEngine()
  const input: AssessmentInput = {
    capabilities: capIntelligence.capabilities.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      status: c.status,
      summary: c.summary,
      supporting_claims: c.supporting_claims,
      supporting_evidence: c.supporting_evidence,
      research_assets_enabled: c.research_assets_enabled,
      missing_requirements: c.missing_requirements,
      gaps: c.gaps,
      recommended_next_step: c.recommended_next_step,
    })),
    gaps: gapIntelligence.gaps,
  }

  return engine.build(input)
}

/**
 * Build SponsorReadiness from Assessment.
 */
function buildReadiness(assessment: ReturnType<typeof buildAssessment>, capIntelligence: ReturnType<typeof buildCapabilityIntelligence>, gapIntelligence: ReturnType<typeof buildGapIntelligence>) {
  if (!assessment || !capIntelligence || !gapIntelligence) return null

  const engine = new SponsorReadinessEngine()
  const input: SponsorReadinessInput = {
    assessment: assessment.assessment.map((a) => ({
      capability_id: a.capability_id,
      capability_name: a.capability_name,
      category: a.category,
      assessment_status: a.assessment_status,
      operational_maturity: a.operational_maturity,
      research_assets_enabled: a.research_assets_enabled,
      blocking_gaps: a.blocking_gaps,
      non_blocking_gaps: a.non_blocking_gaps,
      recommended_actions: a.recommended_actions,
      assessment_summary: a.assessment_summary,
    })),
    assessmentSummary: assessment.summary,
    capabilities: capIntelligence.capabilities.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      supporting_claims: c.supporting_claims,
      research_assets_enabled: c.research_assets_enabled,
    })),
    gaps: gapIntelligence.gaps,
  }

  return engine.build(input)
}

/**
 * Build Recommendations from Assessment + GI + SR.
 */
function buildRecommendations(
  assessment: ReturnType<typeof buildAssessment>,
  gapIntelligence: ReturnType<typeof buildGapIntelligence>,
  readiness: ReturnType<typeof buildReadiness>,
) {
  if (!assessment || !gapIntelligence || !readiness) return null

  const engine = new RecommendationEngine()
  const input: RecommendationInput = {
    assessment: assessment.assessment.map((a) => ({
      capability_id: a.capability_id,
      capability_name: a.capability_name,
      assessment_status: a.assessment_status,
      blocking_gaps: a.blocking_gaps,
      non_blocking_gaps: a.non_blocking_gaps,
      research_assets_enabled: a.research_assets_enabled,
      recommended_actions: a.recommended_actions,
      missing_requirements: a.missing_requirements,
    })),
    gaps: gapIntelligence.gaps,
    readiness: {
      readiness_label: readiness.readiness_label,
      blocking_items: readiness.blocking_items,
      recommended_preparation: readiness.recommended_preparation,
    },
  }

  return engine.build(input)
}

/**
 * Build all engine outputs from agent data.
 * Called by the dashboard API route.
 */
export function buildAllEngineOutputs(agentOutputs: AgentOutputMap) {
  const capabilityIntelligence = buildCapabilityIntelligence(agentOutputs)
  const gapIntelligence = buildGapIntelligence(agentOutputs)
  const assessmentIntelligence = buildAssessment(capabilityIntelligence, gapIntelligence)
  const sponsorReadiness = buildReadiness(assessmentIntelligence, capabilityIntelligence, gapIntelligence)
  const recommendations = buildRecommendations(assessmentIntelligence, gapIntelligence, sponsorReadiness)

  return {
    capabilityIntelligence,
    gapIntelligence,
    assessmentIntelligence,
    sponsorReadiness,
    recommendations,
  }
}
