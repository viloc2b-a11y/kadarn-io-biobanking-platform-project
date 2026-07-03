// ==========================================================================
// AuditTrail — Immutable, hash-chained audit ledger (KEMS-007 §H)
// ==========================================================================

import crypto from 'node:crypto';
import type {
  AuditEntry,
  AuditEventType,
  IntegrityReport,
  ReplayResult,
} from './types.js';

// --- Sync SHA-256 (node:crypto, no Web Crypto) ---
function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

// --- Status priority for finalOutcome derivation ---
const OUTCOME_PRIORITY: Record<string, number> = {
  revoked: 6,
  expired: 5,
  acknowledged: 4,
  delivered: 3,
  dlq: 2,
  queued: 1,
  generated: 0,
};

function deriveCurrentStatus(timeline: AuditEntry[]): string {
  const eventTypes = timeline.map((e) => e.eventType);
  if (eventTypes.includes('artifact.revoked')) return 'revoked';
  if (eventTypes.includes('artifact.expired')) return 'expired';
  if (eventTypes.includes('artifact.acknowledged')) return 'acknowledged';
  if (eventTypes.includes('delivery.succeeded')) return 'delivered';
  if (eventTypes.includes('delivery.dlq')) return 'dlq';
  if (eventTypes.includes('artifact.queued')) return 'queued';
  if (eventTypes.includes('artifact.created')) return 'generated';
  return 'draft';
}

function deriveFinalOutcome(timeline: AuditEntry[]): ReplayResult['summary']['finalOutcome'] {
  const lastType = timeline[timeline.length - 1]?.eventType;
  switch (lastType) {
    case 'delivery.succeeded':
    case 'receipt.received':
      return 'delivered';
    case 'delivery.dlq':
    case 'delivery.failed':
      return 'failed';
    case 'artifact.expired':
      return 'expired';
    case 'artifact.revoked':
      return 'revoked';
    case 'artifact.acknowledged':
      return 'acknowledged';
    default:
      return 'in-progress';
  }
}

// --- Unique ID generator ---
let _idCounter = 0;
function generateId(): string {
  _idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 10);
  return `audit-${Date.now()}-${_idCounter}-${rand}`;
}

// ==========================================================================
// AuditTrail
// ==========================================================================
export class AuditTrail {
  private entries: AuditEntry[] = [];

  // --- Record a new audit entry ---
  record(params: {
    eventType: AuditEventType;
    artifactId: string;
    actor?: string | null;
    payload?: Record<string, unknown>;
    timestamp?: string;
  }): AuditEntry {
    const sequenceNumber = this.entries.length + 1;
    const previousEntry = this.entries[this.entries.length - 1] ?? null;
    const previousHash = previousEntry?.hash ?? null;

    const timestamp = params.timestamp ?? new Date().toISOString();
    const actor = params.actor ?? null;
    const payload = params.payload ?? {};

    // Build a hashable snapshot (without the hash field) to compute the hash
    const hashFields = {
      sequenceNumber,
      eventType: params.eventType,
      artifactId: params.artifactId,
      timestamp,
      actor,
      payload,
      previousHash,
    };
    const hash = this.computeEntryHash(hashFields);

    const entry: AuditEntry = {
      id: generateId(),
      ...hashFields,
      hash,
    };

    const frozen = Object.freeze(entry);
    this.entries.push(frozen);
    return frozen;
  }

  // --- Compute SHA-256 hash for an entry ---
  computeEntryHash(entry: { sequenceNumber: number; eventType: string; artifactId: string; timestamp: string; actor: string | null; payload: Record<string, unknown>; previousHash: string | null }): string {
    const input = [
      entry.sequenceNumber,
      entry.eventType,
      entry.artifactId,
      entry.timestamp,
      entry.actor ?? 'null',
      JSON.stringify(entry.payload),
      entry.previousHash ?? 'null',
    ].join('|');
    return sha256(input);
  }

  // --- Query: get all entries for an artifact ---
  getArtifactTrail(artifactId: string): AuditEntry[] {
    return this.entries.filter((e) => e.artifactId === artifactId);
  }

  // --- Query: get entries by event type ---
  getByEventType(eventType: AuditEventType): AuditEntry[] {
    return this.entries.filter((e) => e.eventType === eventType);
  }

  // --- Query: get entries within a time range (inclusive) ---
  getByTimeRange(from: string, to: string): AuditEntry[] {
    return this.entries.filter((e) => e.timestamp >= from && e.timestamp <= to);
  }

  // --- Replay: full timeline + derived summary for an artifact ---
  replayArtifact(artifactId: string): ReplayResult {
    const timeline = this.getArtifactTrail(artifactId);
    if (timeline.length === 0) {
      throw new Error(`No audit entries found for artifact: ${artifactId}`);
    }

    const firstEvent = timeline[0]!;
    const lastEvent = timeline[timeline.length - 1]!;
    const durationMs =
      new Date(lastEvent.timestamp).getTime() -
      new Date(firstEvent.timestamp).getTime();

    const deliveryAttempts = timeline.filter((e) =>
      ['delivery.attempted', 'delivery.retried'].includes(e.eventType),
    ).length;
    const successfulDeliveries = timeline.filter(
      (e) => e.eventType === 'delivery.succeeded',
    ).length;
    const failedDeliveries = timeline.filter(
      (e) => e.eventType === 'delivery.failed',
    ).length;

    return {
      artifactId,
      timeline,
      summary: {
        totalEvents: timeline.length,
        firstEvent,
        lastEvent,
        durationMs: Math.max(0, durationMs),
        currentStatus: deriveCurrentStatus(timeline),
        deliveryAttempts,
        successfulDeliveries,
        failedDeliveries,
        finalOutcome: deriveFinalOutcome(timeline),
      },
    };
  }

  // --- Verify integrity of the full hash chain ---
  verifyIntegrity(): IntegrityReport {
    const errors: string[] = [];
    let firstBrokenAt: number | null = null;

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]!;

      // Check sequence monotonicity
      if (entry.sequenceNumber !== i + 1) {
        const msg = `Entry ${entry.id}: expected sequence ${i + 1}, got ${entry.sequenceNumber}`;
        errors.push(msg);
        if (firstBrokenAt === null) firstBrokenAt = i + 1;
      }

      // Check previousHash chain
      if (i > 0) {
        const prevHash = this.entries[i - 1]!.hash;
        if (entry.previousHash !== prevHash) {
          const msg = `Entry ${entry.id}: previousHash mismatch. Expected ${prevHash}, got ${entry.previousHash}`;
          errors.push(msg);
          if (firstBrokenAt === null) firstBrokenAt = i + 1;
        }
      } else if (entry.previousHash !== null) {
        const msg = `Entry ${entry.id}: first entry should have previousHash=null, got ${entry.previousHash}`;
        errors.push(msg);
        if (firstBrokenAt === null) firstBrokenAt = 1;
      }

      // Check hash recomputation
      const recomputed = this.computeEntryHash(entry);
      if (entry.hash !== recomputed) {
        const msg = `Entry ${entry.id}: hash mismatch. Stored ${entry.hash.slice(0, 16)}..., recomputed ${recomputed.slice(0, 16)}...`;
        errors.push(msg);
        if (firstBrokenAt === null) firstBrokenAt = i + 1;
      }
    }

    return {
      valid: errors.length === 0,
      totalEntries: this.entries.length,
      firstBrokenAt,
      errors,
      checkedAt: new Date().toISOString(),
    };
  }

  // --- Utility ---
  listAll(): AuditEntry[] {
    return [...this.entries];
  }

  get size(): number {
    return this.entries.length;
  }

  get lastEntry(): AuditEntry | undefined {
    return this.entries[this.entries.length - 1];
  }

  getArtifactIds(): string[] {
    const ids = new Set<string>();
    for (const entry of this.entries) {
      ids.add(entry.artifactId);
    }
    return [...ids];
  }

  clear(): void {
    this.entries = [];
  }
}
