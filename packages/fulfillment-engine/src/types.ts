export interface FulfillmentRequest { requestId: string; specimenIds: string[]; organizationId: string; }
export interface FulfillmentResult { fulfillmentId: string; status: string; transactionTwinId: string; }
export interface FulfillmentAdapter {
  createFulfillment(req: FulfillmentRequest): Promise<FulfillmentResult>;
  recordEvent(twinId: string, eventType: string, payload: Record<string,unknown>): Promise<void>;
}
