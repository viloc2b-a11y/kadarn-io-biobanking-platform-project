// ==========================================================================
// Phase 8 Contracts — Confidence (28F)
// ADR-029 — derived state, not stored on Claim
// ==========================================================================

import type { ConfidenceLevel, IsoDateTime } from './common.js'

/** Derived at read time — NOT immutable Claim field */
export interface ConfidenceState {
  claim_id: string
  level: ConfidenceLevel
  value: number
  explanation: string
  computed_at: IsoDateTime
  engine_version: string
  graph_version?: string
}

/** Optional materialized cache — rebuildable, not source of truth */
export interface ConfidenceStateCache {
  claim_id: string
  state: ConfidenceState
  graph_version: string
  invalidated_at?: IsoDateTime
}
