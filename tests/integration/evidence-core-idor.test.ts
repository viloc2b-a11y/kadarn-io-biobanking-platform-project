// ==========================================================================
// Security fix regression — Evidence Core IDOR (Finding 2)
// ==========================================================================
// packages/evidence-core/src/api.ts previously overrode ctx.organizationId
// with a client-supplied input.organizationId, and
// apps/api/.../evidence-core/claims/route.ts read organizationId straight
// from the request body. Any authenticated member of Org A could create
// Claims owned by Org B.
//
// Fix: organization ownership always comes from ctx (the authenticated
// session, resolved server-side via requireValidatedActiveOrg), never from
// client input. This test asserts the fix statically (no live Supabase
// required) by checking that:
//   1. ApiCreateClaimInput no longer accepts organizationId.
//   2. apiCreateClaim no longer overrides ctx.organizationId from input.
//   3. The claims route derives organizationId via requireValidatedActiveOrg,
//      not from the request body.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function read(relPath: string): string {
  return readFileSync(resolve(root, relPath), 'utf-8')
}

describe('Evidence Core — organizationId cannot be supplied by the client', () => {
  const apiSource = read('packages/evidence-core/src/api.ts')

  it('ApiCreateClaimInput no longer declares an organizationId field', () => {
    const interfaceMatch = apiSource.match(/export interface ApiCreateClaimInput \{[\s\S]*?\n\}/)
    expect(interfaceMatch).not.toBeNull()
    expect(interfaceMatch![0]).not.toContain('organizationId')
  })

  it('apiCreateClaim passes ctx straight through to the lifecycle service (no body override)', () => {
    expect(apiSource).not.toContain('const claimCtx = { ...ctx, organizationId: input.organizationId }')
    expect(apiSource).toMatch(/lifecycleCreateClaim\(db, ctx, command\)/)
  })

  const routeSource = read('apps/api/src/app/api/v1/evidence-core/claims/route.ts')

  it('POST /claims derives organizationId via requireValidatedActiveOrg, not body.organizationId', () => {
    expect(routeSource).toContain('requireValidatedActiveOrg')
    expect(routeSource).not.toMatch(/organizationId:\s*body\.organizationId/)
  })

  it('GET /claims derives organizationId via requireValidatedActiveOrg, not JWT-cached metadata alone', () => {
    const getHandler = routeSource.slice(routeSource.indexOf('export const GET'))
    expect(getHandler).toContain('requireValidatedActiveOrg')
    expect(getHandler).not.toContain('user.user_metadata?.active_org_id as string ?? \'\'')
  })
})

describe('Evidence Core identity resolution — no permanently-empty shared state', () => {
  it('identity/resolve route returns 501 instead of resolving against empty module-level state', () => {
    const source = read('apps/api/src/app/api/v1/evidence-core/identity/resolve/route.ts')
    expect(source).not.toContain('const knownInstitutions')
    expect(source).not.toContain('const crossSourceIndex')
    expect(source).toContain('501')
  })
})

// ==========================================================================
// Continuity routes — same IDOR pattern, extended fix (coordinator follow-up)
// ==========================================================================
// apps/api/.../v1/continuity/claims/route.ts (GET+POST),
// claims/[id]/route.ts (PATCH), claims/[id]/evidence/route.ts (POST), and
// claims/[id]/references/route.ts (POST) all previously accepted
// body.organizationId (or a query param) and fell back to
// user.user_metadata?.active_org_id — both client-influenced. Fixed the
// same way as evidence-core: organizationId is always resolved via
// requireValidatedActiveOrg(user), never taken from the request.
// ==========================================================================

describe('Continuity claims — organizationId cannot be supplied by the client', () => {
  it('claims/route.ts (GET+POST) derives organizationId via requireValidatedActiveOrg only', () => {
    const source = read('apps/api/src/app/api/v1/continuity/claims/route.ts')
    expect(source).toContain('requireValidatedActiveOrg')
    expect(source).not.toContain('body.organizationId')
    expect(source).not.toContain("url.searchParams.get('organization_id')")
    expect(source).not.toContain('user.user_metadata?.active_org_id')
  })

  it('claims/[id]/route.ts (PATCH verify/reject/update) derives organizationId via requireValidatedActiveOrg only', () => {
    const source = read('apps/api/src/app/api/v1/continuity/claims/[id]/route.ts')
    expect(source).toContain('requireValidatedActiveOrg')
    expect(source).not.toContain('body.organizationId')
    expect(source).not.toContain('user.user_metadata?.active_org_id')
  })

  it('claims/[id]/evidence/route.ts (POST) derives organizationId via requireValidatedActiveOrg only', () => {
    const source = read('apps/api/src/app/api/v1/continuity/claims/[id]/evidence/route.ts')
    expect(source).toContain('requireValidatedActiveOrg')
    expect(source).not.toContain('body.organizationId')
    expect(source).not.toContain('user.user_metadata?.active_org_id')
  })

  it('claims/[id]/references/route.ts (POST) derives organizationId via requireValidatedActiveOrg only', () => {
    const source = read('apps/api/src/app/api/v1/continuity/claims/[id]/references/route.ts')
    expect(source).toContain('requireValidatedActiveOrg')
    expect(source).not.toContain('body.organizationId')
    expect(source).not.toContain('user.user_metadata?.active_org_id')
  })

  it('claims/[id]/submit/route.ts derives organizationId via requireValidatedActiveOrg, not raw JWT metadata', () => {
    const source = read('apps/api/src/app/api/v1/continuity/claims/[id]/submit/route.ts')
    expect(source).toContain('requireValidatedActiveOrg')
    expect(source).not.toContain('user.user_metadata?.active_org_id')
  })

  it('admin-only claim review routes (reject/verify) remain gated on kadarn_role, independent of org', () => {
    // These are cross-org admin actions (kadarn_internal) and intentionally
    // do not scope by the caller's own organization — confirm the role
    // gate is still present so this distinction is not silently lost.
    for (const route of [
      'apps/api/src/app/api/v1/continuity/claims/[id]/reject/route.ts',
      'apps/api/src/app/api/v1/continuity/claims/[id]/verify/route.ts',
      'apps/api/src/app/api/v1/continuity/claims/[id]/promote/route.ts',
      'apps/api/src/app/api/v1/continuity/admin/queue/route.ts',
    ]) {
      const source = read(route)
      expect(source).toContain("kadarn_role !== 'kadarn_internal'")
    }
  })
})
