// ==========================================================================
// Provenance Recorder — event + graph persistence for critical operations
// ==========================================================================
// Sprint 5: every critical mutation emits ProvenanceRecordRequested AND
// persists to provenance_nodes via upsert_provenance_node (fire-and-forget).
// ==========================================================================

import { publishIntegrationEvent } from '@/lib/event-runtime';
import { createRouteClient } from '@/lib/supabase-server';

/** Must match provenance_node_type enum (025 + 037) */
export const PROVENANCE_NODE_TYPES = [
  'specimen',
  'aliquot',
  'consent',
  'protocol',
  'processing_event',
  'qc_result',
  'shipment',
  'temperature_log',
  'receipt',
  'dataset',
  'document',
  'organization',
  'program',
  'access_request',
  'policy_evaluation',
  'feasibility_assessment',
  'exchange_deal',
  'settlement',
  'workflow_activity',
  'twin_event',
] as const;

export type ProvenanceNodeType = (typeof PROVENANCE_NODE_TYPES)[number];

export interface ProvenanceRecord {
  nodeType: ProvenanceNodeType;
  externalId: string;
  organizationId: string;
  recorded: boolean;
}

export interface RecordProvenanceInput {
  nodeType: ProvenanceNodeType;
  externalId: string;
  label: string;
  organizationId: string;
  actorId: string;
  correlationId: string;
  properties?: Record<string, unknown>;
  idempotencyKey?: string;
}

export async function persistProvenanceNode(input: RecordProvenanceInput): Promise<string | null> {
  try {
    const supabase = await createRouteClient();
    const properties = {
      correlationId: input.correlationId,
      actorId: input.actorId,
      ...input.properties,
    };

    const { data, error } = await supabase.rpc('upsert_provenance_node', {
      p_node_type: input.nodeType,
      p_external_id: input.externalId,
      p_label: input.label,
      p_properties: properties,
      p_organization_id: input.organizationId,
    });

    if (error) {
      console.error('[provenance] upsert_provenance_node failed:', error.message);
      return null;
    }

    const result = data as { id?: string } | null;
    return result?.id ?? null;
  } catch (err) {
    console.error('[provenance] persist error:', err);
    return null;
  }
}

/** Record provenance: domain event + graph persistence (non-blocking). */
export function recordProvenance(input: RecordProvenanceInput): ProvenanceRecord {
  const properties = {
    correlationId: input.correlationId,
    ...input.properties,
  };

  const idempotencyKey =
    input.idempotencyKey
    ?? `ProvenanceRecordRequested:${input.nodeType}:${input.externalId}:${input.correlationId}`;

  publishIntegrationEvent(
    'ProvenanceRecordRequested',
    {
      nodeType: input.nodeType,
      externalId: input.externalId,
      label: input.label,
      organizationId: input.organizationId,
      properties,
    },
    {
      actorId: input.actorId,
      organizationId: input.organizationId,
      correlationId: input.correlationId,
      idempotencyKey,
    },
  );

  void persistProvenanceNode(input).catch((err: unknown) => {
    console.error('[provenance] async persist failed:', {
      error: err instanceof Error ? err.message : String(err),
      nodeType: input.nodeType,
      externalId: input.externalId,
      organizationId: input.organizationId,
      correlationId: input.correlationId,
    });
  });

  return {
    nodeType: input.nodeType,
    externalId: input.externalId,
    organizationId: input.organizationId,
    recorded: true,
  };
}

// --------------------------------------------------------------------------
// Domain-specific recorders (Sprint 5 critical operations)
// --------------------------------------------------------------------------

export function recordFeasibilityProvenance(
  assessmentId: string,
  orgId: string,
  programName: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'feasibility_assessment',
    externalId: assessmentId,
    label: `Feasibility: ${programName}`,
    organizationId: orgId,
    actorId,
    correlationId,
  });
}

export function recordExchangeRequestProvenance(
  requestId: string,
  orgId: string,
  title: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'access_request',
    externalId: requestId,
    label: `Exchange request: ${title}`,
    organizationId: orgId,
    actorId,
    correlationId,
  });
}

export function recordAccessRequestDecisionProvenance(
  requestId: string,
  orgId: string,
  action: 'approve' | 'reject',
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'access_request',
    externalId: `${requestId}:${action}`,
    label: `Access request ${action}: ${requestId}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { action, requestId },
  });
}

export function recordDealProvenance(
  dealId: string,
  orgId: string,
  title: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'exchange_deal',
    externalId: dealId,
    label: `Exchange deal: ${title}`,
    organizationId: orgId,
    actorId,
    correlationId,
  });
}

export function recordDealUpdateProvenance(
  dealId: string,
  orgId: string,
  change: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'exchange_deal',
    externalId: `${dealId}:${change}`,
    label: `Deal update: ${change}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { dealId, change },
  });
}

export function recordWorkflowProvenance(
  workflowType: string,
  signal: string,
  entityId: string,
  orgId: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'workflow_activity',
    externalId: `${workflowType}:${signal}:${entityId}`,
    label: `Workflow ${workflowType} → ${signal}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { workflowType, signal, entityId },
  });
}

export function recordCollectionProvenance(
  id: string,
  orgId: string,
  name: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'twin_event',
    externalId: `collection:${id}`,
    label: `Collection twin: ${name}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { twinType: 'collection', collectionId: id },
  });
}

export function recordSpecimenTwinProvenance(
  specimenId: string,
  orgId: string,
  externalId: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'twin_event',
    externalId: `specimen:${specimenId}`,
    label: `Specimen twin: ${externalId}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { twinType: 'specimen', specimenId, externalId },
  });
}

export function recordTwinSyncProvenance(
  twinType: string,
  twinId: string,
  orgId: string,
  status: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'twin_event',
    externalId: `${twinType}:${twinId}:${status}`,
    label: `Twin sync ${twinType} → ${status}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { twinType, twinId, status },
  });
}

export function recordShipmentProvenance(
  id: string,
  orgId: string,
  carrier: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'shipment',
    externalId: id,
    label: `Shipment via ${carrier}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { carrier },
  });
}

export function recordShipmentStatusProvenance(
  shipmentId: string,
  orgId: string,
  fromStatus: string,
  toStatus: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'shipment',
    externalId: `${shipmentId}:${toStatus}`,
    label: `Shipment ${fromStatus} → ${toStatus}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { shipmentId, fromStatus, toStatus },
  });
}

export function recordQcProvenance(
  id: string,
  orgId: string,
  status: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'qc_result',
    externalId: id,
    label: `QC: ${status}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { qcStatus: status },
  });
}

export function recordSettlementProvenance(
  settlementId: string,
  orgId: string,
  amount: number | null,
  actorId: string,
  correlationId: string,
  change?: string,
): ProvenanceRecord {
  const externalId = change ? `${settlementId}:${change}` : settlementId;
  return recordProvenance({
    nodeType: 'settlement',
    externalId,
    label: change ? `Settlement ${change}: ${amount ?? 0}` : `Settlement: ${amount ?? 0}`,
    organizationId: orgId,
    actorId,
    correlationId,
    properties: { settlementId, amount, change },
  });
}

export function recordOrganizationProvenance(
  org: { id: string; name: string; country: string },
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'organization',
    externalId: org.id,
    label: org.name,
    organizationId: org.id,
    actorId,
    correlationId,
    properties: { country: org.country },
  });
}

export function recordPolicyEvaluationProvenance(
  decisionId: string,
  orgId: string,
  resourceType: string,
  action: string,
  opaDecision: string,
  actorId: string,
  correlationId: string,
): ProvenanceRecord {
  return recordProvenance({
    nodeType: 'policy_evaluation',
    externalId: decisionId,
    label: `Policy shadow: ${resourceType} ${action} → ${opaDecision}`,
    organizationId: orgId || actorId,
    actorId,
    correlationId,
    properties: { resourceType, action, opaDecision },
  });
}
