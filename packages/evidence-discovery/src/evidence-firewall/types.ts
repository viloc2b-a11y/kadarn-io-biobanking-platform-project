// ==========================================================================
// Evidence Firewall — Types (Sprint 23C)
// ==========================================================================
// Mandatory protection layer between Identity Resolution and Discovery.
// Never modifies evidence. Never evaluates capability. Never computes confidence.
// ==========================================================================

export type FirewallDecision = 'accepted' | 'accepted_with_warning' | 'needs_review' | 'quarantined' | 'rejected'

export type ValidationRule =
  | 'source_validation'
  | 'identity_validation'
  | 'duplicate_detection'
  | 'temporal_consistency'
  | 'structural_validation'
  | 'cross_source_corroboration'
  | 'conflict_detection'

export interface FirewallValidationResult {
  rule: ValidationRule
  passed: boolean
  decision: FirewallDecision
  warnings: string[]
  errors: string[]
}

export interface EvidencePayload {
  id: string
  source_provider: string
  canonical_identity_id: string
  object_type: 'publication' | 'study' | 'sop' | 'certification' | 'investigator_record' | 'infrastructure' | 'other'
  payload: Record<string, unknown>
  retrieved_at: string
  metadata: Record<string, unknown>
}

export interface EvidenceQuarantineEntry {
  id: string
  reason: string
  source: string
  canonical_identity: string
  detected_at: string
  firewall_state: FirewallDecision
  review_required: boolean
  metadata: Record<string, unknown>
  original_payload: EvidencePayload
}

export interface FirewallReviewItem {
  id: string
  reason: string
  evidence_ids: string[]
  description: string
  created_at: string
  status: 'open' | 'reviewed' | 'resolved'
}

export interface FirewallDecisionOutput {
  decision: FirewallDecision
  evidence_id: string
  validation_results: FirewallValidationResult[]
  quarantine_entry?: EvidenceQuarantineEntry
  review_items: FirewallReviewItem[]
  processed_at: string
}

export interface FirewallStatus {
  accepted: number
  accepted_with_warning: number
  needs_review: number
  quarantined: number
  rejected: number
  total_processed: number
  last_processed_at: string | null
}
