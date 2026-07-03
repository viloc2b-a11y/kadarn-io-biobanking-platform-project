# ADR-029 — Confidence Derived (Not Stored as Truth)

**Status:** Proposed  
**Date:** 2026-07-03  
**Target sprint:** 28H  
**Baseline:** KEMS-001, ADR-011  
**Related:** ADR-030

---

## Context

Legacy continuity stores `confidence_score` on claims. KEMS-001 defines Confidence as derived from the Evidence Graph. Storing scores as permanent truth violates Phase 8 principles.

---

## Decision

1. **ConfidenceState** is computed from Evidence Graph edges and weights — not persisted as authoritative truth on the Claim.
2. **Published Views** include `confidence_level`, `confidence_value`, and `confidence_computed_at` as projection metadata — always recomputable.
3. Compatibility Layer (28D) may map legacy `confidence_score` into view projection fields until 28K cutover.
4. After 28K, confidence in public APIs comes only from derived computation.

---

## Consequences

| Area | Impact |
|------|--------|
| Passport API | Confidence from view projection, not DB column |
| evidence-lineage | ConfidenceStateEngine owns computation |
| evidence-core | Retains ConfidenceState type only (ADR-011) |

---

## Acceptance criteria (28H gate)

- [ ] Public routes do not expose raw stored confidence as source of truth
- [ ] Recompute produces identical view confidence for same graph state
