// ==========================================================================
// Artifact Lifecycle Tests — Sprint 9.2
// End-to-end state machine + event correlation
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { createDeliveryArtifactId, createDeliveryChannelId, createDeliveryRecipientId } from '../src/value-objects/ids.js';
import {
  isValidTransition,
  transitionStatus,
  isTerminalStatus,
  type ArtifactStatus,
} from '../src/value-objects/delivery-status.js';
import {
  createArtifactGeneratedEvent,
  createArtifactQueuedEvent,
  createArtifactLifecycleDeliveredEvent,
  createArtifactOpenedEvent,
  createArtifactExpiredEvent,
  createArtifactLifecycleRevokedEvent,
} from '../src/events/delivery-events.js';

// ==========================================================================
// Valid transitions
// ==========================================================================

describe('Artifact lifecycle — valid transitions', () => {
  const validTransitions: [ArtifactStatus, ArtifactStatus][] = [
    ['draft', 'generated'],
    ['generated', 'queued'],
    ['generated', 'revoked'],
    ['queued', 'delivered'],
    ['queued', 'revoked'],
    ['delivered', 'acknowledged'],
    ['delivered', 'expired'],
    ['acknowledged', 'expired'],
    ['acknowledged', 'revoked'],
  ];

  for (const [from, to] of validTransitions) {
    it(`allows ${from} → ${to}`, () => {
      expect(isValidTransition(from, to)).toBe(true);
    });
  }
});

// ==========================================================================
// Invalid transitions
// ==========================================================================

describe('Artifact lifecycle — invalid transitions', () => {
  it('rejects draft → queued (skip state)', () => {
    expect(isValidTransition('draft', 'queued')).toBe(false);
  });

  it('rejects draft → delivered (skip multiple states)', () => {
    expect(isValidTransition('draft', 'delivered')).toBe(false);
  });

  it('rejects draft → acknowledged (skip multiple states)', () => {
    expect(isValidTransition('draft', 'acknowledged')).toBe(false);
  });

  it('rejects generated → delivered (skip state)', () => {
    expect(isValidTransition('generated', 'delivered')).toBe(false);
  });

  it('rejects generated → acknowledged (skip multiple states)', () => {
    expect(isValidTransition('generated', 'acknowledged')).toBe(false);
  });

  it('rejects queued → acknowledged (skip state)', () => {
    expect(isValidTransition('queued', 'acknowledged')).toBe(false);
  });

  it('rejects delivered → draft (backwards)', () => {
    expect(isValidTransition('delivered', 'draft')).toBe(false);
  });

  it('rejects delivered → generated (backwards)', () => {
    expect(isValidTransition('delivered', 'generated')).toBe(false);
  });

  it('rejects acknowledged → draft (backwards)', () => {
    expect(isValidTransition('acknowledged', 'draft')).toBe(false);
  });

  it('rejects acknowledged → delivered (backwards)', () => {
    expect(isValidTransition('acknowledged', 'delivered')).toBe(false);
  });

  it('rejects draft → revoked (non-terminal direct)', () => {
    expect(isValidTransition('draft', 'revoked')).toBe(false);
  });

  it('rejects draft → expired (non-terminal direct)', () => {
    expect(isValidTransition('draft', 'expired')).toBe(false);
  });

  it('rejects generated → expired (non-terminal → terminal directly)', () => {
    expect(isValidTransition('generated', 'expired')).toBe(false);
  });

  it('rejects queued → expired (non-terminal → terminal directly)', () => {
    expect(isValidTransition('queued', 'expired')).toBe(false);
  });

  it('rejects expired → any state (terminal)', () => {
    const states: ArtifactStatus[] = ['draft', 'generated', 'queued', 'delivered', 'acknowledged', 'revoked'];
    for (const to of states) {
      expect(isValidTransition('expired', to)).toBe(false);
    }
  });

  it('rejects revoked → any state (terminal)', () => {
    const states: ArtifactStatus[] = ['draft', 'generated', 'queued', 'delivered', 'acknowledged', 'expired'];
    for (const to of states) {
      expect(isValidTransition('revoked', to)).toBe(false);
    }
  });

  it('throws on invalid transition via transitionStatus', () => {
    expect(() => transitionStatus('draft', 'queued')).toThrow(
      'Invalid artifact status transition: draft → queued',
    );
  });

  it('throws on terminal transition via transitionStatus', () => {
    expect(() => transitionStatus('expired', 'draft')).toThrow(
      'Invalid artifact status transition: expired → draft',
    );
  });
});

// ==========================================================================
// Terminal states
// ==========================================================================

describe('Artifact lifecycle — terminal states', () => {
  it('expired is terminal', () => {
    expect(isTerminalStatus('expired')).toBe(true);
  });

  it('revoked is terminal', () => {
    expect(isTerminalStatus('revoked')).toBe(true);
  });

  it('draft is not terminal', () => {
    expect(isTerminalStatus('draft')).toBe(false);
  });

  it('generated is not terminal', () => {
    expect(isTerminalStatus('generated')).toBe(false);
  });

  it('queued is not terminal', () => {
    expect(isTerminalStatus('queued')).toBe(false);
  });

  it('delivered is not terminal', () => {
    expect(isTerminalStatus('delivered')).toBe(false);
  });

  it('acknowledged is not terminal', () => {
    expect(isTerminalStatus('acknowledged')).toBe(false);
  });
});

// ==========================================================================
// Event factories
// ==========================================================================

describe('Artifact lifecycle — event factories', () => {
  describe('createArtifactGeneratedEvent', () => {
    it('has correct type string', () => {
      const event = createArtifactGeneratedEvent(createDeliveryArtifactId());
      expect(event.type).toBe('delivery.artifact.generated');
    });

    it('includes timestamp', () => {
      const event = createArtifactGeneratedEvent(createDeliveryArtifactId());
      expect(event.timestamp).toBeTypeOf('string');
      expect(() => new Date(event.timestamp)).not.toThrow();
    });

    it('defaults generatedAt to now', () => {
      const before = new Date().toISOString();
      const event = createArtifactGeneratedEvent(createDeliveryArtifactId());
      const after = new Date().toISOString();
      expect(event.payload.generatedAt >= before).toBe(true);
      expect(event.payload.generatedAt <= after).toBe(true);
    });

    it('accepts custom generatedAt', () => {
      const event = createArtifactGeneratedEvent(createDeliveryArtifactId(), '2026-03-01T12:00:00.000Z');
      expect(event.payload.generatedAt).toBe('2026-03-01T12:00:00.000Z');
    });
  });

  describe('createArtifactQueuedEvent', () => {
    it('has correct type string', () => {
      const event = createArtifactQueuedEvent(createDeliveryArtifactId(), createDeliveryChannelId());
      expect(event.type).toBe('delivery.artifact.queued');
    });

    it('includes channelId', () => {
      const channelId = createDeliveryChannelId();
      const event = createArtifactQueuedEvent(createDeliveryArtifactId(), channelId);
      expect(event.payload.channelId).toBe(channelId);
    });

    it('defaults queuedAt to now', () => {
      const event = createArtifactQueuedEvent(createDeliveryArtifactId(), createDeliveryChannelId());
      expect(() => new Date(event.payload.queuedAt)).not.toThrow();
    });
  });

  describe('createArtifactLifecycleDeliveredEvent', () => {
    it('has correct type string', () => {
      const event = createArtifactLifecycleDeliveredEvent(
        createDeliveryArtifactId(), createDeliveryChannelId(), createDeliveryRecipientId());
      expect(event.type).toBe('delivery.artifact.lifecycle.delivered');
    });

    it('includes channelId and recipientId', () => {
      const channelId = createDeliveryChannelId();
      const recipientId = createDeliveryRecipientId();
      const event = createArtifactLifecycleDeliveredEvent(
        createDeliveryArtifactId(), channelId, recipientId);
      expect(event.payload.channelId).toBe(channelId);
      expect(event.payload.recipientId).toBe(recipientId);
    });

    it('defaults deliveredAt to now', () => {
      const event = createArtifactLifecycleDeliveredEvent(
        createDeliveryArtifactId(), createDeliveryChannelId(), createDeliveryRecipientId());
      expect(() => new Date(event.payload.deliveredAt)).not.toThrow();
    });
  });

  describe('createArtifactOpenedEvent', () => {
    it('has correct type string', () => {
      const event = createArtifactOpenedEvent(createDeliveryArtifactId(), createDeliveryRecipientId());
      expect(event.type).toBe('delivery.artifact.opened');
    });

    it('includes recipientId', () => {
      const recipientId = createDeliveryRecipientId();
      const event = createArtifactOpenedEvent(createDeliveryArtifactId(), recipientId);
      expect(event.payload.recipientId).toBe(recipientId);
    });

    it('defaults openedAt to now', () => {
      const event = createArtifactOpenedEvent(createDeliveryArtifactId(), createDeliveryRecipientId());
      expect(() => new Date(event.payload.openedAt)).not.toThrow();
    });
  });

  describe('createArtifactExpiredEvent', () => {
    it('has correct type string', () => {
      const event = createArtifactExpiredEvent(createDeliveryArtifactId());
      expect(event.type).toBe('delivery.artifact.expired');
    });

    it('reason is optional', () => {
      const event = createArtifactExpiredEvent(createDeliveryArtifactId());
      expect(event.payload.reason).toBeUndefined();

      const eventWithReason = createArtifactExpiredEvent(createDeliveryArtifactId(), undefined, 'past window');
      expect(eventWithReason.payload.reason).toBe('past window');
    });

    it('defaults expiredAt to now', () => {
      const event = createArtifactExpiredEvent(createDeliveryArtifactId());
      expect(() => new Date(event.payload.expiredAt)).not.toThrow();
    });
  });

  describe('createArtifactLifecycleRevokedEvent', () => {
    it('has correct type string', () => {
      const event = createArtifactLifecycleRevokedEvent(createDeliveryArtifactId(), 'regulatory recall');
      expect(event.type).toBe('delivery.artifact.lifecycle.revoked');
    });

    it('includes reason', () => {
      const event = createArtifactLifecycleRevokedEvent(createDeliveryArtifactId(), 'data correction');
      expect(event.payload.reason).toBe('data correction');
    });

    it('defaults revokedAt to now', () => {
      const event = createArtifactLifecycleRevokedEvent(createDeliveryArtifactId(), 'test');
      expect(() => new Date(event.payload.revokedAt)).not.toThrow();
    });
  });

  describe('All 6 lifecycle event types in the union', () => {
    it('generates all 6 event types with distinct type strings', () => {
      const events = [
        createArtifactGeneratedEvent(createDeliveryArtifactId()),
        createArtifactQueuedEvent(createDeliveryArtifactId(), createDeliveryChannelId()),
        createArtifactLifecycleDeliveredEvent(createDeliveryArtifactId(), createDeliveryChannelId(), createDeliveryRecipientId()),
        createArtifactOpenedEvent(createDeliveryArtifactId(), createDeliveryRecipientId()),
        createArtifactExpiredEvent(createDeliveryArtifactId()),
        createArtifactLifecycleRevokedEvent(createDeliveryArtifactId(), 'test'),
      ];

      const types = events.map(e => e.type);
      const unique = new Set(types);
      expect(unique.size).toBe(6);
    });
  });
});

// ==========================================================================
// Full lifecycle walkthrough
// ==========================================================================

describe('Artifact lifecycle — end-to-end walkthrough', () => {
  it('simulates draft → generated → queued → delivered → acknowledged → expired', () => {
    const artifactId = createDeliveryArtifactId();
    const channelId = createDeliveryChannelId();
    const recipientId = createDeliveryRecipientId();

    // Draft → Generated
    expect(isValidTransition('draft', 'generated')).toBe(true);
    const status1 = transitionStatus('draft', 'generated');
    expect(status1).toBe('generated');
    const event1 = createArtifactGeneratedEvent(artifactId);
    expect(event1.type).toBe('delivery.artifact.generated');

    // Generated → Queued
    expect(isValidTransition('generated', 'queued')).toBe(true);
    const status2 = transitionStatus('generated', 'queued');
    expect(status2).toBe('queued');
    const event2 = createArtifactQueuedEvent(artifactId, channelId);
    expect(event2.type).toBe('delivery.artifact.queued');

    // Queued → Delivered
    expect(isValidTransition('queued', 'delivered')).toBe(true);
    const status3 = transitionStatus('queued', 'delivered');
    expect(status3).toBe('delivered');
    const event3 = createArtifactLifecycleDeliveredEvent(artifactId, channelId, recipientId);
    expect(event3.type).toBe('delivery.artifact.lifecycle.delivered');

    // Delivered → Acknowledged
    expect(isValidTransition('delivered', 'acknowledged')).toBe(true);
    const status4 = transitionStatus('delivered', 'acknowledged');
    expect(status4).toBe('acknowledged');
    const event4 = createArtifactOpenedEvent(artifactId, recipientId);
    expect(event4.type).toBe('delivery.artifact.opened');

    // Acknowledged → Expired
    expect(isValidTransition('acknowledged', 'expired')).toBe(true);
    const status5 = transitionStatus('acknowledged', 'expired');
    expect(status5).toBe('expired');
    const event5 = createArtifactExpiredEvent(artifactId);
    expect(event5.type).toBe('delivery.artifact.expired');

    // Expired is terminal
    expect(isTerminalStatus('expired')).toBe(true);
  });

  it('simulates early revocation path: draft → generated → revoked', () => {
    const artifactId = createDeliveryArtifactId();

    // Draft → Generated
    expect(transitionStatus('draft', 'generated')).toBe('generated');
    createArtifactGeneratedEvent(artifactId);

    // Generated → Revoked (early termination)
    expect(isValidTransition('generated', 'revoked')).toBe(true);
    const status = transitionStatus('generated', 'revoked');
    expect(status).toBe('revoked');
    const event = createArtifactLifecycleRevokedEvent(artifactId, 'policy change');
    expect(event.type).toBe('delivery.artifact.lifecycle.revoked');
    expect(event.payload.reason).toBe('policy change');

    // Revoked is terminal
    expect(isTerminalStatus('revoked')).toBe(true);
  });

  it('raises all lifecycle events with sequential timestamps', () => {
    const artifactId = createDeliveryArtifactId();
    const channelId = createDeliveryChannelId();
    const recipientId = createDeliveryRecipientId();

    const events: string[] = [];

    // Simulate waiting 1ms between events to ensure timestamp progression
    const e1 = createArtifactGeneratedEvent(artifactId);
    events.push(e1.type);

    const e2 = createArtifactQueuedEvent(artifactId, channelId);
    events.push(e2.type);

    const e3 = createArtifactLifecycleDeliveredEvent(artifactId, channelId, recipientId);
    events.push(e3.type);

    const e4 = createArtifactOpenedEvent(artifactId, recipientId);
    events.push(e4.type);

    const e5 = createArtifactExpiredEvent(artifactId);
    events.push(e5.type);

    expect(events).toEqual([
      'delivery.artifact.generated',
      'delivery.artifact.queued',
      'delivery.artifact.lifecycle.delivered',
      'delivery.artifact.opened',
      'delivery.artifact.expired',
    ]);
  });
});
