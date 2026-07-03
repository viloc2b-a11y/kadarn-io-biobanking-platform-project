// ==========================================================================
// Delivery Audit — Immutable audit trail types (KEMS-007 §H)
// ==========================================================================

// All auditable events in the delivery pipeline
export type AuditEventType =
  | 'delivery.requested'
  | 'policy.evaluated'
  | 'template.selected'
  | 'artifact.rendered'
  | 'artifact.created'
  | 'artifact.queued'
  | 'delivery.attempted'
  | 'delivery.succeeded'
  | 'delivery.failed'
  | 'delivery.retried'
  | 'delivery.dlq'
  | 'receipt.received'
  | 'artifact.acknowledged'
  | 'artifact.expired'
  | 'artifact.revoked';

export interface AuditEntry {
  readonly id: string;
  readonly sequenceNumber: number;
  readonly eventType: AuditEventType;
  readonly artifactId: string;
  readonly timestamp: string; // ISO 8601
  readonly actor: string | null;
  readonly payload: Record<string, unknown>;
  readonly previousHash: string | null;
  readonly hash: string; // SHA-256
}

export interface IntegrityReport {
  valid: boolean;
  totalEntries: number;
  firstBrokenAt: number | null;
  errors: string[];
  checkedAt: string;
}

export interface ReplayResult {
  artifactId: string;
  timeline: AuditEntry[];
  summary: {
    totalEvents: number;
    firstEvent: AuditEntry;
    lastEvent: AuditEntry;
    durationMs: number;
    currentStatus: string;
    deliveryAttempts: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    finalOutcome:
      | 'delivered'
      | 'failed'
      | 'expired'
      | 'revoked'
      | 'acknowledged'
      | 'in-progress';
  };
}
