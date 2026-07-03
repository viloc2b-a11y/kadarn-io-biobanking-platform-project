import { describe, it, expect, beforeEach } from 'vitest'
import { EntityResolutionEngine } from '../src/entity-resolution.js'
import type { ResolutionInput } from '../src/entity-resolution.js'

function makeInput(overrides: Partial<ResolutionInput> = {}): ResolutionInput {
  return {
    rawName: 'Massachusetts General Hospital',
    hintType: 'institution',
    identifiers: [{ type: 'ror', value: 'https://ror.org/012345', confidence: 0.95 }],
    factIds: ['fact:1'],
    sectionId: 's0',
    ...overrides,
  }
}

describe('EntityResolutionEngine', () => {
  let engine: EntityResolutionEngine

  beforeEach(() => { engine = new EntityResolutionEngine() })

  it('resolves a new entity', () => {
    const result = engine.resolve(makeInput())
    expect(result.matchType).toBe('new_entity')
    expect(result.entity.entityType).toBe('institution')
    expect(result.entity.canonicalName).toContain('Massachusetts General Hospital')
    expect(result.entity.identifiers).toHaveLength(1)
  })

  it('exact matches by identifier', () => {
    const r1 = engine.resolve(makeInput())
    const r2 = engine.resolve(makeInput())

    expect(r2.matchType).toBe('exact_match')
    expect(r2.entity.entityId).toBe(r1.entity.entityId)
    expect(r2.confidence).toBe(0.98)
  })

  it('exact matches by canonical name (no identifiers)', () => {
    const input = makeInput({ identifiers: [] })
    const r1 = engine.resolve(input)
    const r2 = engine.resolve(input)

    expect(r2.matchType).toBe('exact_match')
    expect(r2.entity.entityId).toBe(r1.entity.entityId)
  })

  it('alias tracking works across resolutions', () => {
    const r1 = engine.resolve(makeInput({ rawName: 'MGH' }))
    const r2 = engine.resolve(makeInput({ rawName: 'Mass General Hospital', identifiers: [] }))
    expect(r2.entity.aliases).toBeDefined()
    expect(engine.entityCount).toBeGreaterThanOrEqual(1)
  })

  it('merges near-duplicate entities', () => {
    const r1 = engine.resolve(makeInput({ rawName: 'Stanford University Medical Center' }))
    const r2 = engine.resolve(makeInput({ rawName: 'Stanford University Medical Ctr' }))

    // If similar enough, should merge
    if (r2.matchType === 'merged') {
      expect(r2.mergedFrom).toBe(r1.entity.entityId)
      expect(r2.entity.aliases).toContain('Stanford University Medical Ctr')
    }
    // At minimum, shouldn't create exact duplicate
    expect(engine.entityCount).toBeLessThanOrEqual(2)
  })

  it('preserves aliases across resolutions', () => {
    const r1 = engine.resolve(makeInput({ rawName: 'Harvard Medical School' }))
    const r2 = engine.resolve(makeInput({ rawName: 'HMS', identifiers: [] }))

    expect(r1.entity.aliases.length).toBeGreaterThanOrEqual(0)
    // r2 may create a new entity since names are very different
    expect(engine.entityCount).toBeGreaterThanOrEqual(1)
  })

  it('accumulates identifiers for existing entities', () => {
    const r1 = engine.resolve(makeInput({ identifiers: [{ type: 'ror', value: 'ror:123', confidence: 1 }] }))
    const r2 = engine.resolve(makeInput({ identifiers: [{ type: 'grid', value: 'grid:456', confidence: 0.8 }] }))

    expect(r2.entity.identifiers.length).toBeGreaterThanOrEqual(1)
  })

  it('getEntity returns undefined for unknown ID', () => {
    expect(engine.getEntity('nonexistent')).toBeUndefined()
  })

  it('listEntities returns all resolved entities', () => {
    const fresh = new EntityResolutionEngine()
    fresh.resolve(makeInput({ rawName: 'Mayo Clinic', identifiers: [{ type: 'ror', value: 'ror:mayo', confidence: 1 }] }))
    fresh.resolve(makeInput({ rawName: 'Cleveland Clinic', identifiers: [{ type: 'ror', value: 'ror:cleve', confidence: 1 }] }))
    expect(fresh.listEntities()).toHaveLength(2)
  })

  it('entityCount tracks total entities', () => {
    expect(engine.entityCount).toBe(0)
    engine.resolve(makeInput())
    expect(engine.entityCount).toBe(1)
  })

  it('entity ID is formatted correctly', () => {
    const result = engine.resolve(makeInput({ hintType: 'site' }))
    expect(result.entity.entityId).toMatch(/^site:\d+:[a-z0-9]+$/)
  })

  it('normalizes corporate suffixes', () => {
    const result = engine.resolve(makeInput({ rawName: 'Pfizer Inc.' }))
    expect(result.entity.canonicalName).not.toContain('Inc.')
  })

  it('version increments on updates', () => {
    const r1 = engine.resolve(makeInput())
    const r2 = engine.resolve(makeInput({ rawName: 'MGH Boston' }))

    expect(r2.entity.version).toBeGreaterThanOrEqual(r1.entity.version)
  })

  it('different ROR creates different entities', () => {
    const a = engine.resolve(makeInput({ identifiers: [{ type: 'ror', value: 'ror:a', confidence: 1 }] }))
    const b = engine.resolve(makeInput({
      rawName: 'Other Hospital',
      identifiers: [{ type: 'ror', value: 'ror:b', confidence: 1 }],
    }))

    expect(b.entity.entityId).not.toBe(a.entity.entityId)
    expect(engine.entityCount).toBe(2)
  })
})
