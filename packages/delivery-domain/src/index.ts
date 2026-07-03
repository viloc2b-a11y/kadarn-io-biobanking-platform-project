// ==========================================================================
// @kadarn/delivery-domain — barrel export
// ==========================================================================

// --- Value Objects ---
export {
  type DeliveryArtifactId,
  type DeliveryChannelId,
  type DeliveryRecipientId,
  type DeliveryPolicyId,
  type DeliveryTemplateId,
  type DeliveryReceiptId,
  createDeliveryArtifactId,
  createDeliveryChannelId,
  createDeliveryRecipientId,
  createDeliveryPolicyId,
  createDeliveryTemplateId,
  createDeliveryReceiptId,
} from './value-objects/ids.js';

export {
  type ArtifactType,
  ArtifactTypeSchema,
  isArtifactType,
  ARTIFACT_TYPES,
} from './value-objects/artifact-type.js';

export {
  type ChannelType,
  ChannelTypeSchema,
  isChannelType,
  CHANNEL_TYPES,
} from './value-objects/channel-type.js';

export {
  type RecipientType,
  RecipientTypeSchema,
  isRecipientType,
  RECIPIENT_TYPES,
} from './value-objects/recipient-type.js';

export {
  type ContentHash,
  ContentHashSchema,
  generateContentHash,
  validateContentHash,
  isContentHash,
} from './value-objects/content-hash.js';

export {
  type ArtifactStatus,
  ArtifactStatusSchema,
  ARTIFACT_STATUSES,
  isValidTransition,
  transitionStatus,
  isTerminalStatus,
  isArtifactStatus,
} from './value-objects/delivery-status.js';

export {
  type ReceiptStatus,
  ReceiptStatusSchema,
  RECEIPT_STATUSES,
  isValidReceiptTransition,
  transitionReceiptStatus,
  isTerminalReceiptStatus,
} from './value-objects/receipt-status.js';

// --- Entities ---
export {
  type DeliveryArtifact,
  DeliveryArtifactSchema,
  createDeliveryArtifact,
} from './entities/delivery-artifact.js';

export {
  type RetryPolicy,
  type ChannelConfig,
  type DeliveryChannel,
  DeliveryChannelSchema,
  createDeliveryChannel,
} from './entities/delivery-channel.js';

export {
  type DeliveryRecipient,
  DeliveryRecipientSchema,
  createDeliveryRecipient,
} from './entities/delivery-recipient.js';

export {
  type DeliveryPolicy,
  DeliveryPolicySchema,
  createDeliveryPolicy,
} from './entities/delivery-policy.js';

export {
  type DeliveryTemplate,
  DeliveryTemplateSchema,
  createDeliveryTemplate,
  bumpTemplateVersion,
  computeTemplateChecksum,
} from './entities/delivery-template.js';

export {
  type DeliveryReceipt,
  DeliveryReceiptSchema,
  createDeliveryReceipt,
} from './entities/delivery-receipt.js';

// --- Domain Events ---
export {
  type DomainEvent,
  type DeliveryArtifactCreated,
  type DeliveryArtifactCompiled,
  type DeliveryArtifactDelivered,
  type DeliveryArtifactRevoked,
  type DeliveryReceiptRecorded,
  type DeliveryFailed,
  type ArtifactGenerated,
  type ArtifactQueued,
  type ArtifactDelivered,
  type ArtifactOpened,
  type ArtifactExpired,
  type ArtifactRevoked,
  type DeliveryDomainEvent,
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
} from './events/delivery-events.js';

// --- Subscriptions ---
export * from './subscriptions/index.js';

// --- Repository Interfaces ---
export { type DeliveryArtifactRepository } from './repositories/artifact-repository.js';
export { type DeliveryChannelRepository } from './repositories/channel-repository.js';
export { type DeliveryRecipientRepository } from './repositories/recipient-repository.js';
export { type DeliveryTemplateRepository } from './repositories/template-repository.js';
export { type DeliveryReceiptRepository } from './repositories/receipt-repository.js';

// --- Policies (Sprint 9.3) ---
export * from './policies/index.js';

// --- Rendering (Sprint 9.4) ---
export * from './rendering/index.js';

// --- Templating (Sprint 9.5) ---
export * from './templating/index.js';

// --- Engine (Sprint 9.6) ---
export * from './engine/index.js';

// --- Distribution (Sprint 9.7) ---
export * from './distribution/index.js';

// --- Channels (Sprint 9.8) ---
export * from './channels/index.js';

// --- Audit (Sprint 9.9) ---
export * from './audit/index.js';

// --- Integration (Sprint 9.11) ---
export * from './integration/index.js';
