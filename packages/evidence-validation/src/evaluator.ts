// ==========================================================================
// Evidence Maturity Model — Deterministic Evaluator
// ==========================================================================

import type { MaturityEvaluationInput, EvidenceMaturityAssessment } from './types'
import { MATURITY_SCORE_MAP } from './types'
import {
  computeMaturityLevel,
  applyCapsAndConflicts,
  computeFreshnessStatus,
  computeConflictStatus,
  generateNextActions,
} from './rules'

/**
 * Evaluate evidence maturity for a fact or claim.
 * Deterministic. No AI. No LLM. No opaque scoring. Rules only.
 */
export function evaluateMaturity(input: MaturityEvaluationInput): EvidenceMaturityAssessment {
  // 1. Compute base maturity level from evidence characteristics
  const baseLevel = computeMaturityLevel(input)

  // 2. Apply caps (freshness, provenance) and conflict reductions
  const finalLevel = applyCapsAndConflicts(baseLevel, input)

  // 3. Compute supporting metadata
  const maturityScore = MATURITY_SCORE_MAP[finalLevel]
  const freshnessStatus = computeFreshnessStatus(input.evidenceAgeDays)
  const conflictStatus = computeConflictStatus(input.hasConflicts, input.conflictSeverity)

  // 4. Determine provenance status
  const provenanceStatus = input.provenanceComplete
    ? 'complete'
    : input.documentCount > 0
      ? 'partial'
      : 'unavailable'

  // 5. Generate explanation
  const explanation = buildExplanation(finalLevel, input, baseLevel)

  // 6. Identify missing evidence types
  const missingEvidenceTypes = identifyMissingEvidence(input, finalLevel)

  // 7. Generate next best actions
  const nextBestActions = generateNextActions(finalLevel)

  return {
    subjectId: input.subjectId,
    maturityLevel: finalLevel,
    maturityScore,
    supportingEvidenceIds: input.evidenceIds,
    missingEvidenceTypes,
    provenanceStatus,
    freshnessStatus,
    conflictStatus,
    explanation,
    nextBestActions,
    assessedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Explanation builder
// ---------------------------------------------------------------------------

function buildExplanation(
  level: ReturnType<typeof computeMaturityLevel>,
  input: MaturityEvaluationInput,
  baseLevel: ReturnType<typeof computeMaturityLevel>
): string {
  const parts: string[] = []

  parts.push(`Evidence maturity assessed at ${level}.`)

  if (level !== baseLevel) {
    const reasons: string[] = []
    if (input.evidenceAgeDays > 365) reasons.push('evidence age exceeds freshness threshold')
    if (!input.provenanceComplete) reasons.push('provenance chain is incomplete')
    if (input.hasConflicts) reasons.push(`${input.conflictSeverity ?? 'minor'} conflict detected`)
    parts.push(`Reduced from ${baseLevel} due to: ${reasons.join('; ')}.`)
  }

  if (input.documentCount > 0) parts.push(`${input.documentCount} document(s) support this fact.`)
  if (input.internalCorroborationCount > 0)
    parts.push(`${input.internalCorroborationCount} internal source(s) corroborate.`)
  if (input.hasOperationalHistory) parts.push('Operational history supports this fact.')
  if (input.externalConfirmationCount > 0)
    parts.push(`${input.externalConfirmationCount} external confirmation(s) exist.`)

  return parts.join(' ')
}

// ---------------------------------------------------------------------------
// Missing evidence identification
// ---------------------------------------------------------------------------

function identifyMissingEvidence(
  input: MaturityEvaluationInput,
  currentLevel: ReturnType<typeof computeMaturityLevel>
): string[] {
  const missing: string[] = []

  const levelScore = MATURITY_SCORE_MAP[currentLevel]

  if (levelScore < 2 && input.documentCount === 0) {
    missing.push('document_evidence')
  }
  if (levelScore < 3 && input.internalCorroborationCount < 2) {
    missing.push('internal_corroboration')
  }
  if (levelScore < 4 && !input.hasOperationalHistory) {
    missing.push('operational_history')
  }
  if (levelScore < 5 && input.externalConfirmationCount < 1) {
    missing.push('external_confirmation')
  }
  if (levelScore < 6 && input.repeatedValidationCount < 3) {
    missing.push('repeated_validation')
  }
  if (!input.provenanceComplete) {
    missing.push('provenance_chain')
  }
  if (input.evidenceAgeDays > 365) {
    missing.push('current_evidence')
  }

  return missing
}
