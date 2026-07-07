# KTP-1.6 — Mission 7: Sponsor Intelligence Runtime & Decision Layer

> **Date:** 2026-07-06
> **Status:** COMPLETE
> **Verdict:** PASS — KTP-1.x complete. Ready for KTP-2.0.

---

## Executive Summary

The Sponsor Intelligence Runtime is the capstone of KTP-1.x. It transforms institutional knowledge (Readiness API + Capability Intelligence) into intelligence usable by Sponsors, CROs, Biobanks, and Program Managers. This layer does NOT produce new knowledge — it consumes projections and generates decision-oriented views.

The critical architectural innovation is the introduction of **two query models**: Institution View and Program View. This converts Kadarn from an institution-centric platform into a true **Evidence Intelligence Platform** where the same evidence graph answers both "What can this institution demonstrate?" and "What institutions can execute this program?"

---

## Architecture Position

```
┌──────────────────────────────────────────────────────────────┐
│  Marketplace (Future — KTP-2.x)                               │
├──────────────────────────────────────────────────────────────┤
│  SPONSOR INTELLIGENCE (Mission 7)                             │  ← THIS LAYER
│  ┌──────────┬───────────┬───────────┬──────────────────────┐ │
│  │ Portfolio│ Program   │ Decision  │ Monitoring + Alerts  │ │
│  │ View     │ Matching  │ Views     │ Explainability       │ │
│  └──────────┴───────────┴───────────┴──────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  Capability Intelligence (Mission 6)                          │
│  Readiness API (Mission 5)                                    │
├──────────────────────────────────────────────────────────────┤
│  Readiness Engine (Mission 3-4)                               │
│  Evidence Core / KEMS / Provenance (Mission 0-2)              │
└──────────────────────────────────────────────────────────────┘
```

**Boundary**: Sponsor Intelligence NEVER reads Evidence directly. Always consumes projections from Readiness API and Capability Intelligence.

---

## Two Query Models

### Institution View
**"What can this institution demonstrate?"**

- Existing. Powered by Readiness API (`GET /institutions/{id}/readiness`).
- Answers: readiness status, capability matrix, evidence gaps, confidence per capability.

### Program View (NEW)
**"What institutions can execute this program?"**

- Inverse query. Same data, different navigation.
- `matchInstitutionsToProgram(programTypeKey, evaluations)` produces ranked matches.
- Each match includes: strength, rationale, capability coverage, evidence quality, critical gaps, recommendation.

This is the key architectural contribution of Mission 7. It converts Kadarn into a true Evidence Intelligence Platform — the same evidence core answers both perspectives without data duplication.

---

## DTO Catalog

| DTO | Source | Purpose |
|-----|--------|---------|
| `SponsorPortfolioView` | `portfolio.ts` | Aggregated institution cards for a program type |
| `SponsorInstitutionCard` | `portfolio.ts` | Single institution in sponsor's portfolio view |
| `PortfolioSummary` | `portfolio.ts` | Aggregate stats (ready, partial, not_ready counts) |
| `ProgramMatchResult` | `program-matching.ts` | Program-to-institutions matching output |
| `ProgramInstitutionMatch` | `program-matching.ts` | Single institution match with strength + rationale |
| `ExecutiveSummary` | `decision-views.ts` | Decision-oriented headline + risk level + action |
| `CapabilitySummaryView` | `decision-views.ts` | Per-capability status with coverage % |
| `EvidenceHighlight` | `decision-views.ts` | Key evidence items supporting a capability |
| `ConfidenceDistribution` | `decision-views.ts` | Bucketed confidence across institutions |
| `ReadinessDistribution` | `decision-views.ts` | Readiness status breakdown |
| `SponsorAlert` | `monitoring.ts` | DERIVED alert — never stored |
| `RecommendationExplanation` | `explainability.ts` | Why this recommendation, with evidence trace |
| `ActorRole` | `multi-actor.ts` | sponsor, cro, institution, admin |

---

## Module Summary

| Module | LOC | Key Function |
|--------|-----|-------------|
| `dto.ts` | 115 | All 13 DTO types |
| `portfolio.ts` | 90 | `buildSponsorPortfolio` — aggregates by program type |
| `program-matching.ts` | 110 | `matchInstitutionsToProgram` — inverse query |
| `decision-views.ts` | 145 | Executive summary, capability summary, distributions |
| `monitoring.ts` | 95 | `detectChanges` — pure function, derived alerts |
| `explainability.ts` | 55 | `explainRecommendation` — evidence trace chain |
| `multi-actor.ts` | 70 | RLS-aware visibility per actor role |
| `index.ts` | 35 | Public API exports |

---

## Boundary Validation

| Rule | Status |
|------|--------|
| No direct Evidence Core imports | ✅ Verified — package.json has zero `@kadarn/evidence-core` dependency |
| No Readiness API modification | ✅ Consumes types only |
| No Capability Intelligence modification | ✅ Consumes types only |
| No Marketplace references | ✅ grep: zero hits for marketplace, monetization, payment |
| No AI/LLM reasoning | ✅ All functions are deterministic |
| No single institutional score | ✅ Per-program-type outputs |
| No certification language | ✅ Banned vocabulary not present |
| All outputs explainable | ✅ `explainRecommendation` traces to evidence |
| Multi-actor visibility enforced | ✅ `canActorSeeInstitution` per role |
| Alerts are derived, not stored | ✅ `detectChanges` is pure function |

---

## Test Coverage (13 cases)

| # | Test | Status |
|---|------|--------|
| 1 | Portfolio aggregates institutions by program type | ✅ |
| 2 | Program matching ranks by readiness | ✅ |
| 3 | Program matching includes rationale | ✅ |
| 4 | Executive summary produces actionable headline | ✅ |
| 5 | Monitoring detects readiness increase | ✅ |
| 6 | Monitoring detects capability loss | ✅ |
| 7 | Explainability traces to evidence | ✅ |
| 8 | Sponsor sees network-visible institutions | ✅ |
| 9 | Sponsor cannot see private institutions | ✅ |
| 10 | No Evidence Core dependency | ✅ |
| 11 | Program view is inverse of institution view | ✅ |
| 12 | No Marketplace references | ✅ |
| 13 | Alerts are derived (pure functions) | ✅ |

---

## Performance Considerations

- **Portfolio pagination**: `buildSponsorPortfolio` returns full list. Consumer should paginate (recommend 25 per page).
- **Incremental refresh**: `detectChanges(previous, current)` enables change detection without full recalculation.
- **Caching**: All outputs are pure functions of evaluation data. Consumer can cache by `generatedAt` or `evaluation_snapshot.computed_at`.
- **No real-time requirement**: All functions are synchronous. No async I/O, no DB access.

---

## KTP-1.x Completion Assessment

### What Was Built

| # | Layer | Status |
|---|---|---|
| 1 | Product Assessment + Blueprint | ✅ |
| 2 | Decision Matrix + Schema Plan | ✅ |
| 3 | Schema Implementation (3 migrations) | ✅ |
| 4 | Runtime Integration (E2E pipeline) | ✅ |
| 5 | Readiness API & Public Contracts (8 endpoints, DTOs frozen) | ✅ |
| 6 | Capability & Knowledge Intelligence (6 modules) | ✅ |
| **7** | **Sponsor Intelligence Runtime (7 modules, 13 DTOs, 2 query models)** | ✅ |

### Architecture Achievements

- **Program Readiness** as the new product entry point
- **Evidence → Claims → Confidence → Capability → Readiness** pipeline validated E2E
- **Evidence Core preserved as content-agnostic** — ADR-011 boundary enforced
- **Two query models** — Institution View + Program View on same evidence graph
- **No AI/LLM** — all intelligence is deterministic and explainable
- **No certifications** — platform explains, does not certify
- **Multi-actor visibility** — Sponsor, CRO, Institution, Admin with RLS
- **All alerts derived** — no stored alert state

---

## Residual Risks

| Risk | Mitigation |
|------|------------|
| Sponsor Portfolio not paginated at module level | Consumer must paginate (recommendation included) |
| No performance testing with large datasets | Premature for MVP. Add when portfolio exceeds 100 institutions |
| Multi-actor visibility is pure functions — no actual RLS integration yet | Integration with DB RLS in KTP-2.0 |
| Trend detection is simplified (stable default) | Requires historical evaluation data for real trend computation |

---

## Recommendation for KTP-2.0

KTP-1.x is complete. The architectural core is solid — Program Readiness pipeline, Readiness API, Capability Intelligence, and Sponsor Intelligence are all operational with validated boundaries.

**KTP-2.0 should focus on:**
1. **User Experience** — Readiness Dashboard UI, Institution Onboarding, Sponsor Portfolio UI
2. **Institution Onboarding** — Self-service registration, capability self-assessment wizard, evidence upload
3. **Commercial Adoption** — First real institutions, first real sponsors, pilot programs
4. **Production Hardening** — Platform admin role, DB trigger validation, caching strategy, performance benchmarks
5. **Marketplace Activation** — As a consumer of Sponsor Intelligence, not a producer

---

*End of KTP-1.6 Mission 7 — KTP-1.x Complete.*
