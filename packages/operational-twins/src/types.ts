// ==========================================================================
// Kadarn Operational Twins — Type Definitions
// ==========================================================================
// ADR-012: Operational Twins — Event-Sourced Digital Representations
// KRM-RAO §2.2 (Operational Twin), §3.4 (Twins)
// KRM-BNO §4 (Operational Twin Specialization)
// ==========================================================================

// --------------------------------------------------------------------------
// Twin types
// --------------------------------------------------------------------------

export type TwinType = 'specimen' | 'transaction' | 'shipment' | 'organization' | 'collection';

// --------------------------------------------------------------------------
// Twin event — the atomic unit of twin state changes
// --------------------------------------------------------------------------

export interface TwinEvent {
  id: string;
  twinType: TwinType;
  twinId: string;
  eventType: string;
  payload: Record<string, unknown>;
  sequence: number;
  occurredAt: string;
  recordedAt: string;
  actorId: string;
  evidenceRef?: string;
}

// --------------------------------------------------------------------------
// Record event input
// --------------------------------------------------------------------------

export interface RecordEventInput {
  twinType: TwinType;
  twinId: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorId: string;
  occurredAt?: string;
  evidenceRef?: string;
}

// --------------------------------------------------------------------------
// Generic Operational Twin interface
// --------------------------------------------------------------------------

export interface OperationalTwin<TState, TEventPayloads = Record<string, unknown>> {
  /** Get current state */
  getState(id: string): Promise<TState>;

  /** Get state at a point in time (reconstruction) */
  getStateAt(id: string, timestamp: string): Promise<TState>;

  /** Record an event and atomically update state */
  recordEvent(input: RecordEventInput): Promise<TwinEvent>;

  /** Get full event history for this twin */
  getEvents(id: string): Promise<TwinEvent[]>;

  /** Get events from a specific time range */
  getEventsInRange(id: string, from: string, to: string): Promise<TwinEvent[]>;
}

// --------------------------------------------------------------------------
// Specimen Twin — event types
// --------------------------------------------------------------------------

export type SpecimenEventType =
  | 'SpecimenCollected'
  | 'AliquotCreated'
  | 'QCPassed'
  | 'QCFailed'
  | 'FreezeThawRecorded'
  | 'VolumeAdjusted'
  | 'ShipmentInitiated'
  | 'Consumed'
  | 'Destroyed'
  | 'LocationChanged'
  | 'ConsentUpdated';

// --------------------------------------------------------------------------
// Specimen Twin — event payloads
// --------------------------------------------------------------------------

export interface SpecimenCollectedPayload {
  organizationId: string;
  specimenType: string;
  containerType: string;
  preservationType: string;
  storageTemperature: string;
  initialQuantity: number;
  unit: string;
  consentStatus: string;
  consentId?: string;
  collectionProtocol?: string;
}

export interface AliquotCreatedPayload {
  organizationId: string;
  parentSpecimenId: string;
  aliquotId: string;
  volume: number;
  unit: string;
  containerType: string;
}

export interface QCPayload {
  qcResult: 'passed' | 'failed';
  qcType: string;
  qcPerformedBy: string;
  notes?: string;
}

export interface FreezeThawPayload {
  cycleNumber: number;
  durationHours?: number;
  temperatureRange?: string;
}

export interface VolumeAdjustedPayload {
  volumeUsed: number;
  unit: string;
  purpose: string;
  remainingAfter: number;
}

export interface ShipmentInitiatedPayload {
  shipmentId: string;
  destinationOrgId: string;
  courier: string;
  trackingNumber?: string;
}

export interface LocationChangedPayload {
  organizationId: string;
  facility?: string;
  freezer?: string;
  rack?: string;
  box?: string;
  position?: string;
  reason?: string;
}

export interface ConsentUpdatedPayload {
  consentStatus: string;
  consentId?: string;
  updatedBy: string;
}

// --------------------------------------------------------------------------
// Specimen Twin — current state
// --------------------------------------------------------------------------

export type SpecimenStatus =
  | 'collected'
  | 'stored'
  | 'shipped'
  | 'received'
  | 'consumed'
  | 'destroyed'
  | 'quarantined';

export interface SpecimenTwinState {
  id: string;
  organizationId: string;
  parentId?: string;

  // Entity properties
  status: SpecimenStatus;
  specimenType?: string;
  containerType?: string;
  preservationType?: string;
  storageTemperature?: string;

  // Location
  currentLocation: {
    organizationId?: string;
    facility?: string;
    freezer?: string;
    rack?: string;
    box?: string;
    position?: string;
    shipmentId?: string;
  };

  // Tracking
  remainingQuantity?: number;
  unit?: string;
  freezeThawCount: number;
  lastQcResult?: string;
  lastQcAt?: string;
  consentStatus?: string;
  consentId?: string;

  // Event stream position
  twinSequence: number;
  twinUpdatedAt: string;

  // Metadata
  createdAt: string;
  collectedAt?: string;
  collectedBy?: string;
  notes?: string;
}

// --------------------------------------------------------------------------
// Specimen Twin event payload map
// --------------------------------------------------------------------------

export interface SpecimenEventPayloadMap {
  SpecimenCollected: SpecimenCollectedPayload;
  AliquotCreated: AliquotCreatedPayload;
  QCPassed: QCPayload;
  QCFailed: QCPayload;
  FreezeThawRecorded: FreezeThawPayload;
  VolumeAdjusted: VolumeAdjustedPayload;
  ShipmentInitiated: ShipmentInitiatedPayload;
  Consumed: Record<string, never>;
  Destroyed: Record<string, never>;
  LocationChanged: LocationChangedPayload;
  ConsentUpdated: ConsentUpdatedPayload;
}

// --------------------------------------------------------------------------
// Event application result
// --------------------------------------------------------------------------

export interface ApplyEventResult {
  eventId: string;
  sequence: number;
  eventType: string;
  state: SpecimenTwinState;
}

// --------------------------------------------------------------------------
// Adapter interface for twin persistence
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// Transaction Twin types
// --------------------------------------------------------------------------

export type TransactionStatus =
  | 'initiated' | 'governance_review' | 'mta_pending'
  | 'fulfilling' | 'completed' | 'disputed' | 'settled' | 'cancelled';

export type TransactionEventType =
  | 'TransactionInitiated' | 'GovernanceReviewStarted'
  | 'PolicyApproved' | 'PolicyDenied'
  | 'MTASigned' | 'PaymentEscrowed'
  | 'FulfillmentCompleted' | 'SettlementCompleted'
  | 'DisputeRaised' | 'DisputeResolved';

export interface TransactionTwinState {
  id: string;
  organizationId: string;
  status: TransactionStatus;
  transactionType?: string;
  providerOrgId?: string;
  recipientOrgId?: string;
  totalValue?: number;
  currency: string;
  paymentStatus?: string;
  twinSequence: number;
  twinUpdatedAt: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface TransactionInitiatedPayload {
  organizationId: string;
  transactionType: string;
  providerOrgId: string;
  recipientOrgId: string;
  totalValue?: number;
}

export interface MTASignedPayload {
  mtaId: string;
  signedBy: string;
}

export interface PaymentEscrowedPayload {
  amount: number;
  currency: string;
}

export interface DisputePayload {
  raisedBy: string;
  reason: string;
}

// --------------------------------------------------------------------------
// Shipment Twin types
// --------------------------------------------------------------------------

export type ShipmentStatus =
  | 'scheduled' | 'preparing' | 'picked_up'
  | 'in_transit' | 'customs_hold' | 'delivered'
  | 'accepted' | 'disputed' | 'lost';

export type ShipmentEventType =
  | 'ShipmentScheduled' | 'ShipmentPickedUp'
  | 'TemperatureReading' | 'TemperatureBreach'
  | 'ShipmentDelivered' | 'ShipmentAccepted'
  | 'ShipmentDisputed' | 'CustomsHold';

export interface ShipmentTwinState {
  id: string;
  organizationId: string;
  status: ShipmentStatus;
  courier?: string;
  trackingNumber?: string;
  originOrgId?: string;
  destinationOrgId?: string;
  temperatureRange?: string;
  currentTemp?: number;
  breachCount: number;
  lastBreachAt?: string;
  twinSequence: number;
  twinUpdatedAt: string;
  createdAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface ShipmentScheduledPayload {
  organizationId: string;
  courier: string;
  originOrgId: string;
  destinationOrgId: string;
  temperatureRange?: string;
}

export interface TemperatureReadingPayload {
  temperature: number;
  timestamp: string;
}

export interface TemperatureBreachPayload {
  temperature: number;
  threshold: number;
  durationMinutes: number;
}

// --------------------------------------------------------------------------
// Adapter interface for twin persistence
// --------------------------------------------------------------------------

export interface TwinAdapter {
  getTwinEvents(
    twinType: TwinType,
    twinId: string,
    options?: { from?: string; to?: string },
  ): Promise<TwinEvent[]>;

  applyEvent(event: RecordEventInput): Promise<{
    eventId: string;
    sequence: number;
    eventType: string;
  }>;

  getSpecimenState(id: string): Promise<SpecimenTwinState | null>;
  getTransactionState(id: string): Promise<TransactionTwinState | null>;
  getShipmentState(id: string): Promise<ShipmentTwinState | null>;
}

export type CollectionStatus = 'planned' | 'active' | 'paused' | 'completed' | 'closed';
export interface CollectionTwinState {
  id: string; organizationId: string; status: CollectionStatus;
  protocol?: string; irbRef?: string; consentModel?: string;
  targetEnrollment?: number; actualEnrollment: number;
  twinSequence: number; twinUpdatedAt: string; createdAt: string;
}
