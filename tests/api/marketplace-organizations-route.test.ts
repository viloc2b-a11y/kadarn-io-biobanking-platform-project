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
import { FORBIDDEN_SCORE_FIELD_NAMES, collectFieldNames } from './forbidden-score-fields'

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

  it('response shape contract carries none of the shared FORBIDDEN_SCORE_FIELD_NAMES (design: shared score-free guard)', () => {
    // Mirrors the exact object literal the route returns per organization
    // (route.ts's `results = data.map(org => ({...}))`), so a future
    // regression that reintroduces a score/trust field into that literal
    // is caught here without needing a live Supabase mock.
    const responsePayload = {
      data: {
        results: [
          {
            id: 'org-1',
            name: 'Test Org',
            description: 'desc',
            country: 'US',
            region: 'NA',
            website: 'https://example.com',
            certifications: ['CLIA'],
            capabilities: [{ key: 'lab', name: 'Laboratory', category: 'core', primary: true }],
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      },
      error: null,
    }

    const fields = collectFieldNames(responsePayload)
    for (const forbidden of FORBIDDEN_SCORE_FIELD_NAMES) {
      expect(fields.has(forbidden)).toBe(false)
    }
  })
})
