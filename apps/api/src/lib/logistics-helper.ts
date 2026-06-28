// ==========================================================================
// Kadarn Logistics — Cross-Engine Integration Helper
// ==========================================================================

import { publishIntegrationEvent } from '@/lib/event-runtime';
import type { EmittedEvent } from '@/lib/event-runtime';
import {
  recordCollectionProvenance as recordCollection,
  recordShipmentProvenance as recordShipment,
  recordShipmentStatusProvenance,
  recordQcProvenance as recordQc,
  recordSettlementProvenance as recordSettlement,
  recordSpecimenTwinProvenance,
  recordTwinSyncProvenance,
  type ProvenanceRecord,
} from '@/lib/provenance-recorder';

export type { EmittedEvent, ProvenanceRecord };
export { recordShipmentStatusProvenance, recordSpecimenTwinProvenance, recordTwinSyncProvenance };

function emit(type: Parameters<typeof publishIntegrationEvent>[0], payload: Record<string, unknown>, ctx: {
  actorId: string; organizationId?: string | null; correlationId: string; idempotencyKey?: string;
}): EmittedEvent {
  return publishIntegrationEvent(type, payload, ctx);
}

export function emitCollectionCreated(collectionId: string, orgId: string, name: string, actorId: string, correlationId: string) {
  return emit('CollectionCreated', { collectionId, organizationId: orgId, name, createdBy: actorId }, {
    actorId, organizationId: orgId, correlationId, idempotencyKey: `CollectionCreated:${collectionId}`,
  });
}

export function emitShipmentCreated(shipmentId: string, orgId: string, programId: string, carrier: string, actorId: string, correlationId: string) {
  return emit('ShipmentCreated', { shipmentId, organizationId: orgId, programId, carrier, createdBy: actorId }, {
    actorId, organizationId: orgId, correlationId, idempotencyKey: `ShipmentCreated:${shipmentId}`,
  });
}

export function emitShipmentStatusChanged(shipmentId: string, orgId: string, fromStatus: string, toStatus: string, actorId: string, correlationId: string) {
  return emit('ShipmentStatusChanged', { shipmentId, organizationId: orgId, fromStatus, toStatus, changedBy: actorId }, {
    actorId, organizationId: orgId, correlationId, idempotencyKey: `ShipmentStatusChanged:${shipmentId}:${toStatus}:${correlationId}`,
  });
}

export function emitQcCompleted(aliquotId: string, sampleId: string, qcStatus: string, orgId: string, actorId: string, correlationId: string) {
  return emit('QcCompleted', { aliquotId, sampleId, qcStatus, organizationId: orgId, completedBy: actorId }, {
    actorId, organizationId: orgId, correlationId, idempotencyKey: `QcCompleted:${aliquotId}:${qcStatus}`,
  });
}

export function emitSettlementInitiated(dealId: string, orgId: string, amount: number | null, actorId: string, correlationId: string) {
  return emit('SettlementInitiated', { dealId, organizationId: orgId, amount, initiatedBy: actorId }, {
    actorId, organizationId: orgId, correlationId, idempotencyKey: `SettlementInitiated:${dealId}`,
  });
}

export const recordCollectionProvenance = (id: string, orgId: string, name: string, actorId: string, cId: string) =>
  recordCollection(id, orgId, name, actorId, cId);

export const recordShipmentProvenance = (id: string, orgId: string, carrier: string, actorId: string, cId: string) =>
  recordShipment(id, orgId, carrier, actorId, cId);

export const recordQcProvenance = (id: string, orgId: string, status: string, actorId: string, cId: string) =>
  recordQc(id, orgId, status, actorId, cId);

export const recordSettlementProvenance = (
  settlementId: string,
  orgId: string,
  amount: number | null,
  actorId: string,
  cId: string,
  change?: string,
) => recordSettlement(settlementId, orgId, amount, actorId, cId, change);

export interface TrustEvaluation { trustScore: number; providerOrgId: string; evaluatedAt: string; }

export function evaluateProviderTrust(providerOrgId: string): TrustEvaluation {
  const score = 0.85;
  const evaluatedAt = new Date().toISOString();
  publishIntegrationEvent('TrustScoreEvaluated', {
    providerOrgId,
    trustScore: score,
    evaluatedAt,
  }, {
    actorId: providerOrgId,
    organizationId: providerOrgId,
    correlationId: crypto.randomUUID(),
  });
  return { trustScore: score, providerOrgId, evaluatedAt };
}

export interface SettlementRecord { dealId: string; settled: boolean; note: string; }

export function initiateSettlement(dealId: string, amount: number | null): SettlementRecord {
  const note = amount != null ? `Settlement of ${amount} initiated` : 'Settlement initiated (no amount set)';
  return { dealId, settled: true, note };
}

export { createCorrelationId } from './exchange-helper';
