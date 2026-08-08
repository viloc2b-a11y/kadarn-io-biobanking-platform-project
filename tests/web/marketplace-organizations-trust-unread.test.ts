// ==========================================================================
// dashboard-next-best-action Phase B/C — Marketplace organizations page
// ==========================================================================
// Tasks ref: 2.3 (PR-B) — stop reading `trust`; 3.1 (PR-C) — delete the dead
// `Org.trust` interface field entirely (per design D5, `OrgCard` never
// rendered `trust` in the first place — this test verifies that fact rather
// than assuming it, per decisions-3 (id 1006) guardrail).
// Spec ref: "trust Object in Marketplace Organizations Response" — REMOVED
// requirement (spec id 980); PR-A already stopped emitting `trust` from the
// API (id 1007). This test guards the web-side consumer.

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
  '(marketplace)',
  'marketplace',
  'organizations',
  'page.tsx',
)

function readPage(): string {
  return readFileSync(PAGE_PATH, 'utf8')
}

describe('Marketplace organizations page — trust field unread (dashboard-next-best-action Phase B, R9)', () => {
  it('never reads org.trust anywhere in the rendered markup', () => {
    const source = readPage()
    expect(source).not.toMatch(/org\.trust/)
  })

  it('no longer declares the trust field on the Org interface (Phase C removal)', () => {
    const source = readPage()
    expect(source).not.toMatch(/trust:\s*\{/)
  })
})
