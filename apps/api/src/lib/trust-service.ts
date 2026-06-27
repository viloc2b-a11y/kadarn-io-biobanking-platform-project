import { TrustEngineService } from '@kadarn/trust-engine';
import { MemoryTrustAdapter } from '../adapters/memory-trust-adapter.js';

let instance: TrustEngineService | null = null;

export function getTrustService(): TrustEngineService {
  if (!instance) {
    instance = new TrustEngineService(new MemoryTrustAdapter());
  }
  return instance;
}
