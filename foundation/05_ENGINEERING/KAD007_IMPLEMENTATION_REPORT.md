# KAD-007 — Confidence — Report

**Date:** 2026-07-24 | **Status:** COMPLETE

## Decision: PASS

**Delivered:**
- Canonical `ConfidenceScore` and `ConfidenceStateSnapshot` types in `@kadarn/types`
- `GET /api/v1/claims/[id]/confidence` — computes confidence from evidence weights (`evidence_class_ref`) and review outcomes
- Formula: `overall = (evidence_score × 0.6) + (review_coverage × 0.4)`
- Level mapping: ≥0.9→very_high, ≥0.75→high, ≥0.5→medium, else→low
- Snapshot stored in `confidence_state_snapshots` table on each computation
- Backward compatible with existing evidence-core `confidence-state.ts` type

| Check | Result |
|-------|--------|
| Build | ✅ 11.2s |
| Typecheck | ✅ |
| Tests | ✅ 1322 passed, baseline preserved |

**Next:** KAD-008 — Knowledge Publication
