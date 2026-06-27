# ADR-012: Operational Twins — Event-Sourced Digital Representations

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn tracks biospecimens, transactions, shipments, organizations, and
collections across their lifecycles. Currently, state is managed through
database status fields — `specimens.status = 'shipped'` — which only
reflect the last known state. This approach has fundamental limitations:

1. **No history:** Past states are lost. "When was this specimen last QC'd?"
   requires separate audit tables.
2. **No reconstruction:** "What was this specimen's state on January 15?"
   cannot be answered from current state alone.
3. **No simulation:** "What would happen if this shipment were diverted?"
   cannot be answered without affecting real state.
4. **No provenance:** The causal chain of events that produced the current
   state is not captured.

The KRM-RAO reference model (§2.2, §3.4) defines **Operational Twins** as
persistent, event-sourced digital representations that solve these problems.

---

## Decision: Hybrid Event-Sourcing Model

Kadarn implements Operational Twins using a **hybrid event-sourcing**
approach:

1. **Events are the source of truth** — stored immutably in a shared
   `twin_events` table
2. **Current state is materialized** — per-twin-type tables for fast reads
3. **State is derived from events** — the state table is updated atomically
   when events are recorded
4. **Reconstruction is possible** — state at any point in time can be
   rebuilt by replaying events up to that point

### 1. Event Store

A shared `twin_events` table stores all twin events:

```sql
twin_events (
  id              UUID PK          -- unique event ID
  twin_type       VARCHAR(50)      -- 'specimen', 'transaction', etc.
  twin_id         UUID             -- the twin this event belongs to
  event_type      VARCHAR(100)     -- 'SpecimenCollected', 'QCPassed', etc.
  payload         JSONB            -- event-specific data
  sequence        BIGINT           -- monotonic sequence per twin
  occurred_at     TIMESTAMPTZ      -- when the event happened in the real world
  recorded_at     TIMESTAMPTZ      -- when it was recorded in the system
  actor_id        UUID             -- who caused this event
  evidence_ref    TEXT             -- optional reference to supporting evidence
)
```

Each twin has a monotonic `sequence` number — guaranteed gapless per twin.
This enables deterministic reconstruction: replay events ordered by
sequence.

### 2. State Tables

Each twin type has its own state table:

- `specimen_twins` — current state of each specimen
- `transaction_twins` — current state of each transaction
- `shipment_twins` — current state of each shipment
- (Organization Twin uses the existing `organization_trust` + `organizations`
  tables; Collection Twin is post-v1.0)

State tables store the **derived state** — what you get by applying all
events up to the latest sequence. They are updated atomically when an
event is recorded (same transaction).

### 3. Event Application Pattern

Every event recording follows this pattern within a single database
transaction:

```
1. INSERT INTO twin_events (...)
2. UPDATE specimen_twins SET
     status = <new_state>,
     <derived_fields> = <computed_from_event>,
     twin_sequence = <new_sequence>,
     twin_updated_at = now()
   WHERE id = <twin_id>
```

This guarantees that state and events are always consistent. If the
UPDATE fails, the INSERT rolls back.

### 4. Reconstruction

To reconstruct state at time T:

```
SELECT * FROM twin_events
WHERE twin_type = 'specimen'
  AND twin_id = <id>
  AND recorded_at <= T
ORDER BY sequence ASC
```

Then replay these events through the same `applyEvent()` function that
the INSERT trigger uses. This is a pure function — identical output for
identical inputs.

### 5. Specimen Twin — First Implementation

The Specimen Twin tracks a single biospecimen or aliquot through its
complete lifecycle. It is the reference implementation for the Operational
Twin pattern.

**Event stream** (from KRM-BNO §4.1):
- `SpecimenCollected` — initial collection
- `AliquotCreated` — derived from parent specimen
- `QCPassed` / `QCFailed` — quality control
- `FreezeThawRecorded` — freeze-thaw cycle
- `VolumeAdjusted` — volume reduction after use
- `ShipmentInitiated` — en route to another org
- `Consumed` — fully used by assay
- `Destroyed` — disposed

**Derived state:**
- Status (collected, stored, shipped, consumed, destroyed)
- Current location (org, freezer, rack, box, position)
- Remaining volume/quantity
- Freeze-thaw count
- Last QC result
- Current consent status

### 6. Twin Interface

Every Operational Twin implements:

```typescript
interface OperationalTwin<TState, TEvent> {
  /** Get current state */
  getState(id: string): Promise<TState>;

  /** Get state at a point in time */
  getStateAt(id: string, timestamp: string): Promise<TState>;

  /** Record an event and update state */
  recordEvent(params: {
    twinId: string;
    eventType: string;
    payload: Record<string, unknown>;
    actorId: string;
    occurredAt?: string;
    evidenceRef?: string;
  }): Promise<TState>;

  /** Get event history */
  getEvents(id: string): Promise<TwinEvent[]>;
}
```

### 7. Integration

The `packages/operational-twins/` package provides:
- Base twin infrastructure (event store client, state manager)
- Specimen Twin implementation
- Factory for creating twin instances

Other services import the twin package and call `twin.recordEvent()` or
`twin.getState()`. The package handles event persistence, state updates,
and reconstruction.

---

## Consequences

### Positive

- Complete event history for every tracked entity
- State reconstruction at any point in time
- Simulation without side effects (replay events in a read-only context)
- Causal provenance from event sequencing
- Each twin type can optimize its state table independently

### Negative

- Two writes per event (event table + state table) — minor latency
- State tables are derived data — must never be written directly
- Schema changes to event payloads require versioning consideration

### Neutral

- First twin type (Specimen) establishes the pattern for all others
- Event types are recorded as strings — new event types are additive
- Twin implementations can be added incrementally
