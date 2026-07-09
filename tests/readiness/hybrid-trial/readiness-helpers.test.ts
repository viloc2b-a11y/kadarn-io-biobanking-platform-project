// ==========================================================================
// KTP-1.3 — Shared Readiness Helpers Tests
// ==========================================================================
// Tests for the canonical shared helpers used by both frontend and backend.
// These tests verify the single source of truth for evidence support
// computation, claim filtering, and met/unmet determination.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  computeEvidenceSupportLevel,
  filterActiveClaims,
  isClaimMet,
} from '@kadarn/readiness-engine'
import type { EvidenceSupport } from '@kadarn/readiness-engine'

// ==========================================================================
// computeEvidenceSupportLevel
// ==========================================================================

describe('computeEvidenceSupportLevel', () => {
  it('should return UNKNOWN when no evidence classes present', () => {
    const result = computeEvidenceSupportLevel([], 0.80)
    expect(result.evidenceSupport).toBe('UNKNOWN')
    expect(result.cappedConfidence).toBe(0)
  })

  it('should cap Class B only at 0.40 (DECLARED_ONLY)', () => {
    const result = computeEvidenceSupportLevel(['B', 'B', 'B'], 0.90)
    expect(result.evidenceSupport).toBe('DECLARED_ONLY')
    expect(result.cappedConfidence).toBe(0.40)
  })

  it('should cap Class B only even when raw confidence is below cap', () => {
    const result = computeEvidenceSupportLevel(['B'], 0.25)
    expect(result.evidenceSupport).toBe('DECLARED_ONLY')
    expect(result.cappedConfidence).toBe(0.25) // below cap, no change
  })

  it('should cap Class B + C at 0.65 (PARTIALLY_SUPPORTED)', () => {
    const result = computeEvidenceSupportLevel(['B', 'C', 'C'], 0.85)
    expect(result.evidenceSupport).toBe('PARTIALLY_SUPPORTED')
    expect(result.cappedConfidence).toBe(0.65)
  })

  it('should cap Class B + C even with many operational records', () => {
    const result = computeEvidenceSupportLevel(['B', 'C', 'C', 'C', 'C', 'C'], 0.95)
    expect(result.evidenceSupport).toBe('PARTIALLY_SUPPORTED')
    expect(result.cappedConfidence).toBe(0.65)
  })

  it('should NOT cap when Class A evidence is present (SUPPORTED_BY_EVIDENCE)', () => {
    const result = computeEvidenceSupportLevel(['B', 'A'], 0.90)
    expect(result.evidenceSupport).toBe('SUPPORTED_BY_EVIDENCE')
    expect(result.cappedConfidence).toBe(0.90)
  })

  it('should NOT cap when Class F evidence is present (SUPPORTED_BY_EVIDENCE)', () => {
    const result = computeEvidenceSupportLevel(['B', 'C', 'F'], 0.88)
    expect(result.evidenceSupport).toBe('SUPPORTED_BY_EVIDENCE')
    expect(result.cappedConfidence).toBe(0.88)
  })

  it('should NOT cap when Class D evidence is present (SUPPORTED_BY_EVIDENCE)', () => {
    const result = computeEvidenceSupportLevel(['B', 'D'], 0.82)
    expect(result.evidenceSupport).toBe('SUPPORTED_BY_EVIDENCE')
    expect(result.cappedConfidence).toBe(0.82)
  })

  it('should return NEEDS_EVIDENCE when has some evidence but not enough for supported', () => {
    // Class C only, no B — technically has operational evidence but no documentary
    const result = computeEvidenceSupportLevel(['C', 'C'], 0.55)
    expect(result.evidenceSupport).toBe('NEEDS_EVIDENCE')
    expect(result.cappedConfidence).toBe(0.50) // capped at 0.50 for NEEDS_EVIDENCE
  })

  it('should return NEEDS_EVIDENCE with cap at 0.50 even for high raw confidence', () => {
    const result = computeEvidenceSupportLevel(['C'], 0.95)
    expect(result.evidenceSupport).toBe('NEEDS_EVIDENCE')
    expect(result.cappedConfidence).toBe(0.50)
  })

  it('should distinguish B only from B+other (non-confidence-boosting) classes', () => {
    // Class B + E (temporal continuity) — E is not A, D, or F
    // E is a modulation class, not a confidence booster
    const result = computeEvidenceSupportLevel(['B', 'E'], 0.70)
    // Not only B (E is present), not B+C only, no A/D/F → NEEDS_EVIDENCE
    expect(result.evidenceSupport).toBe('NEEDS_EVIDENCE')
    expect(result.cappedConfidence).toBe(0.50)
  })

  it('should treat Class D as high-quality evidence (equal to A and F)', () => {
    const resultD = computeEvidenceSupportLevel(['B', 'D'], 0.90)
    const resultA = computeEvidenceSupportLevel(['B', 'A'], 0.90)
    expect(resultD.evidenceSupport).toBe('SUPPORTED_BY_EVIDENCE')
    expect(resultA.evidenceSupport).toBe('SUPPORTED_BY_EVIDENCE')
    expect(resultD.cappedConfidence).toBe(resultA.cappedConfidence)
  })
})

// ==========================================================================
// filterActiveClaims
// ==========================================================================

describe('filterActiveClaims', () => {
  interface TestClaim {
    id: string
    evidenceSupport: EvidenceSupport
    confidence: number
  }

  it('should filter out NOT_APPLICABLE claims', () => {
    const claims: TestClaim[] = [
      { id: '1', evidenceSupport: 'SUPPORTED_BY_EVIDENCE', confidence: 0.80 },
      { id: '2', evidenceSupport: 'NOT_APPLICABLE', confidence: 1.0 },
      { id: '3', evidenceSupport: 'PARTIALLY_SUPPORTED', confidence: 0.55 },
    ]
    const result = filterActiveClaims(claims)
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['1', '3'])
  })

  it('should filter out UNKNOWN claims', () => {
    const claims: TestClaim[] = [
      { id: '1', evidenceSupport: 'DECLARED_ONLY', confidence: 0.35 },
      { id: '2', evidenceSupport: 'UNKNOWN', confidence: 0 },
      { id: '3', evidenceSupport: 'NEEDS_EVIDENCE', confidence: 0.30 },
    ]
    const result = filterActiveClaims(claims)
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['1', '3'])
  })

  it('should filter out both N/A and UNKNOWN simultaneously', () => {
    const claims: TestClaim[] = [
      { id: '1', evidenceSupport: 'SUPPORTED_BY_EVIDENCE', confidence: 0.90 },
      { id: '2', evidenceSupport: 'NOT_APPLICABLE', confidence: 1.0 },
      { id: '3', evidenceSupport: 'UNKNOWN', confidence: 0 },
      { id: '4', evidenceSupport: 'DECLARED_ONLY', confidence: 0.35 },
    ]
    const result = filterActiveClaims(claims)
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['1', '4'])
  })

  it('should return empty array when all claims are N/A or UNKNOWN', () => {
    const claims: TestClaim[] = [
      { id: '1', evidenceSupport: 'NOT_APPLICABLE', confidence: 1.0 },
      { id: '2', evidenceSupport: 'UNKNOWN', confidence: 0 },
    ]
    const result = filterActiveClaims(claims)
    expect(result).toHaveLength(0)
  })

  it('should return all claims when none are N/A or UNKNOWN', () => {
    const claims: TestClaim[] = [
      { id: '1', evidenceSupport: 'SUPPORTED_BY_EVIDENCE', confidence: 0.80 },
      { id: '2', evidenceSupport: 'DECLARED_ONLY', confidence: 0.35 },
    ]
    const result = filterActiveClaims(claims)
    expect(result).toHaveLength(2)
  })
})

// ==========================================================================
// isClaimMet
// ==========================================================================

describe('isClaimMet', () => {
  it('should return false for NOT_APPLICABLE claims regardless of confidence', () => {
    expect(isClaimMet('NOT_APPLICABLE', 1.0)).toBe(false)
    expect(isClaimMet('NOT_APPLICABLE', 0.90)).toBe(false)
    expect(isClaimMet('NOT_APPLICABLE', 0)).toBe(false)
  })

  it('should return false for UNKNOWN claims regardless of confidence', () => {
    expect(isClaimMet('UNKNOWN', 0)).toBe(false)
    expect(isClaimMet('UNKNOWN', 0.50)).toBe(false)
  })

  it('should return true for SUPPORTED_BY_EVIDENCE even below default threshold', () => {
    // SUPPORTED_BY_EVIDENCE is met regardless of confidence level
    expect(isClaimMet('SUPPORTED_BY_EVIDENCE', 0.30)).toBe(true)
    expect(isClaimMet('SUPPORTED_BY_EVIDENCE', 0.10)).toBe(true)
  })

  it('should return true for confidence >= threshold with DECLARED_ONLY', () => {
    expect(isClaimMet('DECLARED_ONLY', 0.55, 0.50)).toBe(true)
    expect(isClaimMet('DECLARED_ONLY', 0.49, 0.50)).toBe(false)
  })

  it('should return true for confidence >= threshold with PARTIALLY_SUPPORTED', () => {
    expect(isClaimMet('PARTIALLY_SUPPORTED', 0.65, 0.50)).toBe(true)
    expect(isClaimMet('PARTIALLY_SUPPORTED', 0.45, 0.50)).toBe(false)
  })

  it('should respect custom threshold', () => {
    expect(isClaimMet('NEEDS_EVIDENCE', 0.55, 0.60)).toBe(false)
    expect(isClaimMet('NEEDS_EVIDENCE', 0.65, 0.60)).toBe(true)
  })

  it('should use default threshold of 0.50 when not specified', () => {
    expect(isClaimMet('PARTIALLY_SUPPORTED', 0.51)).toBe(true)
    expect(isClaimMet('DECLARED_ONLY', 0.49)).toBe(false)
  })

  it('should return true for NEEDS_REVIEW claims meeting threshold', () => {
    expect(isClaimMet('NEEDS_REVIEW', 0.55)).toBe(true)
    expect(isClaimMet('NEEDS_REVIEW', 0.40)).toBe(false)
  })

  it('should return true for EXPIRED_OR_OUTDATED claims meeting threshold', () => {
    expect(isClaimMet('EXPIRED_OR_OUTDATED', 0.55)).toBe(true)
    expect(isClaimMet('EXPIRED_OR_OUTDATED', 0.25)).toBe(false)
  })
})

// ==========================================================================
// Integration: helpers work together correctly
// ==========================================================================

describe('Shared Helpers — Integration', () => {
  interface TestClaim {
    id: string
    evidenceSupport: EvidenceSupport
    confidence: number
  }

  it('should correctly filter and evaluate a mixed claim set', () => {
    const claims: TestClaim[] = [
      { id: 'site_exec', evidenceSupport: 'SUPPORTED_BY_EVIDENCE', confidence: 0.82 },
      { id: 'at_home', evidenceSupport: 'NOT_APPLICABLE', confidence: 1.0 },
      { id: 'data_int', evidenceSupport: 'PARTIALLY_SUPPORTED', confidence: 0.60 },
      { id: 'patient', evidenceSupport: 'UNKNOWN', confidence: 0 },
      { id: 'bio_home', evidenceSupport: 'DECLARED_ONLY', confidence: 0.35 },
      { id: 'remote', evidenceSupport: 'SUPPORTED_BY_EVIDENCE', confidence: 0.75 },
    ]

    // Filter active claims
    const active = filterActiveClaims(claims)
    expect(active).toHaveLength(4) // excludes N/A and UNKNOWN

    // Check met status for each active claim
    const metResults = active.map(c => ({
      id: c.id,
      met: isClaimMet(c.evidenceSupport, c.confidence),
    }))

    expect(metResults).toEqual([
      { id: 'site_exec', met: true },   // SUPPORTED → always met
      { id: 'data_int', met: true },    // 0.60 >= 0.50
      { id: 'bio_home', met: false },   // 0.35 < 0.50
      { id: 'remote', met: true },      // SUPPORTED → always met
    ])

    // Average confidence of active claims
    const avg = active.reduce((s, c) => s + c.confidence, 0) / active.length
    expect(avg).toBeCloseTo(0.63, 1)
  })

  it('computeEvidenceSupportLevel + isClaimMet should align: DECLARED_ONLY capped at 0.40 cannot be met by default', () => {
    const { evidenceSupport, cappedConfidence } = computeEvidenceSupportLevel(['B'], 0.90)
    expect(evidenceSupport).toBe('DECLARED_ONLY')
    expect(cappedConfidence).toBe(0.40)
    // 0.40 < 0.50 → not met by default threshold
    expect(isClaimMet(evidenceSupport, cappedConfidence)).toBe(false)
  })

  it('computeEvidenceSupportLevel + isClaimMet should align: PARTIALLY_SUPPORTED at 0.65 is met by default', () => {
    const { evidenceSupport, cappedConfidence } = computeEvidenceSupportLevel(['B', 'C'], 0.90)
    expect(evidenceSupport).toBe('PARTIALLY_SUPPORTED')
    expect(cappedConfidence).toBe(0.65)
    // 0.65 >= 0.50 → met
    expect(isClaimMet(evidenceSupport, cappedConfidence)).toBe(true)
  })
})
