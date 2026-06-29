// ==========================================================================
// Kadarn Audit — Centralized Audit Event Emission
// ==========================================================================

import { createRouteClient } from '@/lib/supabase-server';
import { publishDomainEventFireAndForget } from '@/lib/event-runtime';

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

// Valid audit_resource_type enum values from the database — passthrough or fallback to 'other'
const VALID_RESOURCE_TYPES = new Set([
  'organization',
  'organization_membership',
  'organization_capability',
  'user_profile',
  'program',
  'program_participant',
  'program_access_policy',
  'supply_item',
  'collection',
  'donor',
  'sample',
  'access_request',
  'negotiation_message',
  'exchange_deal',
  'chain_telemetry',
  'identity_provider',
  'other',
]);

const ACTION_MAP: Record<string, string> = {
  create: 'create',
  read: 'read',
  update: 'update',
  delete: 'delete',
  login: 'login',
  logout: 'logout',
  invite: 'invite',
  approve: 'approve',
  reject: 'reject',
  submit: 'submit',
};

/**
 * Emit an audit event. Returns a Promise so callers may await for reliability.
 *
 * WARNING: This uses fire-and-forget semantics in production paths. Audit events
 * may be dropped if the database RPC fails. For critical audit trails, consider
 * using a reliable outbox pattern instead.
 */
export async function emitAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = await createRouteClient();
    const auditAction = ACTION_MAP[event.action] ?? 'other';
    // Validate resourceType against the DB enum to prevent silent RPC failure
    const resourceType = VALID_RESOURCE_TYPES.has(event.resourceType)
      ? event.resourceType
      : 'other';

    const { data: auditId, error } = await supabase.rpc('emit_audit_event', {
      p_action: auditAction,
      p_resource_type: resourceType,
      p_resource_id: event.resourceId || null,
      p_organization_id: event.organizationId,
      p_summary: event.summary,
      p_new_values: event.details ?? null,
    });

    if (error) {
      console.error('[audit] emit_audit_event failed:', error.message);
      return;
    }

    publishDomainEventFireAndForget('AuditEventCreated', {
      auditEventId: typeof auditId === 'string' ? auditId : event.resourceId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      actorId: event.actorId,
      organizationId: event.organizationId,
      summary: event.summary,
    }, {
      actorId: event.actorId,
      organizationId: event.organizationId,
      correlationId: event.correlationId,
      idempotencyKey: `AuditEventCreated:${event.correlationId}:${event.action}:${event.resourceId}`,
    });
  } catch (err) {
    console.error('[audit] emit failed:', err);
  }
}
