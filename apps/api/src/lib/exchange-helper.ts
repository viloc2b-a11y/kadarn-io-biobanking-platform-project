// ==========================================================================
// Kadarn Exchange — Cross-Engine Integration Helper
// ==========================================================================

import { SPAN_PROVENANCE_CORRECTION, withAsyncTracing } from '@kadarn/telemetry';
import { publishIntegrationEvent } from '@/lib/event-runtime';
import type { EmittedEvent } from '@/lib/event-runtime';
import {
  recordFeasibilityProvenance as recordFeasibility,
  recordExchangeRequestProvenance as recordExchangeRequest,
  recordDealProvenance as recordDeal,
  recordDealUpdateProvenance,
  recordAccessRequestDecisionProvenance,
  recordWorkflowProvenance,
  type ProvenanceRecord,
} from '@/lib/provenance-recorder';

export type { EmittedEvent, ProvenanceRecord };
export {
  recordDealUpdateProvenance,
  recordAccessRequestDecisionProvenance,
  recordWorkflowProvenance,
};

function emit(type: Parameters<typeof publishIntegrationEvent>[0], payload: Record<string, unknown>, ctx: {
  actorId: string;
  organizationId?: string | null;
  correlationId: string;
  idempotencyKey?: string;
}): EmittedEvent {
  return publishIntegrationEvent(type, payload, ctx);
}

export function emitFeasibilityCompleted(
  assessmentId: string, orgId: string, programName: string, score: number, actorId: string, correlationId: string,
): EmittedEvent {
  return emit('FeasibilityAssessmentCompleted', { assessmentId, organizationId: orgId, programName, score, completedBy: actorId }, {
    actorId, organizationId: orgId, correlationId, idempotencyKey: `FeasibilityAssessmentCompleted:${assessmentId}`,
  });
}

export function emitAccessRequestSubmitted(
  requestId: string, programId: string | null, researcherId: string, requirements: Record<string, unknown>, orgId: string, actorId: string, correlationId: string,
): EmittedEvent {
  return emit('AccessRequestSubmitted', { requestId, programId: programId ?? '', researcherId, requirements }, {
    actorId, organizationId: orgId, correlationId, idempotencyKey: `AccessRequestSubmitted:${requestId}`,
  });
}

export function emitExchangeDealCreated(
  dealId: string, requestId: string, sponsorOrgId: string, providerOrgId: string, title: string, totalValue: number | null, actorId: string, correlationId: string,
): EmittedEvent {
  return emit('ExchangeDealCreated', { dealId, requestId, sponsorOrgId, providerOrgId, title, totalValue, createdBy: actorId }, {
    actorId, organizationId: sponsorOrgId, correlationId, idempotencyKey: `ExchangeDealCreated:${dealId}`,
  });
}

export const recordFeasibilityProvenance = (
  assessmentId: string, orgId: string, programName: string, actorId: string, correlationId: string,
) => recordFeasibility(assessmentId, orgId, programName, actorId, correlationId);

export const recordExchangeRequestProvenance = (
  requestId: string, orgId: string, title: string, actorId: string, correlationId: string,
) => recordExchangeRequest(requestId, orgId, title, actorId, correlationId);

export const recordDealProvenance = (
  dealId: string, orgId: string, title: string, actorId: string, correlationId: string,
) => recordDeal(dealId, orgId, title, actorId, correlationId);

export interface WorkflowSignal {
  workflowType: string;
  signal: string;
  payload: Record<string, unknown>;
  correlationId: string;
  signaled: boolean;
}

export function signalExchangeRequestWorkflow(
  requestId: string,
  requesterOrgId: string,
  providerOrgId: string,
  requesterName: string,
  actorId: string,
  correlationId: string,
): WorkflowSignal {
  publishIntegrationEvent('WorkflowSignalRequested', {
    workflowType: 'exchange-request-workflow',
    signal: 'submit',
    payload: { requestId, requesterOrgId, providerOrgId, requesterName },
  }, {
    actorId,
    organizationId: requesterOrgId,
    correlationId,
    idempotencyKey: `WorkflowSignalRequested:exchange-request-workflow:submit:${requestId}`,
  });

  recordWorkflowProvenance(
    'exchange-request-workflow',
    'submit',
    requestId,
    requesterOrgId,
    actorId,
    correlationId,
  );

  return {
    workflowType: 'exchange-request-workflow',
    signal: 'submit',
    payload: { requestId, requesterOrgId, providerOrgId, requesterName },
    correlationId,
    signaled: true,
  };
}

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export const tracedRecordFeasibility = withAsyncTracing(recordFeasibilityProvenance, SPAN_PROVENANCE_CORRECTION);
export const tracedRecordRequest = withAsyncTracing(recordExchangeRequestProvenance, SPAN_PROVENANCE_CORRECTION);
export const tracedRecordDeal = withAsyncTracing(recordDealProvenance, SPAN_PROVENANCE_CORRECTION);
