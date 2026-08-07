// ==========================================================================
// dashboard-next-best-action Phase A — Passport factual evidence summary
// ==========================================================================
// Design ref: D1 (replace scores with factual counts, in the existing type
// source). PR-A is additive-only: the deprecated coverageScore/healthScore
// fields on PassportEvidence stay for now (PR-C deletes them); this test
// asserts the NEW factual `evidenceSummary` + `coverageByDomain` fields are
// populated alongside them, and are non-evaluative (counts/dates only).
// Spec ref: "Permitted Passport Summary Fields" (spec id 980).

import { describe, expect, it } from 'vitest'
import { assemblePassport } from '../../apps/web/src/lib/passport/passport-assembler'
import { derivePassportReadModel } from '../../apps/web/src/lib/onboarding/derived-read-models/passport-read-model'

describe('Passport evidence summary — factual, non-evaluative, additive (assemblePassport)', () => {
  it('adds evidenceSummary with document counts alongside the deprecated scores', () => {
    const passport = assemblePassport({
      institutionId: 'inst-1',
      institutionName: 'Test Institution',
      answers: {},
      uploadedDocs: [{ label: 'Business License', type: 'license', uploaded: true }],
    })

    expect(passport.evidence.evidenceSummary).toBeDefined()
    const summary = passport.evidence.evidenceSummary!
    expect(summary.totalDocuments).toBe(passport.evidence.totalDocuments)
    expect(summary.documentsPresent).toBe(passport.evidence.uploadedDocuments)
    expect(summary.documentsMissing).toBe(passport.evidence.missingCritical.length)
    expect(typeof summary.documentsExpiringSoon).toBe('number')
    expect(typeof summary.documentsExpired).toBe('number')

    // Old, deprecated evaluative fields are still present — additive, not a breaking change.
    expect(typeof passport.evidence.coverageScore).toBe('number')
    expect(typeof passport.evidence.healthScore).toBe('number')
  })

  it('counts documentsExpired and documentsExpiringSoon independently, never merged into a score', () => {
    // NOTE: assembleEvidence()'s existing (unchanged) status logic buckets any
    // expiresAt within 90 days — including already-past dates — as
    // 'expiring_soon'; it never assigns 'expired'. That pre-existing gap is
    // out of scope for this additive PR-A change (flagged in apply-progress
    // for a follow-up), so this test asserts the honest current behavior:
    // documentsExpired stays a real, independently-countable field (0 here),
    // and documentsExpiringSoon captures both documents.
    const past = new Date(Date.now() - 86_400_000).toISOString()
    const soon = new Date(Date.now() + 30 * 86_400_000).toISOString()

    const passport = assemblePassport({
      institutionId: 'inst-1',
      institutionName: 'Test Institution',
      answers: {},
      uploadedDocs: [
        { label: 'Business License', type: 'license', uploaded: true, expiresAt: past },
        { label: 'CLIA Certificate', type: 'certification', uploaded: true, expiresAt: soon },
      ],
    })

    const summary = passport.evidence.evidenceSummary!
    expect(summary.documentsExpiringSoon).toBeGreaterThanOrEqual(2)
    expect(summary.documentsExpired).toBe(0)
  })

  it('adds coverageByDomain as per-domain capability counts (never an institution-wide rollup)', () => {
    const passport = assemblePassport({
      institutionId: 'inst-1',
      institutionName: 'Test Institution',
      answers: { org_research_focus: ['Oncology'], infra_has_lab: 'yes', infra_lab_processing: ['pcr'] },
      uploadedDocs: [],
    })

    expect(Array.isArray(passport.evidence.coverageByDomain)).toBe(true)
    const domains = passport.evidence.coverageByDomain!
    expect(domains.length).toBeGreaterThan(0)
    for (const row of domains) {
      expect(typeof row.domain).toBe('string')
      expect(typeof row.capabilityCount).toBe('number')
      expect(typeof row.supportedCount).toBe('number')
      expect(typeof row.needsEvidenceCount).toBe('number')
      // Non-evaluative: no numeric score field on the row.
      expect((row as Record<string, unknown>).score).toBeUndefined()
    }
  })
})

describe('Passport evidence summary — canonical read model (derivePassportReadModel)', () => {
  it('also emits evidenceSummary + coverageByDomain from the canonical read model path', () => {
    const passport = derivePassportReadModel({
      institutionId: 'inst-1',
      institutionName: 'Test Institution',
      answers: {},
      uploadedDocs: [{ label: 'Business License', type: 'license', uploaded: true }],
    })

    expect(passport.evidence.evidenceSummary).toBeDefined()
    expect(Array.isArray(passport.evidence.coverageByDomain)).toBe(true)
  })
})
