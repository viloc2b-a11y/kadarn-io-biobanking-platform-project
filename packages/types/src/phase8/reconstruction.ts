// ==========================================================================
// Phase 8 Contracts — Reconstruction (28E)
// KEMS-004 §7 — NORMATIVE
// ==========================================================================

import type { IntegrityWarning, IsoDateTime, ReconstructionErrorCode } from './common.js'
import type { Claim } from './claims.js'
import type { ExtractionRun, ExtractedFact, SourceVersion } from './lineage.js'
import type {
  ClaimProvenance,
  ConfidenceInputSnapshot,
  RuleDefinition,
} from './provenance.js'

export type ExplanationStepType =
  | 'source_ingest'
  | 'fact_extracted'
  | 'entity_resolved'
  | 'rule_applied'
  | 'review_promotion'
  | 'actor_recorded'

export interface ExplanationStep {
  step_index: number
  step_type: ExplanationStepType
  timestamp?: IsoDateTime
  summary: string
  refs: Record<string, string>
}

export interface ReconstructionVerification {
  content_hash_valid: boolean
  facts_complete: boolean
  sources_reachable: boolean
  integrity_warning?: IntegrityWarning | null
}

export interface ReconstructionResult {
  claim: Claim
  provenance: ClaimProvenance
  facts: ExtractedFact[]
  sources: SourceVersion[]
  extraction_runs: ExtractionRun[]
  rule: RuleDefinition
  explanation_steps: ExplanationStep[]
  confidence_inputs: ConfidenceInputSnapshot
  verification: ReconstructionVerification
}

export interface ReconstructOptions {
  include_explanation?: boolean
  verify_rule_replay?: boolean
  provenance_id?: string
}

export interface ReconstructionError {
  code: ReconstructionErrorCode
  message: string
  claim_id?: string
  detail?: Record<string, unknown>
}

export type ReconstructOutcome = ReconstructionResult | ReconstructionError

export function isReconstructionError(
  outcome: ReconstructOutcome,
): outcome is ReconstructionError {
  return 'code' in outcome && outcome.code.startsWith('ERR_')
}
