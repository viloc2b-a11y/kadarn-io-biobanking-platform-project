// ==========================================================================
// IKM Domain Sprint 3B — Research Experience Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  EXPERIENCE_DOMAIN_CATALOG, EXPERIENCE_DOCUMENTS, EXPERIENCE_DOMAIN_STATS,
  EXPERIENCE_SECTIONS, EXPERIENCE_TYPES,
} from '../../packages/institutional-knowledge/src/domains/research-experience'

describe('Research Experience — Catalog', () => {
  it('covers 12 experience types + metadata fields', () => {
    expect(EXPERIENCE_DOMAIN_CATALOG.length).toBeGreaterThan(30)
    for (const item of EXPERIENCE_DOMAIN_CATALOG) {
      expect(item.key).toBeTruthy()
      expect(item.category).toBeTruthy()
    }
  })

  it('includes clinical trials, observational, registry, IVD, biobanking, academic', () => {
    const keys = EXPERIENCE_TYPES.map((t) => t.key)
    expect(keys).toContain('clinical_trial')
    expect(keys).toContain('observational_study')
    expect(keys).toContain('registry_study')
    expect(keys).toContain('ivd_program')
    expect(keys).toContain('biobanking_project')
    expect(keys).toContain('academic_research')
    expect(keys).toContain('expanded_access')
  })

  it('captures performance data: enrollment, screen fail, retention', () => {
    const keys = EXPERIENCE_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('enrollment_target')
    expect(keys).toContain('enrollment_actual')
    expect(keys).toContain('screen_fail_rate')
    expect(keys).toContain('retention_rate')
  })

  it('captures outcomes and learning', () => {
    const keys = EXPERIENCE_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('key_outcomes')
    expect(keys).toContain('lessons_learned')
    expect(keys).toContain('publications')
  })

  it('consumed by Sponsor Intelligence, Capability Intelligence, Program Matching', () => {
    const allEngines = new Set(EXPERIENCE_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))
    expect(allEngines.has('Sponsor Intelligence')).toBe(true)
    expect(allEngines.has('Capability Intelligence')).toBe(true)
    expect(allEngines.has('Program Matching')).toBe(true)
  })
})

describe('Research Experience — Documents', () => {
  it('closeout letter, study summary, publication are supported', () => {
    const keys = EXPERIENCE_DOCUMENTS.map((d) => d.key)
    expect(keys).toContain('closeout_letter')
    expect(keys).toContain('study_summary')
    expect(keys).toContain('publication_doc')
  })

  it('closeout letter is Class A evidence', () => {
    const doc = EXPERIENCE_DOCUMENTS.find((d) => d.key === 'closeout_letter')
    expect(doc?.evidenceClass).toBe('A')
  })

  it('docs map to valid item keys', () => {
    const itemKeys = new Set(EXPERIENCE_DOMAIN_CATALOG.map((i) => i.key))
    for (const doc of EXPERIENCE_DOCUMENTS) {
      for (const key of doc.supportsKnowledgeItems) {
        expect(itemKeys.has(key)).toBe(true)
      }
    }
  })
})

describe('Research Experience — Stats', () => {
  it('stats match catalog', () => {
    expect(EXPERIENCE_DOMAIN_STATS.totalItems).toBe(EXPERIENCE_DOMAIN_CATALOG.length)
    expect(EXPERIENCE_DOMAIN_STATS.experienceTypes).toBe(12)
  })
})

describe('Research Experience — Sections', () => {
  it('has 7 sections covering all items', () => {
    const keys = new Set<string>()
    let total = 0
    for (const s of EXPERIENCE_SECTIONS) {
      for (const i of s.items) { keys.add(i.key); total++ }
    }
    expect(total).toBe(EXPERIENCE_DOMAIN_CATALOG.length)
    expect(keys.size).toBe(EXPERIENCE_DOMAIN_CATALOG.length)
  })
})
