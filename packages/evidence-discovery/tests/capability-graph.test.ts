// ==========================================================================
// Capability Graph — Tests (Sprint 24B)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { VisibilityPolicyEngine } from '../src/visibility-policy/engine.js'
import { CapabilityGraphEngine } from '../src/capability-graph/engine.js'
import type { InstitutionRecord } from '../src/capability-graph/engine.js'

function makeGraph(): CapabilityGraphEngine {
  const vis = new VisibilityPolicyEngine()
  const graph = new CapabilityGraphEngine(vis)

  const vilo: InstitutionRecord = {
    id: 'inst:vilo', name: 'Vilo Research Center', geography: 'Houston, TX',
    capabilities: [
      { claimId: 'claim:plasma', name: 'Plasma Collection', status: 'healthy',
        evidenceCount: 3, researchAssets: ['Plasma'], gaps: [],
        readinessLabel: 'Presentation Ready', nextStep: 'No action needed' },
      { claimId: 'claim:pbmc', name: 'PBMC Processing', status: 'healthy',
        evidenceCount: 2, researchAssets: ['PBMC'], gaps: ['SOP missing'],
        readinessLabel: 'Needs Additional Evidence', nextStep: 'Upload SOP' },
    ],
  }

  const coastal: InstitutionRecord = {
    id: 'inst:coastal', name: 'Coastal Clinical', geography: 'San Diego, CA',
    capabilities: [
      { claimId: 'claim:ffpe', name: 'FFPE Tissue Processing', status: 'healthy',
        evidenceCount: 4, researchAssets: ['FFPE Tissue', 'Digital Slides'], gaps: [],
        readinessLabel: 'Presentation Ready', nextStep: 'No action needed' },
    ],
  }

  graph.registerInstitution(vilo)
  graph.registerInstitution(coastal)
  return graph
}

// --------------------------------------------------------------------------

describe('CapabilityGraph — anonymous search', () => {
  it('sponsor sees anonymous results only', () => {
    const graph = makeGraph()
    const result = graph.search({ capabilities: ['plasma'], research_assets: [], therapeutic_areas: [], geography: [], operational_features: [] }, 'sponsor')
    expect(result.total_matches).toBeGreaterThanOrEqual(1)
    expect(result.results[0].anonymous_institution_id).toContain('anon:')
    expect(result.results[0].visible_capabilities).toContain('Plasma Collection')
  })

  it('sponsor sees no institution names', () => {
    const graph = makeGraph()
    const result = graph.search({ capabilities: ['plasma'], research_assets: [], therapeutic_areas: [], geography: [], operational_features: [] }, 'sponsor')
    const json = JSON.stringify(result.results)
    expect(json).not.toContain('Vilo')
    expect(json).not.toContain('Coastal')
  })
})

// --------------------------------------------------------------------------

describe('CapabilityGraph — research asset match', () => {
  it('matches by research asset', () => {
    const graph = makeGraph()
    const result = graph.search({ capabilities: [], research_assets: ['FFPE Tissue'], therapeutic_areas: [], geography: [], operational_features: [] }, 'sponsor')
    expect(result.total_matches).toBe(1)
  })
})

// --------------------------------------------------------------------------

describe('CapabilityGraph — geography filter', () => {
  it('filters by geography', () => {
    const graph = makeGraph()
    const result = graph.search({ capabilities: [], research_assets: [], therapeutic_areas: [], geography: ['California'], operational_features: [] }, 'sponsor')
    expect(result.total_matches).toBe(1)
    expect(result.results[0].geography_summary).toContain('San Diego')
  })
})

// --------------------------------------------------------------------------

describe('CapabilityGraph — public actor', () => {
  it('public sees nothing due to visibility policies', () => {
    const graph = makeGraph()
    const result = graph.search({ capabilities: ['plasma'], research_assets: [], therapeutic_areas: [], geography: [], operational_features: [] }, 'public')
    // Public has 'hidden' level → no summary → no visible caps → filtered out
    expect(result.total_matches).toBe(0)
  })
})

// --------------------------------------------------------------------------

describe('CapabilityGraph — institution actor', () => {
  it('institution sees own institution in results', () => {
    const graph = makeGraph()
    // Institution sees restricted → can_view_summary=true → visible
    const result = graph.search({ capabilities: [], research_assets: [], therapeutic_areas: [], geography: [], operational_features: [] }, 'institution')
    expect(result.total_matches).toBeGreaterThanOrEqual(1)
  })
})

// --------------------------------------------------------------------------

describe('CapabilityGraph — deterministic ordering', () => {
  it('orders by readiness label priority', () => {
    const graph = makeGraph()
    const result = graph.search({ capabilities: [], research_assets: [], therapeutic_areas: [], geography: [], operational_features: [] }, 'sponsor')
    expect(result.results[0].readiness_label).toBe('Presentation Ready')
  })
})

// --------------------------------------------------------------------------

describe('CapabilityGraph — visibility policy enforced', () => {
  it('respects custom visibility policy hiding a claim', () => {
    const vis = new VisibilityPolicyEngine()
    vis.setPolicy({ policy_id: 'pol:hide', claim_id: 'claim:plasma', actor_type: 'sponsor', visibility_level: 'hidden', can_view_summary: false, can_view_evidence: false, can_view_identity: false, can_view_private_evidence: false, can_download: false, expires_at: null, metadata: {} })
    const graph = new CapabilityGraphEngine(vis)
    graph.registerInstitution({
      id: 'inst:test', name: 'Test', geography: 'TX',
      capabilities: [{ claimId: 'claim:plasma', name: 'Plasma', status: 'healthy', evidenceCount: 1, researchAssets: ['Plasma'], gaps: [], readinessLabel: 'Presentation Ready', nextStep: '' }],
    })
    const result = graph.search({ capabilities: ['plasma'], research_assets: [], therapeutic_areas: [], geography: [], operational_features: [] }, 'sponsor')
    expect(result.total_matches).toBe(0)
  })
})

// --------------------------------------------------------------------------

describe('CapabilityGraph — empty query', () => {
  it('returns all institutions for valid actor with empty query', () => {
    const graph = makeGraph()
    const result = graph.search({ capabilities: [], research_assets: [], therapeutic_areas: [], geography: [], operational_features: [] }, 'kadarn_internal')
    expect(result.total_matches).toBe(2)
  })
})

// --------------------------------------------------------------------------

describe('CapabilityGraph — no forbidden language', () => {
  it('never uses confidence, verified, certified in results', () => {
    const graph = makeGraph()
    const result = graph.search({ capabilities: ['plasma'], research_assets: [], therapeutic_areas: [], geography: [], operational_features: [] }, 'sponsor')
    const json = JSON.stringify(result)
    expect(json).not.toContain('confidence')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('Vilo')
  })
})
