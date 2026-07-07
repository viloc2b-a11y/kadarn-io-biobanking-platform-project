import { describe, expect, it } from 'vitest'
import {
  ASSET_PERSISTENCE,
  ORGANIZATION_ACTOR_TYPE,
  buildOrganizationProvisioningPlan,
  organizationProvisioningRequestSchema,
} from '../../apps/api/src/lib/onboarding-provisioning-plan'

describe('organization provisioning plan', () => {
  it('supports only public organization actor types', () => {
    const validActors = Object.values(ORGANIZATION_ACTOR_TYPE)

    expect(validActors).toEqual(['institution', 'sponsor', 'cro', 'network', 'vendor'])
    expect(validActors).not.toContain('kadarn_internal')
  })

  it('plans institution onboarding with private profile-backed assets', () => {
    const plan = buildOrganizationProvisioningPlan(ORGANIZATION_ACTOR_TYPE.INSTITUTION)

    expect(plan.organizationVisibilityScope).toBe('organization')
    expect(plan.capabilityKeys).toContain('clinical_site')
    expect(plan.primaryWorkspace.kind).toBe('institution_portfolio_workspace')
    expect(plan.actorAssets).toEqual([
      expect.objectContaining({
        key: 'institution_portfolio',
        persistence: ASSET_PERSISTENCE.SITE_CONTINUITY_PROFILE,
      }),
      expect.objectContaining({
        key: 'draft_passport',
        persistence: ASSET_PERSISTENCE.SITE_CONTINUITY_PROFILE,
      }),
      expect.objectContaining({
        key: 'default_workspace',
        persistence: ASSET_PERSISTENCE.DERIVED_WORKSPACE,
      }),
    ])
  })

  it('plans sponsor onboarding with empty sponsor portfolio scope', () => {
    const plan = buildOrganizationProvisioningPlan(ORGANIZATION_ACTOR_TYPE.SPONSOR)

    expect(plan.capabilityKeys).toEqual(['sponsor'])
    expect(plan.primaryWorkspace.kind).toBe('sponsor_workspace')
    expect(plan.actorAssets).toContainEqual(expect.objectContaining({
      key: 'sponsor_portfolio',
      persistence: ASSET_PERSISTENCE.SPONSOR_PORTFOLIO,
    }))
  })

  it('plans workspace initialization without new domain tables for operational actors', () => {
    for (const actor of [
      ORGANIZATION_ACTOR_TYPE.CRO,
      ORGANIZATION_ACTOR_TYPE.NETWORK,
      ORGANIZATION_ACTOR_TYPE.VENDOR,
    ]) {
      const plan = buildOrganizationProvisioningPlan(actor)

      expect(plan.actorAssets).toHaveLength(1)
      expect(plan.actorAssets[0]?.persistence).toBe(ASSET_PERSISTENCE.DERIVED_WORKSPACE)
      expect(plan.primaryWorkspace.status).toBe('initialized')
    }
  })

  it('validates and normalizes provisioning requests', () => {
    const parsed = organizationProvisioningRequestSchema.parse({
      actor_type: 'sponsor',
      organization: {
        name: '  Acme Sponsor  ',
        country: 'us',
        website: '',
      },
      administrator: {
        first_name: '  Ada ',
        last_name: ' Lovelace ',
        email: ' ADA@EXAMPLE.ORG ',
        password: 'Password123',
      },
      legal: {
        terms_accepted: true,
        privacy_acknowledged: true,
      },
    })

    expect(parsed.organization.name).toBe('Acme Sponsor')
    expect(parsed.organization.country).toBe('US')
    expect(parsed.organization.website).toBeNull()
    expect(parsed.administrator.email).toBe('ada@example.org')
  })

  it('rejects Kadarn Internal and missing legal acknowledgements', () => {
    const parsed = organizationProvisioningRequestSchema.safeParse({
      actor_type: 'kadarn_internal',
      organization: { name: 'Kadarn', country: 'US' },
      administrator: {
        first_name: 'Internal',
        last_name: 'Admin',
        email: 'internal@kadarn.test',
        password: 'Password123',
      },
      legal: {
        terms_accepted: false,
        privacy_acknowledged: true,
      },
    })

    expect(parsed.success).toBe(false)
  })
})
