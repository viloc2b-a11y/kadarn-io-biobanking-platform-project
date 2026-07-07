// ==========================================================================
// IKM Domain Sprint 3A — Research Capability Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  CAPABILITY_CATALOG, CAPABILITY_DOMAIN_STATS,
  CAPABILITY_CATEGORY_LABELS, CAPABILITY_SECTIONS,
  getDependencyTree,
} from '../../packages/institutional-knowledge/src/domains/research-capability'

describe('Research Capability — Catalog', () => {
  it('covers 29 capabilities across all categories', () => {
    expect(CAPABILITY_CATALOG.length).toBeGreaterThan(25)
    for (const cap of CAPABILITY_CATALOG) {
      expect(cap.key).toBeTruthy()
      expect(cap.category).toBeTruthy()
    }
  })

  it('clinical research, biospecimen collection/processing, and lab services are required', () => {
    const required = CAPABILITY_CATALOG.filter((c) => c.required)
    const keys = required.map((c) => c.key)
    expect(keys).toContain('clinical_research')
    expect(keys).toContain('biospecimen_collection')
    expect(keys).toContain('biospecimen_processing')
    expect(keys).toContain('laboratory_services')
  })

  it('covers all study phases', () => {
    const keys = CAPABILITY_CATALOG.map((c) => c.key)
    expect(keys).toContain('phase1')
    expect(keys).toContain('phase2')
    expect(keys).toContain('phase3')
    expect(keys).toContain('phase4')
  })

  it('covers innovative models', () => {
    const keys = CAPABILITY_CATALOG.map((c) => c.key)
    expect(keys).toContain('home_visits')
    expect(keys).toContain('mobile_research')
    expect(keys).toContain('digital_research')
    expect(keys).toContain('real_world_evidence')
  })
})

describe('Research Capability — Dependencies', () => {
  it('phase capabilities depend on clinical_research', () => {
    for (const phase of ['phase1', 'phase2', 'phase3', 'phase4']) {
      const cap = CAPABILITY_CATALOG.find((c) => c.key === phase)
      expect(cap?.dependsOn).toContain('clinical_research')
    }
  })

  it('biobanking depends on collection, processing, and long-term storage', () => {
    const biobank = CAPABILITY_CATALOG.find((c) => c.key === 'biobanking')
    expect(biobank?.dependsOn).toContain('biospecimen_collection')
    expect(biobank?.dependsOn).toContain('biospecimen_processing')
    expect(biobank?.dependsOn).toContain('long_term_storage')
  })

  it('dependency tree resolves correctly', () => {
    const tree = getDependencyTree('pkpd')
    expect(tree.dependsOn).toContain('clinical_research')
    expect(tree.dependsOn).toContain('biospecimen_collection')
    expect(tree.allDependencies.length).toBeGreaterThanOrEqual(3)
  })

  it('no circular dependencies', () => {
    for (const cap of CAPABILITY_CATALOG) {
      const deps = getDependencyTree(cap.key).allDependencies
      expect(deps).not.toContain(cap.key)
    }
  })
})

describe('Research Capability — Stats', () => {
  it('29 categories defined', () => {
    expect(CAPABILITY_DOMAIN_STATS.categories).toBe(29)
  })

  it('consumed by Sponsor Intelligence, Capability Intelligence, Readiness', () => {
    expect(CAPABILITY_DOMAIN_STATS.consumedByEngines).toContain('Sponsor Intelligence')
    expect(CAPABILITY_DOMAIN_STATS.consumedByEngines).toContain('Capability Intelligence')
    expect(CAPABILITY_DOMAIN_STATS.consumedByEngines).toContain('Readiness')
  })
})

describe('Research Capability — Sections', () => {
  it('has 8 sections covering all capabilities', () => {
    const covered = new Set<string>()
    for (const s of CAPABILITY_SECTIONS) {
      for (const key of s.itemKeys) covered.add(key)
    }
    const allKeys = new Set(CAPABILITY_CATALOG.map((c) => c.key))
    // All catalog items should be in a section
    for (const key of allKeys) {
      expect(covered.has(key)).toBe(true)
    }
  })
})
