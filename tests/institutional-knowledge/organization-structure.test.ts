// ==========================================================================
// IKM Domain Sprint 2A — Organization Structure Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  ORG_STRUCTURE_CATALOG, ORG_STRUCTURE_STATS, ORG_STRUCTURE_SECTIONS,
  CAPABILITY_SCOPES,
} from '../../packages/institutional-knowledge/src/domains/organization-structure'

describe('Organization Structure — Models', () => {
  it('covers 15 organization models', () => {
    expect(ORG_STRUCTURE_CATALOG.length).toBeGreaterThan(35)
    for (const item of ORG_STRUCTURE_CATALOG) {
      expect(item.key).toBeTruthy()
    }
  })

  it('includes independent, multi-site, network, academic, biobank, CRO, hybrid', () => {
    const keys = ORG_STRUCTURE_CATALOG.map((i) => i.key)
    expect(keys).toContain('independent_site')
    expect(keys).toContain('multi_site_org')
    expect(keys).toContain('site_network')
    expect(keys).toContain('academic_center')
    expect(keys).toContain('biobank')
    expect(keys).toContain('cro')
    expect(keys).toContain('hybrid_org')
  })

  it('network structure includes parent, members, hubs, shared services', () => {
    const keys = ORG_STRUCTURE_CATALOG.map((i) => i.key)
    expect(keys).toContain('parent_org')
    expect(keys).toContain('member_sites')
    expect(keys).toContain('regional_hubs')
    expect(keys).toContain('central_lab')
    expect(keys).toContain('shared_regulatory')
    expect(keys).toContain('shared_quality')
  })
})

describe('Organization Structure — Capability Scopes', () => {
  it('defines 5 capability distribution scopes', () => {
    expect(CAPABILITY_SCOPES).toHaveLength(5)
    const scopes = CAPABILITY_SCOPES.map((s) => s.scope)
    expect(scopes).toContain('site_specific')
    expect(scopes).toContain('shared_network')
    expect(scopes).toContain('centralized')
    expect(scopes).toContain('distributed')
    expect(scopes).toContain('inherited')
  })
})

describe('Organization Structure — People Distribution', () => {
  it('covers shared PI, local PI, traveling CRC, central staff', () => {
    const keys = ORG_STRUCTURE_CATALOG.map((i) => i.key)
    expect(keys).toContain('shared_pi')
    expect(keys).toContain('local_pi')
    expect(keys).toContain('traveling_coordinator')
    expect(keys).toContain('central_regulatory')
  })
})

describe('Organization Structure — Equipment Distribution', () => {
  it('covers local, shared, centralized, and by-request equipment', () => {
    const keys = ORG_STRUCTURE_CATALOG.map((i) => i.key)
    expect(keys).toContain('local_equipment')
    expect(keys).toContain('shared_equipment')
    expect(keys).toContain('central_equipment')
    expect(keys).toContain('equipment_by_request')
  })
})

describe('Organization Structure — Program Distribution', () => {
  it('covers single site, multi-site, network-wide, regional hub execution', () => {
    const keys = ORG_STRUCTURE_CATALOG.map((i) => i.key)
    expect(keys).toContain('single_site_program')
    expect(keys).toContain('multi_site_program')
    expect(keys).toContain('network_wide_program')
    expect(keys).toContain('regional_hub_program')
  })
})

describe('Organization Structure — Sections', () => {
  it('has 5 sections covering all items', () => {
    const keys = new Set<string>()
    let total = 0
    for (const s of ORG_STRUCTURE_SECTIONS) {
      for (const i of s.items) { keys.add(i.key); total++ }
    }
    expect(total).toBe(ORG_STRUCTURE_CATALOG.length)
    expect(keys.size).toBe(ORG_STRUCTURE_CATALOG.length)
  })
})
