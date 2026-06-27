import { describe, it, expect } from 'vitest';
import { sendEvent } from '../packages/integration-engine/src/engine.js';
import type { IntegrationAdapter } from '../packages/integration-engine/src/types.js';
describe('integration engine', () => {
  it('should send event successfully', async () => {
    let called = false;
    const adapter: IntegrationAdapter = { async sendEvent(s, e) { called = true; } };
    await sendEvent(adapter, 'lims', { source:'kadarn', eventType:'SpecimenCollected', payload:{} });
    expect(called).toBe(true);
  });
  it('should retry on failure', async () => {
    let attempts = 0;
    const adapter: IntegrationAdapter = { async sendEvent(s, e) { attempts++; throw new Error('timeout'); } };
    await expect(sendEvent(adapter, 'lims', { source:'kadarn', eventType:'SpecimenCollected', payload:{} }, 2)).rejects.toThrow('after 2 retries');
    expect(attempts).toBe(2);
  });
});
