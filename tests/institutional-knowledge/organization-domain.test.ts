// ==========================================================================
// IKM Domain Sprint 1 — Organization Domain Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  ORGANIZATION_DOMAIN_CATALOG,
  ORGANIZATION_DOCUMENTS,
  ORGANIZATION_DOMAIN_STATS,
  ORGANIZATION_SECTIONS,
} from '../../packages/institutional-knowledge/src/domains/organization'

describe('Organization Domain — Catalog', () => {
  it('has complete catalog with all knowledge items', () => {
    expect(ORGANIZATION_DOMAIN_CATALOG.length).toBeGreaterThan(30)
    // Every item must have key, label, itemType
    for (const item of ORGANIZATION_DOMAIN_CATALOG) {
      expect(item.key).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.itemType).toBeTruthy()
    }
  })

  it('has required items for compliance', () => {
    const required = ORGANIZATION_DOMAIN_CATALOG.filter((i) => i.required)
    expect(required.length).toBeGreaterThan(5)
    // Core required items
    const keys = required.map((i) => i.key)
    expect(keys).toContain('legal_name')
    expect(keys).toContain('legal_entity_type')
    expect(keys).toContain('tax_id')
    expect(keys).toContain('business_license')
    expect(keys).toContain('insurance')
    expect(keys).toContain('physical_locations')
  })

  it('identifies items consumed by Sponsor Intelligence', () => {
    const sponsorItems = ORGANIZATION_DOMAIN_CATALOG.filter(
      (i) => i.consumedBy.includes('Sponsor Intelligence')
    )
    expect(sponsorItems.length).toBeGreaterThan(10)
  })

  it('identifies items consumed by Readiness', () => {
    const readinessItems = ORGANIZATION_DOMAIN_CATALOG.filter(
      (i) => i.consumedBy.includes('Readiness')
    )
    expect(readinessItems.length).toBeGreaterThan(0)
  })
})

describe('Organization Domain — Documents', () => {
  it('has required documents for core compliance', () => {
    const required = ORGANIZATION_DOCUMENTS.filter((d) => d.required)
    expect(required.length).toBeGreaterThanOrEqual(3)

    const keys = required.map((d) => d.key)
    expect(keys).toContain('business_license_doc')
    expect(keys).toContain('tax_id_doc')
    expect(keys).toContain('insurance_cert')
  })

  it('has certifications that expire', () => {
    const expiring = ORGANIZATION_DOCUMENTS.filter((d) => d.expires)
    expect(expiring.length).toBeGreaterThan(3)
    // Each expiring doc has typicalExpirationMonths
    for (const doc of expiring) {
      if (doc.typicalExpirationMonths) {
        expect(doc.typicalExpirationMonths).toBeGreaterThan(0)
      }
    }
  })

  it('documents map to knowledge items', () => {
    const allItemKeys = new Set(ORGANIZATION_DOMAIN_CATALOG.map((i) => i.key))
    for (const doc of ORGANIZATION_DOCUMENTS) {
      for (const key of doc.supportsKnowledgeItems) {
        expect(allItemKeys.has(key)).toBe(true)
      }
    }
  })
})

describe('Organization Domain — Stats', () => {
  it('has consistent stats with catalog', () => {
    expect(ORGANIZATION_DOMAIN_STATS.totalKnowledgeItems).toBe(ORGANIZATION_DOMAIN_CATALOG.length)
    expect(ORGANIZATION_DOMAIN_STATS.totalDocuments).toBe(ORGANIZATION_DOCUMENTS.length)
    expect(ORGANIZATION_DOMAIN_STATS.downstreamEngines).toContain('Sponsor Intelligence')
  })

  it('enables meaningful capabilities', () => {
    expect(ORGANIZATION_DOMAIN_STATS.enabledCapabilities.length).toBeGreaterThan(5)
    expect(ORGANIZATION_DOMAIN_STATS.enabledCapabilities).toContain('Program Participation')
  })
})

describe('Organization Domain — Sections', () => {
  it('has 8 progressive sections', () => {
    expect(ORGANIZATION_SECTIONS).toHaveLength(8)
    expect(ORGANIZATION_SECTIONS[0].name).toBe('Identity')
    expect(ORGANIZATION_SECTIONS[7].name).toBe('Strategy & Growth')
  })

  it('all catalog items belong to exactly one section', () => {
    const sectionItemKeys = new Set<string>()
    let totalSectionItems = 0
    for (const section of ORGANIZATION_SECTIONS) {
      for (const item of section.items) {
        sectionItemKeys.add(item.key)
        totalSectionItems++
      }
    }
    // Every catalog item should be in one section
    expect(totalSectionItems).toBe(ORGANIZATION_DOMAIN_CATALOG.length)
    // No duplicates across sections
    expect(sectionItemKeys.size).toBe(ORGANIZATION_DOMAIN_CATALOG.length)
  })
})
