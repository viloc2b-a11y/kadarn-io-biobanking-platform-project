import { describe, it, expect } from 'vitest';
import { startFulfillment, completeFulfillment } from '../packages/fulfillment-engine/src/engine.js';
import type { FulfillmentAdapter } from '../packages/fulfillment-engine/src/types.js';
const mockAdapter: FulfillmentAdapter = { async createFulfillment(r) { return { fulfillmentId:'f-1', status:'started', transactionTwinId:'twin-1' }; }, async recordEvent(id, t, p) {} };
describe('fulfillment engine', () => {
  it('should start fulfillment', async () => {
    const r = await startFulfillment(mockAdapter, { requestId:'r-1', specimenIds:['s1'], organizationId:'o-1' });
    expect(r.status).toBe('started');
  });
  it('should complete fulfillment', async () => {
    await expect(completeFulfillment(mockAdapter, 'f-1', 'twin-1')).resolves.toBeUndefined();
  });
});
