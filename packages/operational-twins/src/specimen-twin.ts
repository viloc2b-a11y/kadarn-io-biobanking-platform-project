// ==========================================================================
// Kadarn Operational Twins — Specimen Twin Service
// ==========================================================================
// The Specimen Twin is the reference implementation of an Operational Twin.
// It tracks a single biospecimen or aliquot through its complete lifecycle.
// ==========================================================================

import type {
  TwinAdapter,
  SpecimenTwinState,
  TwinEvent,
  RecordEventInput,
} from './types.js';

import {
  createInitialState,
  applyEventToState,
  reconstructState,
  reconstructStateAt,
  getStatusForEvent,
  isValidTransition,
} from './engine.js';

export class SpecimenTwinService {
  constructor(private readonly adapter: TwinAdapter) {}

  // ------------------------------------------------------------------------
  // getState — get current specimen twin state
  // ------------------------------------------------------------------------
  async getState(id: string): Promise<SpecimenTwinState> {
    // Try the state table first (fast path)
    const state = await this.adapter.getSpecimenState(id);
    if (state) return state;

    // Fall back to reconstruction from events (slow path)
    const events = await this.adapter.getTwinEvents('specimen', id);
    if (events.length === 0) {
      throw new Error(`Specimen twin not found: ${id}`);
    }

    return reconstructState(id, events[0].payload.organizationId as string, events);
  }

  // ------------------------------------------------------------------------
  // getStateAt — get state as it was at a specific time
  // ------------------------------------------------------------------------
  async getStateAt(id: string, timestamp: string): Promise<SpecimenTwinState> {
    const events = await this.adapter.getTwinEvents('specimen', id, { to: timestamp });
    if (events.length === 0) {
      throw new Error(`No events found for specimen twin ${id} before ${timestamp}`);
    }
    return reconstructStateAt(
      id,
      events[0].payload.organizationId as string,
      events,
      timestamp,
    );
  }

  // ------------------------------------------------------------------------
  // recordEvent — record an event and update state
  // ------------------------------------------------------------------------
  async recordEvent(input: {
    twinId: string;
    eventType: string;
    payload: Record<string, unknown>;
    actorId: string;
    occurredAt?: string;
    evidenceRef?: string;
  }): Promise<{
    event: TwinEvent;
    state: SpecimenTwinState;
  }> {
    const recorded = await this.adapter.applyEvent({
      twinType: 'specimen',
      twinId: input.twinId,
      eventType: input.eventType,
      payload: input.payload,
      actorId: input.actorId,
      occurredAt: input.occurredAt,
      evidenceRef: input.evidenceRef,
    });

    // Read back the updated state
    const state = await this.adapter.getSpecimenState(input.twinId);
    if (!state) {
      throw new Error(`State not found after recording event for twin ${input.twinId}`);
    }

    return {
      event: {
        id: recorded.eventId,
        twinType: 'specimen',
        twinId: input.twinId,
        eventType: input.eventType,
        payload: input.payload,
        sequence: recorded.sequence,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
        recordedAt: new Date().toISOString(),
        actorId: input.actorId,
        evidenceRef: input.evidenceRef,
      },
      state,
    };
  }

  // ------------------------------------------------------------------------
  // validateTransition — check if an event would produce a valid transition
  // ------------------------------------------------------------------------
  async validateTransition(
    twinId: string,
    eventType: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    const targetStatus = getStatusForEvent(eventType);
    if (!targetStatus) {
      return { valid: true }; // event doesn't change status
    }

    try {
      const current = await this.getState(twinId);
      if (!isValidTransition(current.status, targetStatus)) {
        return {
          valid: false,
          reason: `Cannot transition from '${current.status}' to '${targetStatus}' via ${eventType}`,
        };
      }
      return { valid: true };
    } catch {
      // Twin doesn't exist yet — only SpecimenCollected is valid
      if (eventType === 'SpecimenCollected') {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Twin does not exist. First event must be SpecimenCollected, not ${eventType}`,
      };
    }
  }

  // ------------------------------------------------------------------------
  // getEvents — get event history for a specimen twin
  // ------------------------------------------------------------------------
  async getEvents(id: string): Promise<TwinEvent[]> {
    return this.adapter.getTwinEvents('specimen', id);
  }

  // ------------------------------------------------------------------------
  // getEventsInRange — get events in a time range
  // ------------------------------------------------------------------------
  async getEventsInRange(id: string, from: string, to: string): Promise<TwinEvent[]> {
    return this.adapter.getTwinEvents('specimen', id, { from, to });
  }
}
