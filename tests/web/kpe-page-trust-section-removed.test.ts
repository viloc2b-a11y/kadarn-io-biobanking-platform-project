// ==========================================================================
// dashboard-next-best-action Phase B (PR-B) — KOC KPE report page
// ==========================================================================
// Tasks ref: 2.4 — delete the rendered Trust section (avgOrgTrust/minTrust/
// maxTrust). `packages/kpe-generator/src/index.ts` keeps emitting `trust`
// on the report (PR-A didn't touch it, PR-C deletes it) — this UI simply
// stops reading/rendering it, keeping PR-B revert-safe per the chained-pr
// skill (old fields stay emitted-but-unread).
// Spec ref: "No Institution-Level Composite Score" (spec id 980) —
// avgOrgTrust/minTrust/maxTrust are an aggregate trust rollup.

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
  '(koc)',
  'koc',
  'kpe',
  'page.tsx',
)

function readPage(): string {
  return readFileSync(PAGE_PATH, 'utf8')
}

describe('KPE report page — Trust section removed (dashboard-next-best-action Phase B, R1)', () => {
  it('does not render a Trust section', () => {
    const source = readPage()
    expect(source).not.toContain('title="Trust"')
    expect(source).not.toContain('report.trust')
    expect(source).not.toContain('avgOrgTrust')
  })
})
