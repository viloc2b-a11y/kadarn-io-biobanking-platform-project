// ==========================================================================
// Domain Events — Delivery Domain (KEMS-007 event catalog)
// All events are plain objects with type, payload, and timestamp.
// ==========================================================================

import type { DeliveryArtifactId, DeliveryChannelId, DeliveryRecipientId, DeliveryReceiptId } from '../value-objects/ids.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ContentHash } from '../value-objects/content-hash.js';
import type { ReceiptStatus } from '../value-objects/receipt-status.js';

// --- Event base ---
export interface DomainEvent {
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: string; // ISO 8601
}

// --- Sprint 9.1 concrete events (backward compat) ---

export interface DeliveryArtifactCreated extends DomainEvent {
  type: 'delivery.artifact.created';
  payload: {
    artifactId: DeliveryArtifactId;
    type: ArtifactType;
    contentHash: ContentHash;
    templateId: string;
  };
}

export interface DeliveryArtifactCompiled extends DomainEvent {
  type: 'delivery.artifact.compiled';
  payload: {
    artifactId: DeliveryArtifactId;
    compiledAt: string;
  };
}

export interface DeliveryArtifactDelivered extends DomainEvent {
  type: 'delivery.artifact.delivered';
  payload: {
    artifactId: DeliveryArtifactId;
    channelId: DeliveryChannelId;
    recipientId: DeliveryRecipientId;
  };
}

export interface DeliveryArtifactRevoked extends DomainEvent {
  type: 'delivery.artifact.revoked';
  payload: {
    artifactId: DeliveryArtifactId;
    reason: string;
  };
}

export interface DeliveryReceiptRecorded extends DomainEvent {
  type: 'delivery.receipt.recorded';
  payload: {
    receiptId: DeliveryReceiptId;
    artifactId: DeliveryArtifactId;
    status: ReceiptStatus;
  };
}

export interface DeliveryFailed extends DomainEvent {
  type: 'delivery.failed';
  payload: {
    artifactId: DeliveryArtifactId;
    channelId: DeliveryChannelId;
    error: string;
    attemptNumber: number;
  };
}

// --- Sprint 9.2 lifecycle events ---

export interface ArtifactGenerated extends DomainEvent {
  type: 'delivery.artifact.generated';
  payload: {
    artifactId: DeliveryArtifactId;
    generatedAt: string;
  };
}

export interface ArtifactQueued extends DomainEvent {
  type: 'delivery.artifact.queued';
  payload: {
    artifactId: DeliveryArtifactId;
    channelId: DeliveryChannelId;
    queuedAt: string;
  };
}

export interface ArtifactDelivered extends DomainEvent {
  type: 'delivery.artifact.lifecycle.delivered';
  payload: {
    artifactId: DeliveryArtifactId;
    channelId: DeliveryChannelId;
    recipientId: DeliveryRecipientId;
    deliveredAt: string;
  };
}

export interface ArtifactOpened extends DomainEvent {
  type: 'delivery.artifact.opened';
  payload: {
    artifactId: DeliveryArtifactId;
    recipientId: DeliveryRecipientId;
    openedAt: string;
  };
}

export interface ArtifactExpired extends DomainEvent {
  type: 'delivery.artifact.expired';
  payload: {
    artifactId: DeliveryArtifactId;
    expiredAt: string;
    reason?: string;
  };
}

export interface ArtifactRevoked extends DomainEvent {
  type: 'delivery.artifact.lifecycle.revoked';
  payload: {
    artifactId: DeliveryArtifactId;
    revokedAt: string;
    reason: string;
  };
}

// --- Union type ---
export type DeliveryDomainEvent =
  | DeliveryArtifactCreated
  | DeliveryArtifactCompiled
  | DeliveryArtifactDelivered
  | DeliveryArtifactRevoked
  | DeliveryReceiptRecorded
  | DeliveryFailed
  | ArtifactGenerated
  | ArtifactQueued
  | ArtifactDelivered
  | ArtifactOpened
  | ArtifactExpired
  | ArtifactRevoked;

// --- Sprint 9.1 factory functions ---

export function createArtifactCreatedEvent(
  artifactId: DeliveryArtifactId,
  type: ArtifactType,
  contentHash: ContentHash,
  templateId: string,
): DeliveryArtifactCreated {
  return {
    type: 'delivery.artifact.created',
    payload: { artifactId, type, contentHash, templateId },
    timestamp: new Date().toISOString(),
  };
}

export function createArtifactCompiledEvent(
  artifactId: DeliveryArtifactId,
  compiledAt?: string,
): DeliveryArtifactCompiled {
  return {
    type: 'delivery.artifact.compiled',
    payload: { artifactId, compiledAt: compiledAt ?? new Date().toISOString() },
    timestamp: new Date().toISOString(),
  };
}

export function createArtifactDeliveredEvent(
  artifactId: DeliveryArtifactId,
  channelId: DeliveryChannelId,
  recipientId: DeliveryRecipientId,
): DeliveryArtifactDelivered {
  return {
    type: 'delivery.artifact.delivered',
    payload: { artifactId, channelId, recipientId },
    timestamp: new Date().toISOString(),
  };
}

export function createArtifactRevokedEvent(
  artifactId: DeliveryArtifactId,
  reason: string,
): DeliveryArtifactRevoked {
  return {
    type: 'delivery.artifact.revoked',
    payload: { artifactId, reason },
    timestamp: new Date().toISOString(),
  };
}

export function createReceiptRecordedEvent(
  receiptId: DeliveryReceiptId,
  artifactId: DeliveryArtifactId,
  status: ReceiptStatus,
): DeliveryReceiptRecorded {
  return {
    type: 'delivery.receipt.recorded',
    payload: { receiptId, artifactId, status },
    timestamp: new Date().toISOString(),
  };
}

export function createDeliveryFailedEvent(
  artifactId: DeliveryArtifactId,
  channelId: DeliveryChannelId,
  error: string,
  attemptNumber: number,
): DeliveryFailed {
  return {
    type: 'delivery.failed',
    payload: { artifactId, channelId, error, attemptNumber },
    timestamp: new Date().toISOString(),
  };
}

// --- Sprint 9.2 lifecycle factory functions ---

export function createArtifactGeneratedEvent(
  artifactId: DeliveryArtifactId,
  generatedAt?: string,
): ArtifactGenerated {
  return {
    type: 'delivery.artifact.generated',
    payload: { artifactId, generatedAt: generatedAt ?? new Date().toISOString() },
    timestamp: new Date().toISOString(),
  };
}

export function createArtifactQueuedEvent(
  artifactId: DeliveryArtifactId,
  channelId: DeliveryChannelId,
  queuedAt?: string,
): ArtifactQueued {
  return {
    type: 'delivery.artifact.queued',
    payload: { artifactId, channelId, queuedAt: queuedAt ?? new Date().toISOString() },
    timestamp: new Date().toISOString(),
  };
}

export function createArtifactLifecycleDeliveredEvent(
  artifactId: DeliveryArtifactId,
  channelId: DeliveryChannelId,
  recipientId: DeliveryRecipientId,
  deliveredAt?: string,
): ArtifactDelivered {
  return {
    type: 'delivery.artifact.lifecycle.delivered',
    payload: { artifactId, channelId, recipientId, deliveredAt: deliveredAt ?? new Date().toISOString() },
    timestamp: new Date().toISOString(),
  };
}

export function createArtifactOpenedEvent(
  artifactId: DeliveryArtifactId,
  recipientId: DeliveryRecipientId,
  openedAt?: string,
): ArtifactOpened {
  return {
    type: 'delivery.artifact.opened',
    payload: { artifactId, recipientId, openedAt: openedAt ?? new Date().toISOString() },
    timestamp: new Date().toISOString(),
  };
}

export function createArtifactExpiredEvent(
  artifactId: DeliveryArtifactId,
  expiredAt?: string,
  reason?: string,
): ArtifactExpired {
  return {
    type: 'delivery.artifact.expired',
    payload: { artifactId, expiredAt: expiredAt ?? new Date().toISOString(), reason },
    timestamp: new Date().toISOString(),
  };
}

export function createArtifactLifecycleRevokedEvent(
  artifactId: DeliveryArtifactId,
  reason: string,
  revokedAt?: string,
): ArtifactRevoked {
  return {
    type: 'delivery.artifact.lifecycle.revoked',
    payload: { artifactId, reason, revokedAt: revokedAt ?? new Date().toISOString() },
    timestamp: new Date().toISOString(),
  };
}
