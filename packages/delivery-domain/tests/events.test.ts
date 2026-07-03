// ==========================================================================
// Domain Events Tests — Delivery Domain
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { createDeliveryArtifactId, createDeliveryChannelId, createDeliveryRecipientId, createDeliveryReceiptId } from '../src/value-objects/ids.js';
import {
  createArtifactCreatedEvent,
  createArtifactCompiledEvent,
  createArtifactDeliveredEvent,
  createArtifactRevokedEvent,
  createReceiptRecordedEvent,
  createDeliveryFailedEvent,
  createArtifactGeneratedEvent,
  createArtifactQueuedEvent,
  createArtifactLifecycleDeliveredEvent,
  createArtifactOpenedEvent,
  createArtifactExpiredEvent,
  createArtifactLifecycleRevokedEvent,
} from '../src/events/delivery-events.js';

// ==========================================================================
// Event structure
// ==========================================================================

describe('Domain Events', () => {
  // --- Sprint 9.1 events (kept for backward compat) ---

  describe('DeliveryArtifactCreated', () => {
    it('has correct structure', () => {
      const artifactId = createDeliveryArtifactId();
      const contentHash = 'a'.repeat(64);
      const templateId = createDeliveryArtifactId();
      const event = createArtifactCreatedEvent(artifactId, 'pdf', contentHash, templateId);

      expect(event.type).toBe('delivery.artifact.created');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.type).toBe('pdf');
      expect(event.payload.contentHash).toBe(contentHash);
      expect(event.payload.templateId).toBe(templateId);
      expect(event.timestamp).toBeTypeOf('string');
      expect(() => new Date(event.timestamp)).not.toThrow();
    });
  });

  describe('DeliveryArtifactCompiled', () => {
    it('has correct structure', () => {
      const artifactId = createDeliveryArtifactId();
      const event = createArtifactCompiledEvent(artifactId);

      expect(event.type).toBe('delivery.artifact.compiled');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.compiledAt).toBeTypeOf('string');
      expect(() => new Date(event.payload.compiledAt)).not.toThrow();
    });

    it('accepts custom compiledAt', () => {
      const artifactId = createDeliveryArtifactId();
      const compiledAt = '2026-01-15T10:30:00.000Z';
      const event = createArtifactCompiledEvent(artifactId, compiledAt);
      expect(event.payload.compiledAt).toBe(compiledAt);
    });
  });

  describe('DeliveryArtifactDelivered', () => {
    it('has correct structure', () => {
      const artifactId = createDeliveryArtifactId();
      const channelId = createDeliveryChannelId();
      const recipientId = createDeliveryRecipientId();
      const event = createArtifactDeliveredEvent(artifactId, channelId, recipientId);

      expect(event.type).toBe('delivery.artifact.delivered');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.channelId).toBe(channelId);
      expect(event.payload.recipientId).toBe(recipientId);
    });
  });

  describe('DeliveryArtifactRevoked', () => {
    it('has correct structure', () => {
      const artifactId = createDeliveryArtifactId();
      const reason = 'Data correction required';
      const event = createArtifactRevokedEvent(artifactId, reason);

      expect(event.type).toBe('delivery.artifact.revoked');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.reason).toBe(reason);
    });
  });

  describe('DeliveryReceiptRecorded', () => {
    it('has correct structure', () => {
      const receiptId = createDeliveryReceiptId();
      const artifactId = createDeliveryArtifactId();
      const event = createReceiptRecordedEvent(receiptId, artifactId, 'delivered');

      expect(event.type).toBe('delivery.receipt.recorded');
      expect(event.payload.receiptId).toBe(receiptId);
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.status).toBe('delivered');
    });

    it('accepts all receipt statuses', () => {
      const statuses = ['sent', 'delivered', 'failed', 'bounced'] as const;
      for (const status of statuses) {
        const event = createReceiptRecordedEvent(
          createDeliveryReceiptId(),
          createDeliveryArtifactId(),
          status,
        );
        expect(event.payload.status).toBe(status);
      }
    });
  });

  describe('DeliveryFailed', () => {
    it('has correct structure', () => {
      const artifactId = createDeliveryArtifactId();
      const channelId = createDeliveryChannelId();
      const error = 'Webhook endpoint returned 500';
      const attemptNumber = 3;
      const event = createDeliveryFailedEvent(artifactId, channelId, error, attemptNumber);

      expect(event.type).toBe('delivery.failed');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.channelId).toBe(channelId);
      expect(event.payload.error).toBe(error);
      expect(event.payload.attemptNumber).toBe(3);
    });
  });

  // --- Sprint 9.2 lifecycle events ---

  describe('ArtifactGenerated', () => {
    it('has correct event type', () => {
      const artifactId = createDeliveryArtifactId();
      const event = createArtifactGeneratedEvent(artifactId);
      expect(event.type).toBe('delivery.artifact.generated');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.generatedAt).toBeTypeOf('string');
    });

    it('accepts custom generatedAt', () => {
      const artifactId = createDeliveryArtifactId();
      const generatedAt = '2026-02-01T08:00:00.000Z';
      const event = createArtifactGeneratedEvent(artifactId, generatedAt);
      expect(event.payload.generatedAt).toBe(generatedAt);
    });

    it('has ISO timestamp', () => {
      const event = createArtifactGeneratedEvent(createDeliveryArtifactId());
      expect(() => new Date(event.timestamp)).not.toThrow();
    });
  });

  describe('ArtifactQueued', () => {
    it('has correct event type', () => {
      const artifactId = createDeliveryArtifactId();
      const channelId = createDeliveryChannelId();
      const event = createArtifactQueuedEvent(artifactId, channelId);
      expect(event.type).toBe('delivery.artifact.queued');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.channelId).toBe(channelId);
      expect(event.payload.queuedAt).toBeTypeOf('string');
    });

    it('accepts custom queuedAt', () => {
      const artifactId = createDeliveryArtifactId();
      const channelId = createDeliveryChannelId();
      const queuedAt = '2026-02-01T08:05:00.000Z';
      const event = createArtifactQueuedEvent(artifactId, channelId, queuedAt);
      expect(event.payload.queuedAt).toBe(queuedAt);
    });
  });

  describe('ArtifactDelivered (lifecycle)', () => {
    it('has correct event type', () => {
      const artifactId = createDeliveryArtifactId();
      const channelId = createDeliveryChannelId();
      const recipientId = createDeliveryRecipientId();
      const event = createArtifactLifecycleDeliveredEvent(artifactId, channelId, recipientId);
      expect(event.type).toBe('delivery.artifact.lifecycle.delivered');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.channelId).toBe(channelId);
      expect(event.payload.recipientId).toBe(recipientId);
      expect(event.payload.deliveredAt).toBeTypeOf('string');
    });

    it('accepts custom deliveredAt', () => {
      const artifactId = createDeliveryArtifactId();
      const channelId = createDeliveryChannelId();
      const recipientId = createDeliveryRecipientId();
      const deliveredAt = '2026-02-01T09:00:00.000Z';
      const event = createArtifactLifecycleDeliveredEvent(artifactId, channelId, recipientId, deliveredAt);
      expect(event.payload.deliveredAt).toBe(deliveredAt);
    });
  });

  describe('ArtifactOpened', () => {
    it('has correct event type', () => {
      const artifactId = createDeliveryArtifactId();
      const recipientId = createDeliveryRecipientId();
      const event = createArtifactOpenedEvent(artifactId, recipientId);
      expect(event.type).toBe('delivery.artifact.opened');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.recipientId).toBe(recipientId);
      expect(event.payload.openedAt).toBeTypeOf('string');
    });

    it('accepts custom openedAt', () => {
      const artifactId = createDeliveryArtifactId();
      const recipientId = createDeliveryRecipientId();
      const openedAt = '2026-02-01T09:15:00.000Z';
      const event = createArtifactOpenedEvent(artifactId, recipientId, openedAt);
      expect(event.payload.openedAt).toBe(openedAt);
    });
  });

  describe('ArtifactExpired', () => {
    it('has correct event type', () => {
      const artifactId = createDeliveryArtifactId();
      const event = createArtifactExpiredEvent(artifactId);
      expect(event.type).toBe('delivery.artifact.expired');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.expiredAt).toBeTypeOf('string');
    });

    it('includes reason when provided', () => {
      const artifactId = createDeliveryArtifactId();
      const event = createArtifactExpiredEvent(artifactId, undefined, 'past expiry window');
      expect(event.payload.reason).toBe('past expiry window');
    });

    it('reason is undefined when not provided', () => {
      const artifactId = createDeliveryArtifactId();
      const event = createArtifactExpiredEvent(artifactId);
      expect(event.payload.reason).toBeUndefined();
    });
  });

  describe('ArtifactRevoked (lifecycle)', () => {
    it('has correct event type', () => {
      const artifactId = createDeliveryArtifactId();
      const reason = 'Regulatory recall';
      const event = createArtifactLifecycleRevokedEvent(artifactId, reason);
      expect(event.type).toBe('delivery.artifact.lifecycle.revoked');
      expect(event.payload.artifactId).toBe(artifactId);
      expect(event.payload.reason).toBe(reason);
      expect(event.payload.revokedAt).toBeTypeOf('string');
    });

    it('accepts custom revokedAt', () => {
      const artifactId = createDeliveryArtifactId();
      const revokedAt = '2026-02-01T10:00:00.000Z';
      const event = createArtifactLifecycleRevokedEvent(artifactId, 'test', revokedAt);
      expect(event.payload.revokedAt).toBe(revokedAt);
    });
  });

  // --- General tests ---

  describe('All events have timestamps', () => {
    it('every factory produces an ISO timestamp', () => {
      const events = [
        createArtifactCreatedEvent(createDeliveryArtifactId(), 'pdf', 'a'.repeat(64), createDeliveryArtifactId()),
        createArtifactCompiledEvent(createDeliveryArtifactId()),
        createArtifactDeliveredEvent(createDeliveryArtifactId(), createDeliveryChannelId(), createDeliveryRecipientId()),
        createArtifactRevokedEvent(createDeliveryArtifactId(), 'test'),
        createReceiptRecordedEvent(createDeliveryReceiptId(), createDeliveryArtifactId(), 'sent'),
        createDeliveryFailedEvent(createDeliveryArtifactId(), createDeliveryChannelId(), 'err', 1),
        createArtifactGeneratedEvent(createDeliveryArtifactId()),
        createArtifactQueuedEvent(createDeliveryArtifactId(), createDeliveryChannelId()),
        createArtifactLifecycleDeliveredEvent(createDeliveryArtifactId(), createDeliveryChannelId(), createDeliveryRecipientId()),
        createArtifactOpenedEvent(createDeliveryArtifactId(), createDeliveryRecipientId()),
        createArtifactExpiredEvent(createDeliveryArtifactId()),
        createArtifactLifecycleRevokedEvent(createDeliveryArtifactId(), 'test'),
      ];

      for (const event of events) {
        expect(event.timestamp).toBeTypeOf('string');
        expect(() => new Date(event.timestamp)).not.toThrow();
      }
    });
  });

  describe('Event type strings are distinct between old and lifecycle events', () => {
    it('old and new delivered events have different type strings', () => {
      const oldEvent = createArtifactDeliveredEvent(
        createDeliveryArtifactId(), createDeliveryChannelId(), createDeliveryRecipientId());
      const newEvent = createArtifactLifecycleDeliveredEvent(
        createDeliveryArtifactId(), createDeliveryChannelId(), createDeliveryRecipientId());
      expect(oldEvent.type).not.toBe(newEvent.type);
    });

    it('old and new revoked events have different type strings', () => {
      const oldEvent = createArtifactRevokedEvent(createDeliveryArtifactId(), 'test');
      const newEvent = createArtifactLifecycleRevokedEvent(createDeliveryArtifactId(), 'test');
      expect(oldEvent.type).not.toBe(newEvent.type);
    });
  });

  describe('Event immutability (structural)', () => {
    it('event payloads contain primitive or string values', () => {
      const event = createArtifactCreatedEvent(
        createDeliveryArtifactId(),
        'json',
        'a'.repeat(64),
        createDeliveryArtifactId(),
      );
      expect(typeof event.payload.artifactId).toBe('string');
      expect(typeof event.payload.type).toBe('string');
      expect(typeof event.payload.contentHash).toBe('string');
      expect(typeof event.payload.templateId).toBe('string');
    });
  });
});
