import { describe, it, expect } from 'vitest'
import { LegacyReadAdapter } from '@kadarn/published-view'

/**
 * Legacy Equivalence Validation Gate (28J → 28K)
 * Golden fixture — expand with staging snapshots as 28D progresses.
 */
describe('Passport legacy equivalence', () => {
  const goldenLegacy = {
    profile: {
      id: 'profile-golden-1',
      organization_id: 'org-golden-1',
      headline: 'Regional Biobank',
      summary: 'Leading biospecimen facility',
      public_slug: 'regional-biobank',
    },
    claims: [
      {
        id: 'claim-golden-1',
        claim_type: 'biospecimen_collection',
        category: 'capability',
        title: '500K plasma samples',
        description: 'Longitudinal biobank collection',
        verification_status: 'kadarn_verified',
        confidence_score: 88,
      },
    ],
  }

  it('Published View adapter preserves semantic passport fields', () => {
    const adapter = new LegacyReadAdapter()
    const views = adapter.adaptPassport(goldenLegacy, 'public')
    const response = adapter.toLegacyPassportResponse(goldenLegacy, views)

    expect(response.profile.headline).toBe(goldenLegacy.profile.headline)
    expect(response.profile.slug).toBe(goldenLegacy.profile.public_slug)
    expect(response.claims).toHaveLength(1)
    expect(response.claims[0].id).toBe('claim-golden-1')
    expect(response.claims[0].title).toBe('500K plasma samples')
    expect(response.claims[0].confidence).toBe(88)
    expect(response.claims[0].verification).toBe('Externally confirmed')
  })

  it('view projection carries legacy verification_status in attributes', () => {
    const adapter = new LegacyReadAdapter()
    const view = adapter.adaptClaim(goldenLegacy.claims[0], goldenLegacy.profile.organization_id)
    expect(view.projection.attributes.verification_status).toBe('kadarn_verified')
    expect(view.adapter_version).toBe('legacy-read:1.0.0')
  })
})
