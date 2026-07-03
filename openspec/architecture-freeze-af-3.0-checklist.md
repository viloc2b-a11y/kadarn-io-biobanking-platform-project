# AF-3.0 — Architecture Freeze Checklist (Sprint 28L)

**Status:** Pending ratification  
**Target baseline:** AF-3.0  
**Release candidate:** RC-1.0

---

## Prerequisites

- [x] Sprint 28A–28J complete
- [x] Legacy Equivalence Validation Gate passed ([phase-8-legacy-equivalence-gate.md](phase-8-legacy-equivalence-gate.md), [phase-8-gate-28JK-report.md](phase-8-gate-28JK-report.md)) — 2026-07-03
- [x] Sprint 28K **staging** cutover configured (`LEGACY_PASSPORT_ENABLED=false`) — [phase-8-staging-cutover-report.md](phase-8-staging-cutover-report.md)
- [ ] Sprint 28K **production** cutover complete — see [phase-8-cutover-runbook.md](phase-8-cutover-runbook.md)
- [ ] Hybrid index migration 048 applied

---

## KEMS ratification

| Document | Version | Status |
|----------|---------|--------|
| KEMS-004 Claim Provenance | v1.0 | Ratify → Accepted |
| KEMS-005 Schema Evolution | v1.0 | Ratify → Accepted |
| KEMS-006 Systems Integration | v1.0 | Ratify → Accepted |

---

## ADR acceptance

| ADR | Sprint | Accepted |
|-----|--------|----------|
| ADR-027 Fact/Claim separation | 28B–28C | [ ] |
| ADR-028 Claim immutability | 28G | [ ] |
| ADR-029 Confidence derived | 28H | [ ] |
| ADR-030 Published View boundary | 28D | [ ] |
| ADR-031 Evidence Pack contract | 28F | [ ] |
| ADR-032 Hybrid indexing | 28K | [ ] |

---

## Production verification

- [ ] Published View API serves all public product surfaces
- [ ] Evidence Pack generated for every published view
- [ ] No public route reads `continuity_experience_claims` directly
- [ ] Claim Provenance + RECONSTRUCT operational
- [ ] Phase 9 (29B+) unblocked per [phase-8-to-phase-9-gap-analysis.md](phase-8-to-phase-9-gap-analysis.md)

---

*Sprint 28L deliverable — ratification ceremony required.*
