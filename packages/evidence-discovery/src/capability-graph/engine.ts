// ==========================================================================
// Capability Graph — Types + Engine (Sprint 24B)
// ==========================================================================
// Anonymous capability discovery. Sponsors search capabilities, not institutions.
// Identity remains hidden. Visibility Policy Engine enforced.
// No new intelligence. No confidence. No identity exposure.
// ==========================================================================

import type { ActorType, VisibilityPolicyEngine } from '../visibility-policy/engine.js'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface CapabilityQuery {
  capabilities: string[]
  research_assets: string[]
  therapeutic_areas: string[]
  geography: string[]
  operational_features: string[]
}

export interface AnonymousInstitutionResult {
  anonymous_institution_id: string
  visible_capabilities: string[]
  visible_research_assets: string[]
  geography_summary: string
  readiness_label: string
  evidence_summary: string
  gaps_summary: string
  recommended_next_step: string
  visibility_policy_refs: string[]
}

export interface CapabilityGraphResult {
  query: CapabilityQuery
  results: AnonymousInstitutionResult[]
  total_matches: number
  generated_at: string
}

export interface InstitutionRecord {
  id: string
  name: string
  geography: string
  capabilities: Array<{
    claimId: string
    name: string
    status: string
    evidenceCount: number
    researchAssets: string[]
    gaps: string[]
    readinessLabel: string
    nextStep: string
  }>
}

// --------------------------------------------------------------------------
// CapabilityGraphEngine
// --------------------------------------------------------------------------

export class CapabilityGraphEngine {
  private institutions: InstitutionRecord[] = []
  private visibilityEngine: VisibilityPolicyEngine

  constructor(visibilityEngine: VisibilityPolicyEngine) {
    this.visibilityEngine = visibilityEngine
  }

  /**
   * Register an institution's capabilities in the graph.
   */
  registerInstitution(record: InstitutionRecord): void {
    this.institutions.push(record)
  }

  /**
   * Search the capability graph for anonymous matches.
   * Returns results filtered by Visibility Policy Engine for the requesting actor.
   */
  search(query: CapabilityQuery, actor: ActorType): CapabilityGraphResult {
    const now = new Date().toISOString()
    const results: AnonymousInstitutionResult[] = []

    for (const inst of this.institutions) {
      // Check if any capability matches the query
      const matchingCaps = inst.capabilities.filter((cap) => {
        const nameMatch = query.capabilities.length === 0 ||
          query.capabilities.some((qc) => cap.name.toLowerCase().includes(qc.toLowerCase()))
        const assetMatch = query.research_assets.length === 0 ||
          query.research_assets.some((qa) => cap.researchAssets.some((ra) => ra.toLowerCase().includes(qa.toLowerCase())))
        const geoMatch = query.geography.length === 0 ||
          query.geography.some((g) => inst.geography.toLowerCase().includes(g.toLowerCase()))
        return (nameMatch || assetMatch) && geoMatch
      })

      if (matchingCaps.length === 0) continue

      // Apply visibility policies for this actor
      const visibleCaps: string[] = []
      const visibleAssets = new Set<string>()
      const visibilityRefs: string[] = []

      for (const cap of matchingCaps) {
        const vis = this.visibilityEngine.resolve(actor, cap.claimId)
        visibilityRefs.push(vis.policy_applied)

        if (vis.can_view_summary) {
          visibleCaps.push(cap.name)
          for (const asset of cap.researchAssets) {
            visibleAssets.add(asset)
          }
        }
      }

      // If nothing visible, skip this institution
      if (visibleCaps.length === 0) continue

      // Build anonymous result — never expose identity
      const readinessLabel = matchingCaps[0]?.readinessLabel ?? 'Not available'
      const totalEvidence = matchingCaps.reduce((sum, c) => sum + c.evidenceCount, 0)
      const totalGaps = matchingCaps.reduce((sum, c) => sum + c.gaps.length, 0)

      results.push({
        anonymous_institution_id: `anon:${inst.id.slice(0, 8)}`,
        visible_capabilities: visibleCaps,
        visible_research_assets: Array.from(visibleAssets),
        geography_summary: inst.geography,
        readiness_label: readinessLabel,
        evidence_summary: `${totalEvidence} pieces of supporting evidence across ${matchingCaps.length} capabilities`,
        gaps_summary: totalGaps > 0 ? `${totalGaps} evidence gaps identified` : 'No significant gaps',
        recommended_next_step: matchingCaps[0]?.nextStep ?? 'Review capability details',
        visibility_policy_refs: [...new Set(visibilityRefs)],
      })
    }

    // Deterministic ordering: readiness label priority
    const readinessOrder: Record<string, number> = {
      'Presentation Ready': 0,
      'Needs Additional Evidence': 1,
      'Needs Human Review': 2,
      'Not Enough Evidence Yet': 3,
    }
    results.sort((a, b) => (readinessOrder[a.readiness_label] ?? 4) - (readinessOrder[b.readiness_label] ?? 4))

    return {
      query,
      results,
      total_matches: results.length,
      generated_at: now,
    }
  }

  /**
   * Get all registered institutions (Kadarn Internal only — not exposed to sponsors).
   */
  getInstitutions(): InstitutionRecord[] {
    return [...this.institutions]
  }
}
