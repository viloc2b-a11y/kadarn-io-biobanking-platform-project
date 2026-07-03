// ==========================================================================
// CTMS Integration Adapter — Clinical Trial Management System
// Sprint 9.11 — External Integration APIs
// Transforms Kadarn artifacts to CTMS evidence format.
// ==========================================================================

import type { IntegrationAdapter, DeliveryRequestLike, ApiContract } from './types.js';
import type { DeliveryArtifact } from '../entities/delivery-artifact.js';
import type { RenderedArtifact } from '../rendering/types.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ChannelType } from '../value-objects/channel-type.js';

export class CtmsAdapter implements IntegrationAdapter {
  readonly name = 'CTMS';
  readonly version = '1.0.0';

  readonly contract: ApiContract = {
    name: 'Kadarn CTMS Integration',
    version: '1.0.0',
    basePath: '/api/v1/integration/ctms',
    description: 'Clinical Trial Management System integration for evidence delivery',
    auth: 'bearer',
    endpoints: [
      {
        method: 'POST',
        path: '/evidence',
        description: 'Deliver evidence to CTMS',
        auth: 'bearer',
        request: {
          body: {
            studyId: { type: 'string', required: true, description: 'Clinical trial study ID' },
            siteId: { type: 'string', required: false, description: 'Clinical site ID' },
            evidenceType: { type: 'string', required: true, description: 'Type of evidence (capability, certification, audit)' },
            data: { type: 'object', required: true, description: 'Evidence payload' },
          },
        },
        responses: [
          { status: 200, description: 'Evidence delivered', body: { deliveryId: 'string', status: 'string' } },
          { status: 400, description: 'Invalid request', body: { error: 'string' } },
          { status: 401, description: 'Unauthorized', body: { error: 'string' } },
        ],
      },
      {
        method: 'GET',
        path: '/evidence/{deliveryId}',
        description: 'Check delivery status',
        auth: 'bearer',
        responses: [
          { status: 200, description: 'Delivery status', body: { deliveryId: 'string', status: 'string', deliveredAt: 'string' } },
          { status: 404, description: 'Delivery not found', body: { error: 'string' } },
        ],
      },
    ],
  };

  transformArtifact(artifact: DeliveryArtifact, rendered: RenderedArtifact): Record<string, unknown> {
    return {
      studyId: (artifact.metadata?.studyId as string) ?? 'unknown',
      siteId: (artifact.metadata?.siteId as string) ?? null,
      evidenceType: this.mapArtifactTypeToEvidenceType(artifact.type),
      artifactId: artifact.id,
      contentType: rendered.contentType,
      content: rendered.data,
      deliveredAt: rendered.renderedAt,
      contentHash: artifact.contentHash,
      templateVersion: artifact.templateVersion,
    };
  }

  parseDeliveryRequest(externalPayload: unknown): DeliveryRequestLike {
    const p = externalPayload as Record<string, unknown>;
    return {
      viewId: (p.studyId as string) ?? '',
      templateName: 'SponsorReport',
      artifactType: 'json' as ArtifactType,
      recipients: [{ recipientId: (p.siteId as string) ?? 'default', channelType: 'api' as ChannelType }],
      metadata: { studyId: p.studyId, siteId: p.siteId, evidenceType: p.evidenceType },
    };
  }

  private mapArtifactTypeToEvidenceType(type: string): string {
    const map: Record<string, string> = {
      pdf: 'document',
      json: 'structured-data',
      html: 'report',
      csv: 'tabular-data',
      zip: 'package',
    };
    return map[type] ?? 'unknown';
  }
}

export const ctmsAdapter = new CtmsAdapter();
