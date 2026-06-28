// ==========================================================================
// Kadarn Logistics — Cross-Engine Integration Helper
// ==========================================================================
// For KPV-02b: Collection → Shipment → QC → Acceptance → Settlement
// All hooks fire-and-forget — never block the response.
// ==========================================================================

// ---------------------------------------------------------------------------
// Domain event stubs
// ---------------------------------------------------------------------------

export interface EmittedEvent {
  type: string;
  payload: Record<string, unknown>;
  actorId: string;
  organizationId: string | null;
  correlationId: string;
}

function emit(type: string, payload: Record<string, unknown>, ctx: {
  actorId: string; organizationId?: string | null; correlationId: string;
}): EmittedEvent {
  const event: EmittedEvent = { type, payload, actorId: ctx.actorId, organizationId: ctx.organizationId ?? null, correlationId: ctx.correlationId };
  console.log(JSON.stringify({ type: 'domain_event', event, timestamp: new Date().toISOString() }));
  return event;
}

export function emitCollectionCreated(collectionId: string, orgId: string, name: string, actorId: string, correlationId: string) {
  return emit('CollectionCreated', { collectionId, organizationId: orgId, name, createdBy: actorId }, { actorId, organizationId: orgId, correlationId });
}

export function emitShipmentCreated(shipmentId: string, orgId: string, programId: string, carrier: string, actorId: string, correlationId: string) {
  return emit('ShipmentCreated', { shipmentId, organizationId: orgId, programId, carrier, createdBy: actorId }, { actorId, organizationId: orgId, correlationId });
}

export function emitShipmentStatusChanged(shipmentId: string, orgId: string, fromStatus: string, toStatus: string, actorId: string, correlationId: string) {
  return emit('ShipmentStatusChanged', { shipmentId, organizationId: orgId, fromStatus, toStatus, changedBy: actorId }, { actorId, organizationId: orgId, correlationId });
}

export function emitQcCompleted(aliquotId: string, sampleId: string, qcStatus: string, orgId: string, actorId: string, correlationId: string) {
  return emit('QcCompleted', { aliquotId, sampleId, qcStatus, organizationId: orgId, completedBy: actorId }, { actorId, organizationId: orgId, correlationId });
}

export function emitSettlementInitiated(dealId: string, orgId: string, amount: number | null, actorId: string, correlationId: string) {
  return emit('SettlementInitiated', { dealId, organizationId: orgId, amount, initiatedBy: actorId }, { actorId, organizationId: orgId, correlationId });
}

// ---------------------------------------------------------------------------
// Provenance recording stubs
// ---------------------------------------------------------------------------

export interface ProvenanceRecord { nodeType: string; externalId: string; organizationId: string; recorded: boolean; }

async function record(kind: string, id: string, label: string, orgId: string, _correlationId: string): Promise<ProvenanceRecord> {
  return { nodeType: kind, externalId: id, organizationId: orgId, recorded: true };
}

export const recordCollectionProvenance = (id: string, orgId: string, name: string, cId: string) => record('collection_twin', id, `Collection: ${name}`, orgId, cId);
export const recordShipmentProvenance = (id: string, orgId: string, carrier: string, cId: string) => record('shipment', id, `Shipment via ${carrier}`, orgId, cId);
export const recordQcProvenance = (id: string, orgId: string, status: string, cId: string) => record('qc_result', id, `QC: ${status}`, orgId, cId);
export const recordSettlementProvenance = (dealId: string, orgId: string, amount: number | null, cId: string) => record('settlement', dealId, `Settlement: ${amount ?? 0}`, orgId, cId);

// ---------------------------------------------------------------------------
// Trust evaluation stub
// ---------------------------------------------------------------------------

export interface TrustEvaluation { trustScore: number; providerOrgId: string; evaluatedAt: string; }

export function evaluateProviderTrust(providerOrgId: string): TrustEvaluation {
  const score = 0.85; // stub: in production, call trust-engine
  console.log(JSON.stringify({ type: 'trust_evaluation', providerOrgId, score, timestamp: new Date().toISOString() }));
  return { trustScore: score, providerOrgId, evaluatedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Settlement stub
// ---------------------------------------------------------------------------

export interface SettlementRecord { dealId: string; settled: boolean; note: string; }

export function initiateSettlement(dealId: string, amount: number | null): SettlementRecord {
  const note = amount != null ? `Settlement of ${amount} initiated` : 'Settlement initiated (no amount set)';
  if (amount == null) {
    console.warn('[SETTLEMENT] No amount provided — financial-engine is stub');
  }
  return { dealId, settled: true, note };
}

// ---------------------------------------------------------------------------
// Correlation
// ---------------------------------------------------------------------------

export function createCorrelationId(): string {
  return crypto.randomUUID();
}
