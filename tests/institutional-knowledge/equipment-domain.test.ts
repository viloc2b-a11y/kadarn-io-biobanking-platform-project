// ==========================================================================
// IKM Domain Sprint 4 — Equipment Domain Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  EQUIPMENT_DOMAIN_CATALOG,
  EQUIPMENT_DOCUMENTS,
  EQUIPMENT_DOMAIN_STATS,
  EQUIPMENT_SECTIONS,
  EQUIPMENT_OPERATIONS,
  EQUIPMENT_LIFECYCLE,
} from '../../packages/institutional-knowledge/src/domains/equipment'

describe('Equipment Domain — Catalog', () => {
  it('covers essential equipment types', () => {
    expect(EQUIPMENT_DOMAIN_CATALOG.length).toBeGreaterThan(25)
    for (const item of EQUIPMENT_DOMAIN_CATALOG) {
      expect(item.key).toBeTruthy()
      expect(item.itemType).toBeTruthy()
    }
  })

  it('-80 freezer, centrifuge, BSC, and temp monitoring are required', () => {
    const required = EQUIPMENT_DOMAIN_CATALOG.filter((i) => i.required)
    const keys = required.map((i) => i.key)
    expect(keys).toContain('freezer_80')
    expect(keys).toContain('centrifuge')
    expect(keys).toContain('biosafety_cabinet')
    expect(keys).toContain('temp_monitoring')
    expect(keys).toContain('backup_generator')
  })

  it('consumed by Readiness and Capability Intelligence', () => {
    const readiness = EQUIPMENT_DOMAIN_CATALOG.filter((i) => i.consumedBy.includes('Readiness'))
    expect(readiness.length).toBeGreaterThan(5)
  })
})

describe('Equipment Domain — Lifecycle', () => {
  it('has 7 lifecycle states', () => {
    expect(EQUIPMENT_LIFECYCLE.states).toHaveLength(7)
    expect(EQUIPMENT_LIFECYCLE.states).toContain('operational')
    expect(EQUIPMENT_LIFECYCLE.states).toContain('retired')
    expect(EQUIPMENT_LIFECYCLE.states).toContain('disposed')
  })

  it('operational can transition to under_maintenance', () => {
    expect(EQUIPMENT_LIFECYCLE.transitions.operational).toContain('under_maintenance')
  })
})

describe('Equipment Domain — Documents', () => {
  it('IQ, OQ, calibration, and temp logs are required', () => {
    const required = EQUIPMENT_DOCUMENTS.filter((d) => d.required)
    const keys = required.map((d) => d.key)
    expect(keys).toContain('iq_doc')
    expect(keys).toContain('oq_doc')
    expect(keys).toContain('calibration_cert')
    expect(keys).toContain('temp_log')
    expect(keys).toContain('bsc_cert')
  })

  it('calibration cert expires annually', () => {
    const cal = EQUIPMENT_DOCUMENTS.find((d) => d.key === 'calibration_cert')
    expect(cal?.expires).toBe(true)
    expect(cal?.typicalExpirationMonths).toBe(12)
  })

  it('docs map to valid item keys', () => {
    const itemKeys = new Set(EQUIPMENT_DOMAIN_CATALOG.map((i) => i.key))
    for (const doc of EQUIPMENT_DOCUMENTS) {
      for (const key of doc.supportsKnowledgeItems) {
        expect(itemKeys.has(key)).toBe(true)
      }
    }
  })
})

describe('Equipment Domain — Stats', () => {
  it('stats match catalog', () => {
    expect(EQUIPMENT_DOMAIN_STATS.totalKnowledgeItems).toBe(EQUIPMENT_DOMAIN_CATALOG.length)
    expect(EQUIPMENT_DOMAIN_STATS.totalDocuments).toBe(EQUIPMENT_DOCUMENTS.length)
  })
})

describe('Equipment Domain — Sections', () => {
  it('has 6 sections covering all items', () => {
    expect(EQUIPMENT_SECTIONS).toHaveLength(6)
    const keys = new Set<string>()
    let total = 0
    for (const s of EQUIPMENT_SECTIONS) {
      for (const i of s.items) { keys.add(i.key); total++ }
    }
    expect(total).toBe(EQUIPMENT_DOMAIN_CATALOG.length)
    expect(keys.size).toBe(EQUIPMENT_DOMAIN_CATALOG.length)
  })
})

describe('Equipment Domain — Operations', () => {
  it('detects calibration and BSC cert expirations', () => {
    const checks = EQUIPMENT_OPERATIONS.criticalChecks.map((c) => c.check)
    expect(checks).toContain('calibration_expired')
    expect(checks).toContain('bsc_cert_expired')
    expect(checks).toContain('temp_logs_missing')
    expect(checks).toContain('generator_not_tested')
  })
})
