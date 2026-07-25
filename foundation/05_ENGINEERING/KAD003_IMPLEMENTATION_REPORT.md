# KAD-003 — Capability Model — Implementation Report

**Date:** 2026-07-24
**Status:** COMPLETE
**Story:** KAD-003 (Capability Model)

---

## Decision

**PASS WITH APPROVED DEFERRALS**

## Delivered

- **Migration 065** — `capabilities` table with capability_status enum, RLS, indexes, trigger
- **Types** — `InstitutionCapability` Zod schema + Create/Update variants (named to avoid conflict with existing `Capability` union type)
- **API** — 4 endpoints: list by institution, get by ID, create, update, deprecate (soft-delete)
- **Data model** — capabilities are linked to organizations, capability_types, and optionally to a primary claim
- **Lifecycle** — 6 statuses: declared → evidence_submitted → under_review → verified → published → deprecated
- **RLS** — org-scoped, same pattern as locations and memberships

## Files Changed

| Group | Files |
|-------|-------|
| Database | `database/migrations/065_kad003_capability.sql`, `supabase/migrations/065_kad003_capability.sql` |
| Types | `packages/types/src/capability.ts` — new |
| Types | `packages/types/src/index.ts` — added exports |
| API | `apps/api/src/app/api/v1/institutions/[id]/capabilities/route.ts` — new |
| API | `apps/api/src/app/api/v1/capabilities/[id]/route.ts` — new |

## Validation

| Check | Result |
|-------|--------|
| Build | ✅ 13.9s |
| Typecheck | ✅ 3 projects |
| Tests | ✅ 1322 passed, baseline +9 new foundation tests |

## Entity Progress

| Entity | Status |
|--------|--------|
| Institution | 🟡 FOUNDATION COMPLETE |
| Person | ✅ COMPLETE |
| Location | ✅ COMPLETE |
| Membership | 🟡 FOUNDATION COMPLETE |
| Role | 🟡 FOUNDATION COMPLETE |
| **Capability** | 🟡 **FOUNDATION COMPLETE** |
| Claim | 🔄 Next consolidation |
| Evidence | 🔄 Next consolidation |
| Passport | 🔄 Already implemented |

## Risks and Deferrals

| Risk | Story |
|------|-------|
| Capability confidence_score not computed (accepts manual input) | KAD-007 (Confidence computation) |
| No capability derivation from claims (auto-detect) | KAD-004 (Claim consolidation) |
| No capability UI page | KAD-002F scope extension or separate UI story |

## Next Story

**KAD-004 — Claim Consolidation**

Prerequisites: Capability model exists (KAD-003), evidence-core claims already implemented. KAD-004 consolidates the dual claim implementations (evidence-core claims + continuity claims), unifies the claim lifecycle, and establishes Claim as the canonical declaration that feeds Capability derivation.
