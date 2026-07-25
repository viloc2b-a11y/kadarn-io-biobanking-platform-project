# KAD-004 — Claim Consolidation — Implementation Report

**Date:** 2026-07-24
**Status:** COMPLETE
**Story:** KAD-004 (Claim Consolidation)

---

## Decision

**PASS**

## Delivered

- **Canonical Claim types** — `ClaimSchema`, `CreateClaimSchema`, `UpdateClaimSchema` in `@kadarn/types` with Zod validation, matching the evidence-core `claims` table
- **Legacy marker** — `ClaimLegacyType` union exported with `@deprecated` JSDoc tag
- **Migration 066** — added `person_id`, `tags`, `evidence_count` columns to canonical `claims` table; indexes on new columns; `COMMENT` marking `continuity_experience_claims` as deprecated
- **Deprecation header** — 1099-line `continuity-claim-service.ts` now carries a KAD-004 deprecation banner directing consumers to evidence-core claims
- **Backward compatible** — no data deleted, no existing routes changed

## Files Changed

| Group | Files |
|-------|-------|
| Types | `packages/types/src/claim.ts` — new (canonical Claim Zod schema) |
| Types | `packages/types/src/index.ts` — added exports |
| Database | `database/migrations/066_kad004_claim_consolidation.sql` — new |
| Database | `supabase/migrations/066_kad004_claim_consolidation.sql` — synced |
| Code | `apps/api/src/lib/continuity-claim-service.ts` — deprecation banner added |

## Validation

| Check | Result |
|-------|--------|
| Build | ✅ 11.1s |
| Typecheck | ✅ 3 projects |
| Tests | ✅ 1322 passed, baseline preserved |

## Entity Progress

| Entity | Status |
|--------|--------|
| Person | ✅ COMPLETE |
| Location | ✅ COMPLETE |
| Capability | 🟡 FOUNDATION COMPLETE |
| **Claim** | **🟡 CONSOLIDATED (Legacy → Canonical)** |
| Evidence | 🔄 Next |

## Risks and Deferrals

None. The consolidation is backward-compatible. 0 regressions.

## Next Story

**KAD-005 — Evidence and Provenance Consolidation**

Prerequisites: Claim consolidation (KAD-004) provides the canonical claim. KAD-005 consolidates evidence references, aligns provenance recording, and connects evidence lifecycle to the new claim model.
