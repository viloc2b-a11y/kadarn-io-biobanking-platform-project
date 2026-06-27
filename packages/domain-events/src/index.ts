// ==========================================================================
// Kadarn Domain Events — Canonical Event Contracts v1.0
// ==========================================================================
// ADR-013: Event-First Platform
// Reference: docs/architecture/event-catalog.md
//
// Every event in Kadarn uses this envelope. Events are first-class
// architectural objects — immutable, versioned, traceable.
// ==========================================================================

// --------------------------------------------------------------------------
// Standard event envelope (ADR-013, Event Catalog §2)
// --------------------------------------------------------------------------
export interface EventEnvelope<T = Record<string, unknown>> {
  /** Globally unique event ID (UUID v4) — also serves as idempotency key */
  event_id: string;

  /** Event type, PascalCase, past tense: "SpecimenCollected" */
  event_type: string;

  /** Schema version for payload evolution (starts at 1) */
  version: number;

  /** ISO 8601 timestamp of when the event occurred */
  occurred_at: string;

  /** ISO 8601 timestamp of when the system recorded it */
  recorded_at: string;

  /** Who caused this event (auth.users UUID, system name, or process ID) */
  actor_id: string;

  /** Organization scope (UUID) */
  organization_id: string;

  /** Tenant isolation key (same as organization_id for single-tenant-per-org) */
  tenant_id: string;

  /** Type of subject entity: "specimen", "shipment", "program", etc. */
  subject_type: string;

  /** ID of the subject entity */
  subject_id: string;

  /** Traces the full command chain — all events from one command share this */
  correlation_id: string;

  /** Direct parent event ID (null for command-initiating events) */
  causation_id: string | null;

  /** Event-specific payload */
  payload: T;

  /** Free-form metadata: routing info, source system, version hints */
  metadata: Record<string, unknown>;
}

// --------------------------------------------------------------------------
// Backward-compatible alias
// --------------------------------------------------------------------------
export type DomainEvent<T = Record<string, unknown>> = EventEnvelope<T>;

// --------------------------------------------------------------------------
// Organization events (§3.1)
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
// Research Asset lifecycle events (§3.2)
// --------------------------------------------------------------------------
export interface ResearchAssetCreatedPayload {
  assetId: string;
  assetType: string;
  organizationId: string;
  specimenType?: string;
  collectionProtocol?: string;
  consentId?: string;
}

export interface SpecimenReservedPayload {
  specimenId: string;
  programId: string;
  reservedBy: string;
  expiresAt: string;
}

export interface CollectionStartedPayload {
  collectionId: string;
  programId: string;
  protocolId: string;
  siteId: string;
  targetCount: number;
}

export interface CollectionCompletedPayload {
  collectionId: string;
  actualCount: number;
  completedAt: string;
}

export interface SpecimenCollectedPayload {
  specimenId: string;
  collectionId: string;
  specimenType: string;
  containerType: string;
  preservationType: string;
  storageTemperature: string;
  initialQuantity: number;
  unit: string;
  consentStatus: string;
  consentId?: string;
}

export interface AliquotCreatedPayload {
  aliquotId: string;
  parentSpecimenId: string;
  volume: number;
  unit: string;
  containerType: string;
}

export interface QCCompletedPayload {
  batchId: string;
  qcType: string;
  passedCount: number;
  failedCount: number;
  performedBy: string;
}

export interface QCPassedPayload {
  specimenId: string;
  qcType: string;
  qcNotes?: string;
}

export interface QCFailedPayload {
  specimenId: string;
  qcType: string;
  failureReason: string;
  qcNotes?: string;
}

export interface FreezeThawRecordedPayload {
  specimenId: string;
  cycleNumber: number;
  durationHours?: number;
}

export interface VolumeAdjustedPayload {
  specimenId: string;
  volumeUsed: number;
  unit: string;
  purpose: string;
  remainingAfter: number;
}

export interface LocationChangedPayload {
  specimenId: string;
  organizationId: string;
  facility?: string;
  freezer?: string;
  rack?: string;
  box?: string;
  position?: string;
}

export interface ConsumedPayload {
  specimenId: string;
  purpose: string;
}

export interface DestroyedPayload {
  specimenId: string;
  reason: string;
}

// --------------------------------------------------------------------------
// Access & Governance events (§3.3)
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
  conditions?: string[];
}

export interface AccessRequestRejectedPayload {
  requestId: string;
  programId: string;
  rejectedBy: string;
  reason: string;
}

export interface ConsentVerifiedPayload {
  specimenId: string;
  consentId: string;
  consentStatus: string;
  verifiedBy: string;
}

export interface IRBApprovedPayload {
  irbId: string;
  programId: string;
  approvalDate: string;
  expirationDate: string;
  approvedBy: string;
}

export interface MTAExecutedPayload {
  mtaId: string;
  providerOrgId: string;
  recipientOrgId: string;
  specimenIds: string[];
  executedBy: string;
}

export interface ConsentUpdatedPayload {
  specimenId: string;
  consentStatus: string;
  consentId?: string;
  updatedBy: string;
}

export interface PolicyEvaluatedPayload {
  evaluationId: string;
  policyId: string;
  outcome: 'allow' | 'deny' | 'conditional';
  context: Record<string, unknown>;
  trace: unknown[];
}

// --------------------------------------------------------------------------
// Program & Feasibility events (§3.4)
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

export interface FeasibilityRequestedPayload {
  feasibilityId: string;
  programId: string;
  requirements: Record<string, unknown>;
  requestedBy: string;
}

export interface FeasibilityAssessmentCompletedPayload {
  feasibilityId: string;
  programId: string;
  result: 'feasible' | 'infeasible' | 'conditional';
  constraints?: string[];
}

// --------------------------------------------------------------------------
// Fulfillment & Logistics events (§3.5)
// --------------------------------------------------------------------------
export interface FulfillmentStartedPayload {
  fulfillmentId: string;
  requestId: string;
  specimenIds: string[];
}

export interface FulfillmentCompletedPayload {
  fulfillmentId: string;
  acceptedCount: number;
  disputedCount: number;
}

export interface FulfillmentPartiallyAcceptedPayload {
  fulfillmentId: string;
  acceptedCount: number;
  rejectedCount: number;
  rejectionReason: string;
}

export interface FulfillmentDisputedPayload {
  fulfillmentId: string;
  disputedBy: string;
  reason: string;
}

export interface ShipmentCreatedPayload {
  shipmentId: string;
  fulfillmentId: string;
  originOrgId: string;
  destinationOrgId: string;
  courier: string;
}

export interface ShipmentDispatchedPayload {
  shipmentId: string;
  dispatchedAt: string;
  trackingNumber?: string;
}

export interface TemperatureExcursionDetectedPayload {
  shipmentId: string;
  recordedTemperature: number;
  thresholdTemperature: number;
  durationMinutes: number;
  timestamp: string;
}

export interface ShipmentReceivedPayload {
  shipmentId: string;
  receivedAt: string;
  condition: 'intact' | 'damaged' | 'compromised';
}

export interface SpecimenAcceptedPayload {
  specimenId: string;
  shipmentId: string;
  condition: string;
  acceptedBy: string;
}

export interface ShipmentDeliveredPayload {
  shipmentId: string;
  confirmedBy: string;
}

export interface ShipmentAcceptedPayload {
  shipmentId: string;
  acceptedBy: string;
}

export interface ShipmentDisputedPayload {
  shipmentId: string;
  disputedBy: string;
  reason: string;
}

// --------------------------------------------------------------------------
// Settlement & Data events (§3.6)
// --------------------------------------------------------------------------
export interface SettlementReleasedPayload {
  settlementId: string;
  fulfillmentId: string;
  amount: number;
  currency: string;
  releasedBy: string;
}

export interface SettlementInitiatedPayload {
  settlementId: string;
  fulfillmentId: string;
  totalAmount: number;
  currency: string;
}

export interface PaymentDistributedPayload {
  settlementId: string;
  recipientOrgId: string;
  amount: number;
  currency: string;
}

export interface SettlementCompletedPayload {
  settlementId: string;
  fulfillmentId: string;
  settledAt: string;
}

export interface DatasetLinkedPayload {
  datasetId: string;
  specimenIds: string[];
  dataType: string;
  linkedBy: string;
}

export interface DataLinkedPayload {
  linkId: string;
  specimenId: string;
  source: string;
  dataType: string;
}

// --------------------------------------------------------------------------
// Trust & Accreditation events (§3.7)
// --------------------------------------------------------------------------
export interface TrustScoreUpdatedPayload {
  organizationId: string;
  dimension: string;
  previousScore: number;
  newScore: number;
  reason: string;
}

export interface AccreditationAddedPayload {
  organizationId: string;
  accreditationType: string;
  issuingBody: string;
  expiresAt: string;
}

export interface AccreditationExpiredPayload {
  organizationId: string;
  accreditationType: string;
  previouslyValidUntil: string;
}

export interface ComplianceIncidentPayload {
  organizationId: string;
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// --------------------------------------------------------------------------
// System & Integration events (§3.8)
// --------------------------------------------------------------------------
export interface IntegrationHealthyPayload {
  integrationId: string;
  systemName: string;
  checkedAt: string;
}

export interface IntegrationOutagePayload {
  integrationId: string;
  systemName: string;
  detectedAt: string;
  errorMessage: string;
}

export interface EventIngestionFailedPayload {
  sourceSystem: string;
  eventPayload: Record<string, unknown>;
  errorMessage: string;
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

// --------------------------------------------------------------------------
// Event registry — maps event types to their payloads
// --------------------------------------------------------------------------
export interface KadarnEventMap {
  // §3.1 Foundation & Identity
  OrganizationCreated: OrganizationCreatedPayload;
  OrganizationUpdated: OrganizationUpdatedPayload;
  OrganizationMembershipAdded: OrganizationMembershipAddedPayload;
  OrganizationMembershipRemoved: OrganizationMembershipRemovedPayload;
  OrganizationCapabilityAdded: OrganizationCapabilityAddedPayload;
  OrganizationCapabilityRemoved: OrganizationCapabilityRemovedPayload;

  // §3.2 Research Asset Lifecycle
  ResearchAssetCreated: ResearchAssetCreatedPayload;
  SpecimenReserved: SpecimenReservedPayload;
  CollectionStarted: CollectionStartedPayload;
  CollectionCompleted: CollectionCompletedPayload;
  SpecimenCollected: SpecimenCollectedPayload;
  AliquotCreated: AliquotCreatedPayload;
  QCCompleted: QCCompletedPayload;
  QCPassed: QCPassedPayload;
  QCFailed: QCFailedPayload;
  FreezeThawRecorded: FreezeThawRecordedPayload;
  VolumeAdjusted: VolumeAdjustedPayload;
  LocationChanged: LocationChangedPayload;
  Consumed: ConsumedPayload;
  Destroyed: DestroyedPayload;

  // §3.3 Access & Governance
  AccessRequestSubmitted: AccessRequestSubmittedPayload;
  AccessRequestApproved: AccessRequestApprovedPayload;
  AccessRequestRejected: AccessRequestRejectedPayload;
  ConsentVerified: ConsentVerifiedPayload;
  IRBApproved: IRBApprovedPayload;
  MTAExecuted: MTAExecutedPayload;
  ConsentUpdated: ConsentUpdatedPayload;
  PolicyEvaluated: PolicyEvaluatedPayload;

  // §3.4 Program & Feasibility
  ProgramCreated: ProgramCreatedPayload;
  ProgramUpdated: ProgramUpdatedPayload;
  ProgramStatusChanged: ProgramStatusChangedPayload;
  ProgramParticipantAdded: ProgramParticipantAddedPayload;
  ProgramParticipantRemoved: ProgramParticipantRemovedPayload;
  ProgramParticipantRoleChanged: ProgramParticipantRoleChangedPayload;
  FeasibilityRequested: FeasibilityRequestedPayload;
  FeasibilityAssessmentCompleted: FeasibilityAssessmentCompletedPayload;

  // §3.5 Fulfillment & Logistics
  FulfillmentStarted: FulfillmentStartedPayload;
  FulfillmentCompleted: FulfillmentCompletedPayload;
  FulfillmentPartiallyAccepted: FulfillmentPartiallyAcceptedPayload;
  FulfillmentDisputed: FulfillmentDisputedPayload;
  ShipmentCreated: ShipmentCreatedPayload;
  ShipmentDispatched: ShipmentDispatchedPayload;
  TemperatureExcursionDetected: TemperatureExcursionDetectedPayload;
  ShipmentReceived: ShipmentReceivedPayload;
  SpecimenAccepted: SpecimenAcceptedPayload;
  ShipmentDelivered: ShipmentDeliveredPayload;
  ShipmentAccepted: ShipmentAcceptedPayload;
  ShipmentDisputed: ShipmentDisputedPayload;

  // §3.6 Settlement & Data
  SettlementReleased: SettlementReleasedPayload;
  SettlementInitiated: SettlementInitiatedPayload;
  PaymentDistributed: PaymentDistributedPayload;
  SettlementCompleted: SettlementCompletedPayload;
  DatasetLinked: DatasetLinkedPayload;
  DataLinked: DataLinkedPayload;

  // §3.7 Trust & Accreditation
  TrustScoreUpdated: TrustScoreUpdatedPayload;
  AccreditationAdded: AccreditationAddedPayload;
  AccreditationExpired: AccreditationExpiredPayload;
  ComplianceIncident: ComplianceIncidentPayload;

  // §3.8 System & Integration
  IntegrationHealthy: IntegrationHealthyPayload;
  IntegrationOutage: IntegrationOutagePayload;
  EventIngestionFailed: EventIngestionFailedPayload;

  // Audit
  AuditEventCreated: AuditEventCreatedPayload;
}

/** Union of all known canonical event types */
export type KadarnEventType = keyof KadarnEventMap;

/** Helper: extract payload type for a given event type */
export type KadarnEventPayload<T extends KadarnEventType> = KadarnEventMap[T];

// --------------------------------------------------------------------------
// Event bus interface
// --------------------------------------------------------------------------
export interface EventBus {
  publish<T extends KadarnEventType>(
    type: T,
    payload: KadarnEventPayload<T>,
    context: {
      actorId: string;
      organizationId: string;
      tenantId: string;
      subjectType: string;
      subjectId: string;
      correlationId: string;
      causationId?: string | null;
      metadata?: Record<string, unknown>;
    },
  ): Promise<string>; // returns event_id

  subscribe<T extends KadarnEventType>(
    type: T,
    handler: (event: EventEnvelope<KadarnEventPayload<T>>) => Promise<void>,
  ): Promise<() => void>; // returns unsubscribe function
}
