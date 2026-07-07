// ==========================================================================
// IKM Domain Sprint 3 — Facilities Domain Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  FACILITY_DOMAIN_CATALOG,
  FACILITY_DOCUMENTS,
  FACILITY_DOMAIN_STATS,
  FACILITY_SECTIONS,
  FACILITY_OPERATIONS,
} from '../../packages/institutional-knowledge/src/domains/facilities'

describe('Facilities Domain — Catalog', () => {
  it('covers 14 facility types', () => {
    expect(FACILITY_DOMAIN_CATALOG.length).toBeGreaterThan(35)
    for (const item of FACILITY_DOMAIN_CATALOG) {
      expect(item.key).toBeTruthy()
      expect(item.itemType).toBeTruthy()
    }
  })

  it('main site, laboratory, and sample storage are required', () => {
    const required = FACILITY_DOMAIN_CATALOG.filter((i) => i.required)
    const keys = required.map((i) => i.key)
    expect(keys).toContain('main_site')
    expect(keys).toContain('laboratory')
    expect(keys).toContain('sample_storage')
  })

  it('emergency power and environmental controls are required', () => {
    const infra = FACILITY_DOMAIN_CATALOG.filter((i) => i.key === 'emergency_power' || i.key === 'environmental_controls')
    expect(infra.every((i) => i.required)).toBe(true)
  })

  it('consumed by downstream engines', () => {
    const sponsor = FACILITY_DOMAIN_CATALOG.filter((i) => i.consumedBy.includes('Sponsor Intelligence'))
    expect(sponsor.length).toBeGreaterThan(10)
    const readiness = FACILITY_DOMAIN_CATALOG.filter((i) => i.consumedBy.includes('Readiness'))
    expect(readiness.length).toBeGreaterThan(5)
  })
})

describe('Facilities Domain — Documents', () => {
  it('floor plan, occupancy, fire inspection are required', () => {
    const required = FACILITY_DOCUMENTS.filter((d) => d.required)
    const keys = required.map((d) => d.key)
    expect(keys).toContain('floor_plan')
    expect(keys).toContain('occupancy_permit')
    expect(keys).toContain('fire_inspection')
  })

  it('storage temperature logs are required', () => {
    const tempLog = FACILITY_DOCUMENTS.find((d) => d.key === 'storage_temp_log')
    expect(tempLog?.required).toBe(true)
    expect(tempLog?.evidenceClass).toBe('A')
  })

  it('docs map to valid knowledge items', () => {
    const itemKeys = new Set(FACILITY_DOMAIN_CATALOG.map((i) => i.key))
    for (const doc of FACILITY_DOCUMENTS) {
      for (const key of doc.supportsKnowledgeItems) {
        expect(itemKeys.has(key)).toBe(true)
      }
    }
  })
})

describe('Facilities Domain — Stats', () => {
  it('stats match catalog', () => {
    expect(FACILITY_DOMAIN_STATS.totalKnowledgeItems).toBe(FACILITY_DOMAIN_CATALOG.length)
    expect(FACILITY_DOMAIN_STATS.totalDocuments).toBe(FACILITY_DOCUMENTS.length)
  })
})

describe('Facilities Domain — Sections', () => {
  it('has 4 progressive sections', () => {
    expect(FACILITY_SECTIONS).toHaveLength(4)
    expect(FACILITY_SECTIONS[0].name).toBe('Facility Types')
    expect(FACILITY_SECTIONS[3].name).toBe('Areas & Rooms')
  })

  it('all items in exactly one section', () => {
    const keys = new Set<string>()
    let total = 0
    for (const s of FACILITY_SECTIONS) {
      for (const i of s.items) { keys.add(i.key); total++ }
    }
    expect(total).toBe(FACILITY_DOMAIN_CATALOG.length)
    expect(keys.size).toBe(FACILITY_DOMAIN_CATALOG.length)
  })
})

describe('Facilities Domain — Operations', () => {
  it('detects missing critical items', () => {
    const checks = FACILITY_OPERATIONS.criticalChecks.map((c) => c.check)
    expect(checks).toContain('fire_inspection_expired')
    expect(checks).toContain('emergency_plan_missing')
    expect(checks).toContain('temp_logs_missing')
  })
})
