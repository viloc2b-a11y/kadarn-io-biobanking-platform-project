# ADR-030 — Published View Boundary

**Status:** Proposed  
**Date:** 2026-07-03  
**Target sprint:** 28D  
**Baseline:** KEMS-003, KEMS-004  
**Related:** ADR-031, [phase-8-evidence-evolution-architecture.md](../../phase-8-evidence-evolution-architecture.md)

---

## Context

Product routes (Passport, Institution public, Discovery dashboard, Sponsor surfaces) read raw claims, legacy tables, or engine recalculations. External consumers must never access Claims directly.

---

## Decision

1. **All product-facing reads** go through **PublishedView** DTOs.
2. **PublishedViewEngine** in `packages/published-view/` is the sole projection authority.
3. **Compatibility Layer (Read Adapter Only)** in Sprint 28D maps legacy `continuity_experience_claims` to PublishedViews until 28K cutover. Consumers cannot distinguish legacy vs native source.
4. Internal Evidence Core APIs may read Claims for reconstruction and admin — not for product display.
5. Phase 9 Delivery Engine compile input is Published View only (KEMS-007 §2).

---

## Consequences

| Area | Impact |
|------|--------|
| Passport routes | Refactor to `published-view-service` |
| institution/public | Same |
| discovery/dashboard | Same |
| site-passport web | Consume view DTO |

---

## Acceptance criteria (28D gate)

- [ ] `published-view-service` is single public read entry point
- [ ] LegacyReadAdapter serves public passport from legacy data
- [ ] No new product route reads `continuity_experience_claims` directly after 28D
