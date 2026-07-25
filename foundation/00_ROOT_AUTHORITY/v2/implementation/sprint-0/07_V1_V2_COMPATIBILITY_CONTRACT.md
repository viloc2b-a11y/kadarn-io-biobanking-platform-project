# KADARN v2 — v1 ↔ v2 Compatibility Contract

**Date:** 2026-07-25
**Principle:** Preserve → Extend → Dual-run → Migrate → Verify → Deprecate → Remove later

---

## Identity Stability

| Concept | v1 ID | v2 ID | Compat? |
|---------|-------|-------|---------|
| Institution | `organizations.id` | Same (UUID) | ✅ Fully compatible |
| Person | `people.id` | Same | ✅ |
| Location | `locations.id` | Same | ✅ |
| Membership | `organization_memberships.id` | Same | ✅ |
| Claim | `claims.id` | Claims FAMILY + VERSION | 🟡 claim_family_id = old id |
| Evidence | `evidence_nodes.id` | Same | ✅ |
| Capability | `capabilities.id` | Same | ✅ |
| Passport Entry | `passport_entries.id` | Same | ✅ |
| Passport Share | `passport_shares.id` | Same | ✅ |

## API Compatibility

| Rule | Detail |
|------|--------|
| Existing API paths | **Do not change.** `/api/v1/people` stays. Add new v2 paths alongside. |
| Response contracts | **Do not break.** Existing DTOs remain. v2 DTOs are backward-compatible supersets. |
| Deprecation headers | Add `Sunset:` or `Deprecation: true` header to continuity routes. Not removed. |
| New v2 paths | Under `/api/v1/evidence-sources`, `/api/v1/claim-evidence-links`, etc. Separate from v1 paths. |

## Data Compatibility

| Data | Strategy |
|------|----------|
| Existing claims | Get `claim_family_id = id` on backfill. Existing external FKs continue to work. |
| Existing evidence | `source_record_id = NULL` for legacy evidence. Queries handle NULL. |
| Existing capabilities | `valid_from = created_at`, `valid_until = NULL`. Current view unchanged. |
| Existing passports | Continue to render from v1 schema. v2 snapshots are additive. |
| Existing share grants | Continue to function. v2 adds purpose/policy fields as nullable. |

## Dual-Read / Dual-Write

| Phase | Read | Write |
|-------|------|-------|
| Sprint 1–2 | v1 paths only | v1 paths only |
| Sprint 3 (Claims) | v1 + v2 claims both readable | Write to v2 only; backfill v1 for compat |
| Sprint 4+ | v2 primary, v1 via VIEW | v2 only |

## Adapter Strategy

| Legacy | Adapter | Introduced |
|--------|---------|------------|
| `continuity/claims` → `/claims` | Route redirect in middleware | Sprint 3 |
| `published_knowledge` → `packages` | PostgreSQL VIEW | Sprint 6 |
| `organizations` → `institutions` | PostgreSQL VIEW | Sprint 2 |

## What Does NOT Need an Adapter

- `people`, `locations`, `review_tasks`, `passport_entries`, `passport_shares` — same names, same schema
- All FKs using UUIDs — UUIDs are stable across the migration
