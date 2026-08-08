// ==========================================================================
// dashboard-next-best-action — CRITICAL #2 fix: workspace/claims list page
// must consume deriveClaimState()/DerivedClaimState, not a bare badge
// ==========================================================================
// Verify report ref: sdd/dashboard-next-best-action/verify-report (id 1010),
// CRITICAL #2 — `deriveClaimState()`/`ClaimConfidenceState` (PR-A,
// packages/types/src/claim-derived-state.ts, claim-confidence.ts) had zero
// runtime consumers. The one live claims UI,
// apps/web/src/app/(workspace)/workspace/claims/page.tsx, rendered a bare
// `lifecycle_status` badge with no explanation. This fix wires the list
// page onto the existing mapping layer ONLY (no claims/[id]/page.tsx CVG
// panel — that stays correctly out of scope, see apply-progress).
//
// No jsdom/RTL harness exists in this repo's vitest setup (environment:
// 'node') — following the established source-text assertion pattern used
// in tests/web/site-passport-score-free.test.ts and
// tests/web/mvp-onboarding-validation.test.ts.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const PAGE_PATH = join(
  __dirname,
  '..',
  '..',
  'apps',
  'web',
  'src',
  'app',
  '(workspace)',
  'workspace',
  'claims',
  'page.tsx',
)

function readPage(): string {
  return readFileSync(PAGE_PATH, 'utf8')
}

describe('workspace/claims list page — consumes deriveClaimState() (dashboard-next-best-action CRITICAL #2)', () => {
  it('imports deriveClaimState from the canonical mapping layer', () => {
    const source = readPage()
    expect(source).toMatch(/import\s*\{[^}]*deriveClaimState[^}]*\}\s*from\s*'@kadarn\/types'/)
  })

  it('no longer renders the bare lifecycle_status badge alone', () => {
    const source = readPage()
    expect(source).not.toContain('statusColors[claim.lifecycle_status]')
  })

  it('renders the derived state together with a factual explanation, never a bare label', () => {
    const source = readPage()
    expect(source).toContain('deriveListDisplayState(claim)')
    expect(source).toContain('DERIVED_STATE_LABELS[state]')
    expect(source).toContain('{explanation}')
  })

  it('does not fabricate SUPPORTS/CONTRADICTS evidence relationships it cannot verify from the list response', () => {
    const source = readPage()
    // Only ever floors at the conservative PARTIALLY_SUPPORTS signal —
    // never claims the stronger, unverifiable SUPPORTS/CONTRADICTS types
    // from this list view (see the CRITICAL #2 fix comment in the page).
    expect(source).not.toMatch(/relationshipType:\s*'SUPPORTS'/)
    expect(source).not.toMatch(/relationshipType:\s*'CONTRADICTS'/)
    expect(source).toContain("relationshipType: 'PARTIALLY_SUPPORTS'")
  })

  it('keeps the canonical workflow_state term visible (spec R7 — identical state renders identical terms)', () => {
    const source = readPage()
    expect(source).toContain('{claim.workflow_state}')
  })
})
