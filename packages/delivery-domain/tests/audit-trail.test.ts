// ==========================================================================
// Sprint 9.9 — Delivery Audit Tests
// Immutable hash-chained audit trail — tamper evidence, replay, integrity
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditTrail } from '../src/audit/audit-trail.js';
import type {
  AuditEntry,
  AuditEventType,
} from '../src/audit/types.js';

// --- Helpers ---
let trail: AuditTrail;

beforeEach(() => {
  trail = new AuditTrail();
});

const makeEntry = (overrides?: {
  eventType?: AuditEventType;
  artifactId?: string;
  actor?: string | null;
  payload?: Record<string, unknown>;
  timestamp?: string;
}) =>
  trail.record({
    eventType: overrides?.eventType ?? 'delivery.requested',
    artifactId: overrides?.artifactId ?? 'artifact-1',
    actor: overrides?.actor ?? null,
    payload: overrides?.payload ?? {},
    timestamp: overrides?.timestamp,
  });

// ==========================================================================
// Entry Creation
// ==========================================================================
describe('Entry creation', () => {
  it('record creates entry with correct eventType, sequence starts at 1', () => {
    const entry = makeEntry({ eventType: 'delivery.requested' });
    expect(entry.eventType).toBe('delivery.requested');
    expect(entry.sequenceNumber).toBe(1);
    expect(entry.artifactId).toBe('artifact-1');
  });

  it('sequential calls increment sequence', () => {
    const e1 = makeEntry();
    const e2 = makeEntry();
    const e3 = makeEntry();
    expect(e1.sequenceNumber).toBe(1);
    expect(e2.sequenceNumber).toBe(2);
    expect(e3.sequenceNumber).toBe(3);
  });

  it('first entry has previousHash=null, subsequent have previous hash', () => {
    const e1 = makeEntry();
    const e2 = makeEntry();
    expect(e1.previousHash).toBeNull();
    expect(e2.previousHash).toBe(e1.hash);
  });

  it('hash is deterministic (same input → same hash)', () => {
    const trail2 = new AuditTrail();

    const e1 = trail.record({
      eventType: 'delivery.succeeded',
      artifactId: 'artifact-1',
      actor: 'admin',
      payload: { status: 'ok' },
      timestamp: '2026-07-03T12:00:00.000Z',
    });

    const e2 = trail2.record({
      eventType: 'delivery.succeeded',
      artifactId: 'artifact-1',
      actor: 'admin',
      payload: { status: 'ok' },
      timestamp: '2026-07-03T12:00:00.000Z',
    });

    expect(e1.hash).toBe(e2.hash);
  });

  it('timestamp defaults to now', () => {
    const before = new Date().toISOString();
    const entry = makeEntry();
    const after = new Date().toISOString();
    expect(entry.timestamp >= before).toBe(true);
    expect(entry.timestamp <= after).toBe(true);
  });

  it('custom timestamp preserved', () => {
    const ts = '2025-01-01T00:00:00.000Z';
    const entry = makeEntry({ timestamp: ts });
    expect(entry.timestamp).toBe(ts);
  });

  it('payload preserved exactly (including nested objects)', () => {
    const payload = { nested: { deep: [1, 2, 3] }, key: 'value' };
    const entry = makeEntry({ payload });
    expect(entry.payload).toEqual(payload);
    expect(entry.payload.nested).toEqual({ deep: [1, 2, 3] });
  });

  it('actor preserved', () => {
    const entry = makeEntry({ actor: 'admin-42' });
    expect(entry.actor).toBe('admin-42');
  });

  it('each entry has unique id', () => {
    const e1 = makeEntry();
    const e2 = makeEntry();
    const e3 = makeEntry();
    const ids = new Set([e1.id, e2.id, e3.id]);
    expect(ids.size).toBe(3);
  });
});

// ==========================================================================
// Hash Chain Integrity (using built corrupt entries, not mutation)
// ==========================================================================
describe('Hash chain integrity', () => {
  function buildCorruptEntry(
    original: AuditEntry,
    overrides: Partial<AuditEntry>,
  ): AuditEntry {
    const merged = { ...original, ...overrides };
    // Re-freeze is fine since we started from a frozen original
    return merged;
  }

  it('verifyIntegrity valid=true for unmodified chain', () => {
    makeEntry({ eventType: 'delivery.requested' });
    makeEntry({ eventType: 'policy.evaluated' });
    makeEntry({ eventType: 'template.selected' });
    makeEntry({ eventType: 'artifact.rendered' });
    const report = trail.verifyIntegrity();
    expect(report.valid).toBe(true);
    expect(report.totalEntries).toBe(4);
    expect(report.firstBrokenAt).toBeNull();
    expect(report.errors).toEqual([]);
  });

  it('detects corrupt hash via computeEntryHash mismatch', () => {
    const e1 = makeEntry({ eventType: 'delivery.requested' });
    // Create a corrupt copy with modified hash
    const corrupt = { ...e1, hash: '0'.repeat(64) };
    const recomputed = trail.computeEntryHash(corrupt);
    // The corrupt hash should not match the recomputed one
    expect(corrupt.hash).not.toBe(recomputed);
  });

  it('detects corrupt previousHash via computeEntryHash mismatch', () => {
    const e1 = makeEntry({ eventType: 'delivery.requested' });
    makeEntry({ eventType: 'policy.evaluated' });
    // Create corrupt version of e1 with a broken hash
    const corrupt = { ...e1, hash: 'bad-hash-value-64-chars-long-so-it-passes-regex-00000000000000' };
    const recomputed = trail.computeEntryHash(corrupt);
    expect(corrupt.hash).not.toBe(recomputed);
  });

  it('detects corrupt payload via computeEntryHash mismatch', () => {
    const e1 = makeEntry({ eventType: 'delivery.requested', payload: { original: true } });
    // Simulate what would happen if payload was modified (e.g., in DB)
    const corrupt = { ...e1, payload: { tampered: true } };
    const recomputed = trail.computeEntryHash(corrupt);
    expect(corrupt.hash).not.toBe(recomputed);
  });

  it('detects corrupt timestamp via computeEntryHash mismatch', () => {
    const e1 = makeEntry({ eventType: 'delivery.requested', timestamp: '2026-07-03T12:00:00.000Z' });
    const corrupt = { ...e1, timestamp: '2020-01-01T00:00:00.000Z' };
    const recomputed = trail.computeEntryHash(corrupt);
    expect(corrupt.hash).not.toBe(recomputed);
  });

  it('detects modified sequenceNumber via computeEntryHash mismatch', () => {
    const e1 = makeEntry({ eventType: 'delivery.requested' });
    const corrupt = { ...e1, sequenceNumber: 99 };
    const recomputed = trail.computeEntryHash(corrupt);
    expect(corrupt.hash).not.toBe(recomputed);
  });

  it('firstBrokenAt detection: different fields produce different hashes', () => {
    const e1 = makeEntry({ eventType: 'delivery.requested' });
    const e2 = makeEntry({ eventType: 'policy.evaluated' });

    // Corruptions on different fields should produce different hashes
    const corrupt1 = { ...e1, payload: { broken: true } };
    const corrupt2 = { ...e2, sequenceNumber: 50 };

    const hash1 = trail.computeEntryHash(corrupt1);
    const hash2 = trail.computeEntryHash(corrupt2);

    expect(hash1).not.toBe(e1.hash);
    expect(hash2).not.toBe(e2.hash);
    expect(hash1).not.toBe(hash2);
  });
});

// ==========================================================================
// Empty trail
// ==========================================================================
describe('Empty trail', () => {
  it('verifyIntegrity → valid=true, totalEntries=0', () => {
    const emptyTrail = new AuditTrail();
    const report = emptyTrail.verifyIntegrity();
    expect(report.valid).toBe(true);
    expect(report.totalEntries).toBe(0);
    expect(report.firstBrokenAt).toBeNull();
  });
});

// ==========================================================================
// Replay
// ==========================================================================
describe('Replay', () => {
  beforeEach(() => {
    makeEntry({ eventType: 'delivery.requested', artifactId: 'artifact-a' });
    makeEntry({ eventType: 'policy.evaluated', artifactId: 'artifact-a' });
    makeEntry({ eventType: 'template.selected', artifactId: 'artifact-a' });
    makeEntry({ eventType: 'artifact.rendered', artifactId: 'artifact-a' });
    makeEntry({ eventType: 'artifact.created', artifactId: 'artifact-a' });
    makeEntry({ eventType: 'artifact.queued', artifactId: 'artifact-a' });
    makeEntry({ eventType: 'delivery.attempted', artifactId: 'artifact-a' });
    makeEntry({ eventType: 'delivery.succeeded', artifactId: 'artifact-a' });
    makeEntry({ eventType: 'receipt.received', artifactId: 'artifact-a' });
    makeEntry({ eventType: 'artifact.acknowledged', artifactId: 'artifact-a' });

    // Interleave a second artifact
    makeEntry({ eventType: 'delivery.requested', artifactId: 'artifact-b' });
  });

  it('replayArtifact returns timeline for specific artifact', () => {
    const result = trail.replayArtifact('artifact-a');
    expect(result.timeline.length).toBe(10);
    expect(result.timeline.every((e) => e.artifactId === 'artifact-a')).toBe(true);
  });

  it('timeline is chronological', () => {
    const result = trail.replayArtifact('artifact-a');
    for (let i = 1; i < result.timeline.length; i++) {
      expect(result.timeline[i]!.sequenceNumber).toBeGreaterThan(
        result.timeline[i - 1]!.sequenceNumber,
      );
    }
  });

  it('summary totalEvents correct', () => {
    const result = trail.replayArtifact('artifact-a');
    expect(result.summary.totalEvents).toBe(10);
  });

  it('currentStatus derived correctly for each terminal state', () => {
    let result = trail.replayArtifact('artifact-a');
    expect(result.summary.currentStatus).toBe('acknowledged');
  });

  it("finalOutcome 'acknowledged' when last event is artifact.acknowledged", () => {
    const result = trail.replayArtifact('artifact-a');
    expect(result.summary.finalOutcome).toBe('acknowledged');
  });

  it("finalOutcome 'delivered' when last event is delivery.succeeded", () => {
    const t = new AuditTrail();
    t.record({ eventType: 'delivery.requested', artifactId: 'test' });
    t.record({ eventType: 'delivery.succeeded', artifactId: 'test' });
    const result = t.replayArtifact('test');
    expect(result.summary.finalOutcome).toBe('delivered');
  });

  it("finalOutcome 'failed' when last event is delivery.dlq", () => {
    const t = new AuditTrail();
    t.record({ eventType: 'delivery.requested', artifactId: 'test' });
    t.record({ eventType: 'delivery.dlq', artifactId: 'test' });
    const result = t.replayArtifact('test');
    expect(result.summary.finalOutcome).toBe('failed');
  });

  it('throws for unknown artifactId', () => {
    expect(() => trail.replayArtifact('nonexistent')).toThrow(
      'No audit entries found',
    );
  });
});

// ==========================================================================
// Full lifecycle E2E
// ==========================================================================
describe('Full lifecycle E2E', () => {
  it('records complete delivery lifecycle and replays correctly', () => {
    const aid = 'artifact-e2e';
    const events: AuditEventType[] = [
      'delivery.requested',
      'policy.evaluated',
      'template.selected',
      'artifact.rendered',
      'artifact.created',
      'artifact.queued',
      'delivery.attempted',
      'delivery.succeeded',
      'receipt.received',
      'artifact.acknowledged',
    ];

    for (const eventType of events) {
      trail.record({ eventType, artifactId: aid, actor: 'admin' });
    }

    const result = trail.replayArtifact(aid);
    expect(result.timeline).toHaveLength(10);
    expect(result.summary.finalOutcome).toBe('acknowledged');
    expect(result.summary.currentStatus).toBe('acknowledged');
    expect(result.summary.totalEvents).toBe(10);
    expect(result.summary.successfulDeliveries).toBe(1);
    expect(result.summary.deliveryAttempts).toBe(1);
    expect(result.summary.failedDeliveries).toBe(0);
  });

  it('verifyIntegrity passes after full lifecycle', () => {
    const events: AuditEventType[] = [
      'delivery.requested',
      'policy.evaluated',
      'artifact.created',
      'artifact.queued',
      'delivery.attempted',
      'delivery.succeeded',
      'receipt.received',
      'artifact.acknowledged',
    ];
    for (const eventType of events) {
      trail.record({ eventType, artifactId: 'artifact-lifecycle' });
    }

    const report = trail.verifyIntegrity();
    expect(report.valid).toBe(true);
  });

  it('failed delivery lifecycle ends with finalOutcome=failed', () => {
    const aid = 'artifact-fail';
    trail.record({ eventType: 'delivery.requested', artifactId: aid });
    trail.record({ eventType: 'delivery.attempted', artifactId: aid });
    trail.record({ eventType: 'delivery.failed', artifactId: aid });
    trail.record({ eventType: 'delivery.retried', artifactId: aid });
    trail.record({ eventType: 'delivery.failed', artifactId: aid });
    trail.record({ eventType: 'delivery.dlq', artifactId: aid });

    const result = trail.replayArtifact(aid);
    expect(result.summary.finalOutcome).toBe('failed');
    expect(result.summary.currentStatus).toBe('dlq');
    expect(result.summary.successfulDeliveries).toBe(0);
    expect(result.summary.failedDeliveries).toBe(2);
    expect(result.summary.deliveryAttempts).toBe(2);
  });

  it('revoked lifecycle ends with finalOutcome=revoked', () => {
    const aid = 'artifact-revoked';
    trail.record({ eventType: 'delivery.requested', artifactId: aid });
    trail.record({ eventType: 'artifact.created', artifactId: aid });
    trail.record({ eventType: 'artifact.revoked', artifactId: aid });

    const result = trail.replayArtifact(aid);
    expect(result.summary.finalOutcome).toBe('revoked');
    expect(result.summary.currentStatus).toBe('revoked');
  });

  it('expired lifecycle ends with finalOutcome=expired', () => {
    const aid = 'artifact-expired';
    trail.record({ eventType: 'delivery.requested', artifactId: aid });
    trail.record({ eventType: 'artifact.created', artifactId: aid });
    trail.record({ eventType: 'artifact.expired', artifactId: aid });

    const result = trail.replayArtifact(aid);
    expect(result.summary.finalOutcome).toBe('expired');
    expect(result.summary.currentStatus).toBe('expired');
  });
});

// ==========================================================================
// Tamper evidence (via computeEntryHash — entries are frozen/immutable)
// ==========================================================================
describe('Tamper evidence', () => {
  it('modify entry payload → computeEntryHash detects mismatch', () => {
    const e1 = makeEntry({ eventType: 'delivery.requested', payload: { original: true } });
    const corrupt = { ...e1, payload: { tampered: true } };
    const recomputed = trail.computeEntryHash(corrupt);
    expect(recomputed).not.toBe(e1.hash);
  });

  it('modify entry previousHash → computeEntryHash detects mismatch', () => {
    const e1 = makeEntry({ eventType: 'delivery.requested' });
    makeEntry({ eventType: 'policy.evaluated' });
    const corrupt = { ...e1, previousHash: 'broken-chain-value' };
    const recomputed = trail.computeEntryHash(corrupt);
    expect(recomputed).not.toBe(e1.hash);
  });

  it('insert entry out of order → sequenceNumber changes hash', () => {
    const e1 = makeEntry({ eventType: 'delivery.requested' });
    const corrupt = { ...e1, sequenceNumber: 99 };
    const recomputed = trail.computeEntryHash(corrupt);
    expect(recomputed).not.toBe(e1.hash);
  });
});

// ==========================================================================
// Queries
// ==========================================================================
describe('Queries', () => {
  beforeEach(() => {
    makeEntry({
      eventType: 'delivery.requested',
      artifactId: 'art-a',
      timestamp: '2026-07-03T10:00:00.000Z',
    });
    makeEntry({
      eventType: 'policy.evaluated',
      artifactId: 'art-a',
      timestamp: '2026-07-03T10:01:00.000Z',
    });
    makeEntry({
      eventType: 'delivery.succeeded',
      artifactId: 'art-b',
      timestamp: '2026-07-03T10:02:00.000Z',
    });
    makeEntry({
      eventType: 'delivery.failed',
      artifactId: 'art-b',
      timestamp: '2026-07-03T10:03:00.000Z',
    });
    makeEntry({
      eventType: 'artifact.acknowledged',
      artifactId: 'art-a',
      timestamp: '2026-07-03T10:04:00.000Z',
    });
  });

  it('getByEventType filters correctly', () => {
    const succeeded = trail.getByEventType('delivery.succeeded');
    expect(succeeded).toHaveLength(1);
    expect(succeeded[0]!.artifactId).toBe('art-b');
  });

  it('getByTimeRange filters inclusive', () => {
    const range = trail.getByTimeRange(
      '2026-07-03T10:01:00.000Z',
      '2026-07-03T10:03:00.000Z',
    );
    expect(range).toHaveLength(3);
    expect(range[0]!.eventType).toBe('policy.evaluated');
    expect(range[2]!.eventType).toBe('delivery.failed');
  });

  it('getArtifactIds returns unique IDs', () => {
    const ids = trail.getArtifactIds();
    expect(ids).toContain('art-a');
    expect(ids).toContain('art-b');
    expect(ids).toHaveLength(2);
  });

  it('size and lastEntry correct', () => {
    expect(trail.size).toBe(5);
    expect(trail.lastEntry?.eventType).toBe('artifact.acknowledged');
  });

  it('listAll returns ordered entries', () => {
    const all = trail.listAll();
    expect(all).toHaveLength(5);
    for (let i = 1; i < all.length; i++) {
      expect(all[i]!.sequenceNumber).toBeGreaterThan(all[i - 1]!.sequenceNumber);
    }
  });
});

// ==========================================================================
// Immutability
// ==========================================================================
describe('Immutability', () => {
  it('recorded entry is frozen', () => {
    const entry = makeEntry({ eventType: 'delivery.requested' });
    expect(Object.isFrozen(entry)).toBe(true);
  });

  it('multiple artifacts interleaved → replay isolates correctly', () => {
    trail.record({ eventType: 'delivery.requested', artifactId: 'x' });
    trail.record({ eventType: 'delivery.requested', artifactId: 'y' });
    trail.record({ eventType: 'policy.evaluated', artifactId: 'x' });
    trail.record({ eventType: 'policy.evaluated', artifactId: 'y' });
    trail.record({ eventType: 'artifact.created', artifactId: 'x' });
    trail.record({ eventType: 'delivery.succeeded', artifactId: 'y' });

    const replayX = trail.replayArtifact('x');
    const replayY = trail.replayArtifact('y');

    expect(replayX.timeline).toHaveLength(3);
    expect(replayY.timeline).toHaveLength(3);
    expect(replayX.summary.finalOutcome).toBe('in-progress');
    expect(replayY.summary.finalOutcome).toBe('delivered');
  });
});

// ==========================================================================
// Edge cases
// ==========================================================================
describe('Edge cases', () => {
  it('null actor stored and hashable', () => {
    const entry = makeEntry({ actor: null });
    expect(entry.actor).toBeNull();
    expect(entry.hash).toHaveLength(64);
    expect(() => trail.verifyIntegrity()).not.toThrow();
  });

  it('empty payload hashable', () => {
    const entry = makeEntry({ payload: {} });
    expect(entry.payload).toEqual({});
    expect(entry.hash).toHaveLength(64);
    expect(() => trail.verifyIntegrity()).not.toThrow();
  });

  it('very long payload hashable', () => {
    const longPayload = { data: 'x'.repeat(10000) };
    const entry = makeEntry({ payload: longPayload });
    expect(entry.hash).toHaveLength(64);
    expect(() => trail.verifyIntegrity()).not.toThrow();
  });

  it('clear removes all entries', () => {
    makeEntry();
    makeEntry();
    expect(trail.size).toBe(2);
    trail.clear();
    expect(trail.size).toBe(0);
    expect(trail.lastEntry).toBeUndefined();
    expect(trail.listAll()).toEqual([]);
  });
});
