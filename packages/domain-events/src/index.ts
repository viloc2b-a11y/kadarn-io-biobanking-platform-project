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
  SupplyItemCreated: SupplyItemCreatedPayload;
  ExchangeDealCreated: ExchangeDealCreatedPayload;
  AccessRequestSubmitted: AccessRequestSubmittedPayload;
  AccessRequestApproved: AccessRequestApprovedPayload;
  AccessRequestRejected: AccessRequestRejectedPayload;
  AuditEventCreated: AuditEventCreatedPayload;
}

/** Union of all known domain event types */
export type KadarnEventType = keyof KadarnEventMap;

/** Helper: extract payload type for a given event type */
export type KadarnEventPayload<T extends KadarnEventType> = KadarnEventMap[T];

// --------------------------------------------------------------------------
// Event bus interface (will be implemented in Sprint 2)
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
