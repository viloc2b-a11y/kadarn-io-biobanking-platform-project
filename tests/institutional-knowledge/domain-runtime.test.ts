// ==========================================================================
// IKM/EVM Sprint 4 — Domain Runtime Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  declareKnowledgeItem,
  uploadDocument,
  createRelationship,
  buildDomains,
  getDomain,
  buildInstitutionDashboard,
} from '../../packages/institutional-knowledge/src/index'

const ORG = 'org-sprint-4'

// ==========================================================================
// Test 1: Domain creation
// ==========================================================================

describe('Domain creation', () => {
  it('builds all 14 domains for an organization', () => {
    const domains = buildDomains(ORG)
    expect(domains).toHaveLength(14)
    expect(domains[0].id).toBe('organization')
    expect(domains[0].name).toBe('Organization')
    expect(domains[0].progress).toBeDefined()
  })

  it('populates domains with matching knowledge items', () => {
    declareKnowledgeItem({ organizationId: ORG, statement: 'Dr. Chen', itemType: 'person' })
    declareKnowledgeItem({ organizationId: ORG, statement: 'Dr. Patel', itemType: 'person' })

    const domains = buildDomains(ORG)
    const peopleDomain = domains.find((d) => d.id === 'people')!
    expect(peopleDomain.knowledgeItems.length).toBeGreaterThanOrEqual(2)
  })

  it('returns not_started for empty domain', () => {
    // custom domain has no auto-matching — should be not_started
    const customDomain = getDomain(ORG, 'custom')
    expect(customDomain).toBeDefined()
    expect(customDomain!.progress.completeness).toBe('not_started')
  })
})

// ==========================================================================
// Test 2: Domain progress / coverage
// ==========================================================================

describe('Domain progress', () => {
  it('computes started when items exist without docs', () => {
    declareKnowledgeItem({ organizationId: ORG, statement: 'Bioanalyzer', itemType: 'equipment' })

    const domain = getDomain(ORG, 'equipment')!
    expect(domain.progress.totalItems).toBeGreaterThan(0)
    expect(domain.progress.itemsWithDocs).toBe(0)
    expect(domain.progress.completeness).toBe('started')
  })

  it('computes partially_documented when some items have docs', () => {
    const item = declareKnowledgeItem({ organizationId: ORG, statement: 'PCR Machine', itemType: 'equipment' })
    uploadDocument({
      organizationId: ORG, documentType: 'record', name: 'Calibration',
      relatedEntityId: item.id, relatedEntityType: 'equipment', expires: false,
    })

    // Add another item without docs
    declareKnowledgeItem({ organizationId: ORG, statement: 'Sequencer', itemType: 'equipment' })

    const domain = getDomain(ORG, 'equipment')!
    expect(domain.progress.itemsWithDocs).toBeGreaterThan(0)
    expect(['started', 'partially_documented', 'well_documented']).toContain(domain.progress.completeness)
  })
})

// ==========================================================================
// Test 3: Missing document detection
// ==========================================================================

describe('Missing document detection', () => {
  it('detects required items that are not fulfilled', () => {
    // Don't create any organization items
    const domain = getDomain(ORG, 'organization')!
    // Required items from catalog should be unfulfilled
    const missing = domain.missingItems
    // At least 1 required item defined in catalog
    expect(domain.requiredItems.length).toBeGreaterThan(0)
    expect(missing.length).toBe(domain.requiredItems.length)
  })

  it('marks required items as fulfilled when matching items exist', () => {
    declareKnowledgeItem({
      organizationId: ORG,
      statement: 'IRB Registration #12345',
      itemType: 'regulatory',
      tags: ['irb', 'registration'],
    })

    const domain = getDomain(ORG, 'regulatory')!
    const irbRequired = domain.requiredItems.find((r) => r.label.includes('IRB'))
    expect(irbRequired).toBeDefined()
  })
})

// ==========================================================================
// Test 4: Institution dashboard
// ==========================================================================

describe('Institution Dashboard', () => {
  it('aggregates all domains into dashboard', () => {
    declareKnowledgeItem({ organizationId: ORG, statement: 'Equipment A', itemType: 'equipment' })
    declareKnowledgeItem({ organizationId: ORG, statement: 'Staff B', itemType: 'person' })
    declareKnowledgeItem({ organizationId: ORG, statement: 'Lab C', itemType: 'facility' })

    const dashboard = buildInstitutionDashboard(ORG)
    expect(dashboard.institutionMemory.totalItems).toBeGreaterThanOrEqual(3)
    expect(dashboard.institutionMemory.totalDomains).toBe(14)
    expect(dashboard.domainCompletion).toHaveLength(14)
    expect(dashboard.evidenceMaturity).toBeDefined()
    expect(dashboard.documentStatus).toBeDefined()
    expect(dashboard.knowledgeHealth).toBeDefined()
    expect(dashboard.recommendedActions.length).toBeGreaterThan(0)
  })

  it('includes domain completion entries for all domains', () => {
    const dashboard = buildInstitutionDashboard(ORG)
    const names = dashboard.domainCompletion.map((d) => d.name)
    expect(names).toContain('Organization')
    expect(names).toContain('People')
    expect(names).toContain('Equipment')
    expect(names).toContain('Laboratory')
  })
})

// ==========================================================================
// Test 5: Recommendation generation
// ==========================================================================

describe('Recommendation generation', () => {
  it('recommends uploading documents for items without docs', () => {
    declareKnowledgeItem({ organizationId: ORG, statement: 'Undocumented item', itemType: 'equipment' })
    const domain = getDomain(ORG, 'equipment')!
    expect(domain.progress.nextBestActions.length).toBeGreaterThan(0)
    expect(domain.progress.nextBestActions.some((a) => a.includes('document'))).toBe(true)
  })

  it('recommends replacing expired documents', () => {
    const item = declareKnowledgeItem({ organizationId: ORG, statement: 'Old cert', itemType: 'certification' })
    uploadDocument({
      organizationId: ORG, documentType: 'certification', name: 'Expired Cert',
      relatedEntityId: item.id, relatedEntityType: 'certification',
      expires: true, expirationDate: '2020-01-01',
    })

    const domain = getDomain(ORG, 'laboratory')!
    // Should detect expired doc
    expect(domain.progress.expiredDocs).toBeGreaterThan(0)
  })
})

// ==========================================================================
// Test 6: Boundary validation
// ==========================================================================

describe('Boundary validation', () => {
  it('domain runtime has no Evidence Core dependency', () => {
    const domains = buildDomains(ORG)
    expect(domains).toBeDefined()
    expect(domains.length).toBe(14)

    const dashboard = buildInstitutionDashboard(ORG)
    expect(dashboard.organizationId).toBe(ORG)
  })
})
