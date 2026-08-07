// ==========================================================================
// dashboard-next-best-action Phase A — marketplace organizations: no trust
// ==========================================================================
// Design ref: D5 (minimal diff — delete organization_trust join/destructure/
// response). Spec ref: "trust Object in Marketplace Organizations Response"
// REMOVED requirement (spec id 980) + "Alphabetical fallback preserved"
// scenario. Confirmed zero-consumer by design + a repo grep before this
// change (apps/web OrgCard never renders `org.trust`).

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
  'marketplace',
  'organizations',
  'route.ts',
)

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('marketplace organizations route — trust removal (R9)', () => {
  it('does not query the organization_trust table', () => {
    const route = read(ROUTE)
    expect(route).not.toContain('organization_trust')
  })

  it('does not read or return any institution-level trust/score field', () => {
    const route = read(ROUTE)
    expect(route).not.toContain('overall_score')
    expect(route).not.toContain('operational_score')
    expect(route).not.toContain('regulatory_score')
    expect(route).not.toContain('financial_score')
    expect(route).not.toContain('technical_score')
    expect(route).not.toMatch(/trust\s*:/)
  })

  it('keeps alphabetical ordering with no new ranking/scoring parameter', () => {
    const route = read(ROUTE)
    expect(route).toContain(".order('name')")
  })

  it('still returns the organization result shape (id/name/capabilities) unrelated to trust', () => {
    const route = read(ROUTE)
    expect(route).toContain('capabilities:')
    expect(route).toContain('id:')
    expect(route).toContain('name:')
  })
})
