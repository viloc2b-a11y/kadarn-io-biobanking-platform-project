// ==========================================================================
// Domain Events — Runtime (versions, envelope, replay types)
// ==========================================================================

import type { DomainEvent } from './index';

/** Schema version per event type — bump when payload shape changes */
export const EVENT_VERSIONS: Record<string, number> = {
  OrganizationCreated: 1,
  OrganizationUpdated: 1,
  OrganizationMembershipAdded: 1,
  OrganizationMembershipRemoved: 1,
  OrganizationCapabilityAdded: 1,
  OrganizationCapabilityRemoved: 1,
  ProgramCreated: 1,
  ProgramUpdated: 1,
  ProgramStatusChanged: 1,
  ProgramParticipantAdded: 1,
  ProgramParticipantRemoved: 1,
  ProgramParticipantRoleChanged: 1,
  FeasibilityAssessmentCompleted: 1,
  CollectionCreated: 1,
  ShipmentCreated: 1,
  ShipmentStatusChanged: 1,
  QcCompleted: 1,
  SettlementInitiated: 1,
  SettlementStatusChanged: 1,
  SupplyItemCreated: 1,
  ExchangeDealCreated: 1,
  AccessRequestSubmitted: 1,
  AccessRequestApproved: 1,
  AccessRequestRejected: 1,
  AuditEventCreated: 1,
  WorkflowSignalRequested: 1,
  PolicyShadowEvaluated: 1,
  TrustScoreEvaluated: 1,
  TrustEventRecorded: 1,
  InvoiceIssued: 1,
  PaymentRecorded: 1,
  SettlementReconciled: 1,
  ProvenanceRecordRequested: 1,
  DataErasureRequested: 1,
  PipelineStageCompleted: 1,
  AnalyticsProjectionRequested: 1,
  DiscoveryContextEnriched: 1,
  TermNormalizationRecorded: 1,
  KnowledgeEntityLinked: 1,
  SiteContinuityProfileCreated: 1,
  ContinuityExperienceAdded: 1,
  ContinuityCapabilityAdded: 1,
  ContinuityCapabilityUpdated: 1,
  ContinuityPerformanceMetricRecorded: 1,
  ContinuityRelationshipCreated: 1,
  ContinuityTimelineEventRecorded: 1,
  ContinuityEvidenceLinked: 1,
  SitePassportPublished: 1,
  SitePassportUpdated: 1,
  LegacyExperienceClaimCreated: 1,
  LegacyExperienceClaimUpdated: 1,
  ContinuityEvidenceSubmitted: 1,
  ContinuityReferenceAdded: 1,
  ContinuityReferenceConfirmed: 1,
  ContinuityClaimVerified: 1,
  ContinuityClaimRejected: 1,
  ClaimConfidenceScoreUpdated: 1,
};

export function getEventVersion(eventType: string): number {
  return EVENT_VERSIONS[eventType] ?? 1;
}

/** Legacy envelope shape used by event catalog tests */
export interface EventEnvelope {
  event_id: string;
  event_type: string;
  version: number;
  occurred_at: string;
  recorded_at: string;
  actor_id: string;
  organization_id: string | null;
  tenant_id: string | null;
  subject_type: string | null;
  subject_id: string | null;
  correlation_id: string | null;
  causation_id: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export function toEventEnvelope(event: DomainEvent): EventEnvelope {
  const payload = event.payload as Record<string, unknown>;
  return {
    event_id: event.id,
    event_type: event.type,
    version: event.version,
    occurred_at: event.occurredAt,
    recorded_at: event.occurredAt,
    actor_id: event.actorId,
    organization_id: event.organizationId,
    tenant_id: event.organizationId,
    subject_type: typeof payload.resourceType === 'string' ? payload.resourceType : null,
    subject_id: typeof payload.resourceId === 'string' ? payload.resourceId : null,
    correlation_id: event.correlationId,
    causation_id: null,
    payload,
    metadata: {},
  };
}

export interface ReplayFilter {
  from: string;
  to?: string | null;
  eventTypes?: string[] | null;
  correlationId?: string | null;
  limit?: number;
}

export interface StoredDomainEvent {
  id: string;
  eventType: string;
  eventVersion: number;
  occurredAt: string;
  recordedAt: string;
  actorId: string;
  organizationId: string | null;
  programId: string | null;
  correlationId: string | null;
  causationId: string | null;
  idempotencyKey: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface AppendEventResult {
  eventId: string;
  duplicate: boolean;
  outboxId: string | null;
}

export interface EventStore {
  append(input: {
    eventType: string;
    payload: Record<string, unknown>;
    actorId: string;
    organizationId?: string | null;
    programId?: string | null;
    correlationId?: string | null;
    causationId?: string | null;
    idempotencyKey?: string | null;
    eventVersion?: number;
    metadata?: Record<string, unknown>;
  }): Promise<AppendEventResult>;

  replay(filter: ReplayFilter): Promise<StoredDomainEvent[]>;
}
