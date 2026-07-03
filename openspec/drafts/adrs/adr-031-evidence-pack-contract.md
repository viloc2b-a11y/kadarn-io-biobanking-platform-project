# ADR-031 — Evidence Pack Contract

**Status:** Proposed  
**Date:** 2026-07-03  
**Target sprint:** 28F  
**Baseline:** KEMS-004, ADR-030  
**Related:** KEMS-007

---

## Context

Stakeholders must answer "why does Kadarn say this?" for every Claim. Evidence Pack is the auto-generated explainability artifact, distinct from Published View (what is shown) and Claim Provenance (how it was built).

---

## Decision

1. Every published Claim has an **EvidencePack** generated on publish or view compile.
2. Pack includes: supporting facts, explanation steps, review history, reconstruction verification, policies applied.
3. Contract defined in `packages/types/src/phase8/views.ts`.
4. API: `GET /api/v1/published-views/{id}/evidence-pack`
5. Phase 9 Delivery may use pack as optional compile input (KEMS-007).

---

## Consequences

| Area | Impact |
|------|--------|
| published-view package | Pack generator co-located or sibling |
| Phase 9 | 28F prod required before 29B+ merge |

---

## Acceptance criteria (28F gate)

- [ ] Pack generated for every Published View in production
- [ ] Pack passes contract tests against frozen types
- [ ] Not a stub — real content from provenance chain
