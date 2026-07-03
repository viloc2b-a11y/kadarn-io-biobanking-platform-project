// ==========================================================================
// Entity Tests — Delivery Domain
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { createDeliveryArtifactId, createDeliveryChannelId, createDeliveryRecipientId, createDeliveryPolicyId, createDeliveryTemplateId, createDeliveryReceiptId } from '../src/value-objects/ids.js';
import { createDeliveryArtifact, DeliveryArtifactSchema } from '../src/entities/delivery-artifact.js';
import { createDeliveryChannel, DeliveryChannelSchema } from '../src/entities/delivery-channel.js';
import { createDeliveryRecipient, DeliveryRecipientSchema } from '../src/entities/delivery-recipient.js';
import { createDeliveryPolicy, DeliveryPolicySchema } from '../src/entities/delivery-policy.js';
import { createDeliveryTemplate, bumpTemplateVersion, DeliveryTemplateSchema } from '../src/entities/delivery-template.js';
import { createDeliveryReceipt, DeliveryReceiptSchema } from '../src/entities/delivery-receipt.js';

// ==========================================================================
// DeliveryArtifact
// ==========================================================================

describe('DeliveryArtifact', () => {
  const validArtifact = () => ({
    id: createDeliveryArtifactId(),
    type: 'pdf' as const,
    contentHash: 'a'.repeat(64),
    templateId: createDeliveryTemplateId(),
    templateVersion: 1,
  });

  it('creates a valid draft artifact', () => {
    const artifact = createDeliveryArtifact(validArtifact());
    expect(artifact.status).toBe('draft');
    expect(artifact.id).toBeTypeOf('string');
    expect(DeliveryArtifactSchema.safeParse(artifact).success).toBe(true);
  });

  it('creates with explicit generated status', () => {
    const artifact = createDeliveryArtifact({ ...validArtifact(), status: 'generated' });
    expect(artifact.status).toBe('generated');
  });

  it('sets compiledAt to now by default', () => {
    const before = new Date().toISOString();
    const artifact = createDeliveryArtifact(validArtifact());
    const after = new Date().toISOString();
    expect(artifact.compiledAt >= before).toBe(true);
    expect(artifact.compiledAt <= after).toBe(true);
  });

  it('accepts custom metadata', () => {
    const artifact = createDeliveryArtifact({ ...validArtifact(), metadata: { source: 'manual' } });
    expect(artifact.metadata).toEqual({ source: 'manual' });
  });

  it('rejects missing required fields via schema', () => {
    const result = DeliveryArtifactSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid type via schema', () => {
    const result = DeliveryArtifactSchema.safeParse({ ...validArtifact(), type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid contentHash via schema', () => {
    const result = DeliveryArtifactSchema.safeParse({ ...validArtifact(), contentHash: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects negative templateVersion via schema', () => {
    const result = DeliveryArtifactSchema.safeParse({ ...validArtifact(), templateVersion: -1 });
    expect(result.success).toBe(false);
  });
});

// ==========================================================================
// DeliveryChannel
// ==========================================================================

describe('DeliveryChannel', () => {
  it('creates an active email channel', () => {
    const channel = createDeliveryChannel({
      id: createDeliveryChannelId(),
      channelType: 'email',
    });
    expect(channel.channelType).toBe('email');
    expect(channel.isActive).toBe(true);
    expect(channel.retryPolicy.maxAttempts).toBe(3);
    expect(channel.retryPolicy.backoffMs).toBe(1000);
    expect(DeliveryChannelSchema.safeParse(channel).success).toBe(true);
  });

  it('creates an inactive webhook channel', () => {
    const channel = createDeliveryChannel({
      id: createDeliveryChannelId(),
      channelType: 'webhook',
      isActive: false,
      config: {
        endpoint: 'https://example.com/hook',
        headers: { 'X-API-Key': 'secret' },
      },
    });
    expect(channel.isActive).toBe(false);
    expect(channel.config.endpoint).toBe('https://example.com/hook');
  });

  it('allows custom retry policy', () => {
    const channel = createDeliveryChannel({
      id: createDeliveryChannelId(),
      channelType: 'sftp',
      retryPolicy: { maxAttempts: 5, backoffMs: 5000 },
    });
    expect(channel.retryPolicy.maxAttempts).toBe(5);
    expect(channel.retryPolicy.backoffMs).toBe(5000);
  });

  it('rejects undefined channel type', () => {
    const result = DeliveryChannelSchema.safeParse({
      id: createDeliveryChannelId(),
      channelType: 'sms',
      isActive: true,
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================================================
// DeliveryRecipient
// ==========================================================================

describe('DeliveryRecipient', () => {
  it('creates a person recipient', () => {
    const recipient = createDeliveryRecipient({
      id: createDeliveryRecipientId(),
      recipientType: 'person',
      identifier: 'doctor@hospital.com',
      displayName: 'Dr. Smith',
    });
    expect(recipient.recipientType).toBe('person');
    expect(recipient.identifier).toBe('doctor@hospital.com');
    expect(recipient.displayName).toBe('Dr. Smith');
    expect(recipient.channelIds).toEqual([]);
    expect(DeliveryRecipientSchema.safeParse(recipient).success).toBe(true);
  });

  it('creates a system recipient with channel bindings', () => {
    const channelId = createDeliveryChannelId();
    const recipient = createDeliveryRecipient({
      id: createDeliveryRecipientId(),
      recipientType: 'system',
      identifier: 'https://sponsor.com/api/delivery',
      displayName: 'Sponsor API',
      channelIds: [channelId],
    });
    expect(recipient.recipientType).toBe('system');
    expect(recipient.channelIds).toHaveLength(1);
    expect(recipient.channelIds[0]).toBe(channelId);
  });

  it('creates an organization recipient', () => {
    const recipient = createDeliveryRecipient({
      id: createDeliveryRecipientId(),
      recipientType: 'organization',
      identifier: 'national-biobank',
      displayName: 'National Biobank',
    });
    expect(recipient.recipientType).toBe('organization');
  });

  it('rejects empty display name via schema', () => {
    const result = DeliveryRecipientSchema.safeParse({
      id: createDeliveryRecipientId(),
      recipientType: 'person',
      identifier: 'test@test.com',
      displayName: '',
      channelIds: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty identifier via schema', () => {
    const result = DeliveryRecipientSchema.safeParse({
      id: createDeliveryRecipientId(),
      recipientType: 'person',
      identifier: '',
      displayName: 'Test',
      channelIds: [],
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================================================
// DeliveryPolicy
// ==========================================================================

describe('DeliveryPolicy', () => {
  it('creates a policy with all fields', () => {
    const channelId = createDeliveryChannelId();
    const policy = createDeliveryPolicy({
      id: createDeliveryPolicyId(),
      name: 'Standard Evidence Delivery',
      requiredArtifactTypes: ['pdf', 'json'],
      allowedChannels: [channelId],
      requireApproval: true,
      maxRetries: 5,
      expiresAfterHours: 72,
    });
    expect(policy.name).toBe('Standard Evidence Delivery');
    expect(policy.requiredArtifactTypes).toEqual(['pdf', 'json']);
    expect(policy.allowedChannels).toEqual([channelId]);
    expect(policy.requireApproval).toBe(true);
    expect(policy.maxRetries).toBe(5);
    expect(policy.expiresAfterHours).toBe(72);
    expect(DeliveryPolicySchema.safeParse(policy).success).toBe(true);
  });

  it('creates a policy with defaults', () => {
    const policy = createDeliveryPolicy({
      id: createDeliveryPolicyId(),
      name: 'Minimal Policy',
    });
    expect(policy.requiredArtifactTypes).toEqual([]);
    expect(policy.allowedChannels).toEqual([]);
    expect(policy.requireApproval).toBe(false);
    expect(policy.maxRetries).toBe(3);
    expect(policy.expiresAfterHours).toBeNull();
  });

  it('rejects negative maxRetries via schema', () => {
    const result = DeliveryPolicySchema.safeParse({
      id: createDeliveryPolicyId(),
      name: 'Bad Policy',
      requiredArtifactTypes: [],
      allowedChannels: [],
      requireApproval: false,
      maxRetries: -1,
      expiresAfterHours: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects maxRetries > 10 via schema', () => {
    const result = DeliveryPolicySchema.safeParse({
      id: createDeliveryPolicyId(),
      name: 'Excessive Policy',
      requiredArtifactTypes: [],
      allowedChannels: [],
      requireApproval: false,
      maxRetries: 11,
      expiresAfterHours: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name via schema', () => {
    const result = DeliveryPolicySchema.safeParse({
      id: createDeliveryPolicyId(),
      name: '',
      requiredArtifactTypes: [],
      allowedChannels: [],
      requireApproval: false,
      maxRetries: 3,
      expiresAfterHours: null,
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================================================
// DeliveryTemplate (Sprint 9.5 — evolved: metadata, TemplateSchema, checksum)
// ==========================================================================

describe('DeliveryTemplate', () => {
  const baseTemplate = () => ({
    id: createDeliveryTemplateId(),
    name: 'Evidence Report v1',
    artifactType: 'pdf' as const,
    version: 1,
    metadata: {
      displayName: 'Evidence Report',
      description: 'Test template',
      category: 'report' as const,
    },
    schema: {
      version: '1.0.0',
      slots: [{ name: 'title', type: 'text' as const, required: true, description: 'Title' }],
    },
    renderEngine: 'handlebars',
  });

  it('creates a template with new fields (metadata, TemplateSchema, checksum)', () => {
    const template = createDeliveryTemplate(baseTemplate());
    expect(template.name).toBe('Evidence Report v1');
    expect(template.artifactType).toBe('pdf');
    expect(template.version).toBe(1);
    expect(template.renderEngine).toBe('handlebars');
    expect(template.metadata.category).toBe('report');
    expect(template.metadata.displayName).toBe('Evidence Report');
    expect(template.schema.slots).toHaveLength(1);
    expect(template.checksum).toMatch(/^[a-fA-F0-9]{64}$/);
    expect(DeliveryTemplateSchema.safeParse(template).success).toBe(true);
  });

  it('checksum is deterministic (same input → same checksum)', () => {
    const params = baseTemplate();
    const t1 = createDeliveryTemplate(params);
    const t2 = createDeliveryTemplate({ ...params, id: createDeliveryTemplateId() });
    expect(t1.checksum).toBe(t2.checksum);
  });

  it('checksum changes when content changes (different input → different checksum)', () => {
    const t1 = createDeliveryTemplate(baseTemplate());
    const t2 = createDeliveryTemplate({ ...baseTemplate(), id: createDeliveryTemplateId(), name: 'Different' });
    expect(t1.checksum).not.toBe(t2.checksum);
  });

  it('bumps template version and recalculates checksum', () => {
    const template = createDeliveryTemplate(baseTemplate());
    const bumped = bumpTemplateVersion(template);
    expect(bumped.version).toBe(2);
    expect(bumped.id).toBe(template.id);
    expect(bumped.name).toBe(template.name);
    expect(bumped.checksum).not.toBe(template.checksum);
  });

  it('updatedAt changes on version bump', async () => {
    const template = createDeliveryTemplate(baseTemplate());
    await new Promise(resolve => setTimeout(resolve, 2));
    const bumped = bumpTemplateVersion(template);
    expect(new Date(bumped.updatedAt).getTime()).toBeGreaterThan(new Date(template.updatedAt).getTime());
  });

  it('rejects version zero via schema', () => {
    const result = DeliveryTemplateSchema.safeParse({
      id: createDeliveryTemplateId(),
      name: 'Test',
      artifactType: 'pdf',
      version: 0,
      metadata: { displayName: 'Test', description: 'desc', category: 'report' },
      schema: { version: '1.0.0', slots: [{ name: 'x', type: 'text', required: true, description: 'x' }] },
      renderEngine: 'test',
      checksum: 'a'.repeat(64),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty renderEngine via schema', () => {
    const result = DeliveryTemplateSchema.safeParse({
      id: createDeliveryTemplateId(),
      name: 'Test',
      artifactType: 'pdf',
      version: 1,
      metadata: { displayName: 'Test', description: 'desc', category: 'report' },
      schema: { version: '1.0.0', slots: [{ name: 'x', type: 'text', required: true, description: 'x' }] },
      renderEngine: '',
      checksum: 'a'.repeat(64),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================================================
// DeliveryReceipt
// ==========================================================================

describe('DeliveryReceipt', () => {
  const validReceipt = () => ({
    id: createDeliveryReceiptId(),
    artifactId: createDeliveryArtifactId(),
    channelId: createDeliveryChannelId(),
    recipientId: createDeliveryRecipientId(),
  });

  it('creates a sent receipt', () => {
    const receipt = createDeliveryReceipt(validReceipt());
    expect(receipt.status).toBe('sent');
    expect(receipt.attemptNumber).toBe(1);
    expect(receipt.deliveredAt).toBeNull();
    expect(receipt.error).toBeNull();
    expect(DeliveryReceiptSchema.safeParse(receipt).success).toBe(true);
  });

  it('creates a delivered receipt', () => {
    const deliveredAt = new Date().toISOString();
    const receipt = createDeliveryReceipt({
      ...validReceipt(),
      status: 'delivered',
      deliveredAt,
      attemptNumber: 2,
    });
    expect(receipt.status).toBe('delivered');
    expect(receipt.deliveredAt).toBe(deliveredAt);
    expect(receipt.attemptNumber).toBe(2);
  });

  it('creates a failed receipt with error', () => {
    const receipt = createDeliveryReceipt({
      ...validReceipt(),
      status: 'failed',
      error: 'Connection timeout',
      attemptNumber: 3,
    });
    expect(receipt.status).toBe('failed');
    expect(receipt.error).toBe('Connection timeout');
    expect(receipt.attemptNumber).toBe(3);
  });

  it('rejects attempt 0 via schema', () => {
    const result = DeliveryReceiptSchema.safeParse({
      ...createDeliveryReceipt(validReceipt()),
      attemptNumber: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status via schema', () => {
    const result = DeliveryReceiptSchema.safeParse({
      ...createDeliveryReceipt(validReceipt()),
      status: 'unknown',
    });
    expect(result.success).toBe(false);
  });
});
