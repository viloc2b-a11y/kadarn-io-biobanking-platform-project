# Kadarn Event Catalog

**Version:** 1.0  
**Status:** Accepted  
**Canonical:** `docs/architecture/event-catalog.md`

---

## 1. Purpose

This catalog lists every canonical event in the Kadarn platform. Events
are first-class architectural objects — immutable records of something
that happened. Every engine, twin, graph, and service produces and
consumes events.

The catalog serves as:
- **Single source of truth** for event types and payloads
- **Contract** between event producers and consumers
- **Discovery** for new team members: "what events exist?"
- **Governance** for event schema evolution

---

## 2. Event Envelope

Every Kadarn event wraps this standard envelope:

```typescript
interface EventEnvelope {
  /** Globally unique event ID (UUID v4) */
  event_id: string;

  /** Event type, PascalCase: "SpecimenCollected" */
  event_type: string;

  /** Schema version for payload evolution */
  version: number;

  /** ISO 8601 timestamp of occurrence */
  occurred_at: string;

  /** ISO 8601 timestamp of recording */
  recorded_at: string;

  /** Who caused this event (auth.users UUID) */
  actor_id: string;

  /** Organization scope (UUID) */
  organization_id: string;

  /** Tenant scope (UUID, same as org for single-tenant-per-org) */
  tenant_id: string;

  /** Type of the subject entity this event refers to */
  subject_type: string;

  /** ID of the subject entity */
  subject_id: string;

  /** Links this event to its originating command/event chain */
  correlation_id: string;

  /** Links this event to the specific event that caused it */
  causation_id: string | null;

  /** Event-specific payload */
  payload: Record<string, unknown>;

  /** Free-form metadata (routing info, source system, etc.) */
  metadata: Record<string, unknown>;
}
```

### 2.1 Envelope Fields

| Field | Required | Description |
|-------|----------|-------------|
| `event_id` | ✅ | Unique, monotonic UUID v4 |
| `event_type` | ✅ | PascalCase, past tense: `SpecimenCollected` |
| `version` | ✅ | Starts at 1, incremented on breaking payload changes |
| `occurred_at` | ✅ | When the event happened in the real world |
| `recorded_at` | ✅ | When the system recorded it |
| `actor_id` | ✅ | The user, system, or process that caused it |
| `organization_id` | ✅ | Owning organization |
| `tenant_id` | ✅ | Multi-tenant isolation key |
| `subject_type` | ✅ | `specimen`, `shipment`, `program`, etc. |
| `subject_id` | ✅ | ID of the subject entity |
| `correlation_id` | ✅ | Traces the full command chain |
| `causation_id` | Optional | Direct parent event ID |
| `payload` | ✅ | Event-specific data |
| `metadata` | Optional | Routing, versioning, source system info |

---

## 3. Event Categories

Events are organized by domain module:

### 3.1 Foundation & Identity

| Event | Description | Subject | Producer |
|-------|-------------|---------|----------|
| `OrganizationCreated` | A new organization joined the Kadarn network | organization | Foundation API |
| `OrganizationUpdated` | Organization profile changed | organization | Foundation API |
| `OrganizationMembershipAdded` | User added to organization | membership | Foundation API |
| `OrganizationMembershipRemoved` | User removed from organization | membership | Foundation API |
| `OrganizationCapabilityAdded` | Organization gained a capability | organization | Foundation API |
| `OrganizationCapabilityRemoved` | Organization lost a capability | organization | Foundation API |

### 3.2 Research Asset Lifecycle

| Event | Description | Subject | Producer |
|-------|-------------|---------|----------|
| **`ResearchAssetCreated`** | A research asset was registered in the catalog | research_asset | Discovery Service |
| **`SpecimenReserved`** | Specimen reserved for a specific program | specimen | Exchange Service |
| **`CollectionStarted`** | Physical collection of specimens began | collection | Processing Service |
| **`CollectionCompleted`** | Collection finished with final count | collection | Processing Service |
| `SpecimenCollected` | Individual specimen collected | specimen | Processing Service |
| **`AliquotCreated`** | Derived aliquot from parent specimen | specimen | Processing Service |
| `QCPassed` | Specimen passed quality control | specimen | Processing Service |
| `QCFailed` | Specimen failed quality control | specimen | Processing Service |
| **`QCCompleted`** | QC process completed for a batch | batch | Processing Service |
| `FreezeThawRecorded` | Freeze-thaw cycle recorded | specimen | Specimen Twin |
| `VolumeAdjusted` | Volume reduced after use | specimen | Specimen Twin |
| `LocationChanged` | Specimen location updated | specimen | Specimen Twin |
| `Consumed` | Specimen fully used | specimen | Specimen Twin |
| `Destroyed` | Specimen disposed | specimen | Specimen Twin |

### 3.3 Access & Governance

| Event | Description | Subject | Producer |
|-------|-------------|---------|----------|
| `AccessRequestSubmitted` | Researcher requested specimen access | access_request | Exchange Service |
| `AccessRequestApproved` | Request approved | access_request | Policy Engine |
| `AccessRequestRejected` | Request rejected | access_request | Policy Engine |
| **`ConsentVerified`** | Donor consent confirmed for intended use | consent | Policy Engine |
| **`IRBApproved`** | IRB approval verified for program | irb_approval | Regulatory Service |
| **`MTAExecuted`** | Material Transfer Agreement signed | mta | Exchange Service |
| `ConsentUpdated` | Consent status changed | specimen | Specimen Twin |
| `PolicyApproved` | Policy evaluation produced allow | policy_evaluation | Policy Engine |
| `PolicyDenied` | Policy evaluation produced deny | policy_evaluation | Policy Engine |

### 3.4 Program & Feasibility

| Event | Description | Subject | Producer |
|-------|-------------|---------|----------|
| `ProgramCreated` | New research program created | program | Program Engine |
| `ProgramUpdated` | Program details changed | program | Program Engine |
| `ProgramStatusChanged` | Program status transitioned | program | Program Engine |
| `ProgramParticipantAdded` | Organization joined program | participant | Program Engine |
| `ProgramParticipantRemoved` | Organization left program | participant | Program Engine |
| `ProgramParticipantRoleChanged` | Participant role updated | participant | Program Engine |
| `FeasibilityRequested` | Feasibility assessment initiated | feasibility | Feasibility Service |
| `FeasibilityAssessmentCompleted` | Feasibility assessment done | feasibility | Feasibility Service |

### 3.5 Fulfillment & Logistics

| Event | Description | Subject | Producer |
|-------|-------------|---------|----------|
| `FulfillmentStarted` | Fulfillment execution began | fulfillment | Fulfillment Engine |
| `FulfillmentCompleted` | Fulfillment successfully delivered | fulfillment | Fulfillment Engine |
| `FulfillmentPartiallyAccepted` | Partial acceptance recorded | fulfillment | Logistics Service |
| `FulfillmentDisputed` | Recipient disputed the fulfillment | fulfillment | Logistics Service |
| **`ShipmentCreated`** | Shipment record created | shipment | Logistics Service |
| **`ShipmentDispatched`** | Shipment picked up by courier | shipment | Logistics Service |
| **`TemperatureExcursionDetected`** | In-transit temperature breach | shipment | Logistics Service |
| **`ShipmentReceived`** | Shipment delivered to recipient | shipment | Logistics Service |
| **`SpecimenAccepted`** | Individual specimen accepted after inspection | specimen | Logistics Service |
| `ShipmentDelivered` | Courier confirmed delivery | shipment | Logistics Service |
| `ShipmentAccepted` | Recipient accepted the shipment | shipment | Logistics Service |
| `ShipmentDisputed` | Recipient disputed the shipment | shipment | Logistics Service |

### 3.6 Settlement & Data

| Event | Description | Subject | Producer |
|-------|-------------|---------|----------|
| **`SettlementReleased`** | Funds released after fulfillment | settlement | Financial Engine |
| `SettlementInitiated` | Settlement process started | settlement | Financial Engine |
| `PaymentDistributed` | Funds distributed to participants | settlement | Financial Engine |
| `SettlementCompleted` | Settlement finalized | settlement | Financial Engine |
| **`DatasetLinked`** | Research data linked to specimens | dataset | Knowledge Engine |
| `DataLinked` | Clinical/assay data linked | data_linkage | Integration Engine |
| `AuditEventCreated` | Audit record created | audit_event | Governance Fabric |

### 3.7 Trust & Accreditation

| Event | Description | Subject | Producer |
|-------|-------------|---------|----------|
| `TrustScoreUpdated` | Organization trust score recomputed | organization | Trust Engine |
| `AccreditationAdded` | New accreditation/certification recorded | organization | Regulatory Service |
| `AccreditationExpired` | Accreditation lapsed | organization | Regulatory Service |
| `ComplianceIncident` | Regulatory or policy incident | organization | Regulatory Service |

### 3.8 System & Integration

| Event | Description | Subject | Producer |
|-------|-------------|---------|----------|
| `IntegrationHealthy` | External system integration OK | integration | Integration Engine |
| `IntegrationOutage` | External system integration down | integration | Integration Engine |
| `EventIngestionFailed` | External event could not be processed | ingestion | Integration Engine |

---

## 4. Event Versioning

Events use explicit versioning for schema evolution:

- **Version starts at 1** for each event type
- **Non-breaking changes** (adding optional fields): increment minor
- **Breaking changes** (removing fields, changing types): increment major
- **Version is recorded in the envelope** so consumers can handle multiple
  versions

```typescript
// Version 1
{
  event_type: "SpecimenCollected",
  version: 1,
  payload: {
    specimen_type: "whole_blood",
    container_type: "sst_vial",
  }
}

// Version 2 (added optional field)
{
  event_type: "SpecimenCollected",
  version: 2,
  payload: {
    specimen_type: "whole_blood",
    container_type: "sst_vial",
    collection_method: "venipuncture",  // new optional field
  }
}
```

---

## 5. Event Idempotency

Events must be idempotent — replaying the same event twice produces
the same state.

### Idempotency key

The `event_id` serves as the idempotency key. If an event with the same
ID is received twice, the system must detect the duplicate and skip it.

### Implementation

```typescript
async function publishWithIdempotency(
  event: EventEnvelope,
  eventStore: EventStore,
): Promise<void> {
  // Check if event_id already exists
  const existing = await eventStore.findById(event.event_id);
  if (existing) {
    return; // Duplicate — skip
  }

  // Store event
  await eventStore.insert(event);
}
```

### Idempotency Guarantees

| Scenario | Behavior |
|----------|----------|
| Same event published twice | Second publish is idempotent-skipped |
| Same event with same ID but different payload | Throws — ID collision with different payload is an error |
| Network retry producing duplicate publish | Safe — idempotency key prevents double-apply |

---

## 6. Correlation & Causation

Events form a directed acyclic graph through `correlation_id` and
`causation_id`:

```
Command (CreateShipment)
  └── causation_id: null
  └── correlation_id: "corr-123"
       │
       ├── Event: ShipmentCreated (causation: null)
       │     └── correlation_id: "corr-123"
       │
       ├── Event: ShipmentDispatched (causation: evt-001)
       │     └── correlation_id: "corr-123"
       │
       └── Event: TemperatureExcursionDetected (causation: evt-002)
             └── correlation_id: "corr-123"
```

This enables:
- **Traceability:** Find all events in a command chain via `correlation_id`
- **Causality:** Understand what caused each event via `causation_id`
- **Audit:** Reconstruct the full sequence of events for any entity

---

## 7. Event Catalog Index

Total canonical events: **62**

| Category | Count |
|----------|-------|
| Foundation & Identity | 6 |
| Research Asset Lifecycle | 14 |
| Access & Governance | 8 |
| Program & Feasibility | 8 |
| Fulfillment & Logistics | 12 |
| Settlement & Data | 6 |
| Trust & Accreditation | 4 |
| System & Integration | 3 |
| Audit | 1 |

---

## 8. Adding New Events

To add a new event type:

1. Add it to this catalog with description, subject, and producer
2. Add its payload type to `packages/domain-events/src/index.ts`
3. Register it in `KadarnEventMap`
4. Create the producing code that emits it

All new events must include `correlation_id` and `causation_id` in the
envelope. Any event without these fields is non-compliant.
