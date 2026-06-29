// ==========================================================================
// Kadarn Operational Twins — State Engine
// ==========================================================================
// Pure functions for event application and state reconstruction.
// These functions are stateless — they take state + event, return new state.
// ==========================================================================

import type {
  SpecimenTwinState,
  SpecimenEventType,
  SpecimenStatus,
  SpecimenCollectedPayload,
  QCPayload,
  FreezeThawPayload,
  VolumeAdjustedPayload,
  ShipmentInitiatedPayload,
  LocationChangedPayload,
  ConsentUpdatedPayload,
  AliquotCreatedPayload,
  TwinEvent,
  TransactionTwinState,
  TransactionEventType,
  ShipmentTwinState,
  ShipmentEventType,
} from './types';

// --------------------------------------------------------------------------
// createInitialState — create the initial state for a new specimen twin
// --------------------------------------------------------------------------

export function createInitialState(
  id: string,
  organizationId: string,
): SpecimenTwinState {
  return {
    id,
    organizationId,
    status: 'collected',
    currentLocation: { organizationId },
    freezeThawCount: 0,
    twinSequence: 0,
    twinUpdatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// --------------------------------------------------------------------------
// applyEventToState — apply a single event to a specimen twin state
// --------------------------------------------------------------------------
// Pure function: (state, event) -> state'. No side effects.
// --------------------------------------------------------------------------

export function applyEventToState(
  state: SpecimenTwinState,
  event: { eventType: string; payload: Record<string, unknown> },
): SpecimenTwinState {
  const newState = { ...state };

  switch (event.eventType as SpecimenEventType) {
    case 'SpecimenCollected': {
      const p = event.payload as unknown as SpecimenCollectedPayload;
      newState.status = 'collected';
      newState.specimenType = p.specimenType;
      newState.containerType = p.containerType;
      newState.preservationType = p.preservationType;
      newState.storageTemperature = p.storageTemperature;
      newState.remainingQuantity = p.initialQuantity;
      newState.unit = p.unit;
      newState.consentStatus = p.consentStatus;
      newState.consentId = p.consentId;
      newState.currentLocation = { organizationId: p.organizationId };
      newState.collectedAt = new Date().toISOString();
      break;
    }

    case 'AliquotCreated': {
      const p = event.payload as unknown as AliquotCreatedPayload;
      // The aliquot twin is created as a separate entity.
      // For the parent specimen, reduce available quantity.
      newState.remainingQuantity = state.remainingQuantity
        ? state.remainingQuantity - p.volume
        : undefined;
      break;
    }

    case 'QCPassed': {
      const p = event.payload as unknown as QCPayload;
      newState.lastQcResult = 'passed';
      newState.lastQcAt = new Date().toISOString();
      break;
    }

    case 'QCFailed': {
      const p = event.payload as unknown as QCPayload;
      newState.lastQcResult = 'failed';
      newState.lastQcAt = new Date().toISOString();
      newState.status = 'quarantined';
      break;
    }

    case 'FreezeThawRecorded': {
      const p = event.payload as unknown as FreezeThawPayload;
      newState.freezeThawCount = state.freezeThawCount + 1;
      break;
    }

    case 'VolumeAdjusted': {
      const p = event.payload as unknown as VolumeAdjustedPayload;
      newState.remainingQuantity = p.remainingAfter;
      break;
    }

    case 'ShipmentInitiated': {
      const p = event.payload as unknown as ShipmentInitiatedPayload;
      newState.status = 'shipped';
      newState.currentLocation = {
        ...state.currentLocation,
        shipmentId: p.shipmentId,
      };
      break;
    }

    case 'Consumed': {
      newState.status = 'consumed';
      break;
    }

    case 'Destroyed': {
      newState.status = 'destroyed';
      break;
    }

    case 'LocationChanged': {
      const p = event.payload as unknown as LocationChangedPayload;
      newState.currentLocation = {
        organizationId: p.organizationId,
        facility: p.facility,
        freezer: p.freezer,
        rack: p.rack,
        box: p.box,
        position: p.position,
      };
      break;
    }

    case 'ConsentUpdated': {
      const p = event.payload as unknown as ConsentUpdatedPayload;
      newState.consentStatus = p.consentStatus;
      newState.consentId = p.consentId;
      break;
    }

    default:
      // Unknown event type — no state change, event still recorded
      break;
  }

  return newState;
}

// --------------------------------------------------------------------------
// reconstructState — rebuild state from a sequence of events
// --------------------------------------------------------------------------

export function reconstructState(
  id: string,
  organizationId: string,
  events: TwinEvent[],
): SpecimenTwinState {
  let state = createInitialState(id, organizationId);

  for (const event of events) {
    state = applyEventToState(state, event);
    state.twinSequence = event.sequence;
    state.twinUpdatedAt = event.recordedAt;
  }

  return state;
}

// --------------------------------------------------------------------------
// reconstructStateAt — rebuild state as it was at a specific time
// --------------------------------------------------------------------------

export function reconstructStateAt(
  id: string,
  organizationId: string,
  events: TwinEvent[],
  timestamp: string,
): SpecimenTwinState {
  const eventsUpToTime = events.filter((e) => e.recordedAt <= timestamp);
  return reconstructState(id, organizationId, eventsUpToTime);
}

// --------------------------------------------------------------------------
// getValidTransitions — valid status transitions for specimen twins
// --------------------------------------------------------------------------

export const VALID_SPECIMEN_TRANSITIONS: Record<SpecimenStatus, SpecimenStatus[]> = {
  collected:  ['stored', 'shipped', 'quarantined', 'consumed', 'destroyed'],
  stored:     ['shipped', 'consumed', 'destroyed', 'quarantined'],
  shipped:    ['received', 'quarantined', 'destroyed'],
  received:   ['stored', 'consumed', 'destroyed', 'quarantined'],
  consumed:   [],  // terminal
  destroyed:  [],  // terminal
  quarantined: ['stored', 'destroyed', 'consumed'],  // can be cleared or disposed
};

// --------------------------------------------------------------------------
// isValidTransition — check if a status transition is valid
// --------------------------------------------------------------------------

export function isValidTransition(
  from: SpecimenStatus,
  to: SpecimenStatus,
): boolean {
  return VALID_SPECIMEN_TRANSITIONS[from]?.includes(to) ?? false;
}

// --------------------------------------------------------------------------
// getStatusForEvent — determine the resulting status from an event
// --------------------------------------------------------------------------

export function getStatusForEvent(eventType: string): SpecimenStatus | null {
  switch (eventType) {
    case 'SpecimenCollected':   return 'collected';
    case 'QCFailed':            return 'quarantined';
    case 'ShipmentInitiated':   return 'shipped';
    case 'Consumed':            return 'consumed';
    case 'Destroyed':           return 'destroyed';
    default:                    return null;  // no status change
  }
}

// ======================================================================
// Transaction Twin — event application
// ======================================================================

export function createInitialTransactionState(
  id: string,
  organizationId: string,
): TransactionTwinState {
  return {
    id, organizationId,
    status: 'initiated',
    currency: 'USD',
    twinSequence: 0,
    twinUpdatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function applyTransactionEvent(
  state: TransactionTwinState,
  event: { eventType: string; payload: Record<string, unknown> },
): TransactionTwinState {
  const newState = { ...state };

  switch (event.eventType as TransactionEventType) {
    case 'TransactionInitiated':
      newState.status = 'initiated';
      newState.transactionType = event.payload.transactionType as string;
      newState.providerOrgId = event.payload.providerOrgId as string;
      newState.recipientOrgId = event.payload.recipientOrgId as string;
      newState.totalValue = event.payload.totalValue as number;
      break;
    case 'GovernanceReviewStarted':
      newState.status = 'governance_review';
      break;
    case 'PolicyApproved':
      // stays in governance_review until review completes
      break;
    case 'PolicyDenied':
      newState.status = 'cancelled';
      break;
    case 'MTASigned':
      newState.status = 'mta_pending';
      break;
    case 'PaymentEscrowed':
      newState.paymentStatus = 'escrowed';
      break;
    case 'FulfillmentCompleted':
      newState.status = 'completed';
      newState.completedAt = new Date().toISOString();
      break;
    case 'SettlementCompleted':
      newState.status = 'settled';
      newState.paymentStatus = 'released';
      break;
    case 'DisputeRaised':
      newState.status = 'disputed';
      break;
    case 'DisputeResolved':
      newState.status = 'completed';
      break;
  }

  return newState;
}

// ======================================================================
// Shipment Twin — event application
// ======================================================================

export function createInitialShipmentState(
  id: string,
  organizationId: string,
): ShipmentTwinState {
  return {
    id, organizationId,
    status: 'scheduled',
    breachCount: 0,
    twinSequence: 0,
    twinUpdatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function applyShipmentEvent(
  state: ShipmentTwinState,
  event: { eventType: string; payload: Record<string, unknown> },
): ShipmentTwinState {
  const newState = { ...state };

  switch (event.eventType as ShipmentEventType) {
    case 'ShipmentScheduled':
      newState.status = 'scheduled';
      newState.courier = event.payload.courier as string;
      newState.originOrgId = event.payload.originOrgId as string;
      newState.destinationOrgId = event.payload.destinationOrgId as string;
      newState.temperatureRange = event.payload.temperatureRange as string;
      break;
    case 'ShipmentPickedUp':
      newState.status = 'picked_up';
      newState.trackingNumber = event.payload.trackingNumber as string;
      newState.dispatchedAt = new Date().toISOString();
      break;
    case 'TemperatureReading':
      newState.currentTemp = event.payload.temperature as number;
      break;
    case 'TemperatureBreach':
      newState.currentTemp = event.payload.temperature as number;
      newState.breachCount = state.breachCount + 1;
      newState.lastBreachAt = new Date().toISOString();
      break;
    case 'ShipmentDelivered':
      newState.status = 'delivered';
      newState.deliveredAt = new Date().toISOString();
      break;
    case 'ShipmentAccepted':
      newState.status = 'accepted';
      break;
    case 'ShipmentDisputed':
      newState.status = 'disputed';
      break;
    case 'CustomsHold':
      newState.status = 'customs_hold';
      break;
  }

  return newState;
}
