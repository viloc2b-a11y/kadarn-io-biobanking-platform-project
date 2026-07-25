# KADARN v2 — Continuity Engine Deprecation Plan

**Date:** 2026-07-25
**Status:** Documented, NOT executed. Deprecation markers to be applied in Sprint 1.

---

## Inventory

### API Routes (16 files)

| Route | Purpose | v2 Replacement | Action |
|-------|---------|---------------|--------|
| `continuity/claims/` | List/create claims | `claims/` | DEPRECATE |
| `continuity/claims/[id]` | Get claim | `claims/[id]` | DEPRECATE |
| `continuity/claims/[id]/evidence` | Link evidence | `evidence/` + claim_evidence_links | DEPRECATE |
| `continuity/claims/[id]/promote` | Promote to passport | passport pipeline | DEPRECATE |
| `continuity/claims/[id]/references` | Add references | source_records | DEPRECATE |
| `continuity/claims/[id]/reject` | Reject claim | review_tasks decision | DEPRECATE |
| `continuity/claims/[id]/submit` | Submit for review | review_tasks | DEPRECATE |
| `continuity/claims/[id]/verify` | Verify claim | review_tasks decision | DEPRECATE |
| `continuity/admin/queue` | Review queue | review_tasks filtered query | DEPRECATE |
| `continuity/opportunities/match` | Match feasibility | protocol assessment (future) | DEPRECATE |
| `continuity/passport/[slug]` | Read passport | passport_entries | DEPRECATE |
| `continuity/passport/[slug]/opportunities` | List opportunities | assessment results | DEPRECATE |
| `continuity/passport/[slug]/recommendations` | Get recommendations | assessment recommendations | DEPRECATE |
| `continuity/passport/[slug]/score` | Get confidence score | confidence endpoint | DEPRECATE |
| `continuity/passport/[slug]/timeline` | Get timeline | audit_events | DEPRECATE |

### Service Files (1 file)

| File | Lines | v2 Replacement | Action |
|------|-------|---------------|--------|
| `continuity-claim-service.ts` | 1099 | Claim + ClaimVersion services | DEPRECATE (already has banner) |

### Database Tables (9 tables)

| Table | v2 Replacement | Action |
|-------|---------------|--------|
| continuity_experience_claims | claims (with versions) | DEPRECATE |
| continuity_evidence_items | evidence_nodes | DEPRECATE |
| continuity_evidence_links | claim_evidence_links | DEPRECATE |
| continuity_experience_ledger | claims.claim_family_id | DEPRECATE |
| continuity_performance_metrics | capabilities (extended) | DEPRECATE |
| continuity_references | source_records | DEPRECATE |
| continuity_relationships | claim_evidence_links | DEPRECATE |
| continuity_timeline_events | audit_events | DEPRECATE |
| continuity_capabilities | capabilities | DEPRECATE |

### UI Components

Not inventoried in detail. The web app references continuity pages — these will redirect to v2 equivalents when available.

### Tests

Continuity tests exist under `tests/`. These are DEPRECATE but preserved during transition.

---

## Deprecation Decision

| Component | Decision | Rationale |
|-----------|----------|-----------|
| All continuity API routes | **DEPRECATE** | Each has a v2 counterpart |
| continuity-claim-service.ts | **DEPRECATE** | Already has KAD-004 deprecation banner |
| All continuity tables | **DEPRECATE** | Data preserved, no new code |
| Continuity UI pages | **DEPRECATE** | Replace with v2 equivalents |
| Continuity tests | **WRAP FOR COMPATIBILITY** | Keep until v2 tests cover the same scenarios |

## Compatibility Period

| Phase | Duration | Behavior |
|-------|----------|----------|
| Sprint 1–3 | 3 sprints | Continuity routes return 200 + deprecation warning header |
| Sprint 4+ | Ongoing | Routes still serve but no new features |
| After removal | TBD | 301 redirect to v2 equivalents via middleware |

## Risk

**Low.** The continuity engine was already deprecated in KAD-004. All core domain concepts (claims, evidence, review, passport) have working v1 implementations that continue to function. No production data depends exclusively on continuity tables.
