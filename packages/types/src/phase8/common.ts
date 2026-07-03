// ==========================================================================
// Phase 8 Contracts — Common types
// Sprint 27E draft. KEMS-004 §6 normative where noted.
// ==========================================================================

export type IsoDateTime = string

export type ActorType = 'user' | 'service' | 'system'

/** KEMS-004 §6.6 — normative */
export interface ActorRef {
  actor_type: ActorType
  actor_id: string
  org_id: string
  display_name?: string
}

export type SpanAddressType =
  | 'byte_span'
  | 'json_pointer'
  | 'xpath'
  | 'cell_ref'
  | 'media_timestamp'

/** KEMS-004 §6.3 — normative */
export interface SpanRef {
  address_type: SpanAddressType
  address_value: string
  source_version_id: string
}

export type FactRole = 'primary' | 'supporting' | 'context' | 'contradicting'

export type EvidenceClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export type ProviderClass =
  | 'CTMS'
  | 'LIMS'
  | 'eTMF'
  | 'EMR'
  | 'EDC'
  | 'VILO_OS'
  | 'OTHER'

export type DegradationTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4'

export type SchemaVersionStatus = 'draft' | 'published' | 'deprecated' | 'archived'

export type CompatibilityContractType =
  | 'FULL_FORWARD'
  | 'ADDITIVE'
  | 'BREAKING'
  | 'DEPRECATED'

export type ReviewEventType =
  | 'review_requested'
  | 'approved'
  | 'rejected'
  | 'counter_evidence'
  | 'right_of_response'
  | 'expired'
  | 'republished'
  | 'correction'

export type ConfidenceLevel = 'high' | 'moderate' | 'low' | 'insufficient'

export type EvidencePackVariant = 'institution' | 'sponsor' | 'audit' | 'public'

export type ReconstructionErrorCode =
  | 'ERR_CLAIM_NOT_FOUND'
  | 'ERR_PROVENANCE_MISSING'
  | 'ERR_FACT_MISSING'
  | 'ERR_EXTRACTION_RUN_MISSING'
  | 'ERR_LINEAGE_BROKEN'
  | 'ERR_HASH_MISMATCH'
  | 'ERR_RULE_ARCHIVED'

export type IntegrityWarning = 'RULE_REPLAY_DRIFT' | 'ARCHIVED_SOURCE'
