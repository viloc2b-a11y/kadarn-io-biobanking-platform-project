// ==========================================================================
// Sprint 9.11 — External Integration APIs — Contract Tests
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  CtmsAdapter, ctmsAdapter,
  FhirAdapter, fhirAdapter,
  WebhookIntegration, webhookIntegration,
  RestApiContract, deliveryRestApi,
  DeliverySdk,
  ApiContractValidator,
} from '../src/integration/index.js';
import type { IntegrationAdapter, ApiContract } from '../src/integration/types.js';
import { createDeliveryArtifact } from '../src/entities/delivery-artifact.js';
import type { DeliveryArtifact } from '../src/entities/delivery-artifact.js';
import type { RenderedArtifact } from '../src/rendering/types.js';

// --- Helpers ---

function makeArtifact(overrides: Partial<DeliveryArtifact> = {}): DeliveryArtifact {
  return createDeliveryArtifact({
    id: '00000000-0000-4000-a000-000000000001' as never,
    type: 'pdf',
    contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    templateId: '00000000-0000-4000-a000-000000000002',
    templateVersion: 1,
    status: 'delivered',
    metadata: { studyId: 'STUDY-001', siteId: 'SITE-001', title: 'Test Report' },
    ...overrides,
  });
}

function makeRendered(overrides: Partial<RenderedArtifact> = {}): RenderedArtifact {
  return {
    contentType: 'application/pdf',
    data: 'test-content',
    artifactType: 'pdf',
    renderedAt: '2026-07-03T12:00:00.000Z',
    viewId: 'view-001',
    metadata: {},
    ...overrides,
  };
}

function validContract(overrides: Partial<ApiContract> = {}): ApiContract {
  return {
    name: 'Test API',
    version: '1.0.0',
    basePath: '/api/v1/test',
    description: 'Test contract',
    auth: 'bearer',
    endpoints: [{
      method: 'GET',
      path: '/items',
      description: 'List items',
      auth: 'bearer',
      responses: [{ status: 200, description: 'OK', body: { items: 'array' } }],
    }],
    ...overrides,
  };
}

// ==========================================================================
// ApiContractValidator
// ==========================================================================

describe('ApiContractValidator — validateContract', () => {
  it('valid contract passes validation', () => {
    const result = ApiContractValidator.validateContract(validContract());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('missing name → invalid', () => {
    const result = ApiContractValidator.validateContract(validContract({ name: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Contract name is required');
  });

  it('missing version → invalid', () => {
    const result = ApiContractValidator.validateContract(validContract({ version: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Contract version is required');
  });

  it('missing basePath → invalid', () => {
    const result = ApiContractValidator.validateContract(validContract({ basePath: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Base path is required');
  });

  it('base path without leading / → invalid', () => {
    const result = ApiContractValidator.validateContract(validContract({ basePath: 'api/v1' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Base path must start with /');
  });

  it('no endpoints → invalid', () => {
    const result = ApiContractValidator.validateContract(validContract({ endpoints: [] }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one endpoint is required');
  });

  it('invalid HTTP method → invalid', () => {
    const c = validContract({
      endpoints: [{ method: 'PATCH' as 'GET', path: '/x', description: '', auth: 'bearer', responses: [{ status: 200, description: '', body: {} }] }],
    });
    const result = ApiContractValidator.validateContract(c);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid HTTP method'))).toBe(true);
  });

  it('invalid auth type → invalid', () => {
    const c = validContract({
      endpoints: [{ method: 'GET', path: '/x', description: '', auth: 'oauth2' as 'bearer', responses: [{ status: 200, description: '', body: {} }] }],
    });
    const result = ApiContractValidator.validateContract(c);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid auth type'))).toBe(true);
  });

  it('no responses → invalid', () => {
    const c = validContract({ endpoints: [{ method: 'GET', path: '/x', description: '', auth: 'bearer', responses: [] }] });
    const result = ApiContractValidator.validateContract(c);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('at least one response required'))).toBe(true);
  });
});

describe('ApiContractValidator — detectBreakingChanges', () => {
  const old = validContract({ endpoints: [
    { method: 'GET', path: '/items', description: '', auth: 'bearer', request: { body: { name: { type: 'string', required: true, description: '' } } }, responses: [{ status: 200, description: '', body: {} }] },
    { method: 'POST', path: '/items', description: '', auth: 'bearer', responses: [{ status: 201, description: '', body: {} }] },
  ]});

  it('removed endpoint → breaking', () => {
    const neo = validContract({ endpoints: [old.endpoints[0]] });
    const changes = ApiContractValidator.detectBreakingChanges(old, neo);
    expect(changes).toContain('BREAKING: Endpoint POST /items removed');
  });

  it('auth change → breaking', () => {
    const neo = validContract({ endpoints: [
      { ...old.endpoints[0], auth: 'api-key' as const },
      old.endpoints[1],
    ]});
    const changes = ApiContractValidator.detectBreakingChanges(old, neo);
    expect(changes.some(c => c.includes('Auth changed'))).toBe(true);
  });

  it('required field removed → breaking', () => {
    const neo = validContract({ endpoints: [
      { ...old.endpoints[0], request: { body: { other: { type: 'string', required: true, description: '' } } } },
      old.endpoints[1],
    ]});
    const changes = ApiContractValidator.detectBreakingChanges(old, neo);
    expect(changes.some(c => c.includes("Required field 'name' removed"))).toBe(true);
  });

  it('same contract → no breaking changes', () => {
    const changes = ApiContractValidator.detectBreakingChanges(old, old);
    expect(changes).toHaveLength(0);
  });
});

// ==========================================================================
// CTMS Adapter
// ==========================================================================

describe('CTMS Adapter', () => {
  it('contract has correct name, version, basePath', () => {
    expect(ctmsAdapter.contract.name).toBe('Kadarn CTMS Integration');
    expect(ctmsAdapter.contract.version).toBe('1.0.0');
    expect(ctmsAdapter.contract.basePath).toBe('/api/v1/integration/ctms');
  });

  it('contract has 2 endpoints', () => {
    expect(ctmsAdapter.contract.endpoints).toHaveLength(2);
  });

  it('transformArtifact produces valid CTMS format', () => {
    const artifact = makeArtifact();
    const rendered = makeRendered();
    const result = ctmsAdapter.transformArtifact(artifact, rendered) as Record<string, unknown>;
    expect(result.studyId).toBe('STUDY-001');
    expect(result.siteId).toBe('SITE-001');
    expect(result.artifactId).toBe(artifact.id);
    expect(result.contentType).toBe('application/pdf');
    expect(result.contentHash).toBe(artifact.contentHash);
    expect(result.templateVersion).toBe(1);
  });

  it('transformArtifact includes studyId from metadata', () => {
    const artifact = makeArtifact({ metadata: { studyId: 'STUDY-42' } });
    const result = ctmsAdapter.transformArtifact(artifact, makeRendered()) as Record<string, unknown>;
    expect(result.studyId).toBe('STUDY-42');
  });

  it('transformArtifact maps artifact types to evidence types correctly', () => {
    const validTypes = ['pdf', 'json', 'html', 'csv', 'zip'] as const;
    const expected = ['document', 'structured-data', 'report', 'tabular-data', 'package'];
    validTypes.forEach((t, i) => {
      const art = makeArtifact({ type: t });
      const result = ctmsAdapter.transformArtifact(art, makeRendered()) as Record<string, unknown>;
      expect(result.evidenceType).toBe(expected[i]);
    });
  });

  it('parseDeliveryRequest extracts studyId from payload', () => {
    const req = ctmsAdapter.parseDeliveryRequest({ studyId: 'STUDY-99' });
    expect(req.viewId).toBe('STUDY-99');
  });
});

// ==========================================================================
// FHIR Adapter
// ==========================================================================

describe('FHIR Adapter', () => {
  it('contract has correct name and version (FHIR R4 4.0.1)', () => {
    expect(fhirAdapter.contract.name).toBe('Kadarn FHIR R4 Integration');
    expect(fhirAdapter.contract.version).toBe('4.0.1');
  });

  it('contract has 3 endpoints', () => {
    expect(fhirAdapter.contract.endpoints).toHaveLength(3);
  });

  it('transformArtifact produces valid FHIR Evidence resource', () => {
    const artifact = makeArtifact({ metadata: { title: 'My Evidence' } });
    const result = fhirAdapter.transformArtifact(artifact, makeRendered()) as Record<string, unknown>;
    expect(result.resourceType).toBe('Evidence');
    expect(result.id).toBe(artifact.id);
    expect(result.status).toBe('active'); // delivered → active
    expect(result.title).toBe('My Evidence');
    expect(result.publisher).toBe('Kadarn Delivery Engine');
    expect(result.date).toBe('2026-07-03T12:00:00.000Z');
  });

  it('transformArtifact includes FHIR extensions (content-hash, template-version)', () => {
    const result = fhirAdapter.transformArtifact(makeArtifact(), makeRendered()) as Record<string, unknown>;
    const extensions = result.extension as Array<Record<string, unknown>>;
    expect(extensions).toHaveLength(2);
    expect(extensions[0].url).toContain('content-hash');
    expect(extensions[1].url).toContain('template-version');
  });

  it('transformArtifact maps status to FHIR status correctly', () => {
    const statusMap: Record<string, string> = {
      draft: 'draft', generated: 'active', queued: 'active', delivered: 'active',
      acknowledged: 'active', expired: 'retired', revoked: 'withdrawn',
    };
    for (const [status, fhirStatus] of Object.entries(statusMap)) {
      const art = makeArtifact({ status: status as 'delivered' });
      const result = fhirAdapter.transformArtifact(art, makeRendered()) as Record<string, unknown>;
      expect(result.status).toBe(fhirStatus);
    }
  });

  it('parseDeliveryRequest extracts artifactId from payload', () => {
    const req = fhirAdapter.parseDeliveryRequest({ artifactId: 'art-1' });
    expect(req.viewId).toBe('art-1');
  });
});

// ==========================================================================
// Webhook Integration
// ==========================================================================

describe('Webhook Integration', () => {
  it('contract has correct name and 3 endpoints', () => {
    expect(webhookIntegration.contract.name).toBe('Kadarn Webhook Integration');
    expect(webhookIntegration.contract.endpoints).toHaveLength(3);
  });

  it('contract auth is api-key', () => {
    expect(webhookIntegration.contract.auth).toBe('api-key');
  });

  it('transformArtifact produces valid webhook payload', () => {
    const result = webhookIntegration.transformArtifact(makeArtifact(), makeRendered()) as Record<string, unknown>;
    expect(result.event).toBe('delivery.succeeded');
    expect(result.timestamp).toBeDefined();
    expect(result.signature).toBe('HMAC-SHA256');
    const data = result.data as Record<string, unknown>;
    expect(data.artifactId).toBe(makeArtifact().id);
    expect(data.artifactType).toBe('pdf');
    expect(data.contentHash).toBeDefined();
  });

  it('webhook payload includes event, timestamp, data, signature fields', () => {
    const result = webhookIntegration.transformArtifact(makeArtifact(), makeRendered()) as Record<string, unknown>;
    expect(result).toHaveProperty('event');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('signature');
  });
});

// ==========================================================================
// REST API Contract
// ==========================================================================

describe('REST API Contract', () => {
  it('REST API contract has 4 endpoints', () => {
    expect(deliveryRestApi.endpoints).toHaveLength(4);
  });

  it('POST /request has required body fields', () => {
    const ep = deliveryRestApi.endpoints.find(e => e.path === '/request' && e.method === 'POST')!;
    expect(ep).toBeDefined();
    expect(ep.request?.body?.viewId.required).toBe(true);
    expect(ep.request?.body?.templateName.required).toBe(true);
    expect(ep.request?.body?.artifactType.required).toBe(true);
    expect(ep.request?.body?.recipients.required).toBe(true);
  });

  it('GET /status/{deliveryId} has 200 and 404 responses', () => {
    const ep = deliveryRestApi.endpoints.find(e => e.path === '/status/{deliveryId}')!;
    expect(ep.responses.map(r => r.status)).toContain(200);
    expect(ep.responses.map(r => r.status)).toContain(404);
  });

  it('GET /artifacts has query parameters', () => {
    const ep = deliveryRestApi.endpoints.find(e => e.path === '/artifacts')!;
    expect(ep.request?.query?.status).toBeDefined();
    expect(ep.request?.query?.limit).toBeDefined();
    expect(ep.request?.query?.from).toBeDefined();
    expect(ep.request?.query?.to).toBeDefined();
  });

  it('All REST endpoints require bearer auth', () => {
    for (const ep of deliveryRestApi.endpoints) {
      expect(ep.auth).toBe('bearer');
    }
  });

  it('contract validator confirms REST API is valid', () => {
    const result = ApiContractValidator.validateContract(deliveryRestApi);
    expect(result.valid).toBe(true);
  });
});

// ==========================================================================
// DeliverySdk
// ==========================================================================

describe('DeliverySdk', () => {
  it('constructor accepts config with defaults', () => {
    const sdk = new DeliverySdk({ baseUrl: 'https://test.kadarn.io' });
    const config = sdk.getConfig();
    expect(config.baseUrl).toBe('https://test.kadarn.io');
    expect(config.timeout).toBe(30000);
  });

  it('constructor overrides timeout', () => {
    const sdk = new DeliverySdk({ baseUrl: 'https://test.kadarn.io', timeout: 5000 });
    expect(sdk.getConfig().timeout).toBe(5000);
  });

  it('requestDelivery returns simulated response', async () => {
    const sdk = new DeliverySdk({ baseUrl: 'https://test.kadarn.io' });
    const resp = await sdk.requestDelivery({
      viewId: 'v1', templateName: 'SponsorReport', artifactType: 'pdf',
      recipients: [{ recipientId: 'r1', channelType: 'email' }],
    });
    expect(resp.success).toBe(true);
    expect(resp.data?.deliveryId).toBeDefined();
    expect(resp.data?.status).toBe('accepted');
    expect(resp.statusCode).toBe(200);
  });

  it('getDeliveryStatus returns simulated response', async () => {
    const sdk = new DeliverySdk({ baseUrl: 'https://test.kadarn.io' });
    const resp = await sdk.getDeliveryStatus('dl-1');
    expect(resp.success).toBe(true);
    expect(resp.data?.deliveryId).toBeDefined();
  });

  it('listArtifacts returns simulated response', async () => {
    const sdk = new DeliverySdk({ baseUrl: 'https://test.kadarn.io' });
    const resp = await sdk.listArtifacts({ status: 'delivered' });
    expect(resp.success).toBe(true);
    expect(resp.data?.total).toBe(0);
  });

  it('getArtifact returns simulated response', async () => {
    const sdk = new DeliverySdk({ baseUrl: 'https://test.kadarn.io' });
    const resp = await sdk.getArtifact('art-1');
    expect(resp.success).toBe(true);
    expect(resp.data?.artifact).toBeDefined();
  });

  it('SDK response has correct structure', async () => {
    const sdk = new DeliverySdk({ baseUrl: 'https://test.kadarn.io' });
    const resp = await sdk.requestDelivery({
      viewId: 'v1', templateName: 't1', artifactType: 'json',
      recipients: [{ recipientId: 'r1', channelType: 'email' }],
    });
    expect(resp).toHaveProperty('success');
    expect(resp).toHaveProperty('data');
    expect(resp).toHaveProperty('statusCode');
    expect(resp.error).toBeUndefined();
  });
});

// ==========================================================================
// Cross-adapter contract compliance
// ==========================================================================

describe('Cross-adapter contract compliance', () => {
  const adapters: IntegrationAdapter[] = [ctmsAdapter, fhirAdapter, webhookIntegration];

  it('all 3 adapters implement IntegrationAdapter', () => {
    for (const adapter of adapters) {
      expect(adapter.name).toBeDefined();
      expect(adapter.version).toBeDefined();
      expect(adapter.contract).toBeDefined();
      expect(typeof adapter.transformArtifact).toBe('function');
      expect(typeof adapter.parseDeliveryRequest).toBe('function');
    }
  });

  it('all 3 adapters have valid contracts via ApiContractValidator', () => {
    for (const adapter of adapters) {
      const result = ApiContractValidator.validateContract(adapter.contract);
      expect(result.valid).toBe(true);
    }
  });

  it('all 3 contracts have unique base paths', () => {
    const paths = adapters.map(a => a.contract.basePath);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

// ==========================================================================
// Endpoint count
// ==========================================================================

describe('Endpoint count across integrations', () => {
  it('CTMS: 2 endpoints', () => {
    expect(ctmsAdapter.contract.endpoints).toHaveLength(2);
  });
  it('FHIR: 3 endpoints', () => {
    expect(fhirAdapter.contract.endpoints).toHaveLength(3);
  });
  it('Webhook: 3 endpoints', () => {
    expect(webhookIntegration.contract.endpoints).toHaveLength(3);
  });
  it('REST API: 4 endpoints', () => {
    expect(deliveryRestApi.endpoints).toHaveLength(4);
  });
  it('Total: 12 endpoints across all integrations', () => {
    const total =
      ctmsAdapter.contract.endpoints.length +
      fhirAdapter.contract.endpoints.length +
      webhookIntegration.contract.endpoints.length +
      deliveryRestApi.endpoints.length;
    expect(total).toBe(12);
  });
});
