// ==========================================================================
// Kadarn Exchange — Cross-Engine Integration Helper
// ==========================================================================
// Lightweight module connecting exchange routes to provenance, telemetry,
// domain events, and workflow stubs.
//
// Follows the same pattern as onboarding.ts — all hooks are fire-and-forget.
// ==========================================================================

import { getCorrelationId } from '@kadarn/instrumentation';
import { SPAN_PROVENANCE_CORRECTION, withAsyncTracing } from '@kadarn/telemetry';

// ---------------------------------------------------------------------------
// Domain event emission (stubs)
// ---------------------------------------------------------------------------

export interface EmittedEvent {
  type: string;
  payload: Record<string, unknown>;
  actorId: string;
  organizationId: string | null;
  correlationId: string;
}

function emit(type: string, payload: Record<string, unknown>, ctx: {
  actorId: string;
  organizationId?: string | null;
  correlationId: string;
}): EmittedEvent {
  const event: EmittedEvent = { type, payload, actorId: ctx.actorId, organizationId: ctx.organizationId ?? null, correlationId: ctx.correlationId };
  console.log(JSON.stringify({ type: 'domain_event', event, timestamp: new Date().toISOString() }));
  return event;
}

export function emitFeasibilityCompleted(
  assessmentId: string, orgId: string, programName: string, score: number, actorId: string, correlationId: string,
): EmittedEvent {
  return emit('FeasibilityAssessmentCompleted', { assessmentId, organizationId: orgId, programName, score, completedBy: actorId }, { actorId, organizationId: orgId, correlationId });
}

export function emitAccessRequestSubmitted(
  requestId: string, programId: string | null, researcherId: string, requirements: Record<string, unknown>, orgId: string, actorId: string, correlationId: string,
): EmittedEvent {
  return emit('AccessRequestSubmitted', { requestId, programId: programId ?? '', researcherId, requirements }, { actorId, organizationId: orgId, correlationId });
}

export function emitExchangeDealCreated(
  dealId: string, requestId: string, sponsorOrgId: string, providerOrgId: string, title: string, totalValue: number | null, actorId: string, correlationId: string,
): EmittedEvent {
  return emit('ExchangeDealCreated', { dealId, requestId, sponsorOrgId, providerOrgId, title, totalValue, createdBy: actorId }, { actorId, organizationId: sponsorOrgId, correlationId });
}

// ---------------------------------------------------------------------------
// Provenance recording stubs
// ---------------------------------------------------------------------------

export interface ProvenanceRecord {
  nodeType: string;
  externalId: string;
  organizationId: string;
  recorded: boolean;
}

async function record(kind: string, externalId: string, label: string, orgId: string, correlationId: string): Promise<ProvenanceRecord> {
  return { nodeType: kind, externalId, organizationId: orgId, recorded: true };
}

export const recordFeasibilityProvenance = (assessmentId: string, orgId: string, programName: string, correlationId: string) =>
  record('feasibility_assessment', assessmentId, `Feasibility: ${programName}`, orgId, correlationId);

export const recordExchangeRequestProvenance = (requestId: string, orgId: string, title: string, correlationId: string) =>
  record('access_request', requestId, `Exchange request: ${title}`, orgId, correlationId);

export const recordDealProvenance = (dealId: string, orgId: string, title: string, correlationId: string) =>
  record('exchange_deal', dealId, `Exchange deal: ${title}`, orgId, correlationId);

export const recordDiscoveryProvenance = (searchQuery: string, orgId: string | null, correlationId: string) =>
  record('discovery_search', `search-${Date.now()}`, `Discovery: ${searchQuery}`, orgId ?? 'system', correlationId);

// ---------------------------------------------------------------------------
// Workflow stub
// ---------------------------------------------------------------------------
// In production, this would signal the Temporal ExchangeRequestWorkflow.
// For KPV-02a, it logs the workflow start event.
// ---------------------------------------------------------------------------

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
  correlationId: string,
): WorkflowSignal {
  const signal: WorkflowSignal = {
    workflowType: 'exchange-request-workflow',
    signal: 'submit',
    payload: { requestId, requesterOrgId, providerOrgId, requesterName },
    correlationId,
    signaled: true,
  };
  console.log(JSON.stringify({ type: 'workflow_signal', signal, timestamp: new Date().toISOString() }));
  return signal;
}

// ---------------------------------------------------------------------------
// Correlation
// ---------------------------------------------------------------------------

export function createCorrelationId(): string {
  return getCorrelationId()
}

// ---------------------------------------------------------------------------
// Traced versions
// ---------------------------------------------------------------------------

export const tracedRecordFeasibility = withAsyncTracing(recordFeasibilityProvenance, SPAN_PROVENANCE_CORRECTION);
export const tracedRecordRequest = withAsyncTracing(recordExchangeRequestProvenance, SPAN_PROVENANCE_CORRECTION);
export const tracedRecordDeal = withAsyncTracing(recordDealProvenance, SPAN_PROVENANCE_CORRECTION);
