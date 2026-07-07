// ==========================================================================
// IKM Domain Sprint 5 — Laboratory Domain Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  LAB_DOMAIN_CATALOG, LAB_DOCUMENTS, LAB_DOMAIN_STATS,
  LAB_SECTIONS, LAB_OPERATIONS_CHECKS, LAB_LIFECYCLE,
} from '../../packages/institutional-knowledge/src/domains/laboratory'

describe('Laboratory Domain — Catalog', () => {
  it('covers 12 lab types + attributes + operations', () => {
    expect(LAB_DOMAIN_CATALOG.length).toBeGreaterThan(30)
    for (const item of LAB_DOMAIN_CATALOG) {
      expect(item.key).toBeTruthy()
      expect(item.itemType).toBeTruthy()
    }
  })

  it('clinical lab and processing lab are required', () => {
    const required = LAB_DOMAIN_CATALOG.filter((i) => i.required)
    const keys = required.map((i) => i.key)
    expect(keys).toContain('clinical_lab')
    expect(keys).toContain('processing_lab')
  })

  it('sample reception, processing, storage, QC are required operations', () => {
    const ops = LAB_DOMAIN_CATALOG.filter((i) => i.key === 'sample_reception' || i.key === 'sample_processing' || i.key === 'sample_storage' || i.key === 'quality_control')
    expect(ops.every((o) => o.required)).toBe(true)
  })

  it('PBMC lab consumed by Sponsor Intelligence and Readiness', () => {
    const pbmc = LAB_DOMAIN_CATALOG.find((i) => i.key === 'pbmc_lab')
    expect(pbmc?.consumedBy).toContain('Sponsor Intelligence')
    expect(pbmc?.consumedBy).toContain('Readiness')
  })
})

describe('Laboratory Domain — Lifecycle', () => {
  it('has 7 states', () => {
    expect(LAB_LIFECYCLE.states).toHaveLength(7)
    expect(LAB_LIFECYCLE.states).toContain('operational')
    expect(LAB_LIFECYCLE.states).toContain('retired')
  })

  it('operational can transition to restricted', () => {
    expect(LAB_LIFECYCLE.transitions.operational).toContain('restricted')
  })
})

describe('Laboratory Domain — Documents', () => {
  it('SOPs, quality manual, temp logs, chain of custody, proficiency, training are required', () => {
    const required = LAB_DOCUMENTS.filter((d) => d.required)
    const keys = required.map((d) => d.key)
    expect(keys).toContain('lab_sop_set')
    expect(keys).toContain('quality_manual')
    expect(keys).toContain('temp_logs')
    expect(keys).toContain('chain_custody_sop')
    expect(keys).toContain('proficiency_testing')
    expect(keys).toContain('training_records')
  })

  it('CLIA and CAP certs expire', () => {
    const certs = LAB_DOCUMENTS.filter((d) => d.key === 'clia_cert' || d.key === 'cap_cert')
    expect(certs.every((c) => c.expires)).toBe(true)
  })

  it('docs map to valid item keys', () => {
    const itemKeys = new Set(LAB_DOMAIN_CATALOG.map((i) => i.key))
    for (const doc of LAB_DOCUMENTS) {
      for (const key of doc.supportsKnowledgeItems) {
        expect(itemKeys.has(key)).toBe(true)
      }
    }
  })
})

describe('Laboratory Domain — Stats', () => {
  it('stats match catalog', () => {
    expect(LAB_DOMAIN_STATS.totalKnowledgeItems).toBe(LAB_DOMAIN_CATALOG.length)
    expect(LAB_DOMAIN_STATS.totalDocuments).toBe(LAB_DOCUMENTS.length)
  })
})

describe('Laboratory Domain — Sections', () => {
  it('has 3 sections covering all items', () => {
    const keys = new Set<string>()
    let total = 0
    for (const s of LAB_SECTIONS) {
      for (const i of s.items) { keys.add(i.key); total++ }
    }
    expect(total).toBe(LAB_DOMAIN_CATALOG.length)
    expect(keys.size).toBe(LAB_DOMAIN_CATALOG.length)
  })
})

describe('Laboratory Domain — Operations', () => {
  it('detects critical gaps', () => {
    const checks = LAB_OPERATIONS_CHECKS.criticalChecks.map((c) => c.check)
    expect(checks).toContain('no_sops')
    expect(checks).toContain('no_quality_manual')
    expect(checks).toContain('accreditation_expired')
    expect(checks).toContain('no_chain_of_custody')
  })
})
