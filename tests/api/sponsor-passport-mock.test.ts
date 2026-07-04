/**
 * RC-10.3 — Sponsor passport mock store unit tests (no HTTP, no DB).
 */

import { describe, it, expect } from 'vitest'
import {
  getPortfolioIndex,
  getInstitutionalPassport,
  getClaimProvenanceDetail,
  listInstitutionIds,
} from '../../apps/api/src/lib/sponsor-passport/mock-store'

const FORBIDDEN_FIELD_NAMES = [
  'score',
  'overallScore',
  'confidence_score',
  'verification_status',
  'verified',
  'certified',
  'rank',
  'ranking',
  'completeness',
  'public_slug',
  'trustLevel',
  'trustScore',
]

function collectFieldNames(value: unknown, names: Set<string> = new Set(), depth = 0): Set<string> {
  if (depth > 12 || value === null || value === undefined) return names
  if (Array.isArray(value)) {
    for (const item of value) collectFieldNames(item, names, depth + 1)
    return names
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      names.add(key)
      collectFieldNames(nested, names, depth + 1)
    }
  }
  return names
}

describe('Sponsor passport mock store (RC-10.3)', () => {
  it('returns portfolio index with three RC-10.1 institutions', () => {
    const index = getPortfolioIndex()
    expect(index.items).toHaveLength(3)
    expect(listInstitutionIds()).toEqual([
      'inst-st-marys',
      'inst-barcelona-oncology',
      'inst-nordic-biobank',
    ])
  })

  it('returns full passport detail for inst-st-marys', () => {
    const passport = getInstitutionalPassport('inst-st-marys')
    expect(passport).toBeDefined()
    expect(passport!.passportId).toBe('passport-inst-st-marys')
    expect(passport!.claims.length).toBeGreaterThanOrEqual(1)
    expect(passport!.identity.names.length).toBeGreaterThan(0)
    expect(passport!.capabilities.length).toBeGreaterThan(0)
    expect(passport!.recommendations.length).toBeGreaterThan(0)
    expect(passport!.history.length).toBeGreaterThan(0)
    expect(passport!.claims[0].provenance.documentTitle).toBeTruthy()
  })

  it('returns undefined for unknown institution', () => {
    expect(getInstitutionalPassport('inst-unknown')).toBeUndefined()
  })

  it('returns claim provenance detail with evidence tree nodes', () => {
    const detail = getClaimProvenanceDetail('inst-st-marys', 'claim-pbmc-001')
    expect(detail).toBeDefined()
    expect(detail!.claimId).toBe('claim-pbmc-001')
    expect(detail!.minimal.excerpt).toBeTruthy()
    expect(detail!.evidenceNodes.length).toBeGreaterThanOrEqual(1)
    expect(detail!.sourceDocuments.length).toBe(1)
  })

  it('includes contradicting nodes for contested claims', () => {
    const detail = getClaimProvenanceDetail('inst-st-marys', 'claim-cold-001')
    expect(detail!.contested).toBe(true)
    expect(detail!.contradictingNodeIds?.length).toBeGreaterThan(0)
    expect(detail!.evidenceNodes.some((n) => !n.supportsClaim)).toBe(true)
  })

  it('returns undefined provenance for unknown claim', () => {
    expect(getClaimProvenanceDetail('inst-st-marys', 'claim-missing')).toBeUndefined()
  })

  it('does not expose forbidden lexicon fields in fixtures', () => {
    const payloads = [
      getPortfolioIndex(),
      getInstitutionalPassport('inst-st-marys'),
      getClaimProvenanceDetail('inst-st-marys', 'claim-pbmc-001'),
    ]

    for (const payload of payloads) {
      const fields = collectFieldNames(payload)
      for (const forbidden of FORBIDDEN_FIELD_NAMES) {
        expect(fields.has(forbidden)).toBe(false)
      }
    }
  })

  it('uses enum confidence labels not numeric scores in claims', () => {
    const passport = getInstitutionalPassport('inst-barcelona-oncology')!
    for (const claim of passport.claims) {
      expect(['High', 'Moderate', 'Low', 'Insufficient']).toContain(claim.confidence)
      expect(typeof claim.confidence).toBe('string')
    }
  })
})
