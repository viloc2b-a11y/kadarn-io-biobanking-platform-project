// ==========================================================================
// Evidence Firewall — Tests (Sprint 23C)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { EvidenceFirewall } from '../src/evidence-firewall/engine.js'
import type { EvidencePayload } from '../src/evidence-firewall/types.js'

function makeFirewall(): EvidenceFirewall {
  const fw = new EvidenceFirewall()
  fw.setIdentityLookup(() => ({ exists: true, state: 'resolved' }))
  return fw
}

function validPayload(overrides: Partial<EvidencePayload> = {}): EvidencePayload {
  return {
    id: 'ev-001',
    source_provider: 'pubmed',
    canonical_identity_id: 'institution:test-hospital',
    object_type: 'publication',
    payload: { title: 'A Study on Evidence', publication_date: '2025-01-01', authors: ['Smith, J.'] },
    retrieved_at: new Date().toISOString(),
    metadata: { source: 'pubmed', version: '1.0' },
    ...overrides,
  }
}

// --------------------------------------------------------------------------

describe('EvidenceFirewall — accepted evidence', () => {
  it('accepts valid evidence', () => {
    const fw = makeFirewall()
    const result = fw.process(validPayload())
    expect(result.decision).toBe('accepted')
    expect(result.validation_results).toHaveLength(6)
  })

  it('increments accepted counter', () => {
    const fw = makeFirewall()
    fw.process(validPayload())
    expect(fw.getStatus().accepted).toBe(1)
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — accepted with warning', () => {
  it('accepts with warning when metadata is sparse', () => {
    const fw = makeFirewall()
    const result = fw.process(validPayload({ metadata: {} }))
    expect(result.decision).toBe('accepted_with_warning')
  })

  it('duplicate evidence accepted with warning', () => {
    const fw = makeFirewall()
    fw.process(validPayload())
    const result = fw.process(validPayload())
    expect(result.decision).toBe('accepted_with_warning')
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — rejected evidence', () => {
  it('rejects unsupported provider', () => {
    const fw = makeFirewall()
    const result = fw.process(validPayload({ source_provider: 'unsupported.io' }))
    expect(result.decision).toBe('rejected')
  })

  it('rejects empty payload', () => {
    const fw = makeFirewall()
    const result = fw.process(validPayload({ payload: {} }))
    expect(result.decision).toBe('rejected')
  })

  it('rejects missing identity', () => {
    const fw = makeFirewall()
    fw.setIdentityLookup(() => ({ exists: false, state: 'unresolved' }))
    const result = fw.process(validPayload())
    expect(result.decision).toBe('rejected')
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — temporal violation', () => {
  it('rejects publication date in the future', () => {
    const fw = makeFirewall()
    const result = fw.process(validPayload({
      id: 'ev-future',
      payload: { title: 'Future Study', publication_date: '2099-01-01' },
    }))
    expect(result.decision).toBe('rejected')
    expect(fw.getQuarantine()).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — structural validation', () => {
  it('rejects study without identifier', () => {
    const fw = makeFirewall()
    const result = fw.process(validPayload({ id: 'ev-study', object_type: 'study', payload: { title: 'X' } }))
    expect(result.decision).toBe('rejected')
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — cross-source corroboration', () => {
  it('flags title mismatch across providers', () => {
    const fw = makeFirewall()
    fw.process(validPayload({ id: 'pub-1', source_provider: 'pubmed', payload: { title: 'Original Title' } }))
    const result = fw.process(validPayload({ id: 'pub-1', source_provider: 'crossref', payload: { title: 'Different Title' } }))
    expect(result.decision).toBe('needs_review')
    expect(fw.getReviewItems()).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — quarantine', () => {
  it('quarantines rejected evidence', () => {
    const fw = makeFirewall()
    fw.process(validPayload({ source_provider: 'unsupported.io', id: 'bad-1' }))
    fw.process(validPayload({ id: 'bad-2', payload: { publication_date: '2099-01-01' } }))
    expect(fw.getQuarantine()).toHaveLength(1) // Only temporal violations go to quarantine
  })

  it('quarantine preserves original payload', () => {
    const fw = makeFirewall()
    const p = validPayload({ id: 'q-1', payload: { publication_date: '2099-01-01' } })
    fw.process(p)
    const q = fw.getQuarantine()[0]
    expect(q.original_payload.id).toBe('q-1')
    expect(q.firewall_state).toBe('rejected')
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — review queue', () => {
  it('generates review items for conflicts', () => {
    const fw = makeFirewall()
    fw.process(validPayload({ id: 'r1', source_provider: 'pubmed', payload: { title: 'A' } }))
    fw.process(validPayload({ id: 'r1', source_provider: 'crossref', payload: { title: 'B' } }))
    expect(fw.getReviewItems()).toHaveLength(1)
  })

  it('can resolve review items', () => {
    const fw = makeFirewall()
    fw.process(validPayload({ id: 'r2', source_provider: 'pubmed', payload: { title: 'A' } }))
    fw.process(validPayload({ id: 'r2', source_provider: 'crossref', payload: { title: 'B' } }))
    const items = fw.getReviewItems()
    fw.resolveReview(items[0].id)
    expect(fw.getReviewItems()[0].status).toBe('resolved')
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — status counters', () => {
  it('tracks all decision counts', () => {
    const fw = makeFirewall()
    fw.process(validPayload({ id: 'a', metadata: {} })) // accepted_with_warning
    fw.process(validPayload({ id: 'b', source_provider: 'bad' })) // rejected
    const status = fw.getStatus()
    expect(status.total_processed).toBe(2)
    expect(status.accepted_with_warning).toBe(1)
    expect(status.rejected).toBe(1)
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — no evidence mutation', () => {
  it('does not modify the original payload', () => {
    const fw = makeFirewall()
    const original = validPayload()
    const copy = JSON.parse(JSON.stringify(original))
    fw.process(original)
    expect(original).toEqual(copy)
  })
})

// --------------------------------------------------------------------------

describe('EvidenceFirewall — no forbidden language', () => {
  it('never uses confidence, verified, certified', () => {
    const fw = makeFirewall()
    fw.process(validPayload())
    const json = JSON.stringify(fw.getStatus())
    expect(json).not.toContain('confidence')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
  })
})
