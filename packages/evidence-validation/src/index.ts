// ==========================================================================
// Evidence Maturity Model — Public API
// ==========================================================================
//
// Boundary: This package does NOT import from:
// - @kadarn/evidence-core (types-only, no runtime dependency)
// - @kadarn/readiness-engine
// - @kadarn/capability-intelligence
// - @kadarn/sponsor-intelligence
//
// This package is a VALIDATION layer. It evaluates maturity.
// It does NOT create truth. It does NOT certify. It does NOT score institutions.
// ==========================================================================

export { EvidenceMaturityLevel, MATURITY_SCORE_MAP } from './types'
export type {
  EvidenceMaturityAssessment,
  MaturityEvaluationInput,
} from './types'

export { evaluateMaturity } from './evaluator'

export {
  computeMaturityLevel,
  computeFreshnessStatus,
  computeFreshnessCap,
  computeProvenanceCap,
  computeConflictImpact,
  computeConflictStatus,
  generateNextActions,
  applyCapsAndConflicts,
} from './rules'
