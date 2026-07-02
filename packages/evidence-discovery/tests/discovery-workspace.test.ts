// ==========================================================================
// Discovery Workspace — Tests (Sprint 24C)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { VisibilityPolicyEngine } from '../src/visibility-policy/engine.js'
import { CapabilityGraphEngine } from '../src/capability-graph/engine.js'
import { DiscoveryWorkspaceEngine } from '../src/discovery-workspace/engine.js'
import type { WorkspaceInput } from '../src/discovery-workspace/engine.js'

function makeWorkspace(): DiscoveryWorkspaceEngine {
  const vis = new VisibilityPolicyEngine()
  const graph = new CapabilityGraphEngine(vis)
  graph.registerInstitution({
    id: 'inst:vilo', name: 'Vilo Research Center', geography: 'Houston, TX',
    capabilities: [
      { claimId: 'claim:plasma', name: 'Plasma Collection', status: 'healthy', evidenceCount: 3,
        researchAssets: ['Plasma'], gaps: [], readinessLabel: 'Presentation Ready', nextStep: '' },
      { claimId: 'claim:pbmc', name: 'PBMC Processing', status: 'healthy', evidenceCount: 2,
        researchAssets: ['PBMC'], gaps: [], readinessLabel: 'Presentation Ready', nextStep: '' },
    ],
  })
  return new DiscoveryWorkspaceEngine(graph)
}

function sampleInput(): WorkspaceInput {
  return {
    study_title: 'Phase I Oncology Trial',
    sponsor_type: 'Pharma',
    therapeutic_area: 'Oncology',
    study_type: 'Phase I',
    sample_needs: ['PBMC'],
    data_needs: ['Longitudinal'],
    research_assets_required: ['PBMC'],
    capabilities_required: ['PBMC Processing'],
    geography: 'Texas',
    population_requirements: 'Adult oncology patients',
    timeline: 'Q1 2027',
    estimated_budget_range: '$500K-$1M',
    operational_requirements: ['GCP-trained staff'],
    notes: 'Looking for experienced Phase I sites.',
  }
}

// --------------------------------------------------------------------------

describe('DiscoveryWorkspace — create', () => {
  it('creates a workspace from research requirements', () => {
    const engine = makeWorkspace()
    const ws = engine.create(sampleInput(), 'sponsor')
    expect(ws.id).toContain('ws:')
    expect(ws.status).toBe('ready_for_review')
    expect(ws.compatibility).not.toBeNull()
  })
})

// --------------------------------------------------------------------------

describe('DiscoveryWorkspace — candidates', () => {
  it('finds anonymous candidates via Capability Graph', () => {
    const engine = makeWorkspace()
    const ws = engine.create(sampleInput(), 'sponsor')
    expect(ws.candidate_pool_ids.length).toBeGreaterThan(0)
    expect(ws.candidate_pool_ids[0]).toContain('anon:')
  })

  it('no candidates when no matches', () => {
    const engine = makeWorkspace()
    // Change to sponsor so visibility allows summary
    const ws = engine.create({ ...sampleInput(), capabilities_required: ['MRI Imaging'], geography: 'Alaska' }, 'sponsor')
    expect(ws.candidate_pool_ids).toHaveLength(0)
    expect(ws.status).toBe('draft')
  })
})

// --------------------------------------------------------------------------

describe('DiscoveryWorkspace — identity masking', () => {
  it('preserves identity masking — no institution names in output', () => {
    const engine = makeWorkspace()
    const ws = engine.create(sampleInput(), 'sponsor')
    const json = JSON.stringify(ws)
    expect(json).not.toContain('Vilo')
    expect(json).not.toContain('Research Center')
  })
})

// --------------------------------------------------------------------------

describe('DiscoveryWorkspace — compatibility summary', () => {
  it('generates compatibility summary with gaps', () => {
    const engine = makeWorkspace()
    const ws = engine.create(sampleInput(), 'sponsor')
    expect(ws.compatibility!.total_candidates).toBeGreaterThan(0)
    expect(ws.compatibility!.required_capabilities).toContain('PBMC Processing')
  })
})

// --------------------------------------------------------------------------

describe('DiscoveryWorkspace — status transitions', () => {
  it('transitions from draft to archived', () => {
    const engine = makeWorkspace()
    const ws = engine.create(sampleInput(), 'sponsor')
    const archived = engine.transition(ws.id, 'archived')
    expect(archived.status).toBe('archived')
  })

  it('throws on unknown workspace', () => {
    const engine = makeWorkspace()
    expect(() => engine.transition('ws:nonexistent', 'archived')).toThrow()
  })
})

// --------------------------------------------------------------------------

describe('DiscoveryWorkspace — public suppression', () => {
  it('public actor gets no candidates due to visibility', () => {
    const engine = makeWorkspace()
    const ws = engine.create(sampleInput(), 'public')
    expect(ws.candidate_pool_ids).toHaveLength(0)
  })
})

// --------------------------------------------------------------------------

describe('DiscoveryWorkspace — no forbidden language', () => {
  it('never uses confidence, verified, certified', () => {
    const engine = makeWorkspace()
    const ws = engine.create(sampleInput(), 'sponsor')
    const json = JSON.stringify(ws)
    expect(json).not.toContain('confidence')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('Vilo')
  })
})
