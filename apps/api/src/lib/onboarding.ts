// ==========================================================================
// Kadarn Onboarding — Cross-Engine Integration Helper
// ==========================================================================

import {
  SPAN_PROVENANCE_CORRECTION,
  withAsyncTracing,
} from '@kadarn/telemetry';
import type { OrganizationCreatedPayload } from '@kadarn/domain-events';
import { publishIntegrationEvent } from '@/lib/event-runtime';
import type { EmittedEvent } from '@/lib/event-runtime';
import {
  recordOrganizationProvenance as recordOrganization,
  type ProvenanceRecord,
} from '@/lib/provenance-recorder';

export type { EmittedEvent, ProvenanceRecord };

export function emitDomainEvent(
  type: string,
  payload: Record<string, unknown>,
  context: {
    actorId: string;
    organizationId?: string | null;
    correlationId: string;
    idempotencyKey?: string;
  },
): EmittedEvent {
  return publishIntegrationEvent(
    type as Parameters<typeof publishIntegrationEvent>[0],
    payload,
    context,
  );
}

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
    idempotencyKey: `OrganizationCreated:${org.id}`,
  });
}

export function recordOrganizationProvenance(
  org: { id: string; name: string; country: string; created_at?: string },
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordOrganization(
    { id: org.id, name: org.name, country: org.country },
    actorId,
    correlationId,
  );
}

export async function evaluateCreateOrgPolicy(
  actorId: string,
  actorRole: string,
  organizationId: string,
  correlationId: string,
): Promise<{ evaluated: boolean; correlationId: string }> {
  publishIntegrationEvent('PolicyShadowEvaluated', {
    actorId,
    actorRole,
    organizationId,
    correlationId,
  }, {
    actorId,
    organizationId,
    correlationId,
    idempotencyKey: `PolicyShadowEvaluated:${organizationId}:${correlationId}`,
  });

  return { evaluated: true, correlationId };
}

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export const tracedRecordProvenance = withAsyncTracing(
  recordOrganizationProvenance,
  SPAN_PROVENANCE_CORRECTION,
  {
    attributes: {
      'kadarn.provenance.source': 'onboarding-flow',
    },
  },
);
