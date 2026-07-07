// ==========================================================================
// Sprint A4 — Institutional Relationship Graph Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  buildRelationshipGraph,
  findPaths, getNeighborhood, explainRelevance, impactAnalysis,
  calculateGraphHealth, RELATIONSHIP_GRAPH,
  type GraphNode, type GraphEdge, type RelationshipGraph,
} from '../../packages/institutional-knowledge/src/relationship-graph'

// ==========================================================================
// Fixtures
// ==========================================================================

function makeNodes(): GraphNode[] {
  return [
    { nodeId: 'org-1', nodeType: 'organization', label: 'Test Medical Center', properties: {} },
    { nodeId: 'pi-1', nodeType: 'person', label: 'Dr. Sarah Chen', properties: { role: 'pi' } },
    { nodeId: 'cap-1', nodeType: 'capability', label: 'PBMC Processing', properties: {} },
    { nodeId: 'lab-1', nodeType: 'laboratory', label: 'Core Lab', properties: {} },
    { nodeId: 'equip-1', nodeType: 'equipment', label: '-80 Freezer A', properties: {} },
    { nodeId: 'fac-1', nodeType: 'facility', label: 'Building A', properties: {} },
    { nodeId: 'doc-1', nodeType: 'document', label: 'CLIA Certificate', properties: {} },
    { nodeId: 'prog-1', nodeType: 'program', label: 'Phase II Oncology', properties: {} },
    { nodeId: 'net-1', nodeType: 'network', label: 'Regional Research Network', properties: {} },
    { nodeId: 'sponsor-1', nodeType: 'sponsor', label: 'Pfizer', properties: {} },
    { nodeId: 'isolated-1', nodeType: 'person', label: 'Isolated Node', properties: {} },
  ]
}

function makeEdges(): GraphEdge[] {
  return [
    { edgeId: 'e1', sourceNodeId: 'pi-1', targetNodeId: 'org-1', relationshipType: 'employs', direction: 'directed', strength: 'strong', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'system', metadata: {} },
    { edgeId: 'e2', sourceNodeId: 'pi-1', targetNodeId: 'cap-1', relationshipType: 'pi_to_capability', direction: 'directed', strength: 'strong', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'user', metadata: {} },
    { edgeId: 'e3', sourceNodeId: 'cap-1', targetNodeId: 'lab-1', relationshipType: 'depends_on', direction: 'directed', strength: 'strong', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'system', metadata: {} },
    { edgeId: 'e4', sourceNodeId: 'lab-1', targetNodeId: 'equip-1', relationshipType: 'lab_to_equipment', direction: 'directed', strength: 'moderate', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'system', metadata: {} },
    { edgeId: 'e5', sourceNodeId: 'equip-1', targetNodeId: 'fac-1', relationshipType: 'equipment_to_facility', direction: 'directed', strength: 'moderate', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'system', metadata: {} },
    { edgeId: 'e6', sourceNodeId: 'lab-1', targetNodeId: 'fac-1', relationshipType: 'located_in', direction: 'directed', strength: 'moderate', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'system', metadata: {} },
    { edgeId: 'e7', sourceNodeId: 'doc-1', targetNodeId: 'lab-1', relationshipType: 'certified_by', direction: 'directed', strength: 'strong', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'import', metadata: {} },
    { edgeId: 'e8', sourceNodeId: 'org-1', targetNodeId: 'prog-1', relationshipType: 'facility_to_program', direction: 'directed', strength: 'moderate', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'user', metadata: {} },
    { edgeId: 'e9', sourceNodeId: 'org-1', targetNodeId: 'net-1', relationshipType: 'site_to_network', direction: 'bidirectional', strength: 'moderate', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'user', metadata: {} },
    { edgeId: 'e10', sourceNodeId: 'net-1', targetNodeId: 'sponsor-1', relationshipType: 'network_to_sponsor', direction: 'bidirectional', strength: 'moderate', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'user', metadata: {} },
    // Duplicate edge for testing
    { edgeId: 'e11', sourceNodeId: 'pi-1', targetNodeId: 'cap-1', relationshipType: 'pi_to_capability', direction: 'directed', strength: 'strong', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'user', metadata: {} },
  ]
}

function makeGraph(): RelationshipGraph {
  return buildRelationshipGraph({
    institutionId: 'org-test',
    nodes: makeNodes(),
    edges: makeEdges(),
  })
}

// ==========================================================================
// PART 1 — Graph Building
// ==========================================================================

describe('Relationship Graph — Building', () => {
  it('builds graph from nodes and edges', () => {
    const graph = makeGraph()
    expect(graph.nodes).toHaveLength(11)
    expect(graph.edges).toHaveLength(11)
    expect(graph.stats.totalNodes).toBe(11)
    expect(graph.stats.totalEdges).toBe(11)
  })

  it('computes node type distribution', () => {
    const graph = makeGraph()
    expect(graph.stats.nodeTypes.person).toBeGreaterThanOrEqual(2)
    expect(graph.stats.nodeTypes.capability).toBe(1)
  })

  it('detects orphans', () => {
    const graph = makeGraph()
    expect(graph.stats.orphans).toBeGreaterThanOrEqual(1) // isolated-1
  })

  it('computes graph density', () => {
    const graph = makeGraph()
    expect(graph.stats.density).toBeGreaterThan(0)
  })
})

// ==========================================================================
// PART 2 — Path Finding
// ==========================================================================

describe('Relationship Graph — Path Finding', () => {
  it('finds path between PI and equipment', () => {
    const graph = makeGraph()
    const paths = findPaths(graph, 'pi-1', 'equip-1', 5)

    expect(paths.length).toBeGreaterThan(0)
    const firstPath = paths[0]
    expect(firstPath.nodes[0]).toBe('pi-1')
    expect(firstPath.nodes[firstPath.nodes.length - 1]).toBe('equip-1')
    expect(firstPath.explainability).toBeTruthy()
  })

  it('finds path between PI and sponsor through network', () => {
    const graph = makeGraph()
    const paths = findPaths(graph, 'pi-1', 'sponsor-1', 6)

    expect(paths.length).toBeGreaterThan(0)
    // Path likely: pi-1 → org-1 → net-1 → sponsor-1
  })

  it('respects max depth', () => {
    const graph = makeGraph()
    const shallow = findPaths(graph, 'pi-1', 'sponsor-1', 2)
    const deep = findPaths(graph, 'pi-1', 'sponsor-1', 6)

    expect(deep.length).toBeGreaterThanOrEqual(shallow.length)
  })

  it('returns empty when no path within depth', () => {
    const graph = makeGraph()
    const paths = findPaths(graph, 'pi-1', 'sponsor-1', 1)
    expect(paths).toHaveLength(0) // needs at least 2 hops
  })

  it('paths are sorted by weight (fewer hops = better)', () => {
    const graph = makeGraph()
    const paths = findPaths(graph, 'pi-1', 'equip-1', 5)
    if (paths.length > 1) {
      expect(paths[0].depth).toBeLessThanOrEqual(paths[1].depth)
    }
  })
})

// ==========================================================================
// PART 3 — Neighborhood & Explainability
// ==========================================================================

describe('Relationship Graph — Neighborhood', () => {
  it('gets 1-hop neighborhood', () => {
    const graph = makeGraph()
    const subgraph = getNeighborhood(graph, 'pi-1', 1)

    expect(subgraph.centerNodeId).toBe('pi-1')
    expect(subgraph.nodes.length).toBeGreaterThan(1) // pi-1 + neighbors
    expect(subgraph.edges.length).toBeGreaterThan(0)
  })

  it('explains relevance between two nodes', () => {
    const graph = makeGraph()
    const chains = explainRelevance(graph, 'pi-1', 'equip-1')

    expect(chains.length).toBeGreaterThan(0)
    expect(chains[0].relevanceScore).toBeGreaterThan(0)
    expect(chains[0].reason).toBeTruthy()
  })
})

// ==========================================================================
// PART 4 — Impact Analysis
// ==========================================================================

describe('Relationship Graph — Impact Analysis', () => {
  it('analyzes impact of removing a central node', () => {
    const graph = makeGraph()
    const impact = impactAnalysis(graph, 'lab-1') // Connected to cap-1, equip-1, fac-1, doc-1

    expect(impact.directlyAffected.length).toBeGreaterThanOrEqual(2)
    expect(impact.severity).toBeTruthy()
    expect(impact.summary).toContain('directly affect')
  })

  it('isolated node has minimal impact', () => {
    const graph = makeGraph()
    const impact = impactAnalysis(graph, 'isolated-1')

    expect(impact.directlyAffected).toHaveLength(0)
    expect(impact.severity).toBe('low')
  })
})

// ==========================================================================
// PART 5 — Graph Health
// ==========================================================================

describe('Relationship Graph — Health', () => {
  it('calculates health scores', () => {
    const graph = makeGraph()
    const health = calculateGraphHealth(graph)

    expect(health.scores.connectivity).toBeGreaterThan(0)
    expect(health.scores.overall).toBeGreaterThan(0)
  })

  it('detects orphan nodes', () => {
    const graph = makeGraph()
    const health = calculateGraphHealth(graph)

    expect(health.orphans.length).toBeGreaterThanOrEqual(1)
    expect(health.orphans.some((n) => n.nodeId === 'isolated-1')).toBe(true)
  })

  it('detects duplicate edges', () => {
    const graph = makeGraph()
    const health = calculateGraphHealth(graph)

    expect(health.duplicateEdges.length).toBeGreaterThan(0)
    expect(health.scores.consistency).toBeLessThan(100)
  })

  it('provides recommendations', () => {
    const graph = makeGraph()
    const health = calculateGraphHealth(graph)

    expect(health.recommendations.length).toBeGreaterThan(0)
  })
})

// ==========================================================================
// PART 6 — Boundary
// ==========================================================================

describe('Relationship Graph — Boundary', () => {
  it('no scoring/reasoning — pure graph', () => {
    const graph = makeGraph()
    const paths = findPaths(graph, 'pi-1', 'equip-1', 5)
    expect(paths.length).toBeGreaterThan(0)
  })

  it('no Sponsor Matching', () => {
    const exported = Object.keys(RELATIONSHIP_GRAPH)
    expect(exported).not.toContain('matchSponsors')
  })

  it('uses canonical taxonomy relationship types', () => {
    const graph = makeGraph()
    const types = new Set(graph.edges.map((e) => e.relationshipType))
    expect(types.has('pi_to_capability')).toBe(true)
    expect(types.has('employs')).toBe(true)
  })
})
