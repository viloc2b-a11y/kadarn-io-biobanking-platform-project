// ==========================================================================
// REST API Contract — Public Delivery REST API definition
// Sprint 9.11 — External Integration APIs
// ==========================================================================

import type { ApiContract, ApiEndpoint } from './types.js';

export class RestApiContract implements ApiContract {
  readonly name = 'Kadarn Delivery REST API';
  readonly version = '1.0.0';
  readonly basePath = '/api/v1/delivery';
  readonly description = 'Public REST API for Kadarn Evidence Delivery';
  readonly auth: 'bearer' = 'bearer';

  readonly endpoints: ApiEndpoint[] = [
    {
      method: 'POST',
      path: '/request',
      description: 'Request a new evidence delivery',
      auth: 'bearer',
      request: {
        body: {
          viewId: { type: 'string', required: true, description: 'Published View ID' },
          templateName: { type: 'string', required: true, description: 'Template name' },
          artifactType: { type: 'string', required: true, description: 'pdf | json | html | csv | zip' },
          recipients: { type: 'array', required: true, description: 'List of recipient + channel pairs' },
          metadata: { type: 'object', required: false, description: 'Additional metadata' },
        },
      },
      responses: [
        { status: 202, description: 'Delivery accepted', body: { deliveryId: 'string', status: 'string', estimatedAt: 'string' } },
        { status: 400, description: 'Invalid request', body: { error: 'string' } },
        { status: 401, description: 'Unauthorized', body: { error: 'string' } },
        { status: 403, description: 'Forbidden by policy', body: { error: 'string', policyDecision: 'object' } },
      ],
    },
    {
      method: 'GET',
      path: '/status/{deliveryId}',
      description: 'Get delivery status',
      auth: 'bearer',
      responses: [
        { status: 200, description: 'Delivery status', body: { deliveryId: 'string', artifactId: 'string', status: 'string', events: 'array' } },
        { status: 404, description: 'Not found', body: { error: 'string' } },
      ],
    },
    {
      method: 'GET',
      path: '/artifacts',
      description: 'List delivery artifacts',
      auth: 'bearer',
      request: {
        query: {
          status: { type: 'string', required: false, description: 'Filter by status' },
          templateName: { type: 'string', required: false, description: 'Filter by template' },
          from: { type: 'string', required: false, description: 'ISO timestamp' },
          to: { type: 'string', required: false, description: 'ISO timestamp' },
          limit: { type: 'number', required: false, description: 'Max results (default 20)' },
        },
      },
      responses: [
        { status: 200, description: 'Artifact list', body: { artifacts: 'array', total: 'number', limit: 'number' } },
      ],
    },
    {
      method: 'GET',
      path: '/artifacts/{artifactId}',
      description: 'Get artifact details',
      auth: 'bearer',
      responses: [
        { status: 200, description: 'Artifact details', body: { artifact: 'object', rendered: 'object', audit: 'array' } },
        { status: 404, description: 'Not found', body: { error: 'string' } },
      ],
    },
  ];
}

export const deliveryRestApi = new RestApiContract();
