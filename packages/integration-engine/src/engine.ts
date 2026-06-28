import type { IntegrationEvent, IntegrationAdapter } from './types.js';
export async function sendEvent(adapter: IntegrationAdapter, system: string, event: IntegrationEvent, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try { await adapter.sendEvent(system, event); return; }
    catch { if (i === retries - 1) throw new Error(`Failed to send event to ${system} after ${retries} retries`); }
  }
}
