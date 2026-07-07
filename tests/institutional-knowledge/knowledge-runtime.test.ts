// ==========================================================================
// IKM/EVM Sprint 3 — Knowledge Pipeline Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  declareKnowledgeItem,
  createRelationship,
  generateEvidenceCandidates,
  getCandidatesByItem,
  getReadyCandidates,
  uploadDocument,
  buildKnowledgeGraph,
  findDuplicates,
  generateHealthReport,
  buildKnowledgeDashboard,
  buildExplorerState,
} from '../../packages/institutional-knowledge/src/index'

const ORG = 'org-sprint-3'

// ==========================================================================
// Test 1: KnowledgeItem creation
// ==========================================================================

describe('KnowledgeItem creation', () => {
  it('creates items of different types', () => {
    const equipment = declareKnowledgeItem({ organizationId: ORG, statement: '-80 Freezer', itemType: 'equipment' })
    const person = declareKnowledgeItem({ organizationId: ORG, statement: 'Dr. Smith', itemType: 'person' })
    const facility = declareKnowledgeItem({ organizationId: ORG, statement: 'BSL-2 Lab', itemType: 'facility' })
    const process = declareKnowledgeItem({ organizationId: ORG, statement: 'PBMC Isolation', itemType: 'process' })

    expect(equipment.itemType).toBe('equipment')
    expect(person.itemType).toBe('person')
    expect(facility.itemType).toBe('facility')
    expect(process.itemType).toBe('process')
    expect(equipment.status).toBe('draft')
  })
})

// ==========================================================================
// Test 2: Relationship creation
// ==========================================================================

describe('Relationship creation', () => {
  it('links equipment to person via operated_by', () => {
    const freezer = declareKnowledgeItem({ organizationId: ORG, statement: 'Freezer A', itemType: 'equipment' })
    const tech = declareKnowledgeItem({ organizationId: ORG, statement: 'Lab Tech', itemType: 'person' })

    const rel = createRelationship({
      sourceId: freezer.id,
      targetId: tech.id,
      relationshipType: 'operated_by',
    })

    expect(rel).toBeTruthy()
    expect(rel!.relationshipType).toBe('operated_by')
    expect(freezer.relationships).toHaveLength(1)
    expect(tech.relationships).toHaveLength(1)
    expect(freezer.status).toBe('active')
    expect(tech.status).toBe('active')
  })

  it('links equipment to facility via located_in', () => {
    const centrifuge = declareKnowledgeItem({ organizationId: ORG, statement: 'Centrifuge', itemType: 'equipment' })
    const lab = declareKnowledgeItem({ organizationId: ORG, statement: 'Main Lab', itemType: 'facility' })

    const rel = createRelationship({
      sourceId: centrifuge.id,
      targetId: lab.id,
      relationshipType: 'located_in',
    })

    expect(rel).toBeTruthy()
    expect(centrifuge.relationships).toHaveLength(1)
  })

  it('returns null for invalid relationship', () => {
    const result = createRelationship({
      sourceId: 'nonexistent',
      targetId: 'also_nonexistent',
      relationshipType: 'related_to',
    })
    expect(result).toBeNull()
  })
})

// ==========================================================================
// Test 3: Evidence Candidate generation
// ==========================================================================

describe('Evidence Candidate generation', () => {
  it('creates needs_document candidate for items without documents', () => {
    const item = declareKnowledgeItem({ organizationId: ORG, statement: 'Undocumented equipment', itemType: 'equipment' })
    const candidates = generateEvidenceCandidates(item.id)
    expect(candidates.length).toBe(1)
    expect(candidates[0].validationStatus).toBe('needs_document')
    expect(candidates[0].source).toBe('self_report')
  })

  it('creates document candidates for items with documents', () => {
    const item = declareKnowledgeItem({ organizationId: ORG, statement: 'CLIA Lab', itemType: 'facility' })

    uploadDocument({
      organizationId: ORG,
      documentType: 'certification',
      name: 'CLIA Certificate',
      relatedEntityId: item.id,
      relatedEntityType: 'facility',
      expires: false,
    })

    const candidates = generateEvidenceCandidates(item.id)
    expect(candidates.length).toBeGreaterThan(0)
    const docCandidates = candidates.filter((c) => c.source === 'document')
    expect(docCandidates.length).toBeGreaterThan(0)
  })

  it('multiple documents generate multiple candidates', () => {
    const item = declareKnowledgeItem({ organizationId: ORG, statement: 'Multi-doc process', itemType: 'process' })

    uploadDocument({ organizationId: ORG, documentType: 'sop', name: 'SOP v1', relatedEntityId: item.id, relatedEntityType: 'process', expires: false })
    uploadDocument({ organizationId: ORG, documentType: 'record', name: 'Training Log', relatedEntityId: item.id, relatedEntityType: 'process', expires: false })

    const candidates = generateEvidenceCandidates(item.id)
    // Each document + potentially operational → at least 2
    expect(candidates.length).toBeGreaterThanOrEqual(2)
  })

  it('item without documents still generates a candidate', () => {
    const item = declareKnowledgeItem({ organizationId: ORG, statement: 'No docs', itemType: 'equipment' })
    const candidates = generateEvidenceCandidates(item.id)
    expect(candidates.length).toBeGreaterThanOrEqual(1)
  })
})

// ==========================================================================
// Test 4: Relationship integrity
// ==========================================================================

describe('Relationship integrity', () => {
  it('relationship is visible from both sides', () => {
    const eq = declareKnowledgeItem({ organizationId: ORG, statement: 'Scope', itemType: 'equipment' })
    const person = declareKnowledgeItem({ organizationId: ORG, statement: 'Microscopist', itemType: 'person' })

    createRelationship({ sourceId: eq.id, targetId: person.id, relationshipType: 'operated_by' })

    expect(eq.relationships.some((r) => r.targetId === person.id)).toBe(true)
    expect(person.relationships.some((r) => r.sourceId === eq.id)).toBe(true)
  })
})

// ==========================================================================
// Test 5: Knowledge Graph
// ==========================================================================

describe('Knowledge Graph', () => {
  it('identifies isolates (no docs, no rels)', () => {
    declareKnowledgeItem({ organizationId: ORG, statement: 'Isolated item', itemType: 'equipment' })
    const graph = buildKnowledgeGraph(ORG)
    expect(graph.isolates.length).toBeGreaterThan(0)
  })

  it('identifies hub items with many connections', () => {
    const hub = declareKnowledgeItem({ organizationId: ORG, statement: 'Central Lab', itemType: 'facility' })
    for (let i = 0; i < 3; i++) {
      const eq = declareKnowledgeItem({ organizationId: ORG, statement: `Equipment ${i}`, itemType: 'equipment' })
      createRelationship({ sourceId: eq.id, targetId: hub.id, relationshipType: 'located_in' })
    }
    const graph = buildKnowledgeGraph(ORG)
    expect(graph.hubItems.some((h) => h.id === hub.id)).toBe(true)
  })
})

// ==========================================================================
// Test 6: Duplicate detection
// ==========================================================================

describe('Duplicate detection', () => {
  it('finds duplicate knowledge items', () => {
    declareKnowledgeItem({ organizationId: ORG, statement: 'CLIA Certified', itemType: 'certification' })
    declareKnowledgeItem({ organizationId: ORG, statement: 'CLIA Certified', itemType: 'certification' })

    const duplicates = findDuplicates(ORG)
    expect(duplicates.length).toBe(1)
    expect(duplicates[0].length).toBe(2)
  })
})

// ==========================================================================
// Test 7: Health Report (extended)
// ==========================================================================

describe('Knowledge Health Report', () => {
  it('detects undocumented items', () => {
    declareKnowledgeItem({ organizationId: ORG, statement: 'Undocumented', itemType: 'equipment' })
    const health = generateHealthReport(ORG)
    expect(health.undocumentedItems.length).toBeGreaterThan(0)
  })

  it('detects self-reported only', () => {
    declareKnowledgeItem({ organizationId: ORG, statement: 'Self reported only', itemType: 'process' })
    const health = generateHealthReport(ORG)
    expect(health.selfReportedOnly.length).toBeGreaterThan(0)
  })

  it('detects missing relationships', () => {
    declareKnowledgeItem({ organizationId: ORG, statement: 'No rels item', itemType: 'equipment' })
    const health = generateHealthReport(ORG)
    // Items without relationships should generate suggestions
    expect(health.missingRelationships).toBeDefined()
  })
})

// ==========================================================================
// Test 8: Explorer state
// ==========================================================================

describe('Explorer state', () => {
  it('builds explorer state for a specific item', () => {
    const item = declareKnowledgeItem({ organizationId: ORG, statement: 'Explorer item', itemType: 'equipment' })
    uploadDocument({ organizationId: ORG, documentType: 'record', name: 'Log', relatedEntityId: item.id, relatedEntityType: 'equipment', expires: false })
    generateEvidenceCandidates(item.id)

    const state = buildExplorerState(ORG, item.id)
    expect(state.selectedItem).toBeTruthy()
    expect(state.attachedDocuments.length).toBeGreaterThan(0)
    expect(state.evidenceCandidates.length).toBeGreaterThan(0)
    expect(state.graphStats.totalItems).toBeGreaterThan(0)
  })

  it('builds explorer state without selected item', () => {
    const state = buildExplorerState(ORG)
    expect(state.view).toBe('health')
    expect(state.graphStats).toBeDefined()
  })
})

// ==========================================================================
// Test 9: Boundary validation
// ==========================================================================

describe('Boundary validation', () => {
  it('all functions operate without Evidence Core dependency', () => {
    const item = declareKnowledgeItem({ organizationId: ORG, statement: 'boundary test', itemType: 'equipment' })
    expect(item).toBeTruthy()

    const rel = createRelationship({
      sourceId: item.id,
      targetId: item.id, // self-rel for test
      relationshipType: 'related_to',
    })
    // Self-relationship may or may not work depending on implementation
    // But the function shouldn't throw

    const candidates = generateEvidenceCandidates(item.id)
    expect(candidates).toBeDefined()

    const graph = buildKnowledgeGraph(ORG)
    expect(graph).toBeDefined()

    const health = generateHealthReport(ORG)
    expect(health).toBeDefined()
  })
})
