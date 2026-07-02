// ==========================================================================
// Visibility Policy Engine — Tests (Sprint 24A)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { VisibilityPolicyEngine } from '../src/visibility-policy/engine.js'
import type { ActorType, VisibilityPolicy } from '../src/visibility-policy/engine.js'

function makeEngine(): VisibilityPolicyEngine {
  return new VisibilityPolicyEngine()
}

function makePolicy(overrides: Partial<VisibilityPolicy> = {}): VisibilityPolicy {
  return {
    policy_id: 'pol-001', claim_id: 'claim:plasma',
    actor_type: 'sponsor', visibility_level: 'discovery',
    can_view_summary: true, can_view_evidence: false,
    can_view_identity: false, can_view_private_evidence: false,
    can_download: false, expires_at: null, metadata: {},
    ...overrides,
  }
}

// --------------------------------------------------------------------------

describe('VisibilityPolicy — public actor', () => {
  it('public sees nothing by default', () => {
    const engine = makeEngine()
    const res = engine.resolve('public', 'claim:x')
    expect(res.resolved_level).toBe('hidden')
    expect(res.can_view_identity).toBe(false)
    expect(res.can_view_summary).toBe(false)
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — sponsor actor', () => {
  it('sponsor gets discovery level by default', () => {
    const engine = makeEngine()
    const res = engine.resolve('sponsor', 'claim:x')
    expect(res.resolved_level).toBe('discovery')
    expect(res.can_view_summary).toBe(true)
    expect(res.can_view_evidence).toBe(false)
    expect(res.can_view_identity).toBe(false)
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — institution actor', () => {
  it('institution sees own claims', () => {
    const engine = makeEngine()
    const res = engine.resolve('institution', 'claim:x')
    expect(res.resolved_level).toBe('restricted')
    expect(res.can_view_identity).toBe(true)
    expect(res.can_view_evidence).toBe(true)
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — kadarn internal', () => {
  it('kadarn_internal has full access', () => {
    const engine = makeEngine()
    const res = engine.resolve('kadarn_internal', 'claim:x')
    expect(res.resolved_level).toBe('private')
    expect(res.can_view_private_evidence).toBe(true)
    expect(res.can_download).toBe(true)
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — explicit policies', () => {
  it('explicit policy overrides default', () => {
    const engine = makeEngine()
    engine.setPolicy(makePolicy({ claim_id: 'claim:plasma', visibility_level: 'restricted' }))
    const res = engine.resolve('sponsor', 'claim:plasma')
    expect(res.resolved_level).toBe('restricted')
    expect(res.can_view_evidence).toBe(true)
  })

  it('explicit policy hides sponsor when set to hidden', () => {
    const engine = makeEngine()
    engine.setPolicy(makePolicy({ claim_id: 'claim:secret', visibility_level: 'hidden' }))
    const res = engine.resolve('sponsor', 'claim:secret')
    expect(res.resolved_level).toBe('hidden')
    expect(res.can_view_summary).toBe(false)
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — identity protection', () => {
  it('sponsor never sees identity by default', () => {
    const engine = makeEngine()
    const res = engine.resolve('sponsor', 'claim:x')
    expect(res.can_view_identity).toBe(false)
  })

  it('public never sees identity', () => {
    const engine = makeEngine()
    expect(engine.resolve('public', 'claim:x').can_view_identity).toBe(false)
  })

  it('institution always sees own identity', () => {
    const engine = makeEngine()
    expect(engine.resolve('institution', 'claim:x').can_view_identity).toBe(true)
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — expiration', () => {
  it('expired policy falls back to default', () => {
    const engine = makeEngine()
    engine.setPolicy(makePolicy({
      claim_id: 'claim:exp', visibility_level: 'restricted',
      expires_at: '2020-01-01',
    }))
    const res = engine.resolve('sponsor', 'claim:exp')
    expect(res.resolved_level).toBe('discovery')
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — institutional override', () => {
  it('override changes visibility level', () => {
    const engine = makeEngine()
    engine.setOverride('claim:over', { visibility_level: 'public' })
    const res = engine.resolve('sponsor', 'claim:over')
    expect(res.resolved_level).toBe('public')
    expect(res.reason).toContain('override')
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — policy precedence', () => {
  it('explicit policy wins over override', () => {
    const engine = makeEngine()
    engine.setPolicy(makePolicy({ claim_id: 'claim:pri', visibility_level: 'restricted' }))
    engine.setOverride('claim:pri', { visibility_level: 'hidden' })
    const res = engine.resolve('sponsor', 'claim:pri')
    expect(res.resolved_level).toBe('restricted') // policy wins
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — resolveAll', () => {
  it('resolves multiple claims at once', () => {
    const engine = makeEngine()
    const results = engine.resolveAll('sponsor', ['claim:a', 'claim:b', 'claim:c'])
    expect(results).toHaveLength(3)
    expect(results.every((r) => r.actor === 'sponsor')).toBe(true)
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — deterministic output', () => {
  it('same input always produces same output', () => {
    const e1 = makeEngine()
    const e2 = makeEngine()
    expect(e1.resolve('sponsor', 'claim:x')).toEqual(e2.resolve('sponsor', 'claim:x'))
  })
})

// --------------------------------------------------------------------------

describe('VisibilityPolicy — no forbidden language', () => {
  it('never uses confidence, verified, certified', () => {
    const engine = makeEngine()
    const json = JSON.stringify(engine.getPolicies())
    expect(json).not.toContain('confidence')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
  })
})
