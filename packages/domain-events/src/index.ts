// ==========================================================================
// Kadarn Domain Events — Event Contracts
// Status: Experimental (may change without notice until v1.0.0)
// ==========================================================================
// This file defines the domain event contracts for Kadarn.
// These are the canonical event types that every engine will emit and consume.
//
// Event naming convention: {Entity}{Action} — past tense, PascalCase
//   Examples: OrganizationCreated, ProgramParticipantAdded
//
// Until a real event bus is implemented (Sprint 2 — Platform Services),
// these contracts serve as the authoritative reference for what events
// exist and what payload they carry.
// ==========================================================================

// --------------------------------------------------------------------------
// Event envelope — every event wraps this structure
// --------------------------------------------------------------------------
export interface DomainEvent<T = Record<string, unknown>> {
  /** Unique event ID (UUID v4) */
  id: string;

  /** Event type, e.g. "OrganizationCreated" */
  type: string;

  /** Event version for schema evolution */
  version: number;

  /** ISO 8601 timestamp of when the event occurred */
  occurredAt: string;

  /** Who caused this event (auth.users UUID) */
  actorId: string;

  /** Organization context (UUID or null for system events) */
  organizationId: string | null;

  /** Program context (UUID or null if not program-scoped) */
  programId: string | null;

  /** Correlation ID to link events across engines (policy, workflow, provenance) */
  correlationId: string | null;

  /** Event-specific payload */
  payload: T;
}

// --------------------------------------------------------------------------
// Organization events
// --------------------------------------------------------------------------
export interface OrganizationCreatedPayload {
  organizationId: string;
  name: string;
  country: string;
  createdBy: string;
}

export interface OrganizationUpdatedPayload {
  organizationId: string;
  changedFields: string[];
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface OrganizationMembershipAddedPayload {
  membershipId: string;
  organizationId: string;
  userId: string;
  role: string;
}

export interface OrganizationMembershipRemovedPayload {
  membershipId: string;
  organizationId: string;
  userId: string;
}

// --------------------------------------------------------------------------
// Capability events
// --------------------------------------------------------------------------
export interface OrganizationCapabilityAddedPayload {
  organizationId: string;
  capabilityKey: string;
  isPrimary: boolean;
}

export interface OrganizationCapabilityRemovedPayload {
  organizationId: string;
  capabilityKey: string;
}

// --------------------------------------------------------------------------
// Program events
// --------------------------------------------------------------------------
export interface ProgramCreatedPayload {
  programId: string;
  name: string;
  sponsorOrganizationId: string;
  leadOrganizationId: string | null;
  createdBy: string;
}

export interface ProgramUpdatedPayload {
  programId: string;
  changedFields: string[];
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface ProgramStatusChangedPayload {
  programId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
}

export interface ProgramParticipantAddedPayload {
  participantId: string;
  programId: string;
  organizationId: string;
  role: string;
}

export interface ProgramParticipantRemovedPayload {
  participantId: string;
  programId: string;
  organizationId: string;
}

export interface ProgramParticipantRoleChangedPayload {
  participantId: string;
  programId: string;
  organizationId: string;
  fromRole: string;
  toRole: string;
}

// --------------------------------------------------------------------------
// Feasibility events
// --------------------------------------------------------------------------
export interface FeasibilityAssessmentCompletedPayload {
  assessmentId: string;
  organizationId: string;
  programName: string;
  score: number;
  completedBy: string;
}

// --------------------------------------------------------------------------
// Exchange deal events
// --------------------------------------------------------------------------
export interface ExchangeDealCreatedPayload {
  dealId: string;
  requestId: string;
  sponsorOrgId: string;
  providerOrgId: string;
  title: string;
  totalValue: number | null;
  createdBy: string;
}

// --------------------------------------------------------------------------
// Collection events
// --------------------------------------------------------------------------
export interface CollectionCreatedPayload {
  collectionId: string;
  organizationId: string;
  name: string;
  createdBy: string;
}

// --------------------------------------------------------------------------
// Shipment events
// --------------------------------------------------------------------------
export interface ShipmentCreatedPayload {
  shipmentId: string;
  organizationId: string;
  programId: string;
  carrier: string;
  createdBy: string;
}

export interface ShipmentStatusChangedPayload {
  shipmentId: string;
  organizationId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
}

// --------------------------------------------------------------------------
// QC events
// --------------------------------------------------------------------------
export interface QcCompletedPayload {
  aliquotId: string;
  sampleId: string;
  qcStatus: string;
  organizationId: string;
  completedBy: string;
}

// --------------------------------------------------------------------------
// Settlement events
// --------------------------------------------------------------------------
export interface SettlementStatusChangedPayload {
  settlementId: string;
  dealId: string;
  fromStatus: string;
  toStatus: string;
  amount: number;
  organizationId: string | null;
  changedBy: string;
  reason: string | null;
}

export interface SettlementInitiatedPayload {
  dealId: string;
  organizationId: string;
  amount: number | null;
  initiatedBy: string;
}

// --------------------------------------------------------------------------
// Supply item events
// --------------------------------------------------------------------------
export interface SupplyItemCreatedPayload {
  supplyItemId: string;
  organizationId: string;
  type: string;
  title: string;
  createdBy: string;
  sampleTypes?: string[];
  diseaseLabel?: string | null;
  diseaseIcd10?: string | null;
}

// --------------------------------------------------------------------------
// Access events
// --------------------------------------------------------------------------
export interface AccessRequestSubmittedPayload {
  requestId: string;
  programId: string;
  researcherId: string;
  requirements: Record<string, unknown>;
}

export interface AccessRequestApprovedPayload {
  requestId: string;
  programId: string;
  approvedBy: string;
}

export interface AccessRequestRejectedPayload {
  requestId: string;
  programId: string;
  rejectedBy: string;
  reason: string;
}

// --------------------------------------------------------------------------
// Audit events
// --------------------------------------------------------------------------
export interface AuditEventCreatedPayload {
  auditEventId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  actorId: string;
  organizationId: string | null;
  summary: string | null;
}

export interface WorkflowSignalRequestedPayload {
  workflowType: string;
  signal: string;
  payload: Record<string, unknown>;
}

export interface PolicyShadowEvaluatedPayload {
  actorId: string;
  actorRole: string;
  organizationId: string;
  correlationId: string;
}

export interface TrustEventRecordedPayload {
  organizationId: string;
  eventId: string;
  dimension: string;
  source: string;
  scoreBefore: number;
  scoreAfter: number;
  evidenceRef: string;
}

export interface InvoiceIssuedPayload {
  settlementId: string;
  dealId: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  organizationId: string | null;
}

export interface PaymentRecordedPayload {
  settlementId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  organizationId: string | null;
}

export interface SettlementReconciledPayload {
  settlementId: string;
  expectedAmount: number;
  paidAmount: number;
  releasedAmount: number;
  variance: number;
  status: string;
  organizationId: string | null;
}

export interface ProvenanceRecordRequestedPayload {
  nodeType: string;
  externalId: string;
  label: string;
  organizationId: string | null;
  properties: Record<string, unknown>;
}

export interface DataErasureRequestedPayload {
  userId: string;
  organizationId: string | null;
  requestedBy: string;
  scope: string;
}

export interface PipelineStageCompletedPayload {
  pipeline: string;
  stage: string;
  organizationId: string | null;
}

export interface AnalyticsProjectionRequestedPayload {
  projectionType: string;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  correlationId: string;
}

export interface DiscoveryContextEnrichedPayload {
  query: string;
  expandedTerms?: string[];
  matchCount?: number;
  organizationId: string | null;
  pipeline?: string;
}

export interface TermNormalizationRecordedPayload {
  entityType: string;
  entityId: string;
  vocabulary: string;
  originalTerm: string;
  normalizedTerm: string;
  confidence: number;
  organizationId: string | null;
}

export interface KnowledgeEntityLinkedPayload {
  entityType: string;
  entityId: string;
  termId: string;
  vocabulary: string;
  normalizedLabel: string;
  organizationId: string | null;
}

// --------------------------------------------------------------------------
// Continuity events
// --------------------------------------------------------------------------
export type ContinuitySourceType =
  | 'self_reported'
  | 'document_backed'
  | 'event_derived'
  | 'sponsor_confirmed'
  ;

export type ContinuityVerificationStatus =
  | 'unverified'
  | 'pending'
  | 'evidence_backed'
  | 'verified'
  | 'rejected';

export type ContinuityVisibility = 'private' | 'shared_link' | 'public';

export interface SiteContinuityProfileCreatedPayload {
  profileId: string;
  organizationId: string;
  siteType: string;
  status: string;
  sourceType: ContinuitySourceType;
  createdBy: string;
}

export interface ContinuityExperienceAddedPayload {
  experienceId: string;
  profileId: string;
  organizationId: string;
  programId: string | null;
  category: string;
  experienceKey: string;
  experienceLabel: string;
  sourceType: ContinuitySourceType;
  verificationStatus: ContinuityVerificationStatus;
  visibility: ContinuityVisibility;
}

export interface ContinuityCapabilityAddedPayload {
  capabilityId: string;
  profileId: string;
  organizationId: string;
  capabilityCategory: string;
  capabilityKey: string;
  capabilityLabel: string;
  sourceType: ContinuitySourceType;
  verificationStatus: ContinuityVerificationStatus;
  visibility: ContinuityVisibility;
}

export interface ContinuityCapabilityUpdatedPayload {
  capabilityId: string;
  profileId: string;
  organizationId: string;
  changedFields: string[];
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  updatedBy: string;
}

export interface ContinuityPerformanceMetricRecordedPayload {
  metricId: string;
  profileId: string;
  organizationId: string;
  programId: string | null;
  metricCategory: string;
  metricKey: string;
  metricLabel: string;
  metricValue: number | null;
  metricUnit: string | null;
  sourceType: ContinuitySourceType;
  verificationStatus: ContinuityVerificationStatus;
  evidenceWeight: number;
}

export interface ContinuityRelationshipCreatedPayload {
  relationshipId: string;
  profileId: string;
  organizationId: string;
  counterpartyOrgId: string | null;
  programId: string | null;
  relationshipType: string;
  sponsorNamePolicy: 'private' | 'masked' | 'permissioned' | 'public';
  sourceType: ContinuitySourceType;
  verificationStatus: ContinuityVerificationStatus;
}

export interface ContinuityTimelineEventRecordedPayload {
  timelineEventId: string;
  profileId: string;
  organizationId: string;
  programId: string | null;
  eventType: string;
  title: string;
  occurredAt: string;
  sourceType: ContinuitySourceType;
  verificationStatus: ContinuityVerificationStatus;
  visibility: ContinuityVisibility;
}

export interface ContinuityEvidenceLinkedPayload {
  evidenceLinkId: string;
  profileId: string;
  organizationId: string;
  claimTable: string;
  claimId: string;
  evidenceType: string;
  provenanceEvidenceId: string | null;
  auditEventId: string | null;
  domainEventId: string | null;
  trustEventId: string | null;
  verificationStatus: ContinuityVerificationStatus;
  visibility: ContinuityVisibility;
}

export interface SitePassportPublishedPayload {
  profileId: string;
  organizationId: string;
  visibility: ContinuityVisibility;
  publicSlug: string | null;
  publishedAt: string;
  publishedBy: string;
}

export interface SitePassportUpdatedPayload {
  profileId: string;
  organizationId: string;
  visibility: ContinuityVisibility;
  changedFields: string[];
  updatedBy: string;
}

export type LegacyClaimVerificationStatus =
  | 'self_reported'
  | 'evidence_submitted'
  | 'reference_pending'
  | 'reference_confirmed'
   
  | 'rejected'
  | 'expired';

export interface LegacyExperienceClaimCreatedPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    profileId: string;
    claimType: string;
    category: string;
    title: string;
    experienceSource: 'legacy' | 'native';
    verificationStatus: LegacyClaimVerificationStatus;
    confidenceScore: number;
    isPublic: boolean;
  };
}

export interface LegacyExperienceClaimUpdatedPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    changedFields: string[];
    oldValues: Record<string, unknown>;
    newValues: Record<string, unknown>;
  };
}

export interface ContinuityEvidenceSubmittedPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    evidenceItemId: string;
    evidenceType: string;
    title: string;
    hasFileUrl: boolean;
    hasExternalUrl: boolean;
    hasDocumentId: boolean;
  };
}

export interface ContinuityReferenceAddedPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    referenceId: string;
    referenceType: string;
    referenceOrganization: string | null;
    referenceRole: string | null;
    status: string;
  };
}

export interface ContinuityReferenceConfirmedPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    referenceId: string;
    confirmedAt: string;
    confidenceScore: number;
  };
}

export interface ContinuityClaimVerifiedPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    verificationStatus: string;
    confidenceScore: number;
  };
}

export interface ContinuityClaimSubmittedPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    previousStatus: string;
    badgeLevel: string;
  };
}

export interface ContinuityClaimPromotedToLedgerPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    ledgerEntryId: string;
    badgeLevel: string;
    claimTitle: string;
  };
}

export interface ContinuityClaimRejectedPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    verificationStatus: 'rejected';
    confidenceScore: 0;
    reason: string;
  };
}

export interface ClaimConfidenceScoreUpdatedPayload {
  eventId: string;
  organizationId: string;
  claimId: string;
  actorId: string;
  occurredAt: string;
  payload: {
    previousScore: number;
    nextScore: number;
    reason: string;
  };
}

// --------------------------------------------------------------------------
// Event registry — maps event types to their payloads
// --------------------------------------------------------------------------
export interface KadarnEventMap {
  OrganizationCreated: OrganizationCreatedPayload;
  OrganizationUpdated: OrganizationUpdatedPayload;
  OrganizationMembershipAdded: OrganizationMembershipAddedPayload;
  OrganizationMembershipRemoved: OrganizationMembershipRemovedPayload;
  OrganizationCapabilityAdded: OrganizationCapabilityAddedPayload;
  OrganizationCapabilityRemoved: OrganizationCapabilityRemovedPayload;
  ProgramCreated: ProgramCreatedPayload;
  ProgramUpdated: ProgramUpdatedPayload;
  ProgramStatusChanged: ProgramStatusChangedPayload;
  ProgramParticipantAdded: ProgramParticipantAddedPayload;
  ProgramParticipantRemoved: ProgramParticipantRemovedPayload;
  ProgramParticipantRoleChanged: ProgramParticipantRoleChangedPayload;
  FeasibilityAssessmentCompleted: FeasibilityAssessmentCompletedPayload;
  CollectionCreated: CollectionCreatedPayload;
  ShipmentCreated: ShipmentCreatedPayload;
  ShipmentStatusChanged: ShipmentStatusChangedPayload;
  QcCompleted: QcCompletedPayload;
  SettlementInitiated: SettlementInitiatedPayload;
  SettlementStatusChanged: SettlementStatusChangedPayload;
  SupplyItemCreated: SupplyItemCreatedPayload;
  ExchangeDealCreated: ExchangeDealCreatedPayload;
  AccessRequestSubmitted: AccessRequestSubmittedPayload;
  AccessRequestApproved: AccessRequestApprovedPayload;
  AccessRequestRejected: AccessRequestRejectedPayload;
  AuditEventCreated: AuditEventCreatedPayload;
  WorkflowSignalRequested: WorkflowSignalRequestedPayload;
  PolicyShadowEvaluated: PolicyShadowEvaluatedPayload;
  TrustEventRecorded: TrustEventRecordedPayload;
  InvoiceIssued: InvoiceIssuedPayload;
  PaymentRecorded: PaymentRecordedPayload;
  SettlementReconciled: SettlementReconciledPayload;
  ProvenanceRecordRequested: ProvenanceRecordRequestedPayload;
  DataErasureRequested: DataErasureRequestedPayload;
  PipelineStageCompleted: PipelineStageCompletedPayload;
  AnalyticsProjectionRequested: AnalyticsProjectionRequestedPayload;
  DiscoveryContextEnriched: DiscoveryContextEnrichedPayload;
  TermNormalizationRecorded: TermNormalizationRecordedPayload;
  KnowledgeEntityLinked: KnowledgeEntityLinkedPayload;
  SiteContinuityProfileCreated: SiteContinuityProfileCreatedPayload;
  ContinuityExperienceAdded: ContinuityExperienceAddedPayload;
  ContinuityCapabilityAdded: ContinuityCapabilityAddedPayload;
  ContinuityCapabilityUpdated: ContinuityCapabilityUpdatedPayload;
  ContinuityPerformanceMetricRecorded: ContinuityPerformanceMetricRecordedPayload;
  ContinuityRelationshipCreated: ContinuityRelationshipCreatedPayload;
  ContinuityTimelineEventRecorded: ContinuityTimelineEventRecordedPayload;
  ContinuityEvidenceLinked: ContinuityEvidenceLinkedPayload;
  SitePassportPublished: SitePassportPublishedPayload;
  SitePassportUpdated: SitePassportUpdatedPayload;
  LegacyExperienceClaimCreated: LegacyExperienceClaimCreatedPayload;
  LegacyExperienceClaimUpdated: LegacyExperienceClaimUpdatedPayload;
  ContinuityEvidenceSubmitted: ContinuityEvidenceSubmittedPayload;
  ContinuityReferenceAdded: ContinuityReferenceAddedPayload;
  ContinuityReferenceConfirmed: ContinuityReferenceConfirmedPayload;
  ContinuityClaimVerified: ContinuityClaimVerifiedPayload;
  ContinuityClaimSubmitted: ContinuityClaimSubmittedPayload;
  ContinuityClaimPromotedToLedger: ContinuityClaimPromotedToLedgerPayload;
  ContinuityClaimRejected: ContinuityClaimRejectedPayload;
  ClaimConfidenceScoreUpdated: ClaimConfidenceScoreUpdatedPayload;
}

/** Union of all known domain event types */
export type KadarnEventType = keyof KadarnEventMap;

/** Helper: extract payload type for a given event type */
export type KadarnEventPayload<T extends KadarnEventType> = KadarnEventMap[T];

// --------------------------------------------------------------------------
// Event bus interface (implemented in @kadarn/platform-services)
// --------------------------------------------------------------------------
export interface EventBus {
  publish<T extends KadarnEventType>(
    type: T,
    payload: KadarnEventPayload<T>,
    context: {
      actorId: string;
      organizationId?: string | null;
      programId?: string | null;
    },
  ): Promise<string>; // returns event ID

  subscribe<T extends KadarnEventType>(
    type: T,
    handler: (event: DomainEvent<KadarnEventPayload<T>>) => Promise<void>,
  ): Promise<() => void>; // returns unsubscribe function
}

export type { EventEnvelope, ReplayFilter, StoredDomainEvent, EventStore, AppendEventResult } from './runtime';
export { EVENT_VERSIONS, getEventVersion, toEventEnvelope } from './runtime';
