// ==========================================================================
// Sprint A5 — Knowledge Explorer Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  searchKnowledge, calculateKnowledgeCoverage,
  KNOWLEDGE_EXPLORER,
  type SearchIndex, type SearchEntry,
} from '../../packages/institutional-knowledge/src/knowledge-explorer'

// ==========================================================================
// Fixtures
// ==========================================================================

function makeSearchIndex(): SearchIndex {
  const entries: SearchEntry[] = [
    { itemId: 'p-1', itemType: 'people', label: 'Dr. Sarah Chen', description: 'Principal Investigator — Oncology', keywords: ['pi', 'oncologist', 'phase1'], tags: ['oncology', 'breast_cancer'], relatedItemIds: ['cap-1', 'lab-1'], relatedItemLabels: ['PBMC Processing', 'Core Lab'] },
    { itemId: 'cap-1', itemType: 'capabilities', label: 'PBMC Processing', description: 'Peripheral blood mononuclear cell isolation and cryopreservation', keywords: ['pbmc', 'processing', 'cryopreservation'], tags: ['lab', 'specialty'], relatedItemIds: ['lab-1', 'equip-1'], relatedItemLabels: ['Core Lab', 'Centrifuge'] },
    { itemId: 'lab-1', itemType: 'laboratories', label: 'Core Processing Lab', description: 'Main biospecimen processing and storage facility', keywords: ['lab', 'processing', 'storage'], tags: ['facility', 'bsl2'], relatedItemIds: ['equip-1', 'fac-1'], relatedItemLabels: ['Centrifuge', 'Building A'] },
    { itemId: 'doc-1', itemType: 'documents', label: 'CLIA Certificate', description: 'Clinical Laboratory Improvement Amendments certification', keywords: ['clia', 'certification', 'regulatory'], tags: ['compliance', 'lab'], relatedItemIds: ['lab-1'], relatedItemLabels: ['Core Lab'] },
    { itemId: 'equip-1', itemType: 'equipment', label: 'Refrigerated Centrifuge', description: 'Thermo Scientific Sorvall ST 40R', keywords: ['centrifuge', 'processing', 'thermo'], tags: ['equipment', 'processing'], relatedItemIds: ['lab-1'], relatedItemLabels: ['Core Lab'] },
    { itemId: 'prog-1', itemType: 'programs', label: 'Phase II Oncology Trial', description: 'Multi-center Phase II breast cancer trial', keywords: ['phase2', 'oncology', 'trial'], tags: ['oncology', 'phase2'], relatedItemIds: ['cap-1', 'p-1'], relatedItemLabels: ['PBMC Processing', 'Dr. Sarah Chen'] },
    { itemId: 'fac-1', itemType: 'facilities', label: 'Building A — Clinical Research Wing', description: 'Primary clinical research facility', keywords: ['building', 'clinical', 'research'], tags: ['facility'], relatedItemIds: ['lab-1'], relatedItemLabels: ['Core Lab'] },
  ]

  return {
    institutionId: 'org-test',
    indexedAt: new Date().toISOString(),
    totalEntries: entries.length,
    entries,
  }
}

// ==========================================================================
// PART 1 — Search
// ==========================================================================

describe('Knowledge Explorer — Search', () => {
  it('finds people by name', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'Sarah Chen' })

    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].itemId).toBe('p-1')
    expect(results[0].itemType).toBe('people')
  })

  it('finds capabilities by keyword', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'PBMC' })

    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((r) => r.itemType === 'capabilities')).toBe(true)
  })

  it('finds documents by type', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'CLIA' })

    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].itemType).toBe('documents')
  })

  it('cross-domain search matches related items', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'Core Lab' })

    // Should match lab directly and items related to it
    expect(results.length).toBeGreaterThanOrEqual(2)
  })

  it('filters by domain', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'processing', domainFilter: ['equipment'] })

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.itemType === 'equipment')).toBe(true)
  })

  it('respects max results', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'lab', maxResults: 2 })

    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('returns empty for no match', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'xyz_nonexistent_term' })

    expect(results).toHaveLength(0)
  })

  it('empty query returns empty', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: '' })
    expect(results).toHaveLength(0)
  })

  it('results are scored by relevance', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'processing' })

    if (results.length > 1) {
      expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1].relevanceScore)
    }
  })

  it('generates highlights for matched tokens', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'oncology' })

    for (const r of results) {
      expect(r.highlights.length).toBeGreaterThan(0)
    }
  })
})

// ==========================================================================
// PART 2 — Knowledge Coverage
// ==========================================================================

describe('Knowledge Explorer — Coverage', () => {
  it('calculates coverage across all domains', () => {
    const coverage = calculateKnowledgeCoverage({
      institutionId: 'org-test',
      peopleCount: 8,
      capabilitiesCount: 25,
      programsCount: 5,
      documentsCount: 12,
      equipmentCount: 6,
      facilitiesCount: 2,
      laboratoriesCount: 3,
      relationshipsCount: 15,
    })

    expect(coverage.domains).toHaveLength(8)
    expect(coverage.overallCoverage).toBeGreaterThan(0)
    expect(coverage.domains.some((d) => d.percentage >= 50)).toBe(true)
  })

  it('identifies weakest areas', () => {
    const coverage = calculateKnowledgeCoverage({
      institutionId: 'org-test',
      peopleCount: 2, capabilitiesCount: 5, programsCount: 1,
      documentsCount: 3, equipmentCount: 1, facilitiesCount: 1,
      laboratoriesCount: 1, relationshipsCount: 2,
    })

    expect(coverage.weakestAreas.length).toBeGreaterThan(0)
    expect(coverage.recommendations.length).toBeGreaterThan(0)
  })

  it('complete coverage when all domains filled', () => {
    const coverage = calculateKnowledgeCoverage({
      institutionId: 'org-test',
      peopleCount: 20, capabilitiesCount: 60, programsCount: 25,
      documentsCount: 50, equipmentCount: 15, facilitiesCount: 5,
      laboratoriesCount: 10, relationshipsCount: 30,
    })

    expect(coverage.overallCoverage).toBeGreaterThan(80)
    expect(coverage.weakestAreas).toHaveLength(0)
  })

  it('empty institution has minimal coverage', () => {
    const coverage = calculateKnowledgeCoverage({
      institutionId: 'org-test',
      peopleCount: 0, capabilitiesCount: 0, programsCount: 0,
      documentsCount: 0, equipmentCount: 0, facilitiesCount: 0,
      laboratoriesCount: 0, relationshipsCount: 0,
    })

    expect(coverage.overallCoverage).toBe(0)
    for (const d of coverage.domains) {
      expect(d.status).toBe('empty')
    }
  })
})

// ==========================================================================
// PART 3 — Boundary
// ==========================================================================

describe('Knowledge Explorer — Boundary', () => {
  it('no AI — deterministic search', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'oncology' })
    // Always same output for same input
    const results2 = searchKnowledge({ index, query: 'oncology' })
    expect(results).toEqual(results2)
  })

  it('no Sponsor Matching', () => {
    const exported = Object.keys(KNOWLEDGE_EXPLORER)
    expect(exported).not.toContain('matchSponsors')
  })

  it('no Readiness calls', () => {
    const exported = Object.keys(KNOWLEDGE_EXPLORER)
    expect(exported).not.toContain('calculateReadiness')
  })

  it('search is explainable via matched tokens', () => {
    const index = makeSearchIndex()
    const results = searchKnowledge({ index, query: 'oncology breast' })
    for (const r of results) {
      expect(r.matchedOn.length).toBeGreaterThan(0)
    }
  })
})
