# Phase 8 → Phase 9 Gap Analysis

**Status:** Prerequisite document (reorganized 2026-07-03)  
**Sources:** [phase-8-gap-analysis.md](phase-8-gap-analysis.md), KEMS-007 v0.1, ADR-033, code audit

---

## Executive summary

Phase 8 establishes **what** may be shown (Published Views, Evidence Pack). Phase 9 establishes **how** it is delivered reliably to channels. The gap is almost entirely **new infrastructure** — no Delivery Engine exists in production code today.

**Prerequisite (updated):** **28D + 28F** operational in **production** — not 28G + 28H.

Additional gates before 29B+ code merge:

- Legacy Equivalence Validation Gate passed (28J → 28K)
- 28L AF-3.0 ratified (29A design may parallelize with late Phase 8)

---

## Capability gap map

| Phase 8 output | Phase 9 consumer | Gap | Sprint |
|----------------|------------------|-----|--------|
| Published View | Delivery compile input | View API must exist in prod | **28D** |
| Evidence Pack | Delivery compile input | Pack generator must exist in prod | **28F** |
| Compatibility Layer | Safe transition during 28E–28J | Read adapter not built | **28D** |
| KEMS-006 Outbound API contract | 007.E machine delivery | Contract without engine | 28J |
| ADR-030 boundary | 007.D profile binding | Enforcement at compile | **28D** |
| ADR-031 pack contract | 007 compile input | Pack API missing | **28F** |
| Domain event outbox | 007.B event catalog | Delivery-specific events missing | 29B+ |
| `platform-services/webhooks` stub | 007.F reliability | No DLQ, no idempotency registry | 29B+ |
| Connector retry (inbound) | 007.F outbound retry | Different domain — do not merge | — |

---

## Code inventory vs KEMS-007

| Concern | Exists today | KEMS-007 target |
|---------|--------------|-----------------|
| Webhook delivery | Interface only (`platform-services/webhooks`) | Full engine + 007.F |
| Retry | Connector `withRetry` (3x) | Channel policy matrix F.3 |
| Idempotency | Event store keys, in-memory service | Three-key registry F.5 |
| DLQ | Not implemented | `delivery_dlq_entries` F.7 |
| Artifact FSM | Spec only (007.A) | 29B implementation |
| Subscription FSM | Spec only (007.C) | 29F implementation |
| Published View API | Not implemented | Required input to Delivery Engine |
| Evidence Pack API | Stub only | Required input to Delivery Engine |

---

## ADR alignment

| ADR | Phase | Role in Phase 9 |
|-----|-------|-----------------|
| ADR-030 | 8 (**28D**) | Delivery compile MUST use Published Views only |
| ADR-031 | 8 (**28F**) | Evidence Pack as compile input |
| ADR-033 | 9 | Delivery Engine boundary vs Core / Views |
| ADR-034 | 9 | Delivery artifact immutability |
| ADR-035 | 9 | Replay rebuild default |

---

## Phase 9 entry checklist

Before **29B+ code merge**:

- [ ] **28D** Published View API in **production** (Compatibility Layer acceptable during transition)
- [ ] **28F** Evidence Pack generator in **production**
- [ ] Legacy Equivalence Validation Gate **passed**
- [ ] No product route reads raw Claims or `continuity_experience_claims` (post-28K)
- [ ] KEMS-007 v0.1 ratified at 29A
- [ ] ADR-033 Accepted at 29B gate

**29A (design ratification)** may run in parallel with 28G–28J if 28D is already in production.

---

## Pipeline continuity

```text
Phase 8 (28D/28F)                    Phase 9 (29B+)
─────────────────                    ─────────────────
Published View  ──────────────────►  Delivery compile input
Evidence Pack   ──────────────────►  Delivery compile input
Policy Engine   ──────────────────►  007.D profile binding
Visibility      ──────────────────►  007.D security
                                     Delivery Artifact → Channel
```

**Frozen rule (KEMS-007 §2):** Never `Evidence Core → PDF`. Always `Published View → Delivery Artifact → Channel`.

---

## Related documents

- [phase-8-evidence-evolution-architecture.md](phase-8-evidence-evolution-architecture.md)
- [phase-9-evidence-delivery-architecture.md](phase-9-evidence-delivery-architecture.md)
- [docs/kems/KEMS-007_Evidence_Delivery_Architecture_v0.1.md](../docs/kems/KEMS-007_Evidence_Delivery_Architecture_v0.1.md)

---

*Updated 2026-07-03: prerequisites changed from 28G+28H to 28D+28F in production.*
