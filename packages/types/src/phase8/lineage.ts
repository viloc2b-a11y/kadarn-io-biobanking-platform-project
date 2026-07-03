// ==========================================================================
// Phase 8 Contracts — Evidence lineage (28A)
// Chain: Source → SourceVersion → Artifact → ExtractionRun → ExtractedFact
// ==========================================================================

import type { EvidenceClass, IsoDateTime, SpanRef } from './common.js'

export type SourceType =
  | 'uploaded_document'
  | 'ctms_document'
  | 'ctms_event'
  | 'lims_event'
  | 'etmf_reference'
  | 'emr_structured'
  | 'edc_event'
  | 'vilo_profile'
  | 'connector_record'
  | 'other'

export interface Source {
  source_id: string
  source_type: SourceType
  provider_class?: string
  provider_ref?: string
  org_id: string
  canonical_identity_id?: string
  connector_id?: string
  external_url?: string
  created_at: IsoDateTime
}

export interface SourceVersion {
  source_version_id: string
  source_id: string
  content_hash: string
  ingested_at: IsoDateTime
  connector_id: string
  correlation_id: string
  byte_size?: number
  mime_type?: string
}

export interface Artifact {
  artifact_id: string
  source_version_id: string
  storage_ref: string
  mime_type: string
  byte_size: number
  created_at: IsoDateTime
}

export type ExtractionRunStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ExtractionRun {
  run_id: string
  artifact_id: string
  parser_version: string
  model_version: string
  pipeline_version: string
  resolution_run_id?: string
  started_at: IsoDateTime
  completed_at?: IsoDateTime
  status: ExtractionRunStatus
  correlation_id: string
}

export interface ExtractedFact {
  fact_id: string
  extraction_run_id: string
  /** Human-readable or structured value — not a Claim */
  value: string
  semantic_type: string
  span: SpanRef
  evidence_class?: EvidenceClass
  /** Discovery/engine confidence input — NOT Claim confidence */
  confidence_input?: number
  normalized_entity_ids?: string[]
  created_at: IsoDateTime
}
