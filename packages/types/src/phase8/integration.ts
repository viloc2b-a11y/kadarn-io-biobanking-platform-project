// ==========================================================================
// Phase 8 Contracts — Systems integration (28J)
// KEMS-006 draft
// ==========================================================================

import type {
  ActorRef,
  DegradationTier,
  IsoDateTime,
  ProviderClass,
} from './common.js'
import type { CanonicalClaimViewModel } from './schema-evolution.js'

export interface IntegrationSource {
  source_id: string
  source_type: string
  provider_class: ProviderClass
  provider_ref: string
  org_id: string
  canonical_identity_id?: string
  connector_id: string
  created_at: IsoDateTime
}

export type InboundPullMode = 'incremental' | 'backfill' | 'on_demand'

export interface InboundPullRequest {
  connector_id: string
  org_id: string
  pull_mode: InboundPullMode
  cursor?: string
  since?: IsoDateTime
  correlation_id: string
  requested_by: ActorRef
}

export interface InboundPullResponse {
  correlation_id: string
  source_version_ids: string[]
  records_processed: number
  duplicates_skipped: number
  degradation_tier: DegradationTier
}

export interface WebhookEnvelope {
  event_id: string
  event_type: string
  occurred_at: IsoDateTime
  payload: Record<string, unknown>
  provider_ref: string
}

export interface InboundWebhookResponse {
  accepted: boolean
  source_version_id?: string
  duplicate: boolean
  correlation_id: string
}

export interface IntegrationFreshness {
  provider_class: ProviderClass
  last_successful_sync_at?: IsoDateTime
  degradation_tier: DegradationTier
  stale_reason?: string
}

export interface OutboundPublishedViewResponse {
  view_id: string
  schema_version: string
  projection: CanonicalClaimViewModel
  freshness: IntegrationFreshness
  evidence_pack_summary_ref?: string
}

export type IntegrationAuditEventType =
  | 'IntegrationPullStarted'
  | 'IntegrationPullCompleted'
  | 'IntegrationPullFailed'
  | 'WebhookReceived'
  | 'OutboundViewAccessed'
  | 'ConnectorDegraded'

export interface IntegrationAuditEvent {
  event_type: IntegrationAuditEventType
  connector_id: string
  org_id: string
  correlation_id: string
  occurred_at: IsoDateTime
  metadata?: Record<string, unknown>
}
