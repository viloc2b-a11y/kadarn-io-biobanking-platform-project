// ==========================================================================
// IKM Domain Sprint 6 — Biospecimen Operations Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  BIOSPECIMEN_DOMAIN_CATALOG, BIOSPECIMEN_DOCUMENTS, BIOSPECIMEN_DOMAIN_STATS,
  BIOSPECIMEN_SECTIONS, BIOSPECIMEN_OPERATIONS,
} from '../../packages/institutional-knowledge/src/domains/biospecimen'

describe('Biospecimen Domain — Catalog', () => {
  it('is exhaustive — 50+ items covering full specimen lifecycle', () => {
    expect(BIOSPECIMEN_DOMAIN_CATALOG.length).toBeGreaterThan(50)
    for (const item of BIOSPECIMEN_DOMAIN_CATALOG) {
      expect(item.key).toBeTruthy()
      expect(item.itemType).toBeTruthy()
    }
  })

  it('core specimen types: whole blood, plasma, PBMC', () => {
    const keys = BIOSPECIMEN_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('whole_blood')
    expect(keys).toContain('plasma')
    expect(keys).toContain('pbmc')
    expect(keys).toContain('serum')
  })

  it('specialty types: CSF, bone marrow, tissue, FFPE', () => {
    const keys = BIOSPECIMEN_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('csf')
    expect(keys).toContain('bone_marrow')
    expect(keys).toContain('tissue_fresh')
    expect(keys).toContain('ffpe')
  })

  it('required operations: processing_time, aliquoting, labeling, chain_of_custody, storage_80, temp_monitoring', () => {
    const required = BIOSPECIMEN_DOMAIN_CATALOG.filter((i) => i.required)
    const keys = required.map((i) => i.key)
    expect(keys).toContain('processing_time')
    expect(keys).toContain('aliquoting')
    expect(keys).toContain('chain_of_custody')
    expect(keys).toContain('storage_80')
    expect(keys).toContain('temp_monitoring')
  })

  it('consumed by Sponsor Intelligence, Capability Intelligence, Readiness', () => {
    const sponsor = BIOSPECIMEN_DOMAIN_CATALOG.filter((i) => i.consumedBy.includes('Sponsor Intelligence'))
    expect(sponsor.length).toBeGreaterThan(20)
    const readiness = BIOSPECIMEN_DOMAIN_CATALOG.filter((i) => i.consumedBy.includes('Readiness'))
    expect(readiness.length).toBeGreaterThan(10)
  })
})

describe('Biospecimen Domain — Documents', () => {
  it('collection, processing, storage, chain of custody SOPs are required', () => {
    const required = BIOSPECIMEN_DOCUMENTS.filter((d) => d.required)
    const keys = required.map((d) => d.key)
    expect(keys).toContain('collection_sop')
    expect(keys).toContain('processing_sop')
    expect(keys).toContain('storage_sop')
    expect(keys).toContain('chain_custody_sop')
  })

  it('IATA cert and packaging validation expire', () => {
    const expiring = BIOSPECIMEN_DOCUMENTS.filter((d) => d.expires)
    expect(expiring.length).toBeGreaterThan(3)
  })

  it('docs map to valid item keys', () => {
    const itemKeys = new Set(BIOSPECIMEN_DOMAIN_CATALOG.map((i) => i.key))
    for (const doc of BIOSPECIMEN_DOCUMENTS) {
      for (const key of doc.supportsKnowledgeItems) {
        expect(itemKeys.has(key)).toBe(true)
      }
    }
  })
})

describe('Biospecimen Domain — Stats', () => {
  it('stats match catalog', () => {
    expect(BIOSPECIMEN_DOMAIN_STATS.totalKnowledgeItems).toBe(BIOSPECIMEN_DOMAIN_CATALOG.length)
    expect(BIOSPECIMEN_DOMAIN_STATS.totalDocuments).toBe(BIOSPECIMEN_DOCUMENTS.length)
  })

  it('21 specimen types', () => {
    expect(BIOSPECIMEN_DOMAIN_STATS.specimenTypes).toBe(21)
  })

  it('enables meaningful capabilities', () => {
    expect(BIOSPECIMEN_DOMAIN_STATS.enabledCapabilities.length).toBeGreaterThan(15)
  })
})

describe('Biospecimen Domain — Sections', () => {
  it('has 5 sections covering all items', () => {
    const keys = new Set<string>()
    let total = 0
    for (const s of BIOSPECIMEN_SECTIONS) {
      for (const i of s.items) { keys.add(i.key); total++ }
    }
    expect(total).toBe(BIOSPECIMEN_DOMAIN_CATALOG.length)
    expect(keys.size).toBe(BIOSPECIMEN_DOMAIN_CATALOG.length)
  })
})

describe('Biospecimen Domain — Operations', () => {
  it('detects missing critical SOPs', () => {
    const checks = BIOSPECIMEN_OPERATIONS.criticalChecks.map((c) => c.check)
    expect(checks).toContain('no_collection_sop')
    expect(checks).toContain('no_processing_sop')
    expect(checks).toContain('no_storage_sop')
    expect(checks).toContain('no_chain_of_custody')
    expect(checks).toContain('no_cold_chain')
  })
})
