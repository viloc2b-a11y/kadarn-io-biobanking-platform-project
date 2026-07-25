# Phase 8 — Review Foundation Report

## 1. Current State

`review_tasks` table (migration 060):
```
id, organization_id (FK), claim_id (FK), evidence_node_id (FK),
task_type (review_task_type: classification/extraction_review/evidence_review/
  confidence_review/publication_review/dispute_review),
status (review_task_status: pending/in_progress/completed/skipped/cancelled),
assigned_to, assigned_at, completed_at, completed_by, notes,
created_at, created_by
```

`review.ts` types:
```
ReviewStatus: active/archived/deprecated (misaligned — this is claim_status reused)
ReviewDecision: approved/rejected/needs_more_evidence/not_applicable
ReviewSchema, CreateReviewSchema, UpdateReviewSchema
```

## 2. Spec Requirements

The Loop 2 spec requires review metadata:
- Reviewer
- Review timestamp
- Review outcome
- Notes
- Required actions

"Evidence may require multiple reviews. Prepare foundation for LOOP 3."

## 3. Gap Analysis

| # | Required Field | DB Column | Status | Action |
|---|----------------|-----------|--------|--------|
| 1 | Reviewer | `assigned_to` + `completed_by` | ✅ | None — assigned_to is the reviewer, completed_by is who finished |
| 2 | Review timestamp | `assigned_at` + `completed_at` | ✅ | None |
| 3 | Review outcome | `status` (completed/skipped/cancelled) | ⚠️ Partial | Need explicit `review_outcome` column |
| 4 | Notes | `notes` TEXT | ✅ | None |
| 5 | Required actions | ❌ MISSING | MEDIUM | Add `required_actions` JSONB column (migration 080) |

## 4. Design Decision: Extend review_tasks (Migration 080)

```sql
ALTER TABLE review_tasks ADD COLUMN IF NOT EXISTS review_outcome review_decision
  DEFAULT NULL;  -- NULL until review is completed

-- review_decision enum already exists in 043? No — it's in types only.
-- Need to create DB enum:
DO $$ BEGIN
  CREATE TYPE review_decision AS ENUM (
    'approved', 'rejected', 'needs_more_evidence', 'not_applicable'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE review_tasks ADD COLUMN IF NOT EXISTS required_actions JSONB DEFAULT '[]';
ALTER TABLE review_tasks ADD COLUMN IF NOT EXISTS evidence_snapshot JSONB;
-- evidence_snapshot: immutable copy of evidence state at review time
```

## 5. Multiple Reviews Support

The spec says "Evidence may require multiple reviews."

**Current:** `review_tasks` has `evidence_node_id` FK. Multiple review_tasks can point to the same evidence_node. ✅ Already supported.

**Design:** Each review is a separate `review_tasks` row. The `task_type` distinguishes review rounds (e.g., `evidence_review` for first review, `confidence_review` for re-review after confidence changes).

## 6. Types Reconciliation

`review.ts` needs update:
- `ReviewStatus` should be `review_task_status` (pending/in_progress/completed/skipped/cancelled) — match DB
- `ReviewDecision` already matches the proposed `review_decision` enum
- Add `required_actions` to `ReviewSchema`
- Add `review_outcome` to `ReviewSchema`

## 7. Gaps

| # | Gap | Severity | Fix |
|---|-----|----------|-----|
| 1 | No `review_outcome` column on `review_tasks` | MEDIUM | Migration 080: add column + `review_decision` enum |
| 2 | No `required_actions` column | MEDIUM | Migration 080: add JSONB column |
| 3 | No `evidence_snapshot` for immutable review context | LOW | Migration 080: add JSONB column |
| 4 | `ReviewStatus` in types misaligned with DB | MEDIUM | Replace with `review_task_status` values |
| 5 | No `ReviewRepository` | MEDIUM | Create in implementation phase |

## 8. Verdict

**Review foundation is 60% complete.** The `review_tasks` table exists with most fields. Needs 3 additional columns and a new enum (migration 080). Multiple reviews already supported via multiple rows. LOOP 3 will build the full review workflow on this foundation.
