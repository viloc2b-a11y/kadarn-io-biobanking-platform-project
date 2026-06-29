import type { FulfillmentRequest, FulfillmentResult, FulfillmentAdapter } from './types.js';
export async function startFulfillment(adapter: FulfillmentAdapter, req: FulfillmentRequest): Promise<FulfillmentResult> {
  const result = await adapter.createFulfillment(req);
  await adapter.recordEvent(result.transactionTwinId, 'FulfillmentStarted', { requestId: req.requestId, specimenIds: req.specimenIds });
  return result;
}
export async function completeFulfillment(adapter: FulfillmentAdapter, fulfillmentId: string, twinId: string): Promise<void> {
  await adapter.recordEvent(twinId, 'FulfillmentCompleted', { fulfillmentId });
}
