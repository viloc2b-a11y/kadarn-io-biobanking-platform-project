// ==========================================================================
// IKM Domain Sprint — Regulatory Domain Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  REGULATORY_DOMAIN_CATALOG, REGULATORY_DOCUMENTS, REGULATORY_DOMAIN_STATS,
  REGULATORY_SECTIONS, REGULATORY_LIFECYCLE, REGULATORY_OPERATIONS, REGULATORY_OPERATIONS as ops,
} from '../../packages/institutional-knowledge/src/domains/regulatory'

describe('Regulatory Domain — Catalog', () => {
  it('covers 25+ regulatory items across 6 categories', () => {
    expect(REGULATORY_DOMAIN_CATALOG.length).toBeGreaterThan(25)
    for (const item of REGULATORY_DOMAIN_CATALOG) {
      expect(item.key).toBeTruthy()
    }
  })

  it('IRB, CLIA, state license, medical director license present', () => {
    const keys = REGULATORY_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('irb_registration')
    expect(keys).toContain('clia_certificate')
    expect(keys).toContain('state_license')
    expect(keys).toContain('medical_director_license')
    expect(keys).toContain('fwa')
  })

  it('IATA and biohazard certifications present', () => {
    const keys = REGULATORY_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('iata_certification')
    expect(keys).toContain('biohazard_certification')
  })

  it('research insurance and professional liability present', () => {
    const keys = REGULATORY_DOMAIN_CATALOG.map((i) => i.key)
    expect(keys).toContain('research_insurance')
    expect(keys).toContain('professional_liability')
  })

  it('consumed by Readiness, Sponsor Intelligence, Compliance', () => {
    const allEngines = new Set(REGULATORY_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))
    expect(allEngines.has('Readiness')).toBe(true)
    expect(allEngines.has('Sponsor Intelligence')).toBe(true)
    expect(allEngines.has('Compliance')).toBe(true)
    expect(allEngines.has('Capability Intelligence')).toBe(true)
  })

  it('every item generates evidence candidates', () => {
    for (const item of REGULATORY_DOMAIN_CATALOG) {
      expect(item.generatesCandidates).toBe(true)
    }
  })
})

describe('Regulatory Domain — Expiration Tracking', () => {
  it('15+ items have expiration dates', () => {
    const expiring = REGULATORY_DOMAIN_CATALOG.filter((i) => i.expires)
    expect(expiring.length).toBeGreaterThan(15)
    for (const item of expiring) {
      expect(item.typicalExpirationMonths).toBeDefined()
      expect(item.typicalExpirationMonths).toBeGreaterThan(0)
    }
  })

  it('renewable items have lifecycle tracking', () => {
    const renewable = REGULATORY_LIFECYCLE.renewableItems
    expect(renewable.length).toBeGreaterThan(10)
    for (const item of renewable) {
      expect(item.typicalMonths).toBeGreaterThan(0)
    }
  })
})

describe('Regulatory Domain — Documents', () => {
  it('CLIA, IRB, IATA, medical license, insurance certs are required', () => {
    const required = REGULATORY_DOCUMENTS.filter((d) => d.required)
    const keys = required.map((d) => d.key)
    expect(keys).toContain('clia_certificate_doc')
    expect(keys).toContain('irb_approval_letter')
    expect(keys).toContain('iata_certificate_doc')
    expect(keys).toContain('medical_license_doc')
    expect(keys).toContain('insurance_cert')
  })

  it('docs map to valid items', () => {
    const itemKeys = new Set(REGULATORY_DOMAIN_CATALOG.map((i) => i.key))
    for (const doc of REGULATORY_DOCUMENTS) {
      for (const key of doc.supportsKnowledgeItems) {
        expect(itemKeys.has(key)).toBe(true)
      }
    }
  })
})

describe('Regulatory Domain — Sections', () => {
  it('has 6 sections covering all items', () => {
    const keys = new Set<string>()
    let total = 0
    for (const s of REGULATORY_SECTIONS) {
      for (const i of s.items) { keys.add(i.key); total++ }
    }
    expect(total).toBe(REGULATORY_DOMAIN_CATALOG.length)
    expect(keys.size).toBe(REGULATORY_DOMAIN_CATALOG.length)
  })
})

describe('Regulatory Domain — Operations', () => {
  it('detects missing IRB, CLIA, state license, medical license', () => {
    const checks = ops.criticalChecks.map((c) => c.check)
    expect(checks).toContain('missing_irb')
    expect(checks).toContain('missing_clia')
    expect(checks).toContain('missing_state_lab_license')
    expect(checks).toContain('missing_medical_director_license')
  })

  it('detects expired licenses and upcoming renewals', () => {
    const checks = ops.criticalChecks.map((c) => c.check)
    expect(checks).toContain('expired_license')
    expect(checks).toContain('expiring_soon')
  })

  it('warns about no regulatory owner', () => {
    const checks = ops.criticalChecks.map((c) => c.check)
    expect(checks).toContain('no_regulatory_owner')
  })

  it('6 critical severity checks — missing anything is a hard stop', () => {
    const critical = ops.criticalChecks.filter((c) => c.severity === 'critical')
    expect(critical.length).toBeGreaterThanOrEqual(6)
  })
})
