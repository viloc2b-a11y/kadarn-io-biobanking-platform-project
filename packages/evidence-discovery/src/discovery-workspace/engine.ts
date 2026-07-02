// ==========================================================================
// Discovery Workspace — Types + Engine (Sprint 24C)
// ==========================================================================
// Sponsor workspace where research needs become structured opportunities.
// No mass messaging. No identity exposure. No visibility bypass.
// ==========================================================================

import type { ActorType } from '../visibility-policy/engine.js'
import type { CapabilityGraphEngine, CapabilityQuery } from '../capability-graph/engine.js'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type WorkspaceStatus = 'draft' | 'ready_for_review' | 'submitted_for_brief' | 'archived'

export interface WorkspaceInput {
  study_title: string
  sponsor_type: string
  therapeutic_area: string
  study_type: string
  sample_needs: string[]
  data_needs: string[]
  research_assets_required: string[]
  capabilities_required: string[]
  geography: string
  population_requirements: string
  timeline: string
  estimated_budget_range: string
  operational_requirements: string[]
  notes: string
}

export interface CompatibilitySummary {
  required_capabilities: string[]
  required_research_assets: string[]
  total_candidates: number
  candidates_by_readiness: Record<string, number>
  known_gaps: string[]
  operational_risks: string[]
}

export interface DiscoveryWorkspace {
  id: string
  status: WorkspaceStatus
  input: WorkspaceInput
  compatibility: CompatibilitySummary | null
  candidate_pool_ids: string[]
  created_at: string
  updated_at: string
}

// --------------------------------------------------------------------------
// DiscoveryWorkspaceEngine
// --------------------------------------------------------------------------

export class DiscoveryWorkspaceEngine {
  private workspaces = new Map<string, DiscoveryWorkspace>()
  private graphEngine: CapabilityGraphEngine

  constructor(graphEngine: CapabilityGraphEngine) {
    this.graphEngine = graphEngine
  }

  /**
   * Create a new Discovery Workspace from research requirements.
   */
  create(input: WorkspaceInput, actor: ActorType): DiscoveryWorkspace {
    const now = new Date().toISOString()
    const id = `ws:${now.slice(0, 10)}:${Math.random().toString(36).slice(2, 8)}`

    // Build capability query from input
    const query: CapabilityQuery = {
      capabilities: [
        ...input.capabilities_required,
        ...input.sample_needs,
        ...input.data_needs,
      ],
      research_assets: input.research_assets_required,
      therapeutic_areas: [input.therapeutic_area],
      geography: [input.geography],
      operational_features: input.operational_requirements,
    }

    // Search Capability Graph (anonymized, visibility-policy-enforced)
    const graphResult = this.graphEngine.search(query, actor)

    // Build compatibility summary
    const compatibility = this.buildCompatibility(input, graphResult.total_matches)

    // Extract anonymous candidate IDs
    const candidateIds = graphResult.results.map((r) => r.anonymous_institution_id)

    const workspace: DiscoveryWorkspace = {
      id,
      status: candidateIds.length > 0 ? 'ready_for_review' : 'draft',
      input,
      compatibility,
      candidate_pool_ids: candidateIds,
      created_at: now,
      updated_at: now,
    }

    this.workspaces.set(id, workspace)
    return workspace
  }

  /**
   * Get workspace by ID.
   */
  get(id: string): DiscoveryWorkspace | undefined {
    return this.workspaces.get(id)
  }

  /**
   * Transition status.
   */
  transition(id: string, newStatus: WorkspaceStatus): DiscoveryWorkspace {
    const ws = this.workspaces.get(id)
    if (!ws) throw new Error(`Workspace not found: ${id}`)
    ws.status = newStatus
    ws.updated_at = new Date().toISOString()
    return ws
  }

  /**
   * Build compatibility summary from input and candidate count.
   */
  private buildCompatibility(input: WorkspaceInput, candidateCount: number): CompatibilitySummary {
    const gaps: string[] = []
    const risks: string[] = []

    if (input.capabilities_required.length === 0 && input.research_assets_required.length === 0) {
      gaps.push('No specific capabilities or research assets defined — broad search may return many candidates')
    }

    if (input.sample_needs.length === 0) {
      gaps.push('Sample needs not specified — consider adding biospecimen requirements')
    }

    if (!input.geography) {
      risks.push('Geography not specified — candidate pool may include distant institutions')
    }

    if (!input.timeline) {
      risks.push('Timeline not specified — institution availability cannot be assessed')
    }

    if (candidateCount === 0) {
      gaps.push('No institutions currently match these requirements — consider broadening criteria')
    }

    const readinessCounts: Record<string, number> = {}
    // Readiness counts would come from graph results in production

    return {
      required_capabilities: input.capabilities_required,
      required_research_assets: input.research_assets_required,
      total_candidates: candidateCount,
      candidates_by_readiness: readinessCounts,
      known_gaps: gaps,
      operational_risks: risks,
    }
  }
}
