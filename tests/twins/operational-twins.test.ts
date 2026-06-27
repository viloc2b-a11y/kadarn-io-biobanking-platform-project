// ==========================================================================
// Kadarn Operational Twins — Unit Tests
// ==========================================================================
// Tests cover: event application, state reconstruction, valid transitions,
// SpecimenTwinService with mock adapter, event history.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  applyEventToState,
  reconstructState,
  reconstructStateAt,
  isValidTransition,
  VALID_SPECIMEN_TRANSITIONS,
} from '../packages/operational-twins/src/engine.js';

import { SpecimenTwinService } from '../packages/operational-twins/src/specimen-twin.js';
import type {
  TwinAdapter,
  TwinEvent,
  SpecimenTwinState,
  RecordEventInput,
} from '../packages/operational-twins/src/types.js';

// --------------------------------------------------------------------------
// createInitialState()
// --------------------------------------------------------------------------

describe('createInitialState()', () => {
  it('should create state with collected status', () => {
    const state = createInitialState('spec-001', 'org-1');
    expect(state.id).toBe('spec-001');
    expect(state.organizationId).toBe('org-1');
    expect(state.status).toBe('collected');
    expect(state.freezeThawCount).toBe(0);
  });
});

// --------------------------------------------------------------------------
// applyEventToState()
// --------------------------------------------------------------------------

describe('applyEventToState()', () => {
  it('should apply SpecimenCollected event', () => {
    const state = createInitialState('spec-001', 'org-1');
    const updated = applyEventToState(state, {
      eventType: 'SpecimenCollected',
      payload: {
        organizationId: 'org-1',
        specimenType: 'whole_blood',
        containerType: 'sst_vial',
        preservationType: 'fresh',
        storageTemperature: '4c',
        initialQuantity: 10,
        unit: 'mL',
        consentStatus: 'active',
      },
    });

    expect(updated.specimenType).toBe('whole_blood');
    expect(updated.containerType).toBe('sst_vial');
    expect(updated.remainingQuantity).toBe(10);
    expect(updated.unit).toBe('mL');
    expect(updated.status).toBe('collected');
  });

  it('should apply QCPassed event', () => {
    const state = createInitialState('spec-001', 'org-1');
    const updated = applyEventToState(state, {
      eventType: 'QCPassed',
      payload: { qcResult: 'passed', qcType: 'morphology', qcPerformedBy: 'user-1' },
    });

    expect(updated.lastQcResult).toBe('passed');
    expect(updated.lastQcAt).toBeTruthy();
    expect(updated.status).toBe('collected'); // status unchanged
  });

  it('should apply QCFailed event and set quarantined', () => {
    const state = createInitialState('spec-001', 'org-1');
    const updated = applyEventToState(state, {
      eventType: 'QCFailed',
      payload: { qcResult: 'failed', qcType: 'hemolysis', qcPerformedBy: 'user-1' },
    });

    expect(updated.lastQcResult).toBe('failed');
    expect(updated.status).toBe('quarantined');
  });

  it('should increment freeze-thaw count', () => {
    const state = createInitialState('spec-001', 'org-1');
    const once = applyEventToState(state, {
      eventType: 'FreezeThawRecorded',
      payload: { cycleNumber: 1 },
    });
    expect(once.freezeThawCount).toBe(1);

    const twice = applyEventToState(once, {
      eventType: 'FreezeThawRecorded',
      payload: { cycleNumber: 2 },
    });
    expect(twice.freezeThawCount).toBe(2);
  });

  it('should apply VolumeAdjusted event', () => {
    const state = createInitialState('spec-001', 'org-1');
    const collected = applyEventToState(state, {
      eventType: 'SpecimenCollected',
      payload: {
        organizationId: 'org-1',
        specimenType: 'plasma',
        initialQuantity: 5.0,
        unit: 'mL',
        consentStatus: 'active',
      },
    });

    const adjusted = applyEventToState(collected, {
      eventType: 'VolumeAdjusted',
      payload: { volumeUsed: 0.5, unit: 'mL', purpose: 'assay', remainingAfter: 4.5 },
    });

    expect(adjusted.remainingQuantity).toBe(4.5);
  });

  it('should apply ShipmentInitiated event', () => {
    const state = createInitialState('spec-001', 'org-1');
    const updated = applyEventToState(state, {
      eventType: 'ShipmentInitiated',
      payload: { shipmentId: 'sh-001', destinationOrgId: 'org-2', courier: 'World Courier' },
    });

    expect(updated.status).toBe('shipped');
    expect(updated.currentLocation.shipmentId).toBe('sh-001');
  });

  it('should apply Consumed event', () => {
    const state = createInitialState('spec-001', 'org-1');
    const updated = applyEventToState(state, {
      eventType: 'Consumed',
      payload: {},
    });
    expect(updated.status).toBe('consumed');
  });

  it('should apply Destroyed event', () => {
    const state = createInitialState('spec-001', 'org-1');
    const updated = applyEventToState(state, {
      eventType: 'Destroyed',
      payload: {},
    });
    expect(updated.status).toBe('destroyed');
  });

  it('should apply LocationChanged event', () => {
    const state = createInitialState('spec-001', 'org-1');
    const updated = applyEventToState(state, {
      eventType: 'LocationChanged',
      payload: {
        organizationId: 'org-1',
        facility: 'Main Biobank',
        freezer: 'Freezer-3',
        rack: 'Rack-A',
        box: 'Box-12',
        position: 'A3',
      },
    });

    expect(updated.currentLocation.facility).toBe('Main Biobank');
    expect(updated.currentLocation.freezer).toBe('Freezer-3');
    expect(updated.currentLocation.position).toBe('A3');
  });

  it('should apply ConsentUpdated event', () => {
    const state = createInitialState('spec-001', 'org-1');
    const updated = applyEventToState(state, {
      eventType: 'ConsentUpdated',
      payload: { consentStatus: 'withdrawn', consentId: 'consent-002', updatedBy: 'user-1' },
    });
    expect(updated.consentStatus).toBe('withdrawn');
    expect(updated.consentId).toBe('consent-002');
  });
});

// --------------------------------------------------------------------------
// reconstructState()
// --------------------------------------------------------------------------

describe('reconstructState()', () => {
  it('should reconstruct state from event sequence', () => {
    const events: TwinEvent[] = [
      {
        id: 'evt-1', twinType: 'specimen', twinId: 'spec-001',
        eventType: 'SpecimenCollected',
        payload: { organizationId: 'org-1', specimenType: 'ffpe', containerType: 'block', preservationType: 'ffpe', initialQuantity: 1, unit: 'block', consentStatus: 'active' },
        sequence: 1, occurredAt: '2026-01-01', recordedAt: '2026-01-01', actorId: 'user-1',
      },
      {
        id: 'evt-2', twinType: 'specimen', twinId: 'spec-001',
        eventType: 'QCPassed',
        payload: { qcResult: 'passed', qcType: 'morphology', qcPerformedBy: 'user-2' },
        sequence: 2, occurredAt: '2026-01-02', recordedAt: '2026-01-02', actorId: 'user-2',
      },
      {
        id: 'evt-3', twinType: 'specimen', twinId: 'spec-001',
        eventType: 'ShipmentInitiated',
        payload: { shipmentId: 'sh-001', destinationOrgId: 'org-2', courier: 'FedEx' },
        sequence: 3, occurredAt: '2026-01-05', recordedAt: '2026-01-05', actorId: 'user-1',
      },
    ];

    const state = reconstructState('spec-001', 'org-1', events);

    expect(state.status).toBe('shipped');
    expect(state.specimenType).toBe('ffpe');
    expect(state.lastQcResult).toBe('passed');
    expect(state.currentLocation.shipmentId).toBe('sh-001');
    expect(state.twinSequence).toBe(3);
  });

  it('should reconstruct empty state from no events', () => {
    const state = reconstructState('spec-001', 'org-1', []);
    expect(state.status).toBe('collected');
    expect(state.twinSequence).toBe(0);
  });
});

// --------------------------------------------------------------------------
// reconstructStateAt()
// --------------------------------------------------------------------------

describe('reconstructStateAt()', () => {
  it('should reconstruct state as-of a specific time', () => {
    const events: TwinEvent[] = [
      {
        id: 'evt-1', twinType: 'specimen', twinId: 'spec-001',
        eventType: 'SpecimenCollected',
        payload: { organizationId: 'org-1', specimenType: 'ffpe', initialQuantity: 1, unit: 'block', consentStatus: 'active' },
        sequence: 1, occurredAt: '2026-01-01', recordedAt: '2026-01-01', actorId: 'user-1',
      },
      {
        id: 'evt-2', twinType: 'specimen', twinId: 'spec-001',
        eventType: 'QCPassed',
        payload: { qcResult: 'passed', qcType: 'morphology', qcPerformedBy: 'user-2' },
        sequence: 2, occurredAt: '2026-01-02', recordedAt: '2026-01-02', actorId: 'user-2',
      },
      {
        id: 'evt-3', twinType: 'specimen', twinId: 'spec-001',
        eventType: 'ShipmentInitiated',
        payload: { shipmentId: 'sh-001', destinationOrgId: 'org-2', courier: 'FedEx' },
        sequence: 3, occurredAt: '2026-01-05', recordedAt: '2026-01-05', actorId: 'user-1',
      },
    ];

    // State as of Jan 3 — before shipment
    const state = reconstructStateAt('spec-001', 'org-1', events, '2026-01-03');

    expect(state.status).toBe('collected'); // not yet shipped
    expect(state.lastQcResult).toBe('passed'); // QC happened on Jan 2
    expect(state.twinSequence).toBe(2);
  });
});

// --------------------------------------------------------------------------
// isValidTransition()
// --------------------------------------------------------------------------

describe('isValidTransition()', () => {
  it('should allow valid transitions', () => {
    expect(isValidTransition('collected', 'stored')).toBe(true);
    expect(isValidTransition('collected', 'shipped')).toBe(true);
    expect(isValidTransition('collected', 'quarantined')).toBe(true);
    expect(isValidTransition('stored', 'shipped')).toBe(true);
    expect(isValidTransition('shipped', 'received')).toBe(true);
    expect(isValidTransition('quarantined', 'stored')).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(isValidTransition('consumed', 'stored')).toBe(false);  // terminal
    expect(isValidTransition('destroyed', 'stored')).toBe(false); // terminal
    expect(isValidTransition('stored', 'collected')).toBe(false); // backward
  });

  it('should reject transitions from unknown status', () => {
    expect(isValidTransition('unknown' as any, 'stored')).toBe(false);
  });
});

// --------------------------------------------------------------------------
// VALID_SPECIMEN_TRANSITIONS
// --------------------------------------------------------------------------

describe('VALID_SPECIMEN_TRANSITIONS', () => {
  it('should have terminal states with empty transitions', () => {
    expect(VALID_SPECIMEN_TRANSITIONS.consumed).toHaveLength(0);
    expect(VALID_SPECIMEN_TRANSITIONS.destroyed).toHaveLength(0);
  });

  it('should allow quarantined clearance', () => {
    expect(VALID_SPECIMEN_TRANSITIONS.quarantined).toContain('stored');
    expect(VALID_SPECIMEN_TRANSITIONS.quarantined).toContain('destroyed');
  });
});

// --------------------------------------------------------------------------
// SpecimenTwinService
// --------------------------------------------------------------------------

describe('SpecimenTwinService', () => {
  // Create an in-memory adapter for testing
  function createMockAdapter(): TwinAdapter {
    const eventStore: TwinEvent[] = [];
    const stateStore = new Map<string, SpecimenTwinState>();

    return {
      async getTwinEvents(twinType, twinId, options?): Promise<TwinEvent[]> {
        let events = eventStore.filter((e) => e.twinType === twinType && e.twinId === twinId);
        events.sort((a, b) => a.sequence - b.sequence);

        if (options?.to) {
          events = events.filter((e) => e.recordedAt <= options.to!);
        }
        if (options?.from) {
          events = events.filter((e) => e.recordedAt >= options.from!);
        }
        return events;
      },

      async applyEvent(input: RecordEventInput): Promise<{ eventId: string; sequence: number; eventType: string }> {
        const events = eventStore.filter(
          (e) => e.twinType === input.twinType && e.twinId === input.twinId,
        );
        const nextSeq = events.length > 0 ? Math.max(...events.map((e) => e.sequence)) + 1 : 1;

        const event: TwinEvent = {
          id: `evt-${eventStore.length + 1}`,
          twinType: input.twinType,
          twinId: input.twinId,
          eventType: input.eventType,
          payload: input.payload,
          sequence: nextSeq,
          occurredAt: input.occurredAt ?? new Date().toISOString(),
          recordedAt: new Date().toISOString(),
          actorId: input.actorId,
          evidenceRef: input.evidenceRef,
        };

        eventStore.push(event);

        // Build state from all events
        const allEvents = eventStore.filter(
          (e) => e.twinType === input.twinType && e.twinId === input.twinId,
        );
        let state = createInitialState(input.twinId, (input.payload.organizationId as string) ?? 'unknown');

        for (const evt of allEvents) {
          state = applyEventToState(state, evt);
          state.twinSequence = evt.sequence;
          state.twinUpdatedAt = evt.recordedAt;
        }

        stateStore.set(input.twinId, state);

        return { eventId: event.id, sequence: nextSeq, eventType: input.eventType };
      },

      async getSpecimenState(id: string): Promise<SpecimenTwinState | null> {
        return stateStore.get(id) ?? null;
      },
    };
  }

  it('should record SpecimenCollected event and create twin', async () => {
    const adapter = createMockAdapter();
    const service = new SpecimenTwinService(adapter);

    const { event, state } = await service.recordEvent({
      twinId: 'spec-001',
      eventType: 'SpecimenCollected',
      payload: {
        organizationId: 'org-1',
        specimenType: 'whole_blood',
        containerType: 'sst_vial',
        preservationType: 'fresh',
        storageTemperature: '4c',
        initialQuantity: 10,
        unit: 'mL',
        consentStatus: 'active',
      },
      actorId: 'user-1',
    });

    expect(event.sequence).toBe(1);
    expect(state.status).toBe('collected');
    expect(state.specimenType).toBe('whole_blood');
  });

  it('should apply multiple events and track state changes', async () => {
    const adapter = createMockAdapter();
    const service = new SpecimenTwinService(adapter);

    // Collect
    await service.recordEvent({
      twinId: 'spec-002',
      eventType: 'SpecimenCollected',
      payload: { organizationId: 'org-1', specimenType: 'plasma', containerType: 'cryovial', preservationType: 'fresh_frozen', initialQuantity: 2.0, unit: 'mL', consentStatus: 'active' },
      actorId: 'user-1',
    });

    // QC pass
    await service.recordEvent({
      twinId: 'spec-002',
      eventType: 'QCPassed',
      payload: { qcResult: 'passed', qcType: 'hemolysis', qcPerformedBy: 'user-2' },
      actorId: 'user-2',
    });

    // Ship
    await service.recordEvent({
      twinId: 'spec-002',
      eventType: 'ShipmentInitiated',
      payload: { shipmentId: 'sh-001', destinationOrgId: 'org-2', courier: 'FedEx' },
      actorId: 'user-1',
    });

    const state = await service.getState('spec-002');
    expect(state.status).toBe('shipped');
    expect(state.specimenType).toBe('plasma');
    expect(state.lastQcResult).toBe('passed');
    expect(state.twinSequence).toBe(3);
  });

  it('should get state at a point in time', async () => {
    const adapter = createMockAdapter();
    const service = new SpecimenTwinService(adapter);

    // Collect
    await service.recordEvent({
      twinId: 'spec-003',
      eventType: 'SpecimenCollected',
      payload: { organizationId: 'org-1', specimenType: 'ffpe', initialQuantity: 1, unit: 'block', consentStatus: 'active' },
      actorId: 'user-1',
    });

    const beforeShip = await service.getState('spec-003');
    expect(beforeShip.status).toBe('collected');

    // Ship
    await service.recordEvent({
      twinId: 'spec-003',
      eventType: 'ShipmentInitiated',
      payload: { shipmentId: 'sh-002', destinationOrgId: 'org-2', courier: 'DHL' },
      actorId: 'user-1',
    });

    const afterShip = await service.getState('spec-003');
    expect(afterShip.status).toBe('shipped');
  });

  it('should get events for a twin', async () => {
    const adapter = createMockAdapter();
    const service = new SpecimenTwinService(adapter);

    await service.recordEvent({
      twinId: 'spec-004',
      eventType: 'SpecimenCollected',
      payload: { organizationId: 'org-1', specimenType: 'tissue', initialQuantity: 1, unit: 'block', consentStatus: 'active' },
      actorId: 'user-1',
    });

    await service.recordEvent({
      twinId: 'spec-004',
      eventType: 'QCPassed',
      payload: { qcResult: 'passed', qcType: 'morphology', qcPerformedBy: 'user-2' },
      actorId: 'user-2',
    });

    const events = await service.getEvents('spec-004');
    expect(events).toHaveLength(2);
    expect(events[0].sequence).toBe(1);
    expect(events[0].eventType).toBe('SpecimenCollected');
    expect(events[1].sequence).toBe(2);
    expect(events[1].eventType).toBe('QCPassed');
  });

  it('should validate transitions', async () => {
    const adapter = createMockAdapter();
    const service = new SpecimenTwinService(adapter);

    // Twin doesn't exist — only SpecimenCollected is valid
    const invalidFirst = await service.validateTransition('spec-005', 'ShipmentInitiated');
    expect(invalidFirst.valid).toBe(false);

    const validFirst = await service.validateTransition('spec-005', 'SpecimenCollected');
    expect(validFirst.valid).toBe(true);

    // Create the twin
    await service.recordEvent({
      twinId: 'spec-005',
      eventType: 'SpecimenCollected',
      payload: { organizationId: 'org-1', specimenType: 'serum', initialQuantity: 5, unit: 'mL', consentStatus: 'active' },
      actorId: 'user-1',
    });

    // Now consuming is valid
    const validConsume = await service.validateTransition('spec-005', 'Consumed');
    expect(validConsume.valid).toBe(true);

    // After consuming, cannot ship
    await service.recordEvent({
      twinId: 'spec-005',
      eventType: 'Consumed',
      payload: {},
      actorId: 'user-1',
    });

    const invalidShip = await service.validateTransition('spec-005', 'ShipmentInitiated');
    expect(invalidShip.valid).toBe(false);
    expect(invalidShip.reason).toContain('Cannot transition');
  });
});
