// ==========================================================================
// Evidence Maturity Model — Deterministic Rules
// ==========================================================================

import type { MaturityEvaluationInput, EvidenceMaturityAssessment } from './types'
import { EvidenceMaturityLevel, MATURITY_SCORE_MAP } from './types'

// ---------------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------------

export function computeFreshnessStatus(ageDays: number): EvidenceMaturityAssessment['freshnessStatus'] {
  if (ageDays <= 180) return 'current'
  if (ageDays <= 365) return 'aging'
  if (ageDays <= 730) return 'stale'
  return 'expired'
}

export function computeFreshnessCap(ageDays: number): EvidenceMaturityLevel {
  if (ageDays <= 365) return EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED // no cap
  if (ageDays <= 730) return EvidenceMaturityLevel.EM3_INTERNALLY_CORROBORATED // stale caps at EM3
  return EvidenceMaturityLevel.EM1_SELF_REPORTED // expired caps at EM1
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export function computeProvenanceCap(complete: boolean): EvidenceMaturityLevel {
  return complete
    ? EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED // no cap
    : EvidenceMaturityLevel.EM3_INTERNALLY_CORROBORATED // incomplete caps at EM3
}

// ---------------------------------------------------------------------------
// Conflict impact
// ---------------------------------------------------------------------------

export function computeConflictImpact(
  hasConflicts: boolean,
  severity?: 'minor' | 'major'
): number {
  if (!hasConflicts) return 0
  return severity === 'major' ? 2 : 1 // levels to reduce
}

export function computeConflictStatus(
  hasConflicts: boolean,
  severity?: 'minor' | 'major'
): EvidenceMaturityAssessment['conflictStatus'] {
  if (!hasConflicts) return 'none'
  return severity === 'major' ? 'major_conflict' : 'minor_conflict'
}

// ---------------------------------------------------------------------------
// Maturity level computation
// ---------------------------------------------------------------------------

export function computeMaturityLevel(input: MaturityEvaluationInput): EvidenceMaturityLevel {
  // EM0: No self-report, no documents
  if (!input.hasSelfReport && input.documentCount === 0) {
    return EvidenceMaturityLevel.EM0_NOT_DOCUMENTED
  }

  // EM1: Self-reported only
  if (input.hasSelfReport && input.documentCount === 0) {
    return EvidenceMaturityLevel.EM1_SELF_REPORTED
  }

  // EM6: Repeated validation (3+ cycles), current evidence, full provenance, external confirmation, operational history
  if (
    input.repeatedValidationCount >= 3 &&
    input.evidenceAgeDays < 365 &&
    input.provenanceComplete &&
    input.externalConfirmationCount >= 1 &&
    input.hasOperationalHistory
  ) {
    return EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED
  }

  // EM5: External confirmation exists, operational history, internal corroboration
  if (
    input.externalConfirmationCount >= 1 &&
    input.hasOperationalHistory &&
    input.internalCorroborationCount >= 2
  ) {
    return EvidenceMaturityLevel.EM5_EXTERNALLY_CONFIRMED
  }

  // EM4: Operational history, internal corroboration, documents
  if (
    input.hasOperationalHistory &&
    input.internalCorroborationCount >= 2 &&
    input.documentCount >= 1
  ) {
    return EvidenceMaturityLevel.EM4_OPERATIONALLY_DEMONSTRATED
  }

  // EM3: Multiple internal corroborations, at least 1 document
  if (input.internalCorroborationCount >= 2 && input.documentCount >= 1) {
    return EvidenceMaturityLevel.EM3_INTERNALLY_CORROBORATED
  }

  // EM2: At least one document
  if (input.documentCount >= 1) {
    return EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED
  }

  // Fallback
  return EvidenceMaturityLevel.EM1_SELF_REPORTED
}

// ---------------------------------------------------------------------------
// Apply caps (freshness, provenance) and conflict reductions
// ---------------------------------------------------------------------------

export function applyCapsAndConflicts(
  baseLevel: EvidenceMaturityLevel,
  input: MaturityEvaluationInput
): EvidenceMaturityLevel {
  let level = baseLevel

  // Apply freshness cap
  const freshnessCap = computeFreshnessCap(input.evidenceAgeDays)
  if (numericLevel(level) > numericLevel(freshnessCap)) {
    level = freshnessCap
  }

  // Apply provenance cap
  const provCap = computeProvenanceCap(input.provenanceComplete)
  if (numericLevel(level) > numericLevel(provCap)) {
    level = provCap
  }

  // Apply conflict reduction
  const reduction = computeConflictImpact(input.hasConflicts, input.conflictSeverity)
  const targetScore = Math.max(0, numericLevel(level) - reduction)
  level = levelFromNumeric(targetScore)

  return level
}

function numericLevel(level: EvidenceMaturityLevel): number {
  return MATURITY_SCORE_MAP[level]
}

function levelFromNumeric(score: number): EvidenceMaturityLevel {
  const clamped = Math.max(0, Math.min(6, score))
  const entry = Object.entries(MATURITY_SCORE_MAP).find(([, v]) => v === clamped)
  return (entry?.[0] as EvidenceMaturityLevel) ?? EvidenceMaturityLevel.EM0_NOT_DOCUMENTED
}

// ---------------------------------------------------------------------------
// Next best actions
// ---------------------------------------------------------------------------

export function generateNextActions(level: EvidenceMaturityLevel): string[] {
  const actions: Record<EvidenceMaturityLevel, string[]> = {
    [EvidenceMaturityLevel.EM0_NOT_DOCUMENTED]: [
      'Submit self-reported information about this fact to begin the validation process',
      'Identify what type of evidence would support this fact',
    ],
    [EvidenceMaturityLevel.EM1_SELF_REPORTED]: [
      'Provide supporting documentation (SOP, certificate, record) as Class B or higher evidence',
      'Link existing documents in your evidence inventory to this fact',
    ],
    [EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED]: [
      'Obtain corroboration from at least one additional independent internal source',
      'Ensure provenance chain is complete for all supporting documents',
    ],
    [EvidenceMaturityLevel.EM3_INTERNALLY_CORROBORATED]: [
      'Demonstrate this capability through operational history (program execution, sample processing records)',
      'Add operational metrics or throughput data as supporting evidence',
    ],
    [EvidenceMaturityLevel.EM4_OPERATIONALLY_DEMONSTRATED]: [
      'Seek external confirmation — third-party audit, sponsor verification, or regulatory inspection result',
      'Submit external validation reports as Class A evidence',
    ],
    [EvidenceMaturityLevel.EM5_EXTERNALLY_CONFIRMED]: [
      'Maintain repeated validation — schedule periodic re-verification at least every 12 months',
      'Ensure all evidence remains current (less than 365 days old)',
    ],
    [EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED]: [
      'Continue periodic re-validation to maintain EM6 status',
      'Monitor for evidence expiration and proactively refresh aging documents',
    ],
  }
  return actions[level] ?? []
}
