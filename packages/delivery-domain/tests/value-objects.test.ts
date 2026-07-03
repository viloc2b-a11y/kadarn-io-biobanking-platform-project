// ==========================================================================
// Value Objects Tests — Delivery Domain
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  createDeliveryArtifactId,
  createDeliveryChannelId,
  createDeliveryRecipientId,
  createDeliveryPolicyId,
  createDeliveryTemplateId,
  createDeliveryReceiptId,
} from '../src/value-objects/ids.js';
import { isArtifactType, ARTIFACT_TYPES, type ArtifactType } from '../src/value-objects/artifact-type.js';
import { isChannelType, CHANNEL_TYPES, type ChannelType } from '../src/value-objects/channel-type.js';
import { isRecipientType, RECIPIENT_TYPES, type RecipientType } from '../src/value-objects/recipient-type.js';
import {
  generateContentHash,
  validateContentHash,
  isContentHash,
} from '../src/value-objects/content-hash.js';
import {
  isValidTransition,
  transitionStatus,
  isTerminalStatus,
  isArtifactStatus,
  type ArtifactStatus,
} from '../src/value-objects/delivery-status.js';
import {
  isValidReceiptTransition,
  transitionReceiptStatus,
  isTerminalReceiptStatus,
  type ReceiptStatus,
} from '../src/value-objects/receipt-status.js';

// ==========================================================================
// Branded IDs
// ==========================================================================

describe('Branded ID value objects', () => {
  it('creates a DeliveryArtifactId with UUID format', () => {
    const id = createDeliveryArtifactId();
    expect(id).toBeTypeOf('string');
    expect(id.length).toBe(36);
  });

  it('accepts a pre-existing UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const id = createDeliveryArtifactId(uuid);
    expect(id).toBe(uuid);
  });

  it('throws on non-UUID input', () => {
    expect(() => createDeliveryArtifactId('not-a-uuid')).toThrow();
  });

  it('creates all 6 ID types', () => {
    expect(createDeliveryChannelId()).toBeTypeOf('string');
    expect(createDeliveryRecipientId()).toBeTypeOf('string');
    expect(createDeliveryPolicyId()).toBeTypeOf('string');
    expect(createDeliveryTemplateId()).toBeTypeOf('string');
    expect(createDeliveryReceiptId()).toBeTypeOf('string');
  });

  it('generates unique IDs each call', () => {
    const a = createDeliveryArtifactId();
    const b = createDeliveryArtifactId();
    expect(a).not.toBe(b);
  });
});

// ==========================================================================
// ArtifactType
// ==========================================================================

describe('ArtifactType', () => {
  it('accepts all valid artifact types', () => {
    const valid: ArtifactType[] = ['pdf', 'json', 'zip', 'html', 'csv'];
    for (const t of valid) {
      expect(isArtifactType(t)).toBe(true);
    }
  });

  it('rejects invalid artifact types', () => {
    expect(isArtifactType('xml')).toBe(false);
    expect(isArtifactType('')).toBe(false);
    expect(isArtifactType('PDF')).toBe(false);
  });

  it('has exactly 5 artifact types', () => {
    expect(ARTIFACT_TYPES).toHaveLength(5);
  });
});

// ==========================================================================
// ChannelType
// ==========================================================================

describe('ChannelType', () => {
  it('accepts all valid channel types', () => {
    const valid: ChannelType[] = ['email', 'webhook', 'sftp', 'api', 'portal', 's3'];
    for (const t of valid) {
      expect(isChannelType(t)).toBe(true);
    }
  });

  it('rejects invalid channel types', () => {
    expect(isChannelType('sms')).toBe(false);
    expect(isChannelType('')).toBe(false);
  });

  it('has exactly 6 channel types', () => {
    expect(CHANNEL_TYPES).toHaveLength(6);
  });
});

// ==========================================================================
// RecipientType
// ==========================================================================

describe('RecipientType', () => {
  it('accepts all valid recipient types', () => {
    const valid: RecipientType[] = ['person', 'system', 'organization'];
    for (const t of valid) {
      expect(isRecipientType(t)).toBe(true);
    }
  });

  it('rejects invalid recipient types', () => {
    expect(isRecipientType('group')).toBe(false);
    expect(isRecipientType('')).toBe(false);
  });

  it('has exactly 3 recipient types', () => {
    expect(RECIPIENT_TYPES).toHaveLength(3);
  });
});

// ==========================================================================
// ContentHash
// ==========================================================================

describe('ContentHash', () => {
  it('validates a correct SHA-256 hex string', () => {
    const hash = 'a'.repeat(64);
    expect(isContentHash(hash)).toBe(true);
    expect(validateContentHash(hash)).toBe(hash);
  });

  it('rejects strings that are not 64 hex chars', () => {
    expect(isContentHash('abc')).toBe(false);
    expect(isContentHash('z'.repeat(64))).toBe(false); // 'z' not hex
  });

  it('generates a valid SHA-256 hash', async () => {
    const hash = await generateContentHash('hello kadarn');
    expect(isContentHash(hash)).toBe(true);
    expect(hash).toHaveLength(64);
  });

  it('generates deterministic hashes for same input', async () => {
    const a = await generateContentHash('test');
    const b = await generateContentHash('test');
    expect(a).toBe(b);
  });

  it('generates different hashes for different input', async () => {
    const a = await generateContentHash('alpha');
    const b = await generateContentHash('beta');
    expect(a).not.toBe(b);
  });

  it('accepts Uint8Array input', async () => {
    const data = new TextEncoder().encode('binary data');
    const hash = await generateContentHash(data);
    expect(isContentHash(hash)).toBe(true);
  });
});

// ==========================================================================
// ArtifactStatus — state machine (KEMS-007 lifecycle)
// ==========================================================================

describe('ArtifactStatus state machine', () => {
  // Valid transitions
  it('allows draft → generated', () => {
    expect(isValidTransition('draft', 'generated')).toBe(true);
  });

  it('allows generated → queued', () => {
    expect(isValidTransition('generated', 'queued')).toBe(true);
  });

  it('allows generated → revoked', () => {
    expect(isValidTransition('generated', 'revoked')).toBe(true);
  });

  it('allows queued → delivered', () => {
    expect(isValidTransition('queued', 'delivered')).toBe(true);
  });

  it('allows queued → revoked', () => {
    expect(isValidTransition('queued', 'revoked')).toBe(true);
  });

  it('allows delivered → acknowledged', () => {
    expect(isValidTransition('delivered', 'acknowledged')).toBe(true);
  });

  it('allows delivered → expired', () => {
    expect(isValidTransition('delivered', 'expired')).toBe(true);
  });

  it('allows acknowledged → expired', () => {
    expect(isValidTransition('acknowledged', 'expired')).toBe(true);
  });

  it('allows acknowledged → revoked', () => {
    expect(isValidTransition('acknowledged', 'revoked')).toBe(true);
  });

  // Invalid transitions
  it('rejects draft → queued (skip generated)', () => {
    expect(isValidTransition('draft', 'queued')).toBe(false);
  });

  it('rejects draft → delivered (skip multiple states)', () => {
    expect(isValidTransition('draft', 'delivered')).toBe(false);
  });

  it('rejects draft → revoked', () => {
    expect(isValidTransition('draft', 'revoked')).toBe(false);
  });

  it('rejects draft → expired', () => {
    expect(isValidTransition('draft', 'expired')).toBe(false);
  });

  it('rejects draft → draft (self)', () => {
    expect(isValidTransition('draft', 'draft')).toBe(false);
  });

  it('rejects generated → delivered (skip queued)', () => {
    expect(isValidTransition('generated', 'delivered')).toBe(false);
  });

  it('rejects generated → expired (non-terminal → terminal directly)', () => {
    expect(isValidTransition('generated', 'expired')).toBe(false);
  });

  it('rejects queued → acknowledged (skip delivered)', () => {
    expect(isValidTransition('queued', 'acknowledged')).toBe(false);
  });

  it('rejects delivered → draft (backwards)', () => {
    expect(isValidTransition('delivered', 'draft')).toBe(false);
  });

  it('rejects acknowledged → draft (backwards)', () => {
    expect(isValidTransition('acknowledged', 'draft')).toBe(false);
  });

  // Terminal states
  it('rejects revoked → anything', () => {
    expect(isValidTransition('revoked', 'draft')).toBe(false);
    expect(isValidTransition('revoked', 'generated')).toBe(false);
    expect(isValidTransition('revoked', 'queued')).toBe(false);
    expect(isValidTransition('revoked', 'delivered')).toBe(false);
    expect(isValidTransition('revoked', 'acknowledged')).toBe(false);
    expect(isValidTransition('revoked', 'expired')).toBe(false);
  });

  it('rejects expired → anything', () => {
    expect(isValidTransition('expired', 'draft')).toBe(false);
    expect(isValidTransition('expired', 'generated')).toBe(false);
    expect(isValidTransition('expired', 'queued')).toBe(false);
    expect(isValidTransition('expired', 'delivered')).toBe(false);
    expect(isValidTransition('expired', 'acknowledged')).toBe(false);
  });

  it('throws on invalid transition via transitionStatus', () => {
    expect(() => transitionStatus('draft', 'delivered')).toThrow(
      'Invalid artifact status transition: draft → delivered',
    );
  });

  it('returns new status on valid transition', () => {
    expect(transitionStatus('draft', 'generated')).toBe('generated');
    expect(transitionStatus('generated', 'queued')).toBe('queued');
    expect(transitionStatus('queued', 'delivered')).toBe('delivered');
    expect(transitionStatus('delivered', 'acknowledged')).toBe('acknowledged');
  });

  it('identifies terminal statuses', () => {
    expect(isTerminalStatus('revoked')).toBe(true);
    expect(isTerminalStatus('expired')).toBe(true);
    expect(isTerminalStatus('draft')).toBe(false);
    expect(isTerminalStatus('generated')).toBe(false);
    expect(isTerminalStatus('queued')).toBe(false);
    expect(isTerminalStatus('delivered')).toBe(false);
    expect(isTerminalStatus('acknowledged')).toBe(false);
  });

  it('isArtifactStatus validates all 7 valid statuses', () => {
    expect(isArtifactStatus('draft')).toBe(true);
    expect(isArtifactStatus('generated')).toBe(true);
    expect(isArtifactStatus('queued')).toBe(true);
    expect(isArtifactStatus('delivered')).toBe(true);
    expect(isArtifactStatus('acknowledged')).toBe(true);
    expect(isArtifactStatus('expired')).toBe(true);
    expect(isArtifactStatus('revoked')).toBe(true);
    expect(isArtifactStatus('invalid')).toBe(false);
    expect(isArtifactStatus('')).toBe(false);
  });
});

// ==========================================================================
// ReceiptStatus — state machine
// ==========================================================================

describe('ReceiptStatus state machine', () => {
  it('allows sent → delivered', () => {
    expect(isValidReceiptTransition('sent', 'delivered')).toBe(true);
  });

  it('allows sent → failed', () => {
    expect(isValidReceiptTransition('sent', 'failed')).toBe(true);
  });

  it('allows sent → bounced', () => {
    expect(isValidReceiptTransition('sent', 'bounced')).toBe(true);
  });

  it('allows failed → sent (retry)', () => {
    expect(isValidReceiptTransition('failed', 'sent')).toBe(true);
  });

  it('rejects delivered → anything (terminal)', () => {
    expect(isValidReceiptTransition('delivered', 'sent')).toBe(false);
    expect(isValidReceiptTransition('delivered', 'failed')).toBe(false);
    expect(isValidReceiptTransition('delivered', 'bounced')).toBe(false);
  });

  it('rejects bounced → anything (terminal)', () => {
    expect(isValidReceiptTransition('bounced', 'sent')).toBe(false);
    expect(isValidReceiptTransition('bounced', 'failed')).toBe(false);
    expect(isValidReceiptTransition('bounced', 'delivered')).toBe(false);
  });

  it('rejects failed → delivered (must go through sent)', () => {
    expect(isValidReceiptTransition('failed', 'delivered')).toBe(false);
  });

  it('throws on invalid receipt transition', () => {
    expect(() => transitionReceiptStatus('delivered', 'sent')).toThrow(
      'Invalid receipt status transition: delivered → sent',
    );
  });

  it('returns new status on valid receipt transition', () => {
    expect(transitionReceiptStatus('sent', 'delivered')).toBe('delivered');
    expect(transitionReceiptStatus('failed', 'sent')).toBe('sent');
  });

  it('identifies terminal receipt statuses', () => {
    expect(isTerminalReceiptStatus('delivered')).toBe(true);
    expect(isTerminalReceiptStatus('bounced')).toBe(true);
    expect(isTerminalReceiptStatus('sent')).toBe(false);
    expect(isTerminalReceiptStatus('failed')).toBe(false);
  });
});
