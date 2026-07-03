// ==========================================================================
// Opportunity Brief Engine — Types + Generator (Sprint 24D)
// ==========================================================================
// Converts Discovery Workspace into structured site-facing Opportunity Brief.
// No identity exposure. No mass messaging. No visibility bypass.
// ==========================================================================

import type { DiscoveryWorkspace, WorkspaceInput } from '../discovery-workspace/engine.js'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type BriefStatus =
  | 'draft' | 'ready' | 'sent_to_site' | 'viewed'
  | 'accepted' | 'declined' | 'clarification_requested' | 'expired' | 'archived'

export type SponsorDisplayMode = 'hidden' | 'partial' | 'visible'

export type SiteDecision = 'accept_interest' | 'decline' | 'request_clarification' | 'defer'

export interface VisibilityAccessRequest {
  claim_id: string
  research_asset_id: string
  purpose: string
  duration_days: number
}

export interface OpportunityBrief {
  brief_id: string
  workspace_id: string
  anonymous_institution_id: string
  sponsor_display_mode: SponsorDisplayMode
  study_summary: string
  therapeutic_area: string
  study_type: string
  sample_requirements: string[]
  data_requirements: string[]
  required_capabilities: string[]
  required_research_assets: string[]
  estimated_workload: string
  timeline: string
  estimated_compensation_range: string
  operational_fit_summary: string
  why_kadarn_matched_you: string
  known_gaps: string[]
  requested_visibility_access: VisibilityAccessRequest[]
  site_decision_options: SiteDecision[]
  status: BriefStatus
  created_at: string
  updated_at: string
}

// --------------------------------------------------------------------------
// Workload estimator (deterministic — no AI)
// --------------------------------------------------------------------------

function estimateWorkload(input: WorkspaceInput): string {
  const complexity = input.sample_needs.length + input.data_needs.length + input.research_assets_required.length
  if (complexity >= 6) return 'High — multiple biospecimen and data requirements across several capabilities'
  if (complexity >= 3) return 'Moderate — manageable sample and data collection requirements'
  return 'Standard — focused requirements with well-defined scope'
}

// --------------------------------------------------------------------------
// Operational fit summary (deterministic)
// --------------------------------------------------------------------------

function buildFitSummary(input: WorkspaceInput): string {
  const parts: string[] = []
  if (input.geography) parts.push(`Located in ${input.geography}`)
  if (input.therapeutic_area) parts.push(`${input.therapeutic_area} focus`)
  if (input.operational_requirements.length > 0) {
    parts.push(`Requires: ${input.operational_requirements.join(', ')}`)
  }
  return parts.join('. ') || 'Operational fit to be assessed by site.'
}

// --------------------------------------------------------------------------
// "Why matched" explanation
// --------------------------------------------------------------------------

function buildWhyMatched(input: WorkspaceInput): string {
  const reasons: string[] = []
  if (input.capabilities_required.length > 0) {
    reasons.push(`capabilities in ${input.capabilities_required.join(', ')}`)
  }
  if (input.research_assets_required.length > 0) {
    reasons.push(`research assets: ${input.research_assets_required.join(', ')}`)
  }
  if (input.therapeutic_area) {
    reasons.push(`therapeutic area: ${input.therapeutic_area}`)
  }
  return `Kadarn matched your institution based on ${reasons.join('; ')}.`
}

// --------------------------------------------------------------------------
// Visibility access request generator
// --------------------------------------------------------------------------

function buildAccessRequests(input: WorkspaceInput): VisibilityAccessRequest[] {
  const requests: VisibilityAccessRequest[] = []
  const allCapabilities = [...input.capabilities_required, ...input.sample_needs, ...input.data_needs]

  for (const cap of allCapabilities) {
    requests.push({
      claim_id: `claim:${cap.toLowerCase().replace(/\s+/g, '_')}`,
      research_asset_id: '',
      purpose: `Verify capability for ${input.study_title}`,
      duration_days: 90,
    })
  }

  for (const asset of input.research_assets_required) {
    requests.push({
      claim_id: '',
      research_asset_id: asset,
      purpose: `Confirm research asset availability for ${input.study_title}`,
      duration_days: 90,
    })
  }

  return requests
}

// --------------------------------------------------------------------------
// OpportunityBriefGenerator
// --------------------------------------------------------------------------

export class OpportunityBriefGenerator {
  /**
   * Generate an Opportunity Brief from a Discovery Workspace.
   */
  generate(
    workspace: DiscoveryWorkspace,
    anonymousInstitutionId: string,
    sponsorDisplayMode: SponsorDisplayMode = 'hidden',
  ): OpportunityBrief {
    const now = new Date().toISOString()
    const input = workspace.input

    const brief: OpportunityBrief = {
      brief_id: `brief:${(workspace.id ?? 'ws:unknown').slice(3)}:${(anonymousInstitutionId ?? 'anon:unknown').slice(5, 13)}`,
      workspace_id: workspace.id,
      anonymous_institution_id: anonymousInstitutionId,
      sponsor_display_mode: sponsorDisplayMode,
      study_summary: `${input.study_type}: ${input.study_title}`,
      therapeutic_area: input.therapeutic_area,
      study_type: input.study_type,
      sample_requirements: input.sample_needs,
      data_requirements: input.data_needs,
      required_capabilities: input.capabilities_required,
      required_research_assets: input.research_assets_required,
      estimated_workload: estimateWorkload(input),
      timeline: input.timeline,
      estimated_compensation_range: input.estimated_budget_range,
      operational_fit_summary: buildFitSummary(input),
      why_kadarn_matched_you: buildWhyMatched(input),
      known_gaps: workspace.compatibility?.known_gaps ?? [],
      requested_visibility_access: buildAccessRequests(input),
      site_decision_options: ['accept_interest', 'decline', 'request_clarification', 'defer'],
      status: 'ready',
      created_at: now,
      updated_at: now,
    }

    return brief
  }

  /**
   * Transition brief status.
   */
  transition(brief: OpportunityBrief, newStatus: BriefStatus): OpportunityBrief {
    brief.status = newStatus
    brief.updated_at = new Date().toISOString()
    return brief
  }
}
