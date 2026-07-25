# KAD-011 — Readiness — Report

**Date:** 2026-07-24 | **Status:** COMPLETE

## Decision: PASS

**Delivered:**
- Migration 071 — `readiness_scores` table with 6 dimension columns, JSONB breakdown, computed_at, RLS
- Canonical `ReadinessScore` types in `@kadarn/types` with `computeReadinessLevel()` helper
- API: `GET /api/v1/institutions/[id]/readiness` — computes composite score from:
  - Profile completeness (members + locations)
  - Evidence coverage (evidence node count)
  - Passport completeness (published passport entries)
  - Capability coverage (declared capabilities)
  - Caches result for 1 hour, then recomputes
- Readiness level mapping: ≥0.85→very_high, ≥0.65→high, ≥0.4→medium, else→low

| Check | Result |
|-------|--------|
| Build | ✅ 11.3s |
| Typecheck | ✅ |
| Migration | ✅ Clean |
| Tests | ✅ 1322 passed, baseline |

**Next:** KAD-012 — Vilo Production Pilot (the final goal — first real Passport for Vilo Research Group)
