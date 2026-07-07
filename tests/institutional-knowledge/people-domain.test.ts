// ==========================================================================
// IKM Domain Sprint 2 — People Domain Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  PEOPLE_DOMAIN_CATALOG,
  PEOPLE_DOCUMENTS,
  PEOPLE_DOMAIN_STATS,
  PEOPLE_SECTIONS,
  PEOPLE_OPERATIONS,
} from '../../packages/institutional-knowledge/src/domains/people'

describe('People Domain — Catalog', () => {
  it('covers all required personnel types', () => {
    expect(PEOPLE_DOMAIN_CATALOG.length).toBeGreaterThan(25)
    for (const item of PEOPLE_DOMAIN_CATALOG) {
      expect(item.key).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.itemType).toBeTruthy()
    }
  })

  it('PI, coordinator, and lab staff are required', () => {
    const required = PEOPLE_DOMAIN_CATALOG.filter((i) => i.required)
    const keys = required.map((i) => i.key)
    expect(keys).toContain('pi')
    expect(keys).toContain('research_coordinator')
    expect(keys).toContain('lab_staff')
  })

  it('GCP, biosafety, and human subjects training are required', () => {
    const training = PEOPLE_DOMAIN_CATALOG.filter((i) => i.key.includes('training'))
    expect(training.find((t) => t.key === 'gcp_training')?.required).toBe(true)
    expect(training.find((t) => t.key === 'biosafety_training')?.required).toBe(true)
    expect(training.find((t) => t.key === 'human_subjects_training')?.required).toBe(true)
  })

  it('items consumed by Sponsor Intelligence', () => {
    const sponsor = PEOPLE_DOMAIN_CATALOG.filter((i) => i.consumedBy.includes('Sponsor Intelligence'))
    expect(sponsor.length).toBeGreaterThan(15)
  })

  it('items consumed by Readiness', () => {
    const readiness = PEOPLE_DOMAIN_CATALOG.filter((i) => i.consumedBy.includes('Readiness'))
    expect(readiness.length).toBeGreaterThan(3)
  })
})

describe('People Domain — Documents', () => {
  it('CV, GCP, delegation log are required', () => {
    const required = PEOPLE_DOCUMENTS.filter((d) => d.required)
    const keys = required.map((d) => d.key)
    expect(keys).toContain('cv')
    expect(keys).toContain('gcp_cert')
    expect(keys).toContain('delegation_log_doc')
  })

  it('training docs expire', () => {
    const training = PEOPLE_DOCUMENTS.filter((d) => d.key.includes('cert') || d.key.includes('training'))
    for (const doc of training) {
      if (doc.expires) {
        expect(doc.typicalExpirationMonths).toBeGreaterThan(0)
      }
    }
  })

  it('document keys map to valid knowledge items', () => {
    const itemKeys = new Set(PEOPLE_DOMAIN_CATALOG.map((i) => i.key))
    for (const doc of PEOPLE_DOCUMENTS) {
      for (const key of doc.supportsKnowledgeItems) {
        expect(itemKeys.has(key)).toBe(true)
      }
    }
  })
})

describe('People Domain — Stats', () => {
  it('stats match catalog', () => {
    expect(PEOPLE_DOMAIN_STATS.totalKnowledgeItems).toBe(PEOPLE_DOMAIN_CATALOG.length)
    expect(PEOPLE_DOMAIN_STATS.totalDocuments).toBe(PEOPLE_DOCUMENTS.length)
  })

  it('downstream includes Regulatory and Readiness', () => {
    expect(PEOPLE_DOMAIN_STATS.downstreamEngines).toContain('Regulatory')
    expect(PEOPLE_DOMAIN_STATS.downstreamEngines).toContain('Readiness')
  })
})

describe('People Domain — Sections', () => {
  it('has 5 progressive sections', () => {
    expect(PEOPLE_SECTIONS).toHaveLength(5)
    expect(PEOPLE_SECTIONS[0].name).toBe('Roles & Positions')
    expect(PEOPLE_SECTIONS[3].name).toBe('Training & Certifications')
  })

  it('all items in exactly one section', () => {
    const keys = new Set<string>()
    let total = 0
    for (const s of PEOPLE_SECTIONS) {
      for (const i of s.items) { keys.add(i.key); total++ }
    }
    expect(total).toBe(PEOPLE_DOMAIN_CATALOG.length)
    expect(keys.size).toBe(PEOPLE_DOMAIN_CATALOG.length)
  })
})

describe('People Domain — Operations', () => {
  it('has critical checks for GCP, CV, training', () => {
    const checks = PEOPLE_OPERATIONS.criticalChecks.map((c) => c.check)
    expect(checks).toContain('gcp_expired')
    expect(checks).toContain('cv_missing')
    expect(checks).toContain('biosafety_missing')
  })
})
