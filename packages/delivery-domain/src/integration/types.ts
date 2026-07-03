// ==========================================================================
// Integration Types — External consumer API contracts (KEMS-007)
// Sprint 9.11 — External Integration APIs
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ChannelType } from '../value-objects/channel-type.js';
import type { DeliveryArtifact } from '../entities/delivery-artifact.js';
import type { RenderedArtifact } from '../rendering/types.js';

// --- API Contract ---

export interface ApiEndpoint {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly path: string;
  readonly description: string;
  readonly auth: 'none' | 'bearer' | 'api-key' | 'basic';
  readonly request?: {
    query?: Record<string, { type: string; required: boolean; description: string }>;
    body?: Record<string, { type: string; required: boolean; description: string }>;
  };
  readonly responses: ApiResponse[];
}

export interface ApiResponse {
  status: number;
  description: string;
  body: Record<string, string>; // field → type
}

export interface ApiContract {
  readonly name: string;
  readonly version: string;
  readonly basePath: string;
  readonly description: string;
  readonly endpoints: ApiEndpoint[];
  readonly auth: 'none' | 'bearer' | 'api-key' | 'basic';
}

// --- Integration Adapter ---

export interface IntegrationAdapter {
  readonly name: string;
  readonly version: string;
  readonly contract: ApiContract;

  /** Transform a Kadarn DeliveryArtifact + RenderedArtifact into the external format */
  transformArtifact(artifact: DeliveryArtifact, rendered: RenderedArtifact): unknown;

  /** Parse an external request into a Kadarn DeliveryRequest-like shape */
  parseDeliveryRequest(externalPayload: unknown): DeliveryRequestLike;
}

// Simplified DeliveryRequest for external systems
export interface DeliveryRequestLike {
  viewId: string;
  templateName: string;
  artifactType: ArtifactType;
  recipients: { recipientId: string; channelType: ChannelType }[];
  metadata?: Record<string, unknown>;
}

// --- SDK ---

export interface DeliverySdkConfig {
  baseUrl: string;
  apiKey?: string;
  bearerToken?: string;
  timeout?: number; // ms
}

export interface SdkResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}
