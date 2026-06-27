import type { GraphQueryAdapter } from './types.js';
export async function findOrganizationsByCapability(adapter: GraphQueryAdapter, capabilities: string[]) {
  return adapter.findOrganizationsByCapability(capabilities);
}
