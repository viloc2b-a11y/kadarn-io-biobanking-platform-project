// ==========================================================================
// Phase 8 Contracts — ClaimProvenance (28E)
// KEMS-004 §6 — NORMATIVE
// ==========================================================================

import type {
  ActorRef,
  FactRole,
  IsoDateTime,
  SpanRef,
} from './common.js'

export interface FactRef {
  fact_id: string
  role: FactRole
  selection_reason?: string
  /** MUST be present at insert — KEMS-004 CP-V01 */
  offset_snapshot: SpanRef
  entity_refs?: string[]
  /** Only when source archived — KEMS-004 §6.3 */
  fact_text_snapshot?: string
}

export interface RuleRef {
  rule_id: string
  rule_version: string
  rule_set_id: string
  evaluation_trace_id?: string
}

export interface EngineRef {
  engine_id: string
  engine_version: string
  pipeline_version: string
}

export type ModelRole = 'parser' | 'extractor' | 'classifier' | 'generator'

export interface ModelRef {
  model_role: ModelRole
  model_id: string
  model_version: string
}

/** Inputs only — MUST NOT store derived Confidence Value — KEMS-004 §6.5 */
export interface ConfidenceInputSnapshot {
  captured_at: IsoDateTime
  fact_confidence_values: Record<string, number>
  evidence_class_refs: string[]
  graph_snapshot_ref?: string
}

/** KEMS-004 §6.2 — normative shape */
export interface ClaimProvenance {
  provenance_id: string
  claim_id: string
  claim_version: string
  fact_refs: FactRef[]
  source_version_refs: string[]
  extraction_run_refs: string[]
  rule_ref: RuleRef
  engine_ref: EngineRef
  model_refs: ModelRef[]
  created_at: IsoDateTime
  created_by: ActorRef
  promotion_event_id?: string
  confidence_inputs: ConfidenceInputSnapshot
  /** Authoritative for reconstruction — KEMS-004 §7.2 */
  rule_output_snapshot: Record<string, unknown>
  content_hash: string
  provenance_schema_version: string
  supersedes_provenance_id?: string
}

export interface RuleDefinition {
  rule_id: string
  rule_version: string
  rule_set_id: string
  definition: Record<string, unknown>
  archived_at?: IsoDateTime
}
