// ==========================================================================
// Opportunity Brief Engine — Tests (Sprint 24D)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { VisibilityPolicyEngine } from '../src/visibility-policy/engine.js'
import { CapabilityGraphEngine } from '../src/capability-graph/engine.js'
import { DiscoveryWorkspaceEngine } from '../src/discovery-workspace/engine.js'
import { OpportunityBriefGenerator } from '../src/opportunity-brief/engine.js'
import type { WorkspaceInput } from '../src/discovery-workspace/engine.js'

function makeGenerator(): OpportunityBriefGenerator {
  return new OpportunityBriefGenerator()
}

function makeWorkspace(): DiscoveryWorkspaceEngine {
  const vis = new VisibilityPolicyEngine()
  const graph = new CapabilityGraphEngine(vis)
  graph.registerInstitution({
    id: 'inst:vilo', name: 'Vilo Research', geography: 'Houston, TX',
    capabilities: [
      { claimId: 'claim:pbmc', name: 'PBMC Processing', status: 'healthy', evidenceCount: 3,
        researchAssets: ['PBMC'], gaps: [], readinessLabel: 'Presentation Ready', nextStep: '' },
    ],
  })
  return new DiscoveryWorkspaceEngine(graph)
}

function sampleInput(): WorkspaceInput {
  return {
    study_title: 'Phase I Oncology Trial', sponsor_type: 'Pharma', therapeutic_area: 'Oncology',
    study_type: 'Phase I', sample_needs: ['PBMC'], data_needs: ['Longitudinal'],
    research_assets_required: ['PBMC'], capabilities_required: ['PBMC Processing'],
    geography: 'Texas', population_requirements: 'Adult oncology', timeline: 'Q1 2027',
    estimated_budget_range: '$500K-$1M', operational_requirements: ['GCP-trained'],
    notes: 'Experienced Phase I sites.',
  }
}

// --------------------------------------------------------------------------

describe('OpportunityBrief — generation', () => {
  it('generates brief from workspace', () => {
    const wsEngine = makeWorkspace()
    const ws = wsEngine.create(sampleInput(), 'sponsor')
    const gen = makeGenerator()
    const brief = gen.generate(ws, ws.candidate_pool_ids[0], 'hidden')
    expect(brief.brief_id).toContain('brief:')
    expect(brief.anonymous_institution_id).toContain('anon:')
    expect(brief.status).toBe('ready')
  })
})

// --------------------------------------------------------------------------

describe('OpportunityBrief — sponsor hidden', () => {
  it('hides sponsor identity when mode is hidden', () => {
    const wsEngine = makeWorkspace()
    const ws = wsEngine.create(sampleInput(), 'sponsor')
    const gen = makeGenerator()
    const brief = gen.generate(ws, ws.candidate_pool_ids[0], 'hidden')
    expect(brief.sponsor_display_mode).toBe('hidden')
  })
})

// --------------------------------------------------------------------------

describe('OpportunityBrief — workload', () => {
  it('computes workload label deterministically', () => {
    const wsEngine = makeWorkspace()
    const ws = wsEngine.create(sampleInput(), 'sponsor')
    const gen = makeGenerator()
    const brief = gen.generate(ws, ws.candidate_pool_ids[0])
    expect(brief.estimated_workload).toContain('Moderate')
  })
})

// --------------------------------------------------------------------------

describe('OpportunityBrief — access requests', () => {
  it('creates visibility access requests for required capabilities and assets', () => {
    const wsEngine = makeWorkspace()
    const ws = wsEngine.create(sampleInput(), 'sponsor')
    const gen = makeGenerator()
    const brief = gen.generate(ws, ws.candidate_pool_ids[0])
    expect(brief.requested_visibility_access.length).toBeGreaterThan(0)
    expect(brief.requested_visibility_access[0].purpose).toContain('Phase I Oncology')
  })
})

// --------------------------------------------------------------------------

describe('OpportunityBrief — known gaps', () => {
  it('includes known gaps from workspace compatibility', () => {
    const wsEngine = makeWorkspace()
    const input = { ...sampleInput(), capabilities_required: [], research_assets_required: [] }
    const ws = wsEngine.create(input, 'sponsor')
    const gen = makeGenerator()
    const brief = gen.generate(ws, 'anon:test')
    expect(brief.known_gaps.length).toBeGreaterThan(0)
  })
})

// --------------------------------------------------------------------------

describe('OpportunityBrief — status transitions', () => {
  it('transitions through statuses', () => {
    const wsEngine = makeWorkspace()
    const ws = wsEngine.create(sampleInput(), 'sponsor')
    const gen = makeGenerator()
    const brief = gen.generate(ws, 'anon:test')
    gen.transition(brief, 'sent_to_site')
    expect(brief.status).toBe('sent_to_site')
    gen.transition(brief, 'viewed')
    expect(brief.status).toBe('viewed')
    gen.transition(brief, 'accepted')
    expect(brief.status).toBe('accepted')
  })
})

// --------------------------------------------------------------------------

describe('OpportunityBrief — no private evidence', () => {
  it('never contains institution names or private evidence', () => {
    const wsEngine = makeWorkspace()
    const ws = wsEngine.create(sampleInput(), 'sponsor')
    const gen = makeGenerator()
    const brief = gen.generate(ws, ws.candidate_pool_ids[0], 'hidden')
    const json = JSON.stringify(brief)
    expect(json).not.toContain('Vilo')
    expect(json).not.toContain('private_evidence')
  })
})

// --------------------------------------------------------------------------

describe('OpportunityBrief — no forbidden language', () => {
  it('never uses confidence, verified, certified', () => {
    const wsEngine = makeWorkspace()
    const ws = wsEngine.create(sampleInput(), 'sponsor')
    const gen = makeGenerator()
    const brief = gen.generate(ws, 'anon:test')
    const json = JSON.stringify(brief)
    expect(json).not.toContain('confidence')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
  })
})
