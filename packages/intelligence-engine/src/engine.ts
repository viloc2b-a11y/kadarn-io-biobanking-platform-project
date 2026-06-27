import type { IntelligenceAdapter } from './types.js';
export async function classify(adapter: IntelligenceAdapter, text: string, context: Record<string,unknown> = {}): Promise<string> {
  return adapter.classify(text, context);
}
