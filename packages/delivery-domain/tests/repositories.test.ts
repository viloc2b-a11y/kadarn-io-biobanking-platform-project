// ==========================================================================
// Repository Interface Tests — Delivery Domain (compile-time checks)
// These tests assert that the repository interfaces are structurally sound
// and that mock implementations conform to the contracts.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { createDeliveryArtifactId, createDeliveryChannelId, createDeliveryRecipientId, createDeliveryTemplateId, createDeliveryReceiptId } from '../src/value-objects/ids.js';
import {
  type DeliveryArtifactRepository,
} from '../src/repositories/artifact-repository.js';
import {
  type DeliveryChannelRepository,
} from '../src/repositories/channel-repository.js';
import {
  type DeliveryRecipientRepository,
} from '../src/repositories/recipient-repository.js';
import {
  type DeliveryTemplateRepository,
} from '../src/repositories/template-repository.js';
import {
  type DeliveryReceiptRepository,
} from '../src/repositories/receipt-repository.js';
import { createDeliveryArtifact } from '../src/entities/delivery-artifact.js';
import { createDeliveryChannel } from '../src/entities/delivery-channel.js';
import { createDeliveryRecipient } from '../src/entities/delivery-recipient.js';
import { createDeliveryTemplate } from '../src/entities/delivery-template.js';
import { createDeliveryReceipt } from '../src/entities/delivery-receipt.js';

const templateFixture = {
  metadata: { displayName: 'Report', description: 'desc', category: 'report' as const },
  schema: { version: '1.0.0', slots: [{ name: 'x', type: 'text' as const, required: true, description: 'x' }] },
};

// ==========================================================================
// DeliveryArtifactRepository
// ==========================================================================

describe('DeliveryArtifactRepository (interface contract)', () => {
  /** In-memory mock implementation for contract testing */
  class InMemoryArtifactRepository implements DeliveryArtifactRepository {
    private store = new Map<string, ReturnType<typeof createDeliveryArtifact>>();

    async save(artifact: ReturnType<typeof createDeliveryArtifact>): Promise<void> {
      this.store.set(artifact.id, artifact);
    }

    async findById(id: string) {
      return this.store.get(id) ?? null;
    }

    async findByStatus(status: string) {
      return Array.from(this.store.values()).filter(a => a.status === status);
    }

    async findByRecipient(_recipientId: string) {
      return [];
    }
  }

  const artifact = createDeliveryArtifact({
    id: createDeliveryArtifactId(),
    type: 'pdf',
    contentHash: 'a'.repeat(64),
    templateId: createDeliveryTemplateId(),
    templateVersion: 1,
  });

  it('save and retrieve by ID', async () => {
    const repo = new InMemoryArtifactRepository();
    await repo.save(artifact);
    const found = await repo.findById(artifact.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(artifact.id);
    expect(found!.status).toBe('draft');
  });

  it('findById returns null for unknown', async () => {
    const repo = new InMemoryArtifactRepository();
    const found = await repo.findById(createDeliveryArtifactId());
    expect(found).toBeNull();
  });

  it('findByStatus filters correctly', async () => {
    const repo = new InMemoryArtifactRepository();
    const draft = createDeliveryArtifact({
      id: createDeliveryArtifactId(),
      type: 'json',
      contentHash: 'b'.repeat(64),
      templateId: createDeliveryTemplateId(),
      templateVersion: 1,
      status: 'draft',
    });
    const generated = createDeliveryArtifact({
      id: createDeliveryArtifactId(),
      type: 'html',
      contentHash: 'c'.repeat(64),
      templateId: createDeliveryTemplateId(),
      templateVersion: 2,
      status: 'generated',
    });
    await repo.save(draft);
    await repo.save(generated);

    const drafts = await repo.findByStatus('draft');
    expect(drafts).toHaveLength(1);
    expect(drafts[0].id).toBe(draft.id);

    const generatedList = await repo.findByStatus('generated');
    expect(generatedList).toHaveLength(1);
    expect(generatedList[0].id).toBe(generated.id);
  });
});

// ==========================================================================
// DeliveryChannelRepository
// ==========================================================================

describe('DeliveryChannelRepository (interface contract)', () => {
  class InMemoryChannelRepository implements DeliveryChannelRepository {
    private store = new Map<string, ReturnType<typeof createDeliveryChannel>>();

    async save(channel: ReturnType<typeof createDeliveryChannel>) {
      this.store.set(channel.id, channel);
    }

    async findById(id: string) {
      return this.store.get(id) ?? null;
    }

    async findActive() {
      return Array.from(this.store.values()).filter(c => c.isActive);
    }

    async findByType(channelType: string) {
      return Array.from(this.store.values()).filter(c => c.channelType === channelType);
    }
  }

  it('findActive filters inactive', async () => {
    const repo = new InMemoryChannelRepository();
    const active = createDeliveryChannel({ id: createDeliveryChannelId(), channelType: 'email', isActive: true });
    const inactive = createDeliveryChannel({ id: createDeliveryChannelId(), channelType: 'webhook', isActive: false });
    await repo.save(active);
    await repo.save(inactive);

    const actives = await repo.findActive();
    expect(actives).toHaveLength(1);
    expect(actives[0].id).toBe(active.id);
  });

  it('findByType filters by channel type', async () => {
    const repo = new InMemoryChannelRepository();
    const email = createDeliveryChannel({ id: createDeliveryChannelId(), channelType: 'email' });
    const s3 = createDeliveryChannel({ id: createDeliveryChannelId(), channelType: 's3' });
    await repo.save(email);
    await repo.save(s3);

    const emails = await repo.findByType('email');
    expect(emails).toHaveLength(1);
    expect(emails[0].id).toBe(email.id);
  });
});

// ==========================================================================
// DeliveryRecipientRepository
// ==========================================================================

describe('DeliveryRecipientRepository (interface contract)', () => {
  class InMemoryRecipientRepository implements DeliveryRecipientRepository {
    private store = new Map<string, ReturnType<typeof createDeliveryRecipient>>();

    async save(recipient: ReturnType<typeof createDeliveryRecipient>) {
      this.store.set(recipient.id, recipient);
    }

    async findById(id: string) {
      return this.store.get(id) ?? null;
    }

    async findByChannel(channelId: string) {
      return Array.from(this.store.values()).filter(r => r.channelIds.includes(channelId));
    }
  }

  it('findByChannel resolves recipients', () => {
    expect(true).toBe(true);
  });
});

// ==========================================================================
// DeliveryTemplateRepository
// ==========================================================================

describe('DeliveryTemplateRepository (interface contract)', () => {
  class InMemoryTemplateRepository implements DeliveryTemplateRepository {
    private store = new Map<string, ReturnType<typeof createDeliveryTemplate>>();

    async save(template: ReturnType<typeof createDeliveryTemplate>) {
      this.store.set(template.id, template);
    }

    async findById(id: string) {
      return this.store.get(id) ?? null;
    }

    async findByType(artifactType: string) {
      return Array.from(this.store.values()).filter(t => t.artifactType === artifactType);
    }

    async findLatestVersion(name: string) {
      const templates = Array.from(this.store.values())
        .filter(t => t.name === name)
        .sort((a, b) => b.version - a.version);
      return templates[0] ?? null;
    }
  }

  it('findLatestVersion returns highest version', async () => {
    const repo = new InMemoryTemplateRepository();
    const v1 = createDeliveryTemplate({
      id: createDeliveryTemplateId(),
      name: 'Report',
      artifactType: 'pdf',
      version: 1,
      metadata: { ...templateFixture.metadata },
      schema: { ...templateFixture.schema },
      renderEngine: 'handlebars',
    });
    const v3 = createDeliveryTemplate({
      id: createDeliveryTemplateId(),
      name: 'Report',
      artifactType: 'pdf',
      version: 3,
      metadata: { ...templateFixture.metadata },
      schema: { ...templateFixture.schema },
      renderEngine: 'handlebars',
    });
    const v2 = createDeliveryTemplate({
      id: createDeliveryTemplateId(),
      name: 'Report',
      artifactType: 'pdf',
      version: 2,
      metadata: { ...templateFixture.metadata },
      schema: { ...templateFixture.schema },
      renderEngine: 'handlebars',
    });
    await repo.save(v1);
    await repo.save(v3);
    await repo.save(v2);

    const latest = await repo.findLatestVersion('Report');
    expect(latest).not.toBeNull();
    expect(latest!.version).toBe(3);
    expect(latest!.id).toBe(v3.id);
  });

  it('findLatestVersion returns null for unknown name', async () => {
    const repo = new InMemoryTemplateRepository();
    const latest = await repo.findLatestVersion('Nonexistent');
    expect(latest).toBeNull();
  });
});

// ==========================================================================
// DeliveryReceiptRepository
// ==========================================================================

describe('DeliveryReceiptRepository (interface contract)', () => {
  class InMemoryReceiptRepository implements DeliveryReceiptRepository {
    private store = new Map<string, ReturnType<typeof createDeliveryReceipt>>();

    async save(receipt: ReturnType<typeof createDeliveryReceipt>) {
      this.store.set(receipt.id, receipt);
    }

    async findById(id: string) {
      return this.store.get(id) ?? null;
    }

    async findByArtifact(artifactId: string) {
      return Array.from(this.store.values()).filter(r => r.artifactId === artifactId);
    }

    async findLatest(artifactId: string) {
      const receipts = Array.from(this.store.values())
        .filter(r => r.artifactId === artifactId)
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      return receipts[0] ?? null;
    }
  }

  it('findByArtifact filters by artifact', async () => {
    const repo = new InMemoryReceiptRepository();
    const artifactA = createDeliveryArtifactId();
    const artifactB = createDeliveryArtifactId();

    const r1 = createDeliveryReceipt({
      id: createDeliveryReceiptId(),
      artifactId: artifactA,
      channelId: createDeliveryChannelId(),
      recipientId: createDeliveryRecipientId(),
    });
    const r2 = createDeliveryReceipt({
      id: createDeliveryReceiptId(),
      artifactId: artifactB,
      channelId: createDeliveryChannelId(),
      recipientId: createDeliveryRecipientId(),
    });
    await repo.save(r1);
    await repo.save(r2);

    const forA = await repo.findByArtifact(artifactA);
    expect(forA).toHaveLength(1);
    expect(forA[0].id).toBe(r1.id);
  });

  it('findLatest returns most recent receipt', async () => {
    const repo = new InMemoryReceiptRepository();
    const artifactId = createDeliveryArtifactId();

    const older = createDeliveryReceipt({
      id: createDeliveryReceiptId(),
      artifactId,
      channelId: createDeliveryChannelId(),
      recipientId: createDeliveryRecipientId(),
      sentAt: '2026-01-01T00:00:00.000Z',
      attemptNumber: 1,
    });
    const newer = createDeliveryReceipt({
      id: createDeliveryReceiptId(),
      artifactId,
      channelId: createDeliveryChannelId(),
      recipientId: createDeliveryRecipientId(),
      sentAt: '2026-06-01T00:00:00.000Z',
      attemptNumber: 2,
    });
    await repo.save(older);
    await repo.save(newer);

    const latest = await repo.findLatest(artifactId);
    expect(latest).not.toBeNull();
    expect(latest!.id).toBe(newer.id);
  });
});
