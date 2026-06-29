// ==========================================================================
// Kadarn Operational Twins — Public API
// ==========================================================================

export { SpecimenTwinService } from './specimen-twin';

export {
  createInitialState,
  applyEventToState,
  reconstructState,
  reconstructStateAt,
  isValidTransition,
  VALID_SPECIMEN_TRANSITIONS,
  getStatusForEvent,
  createInitialTransactionState,
  applyTransactionEvent,
  createInitialShipmentState,
  applyShipmentEvent,
} from './engine';

export type {
  OperationalTwin,
  TwinEvent,
  TwinAdapter,
  TwinType,
  RecordEventInput,
  ApplyEventResult,
  SpecimenTwinState,
  SpecimenStatus,
  SpecimenEventType,
  SpecimenCollectedPayload,
  AliquotCreatedPayload,
  QCPayload,
  FreezeThawPayload,
  VolumeAdjustedPayload,
  ShipmentInitiatedPayload,
  LocationChangedPayload,
  ConsentUpdatedPayload,
  SpecimenEventPayloadMap,
  TransactionTwinState,
  TransactionStatus,
  TransactionEventType,
  TransactionInitiatedPayload,
  MTASignedPayload,
  PaymentEscrowedPayload,
  DisputePayload,
  ShipmentTwinState,
  ShipmentStatus,
  ShipmentEventType,
  ShipmentScheduledPayload,
  TemperatureReadingPayload,
  TemperatureBreachPayload,
} from './types';
