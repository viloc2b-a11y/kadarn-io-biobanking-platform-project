# KAD-006 — Review Workflow — Report

**Date:** 2026-07-24 | **Status:** COMPLETE

## Decision: PASS

**Delivered:**
- Canonical `Review` types in `@kadarn/types` with `ReviewStatus`, `ReviewDecision` enums
- Migration 067 — added `evidence_id`, `decision`, `reviewer_notes`, `assigned_at`, `completed_at` columns to `review_tasks`
- API: `GET/POST /api/v1/claims/[id]/reviews` — list and assign reviews
- API: `GET/PATCH /api/v1/reviews/[id]` — get and update review decisions
- Automatic `completed_at` timestamp on terminal statuses (approved/rejected)

| Check | Result |
|-------|--------|
| Build | ✅ 15.0s |
| Typecheck | ✅ |
| Tests | ✅ 1322 passed, baseline preserved |

**Next:** KAD-007 — Confidence
