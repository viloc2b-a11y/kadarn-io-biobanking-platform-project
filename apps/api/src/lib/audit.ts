// ==========================================================================
// Kadarn Audit — Centralized Audit Event Emission
// ==========================================================================
// KPR-04: Every state-changing route must emit an audit event.
//
// Separate from provenance:
//   - Audit: who did what, when (operational record)
//   - Provenance: entity history, chain of custody (scientific record)
//
// Both are needed. Neither replaces the other.
// ==========================================================================

export interface AuditEvent {
  action: string
  resourceType: string
  resourceId: string
  actorId: string
  organizationId: string | null
  correlationId: string
  result: 'success' | 'failure'
  summary: string | null
  details?: Record<string, unknown>
}

/**
 * Emit an audit event.
 * Fire-and-forget — never blocks or throws.
 *
 * In production, this writes to the audit_events table.
 * For now, it logs structured JSON for observability.
 */
export function emitAuditEvent(event: AuditEvent): void {
  try {
    console.log(JSON.stringify({
      type: 'audit_event',
      event: {
        ...event,
        timestamp: new Date().toISOString(),
      },
    }))
  } catch {
    // Fire-and-forget — never throw
  }
}
