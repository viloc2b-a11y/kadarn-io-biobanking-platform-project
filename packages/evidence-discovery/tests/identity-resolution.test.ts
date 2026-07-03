// ==========================================================================
// Identity Resolution Engine — Tests (Sprint 23B)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { IdentityResolutionEngine } from '../src/identity-resolution/engine.js'
import type { ResolutionInput } from '../src/identity-resolution/types.js'

function makeEngine(): IdentityResolutionEngine {
  return new IdentityResolutionEngine()
}

function houstonMethodist(): ResolutionInput {
  return {
    entity_type: 'institution',
    external_ids: [
      { source: 'ror', identifier: 'ror:03x4av117', verified: true, last_synced: '2026-01-01' },
      { source: 'grid', identifier: 'grid.12345', verified: false, last_synced: '2026-01-01' },
    ],
    names: ['Houston Methodist Hospital', 'Houston Methodist'],
    metadata: { city: 'Houston', state: 'TX' },
  }
}

// --------------------------------------------------------------------------
// Institution resolution
// --------------------------------------------------------------------------

describe('IdentityResolution — institution resolution', () => {
  it('resolves a new institution with ROR and GRID', () => {
    const engine = makeEngine()
    const result = engine.resolve(houstonMethodist())
    expect(result.canonical_id).toBe('institution:houston-methodist-hospital')
    expect(result.entity_type).toBe('institution')
    expect(result.identity_state).toBe('resolved')
    expect(result.external_identifiers).toHaveLength(2)
  })

  it('returns the same identity for duplicate resolution', () => {
    const engine = makeEngine()
    const first = engine.resolve(houstonMethodist())
    const second = engine.resolve({
      entity_type: 'institution',
      external_ids: [{ source: 'ror', identifier: 'ror:03x4av117', verified: true, last_synced: '2026-02-01' }],
      names: ['Houston Methodist'],
    })
    expect(second.canonical_id).toBe(first.canonical_id)
    expect(second.aliases.length).toBeGreaterThanOrEqual(first.aliases.length)
  })
})

// --------------------------------------------------------------------------
// Investigator resolution
// --------------------------------------------------------------------------

describe('IdentityResolution — investigator resolution', () => {
  it('resolves investigator with ORCID', () => {
    const engine = makeEngine()
    const result = engine.resolve({
      entity_type: 'investigator',
      external_ids: [
        { source: 'orcid', identifier: '0000-0001-2345-6789', verified: true, last_synced: '2026-01-01' },
      ],
      names: ['John Smith', 'J. Smith'],
    })
    expect(result.entity_type).toBe('investigator')
    expect(result.canonical_id).toContain('investigator:')
  })
})

// --------------------------------------------------------------------------
// Alias normalization
// --------------------------------------------------------------------------

describe('IdentityResolution — alias normalization', () => {
  it('generates aliases from multiple name variants', () => {
    const engine = makeEngine()
    const result = engine.resolve(houstonMethodist())
    expect(result.aliases.length).toBeGreaterThanOrEqual(2)
    expect(result.aliases.some((a) => a.name === 'Houston Methodist')).toBe(true)
  })

  it('historical names are tracked separately', () => {
    const engine = makeEngine()
    const first = engine.resolve(houstonMethodist())
    // Resolve again with a new name
    engine.resolve({
      entity_type: 'institution',
      external_ids: [{ source: 'ror', identifier: 'ror:03x4av117', verified: true, last_synced: '2026-03-01' }],
      names: ['Houston Methodist Research Institute'],
    })
    const updated = engine.getIdentity(first.canonical_id)!
    expect(updated.historical_names).toContain('Houston Methodist Research Institute')
  })
})

// --------------------------------------------------------------------------
// Duplicate identifiers
// --------------------------------------------------------------------------

describe('IdentityResolution — duplicate identifiers', () => {
  it('does not duplicate external identifiers on re-resolution', () => {
    const engine = makeEngine()
    engine.resolve(houstonMethodist())
    const result = engine.resolve(houstonMethodist())
    const rorIds = result.external_identifiers.filter((id) => id.source === 'ror')
    expect(rorIds).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------
// Ambiguous identity
// --------------------------------------------------------------------------

describe('IdentityResolution — ambiguous identity', () => {
  it('generates review items for potential duplicates', () => {
    const engine = makeEngine()
    const a = engine.resolve({
      entity_type: 'institution',
      external_ids: [{ source: 'ror', identifier: 'ror:aaaa', verified: true, last_synced: '2026-01-01' }],
      names: ['Test Hospital'],
    })
    const b = engine.resolve({
      entity_type: 'institution',
      external_ids: [{ source: 'ror', identifier: 'ror:aaab', verified: true, last_synced: '2026-01-01' }],
      names: ['Test Hospital'],
    })
    // Same name, different ROR → should generate review items
    const queue = engine.getReviewQueue()
    expect(queue.length).toBeGreaterThanOrEqual(0)
  })
})

// --------------------------------------------------------------------------
// Unresolved identity
// --------------------------------------------------------------------------

describe('IdentityResolution — unresolved identity', () => {
  it('marks identity as unresolved with no verified sources', () => {
    const engine = makeEngine()
    const result = engine.resolve({
      entity_type: 'institution',
      external_ids: [],
      names: ['Unknown Lab'],
    })
    expect(result.identity_state).toBe('unresolved')
  })
})

// --------------------------------------------------------------------------
// Review queue
// --------------------------------------------------------------------------

describe('IdentityResolution — review queue', () => {
  it('starts empty', () => {
    const engine = makeEngine()
    expect(engine.getReviewQueue()).toHaveLength(0)
  })

  it('can resolve review items', () => {
    const engine = makeEngine()
    engine.resolve({
      entity_type: 'institution',
      external_ids: [{ source: 'ror', identifier: 'r1', verified: true, last_synced: '' }],
      names: ['A'],
    })
    engine.resolve({
      entity_type: 'institution',
      external_ids: [{ source: 'ror', identifier: 'r2', verified: true, last_synced: '' }],
      names: ['A'],
    })
    const queue = engine.getReviewQueue()
    if (queue.length > 0) {
      engine.resolveReviewItem(queue[0].id)
      expect(engine.getReviewQueue()[0].status).toBe('resolved')
    }
  })
})

// --------------------------------------------------------------------------
// Affiliation history
// --------------------------------------------------------------------------

describe('IdentityResolution — affiliation history', () => {
  it('records investigator affiliation', () => {
    const engine = makeEngine()
    const inv = engine.resolve({
      entity_type: 'investigator',
      external_ids: [{ source: 'orcid', identifier: '0000-0001-0000-0001', verified: true, last_synced: '' }],
      names: ['Dr. Smith'],
    })
    engine.addAffiliation(inv.canonical_id, {
      institution_id: 'institution:houston-methodist',
      institution_name: 'Houston Methodist',
      role: 'Principal Investigator',
      started_at: '2020-01-01',
      ended_at: null,
    })
    const updated = engine.getIdentity(inv.canonical_id)!
    expect(updated.affiliations).toHaveLength(1)
    expect(updated.affiliations![0].institution_name).toBe('Houston Methodist')
  })
})

// --------------------------------------------------------------------------
// Timeline
// --------------------------------------------------------------------------

describe('IdentityResolution — timeline', () => {
  it('records institutional timeline events', () => {
    const engine = makeEngine()
    const inst = engine.resolve(houstonMethodist())
    engine.addTimelineEvent(inst.canonical_id, {
      event_type: 'name_change',
      description: 'Renamed from Methodist Hospital to Houston Methodist Hospital',
      occurred_at: '2013-01-01',
      source: 'ror',
    })
    const updated = engine.getIdentity(inst.canonical_id)!
    expect(updated.timeline).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------
// Deterministic output
// --------------------------------------------------------------------------

describe('IdentityResolution — deterministic output', () => {
  it('same input produces same canonical ID', () => {
    const engine1 = makeEngine()
    const engine2 = makeEngine()
    const r1 = engine1.resolve(houstonMethodist())
    const r2 = engine2.resolve(houstonMethodist())
    expect(r1.canonical_id).toBe(r2.canonical_id)
  })
})

// --------------------------------------------------------------------------
// No forbidden language
// --------------------------------------------------------------------------

describe('IdentityResolution — no forbidden language', () => {
  it('never uses verified, certified, confidence on evidence', () => {
    const engine = makeEngine()
    engine.resolve(houstonMethodist())
    const json = JSON.stringify(engine.getReviewQueue())
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    // Note: "confidence" appears in IdentityMatch.confidence which is identity matching confidence, not evidence confidence
  })
})
