// Discovery Workbench — pure helper unit tests
import { describe, it, expect } from 'vitest'
import {
  candidateStateTone,
  excerpt,
  formatDiscoveryConfidence,
  labelize,
  parseEnrichmentPayload,
} from '../../apps/web/src/components/discovery/lib'

describe('candidateStateTone', () => {
  it('maps accepted-like states to green', () => {
    expect(candidateStateTone('ACCEPTED')).toBe('green')
    expect(candidateStateTone('enriched')).toBe('green')
  })

  it('maps rejected-like states to red', () => {
    expect(candidateStateTone('REJECTED')).toBe('red')
    expect(candidateStateTone('ARCHIVED')).toBe('red')
  })

  it('maps in-review states to amber', () => {
    expect(candidateStateTone('DEFERRED')).toBe('amber')
    expect(candidateStateTone('NEEDS_MORE_EVIDENCE')).toBe('amber')
    expect(candidateStateTone('PROPOSED')).toBe('amber')
  })

  it('falls back to default for unknown states', () => {
    expect(candidateStateTone('SOMETHING_ELSE')).toBe('default')
    expect(candidateStateTone('')).toBe('default')
  })
})

describe('formatDiscoveryConfidence', () => {
  it('renders numeric confidence exactly as provided (no scaling)', () => {
    expect(formatDiscoveryConfidence(0.82)).toBe('0.82')
    expect(formatDiscoveryConfidence(1)).toBe('1')
    expect(formatDiscoveryConfidence(0)).toBe('0')
  })

  it('passes through string values', () => {
    expect(formatDiscoveryConfidence('0.5')).toBe('0.5')
  })

  it('renders a dash for missing or invalid values', () => {
    expect(formatDiscoveryConfidence(null)).toBe('—')
    expect(formatDiscoveryConfidence(undefined)).toBe('—')
    expect(formatDiscoveryConfidence(Number.NaN)).toBe('—')
    expect(formatDiscoveryConfidence('')).toBe('—')
  })
})

describe('labelize', () => {
  it('replaces underscores with spaces', () => {
    expect(labelize('NEEDS_MORE_EVIDENCE')).toBe('NEEDS MORE EVIDENCE')
    expect(labelize('evidence_candidate')).toBe('evidence candidate')
  })

  it('trims surrounding whitespace', () => {
    expect(labelize(' _padded_ ')).toBe('padded')
  })
})

describe('parseEnrichmentPayload', () => {
  it('accepts a valid JSON object', () => {
    const result = parseEnrichmentPayload('{"field": "value", "n": 2}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ field: 'value', n: 2 })
    }
  })

  it('rejects empty input', () => {
    const result = parseEnrichmentPayload('   ')
    expect(result.ok).toBe(false)
  })

  it('rejects invalid JSON', () => {
    const result = parseEnrichmentPayload('{not json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('valid JSON')
  })

  it('rejects non-object JSON values', () => {
    expect(parseEnrichmentPayload('42').ok).toBe(false)
    expect(parseEnrichmentPayload('"text"').ok).toBe(false)
    expect(parseEnrichmentPayload('[1,2]').ok).toBe(false)
    expect(parseEnrichmentPayload('null').ok).toBe(false)
  })
})

describe('excerpt', () => {
  it('returns short text unchanged', () => {
    expect(excerpt('short text')).toBe('short text')
  })

  it('collapses internal whitespace', () => {
    expect(excerpt('a  b\n\tc')).toBe('a b c')
  })

  it('truncates long text with an ellipsis within the limit', () => {
    const long = 'x'.repeat(500)
    const result = excerpt(long, 100)
    expect(result.length).toBeLessThanOrEqual(100)
    expect(result.endsWith('…')).toBe(true)
  })
})
