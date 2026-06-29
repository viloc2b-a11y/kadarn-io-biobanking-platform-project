import { describe, it, expect } from 'vitest';
import { match } from '../packages/matching-engine/src/engine.js';
import type { MatchingAdapter, MatchResult } from '../packages/matching-engine/src/types.js';
const mockAdapter: MatchingAdapter = {
  async searchSpecimens(q) {
    const results: MatchResult[] = [
      { specimenId: 's1', collectionId:'c1', organizationId:'org-a', score:0.9, matchReasons:['Exact type match','Trust >0.8'] },
      { specimenId: 's2', collectionId:'c1', organizationId:'org-a', score:0.7, matchReasons:['Synonym match'] },
      { specimenId: 's3', collectionId:'c2', organizationId:'org-b', score:0.4, matchReasons:['Low trust'] },
    ];
    return q.minTrustScore ? results.filter(r => r.score >= (q.minTrustScore ?? 0) / 100) : results;
  }
};
describe('matching engine', () => {
  it('should return ranked results', async () => {
    const r = await match(mockAdapter, {});
    expect(r.length).toBe(3); expect(r[0].score).toBe(0.9); expect(r[2].score).toBe(0.4);
  });
  it('should respect maxResults', async () => {
    const r = await match(mockAdapter, { maxResults: 2 });
    expect(r.length).toBe(2);
  });
});
