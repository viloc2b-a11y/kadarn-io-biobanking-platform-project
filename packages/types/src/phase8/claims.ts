// ==========================================================================
// Phase 8 Contracts — Claims (28C / 28E / 28I)
// ==========================================================================

import type { IsoDateTime } from './common.js'

export type ClaimLifecycleState =
  | 'candidate'
  | 'active'
  | 'disputed'
  | 'expired'
  | 'superseded'
  | 'provenance_incomplete'

export interface ClaimInstance {
  claim_instance_id: string
  claim_type_id: string
  org_id: string
  subject_entity_id: string
  lifecycle_state: ClaimLifecycleState
  current_claim_version_id: string
  created_at: IsoDateTime
}

export interface ClaimVersion {
  claim_version_id: string
  claim_instance_id: string
  schema_version_id: string
  /** Immutable JSON payload — never UPDATE */
  payload: Record<string, unknown>
  content_hash: string
  created_at: IsoDateTime
  supersedes_version_id?: string
}

/** Alias for Core operations keyed by claim_id */
export type Claim = ClaimVersion & {
  claim_id: string
}

export type ClaimCandidateStatus =
  | 'proposed'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired'

export interface ClaimCandidate {
  candidate_id: string
  claim_type_id: string
  org_id: string
  subject_entity_id: string
  fact_ids: string[]
  rule_id: string
  rule_version: string
  proposed_payload: Record<string, unknown>
  status: ClaimCandidateStatus
  discovery_session_id?: string
  discovery_candidate_ref?: string
  created_at: IsoDateTime
}
