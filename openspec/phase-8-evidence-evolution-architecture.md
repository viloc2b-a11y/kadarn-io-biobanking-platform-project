# Phase 8 — Evidence Evolution Architecture

**Status:** Planned (reorganized 2026-07-03)  
**Baseline target:** AF-3.0 (Sprint 28L)  
**Release candidate:** RC-1.0  
**Prerequisite:** Sprint 27E — Architecture Ratification & Design Freeze  
**Successor:** [Phase 9 — Evidence Delivery](phase-9-evidence-delivery-architecture.md)

---

## Executive summary

Phase 8 consolidates Kadarn's evidence model for decades of evolution without breaking historical Claims, without mixing document origin with semantic origin, and without storing confidence as permanent truth.

**Implementation order (non-negotiable):**

```text
Domain Freeze → Contracts → Tests → Migration (per slice)
```

Do **not** start with database migrations. Unstable domain objects (`ExtractedFact`, `ClaimCandidate`, `ClaimVersion`, `PublishedView`, `EvidencePack`) will force re-migrations.

**Transition strategy:** Option C — **Compatibility Layer (Read Adapter Only)** in Sprint 28D; mandatory **Legacy Equivalence Validation Gate** between 28J and 28K; definitive cutover in 28K.

---

## Package topology

Bounded contexts remain separate. Do **not** merge `evidence-lineage` into `evidence-core`.

```text
packages/
  evidence-core        ← Phase 1 frozen; extend only via adapters
  evidence-lineage     ← Source → Fact → Claim (Phase 8 core)
  evidence-discovery   ← Discovery pipeline / agent outputs
  provenance           ← W3C PROV semantic layer (interpretation, not storage)
  published-view       ← Sprint 28D: projection + Compatibility Layer
  delivery             ← Phase 9 (KEMS-007); no code until 28D+28F in production
```

`@kadarn/provenance` (W3C PROV) is distinct from Claim Provenance (KEMS-004). Do not merge responsibilities.

Contracts live in [`packages/types/src/phase8/`](../packages/types/src/phase8/).

---

## Non-negotiable principles

1. **Document ≠ Claim** — Every Claim originates from Facts, never directly from documents.
2. **Claims immutable** — Lifecycle events only; no in-place mutation (ADR-028).
3. **Confidence derived** — Not stored as permanent truth on the Claim (ADR-029).
4. **Published Views only** — Product APIs do not read raw Claims (ADR-030).
5. **Provenance by default** — Every Claim has reconstructible provenance (KEMS-004).
6. **Schema evolution without breakage** — Historical Claims always readable (KEMS-005).
7. **Kadarn enriches, does not replace** — CTMS, LIMS, eTMF, EDC, EMR, Vilo OS (KEMS-006).

---

## Target canonical chain

```text
External Providers
  → Connector Layer          (Phase 4 — frozen)
  → Identity Resolution      (28B, within Facts pipeline)
  → Evidence Firewall        (Phase 4 — frozen)
  → Discovery Pipeline       (Phase 1 — frozen at contract)
  → Source → SourceVersion → Artifact → ExtractionRun → ExtractedFact   (28B)
  → Entity Resolution → Normalized Entity                                  (28B)
  → Fact → Rule Engine → Claim Candidate → Claim                         (28C)
  → Published View + Compatibility Layer                                 (28D)
  → Claim Provenance + RECONSTRUCT                                         (28E)
  → Evidence Pack                                                          (28F)
  → Review Events (immutable lifecycle)                                    (28G)
  → Evidence Graph → Confidence State (derived)                            (28H)
  → Schema Version → Claim Version + Read Adapters                         (28I)
  → Systems Integration Layer                                              (28J)
  → Legacy Equivalence Validation Gate                                     (28J → 28K)
  → Cutover + Hybrid Indexing                                              (28K)
  → AF-3.0 Ratification                                                    (28L)
```

---

## Sprint map (reorganized)

| Sprint | Name | Primary outcome | Key ADR / KEMS |
|--------|------|-----------------|----------------|
| **27E** | Architecture Ratification | KEMS-004/005/006 + ADRs approved | Design freeze only |
| **28A** | Domain Freeze + Contracts | Frozen types in `packages/types` | — |
| **28B** | Source → Fact Pipeline | Lineage chain persisted | ADR-027 |
| **28C** | Claim Generation | Fact → Candidate → Claim | ADR-027 |
| **28D** | Published View + **Compatibility Layer** | View API; legacy read adapter | ADR-030 |
| **28E** | Claim Provenance | Full traceability + RECONSTRUCT | KEMS-004 |
| **28F** | Evidence Pack | Auto explainability per Claim | ADR-031 |
| **28G** | Review & Evidence Lifecycle | Event-based lifecycle | ADR-028 |
| **28H** | Confidence State Evolution | Derived confidence in views | ADR-029 |
| **28I** | Schema Evolution Framework | Versioned claim types | KEMS-005 |
| **28J** | Systems Integration Layer | CTMS-ready inbound/outbound | KEMS-006 |
| **Gate** | Legacy Equivalence Validation | Parity legacy vs Published View | Mandatory |
| **28K** | Cutover + Hybrid Index | Remove adapter; index migrations | ADR-032 |
| **28L** | Architecture Freeze AF-3.0 | Ratify KEMS-004/005/006 | RC-1.0 |

### Reordering vs original Phase 8 plan

| Capability | Original sprint | Reorganized sprint |
|------------|-----------------|-------------------|
| Published View | 28G | **28D** |
| Evidence Pack | 28H | **28F** |
| Entity Resolution | 28B (standalone) | **28B** (within Facts pipeline) |
| Legacy transition | 28X or end-only | **28D** adapter + **28K** cutover |

---

## Compatibility Layer (Sprint 28D)

**Name:** Compatibility Layer (Read Adapter Only) — not a generic adapter.

Introduces read-only bridging from legacy storage to Published Views without breaking production.

```text
Legacy Claims (continuity_experience_claims)
        │
        ▼
LegacyReadAdapter
        │
        ▼
PublishedViewEngine
        │
        ▼
Consumers (Passport, Institution, Discovery, Sponsor)
```

**Rules:**

- Consumers receive `PublishedView` DTOs only. They do not know whether data came from legacy or Evidence Core v2.
- Adapter is **read-only**. Writes continue on legacy paths until 28K cutover.
- New architecture work in 28E–28J reads **only** Published Views, Evidence Packs, and Claim Provenance — never legacy tables directly.
- Package: [`packages/published-view/`](../packages/published-view/)
- API service: `apps/api/src/lib/published-view-service.ts`

**First consumer refactor order:** Passport → Institution public → Discovery dashboard/report → Sponsor surfaces.

---

## Legacy Equivalence Validation Gate (28J → 28K)

Mandatory gate before cutover. Must demonstrate functional equivalence:

| Surface | Legacy baseline | Target |
|---------|-----------------|--------|
| Passport | `GET /continuity/passport/:slug` | Published View (public) |
| Institution Profile | `GET /institution/public/:slug` | Published View (institution) |
| Sponsor View | Sponsor-facing endpoints | Published View (sponsor) |
| Discovery Dashboard | `GET /discovery/dashboard` | Published View (canonical) |
| Discovery Report | `GET /discovery/report` | Published View + pack summary |

**Criteria:** Same semantic content (fields, filters, visibility). Documented tolerance for deprecated fields.

**CI:** Merge to `main` for 28K work blocked if equivalence below agreed threshold.

**Fixtures:** Golden files from staging with anonymized real data — `tests/phase8/legacy-equivalence/`.

---

## Sprint 28K — Cutover

```text
Evidence Core v2
        │
        ▼
Published View
        │
        ▼
(Adapter removed)
        │
        ▼
Passport / Sponsor / Discovery / Delivery (Phase 9)
```

- Deactivate `LegacyReadAdapter`
- Remove direct reads of `continuity_experience_claims` from public routes
- Hybrid index migrations (BTREE + GIN + materialized edges)
- Feature flag `LEGACY_PASSPORT_ENABLED=false`; monitor 2 weeks

---

## Phase 9 prerequisite

Phase 9 (KEMS-007) code merge **29B+** blocked until:

- **28D** Published Views operational in **production**
- **28F** Evidence Pack operational in **production**
- Legacy Equivalence Validation Gate **passed**
- **28L** AF-3.0 ratified (29A design may run in parallel with late Phase 8)

See [phase-8-to-phase-9-gap-analysis.md](phase-8-to-phase-9-gap-analysis.md).

---

## Execution sequence

```text
27E sign-off
    ↓
28A Domain Freeze + Contracts + contract tests
    ↓
28B → 28C (pipeline + claims; tests then migration per slice)
    ↓
28D Compatibility Layer + Published View API  ← first production value
    ↓
28E → 28F (provenance + pack on views)
    ↓
28G → 28J (lifecycle, confidence, schema, integration)
    ↓
Gate Legacy Equivalence Validation
    ↓
28K Cutover + Hybrid Index
    ↓
28L AF-3.0
    ↓
29A (parallel late Phase 8) → 29B+ only with 28D+28F prod
```

---

## Related documents

| Document | Path |
|----------|------|
| Gap analysis (current vs target) | [phase-8-gap-analysis.md](phase-8-gap-analysis.md) |
| Phase 8 → 9 gap | [phase-8-to-phase-9-gap-analysis.md](phase-8-to-phase-9-gap-analysis.md) |
| Phase 9 delivery | [phase-9-evidence-delivery-architecture.md](phase-9-evidence-delivery-architecture.md) |
| ADR drafts | [drafts/adrs/](drafts/adrs/) |
| Type contracts | [packages/types/src/phase8/](../packages/types/src/phase8/) |
| KEMS-004 | [docs/kems/KEMS-004_Claim_Provenance_Architecture_v1.0.md](../docs/kems/KEMS-004_Claim_Provenance_Architecture_v1.0.md) |
| KEMS-005 | [docs/kems/KEMS-005_Schema_Evolution_Standard_v1.0.md](../docs/kems/KEMS-005_Schema_Evolution_Standard_v1.0.md) |
| KEMS-006 | [docs/kems/KEMS-006_Systems_Integration_Standard_v1.0.md](../docs/kems/KEMS-006_Systems_Integration_Standard_v1.0.md) |

---

*Reorganized 2026-07-03. Supersedes prior Phase 8 sprint ordering (Published View at 28G, Evidence Pack at 28H).*
