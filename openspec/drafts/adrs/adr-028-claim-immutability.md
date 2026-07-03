# ADR-028 — Claim Immutability

**Status:** Proposed  
**Date:** 2026-07-03  
**Target sprint:** 28G  
**Baseline:** KEMS-004, KEMS-003  
**Related:** ADR-027

---

## Context

`continuity_experience_claims` and Phase 1 `claims` allow limited UPDATE. Phase 8 requires append-only Claim semantics: lifecycle changes are events, not mutations.

---

## Decision

1. **ClaimInstance** and **ClaimVersion** are append-only after publication.
2. Status transitions (review, dispute, supersede) emit **ReviewEvents** — never UPDATE claim content in place.
3. Deprecated RPC `promote_claim_to_ledger` replaced by promotion to Core Claim + PublishedView (28G).
4. Database triggers enforce no UPDATE on published claim content columns.

---

## Consequences

| Area | Impact |
|------|--------|
| continuity-claim-service | Writes become event append |
| evidence-core claims table | Migration to versioned model |
| Published Views | Rebuilt on new events, not patched |

---

## Acceptance criteria (28G gate)

- [ ] No UPDATE on claim statement fields post-publication
- [ ] Review lifecycle fully event-sourced
