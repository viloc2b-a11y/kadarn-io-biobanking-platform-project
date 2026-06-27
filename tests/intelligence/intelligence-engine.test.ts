import { describe, it, expect } from 'vitest';
import { classify } from '../packages/intelligence-engine/src/engine.js';
import type { IntelligenceAdapter } from '../packages/intelligence-engine/src/types.js';
describe('intelligence engine', () => {
  it('should classify via adapter', async () => {
    const adapter: IntelligenceAdapter = { async classify(t) { return 'oncology'; } };
    const r = await classify(adapter, 'Breast cancer标本');
    expect(r).toBe('oncology');
  });
});
