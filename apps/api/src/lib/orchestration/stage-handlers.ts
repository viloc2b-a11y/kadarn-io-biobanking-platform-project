// ==========================================================================
// Engine Orchestration — Stage handlers (connects all engines)
// ==========================================================================

import { evaluate, type Policy } from '@kadarn/policy-engine';
import {
  createInitialShipmentState,
  applyShipmentEvent,
} from '@kadarn/operational-twins';
import {
  SPAN_POLICY_EVALUATION,
  SPAN_WORKFLOW_ACTIVITY,
  SPAN_PROVENANCE_CORRECTION,
  SPAN_PIPELINE_STAGE,
  incrementCounter,
  observeHistogram,
  logInfo,
  getTraceContext,
  METRIC_PIPELINE_STAGE_DURATION,
} from '@kadarn/telemetry';
import { publishIntegrationEvent } from '@/lib/event-runtime';
import { evaluateTrustForPipeline, recordTrustFromSettlement } from '@/lib/trust-runtime';
import { scheduleFinancialRuntime } from '@/lib/financial-runtime';
import { runDiscoveryFabricStage, runKnowledgeFabricStage } from '@/lib/knowledge-runtime';
import { enrichTwinWithKnowledge } from '@/lib/graph-fabric-runtime';
import {
  emitAccessRequestSubmitted,
  emitExchangeDealCreated,
  emitFeasibilityCompleted,
  signalExchangeRequestWorkflow,
  recordExchangeRequestProvenance,
  recordAccessRequestDecisionProvenance,
  recordDealProvenance,
  recordDealUpdateProvenance,
  recordFeasibilityProvenance,
} from '@/lib/exchange-helper';
import {
  emitCollectionCreated,
  emitShipmentCreated,
  emitShipmentStatusChanged,
  emitQcCompleted,
  emitSettlementInitiated,
  recordCollectionProvenance,
  recordShipmentProvenance,
  recordShipmentStatusProvenance,
  recordQcProvenance,
  recordSettlementProvenance,
  recordSpecimenTwinProvenance,
  recordTwinSyncProvenance,
} from '@/lib/logistics-helper';
import {
  emitOrganizationCreated,
  recordOrganizationProvenance,
} from '@/lib/onboarding';
import type { PipelineContext, PipelineName, PipelinePayload, PipelineStage } from './types';

function pub(
  type: Parameters<typeof publishIntegrationEvent>[0],
  payload: Record<string, unknown>,
  ctx: PipelineContext,
  idempotencyKey: string,
): void {
  publishIntegrationEvent(type, payload, {
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    programId: ctx.programId,
    correlationId: ctx.correlationId,
    idempotencyKey,
  });
}

function stageKey(pipeline: PipelineName, stage: PipelineStage, ctx: PipelineContext): string {
  return `PipelineStageCompleted:${pipeline}:${stage}:${ctx.correlationId}`;
}

export function executeStage(
  stage: PipelineStage,
  pipeline: PipelineName,
  ctx: PipelineContext,
  payload: PipelinePayload,
): void {
  const started = performance.now();

  switch (stage) {
    case 'discovery':
      runDiscoveryStage(pipeline, ctx, payload);
      break;
    case 'knowledge':
      runKnowledgeStage(ctx, payload);
      break;
    case 'exchange':
      runExchangeStage(pipeline, ctx, payload);
      break;
    case 'policy':
      runPolicyStage(ctx, payload);
      break;
    case 'workflow':
      runWorkflowStage(pipeline, ctx, payload);
      break;
    case 'provenance':
      runProvenanceStage(pipeline, ctx, payload);
      break;
    case 'trust':
      runTrustStage(ctx, payload);
      break;
    case 'financial':
      runFinancialStage(pipeline, ctx, payload);
      break;
    case 'analytics':
      runAnalyticsStage(pipeline, ctx, payload);
      break;
    case 'twins':
      runTwinsStage(pipeline, ctx, payload);
      break;
    case 'telemetry':
      runTelemetryStage(pipeline, ctx, payload);
      break;
    default:
      break;
  }

  pub(
    'PipelineStageCompleted',
    { pipeline, stage, organizationId: ctx.organizationId },
    ctx,
    stageKey(pipeline, stage, ctx),
  );

  const durationMs = performance.now() - started;
  observeHistogram(METRIC_PIPELINE_STAGE_DURATION, durationMs, { pipeline, stage });
  incrementCounter('kadarn_pipeline_stage_total', { pipeline, stage, status: 'ok' });
}

function runDiscoveryStage(pipeline: PipelineName, ctx: PipelineContext, payload: PipelinePayload): void {
  void runDiscoveryFabricStage(ctx, payload, pipeline).catch(err => {
    console.error('[knowledge-fabric] discovery stage failed:', err);
  });
}

function runKnowledgeStage(ctx: PipelineContext, payload: PipelinePayload): void {
  void runKnowledgeFabricStage(ctx, payload).catch(err => {
    console.error('[knowledge-fabric] knowledge stage failed:', err);
  });
}

function runExchangeStage(pipeline: PipelineName, ctx: PipelineContext, payload: PipelinePayload): void {
  const orgId = ctx.organizationId ?? '';
  switch (pipeline) {
    case 'exchange-request':
      emitAccessRequestSubmitted(
        String(payload.requestId),
        (payload.programId as string | null) ?? null,
        ctx.actorId,
        { title: payload.title, sampleCount: payload.sampleCount },
        orgId,
        ctx.actorId,
        ctx.correlationId,
      );
      break;
    case 'exchange-request-decision':
      if (payload.action === 'approve' || payload.action === 'reject') {
        pub(
          payload.action === 'approve' ? 'AccessRequestApproved' : 'AccessRequestRejected',
          payload.action === 'approve'
            ? { requestId: payload.requestId, programId: payload.programId ?? '', approvedBy: ctx.actorId }
            : { requestId: payload.requestId, programId: payload.programId ?? '', rejectedBy: ctx.actorId, reason: payload.reason ?? 'declined' },
          ctx,
          `${payload.action}:${payload.requestId}`,
        );
      }
      break;
    case 'exchange-deal':
      emitExchangeDealCreated(
        String(payload.dealId),
        String(payload.requestId ?? ''),
        String(payload.sponsorOrgId ?? orgId),
        String(payload.providerOrgId ?? ''),
        String(payload.title ?? ''),
        (payload.totalValue as number | null) ?? null,
        ctx.actorId,
        ctx.correlationId,
      );
      break;
    case 'feasibility':
      emitFeasibilityCompleted(
        String(payload.assessmentId),
        orgId,
        String(payload.programName ?? ''),
        Number(payload.score ?? 0),
        ctx.actorId,
        ctx.correlationId,
      );
      break;
    case 'settlement':
      emitSettlementInitiated(
        String(payload.dealId ?? payload.settlementId),
        orgId,
        (payload.amount as number | null) ?? null,
        ctx.actorId,
        ctx.correlationId,
      );
      break;
    case 'shipment':
      emitShipmentCreated(
        String(payload.shipmentId),
        orgId,
        String(payload.programId ?? ''),
        String(payload.carrier ?? ''),
        ctx.actorId,
        ctx.correlationId,
      );
      break;
    case 'shipment-status':
      emitShipmentStatusChanged(
        String(payload.shipmentId),
        orgId,
        String(payload.fromStatus ?? ''),
        String(payload.toStatus ?? ''),
        ctx.actorId,
        ctx.correlationId,
      );
      break;
    case 'qc':
      emitQcCompleted(
        String(payload.aliquotId),
        String(payload.sampleId ?? ''),
        String(payload.qcStatus ?? ''),
        orgId,
        ctx.actorId,
        ctx.correlationId,
      );
      break;
    case 'collection-twin':
      emitCollectionCreated(
        String(payload.collectionId),
        orgId,
        String(payload.name ?? ''),
        ctx.actorId,
        ctx.correlationId,
      );
      break;
    case 'organization-onboard':
      emitOrganizationCreated(
        {
          id: String(payload.organizationId),
          name: String(payload.name ?? ''),
          country: String(payload.country ?? ''),
        },
        ctx.actorId,
        ctx.correlationId,
      );
      break;
    default:
      break;
  }
}

function runPolicyStage(ctx: PipelineContext, payload: PipelinePayload): void {
  const policy: Policy = {
    id: 'orchestrator.governance',
    name: 'Orchestrator Governance',
    domain: 'governance',
    status: 'active',
    version: 1,
    priority: 100,
    rules: [
      {
        id: 'allow-active-org',
        condition: { eq: [{ var: 'organizationId' }, { var: 'organizationId' }] },
        effect: 'allow',
        reason: 'Active organization context required',
      },
    ],
    metadata: {},
  };

  const result = evaluate(policy, {
    organizationId: ctx.organizationId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole ?? payload.actorRole ?? 'org_member',
  });

  pub(
    'PolicyShadowEvaluated',
    {
      actorId: ctx.actorId,
      actorRole: String(ctx.actorRole ?? payload.actorRole ?? 'org_member'),
      organizationId: ctx.organizationId ?? '',
      correlationId: ctx.correlationId,
    },
    ctx,
    `PolicyShadowEvaluated:${ctx.correlationId}:${result.policyId}`,
  );
}

function runWorkflowStage(pipeline: PipelineName, ctx: PipelineContext, payload: PipelinePayload): void {
  if (pipeline === 'exchange-request') {
    signalExchangeRequestWorkflow(
      String(payload.requestId),
      ctx.organizationId ?? '',
      String(payload.providerOrgId ?? 'unknown'),
      String(payload.requesterName ?? ctx.actorId),
      ctx.actorId,
      ctx.correlationId,
    );
  } else if (pipeline === 'exchange-request-decision' && payload.action === 'approve') {
    pub(
      'WorkflowSignalRequested',
      {
        workflowType: 'exchange-request-workflow',
        signal: 'reviewerAction',
        payload: { requestId: payload.requestId, action: 'approve' },
      },
      ctx,
      `WorkflowSignalRequested:approve:${payload.requestId}`,
    );
  } else if (pipeline === 'shipment') {
    pub(
      'WorkflowSignalRequested',
      {
        workflowType: 'shipment-logistics-workflow',
        signal: 'schedule',
        payload: { shipmentId: payload.shipmentId },
      },
      ctx,
      `WorkflowSignalRequested:shipment:${payload.shipmentId}`,
    );
  }
}

function runProvenanceStage(pipeline: PipelineName, ctx: PipelineContext, payload: PipelinePayload): void {
  const orgId = ctx.organizationId ?? '';
  const actorId = ctx.actorId;

  switch (pipeline) {
    case 'exchange-request':
      recordExchangeRequestProvenance(String(payload.requestId), orgId, String(payload.title ?? ''), actorId, ctx.correlationId);
      break;
    case 'exchange-request-decision':
      recordAccessRequestDecisionProvenance(
        String(payload.requestId),
        orgId,
        payload.action === 'approve' ? 'approve' : 'reject',
        actorId,
        ctx.correlationId,
      );
      break;
    case 'exchange-deal':
      recordDealProvenance(String(payload.dealId), orgId, String(payload.title ?? ''), actorId, ctx.correlationId);
      break;
    case 'exchange-deal-update':
      for (const change of (payload.changes as string[] | undefined) ?? []) {
        recordDealUpdateProvenance(String(payload.dealId), orgId, change, actorId, ctx.correlationId);
      }
      break;
    case 'feasibility':
      recordFeasibilityProvenance(String(payload.assessmentId), orgId, String(payload.programName ?? ''), actorId, ctx.correlationId);
      break;
    case 'settlement':
      recordSettlementProvenance(String(payload.settlementId), orgId, (payload.amount as number | null) ?? null, actorId, ctx.correlationId);
      break;
    case 'settlement-update':
      recordSettlementProvenance(
        String(payload.settlementId),
        orgId,
        (payload.amount as number | null) ?? null,
        actorId,
        ctx.correlationId,
        String(payload.statusChange ?? 'updated'),
      );
      break;
    case 'shipment':
      recordShipmentProvenance(String(payload.shipmentId), orgId, String(payload.carrier ?? ''), actorId, ctx.correlationId);
      break;
    case 'shipment-status':
      recordShipmentStatusProvenance(
        String(payload.shipmentId),
        orgId,
        String(payload.fromStatus ?? ''),
        String(payload.toStatus ?? ''),
        actorId,
        ctx.correlationId,
      );
      break;
    case 'qc':
      recordQcProvenance(String(payload.aliquotId), orgId, String(payload.qcStatus ?? ''), actorId, ctx.correlationId);
      break;
    case 'collection-twin':
      recordCollectionProvenance(String(payload.collectionId), orgId, String(payload.name ?? ''), actorId, ctx.correlationId);
      break;
    case 'specimen-twin':
      recordSpecimenTwinProvenance(
        String(payload.specimenId),
        orgId,
        String(payload.externalId ?? ''),
        actorId,
        ctx.correlationId,
      );
      break;
    case 'organization-onboard':
      recordOrganizationProvenance(
        {
          id: String(payload.organizationId),
          name: String(payload.name ?? ''),
          country: String(payload.country ?? ''),
        },
        actorId,
        ctx.correlationId,
      );
      break;
    default:
      break;
  }
}

function runTrustStage(ctx: PipelineContext, payload: PipelinePayload): void {
  void (async () => {
    await evaluateTrustForPipeline(ctx, payload);

    const statusChange = payload.statusChange as string | undefined;
    const organizationId = String(
      payload.providerOrgId ?? payload.targetOrgId ?? ctx.organizationId ?? '',
    );
    const settlementId = String(payload.settlementId ?? '');

    if (statusChange && organizationId && settlementId) {
      await recordTrustFromSettlement({
        organizationId,
        settlementId,
        toStatus: statusChange,
        actorId: ctx.actorId,
        correlationId: ctx.correlationId,
      });
    }
  })().catch(err => {
    console.error('[trust-runtime] pipeline stage failed:', err);
  });
}

function runFinancialStage(_pipeline: PipelineName, ctx: PipelineContext, payload: PipelinePayload): void {
  scheduleFinancialRuntime(ctx, payload);
}

function runAnalyticsStage(pipeline: PipelineName, ctx: PipelineContext, payload: PipelinePayload): void {
  pub(
    'AnalyticsProjectionRequested',
    {
      projectionType: pipeline,
      entityType: String(payload.entityType ?? pipeline),
      entityId: String(payload.entityId ?? payload.requestId ?? payload.shipmentId ?? payload.dealId ?? ctx.correlationId),
      organizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
    },
    ctx,
    `AnalyticsProjectionRequested:${pipeline}:${ctx.correlationId}`,
  );
}

function runTwinsStage(pipeline: PipelineName, ctx: PipelineContext, payload: PipelinePayload): void {
  if (pipeline === 'specimen-twin' || pipeline === 'collection-twin') {
    void enrichTwinWithKnowledge(ctx, { ...payload, pipeline }).catch(err => {
      console.error('[knowledge-fabric] twin enrichment failed:', err);
    });
  }

  if (pipeline === 'shipment' || pipeline === 'shipment-status') {
    const shipmentId = String(payload.shipmentId);
    let state = createInitialShipmentState(shipmentId, ctx.organizationId ?? '');
    if (pipeline === 'shipment') {
      state = applyShipmentEvent(state, {
        eventType: 'ShipmentScheduled',
        payload: {
          courier: payload.carrier,
          originOrgId: payload.originOrgId,
          destinationOrgId: payload.destinationOrgId,
        },
      });
    } else {
      state = applyShipmentEvent(state, {
        eventType: 'ShipmentDelivered',
        payload: { deliveredAt: new Date().toISOString() },
      });
      recordTwinSyncProvenance(
        'shipment',
        shipmentId,
        ctx.organizationId ?? '',
        String(payload.toStatus ?? state.status),
        ctx.actorId,
        ctx.correlationId,
      );
    }
  }
}

function runTelemetryStage(pipeline: PipelineName, ctx: PipelineContext, payload: PipelinePayload): void {
  const trace = getTraceContext();
  logInfo('pipeline.completed', {
    pipeline,
    correlationId: ctx.correlationId,
    organizationId: ctx.organizationId ?? undefined,
    route: payload.route as string | undefined,
    traceId: trace.traceId,
    spanId: trace.spanId,
  });

  void SPAN_PIPELINE_STAGE;
  void SPAN_POLICY_EVALUATION;
  void SPAN_WORKFLOW_ACTIVITY;
  void SPAN_PROVENANCE_CORRECTION;
}
