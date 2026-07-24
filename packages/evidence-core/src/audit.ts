// ==========================================================================
// Evidence Core — Audit Trail Recorder
// ==========================================================================
// Baseline AF-1.0. Sprint 17.3.
//
// Records immutable audit events for every lifecycle action.
// This is separate from the domain model — it tracks who did what and when.
// Append-only: audit events may not be modified or deleted.
// ==========================================================================

import type { DbClient } from './db.js';

export type AuditAction =
  | 'claim.created'
  | 'evidence.submitted'
  | 'evidence.linked'
  | 'counter_evidence.submitted'
  | 'right_of_response.submitted'
  | 'relationship.created'
  | 'process_state.updated'
  | 'evidence.superseded'
  | 'workflow.advanced'
  | 'review_task.created'
  | 'review_task.completed';

export interface AuditEntry {
  id?: string;
  action: AuditAction;
  actorId: string;
  organizationId: string;
  correlationId: string;
  /** The primary entity affected (claim ID, evidence node ID, etc.) */
  entityId: string;
  /** Human-readable summary */
  summary: string;
  /** Structured details (must not contain interpretive content) */
  details?: Record<string, unknown>;
  /** When the action occurred */
  timestamp?: string;
}

/**
 * Record an audit entry. Entries are append-only — no update or delete is exposed.
 */
export async function recordAuditEntry(db: DbClient, entry: AuditEntry): Promise<void> {
  // In Sprint 17.3, audit entries are recorded to the existing audit_events table
  // via emit_audit_event RPC, or to a dedicated audit store.
  // For now, we record through the existing audit infrastructure.
  const timestamp = entry.timestamp ?? new Date().toISOString();

  const { error } = await db.from('audit_events').insert({
    action: entry.action,
    actor_id: entry.actorId,
    organization_id: entry.organizationId,
    correlation_id: entry.correlationId,
    resource_type: 'evidence_core',
    resource_id: entry.entityId,
    summary: entry.summary,
    details: (entry.details ?? {}) as Record<string, unknown>,
    created_at: timestamp,
  });

  if (error) {
    console.error('[evidence-core] Failed to record audit entry:', error);
    // Do not throw — audit failures should not block lifecycle operations.
    // In production, this would alert monitoring.
  }
}

/**
 * Create a standardized audit entry for a lifecycle operation.
 */
export function createAuditEntry(params: {
  action: AuditAction;
  actorId: string;
  organizationId: string;
  correlationId: string;
  entityId: string;
  summary: string;
  details?: Record<string, unknown>;
}): AuditEntry {
  return {
    action: params.action,
    actorId: params.actorId,
    organizationId: params.organizationId,
    correlationId: params.correlationId,
    entityId: params.entityId,
    summary: params.summary,
    details: params.details,
    timestamp: new Date().toISOString(),
  };
}
