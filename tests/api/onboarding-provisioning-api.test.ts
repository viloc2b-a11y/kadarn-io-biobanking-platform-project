import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const ROUTE = join(
  ROOT,
  'apps',
  'api',
  'src',
  'app',
  'api',
  'v1',
  'onboarding',
  'organization',
  'route.ts',
)
const SERVICE = join(ROOT, 'apps', 'api', 'src', 'lib', 'onboarding-provisioning.ts')

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('organization provisioning API', () => {
  it('exposes a public rate-limited route without requiring existing auth', () => {
    const route = read(ROUTE)

    expect(route).toContain('export const POST')
    expect(route).toContain('rateLimit(PUBLIC_RATE_LIMIT')
    expect(route).toContain('withErrorHandling')
    expect(route).toContain('organizationProvisioningRequestSchema.safeParse')
    expect(route).toContain('provisionOrganizationFirst(parsed.data)')
    expect(route).not.toContain('withAuth')
  })

  it('executes the organization-first provisioning sequence', () => {
    const service = read(SERVICE)
    const sequence = [
      'createAuthUser',
      'ensureUserProfile',
      'createOrganization',
      'createMembership',
      'assignOwnerRole',
      'assignCapabilities',
      'setActiveOrganization',
      'initializeActorAssets',
    ]

    for (const step of sequence) {
      expect(service).toContain(step)
    }

    expect(service.indexOf('createAuthUser')).toBeLessThan(service.indexOf('createOrganization'))
    expect(service.indexOf('createOrganization')).toBeLessThan(service.indexOf('createMembership'))
    expect(service.indexOf('createMembership')).toBeLessThan(service.indexOf('assignOwnerRole'))
    expect(service.indexOf('assignOwnerRole')).toBeLessThan(service.indexOf('assignCapabilities'))
  })

  it('reuses existing models and avoids duplicate permission systems', () => {
    const service = read(SERVICE)

    expect(service).toContain(".from('organizations')")
    expect(service).toContain(".from('organization_memberships')")
    expect(service).toContain(".from('membership_roles')")
    expect(service).toContain(".from('organization_roles')")
    expect(service).toContain(".from('organization_capability_types')")
    expect(service).toContain(".from('organization_capabilities')")
    expect(service).toContain(".from('sponsor_portfolios')")
    expect(service).toContain(".from('site_continuity_profiles')")
    expect(service).not.toContain('CREATE TABLE')
    expect(service).not.toContain('platform_permissions')
  })

  it('keeps sharing and marketplace visibility disabled by default', () => {
    const service = read(SERVICE)

    expect(service).toContain("visibility_scope: 'organization'")
    expect(service).toContain("passport_visibility: 'private'")
    expect(service).toContain('starts_empty: true')
    expect(service).not.toContain("visibility_scope: 'public'")
    expect(service).not.toContain('sponsor_portfolio_memberships')
  })

  it('has rollback protection for partial provisioning failures', () => {
    const service = read(SERVICE)

    expect(service).toContain('rollbackProvisioning')
    expect(service).toContain("db.from('organizations').delete()")
    expect(service).toContain('db.auth.admin.deleteUser')
  })
})
