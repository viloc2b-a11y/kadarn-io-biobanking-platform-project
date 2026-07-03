// ==========================================================================
// Channel Adapters Tests — Sprint 9.8
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RestAdapter,
  WebhookAdapter,
  EmailAdapter,
  DashboardAdapter,
  DownloadAdapter,
  ApiAdapter,
  ChannelRegistry,
  createDeliveryResult,
  createDeliveryArtifact,
  createDeliveryRecipient,
  createDeliveryChannel,
  createDeliveryChannelId,
  createDeliveryArtifactId,
  createDeliveryRecipientId,
  ChannelDeliveryResultSchema,
  type ChannelAdapter,
  type ChannelTransport,
  type ChannelPayload,
  type ChannelDeliveryResult,
  type DeliveryArtifact,
  type DeliveryRecipient,
  type DeliveryChannel,
} from '../src/index.js';

// ==========================================================================
// Helpers
// ==========================================================================

function makeArtifact(overrides?: Partial<DeliveryArtifact>): DeliveryArtifact {
  // Use a static valid SHA-256 hash (generateContentHash is async)
  const staticHash = 'a'.repeat(64) as string;
  return createDeliveryArtifact({
    id: createDeliveryArtifactId(),
    type: 'pdf',
    contentHash: staticHash,
    templateId: crypto.randomUUID(),
    templateVersion: 1,
    status: 'generated',
    metadata: { test: true },
    ...overrides,
  });
}

function makeRecipient(overrides?: Partial<DeliveryRecipient>): DeliveryRecipient {
  return createDeliveryRecipient({
    id: createDeliveryRecipientId(),
    recipientType: 'person',
    identifier: 'test@kadarn.test',
    displayName: 'Test Recipient',
    channelIds: [],
    ...overrides,
  });
}

function makeChannel(overrides?: Partial<DeliveryChannel>): DeliveryChannel {
  return createDeliveryChannel({
    id: createDeliveryChannelId(),
    channelType: 'api',
    isActive: true,
    ...overrides,
  });
}

function validRestConfig(): Record<string, unknown> {
  return { endpoint: 'https://api.example.com/delivery', method: 'POST' };
}

function validWebhookConfig(): Record<string, unknown> {
  return { url: 'https://hooks.example.com/kadarn', secret: 'hmac-secret-123' };
}

function validEmailConfig(): Record<string, unknown> {
  return { from: 'sender@kadarn.test' };
}

function validApiConfig(): Record<string, unknown> {
  return { endpoint: 'https://api.example.com/v2/deliver', authType: 'bearer', credentials: { token: 'abc123' } };
}

// ==========================================================================
// ChannelAdapter interface compliance
// ==========================================================================

describe('ChannelAdapter interface', () => {
  const adapters: [string, ChannelAdapter][] = [
    ['RestAdapter', new RestAdapter()],
    ['WebhookAdapter', new WebhookAdapter()],
    ['EmailAdapter', new EmailAdapter()],
    ['DashboardAdapter', new DashboardAdapter()],
    ['DownloadAdapter', new DownloadAdapter()],
    ['ApiAdapter', new ApiAdapter()],
  ];

  for (const [name, adapter] of adapters) {
    it(`${name} implements deliver()`, () => {
      expect(typeof adapter.deliver).toBe('function');
    });

    it(`${name} implements validateConfig()`, () => {
      expect(typeof adapter.validateConfig).toBe('function');
    });
  }

  it('RestAdapter has channelType api', () => {
    expect(new RestAdapter().channelType).toBe('api');
  });

  it('WebhookAdapter has channelType webhook', () => {
    expect(new WebhookAdapter().channelType).toBe('webhook');
  });

  it('EmailAdapter has channelType email', () => {
    expect(new EmailAdapter().channelType).toBe('email');
  });

  it('DashboardAdapter has channelType portal', () => {
    expect(new DashboardAdapter().channelType).toBe('portal');
  });

  it('DownloadAdapter has channelType s3', () => {
    expect(new DownloadAdapter().channelType).toBe('s3');
  });

  it('ApiAdapter has channelType api', () => {
    expect(new ApiAdapter().channelType).toBe('api');
  });
});

// ==========================================================================
// createDeliveryResult factory
// ==========================================================================

describe('createDeliveryResult', () => {
  it('creates a valid result', () => {
    const result = createDeliveryResult({
      success: true,
      receiptId: crypto.randomUUID(),
      channelType: 'api',
      artifactId: crypto.randomUUID(),
      recipientId: crypto.randomUUID(),
    });
    expect(ChannelDeliveryResultSchema.safeParse(result).success).toBe(true);
    expect(result.success).toBe(true);
    expect(result.deliveredAt).toBeTruthy();
  });

  it('creates a failure result with error', () => {
    const result = createDeliveryResult({
      success: false,
      receiptId: crypto.randomUUID(),
      channelType: 'email',
      artifactId: crypto.randomUUID(),
      recipientId: crypto.randomUUID(),
      error: 'Connection refused',
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection refused');
  });

  it('preserves custom metadata', () => {
    const result = createDeliveryResult({
      success: true,
      receiptId: crypto.randomUUID(),
      channelType: 'webhook',
      artifactId: crypto.randomUUID(),
      recipientId: crypto.randomUUID(),
      metadata: { attempt: 3, duration: 250 },
    });
    expect(result.metadata).toEqual({ attempt: 3, duration: 250 });
  });

  it('defaults deliveredAt to now', () => {
    const before = new Date().toISOString();
    const result = createDeliveryResult({
      success: true,
      receiptId: crypto.randomUUID(),
      channelType: 'api',
      artifactId: crypto.randomUUID(),
      recipientId: crypto.randomUUID(),
    });
    expect(result.deliveredAt >= before).toBe(true);
  });
});

// ==========================================================================
// RestAdapter
// ==========================================================================

describe('RestAdapter', () => {
  let adapter: RestAdapter;
  let artifact: DeliveryArtifact;
  let recipient: DeliveryRecipient;
  let channel: DeliveryChannel;

  beforeEach(() => {
    adapter = new RestAdapter();
    artifact = makeArtifact();
    recipient = makeRecipient();
    channel = makeChannel({ channelType: 'api', config: { endpoint: 'https://api.example.com/delivery', method: 'POST' } });
  });

  it('deliver returns success result with receiptId', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.success).toBe(true);
    expect(result.receiptId).toBeTruthy();
    expect(result.channelType).toBe('api');
  });

  it('deliver result has correct artifactId and recipientId', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.artifactId).toBe(artifact.id);
    expect(result.recipientId).toBe(recipient.id);
  });

  it('default transport returns 200', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.success).toBe(true);
    expect(result.metadata?.statusCode).toBe(200);
  });

  it('validateConfig accepts valid REST config', () => {
    expect(adapter.validateConfig({ endpoint: 'https://api.example.com', method: 'POST' })).toBe(true);
  });

  it('validateConfig accepts valid GET config', () => {
    expect(adapter.validateConfig({ endpoint: 'https://api.example.com', method: 'GET' })).toBe(true);
  });

  it('validateConfig rejects invalid URL', () => {
    expect(adapter.validateConfig({ endpoint: 'not-a-url' })).toBe(false);
  });

  it('validateConfig rejects missing endpoint', () => {
    expect(adapter.validateConfig({ method: 'POST' })).toBe(false);
  });

  it('validateConfig rejects invalid method', () => {
    expect(adapter.validateConfig({ endpoint: 'https://api.example.com', method: 'INVALID' })).toBe(false);
  });

  it('validateConfig accepts endpoint only (no method)', () => {
    expect(adapter.validateConfig({ endpoint: 'https://api.example.com' })).toBe(true);
  });

  it('custom transport function is called with correct payload', async () => {
    let capturedPayload: ChannelPayload | null = null;
    const customTransport: ChannelTransport = async (payload) => {
      capturedPayload = payload;
      return { success: true, statusCode: 201, body: 'created' };
    };

    const customAdapter = new RestAdapter(customTransport);
    const result = await customAdapter.deliver(artifact, recipient, channel);

    expect(capturedPayload).toBeTruthy();
    expect(capturedPayload!.artifactId).toBe(artifact.id);
    expect(capturedPayload!.artifactType).toBe('pdf');
    expect(result.metadata?.statusCode).toBe(201);
  });

  it('handles transport failure', async () => {
    const failingTransport: ChannelTransport = async () => ({
      success: false,
      statusCode: 500,
      error: 'Internal Server Error',
    });

    const failingAdapter = new RestAdapter(failingTransport);
    const result = await failingAdapter.deliver(artifact, recipient, channel);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal Server Error');
  });
});

// ==========================================================================
// WebhookAdapter
// ==========================================================================

describe('WebhookAdapter', () => {
  let adapter: WebhookAdapter;
  let artifact: DeliveryArtifact;
  let recipient: DeliveryRecipient;
  let channel: DeliveryChannel;

  beforeEach(() => {
    adapter = new WebhookAdapter();
    artifact = makeArtifact();
    recipient = makeRecipient({ identifier: 'https://hooks.example.com/kadarn' });
    channel = makeChannel({
      channelType: 'webhook',
      config: { url: 'https://hooks.example.com/kadarn', secret: 'hmac-secret' },
    });
  });

  it('deliver returns success result', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.success).toBe(true);
    expect(result.channelType).toBe('webhook');
  });

  it('default transport returns 200 acknowledged', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.metadata?.statusCode).toBe(200);
    expect(result.metadata?.webhookEvent).toBe('delivery.artifact.ready');
  });

  it('validateConfig requires url and secret', () => {
    expect(adapter.validateConfig({ url: 'https://hooks.example.com', secret: 'abc' })).toBe(true);
  });

  it('validateConfig rejects missing url', () => {
    expect(adapter.validateConfig({ secret: 'abc' })).toBe(false);
  });

  it('validateConfig rejects missing secret', () => {
    expect(adapter.validateConfig({ url: 'https://hooks.example.com' })).toBe(false);
  });

  it('validateConfig rejects empty secret', () => {
    expect(adapter.validateConfig({ url: 'https://hooks.example.com', secret: '' })).toBe(false);
  });

  it('validateConfig rejects invalid URL', () => {
    expect(adapter.validateConfig({ url: 'not-a-url', secret: 'abc' })).toBe(false);
  });

  it('custom transport receives webhook payload data', async () => {
    let captured: ChannelPayload | null = null;
    const transport: ChannelTransport = async (p) => { captured = p; return { success: true, statusCode: 200 }; };
    const a = new WebhookAdapter(transport);
    await a.deliver(artifact, recipient, channel);
    expect(captured!.metadata?.webhookEvent).toBe('delivery.artifact.ready');
    expect(captured!.metadata?.signatureHeader).toBe('X-Kadarn-Signature');
  });
});

// ==========================================================================
// EmailAdapter
// ==========================================================================

describe('EmailAdapter', () => {
  let adapter: EmailAdapter;
  let artifact: DeliveryArtifact;
  let recipient: DeliveryRecipient;
  let channel: DeliveryChannel;

  beforeEach(() => {
    adapter = new EmailAdapter();
    artifact = makeArtifact();
    recipient = makeRecipient({ identifier: 'doctor@hospital.test' });
    channel = makeChannel({
      channelType: 'email',
      config: { from: 'delivery@kadarn.test' },
    });
  });

  it('deliver returns success with messageId', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.success).toBe(true);
    expect(result.metadata?.messageId).toBeTruthy();
    expect(typeof result.metadata?.messageId).toBe('string');
  });

  it('email metadata includes to address from recipient.identifier', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.metadata?.to).toBe('doctor@hospital.test');
  });

  it('validateConfig requires valid from email', () => {
    expect(adapter.validateConfig({ from: 'sender@test.com' })).toBe(true);
  });

  it('validateConfig rejects missing from', () => {
    expect(adapter.validateConfig({})).toBe(false);
  });

  it('validateConfig rejects invalid email format', () => {
    expect(adapter.validateConfig({ from: 'not-an-email' })).toBe(false);
  });

  it('validateConfig rejects empty string', () => {
    expect(adapter.validateConfig({ from: '' })).toBe(false);
  });

  it('statusCode in metadata reflects transport response', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.metadata?.statusCode).toBe(250);
  });

  it('custom transport passes through messageId', async () => {
    const transport: ChannelTransport = async () => ({
      success: true,
      statusCode: 250,
      body: 'OK',
      metadata: { messageId: 'custom-msg-001' },
    });
    const a = new EmailAdapter(transport);
    const result = await a.deliver(artifact, recipient, channel);
    expect(result.metadata?.messageId).toBeDefined();
  });
});

// ==========================================================================
// DashboardAdapter
// ==========================================================================

describe('DashboardAdapter', () => {
  let adapter: DashboardAdapter;
  let artifact: DeliveryArtifact;
  let recipient: DeliveryRecipient;
  let channel: DeliveryChannel;

  beforeEach(() => {
    adapter = new DashboardAdapter();
    artifact = makeArtifact();
    recipient = makeRecipient({ displayName: 'Dashboard User' });
    channel = makeChannel({ channelType: 'portal', config: {} });
  });

  it('deliver returns success with dashboardPath', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.success).toBe(true);
    expect(result.metadata?.dashboardPath).toBeTruthy();
    expect(typeof result.metadata?.dashboardPath).toBe('string');
  });

  it('dashboard path includes artifactId', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.metadata?.dashboardPath).toContain(artifact.id);
  });

  it('validateConfig always valid even with empty config', () => {
    expect(adapter.validateConfig({})).toBe(true);
  });

  it('validateConfig always valid with arbitrary config', () => {
    expect(adapter.validateConfig({ anything: 'goes' })).toBe(true);
  });

  it('result metadata includes notificationSent', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.metadata?.notificationSent).toBe(true);
  });

  it('respects notificationEnabled false from channel config', async () => {
    const ch = makeChannel({ channelType: 'portal', config: { notificationEnabled: false } });
    const result = await adapter.deliver(artifact, recipient, ch);
    expect(result.metadata?.notificationSent).toBe(false);
  });

  it('respects custom workspaceId', async () => {
    const ch = makeChannel({ channelType: 'portal', config: { workspaceId: 'ws-custom' } });
    const result = await adapter.deliver(artifact, recipient, ch);
    expect(result.metadata?.workspaceId).toBe('ws-custom');
  });
});

// ==========================================================================
// DownloadAdapter
// ==========================================================================

describe('DownloadAdapter', () => {
  let adapter: DownloadAdapter;
  let artifact: DeliveryArtifact;
  let recipient: DeliveryRecipient;
  let channel: DeliveryChannel;

  beforeEach(() => {
    adapter = new DownloadAdapter();
    artifact = makeArtifact({ type: 'pdf' });
    recipient = makeRecipient();
    channel = makeChannel({ channelType: 's3', config: {} });
  });

  it('deliver generates download URL', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.metadata?.downloadUrl).toBeTruthy();
    expect(typeof result.metadata?.downloadUrl).toBe('string');
  });

  it('download URL includes artifactId and token', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    const url = result.metadata?.downloadUrl as string;
    expect(url).toContain(artifact.id);
    expect(url).toContain('token=');
  });

  it('expiry is approximately 3600 seconds from now', async () => {
    const before = Date.now() + 3600 * 1000;
    const result = await adapter.deliver(artifact, recipient, channel);
    const expiresAt = new Date(result.metadata?.expiresAt as string).getTime();
    const after = Date.now() + 3600 * 1000;
    // Allow 5 seconds tolerance
    expect(Math.abs(expiresAt - before)).toBeLessThan(5000);
    expect(Math.abs(expiresAt - after)).toBeLessThan(5000);
  });

  it('fileName includes artifactId and type', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    const fileName = result.metadata?.fileName as string;
    expect(fileName).toContain(artifact.id);
    expect(fileName).toContain('pdf');
  });

  it('validateConfig accepts empty config', () => {
    expect(adapter.validateConfig({})).toBe(true);
  });

  it('validateConfig with custom expirySeconds accepts valid value', () => {
    expect(adapter.validateConfig({ expirySeconds: 1800 })).toBe(true);
  });

  it('validateConfig rejects negative expirySeconds', () => {
    expect(adapter.validateConfig({ expirySeconds: -1 })).toBe(false);
  });

  it('validateConfig rejects zero expirySeconds', () => {
    expect(adapter.validateConfig({ expirySeconds: 0 })).toBe(false);
  });

  it('respects custom expirySeconds from channel config', async () => {
    const ch = makeChannel({ channelType: 's3', config: { expirySeconds: 600 } });
    const result = await adapter.deliver(artifact, recipient, ch);
    expect(result.metadata?.expirySeconds).toBe(600);
  });

  it('uses default bucket name when none configured', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.metadata?.bucket).toBe('kadarn-delivery');
  });
});

// ==========================================================================
// ApiAdapter
// ==========================================================================

describe('ApiAdapter', () => {
  let adapter: ApiAdapter;
  let artifact: DeliveryArtifact;
  let recipient: DeliveryRecipient;
  let channel: DeliveryChannel;

  beforeEach(() => {
    adapter = new ApiAdapter();
    artifact = makeArtifact();
    recipient = makeRecipient();
    channel = makeChannel({
      channelType: 'api',
      config: { endpoint: 'https://api.example.com/v2/deliver', authType: 'bearer', credentials: { token: 'abc123' } },
    });
  });

  it('deliver returns success', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.success).toBe(true);
    expect(result.channelType).toBe('api');
  });

  it('default config works (no auth)', async () => {
    const ch = makeChannel({
      channelType: 'api',
      config: { endpoint: 'https://api.example.com/v2/deliver', authType: 'none' },
    });
    const result = await adapter.deliver(artifact, recipient, ch);
    expect(result.success).toBe(true);
  });

  it('validateConfig requires endpoint', () => {
    expect(adapter.validateConfig({ endpoint: 'https://api.example.com' })).toBe(true);
  });

  it('validateConfig rejects missing endpoint', () => {
    expect(adapter.validateConfig({ authType: 'none' })).toBe(false);
  });

  it('validateConfig rejects invalid URL', () => {
    expect(adapter.validateConfig({ endpoint: 'not-a-url' })).toBe(false);
  });

  it('validateConfig with authType bearer requires credentials', () => {
    expect(adapter.validateConfig({ endpoint: 'https://api.example.com', authType: 'bearer' })).toBe(false);
  });

  it('validateConfig with authType bearer and token passes', () => {
    expect(adapter.validateConfig({
      endpoint: 'https://api.example.com',
      authType: 'bearer',
      credentials: { token: 'abc' },
    })).toBe(true);
  });

  it('validateConfig with authType api-key requires key', () => {
    expect(adapter.validateConfig({
      endpoint: 'https://api.example.com',
      authType: 'api-key',
      credentials: { key: 'apikey123' },
    })).toBe(true);
  });

  it('validateConfig rejects unknown authType', () => {
    expect(adapter.validateConfig({
      endpoint: 'https://api.example.com',
      authType: 'oauth2',
    })).toBe(false);
  });

  it('metadata includes authType', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.metadata?.authType).toBe('bearer');
  });

  it('metadata includes endpoint', async () => {
    const result = await adapter.deliver(artifact, recipient, channel);
    expect(result.metadata?.endpoint).toBe('https://api.example.com/v2/deliver');
  });
});

// ==========================================================================
// ChannelRegistry
// ==========================================================================

describe('ChannelRegistry', () => {
  let registry: ChannelRegistry;

  beforeEach(() => {
    registry = new ChannelRegistry();
  });

  it('register adapter and retrieve by type', () => {
    const adapter = new WebhookAdapter();
    registry.register(adapter);
    expect(registry.getAdapter('webhook')).toBe(adapter);
  });

  it('register duplicate type throws', () => {
    registry.register(new WebhookAdapter());
    expect(() => registry.register(new WebhookAdapter())).toThrow(
      "Channel adapter already registered for type 'webhook'",
    );
  });

  it('hasAdapter returns correct boolean', () => {
    expect(registry.hasAdapter('email')).toBe(false);
    registry.register(new EmailAdapter());
    expect(registry.hasAdapter('email')).toBe(true);
  });

  it('listChannelTypes returns registered types', () => {
    registry.register(new EmailAdapter());
    registry.register(new WebhookAdapter());
    const types = registry.listChannelTypes();
    expect(types).toContain('email');
    expect(types).toContain('webhook');
    expect(types.length).toBe(2);
  });

  it('deliver through registry returns success', async () => {
    registry.register(new RestAdapter());
    const art = makeArtifact();
    const rec = makeRecipient();
    const ch = makeChannel({ channelType: 'api', config: { endpoint: 'https://api.example.com' } });
    const result = await registry.deliver('api', art, rec, ch);
    expect(result.success).toBe(true);
    expect(result.channelType).toBe('api');
  });

  it('deliver through unregistered type throws', async () => {
    const art = makeArtifact();
    const rec = makeRecipient();
    const ch = makeChannel({ channelType: 'webhook' });
    await expect(registry.deliver('webhook', art, rec, ch)).rejects.toThrow(
      "No adapter registered for channel type 'webhook'",
    );
  });

  it('size reflects registered count', () => {
    expect(registry.size).toBe(0);
    registry.register(new EmailAdapter());
    expect(registry.size).toBe(1);
    registry.register(new WebhookAdapter());
    expect(registry.size).toBe(2);
  });

  it('clear removes all adapters', () => {
    registry.register(new EmailAdapter());
    registry.register(new WebhookAdapter());
    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.listChannelTypes().length).toBe(0);
  });

  it('getAdapter returns undefined for unregistered type', () => {
    expect(registry.getAdapter('email')).toBeUndefined();
  });

  it('full registry with 5 unique channel types', () => {
    registry.register(new EmailAdapter());
    registry.register(new WebhookAdapter());
    registry.register(new DashboardAdapter());
    registry.register(new DownloadAdapter());
    registry.register(new RestAdapter()); // 'api' — covers REST/API
    expect(registry.size).toBe(5);
    expect(registry.hasAdapter('email')).toBe(true);
    expect(registry.hasAdapter('webhook')).toBe(true);
    expect(registry.hasAdapter('portal')).toBe(true);
    expect(registry.hasAdapter('s3')).toBe(true);
    expect(registry.hasAdapter('api')).toBe(true);
  });
});

// ==========================================================================
// Integration
// ==========================================================================

describe('Integration — all adapters', () => {
  let registry: ChannelRegistry;
  let artifact: DeliveryArtifact;
  let recipient: DeliveryRecipient;

  beforeEach(() => {
    registry = new ChannelRegistry();
    registry.register(new EmailAdapter());
    registry.register(new WebhookAdapter());
    registry.register(new DashboardAdapter());
    registry.register(new DownloadAdapter());
    registry.register(new RestAdapter()); // covers 'api'

    artifact = makeArtifact({ type: 'json' });
    recipient = makeRecipient({ identifier: 'receiver@kadarn.test' });
  });

  it('deliver same artifact through email channel', async () => {
    const ch = makeChannel({ channelType: 'email', config: { from: 'test@kadarn.test' } });
    const result = await registry.deliver('email', artifact, recipient, ch);
    expect(result.success).toBe(true);
    expect(result.artifactId).toBe(artifact.id);
  });

  it('deliver same artifact through webhook channel', async () => {
    const ch = makeChannel({ channelType: 'webhook', config: { url: 'https://hooks.test/k', secret: 's' } });
    const result = await registry.deliver('webhook', artifact, recipient, ch);
    expect(result.success).toBe(true);
    expect(result.artifactId).toBe(artifact.id);
  });

  it('deliver same artifact through portal channel', async () => {
    const ch = makeChannel({ channelType: 'portal', config: {} });
    const result = await registry.deliver('portal', artifact, recipient, ch);
    expect(result.success).toBe(true);
  });

  it('deliver same artifact through s3 channel', async () => {
    const ch = makeChannel({ channelType: 's3', config: {} });
    const result = await registry.deliver('s3', artifact, recipient, ch);
    expect(result.success).toBe(true);
  });

  it('deliver same artifact through api channel', async () => {
    const ch = makeChannel({ channelType: 'api', config: { endpoint: 'https://api.test' } });
    const result = await registry.deliver('api', artifact, recipient, ch);
    expect(result.success).toBe(true);
  });

  it('each channel produces unique receiptId', async () => {
    const results: ChannelDeliveryResult[] = [];
    for (const ct of registry.listChannelTypes()) {
      const ch = makeChannelFor(ct, artifact, recipient);
      const result = await registry.deliver(ct, artifact, recipient, ch);
      results.push(result);
    }
    const receiptIds = results.map(r => r.receiptId);
    const uniqueIds = new Set(receiptIds);
    expect(uniqueIds.size).toBe(receiptIds.length);
  });

  it('all receipts have correct structure', async () => {
    for (const ct of registry.listChannelTypes()) {
      const ch = makeChannelFor(ct, artifact, recipient);
      const result = await registry.deliver(ct, artifact, recipient, ch);
      expect(ChannelDeliveryResultSchema.safeParse(result).success).toBe(true);
      expect(result.artifactId).toBe(artifact.id);
      expect(result.recipientId).toBe(recipient.id);
      expect(result.deliveredAt).toBeTruthy();
    }
  });
});

// ==========================================================================
// Helper for integration tests
// ==========================================================================

function makeChannelFor(
  channelType: string,
  artifact: DeliveryArtifact,
  recipient: DeliveryRecipient,
): DeliveryChannel {
  switch (channelType) {
    case 'email':
      return makeChannel({ channelType: 'email', config: { from: 'test@kadarn.test' } });
    case 'webhook':
      return makeChannel({ channelType: 'webhook', config: { url: 'https://hooks.test/kadarn', secret: 'secret-key' } });
    case 'portal':
      return makeChannel({ channelType: 'portal', config: {} });
    case 's3':
      return makeChannel({ channelType: 's3', config: {} });
    case 'api':
      return makeChannel({ channelType: 'api', config: { endpoint: 'https://api.test/deliver' } });
    default:
      return makeChannel({ channelType: 'api', config: { endpoint: 'https://api.test/deliver' } });
  }
}
