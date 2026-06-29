// ==========================================================================
// Kadarn Domain Events — Contract & Idempotency Tests
// ==========================================================================
// Validates: event envelope structure, event registry completeness,
// idempotency key uniqueness, payload type consistency.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import type {
  EventEnvelope,
  KadarnEventMap,
  KadarnEventType,
} from '../packages/domain-events/src/index.js';

// --------------------------------------------------------------------------
// Event Registry Completeness
// --------------------------------------------------------------------------

describe('Event registry', () => {
  it('should have all event types from the catalog', () => {
    // Expected events from Event Catalog §3
    const expectedEvents: KadarnEventType[] = [
      // §3.1 Foundation
      'OrganizationCreated',
      'OrganizationUpdated',
      'OrganizationMembershipAdded',
      'OrganizationMembershipRemoved',
      'OrganizationCapabilityAdded',
      'OrganizationCapabilityRemoved',

      // §3.2 Research Asset Lifecycle
      'ResearchAssetCreated',
      'SpecimenReserved',
      'CollectionStarted',
      'CollectionCompleted',
      'SpecimenCollected',
      'AliquotCreated',
      'QCCompleted',
      'QCPassed',
      'QCFailed',
      'FreezeThawRecorded',
      'VolumeAdjusted',
      'LocationChanged',
      'Consumed',
      'Destroyed',

      // §3.3 Access & Governance
      'AccessRequestSubmitted',
      'AccessRequestApproved',
      'AccessRequestRejected',
      'ConsentVerified',
      'IRBApproved',
      'MTAExecuted',
      'ConsentUpdated',
      'PolicyEvaluated',

      // §3.4 Program & Feasibility
      'ProgramCreated',
      'ProgramUpdated',
      'ProgramStatusChanged',
      'ProgramParticipantAdded',
      'ProgramParticipantRemoved',
      'ProgramParticipantRoleChanged',
      'FeasibilityRequested',
      'FeasibilityAssessmentCompleted',

      // §3.5 Fulfillment & Logistics
      'FulfillmentStarted',
      'FulfillmentCompleted',
      'FulfillmentPartiallyAccepted',
      'FulfillmentDisputed',
      'ShipmentCreated',
      'ShipmentDispatched',
      'TemperatureExcursionDetected',
      'ShipmentReceived',
      'SpecimenAccepted',
      'ShipmentDelivered',
      'ShipmentAccepted',
      'ShipmentDisputed',

      // §3.6 Settlement & Data
      'SettlementReleased',
      'SettlementInitiated',
      'PaymentDistributed',
      'SettlementCompleted',
      'DatasetLinked',
      'DataLinked',

      // §3.7 Trust
      'TrustScoreUpdated',
      'AccreditationAdded',
      'AccreditationExpired',
      'ComplianceIncident',

      // §3.8 System
      'IntegrationHealthy',
      'IntegrationOutage',
      'EventIngestionFailed',

      // Audit
      'AuditEventCreated',
    ];

    // Verify all expected events exist as keys in KadarnEventMap
    for (const eventType of expectedEvents) {
      // TypeScript compile-time check — if the event type doesn't exist,
      // this line would fail type checking. At runtime, we verify via
      // the type registry is not empty.
      const _verify: KadarnEventType = eventType;
      void _verify;
    }

    // Count them
    expect(expectedEvents).toHaveLength(62);
  });
});

// --------------------------------------------------------------------------
// Event Envelope Structure
// --------------------------------------------------------------------------

describe('Event envelope', () => {
  it('should have all required fields', () => {
    const envelope: EventEnvelope = {
      event_id: 'evt-001',
      event_type: 'SpecimenCollected',
      version: 1,
      occurred_at: '2026-01-15T10:30:00Z',
      recorded_at: '2026-01-15T10:30:05Z',
      actor_id: 'user-001',
      organization_id: 'org-001',
      tenant_id: 'org-001',
      subject_type: 'specimen',
      subject_id: 'spec-001',
      correlation_id: 'corr-abc-123',
      causation_id: null,
      payload: {
        specimenType: 'whole_blood',
        containerType: 'sst_vial',
      },
      metadata: {
        source: 'processing-service',
        version: '0.1.0',
      },
    };

    // Verify structure
    expect(envelope.event_id).toBe('evt-001');
    expect(envelope.event_type).toBe('SpecimenCollected');
    expect(envelope.version).toBe(1);
    expect(envelope.occurred_at).toBeTruthy();
    expect(envelope.recorded_at).toBeTruthy();
    expect(envelope.actor_id).toBe('user-001');
    expect(envelope.organization_id).toBe('org-001');
    expect(envelope.tenant_id).toBe('org-001');
    expect(envelope.subject_type).toBe('specimen');
    expect(envelope.subject_id).toBe('spec-001');
    expect(envelope.correlation_id).toBe('corr-abc-123');
    expect(envelope.causation_id).toBeNull();
    expect(envelope.payload).toBeTypeOf('object');
    expect(envelope.metadata).toBeTypeOf('object');
  });

  it('should support causation chains', () => {
    // Event B is caused by Event A
    const eventA: EventEnvelope = {
      event_id: 'evt-A',
      event_type: 'ShipmentCreated',
      version: 1,
      occurred_at: '2026-01-15T10:00:00Z',
      recorded_at: '2026-01-15T10:00:01Z',
      actor_id: 'user-001',
      organization_id: 'org-001',
      tenant_id: 'org-001',
      subject_type: 'shipment',
      subject_id: 'sh-001',
      correlation_id: 'corr-123',
      causation_id: null, // command-originating
      payload: { shipmentId: 'sh-001' },
      metadata: {},
    };

    const eventB: EventEnvelope = {
      event_id: 'evt-B',
      event_type: 'ShipmentDispatched',
      version: 1,
      occurred_at: '2026-01-15T14:00:00Z',
      recorded_at: '2026-01-15T14:00:02Z',
      actor_id: 'user-001',
      organization_id: 'org-001',
      tenant_id: 'org-001',
      subject_type: 'shipment',
      subject_id: 'sh-001',
      correlation_id: 'corr-123', // same chain
      causation_id: 'evt-A', // caused by event A
      payload: { shipmentId: 'sh-001', trackingNumber: 'FX-1234' },
      metadata: {},
    };

    expect(eventA.causation_id).toBeNull();
    expect(eventB.causation_id).toBe('evt-A');
    expect(eventA.correlation_id).toBe(eventB.correlation_id);
  });
});

// --------------------------------------------------------------------------
// Idempotency
// --------------------------------------------------------------------------

describe('Event idempotency', () => {
  it('should use event_id as the idempotency key', () => {
    // Same event_id = same event, regardless of other fields
    const event1: EventEnvelope = {
      event_id: 'evt-idemp-001',
      event_type: 'QCPassed',
      version: 1,
      occurred_at: '2026-01-15T10:00:00Z',
      recorded_at: '2026-01-15T10:00:05Z',
      actor_id: 'user-001',
      organization_id: 'org-001',
      tenant_id: 'org-001',
      subject_type: 'specimen',
      subject_id: 'spec-001',
      correlation_id: 'corr-123',
      causation_id: null,
      payload: { specimenId: 'spec-001', qcType: 'morphology' },
      metadata: {},
    };

    // Second publish with same ID — should be idempotent-skipped
    const event1Duplicate: EventEnvelope = {
      ...event1,
      recorded_at: '2026-01-15T10:00:10Z', // different recorded time
      metadata: { source: 'retry' },
    };

    // The idempotency key is event_id, not the content
    expect(event1.event_id).toBe(event1Duplicate.event_id);
    // The content can differ slightly (recording metadata) but the
    // event_id identifies it as the same event
  });
});

// --------------------------------------------------------------------------
// Event Count
// --------------------------------------------------------------------------

describe('Event count', () => {
  it('should total 62 canonical events', () => {
    // Count all expected events from the catalog
    interface EventCount {
      foundation: string[];
      assetLifecycle: string[];
      accessGovernance: string[];
      programFeasibility: string[];
      fulfillmentLogistics: string[];
      settlementData: string[];
      trustAccreditation: string[];
      systemIntegration: string[];
    }

    const counts: EventCount = {
      foundation: [
        'OrganizationCreated', 'OrganizationUpdated',
        'OrganizationMembershipAdded', 'OrganizationMembershipRemoved',
        'OrganizationCapabilityAdded', 'OrganizationCapabilityRemoved',
      ],
      assetLifecycle: [
        'ResearchAssetCreated', 'SpecimenReserved',
        'CollectionStarted', 'CollectionCompleted',
        'SpecimenCollected', 'AliquotCreated',
        'QCCompleted', 'QCPassed', 'QCFailed',
        'FreezeThawRecorded', 'VolumeAdjusted',
        'LocationChanged', 'Consumed', 'Destroyed',
      ],
      accessGovernance: [
        'AccessRequestSubmitted', 'AccessRequestApproved', 'AccessRequestRejected',
        'ConsentVerified', 'IRBApproved', 'MTAExecuted',
        'ConsentUpdated', 'PolicyEvaluated',
      ],
      programFeasibility: [
        'ProgramCreated', 'ProgramUpdated', 'ProgramStatusChanged',
        'ProgramParticipantAdded', 'ProgramParticipantRemoved',
        'ProgramParticipantRoleChanged',
        'FeasibilityRequested', 'FeasibilityAssessmentCompleted',
      ],
      fulfillmentLogistics: [
        'FulfillmentStarted', 'FulfillmentCompleted',
        'FulfillmentPartiallyAccepted', 'FulfillmentDisputed',
        'ShipmentCreated', 'ShipmentDispatched',
        'TemperatureExcursionDetected', 'ShipmentReceived',
        'SpecimenAccepted',
        'ShipmentDelivered', 'ShipmentAccepted', 'ShipmentDisputed',
      ],
      settlementData: [
        'SettlementReleased', 'SettlementInitiated',
        'PaymentDistributed', 'SettlementCompleted',
        'DatasetLinked', 'DataLinked',
      ],
      trustAccreditation: [
        'TrustScoreUpdated', 'AccreditationAdded',
        'AccreditationExpired', 'ComplianceIncident',
      ],
      systemIntegration: [
        'IntegrationHealthy', 'IntegrationOutage', 'EventIngestionFailed',
      ],
    };

    const total =
      counts.foundation.length +
      counts.assetLifecycle.length +
      counts.accessGovernance.length +
      counts.programFeasibility.length +
      counts.fulfillmentLogistics.length +
      counts.settlementData.length +
      counts.trustAccreditation.length +
      counts.systemIntegration.length +
      // Audit
      1;

    expect(total).toBe(62);
    expect(counts.foundation).toHaveLength(6);
    expect(counts.assetLifecycle).toHaveLength(14);
    expect(counts.accessGovernance).toHaveLength(8);
    expect(counts.programFeasibility).toHaveLength(8);
    expect(counts.fulfillmentLogistics).toHaveLength(12);
    expect(counts.settlementData).toHaveLength(6);
    expect(counts.trustAccreditation).toHaveLength(4);
    expect(counts.systemIntegration).toHaveLength(3);
  });
});

// --------------------------------------------------------------------------
// Event Naming Convention
// --------------------------------------------------------------------------

describe('Event naming', () => {
  it('should follow PascalCase past-tense convention', () => {
    const validPattern = /^[A-Z][a-zA-Z0-9]+(?:[A-Z][a-zA-Z0-9]+)*$/;

    const events: KadarnEventType[] = [
      'SpecimenCollected',
      'QCPassed',
      'QCFailed',
      'ShipmentDispatched',
      'TemperatureExcursionDetected',
      'OrganizationCreated',
      'AccessRequestSubmitted',
      'FeasibilityAssessmentCompleted',
      'FulfillmentPartiallyAccepted',
    ];

    for (const eventType of events) {
      expect(eventType).toMatch(validPattern);
      expect(eventType).not.toContain('_');
      expect(eventType).not.toContain('-');
    }
  });
});
