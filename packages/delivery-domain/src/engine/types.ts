// ==========================================================================
// Delivery Engine Types — orchestrator contracts (KEMS-007)
// Sprint 9.6 — Delivery Engine
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ArtifactStatus } from '../value-objects/delivery-status.js';
import type { ViewData, RenderedArtifact } from '../rendering/types.js';
import type { PolicyActor, PolicyDecision } from '../policies/types.js';
import type { DeliveryTemplate } from '../entities/delivery-template.js';
import type { DeliveryArtifact } from '../entities/delivery-artifact.js';
import type { DomainEvent } from '../events/delivery-events.js';

/** Input to the Delivery Engine pipeline. */
export interface DeliveryRequest {
  /** The published view to render and deliver. */
  view: ViewData;
  /** Target artifact format. */
  targetArtifactType: ArtifactType;
  /** Template name — auto-selects by artifactType if not provided. */
  templateName?: string;
  /** Template version — uses latest if not provided. */
  templateVersion?: number;
  /** The actor requesting delivery (for policy evaluation). */
  actor: PolicyActor;
  /** Recipient IDs to deliver to (optional, required for auto-queue). */
  recipientIds?: string[];
  /** Additional metadata for the artifact. */
  metadata?: Record<string, unknown>;
}

/** Result of a delivery pipeline execution. */
export interface DeliveryResult {
  /** The created delivery artifact entity. */
  artifact: DeliveryArtifact;
  /** The rendered content. */
  rendered: RenderedArtifact;
  /** Policy evaluation result. */
  policyDecision: PolicyDecision;
  /** Template used for rendering. */
  template: DeliveryTemplate;
  /** Final artifact status after processing. */
  status: ArtifactStatus;
  /** Domain events emitted during processing. */
  events: DomainEvent[];
}

/** Engine configuration. */
export interface DeliveryEngineConfig {
  /** Automatically queue after rendering if recipients are provided. Default: true. */
  autoQueue?: boolean;
  /** Require approval before queuing. Default: false. */
  requireApproval?: boolean;
  /** Default template name to use when auto-selection fails. */
  defaultTemplate?: string;
}
