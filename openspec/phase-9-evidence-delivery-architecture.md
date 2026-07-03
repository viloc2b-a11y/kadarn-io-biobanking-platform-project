# Phase 9 — Evidence Delivery Architecture

**Status:** Planned  
**Prerequisite:** Phase 8 — **Published Views (28D)** + **Evidence Pack (28F)** in production + Legacy Equivalence Gate passed + AF-3.0 (28L)  
**Normative spec:** [KEMS-007 v0.1](../docs/kems/KEMS-007_Evidence_Delivery_Architecture_v0.1.md)  
**Predecessor:** [Phase 8 — Evidence Evolution](phase-8-evidence-evolution-architecture.md)

---

## Executive summary

Phase 9 builds Kadarn's **Delivery Platform**: infrastructure that transforms **Published Views** and **Evidence Packs** into secure, versioned, multi-channel, recoverable deliverables — without mutating Evidence Core or exposing raw Claims.

Phase 8 defines **what** may be shown. Phase 9 defines **how** it leaves the system.

---

## Hard gates (non-negotiable)

| Gate | Requirement |
|------|-------------|
| **28D prod** | Published View API operational (Compatibility Layer acceptable until 28K cutover) |
| **28F prod** | Evidence Pack generator operational — not stub |
| **Equivalence Gate** | Legacy vs Published View parity validated |
| **28L** | AF-3.0 ratified before RC-1.0 delivery pilot |
| **29B+ merge** | Blocked until all above green |

**29A (KEMS-007 design ratification)** may run in parallel with Phase 8 sprints 28G–28J if 28D is already in production.

---

## Official pipeline (KEMS-007)

```text
Evidence Core
    ↓
Policy Engine
    ↓
Visibility Engine
    ↓
Published View          ← Phase 8 (28D)
    ↓
Evidence Pack (optional compile input)  ← Phase 8 (28F)
    ↓
Delivery Engine         ← Phase 9 (29B+)
    ↓
Delivery Artifact
    ↓
Delivery Channel
    ↓
Consumer
```

**Frozen rule:** Never `Evidence Core → PDF`. Always `Published View → Delivery Artifact → Channel`.

---

## KEMS-007 structure (29A–29K)

| Section | Topic | Sprint |
|---------|-------|--------|
| 007.A | Delivery Artifact Lifecycle | 29B |
| 007.B | Delivery Event Catalog | 29C |
| 007.C | Delivery Subscription Model | 29F |
| 007.D | Delivery Profile & Security | 29D |
| 007.E | Machine Delivery Contracts | 29E |
| 007.F | Reliability Policy (retry, idempotency, DLQ, replay) | 29G |
| 007.G | Observability & Audit | 29H |

Design ratification: **29A**. Implementation: **29B–29K**.

---

## Package topology (Phase 9)

```text
packages/
  published-view    ← Phase 8 (compile input)
  delivery          ← Phase 9 (new bounded context)
  evidence-core     ← unchanged; Delivery never writes Core
  platform-services ← webhooks stub → replaced by delivery engine
```

Do **not** implement outbound retry/DLQ in connector framework (inbound only). KEMS-007.F owns outbound reliability.

---

## Relationship to Compatibility Layer (Phase 8)

During 28D–28J, Delivery design (29A) may proceed, but **29B+ code** must not ship until:

1. Published Views are served from a stable API (adapter or native)
2. Evidence Pack is generated from real view compile paths
3. Post-28K: Delivery consumes native Published Views only

---

## ADR map (Phase 9)

| ADR | Title | Sprint |
|-----|-------|--------|
| ADR-033 | Delivery Engine boundary vs Core / Published Views | 29A → Accepted 29B |
| ADR-034 | Delivery artifact immutability | 29B |
| ADR-035 | Replay rebuild default | 29G |

See [drafts/adrs/](drafts/adrs/).

---

## Phase 8 → 9 handoff

```text
28D Published Views ──┐
28F Evidence Pack  ──┼──► 29A KEMS-007 Design Ratification
28L AF-3.0         ──┘
                              ↓
                         29B+ Delivery Engine code
```

Detail: [phase-8-to-phase-9-gap-analysis.md](phase-8-to-phase-9-gap-analysis.md).

---

## Execution sequence

```text
28D + 28F in production
    ↓
Gate Legacy Equivalence (if not yet passed)
    ↓
28K cutover (adapter removed)
    ↓
28L AF-3.0
    ↓
29A KEMS-007 ratification (may overlap late Phase 8)
    ↓
29B Delivery Artifact Lifecycle
    ↓
29C–29K (events, profiles, contracts, reliability, observability)
```

---

*Updated 2026-07-03: Phase 8 prerequisites changed from 28G+28H to 28D+28F in production.*
