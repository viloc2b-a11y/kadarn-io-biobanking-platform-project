// ==========================================================================
// Delivery Engine Errors — typed domain errors
// Sprint 9.6 — Delivery Engine
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { PolicyDecision } from '../policies/types.js';

/** Base error for all delivery engine failures. */
export class DeliveryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DeliveryError';
  }
}

/** Delivery blocked by policy evaluation. */
export class DeliveryPolicyDeniedError extends DeliveryError {
  constructor(public readonly policyDecision: PolicyDecision) {
    super(`Delivery denied by policy: ${policyDecision.reason}`, 'POLICY_DENIED');
    this.name = 'DeliveryPolicyDeniedError';
  }
}

/** Requested template not found in registry. */
export class TemplateNotFoundError extends DeliveryError {
  constructor(name: string, version?: number) {
    const versionStr = version !== undefined ? ` v${version}` : '';
    super(`Template "${name}${versionStr}" not found`, 'TEMPLATE_NOT_FOUND');
    this.name = 'TemplateNotFoundError';
  }
}

/** No renderer registered for the requested artifact type. */
export class RendererNotFoundError extends DeliveryError {
  constructor(artifactType: ArtifactType) {
    super(`No renderer registered for artifact type "${artifactType}"`, 'RENDERER_NOT_FOUND');
    this.name = 'RendererNotFoundError';
  }
}

/** Queue operation failed. */
export class DeliveryQueueError extends DeliveryError {
  constructor(message: string) {
    super(message, 'QUEUE_ERROR');
    this.name = 'DeliveryQueueError';
  }
}
