// ==========================================================================
// IKM Domain Sprint — Quality Domain Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  QUALITY_DOMAIN_CATALOG, QUALITY_DOCUMENTS, QUALITY_DOMAIN_STATS,
  QUALITY_SECTIONS, QUALITY_OPERATIONS,
} from '../../packages/institutional-knowledge/src/domains/quality'

describe('Quality Domain — Catalog', () => {
  it('covers 30+ quality items across 8 categories', () => {
    expect(QUALITY_DOMAIN_CATALOG.length).toBeGreaterThan(30)
    for (const item of QUALITY_DOMAIN_CATALOG) {
      expect(item.key).toBeTruthy()
    }
  })

  it('QMS foundation: quality manual, policy, objectives, management review are present', () => {
    const keys = QUALITY_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('quality_manual')
    expect(keys).toContain('quality_policy')
    expect(keys).toContain('management_review')
  })

  it('CAPA: system, deviation management, root cause, corrective, preventive', () => {
    const keys = QUALITY_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('capa_system')
    expect(keys).toContain('deviation_management')
    expect(keys).toContain('root_cause_analysis')
    expect(keys).toContain('corrective_action')
    expect(keys).toContain('preventive_action')
  })

  it('audits: program, schedule, findings, response', () => {
    const keys = QUALITY_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('internal_audit_program')
    expect(keys).toContain('audit_findings')
    expect(keys).toContain('audit_response')
  })

  it('consumed by Readiness, Sponsor Intelligence, Quality engines', () => {
    const allEngines = new Set(QUALITY_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))
    expect(allEngines.has('Readiness')).toBe(true)
    expect(allEngines.has('Sponsor Intelligence')).toBe(true)
    expect(allEngines.has('Quality')).toBe(true)
  })
})

describe('Quality Domain — Documents', () => {
  it('quality manual, CAPA log, audit reports, training matrix are required', () => {
    const required = QUALITY_DOCUMENTS.filter((d) => d.required)
    const keys = required.map((d) => d.key)
    expect(keys).toContain('quality_manual_doc')
    expect(keys).toContain('capa_log')
    expect(keys).toContain('audit_reports')
    expect(keys).toContain('training_matrix_doc')
  })

  it('vendor list expires annually', () => {
    const vendor = QUALITY_DOCUMENTS.find((d) => d.key === 'vendor_list')
    expect(vendor?.expires).toBe(true)
  })

  it('docs map to valid items', () => {
    const itemKeys = new Set(QUALITY_DOMAIN_CATALOG.map((i) => i.key))
    for (const doc of QUALITY_DOCUMENTS) {
      for (const key of doc.supportsKnowledgeItems) {
        expect(itemKeys.has(key)).toBe(true)
      }
    }
  })
})

describe('Quality Domain — Sections', () => {
  it('has 8 sections covering all items', () => {
    const keys = new Set<string>()
    let total = 0
    for (const s of QUALITY_SECTIONS) {
      for (const i of s.items) { keys.add(i.key); total++ }
    }
    expect(total).toBe(QUALITY_DOMAIN_CATALOG.length)
    expect(keys.size).toBe(QUALITY_DOMAIN_CATALOG.length)
  })
})

describe('Quality Domain — Operations', () => {
  it('detects critical gaps', () => {
    const checks = QUALITY_OPERATIONS.criticalChecks.map((c) => c.check)
    expect(checks).toContain('no_quality_manual')
    expect(checks).toContain('no_capa_system')
    expect(checks).toContain('no_internal_audit')
    expect(checks).toContain('no_training_matrix')
    expect(checks).toContain('overdue_capa')
  })
})
