// ==========================================================================
// dashboard-next-best-action Phase B (PR-B) — Site Passport page, score-free
// ==========================================================================
// Design ref: Migration/Rollout — "PR-B (UI surfaces) — site-passport,
// marketplace page, koc/kpe, onboarding readiness/passport pages read only
// the new fields. Old fields still emitted but unread."
// Tasks ref: 2.1/2.2 — delete ScoreCard/Metric/formatNum's institutional
// score display, the readinessScore block, and the completionPercent bar;
// render a new factual summary sourced from computeSiteScore()'s additive
// fields (claimEvidenceLevels/claimsWithEvidence/claimsAwaitingEvidence).
// Spec ref: "No Institution-Level Composite Score", "Permitted Passport
// Summary Fields" (spec id 980).
//
// No jsdom/RTL harness exists in this repo's vitest setup (environment:
// 'node') — following the established source-text assertion pattern used in
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
  'site-passport',
  '[slug]',
  'page.tsx',
)

function readPage(): string {
  return readFileSync(PAGE_PATH, 'utf8')
}

function extractSummarySection(source: string): string {
  const start = source.indexOf('function EvidenceSummary')
  if (start === -1) throw new Error('EvidenceSummary component not found in site-passport page')
  const end = source.indexOf('\nfunction ', start + 1)
  return end === -1 ? source.slice(start) : source.slice(start, end)
}

describe('Site Passport page — score-free summary (dashboard-next-best-action Phase B)', () => {
  it('does not render the deprecated institution-level score fields', () => {
    const source = readPage()
    expect(source).not.toContain('Overall Continuity Score')
    expect(source).not.toContain('score.overallScore')
    expect(source).not.toContain('score.evidenceLevel')
    expect(source).not.toContain('score.continuityLevel')
  })

  it('the summary region contains zero %/100 glyphs', () => {
    const summary = extractSummarySection(readPage())
    expect(summary).not.toMatch(/\/100/)
    expect(summary).not.toMatch(/%/)
  })

  it('the summary reads the new factual per-claim evidence fields from computeSiteScore()', () => {
    const summary = extractSummarySection(readPage())
    expect(summary).toContain('claimsWithEvidence')
    expect(summary).toContain('claimsAwaitingEvidence')
    expect(summary).toContain('claimEvidenceLevels')
  })

  it('removes the readinessScore percentage badge from the Opportunities card', () => {
    const source = readPage()
    expect(source).not.toContain('data.readinessScore')
    expect(source).not.toMatch(/readinessScore\s*>=/)
  })

  it('removes the completionPercent progress bar from Recommendations', () => {
    const source = readPage()
    expect(source).not.toContain('data.completionPercent')
    expect(source).not.toMatch(/width:\s*`\$\{data\.completionPercent\}%`/)
  })
})
