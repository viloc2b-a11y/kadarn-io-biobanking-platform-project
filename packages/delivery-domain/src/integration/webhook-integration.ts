// ==========================================================================
// Webhook Integration — Outgoing webhook subscription management
// Sprint 9.11 — External Integration APIs
// ==========================================================================

import type { IntegrationAdapter, DeliveryRequestLike, ApiContract } from './types.js';
import type { DeliveryArtifact } from '../entities/delivery-artifact.js';
import type { RenderedArtifact } from '../rendering/types.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ChannelType } from '../value-objects/channel-type.js';

export class WebhookIntegration implements IntegrationAdapter {
  readonly name = 'Webhook';
  readonly version = '1.0.0';

  readonly contract: ApiContract = {
    name: 'Kadarn Webhook Integration',
    version: '1.0.0',
    basePath: '/api/v1/integration/webhooks',
    description: 'Manage outgoing webhooks for delivery events',
    auth: 'api-key',
    endpoints: [
      {
        method: 'POST',
        path: '/subscriptions',
        description: 'Register a new webhook subscription',
        auth: 'api-key',
        request: {
          body: {
            url: { type: 'string', required: true, description: 'Webhook URL' },
            events: { type: 'string[]', required: true, description: 'Events to subscribe to' },
            secret: { type: 'string', required: false, description: 'HMAC signing secret' },
          },
        },
        responses: [
          { status: 201, description: 'Subscription created', body: { subscriptionId: 'string', status: 'string' } },
          { status: 400, description: 'Invalid request', body: { error: 'string' } },
        ],
      },
      {
        method: 'GET',
        path: '/subscriptions',
        description: 'List all webhook subscriptions',
        auth: 'api-key',
        responses: [
          { status: 200, description: 'Subscriptions list', body: { subscriptions: 'array', total: 'number' } },
        ],
      },
      {
        method: 'DELETE',
        path: '/subscriptions/{subscriptionId}',
        description: 'Remove a webhook subscription',
        auth: 'api-key',
        responses: [
          { status: 204, description: 'Subscription removed', body: {} },
          { status: 404, description: 'Not found', body: { error: 'string' } },
        ],
      },
    ],
  };

  transformArtifact(artifact: DeliveryArtifact, rendered: RenderedArtifact): unknown {
    return {
      event: 'delivery.succeeded',
      timestamp: new Date().toISOString(),
      data: {
        artifactId: artifact.id,
        artifactType: artifact.type,
        templateName: artifact.metadata?.templateName ?? 'unknown',
        contentHash: artifact.contentHash,
        status: artifact.status,
        renderedAt: rendered.renderedAt,
        contentType: rendered.contentType,
        content: rendered.data,
      },
      signature: 'HMAC-SHA256', // placeholder — actual signing at transport layer
    };
  }

  parseDeliveryRequest(externalPayload: unknown): DeliveryRequestLike {
    const p = externalPayload as Record<string, unknown>;
    return {
      viewId: (p.viewId as string) ?? '',
      templateName: (p.templateName as string) ?? 'SponsorReport',
      artifactType: (p.artifactType as ArtifactType) ?? 'json',
      recipients: [{ recipientId: 'webhook-subscriber', channelType: 'webhook' as ChannelType }],
    };
  }
}

export const webhookIntegration = new WebhookIntegration();
