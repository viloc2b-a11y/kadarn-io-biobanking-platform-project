// ==========================================================================
// Kadarn Readiness Engine — Shared Readiness Helpers
// ==========================================================================
// KTP-1.3. Pure functions shared between the readiness engine (backend)
// and frontend helpers (onboarding-derived readiness).
//
// These functions are the canonical source of truth for:
//   - Evidence support level computation with confidence caps
//   - Readiness status determination
//   - Overall confidence aggregation (excluding N/A and UNKNOWN)
//
// By importing these from @kadarn/readiness-engine, frontend helpers
// avoid duplicating logic that should be centralized.
// ==========================================================================

import type { EvidenceSupport } from './readiness-evaluation.js'

// --------------------------------------------------------------------------
// Evidence Support Level Computation
// --------------------------------------------------------------------------
// Applies the canonical evidence support rules and confidence caps.
// This is the single source of truth for determining SUPPORTED_BY_EVIDENCE,
// DECLARED_ONLY, PARTIALLY_SUPPORTED, etc.

export interface EvidenceSupportResult {
  evidenceSupport: EvidenceSupport
  /** Confidence value after applying caps (0.00-1.00) */
  cappedConfidence: number
}

/**
 * Compute evidence support level and apply confidence caps based on
 * the set of evidence classes present.
 *
 * Rules (canonical — do not duplicate elsewhere):
 *   - Class B only → DECLARED_ONLY, confidence capped at 0.40
 *   - Class B + C only (no A, D, F) → PARTIALLY_SUPPORTED, capped at 0.65
 *   - Class A or F present → SUPPORTED_BY_EVIDENCE, no cap
 *   - Class D present → SUPPORTED_BY_EVIDENCE, no cap
 *   - No evidence → UNKNOWN
 */
export function computeEvidenceSupportLevel(
  evidenceClasses: string[],
  rawConfidence: number,
): EvidenceSupportResult {
  const uniqueClasses = new Set(evidenceClasses)

  // No evidence at all
  if (uniqueClasses.size === 0) {
    return { evidenceSupport: 'UNKNOWN', cappedConfidence: 0 }
  }

  const hasOnlyClassB = uniqueClasses.size === 1 && uniqueClasses.has('B')
  const hasClassBPlusCOnly =
    uniqueClasses.has('B') &&
    uniqueClasses.has('C') &&
    !uniqueClasses.has('A') &&
    !uniqueClasses.has('D') &&
    !uniqueClasses.has('F')

  if (hasOnlyClassB) {
    return {
      evidenceSupport: 'DECLARED_ONLY',
      cappedConfidence: Math.min(rawConfidence, 0.40),
    }
  }

  if (hasClassBPlusCOnly) {
    return {
      evidenceSupport: 'PARTIALLY_SUPPORTED',
      cappedConfidence: Math.min(rawConfidence, 0.65),
    }
  }

  // Check if there's high-quality evidence
  const hasHighEvidence =
    uniqueClasses.has('A') || uniqueClasses.has('F') || uniqueClasses.has('D')

  if (hasHighEvidence) {
    return {
      evidenceSupport: 'SUPPORTED_BY_EVIDENCE',
      cappedConfidence: rawConfidence, // No cap
    }
  }

  // Has some evidence but not enough for supported
  return {
    evidenceSupport: 'NEEDS_EVIDENCE',
    cappedConfidence: Math.min(rawConfidence, 0.50),
  }
}

/**
 * Filter out N/A and UNKNOWN claims from an array of results.
 * Returns only active claims that should be included in counts and averaging.
 */
export function filterActiveClaims<T extends { evidenceSupport: EvidenceSupport }>(
  claims: T[],
): T[] {
  return claims.filter(
    (c) => c.evidenceSupport !== 'NOT_APPLICABLE' && c.evidenceSupport !== 'UNKNOWN',
  )
}

/**
 * Determine if a claim is "met" based on its evidence support and confidence.
 * N/A and UNKNOWN are never considered met.
 */
export function isClaimMet(
  evidenceSupport: EvidenceSupport,
  confidence: number,
  threshold = 0.50,
): boolean {
  if (evidenceSupport === 'NOT_APPLICABLE' || evidenceSupport === 'UNKNOWN') {
    return false
  }
  return evidenceSupport === 'SUPPORTED_BY_EVIDENCE' || confidence >= threshold
}
