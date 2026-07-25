# KAD-LOOP-003 — Phase 1: Claim Model Report

## Objective
Review existing Claim model and implement missing fields per LOOP-3 spec.

## What Exists (Pre-LOOP-3)
- **DB table**: `claims` (migration 045, extended in 060, 066)
- **DB enums**: `claim_status` (3: active/archived/deprecated), `workflow_state` (7 values)
- **Types**: `ClaimSchema` (12 fields), `ClaimStatus` (7 values, diverged from DB)
- **Repository**: None
- **Service**: None
- **API**: None

## What Was Implemented

### Type Reconciliation
Split the single misaligned `ClaimStatus` into 4 distinct status dimensions:

| Enum | Values | Maps To |
|---|---|---|
| `ClaimLifecycleStatus` | draft/review/approved/rejected/superseded/expired/archived (7) | Spec lifecycle (TS-only overlay) |
| `ClaimWorkflowState` | draft/declared/pending_evidence/under_review/published/disputed/archived (7) | DB `workflow_state` enum |
| `ClaimVerificationStatus` | self_reported/evidence_submitted/reference_pending/reference_confirmed/kadarn_verified/rejected/expired (7) | Legacy pipeline (deprecated) |
| `ClaimReviewStatus` | pending/in_review/approved/rejected (4) | Derived from reviews table |

Additional enums: `ClaimScope` (3), `ClaimPriority` (4), `ClaimCategory` (5)

### New Fields Added to ClaimSchema
- `claim_category`, `claim_scope`, `priority`
- `version` (int, default 1), `owner_id`, `source_event_id`
- `lifecycle_status`, `review_status`
- `expires_at`, `superseded_by`, `supersession_reason`

### Migrations Created
- **081**: `claim_types` reference table (7 seed rows)
- **082**: `capability_claims` M2M join table (replaces 1:1 `primary_claim_id`)
- **083**: 10 new columns on `claims` + 5 new enums
- **084**: RLS on `claim_evidence_links` (gap from migration 078)
- **085**: `claim_versions` table (immutable versioning)

### Files Committed
- `packages/types/src/claim.ts` — REWRITE (346 lines)
- `packages/types/src/capability.ts` — REWRITE (137 lines)
- `packages/types/src/claim-version.ts` — NEW (157 lines)
- `packages/types/src/index.ts` — barrel update
- `database/migrations/081-085_*.sql` + supabase mirrors

## Verification
- Typecheck: 0 errors
- Sprint tests: 56/56 (8 pre-existing failures, 0 regressions)
- Migrations applied to live Postgres: all 5 pass

## Design Decisions
1. **DB `claim_status` enum frozen** — not modified. New `ClaimLifecycleStatus` is a TS overlay.
2. **`ClaimStatus` kept as deprecated alias** — backward compatibility for existing imports.
3. **M2M replaces 1:1** — `capability_claims` join table, but `primary_claim_id` retained for backward compat.
4. **Immutable versioning** — `claim_versions` table, append-only, `superseded_by` self-referential FK.
