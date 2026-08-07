// ==========================================================================
// dashboard-next-best-action Phase A — shared score-free guard
// ==========================================================================
// Design ref: Testing Strategy — "Extend the existing pattern in
// tests/api/sponsor-passport-mock.test.ts:8-21 (FORBIDDEN_FIELD_NAMES +
// collectFieldNames) into a shared guard applied to the marketplace
// response, passport read-model and KPE payload."
// Spec ref: "No Institution-Level Composite Score" (spec id 980).
//
// PR-A note: this list is extended and applied everywhere a surface is
// ALREADY score-free (marketplace organizations API, the sponsor-passport
// mock store). It is intentionally NOT yet applied as a hard "must not
// contain" assertion against passport-assembler/passport-read-model or the
// KPE payload — those still carry the deprecated score fields on purpose
// (additive-then-remove sequencing; PR-C deletes them, at which point this
// same guard becomes a full repo-wide gate per decisions-2 rule 5).
//
// CRITICAL #1 fix (verify-report id 1010): also now wired against
// `apps/web/src/app/site-passport/[slug]/page.tsx` and
// `packages/published-view/src/legacy-adapter.ts` — see
// tests/api/site-passport-confidence.test.ts. Neither surface was covered
// by this guard before, which is why a bare `Confidence {n}/100` render
// shipped undetected through 3 implementation batches.

export const FORBIDDEN_SCORE_FIELD_NAMES = [
  'score',
  'overallScore',
  'overall',
  'confidence_score',
  'verification_status',
  'verified',
  'certified',
  'rank',
  'ranking',
  'completeness',
  'public_slug',
  'trustLevel',
  'trustScore',
  'healthScore',
  'coverageScore',
  'readinessScore',
  'avgOrgTrust',
  'completionPercent',
] as const

export function collectFieldNames(
  value: unknown,
  names: Set<string> = new Set(),
  depth = 0,
): Set<string> {
  if (depth > 12 || value === null || value === undefined) return names
  if (Array.isArray(value)) {
    for (const item of value) collectFieldNames(item, names, depth + 1)
    return names
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      names.add(key)
      collectFieldNames(nested, names, depth + 1)
    }
  }
  return names
}
