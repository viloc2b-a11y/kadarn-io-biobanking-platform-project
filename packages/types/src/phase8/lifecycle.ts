// ==========================================================================
// Phase 8 Contracts — Review lifecycle (28E)
// ADR-028
// ==========================================================================

import type { ActorRef, IsoDateTime, ReviewEventType } from './common.js'

export interface ReviewEvent {
  event_id: string
  claim_instance_id: string
  claim_id: string
  event_type: ReviewEventType
  actor: ActorRef
  occurred_at: IsoDateTime
  reason?: string
  related_fact_ids?: string[]
  related_provenance_id?: string
  metadata?: Record<string, unknown>
}
