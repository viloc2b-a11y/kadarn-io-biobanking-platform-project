// ==========================================================================
// dashboard-next-best-action Phase A/C — computeSiteScore: per-claim
// evidence level + factual counts; institution-level score fields removed
// ==========================================================================
// Design ref: decisions-2 rule 1 — the institution-level `evidenceLevel`
// ("Externally Confirmed" / "Reference Confirmed" / "Supported by Evidence" /
// "Self Reported") aggregated across all of a site's claims is an
// institution-level tier and must be removed from institution-level read
// models. Phase C removes `overallScore`/`continuityLevel`/`evidenceLevel`
// (institution-scoped) entirely — compiler-enforced, zero readers. The same
// four labels remain available per-claim via `claimEvidenceLevels`, tied to
// each claim's own `claimId` — never aggregated. Also keeps factual,
// non-evaluative counts: `claimsWithEvidence` / `claimsAwaitingEvidence`.
// Consumption chain: site-passport/[slug]/page.tsx → GET
// /api/v1/continuity/passport/[slug]/score → computeSiteScore().
//
// Refs: sdd/dashboard-next-best-action tasks 1.8-1.9, 3.1

import { describe, expect, it } from 'vitest'
import { computeSiteScore, type ContinuityDbClient } from '../../apps/api/src/lib/continuity-claim-service'

function makeMockDb(claims: Record<string, unknown>[]): ContinuityDbClient {
  return {
    from(_table: string) {
      return {
        select() {
          return this
        },
        eq() {
          return Promise.resolve({ data: claims, error: null })
        },
      }
    },
  }
}

describe('computeSiteScore — per-claim evidenceLevel, additive (Phase A)', () => {
  it('returns claimEvidenceLevels with one entry per claim, each tied to its own claimId', async () => {
    const db = makeMockDb([
      {
        id: 'claim-1',
        continuity_evidence_items: [{ id: 'ev-1' }],
        continuity_references: [{ id: 'ref-1', status: 'confirmed' }],
        verification_status: 'kadarn_verified',
      },
      {
        id: 'claim-2',
        continuity_evidence_items: [],
        continuity_references: [],
        verification_status: 'self_reported',
      },
      {
        id: 'claim-3',
        continuity_evidence_items: [{ id: 'ev-3' }],
        continuity_references: [],
        verification_status: 'evidence_submitted',
      },
    ])

    const score = await computeSiteScore(db, 'profile-1')

    expect(Array.isArray(score.claimEvidenceLevels)).toBe(true)
    expect(score.claimEvidenceLevels).toHaveLength(3)

    const byId = Object.fromEntries(score.claimEvidenceLevels.map((c) => [c.claimId, c.evidenceLevel]))
    expect(byId['claim-1']).toBe('Externally Confirmed')
    expect(byId['claim-2']).toBe('Self Reported')
    expect(byId['claim-3']).toBe('Supported by Evidence')

    // Each entry references exactly one claim — never aggregated across claims.
    for (const entry of score.claimEvidenceLevels) {
      expect(typeof entry.claimId).toBe('string')
      expect(entry.claimId.length).toBeGreaterThan(0)
    }
  })

  it('returns factual claimsWithEvidence/claimsAwaitingEvidence counts', async () => {
    const db = makeMockDb([
      { id: 'claim-1', continuity_evidence_items: [{ id: 'ev-1' }], continuity_references: [] },
      { id: 'claim-2', continuity_evidence_items: [], continuity_references: [] },
      { id: 'claim-3', continuity_evidence_items: [], continuity_references: [] },
    ])

    const score = await computeSiteScore(db, 'profile-1')

    expect(score.claimsWithEvidence).toBe(1)
    expect(score.claimsAwaitingEvidence).toBe(2)
  })

  it('never returns the institution-level overallScore/evidenceLevel/continuityLevel/components (Phase C removal)', async () => {
    const db = makeMockDb([
      { id: 'claim-1', continuity_evidence_items: [{ id: 'ev-1' }], continuity_references: [] },
    ])

    const score = await computeSiteScore(db, 'profile-1')

    expect(score).not.toHaveProperty('overallScore')
    expect(score).not.toHaveProperty('evidenceLevel')
    expect(score).not.toHaveProperty('continuityLevel')
    expect(score).not.toHaveProperty('components')
  })

  it('handles zero claims without throwing and returns empty per-claim arrays', async () => {
    const db = makeMockDb([])

    const score = await computeSiteScore(db, 'profile-1')

    expect(score.claimEvidenceLevels).toEqual([])
    expect(score.claimsWithEvidence).toBe(0)
    expect(score.claimsAwaitingEvidence).toBe(0)
  })
})
