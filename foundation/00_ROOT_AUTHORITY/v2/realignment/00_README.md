# KADARN v2 Architectural Realignment — Deliverables

**Date:** 2026-07-25  
**Authority:** Architecture Constitution v2.0, Implementation Blueprint v2.0, Master Realignment Plan v2.0  
**Phase:** A (Alignment Audit) — Complete  

---

## Reading Order

```
1. 01_ARCHITECTURE_ALIGNMENT_AUDIT.md    — Full repo inventory vs v2 model
2. 02_GAP_ANALYSIS_REPORT.md             — What's missing for v2
3. 03_IMPACT_MATRIX_KAD001_012.md        — Impact per executed story
4. 04_MIGRATION_STRATEGY.md              — Incremental migration plan
5. 05_REFACTORING_BACKLOG.md             — Prioritized backlog
6. 06_MASTER_ROADMAP_v2.md               — 11-sprint execution plan
```

---

## Authoritative Documents

The three governing documents that informed this analysis are in `foundation/00_ROOT_AUTHORITY/v2/`:

| Document | File | Purpose |
|----------|------|---------|
| Architecture Constitution v2.0 | `01_KADARN_Constitucion_Arquitectonica_v2.0.docx` | Product identity, principles, knowledge model, decisions |
| Implementation Blueprint v2.0 | `02_KADARN_Implementation_Blueprint_v2.0.docx` | Technical architecture, tables, APIs, migrations, slices |
| Master Realignment Plan v2.0 | `03_KADARN_Plan_Maestro_Realineacion_v2.0.docx` | Workstreams, phases, gates, metrics, risk |

---

## Existing Repository Authority

The following documents were consulted and are preserved in their current locations:

- KEMS-001–KEMS-007 — `docs/kems/`
- ADRs — `docs/adr/` (30+ ADRs reviewed)
- Foundation Library — `foundation/01_DOMAIN/`, `foundation/05_ENGINEERING/`
- KRM-RAO Reference Model — `docs/adr/adr-008-krm-rao-reference-model.md`
- KRM-BNO Profile — `docs/adr/adr-009-krm-bno-profile.md`
- Implementation Reports KAD-001→KAD-012 — `foundation/05_ENGINEERING/`

---

## Blocking Decisions

| ID | Decision | Status | Rationale |
|----|----------|--------|-----------|
| BD-001 | Priority of Continuing Review VS | ⏳ Pending | Must decide order: VS1 (CR) or VS2 (PI)? Current plan: CR first |
| BD-002 | Claim backfill timing | ⚠️ Blocking | Must run before any Claim v2 code. Needs database snapshot |
| BD-003 | Package rename strategy | ⏳ Pending | VIEW-based or full migration? Recommend VIEW for Sprint 10 |
| BD-004 | Readiness score → Assessment mapping | ⏳ Pending | Keep readiness_scores as cache or replace entirely? Recommend dual-support |
| BD-005 | LLM extraction vs deterministic | ⏳ Pending | Constitution allows both. Recommend deterministic for VS1, LLM candidate for VS2 |

---

## Open Questions

1. **Source authority levels T1–T4:** Should T4 (human declaration) include a default decay policy? Or is it always "fresh until contested"?
2. **Claim version granularity:** Should a single claim change trigger a new version of ALL claims in the same snapshot? Or per-claim?
3. **KnowledgeSnapshot frequency:** Automatically created per assessment? Per publication? On demand?
4. **Protocol requirement catalog:** 15–30 requirements is the starting range. Who defines the initial catalog?
5. **PI identity confidence threshold:** What confidence score triggers human review vs automatic merge?

---

## Go / No-Go Recommendation

**Recommendation: GO** with the following preconditions:

1. ✅ The Architecture Alignment Audit, Gap Analysis, Impact Matrix, Migration Strategy, Refactoring Backlog, and Master Roadmap are complete
2. ⏳ **Required before Sprint 0:** Approve BD-001 (VS order)
3. ⏳ **Required before Sprint 3:** Database snapshot and Claim backfill plan
4. ⏳ **Recommended before Sprint 1:** Complete Canonical Attribute Catalog (Fase B, ~1 day)

**Risk of delay:** None. The existing repository is stable (build ✅, tests ✅, migrations ✅). The realignment plan is incremental and does not require a freeze of existing functionality during the first two sprints (Sources + Provenance are net-new tables, no existing code touched).

**First execution step:** Approve this document set, then begin Sprint 0 (Freeze & Baseline).
