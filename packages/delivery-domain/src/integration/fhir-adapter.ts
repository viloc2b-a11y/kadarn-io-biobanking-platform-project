// ==========================================================================
// FHIR R4 Integration Adapter — HL7 FHIR Evidence resource
// Sprint 9.11 — External Integration APIs
// Transforms Kadarn artifacts to FHIR R4 Evidence resources.
// ==========================================================================

import type { IntegrationAdapter, DeliveryRequestLike, ApiContract } from './types.js';
import type { DeliveryArtifact } from '../entities/delivery-artifact.js';
import type { RenderedArtifact } from '../rendering/types.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ChannelType } from '../value-objects/channel-type.js';

export class FhirAdapter implements IntegrationAdapter {
  readonly name = 'FHIR R4';
  readonly version = '4.0.1';

  readonly contract: ApiContract = {
    name: 'Kadarn FHIR R4 Integration',
    version: '4.0.1',
    basePath: '/api/v1/integration/fhir',
    description: 'HL7 FHIR R4 integration for evidence delivery as FHIR resources',
    auth: 'bearer',
    endpoints: [
      {
        method: 'POST',
        path: '/Evidence',
        description: 'Create a FHIR Evidence resource from a delivery artifact',
        auth: 'bearer',
        request: {
          body: {
            artifactId: { type: 'string', required: true, description: 'Delivery artifact ID' },
            patientId: { type: 'string', required: false, description: 'FHIR Patient reference' },
            organizationId: { type: 'string', required: false, description: 'FHIR Organization reference' },
          },
        },
        responses: [
          { status: 201, description: 'Evidence resource created', body: { resourceType: 'string', id: 'string', status: 'string' } },
          { status: 400, description: 'Invalid request', body: { error: 'string' } },
        ],
      },
      {
        method: 'GET',
        path: '/Evidence/{id}',
        description: 'Retrieve a FHIR Evidence resource',
        auth: 'bearer',
        responses: [
          { status: 200, description: 'Evidence resource', body: { resourceType: 'string', id: 'string', status: 'string' } },
          { status: 404, description: 'Not found', body: { error: 'string' } },
        ],
      },
      {
        method: 'POST',
        path: '/Bundle',
        description: 'Create a FHIR Bundle containing multiple evidence resources',
        auth: 'bearer',
        responses: [
          { status: 201, description: 'Bundle created', body: { resourceType: 'string', id: 'string', type: 'string' } },
        ],
      },
    ],
  };

  transformArtifact(artifact: DeliveryArtifact, rendered: RenderedArtifact): Record<string, unknown> {
    return {
      resourceType: 'Evidence',
      id: artifact.id,
      status: this.mapStatusToFhirStatus(artifact.status),
      title: (artifact.metadata?.title as string) ?? 'Delivery Artifact',
      publisher: 'Kadarn Delivery Engine',
      date: rendered.renderedAt,
      description: `Evidence artifact of type ${artifact.type}, template v${artifact.templateVersion}`,
      relatedArtifact: [
        {
          type: 'derived-from',
          url: `https://kadarn.test/artifacts/${artifact.id}`,
        },
      ],
      extension: [
        {
          url: 'https://kadarn.test/fhir/StructureDefinition/content-hash',
          valueString: artifact.contentHash,
        },
        {
          url: 'https://kadarn.test/fhir/StructureDefinition/template-version',
          valueInteger: artifact.templateVersion,
        },
      ],
    };
  }

  parseDeliveryRequest(externalPayload: unknown): DeliveryRequestLike {
    const p = externalPayload as Record<string, unknown>;
    return {
      viewId: (p.artifactId as string) ?? '',
      templateName: 'EvidencePack',
      artifactType: 'json' as ArtifactType,
      recipients: [{ recipientId: (p.organizationId as string) ?? 'default', channelType: 'api' as ChannelType }],
      metadata: { patientId: p.patientId, organizationId: p.organizationId },
    };
  }

  private mapStatusToFhirStatus(status: string): string {
    const map: Record<string, string> = {
      draft: 'draft',
      generated: 'active',
      queued: 'active',
      delivered: 'active',
      acknowledged: 'active',
      expired: 'retired',
      revoked: 'withdrawn',
    };
    return map[status] ?? 'unknown';
  }
}

export const fhirAdapter = new FhirAdapter();
