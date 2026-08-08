// ==========================================================================
// dashboard-next-best-action — CRITICAL #1 fix: Site Passport per-claim
// confidence must never render as a bare number
// ==========================================================================
// Verify report ref: sdd/dashboard-next-best-action/verify-report (id 1010),
// CRITICAL #1 — `apps/web/src/app/site-passport/[slug]/page.tsx:211`
// rendered `Confidence {claim.confidence_score}/100`, a bare label sourced
// one hop away from `packages/published-view/src/legacy-adapter.ts`.
// Neither this shared guard (tests/api/forbidden-score-fields.ts) nor
// scripts/arch-gate.sh had these two surfaces wired in — that's why the
// regression shipped for 3 implementation batches undetected. This file
// wires both surfaces in.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// NOTE: imported by relative path, NOT `@kadarn/published-view`. This
// worktree's `node_modules/@kadarn/*` symlinks resolve to a *different*
// worktree checkout (kadarn-platform, not kadarn-platform-pr-c) — a
// pre-existing environment issue discovered while writing this test
// (confirmed via `readlink`/symlink target inspection). A package-name
// import here would silently test the wrong repo's code. See apply-progress
// for the full writeup; packages/published-view/tests/published-view.test.ts
// already uses this same relative-import pattern for the same reason.
import { LegacyReadAdapter } from '../../packages/published-view/src/legacy-adapter'
import { FORBIDDEN_SCORE_FIELD_NAMES, collectFieldNames } from './forbidden-score-fields'

const ROOT = join(__dirname, '..', '..')
const PAGE = join(ROOT, 'apps', 'web', 'src', 'app', 'site-passport', '[slug]', 'page.tsx')
const ADAPTER = join(ROOT, 'packages', 'published-view', 'src', 'legacy-adapter.ts')

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function extractClaimsSection(source: string): string {
  const start = source.indexOf('(data.claims ?? [])')
  if (start === -1) throw new Error('claims render block not found in site-passport page')
  const end = source.indexOf('</section>', start)
  return end === -1 ? source.slice(start) : source.slice(start, end)
}

describe('Site Passport claim confidence — never a bare score (CRITICAL #1 fix)', () => {
  it('page.tsx does not render a bare per-claim confidence_score or a raw /100', () => {
    const source = read(PAGE)
    expect(source).not.toContain('claim.confidence_score')
    expect(source).not.toContain('claim.verification_label')
    const claimsSection = extractClaimsSection(source)
    expect(claimsSection).not.toMatch(/\/100/)
  })

  it('page.tsx renders confidenceLevel together with confidenceExplanation, never alone', () => {
    const source = read(PAGE)
    expect(source).toContain('claim.confidenceLevel')
    expect(source).toContain('claim.confidenceExplanation')
  })

  it('legacy-adapter.ts still emits confidenceLevel + confidenceExplanation (regression lock)', () => {
    const source = read(ADAPTER)
    expect(source).toContain('confidenceLevel')
    expect(source).toContain('confidenceExplanation')
  })

  it('legacy-adapter.ts response carries confidenceLevel + confidenceExplanation for every claim', () => {
    const adapter = new LegacyReadAdapter()
    const bundle = {
      profile: { id: 'p1', organization_id: 'org-1', headline: 'H', public_slug: 's' },
      claims: [{
        id: 'c1', claim_type: 'x', category: 'y', title: 'T', description: 'D',
        verification_status: 'kadarn_verified', confidence_score: 90,
      }],
    }
    const views = adapter.adaptPassport(bundle)
    const response = adapter.toLegacyPassportResponse(bundle, views)
    const claim = response.claims[0] as Record<string, unknown>

    expect(typeof claim.confidenceLevel).toBe('string')
    expect(typeof claim.confidenceExplanation).toBe('string')
    expect((claim.confidenceExplanation as string).length).toBeGreaterThan(0)
  })

  it('legacy-adapter.ts response carries none of the shared FORBIDDEN_SCORE_FIELD_NAMES', () => {
    const adapter = new LegacyReadAdapter()
    const bundle = {
      profile: { id: 'p1', organization_id: 'org-1', headline: 'H', public_slug: 's' },
      claims: [{
        id: 'c1', claim_type: 'x', category: 'y', title: 'T', description: 'D',
        verification_status: 'self_reported', confidence_score: 40,
      }],
    }
    const views = adapter.adaptPassport(bundle)
    const response = adapter.toLegacyPassportResponse(bundle, views)
    const fields = collectFieldNames(response)
    for (const forbidden of FORBIDDEN_SCORE_FIELD_NAMES) {
      expect(fields.has(forbidden)).toBe(false)
    }
  })
})
