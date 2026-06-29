import type { MatchRequest, MatchResult, MatchingAdapter } from './types';
export async function match(adapter: MatchingAdapter, request: MatchRequest): Promise<MatchResult[]> {
  const results = await adapter.searchSpecimens(request);
  results.sort((a, b) => b.score - a.score);
  return (results).slice(0, request.maxResults ?? 20);
}
