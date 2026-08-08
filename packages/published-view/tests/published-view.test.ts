import { describe, it, expect } from 'vitest'
import { LegacyReadAdapter } from '../src/legacy-adapter.js'
import { PublishedViewService } from '../src/service.js'
import { EvidencePackGenerator } from '../src/evidence-pack.js'

describe('LegacyReadAdapter (28D Compatibility Layer)', () => {
  it('maps legacy claim to PublishedView', () => {
    const adapter = new LegacyReadAdapter()
    const view = adapter.adaptClaim(
      {
        id: 'claim-1',
        claim_type: 'experience',
        category: 'clinical',
        title: 'Phase III Oncology',
        description: 'Completed 2023',
        verification_status: 'kadarn_verified',
        confidence_score: 85,
      },
      'org-1',
      'public',
    )

    expect(view.claim_instance_id).toBe('claim-1')
    expect(view.adapter_version).toBe('legacy-read:1.0.0')
    expect(view.confidence_level).toBe('high')
    expect(view.projection.summary).toBe('Phase III Oncology')
  })

  it('preserves legacy passport JSON shape via toLegacyPassportResponse', () => {
    const adapter = new LegacyReadAdapter()
    const bundle = {
      profile: { id: 'p1', organization_id: 'org-1', headline: 'Headline', public_slug: 'site-a' },
      claims: [{
        id: 'c1', claim_type: 'experience', category: 'clinical',
        title: 'Study X', description: 'Desc', verification_status: 'self_reported',
        confidence_score: 50,
      }],
    }
    const views = adapter.adaptPassport(bundle)
    const response = adapter.toLegacyPassportResponse(bundle, views)

    expect(response.profile.slug).toBe('site-a')
    expect(response.claims[0].title).toBe('Study X')
    expect(response.claims[0].confidence).toBe(50)
  })

  // dashboard-next-best-action CRITICAL #1 fix (verify-report id 1010).
  // `toLegacyPassportResponse` previously exposed only a bare
  // `confidence: number` — the Site Passport page rendered that (well, a
  // mismatched field name pointing at it) as a bare "Confidence n/100" with
  // zero explanation, violating spec's "Bare label is invalid" scenario.
  // These fields are ADDITIVE — `confidence` above stays a number
  // unchanged (legacy-equivalence gate, tests/phase8/legacy-equivalence/
  // passport.equivalence.test.ts, depends on that exact shape).
  it('additionally exposes confidenceLevel + confidenceExplanation, never a bare score alone', () => {
    const adapter = new LegacyReadAdapter()
    const bundle = {
      profile: { id: 'p1', organization_id: 'org-1', headline: 'Headline', public_slug: 'site-a' },
      claims: [{
        id: 'c1', claim_type: 'experience', category: 'clinical',
        title: 'Study X', description: 'Desc', verification_status: 'kadarn_verified',
        confidence_score: 85, updated_at: '2026-01-15T00:00:00.000Z',
        continuity_evidence_items: [
          { verification_status: 'accepted' },
          { verification_status: 'rejected' },
        ],
        continuity_references: [{ status: 'confirmed' }],
      }],
    }
    const views = adapter.adaptPassport(bundle)
    const response = adapter.toLegacyPassportResponse(bundle, views)
    const claim = response.claims[0] as Record<string, unknown>

    // legacy shape untouched
    expect(claim.confidence).toBe(85)

    // new explanation-bearing state
    expect(claim.confidenceLevel).toBe('High')
    expect(typeof claim.confidenceExplanation).toBe('string')
    expect(claim.confidenceExplanation as string).toContain('Externally confirmed')
    expect(claim.confidenceExplanation as string).toMatch(/supporting evidence/)
    expect(claim.confidenceExplanation as string).toMatch(/contradicting/)
  })

  it('confidenceExplanation never omits a claim with zero linked evidence', () => {
    const adapter = new LegacyReadAdapter()
    const bundle = {
      profile: { id: 'p1', organization_id: 'org-1', headline: 'H', public_slug: 's' },
      claims: [{
        id: 'c1', claim_type: 'x', category: 'y', title: 'T', description: 'D',
        verification_status: 'self_reported', confidence_score: 20,
      }],
    }
    const views = adapter.adaptPassport(bundle)
    const response = adapter.toLegacyPassportResponse(bundle, views)
    const claim = response.claims[0] as Record<string, unknown>

    expect(claim.confidenceLevel).toBe('Insufficient')
    expect(claim.confidenceExplanation as string).toMatch(/no supporting evidence/)
  })
})

describe('PublishedViewService', () => {
  it('routes passport through legacy adapter when enabled', () => {
    const svc = new PublishedViewService({ legacyAdapterEnabled: true })
    const bundle = {
      profile: { id: 'p1', organization_id: 'org-1' },
      claims: [{
        id: 'c1', claim_type: 'experience', category: 'x',
        title: 'T', description: 'D', verification_status: 'self_reported', confidence_score: 40,
      }],
    }
    const response = svc.getPassportResponse(bundle)
    expect(response.claims).toHaveLength(1)
  })
})

describe('EvidencePackGenerator (28F)', () => {
  it('generates pack from published view', () => {
    const adapter = new LegacyReadAdapter()
    const view = adapter.adaptClaim(
      { id: 'c1', claim_type: 'x', category: 'y', title: 'T', description: 'D',
        verification_status: 'self_reported', confidence_score: 70 },
      'org-1',
    )
    const gen = new EvidencePackGenerator()
    const pack = gen.generate({ view, variant: 'public' })
    expect(pack.claim_id).toBe('c1')
    expect(pack.sections.length).toBeGreaterThan(0)
  })
})
