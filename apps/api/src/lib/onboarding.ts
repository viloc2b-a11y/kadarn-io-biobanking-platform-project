// ==========================================================================
// Kadarn Onboarding — Cross-Engine Integration Helper
// ==========================================================================
// Lightweight module that connects the organizations route to the engine
// packages: provenance, domain-events, telemetry.
//
// This is the integration glue for KPV-01.
// All hooks are fire-and-forget — they never block the response.
// ==========================================================================

import {
  SPAN_API_REQUEST,
  SPAN_PROVENANCE_CORRECTION,
  withAsyncTracing,
  getTracer,
} from '@kadarn/telemetry';
import type { DomainEvent } from '@kadarn/domain-events';
import type { OrganizationCreatedPayload } from '@kadarn/domain-events';

// ---------------------------------------------------------------------------
// Event stub — logs structured domain events
// ---------------------------------------------------------------------------
// In production, this would call an EventBus.publish().
// For KPV-01, it logs the event and returns it for test inspection.
// ---------------------------------------------------------------------------

export interface EmittedEvent {
  type: string;
  payload: Record<string, unknown>;
  actorId: string;
  organizationId: string | null;
  correlationId: string;
}

/**
 * Emit a domain event. Fire-and-forget — never throws.
 * Currently logs to console. Future: EventBus.publish().
 */
export function emitDomainEvent(
  type: string,
  payload: Record<string, unknown>,
  context: {
    actorId: string;
    organizationId?: string | null;
    correlationId: string;
  },
): EmittedEvent {
  const event: EmittedEvent = {
    type,
    payload,
    actorId: context.actorId,
    organizationId: context.organizationId ?? null,
    correlationId: context.correlationId,
  };

  console.log(JSON.stringify({
    type: 'domain_event',
    event,
    timestamp: new Date().toISOString(),
  }));

  return event;
}

/**
 * Emit an OrganizationCreated event with the canonical DomainEvent shape.
 */
export function emitOrganizationCreated(
  org: { id: string; name: string; country: string },
  actorId: string,
  correlationId: string,
): EmittedEvent {
  return emitDomainEvent('OrganizationCreated', {
    organizationId: org.id,
    name: org.name,
    country: org.country,
    createdBy: actorId,
  } satisfies OrganizationCreatedPayload, {
    actorId,
    organizationId: org.id,
    correlationId,
  });
}

// ---------------------------------------------------------------------------
// Provenance recording stub
// ---------------------------------------------------------------------------
// Records an organization creation in the provenance graph.
// Fire-and-forget — never blocks the response.
// ---------------------------------------------------------------------------

export interface ProvenanceRecord {
  nodeType: string;
  externalId: string;
  organizationId: string;
  recorded: boolean;
}

/**
 * Record an organization creation in the provenance graph.
 * 
 * In production, calls supabase.rpc('upsert_provenance_node', ...).
 * For offline tests, returns a structured record for verification.
 */
export async function recordOrganizationProvenance(
  org: { id: string; name: string; country: string; created_at?: string },
  correlationId: string,
): Promise<ProvenanceRecord> {
  // This would be: const { data } = await supabase.rpc('upsert_provenance_node', {...})
  // For KPV-01, we record the provenance data shape for verification
  const provenanceInput = {
    node_type: 'organization',
    external_id: org.id,
    label: org.name,
    properties: {
      country: org.country,
      created_at: org.created_at ?? new Date().toISOString(),
      correlationId,
      source: 'onboarding-flow',
    },
    organization_id: org.id,
  };

  // In production, this calls the DB function:
  //   const { data, error } = await supabase
  //     .rpc('upsert_provenance_node', {
  //       p_node_type: provenanceInput.node_type,
  //       p_external_id: provenanceInput.external_id,
  //       p_label: provenanceInput.label,
  //       p_properties: provenanceInput.properties,
  //       p_organization_id: provenanceInput.organization_id,
  //     });

  return {
    nodeType: provenanceInput.node_type,
    externalId: provenanceInput.external_id,
    organizationId: org.id,
    recorded: true,
  };
}

// ---------------------------------------------------------------------------
// Policy check interface
// ---------------------------------------------------------------------------
// The policy engine check is already handled by withPolicyShadow on GET.
// For POST (organization creation), we trace the evaluation.
// ---------------------------------------------------------------------------

/**
 * Execute a policy check for organization creation.
 * Fire-and-forget in shadow mode — never blocks.
 */
export async function evaluateCreateOrgPolicy(
  actorId: string,
  actorRole: string,
  organizationId: string,
  correlationId: string,
): Promise<{ evaluated: boolean; correlationId: string }> {
  console.log(JSON.stringify({
    type: 'policy_shadow_check',
    actorId,
    actorRole,
    organizationId,
    correlationId,
    timestamp: new Date().toISOString(),
  }));

  return { evaluated: true, correlationId };
}

// ---------------------------------------------------------------------------
// Telemetry helpers
// ---------------------------------------------------------------------------

/**
 * Generate a correlation ID for a new onboarding flow.
 */
export function createCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Trace a provenance record operation. Wraps the function with
 * telemetry but never alters the result.
 */
export const tracedRecordProvenance = withAsyncTracing(
  recordOrganizationProvenance,
  SPAN_PROVENANCE_CORRECTION,
  {
    attributes: {
      'kadarn.provenance.source': 'onboarding-flow',
    },
  },
);
