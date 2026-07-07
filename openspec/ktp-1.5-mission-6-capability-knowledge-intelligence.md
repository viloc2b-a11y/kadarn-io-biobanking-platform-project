# KTP-1.5 — Mission 6: Capability & Knowledge Intelligence Layer

> **Date:** 2026-07-06
> **Status:** COMPLETE (Gap Closure applied via KTP-1.5A)
> **Verdict:** PASS — Ready for Mission 7 (Sponsor Intelligence Runtime)

---

## Executive Summary

The Capability & Knowledge Intelligence Layer consumes Readiness API outputs and produces decision-oriented capability intelligence. It interprets Readiness without certifying it, explains gaps without judging institutions, and provides sponsor-facing and institution-facing projections as pure derived views.

Core principle: **Explain and recommend. Do NOT certify, score, or create semantic truth.**

---

## Architecture Position

```
┌──────────────────────────────────────────────┐
│  Sponsor Intelligence (Mission 7)             │  ← consumes this layer
│  Marketplace (future)                         │  ← consumes this layer
├──────────────────────────────────────────────┤
│  CAPABILITY & KNOWLEDGE INTELLIGENCE (M6)     │  ← THIS LAYER
│  ┌────────────┬───────────┬────────────────┐  │
│  │ Gap        │ Program   │ Sponsor        │  │
│  │ Analysis   │ Fit       │ Decision View  │  │
│  ├────────────┼───────────┼────────────────┤  │
│  │ Capability │ Readiness │ Improvement    │  │
│  │ Matrix     │ Interp.   │ Recommend.     │  │
│  └────────────┴───────────┴────────────────┘  │
├──────────────────────────────────────────────┤
│  Readiness API v1 (Mission 5)                 │  ← consumes DTOs from here
│  Readiness Engine (Mission 3-4)               │
├──────────────────────────────────────────────┤
│  Evidence Core / KEMS / Provenance            │  ← NOT consumed directly
│  (Mission 3 boundary — no direct access)      │
└──────────────────────────────────────────────┘
```

**Key boundary**: This layer consumes `ReadinessEvaluation` DTOs from `@kadarn/readiness-engine`. It does NOT read directly from Evidence Core, Claims, or Provenance tables.

---

## DTO Catalog

| DTO | Source File | Purpose |
|-----|------------|---------|
| `CapabilityMatrix` | `matrix.ts` | Per-program-type capability dimensions with status and interpretation |
| `EvidenceGap` | `gaps.ts` | Structured gap: capability, evidence class, severity, recommendation |
| `ReadinessInterpretation` | `interpretation.ts` | Human-readable interpretation of readiness state |
| `ProgramFitAssessment` | `fit.ts` | Institution-to-program fit with strengths and development areas |
| `ImprovementRecommendation` | `recommendations.ts` | Prioritized actions to reach next readiness level |
| `SponsorDecisionView` | `sponsor-view.ts` | DERIVED projection for sponsor consumption (never stored) |

All DTOs are defined in `packages/evidence-discovery/src/capability-intelligence/types.ts`.

---

## Boundary Rules

| Rule | Status |
|------|--------|
| Consumes Readiness API DTOs, not raw Evidence Core data | ✅ Enforced |
| Does NOT import from `@kadarn/evidence-core` | ✅ Verified |
| Does NOT write to evidence_nodes, claims, or confidence tables | ✅ Pure functions only |
| Does NOT produce a single institutional score | ✅ Per-program-type outputs |
| Does NOT use certification language ("verified", "certified", "guaranteed") | ✅ Banned vocabulary |
| Does NOT introduce Marketplace logic or references | ✅ Zero hits |
| Does NOT use AI/LLM reasoning | ✅ Deterministic rule-based |
| Sponsor-facing views are pure derived projections | ✅ No stored state |
| Recommendations are explainable — trace to evidence class + capability | ✅ Every recommendation includes both |

---

## Implementation Summary

### Files Created/Modified

| File | Action | LOC |
|------|--------|-----|
| `packages/evidence-discovery/src/capability-intelligence/types.ts` | Created | 156 |
| `packages/evidence-discovery/src/capability-intelligence/engine.ts` | Created | 434 |
| `packages/evidence-discovery/src/capability-intelligence/matrix.ts` | Created | ~80 |
| `packages/evidence-discovery/src/capability-intelligence/gaps.ts` | Created | ~90 |
| `packages/evidence-discovery/src/capability-intelligence/interpretation.ts` | Created | ~100 |
| `packages/evidence-discovery/src/capability-intelligence/fit.ts` | Created | ~110 |
| `packages/evidence-discovery/src/capability-intelligence/recommendations.ts` | Created | ~120 |
| `packages/evidence-discovery/src/capability-intelligence/sponsor-view.ts` | Created | ~90 |
| `packages/evidence-discovery/src/capability-intelligence/index.ts` | Updated | 25 |
| `packages/knowledge-engine/src/index.ts` | Updated | ~40 |
| `tests/intelligence/intelligence-engine.test.ts` | Updated | ~250 |
| `openspec/ktp-1.5-mission-6-capability-knowledge-intelligence.md` | Created | — |

### Test Coverage (8 cases)

| # | Test | Status |
|---|------|--------|
| 1 | Consumes Readiness API outputs | ✅ |
| 2 | No Evidence Core mutation | ✅ |
| 3 | No Marketplace dependency | ✅ |
| 4 | Recommendations are explainable | ✅ |
| 5 | Missing evidence → gaps, not judgments | ✅ |
| 6 | No single institutional score | ✅ |
| 7 | Sponsor view is derived projection | ✅ |
| 8 | Recommendations non-certifying | ✅ |

---

## Knowledge Engine Integration

The Knowledge Engine (`packages/knowledge-engine/`) now exports:
- `normalizeCapabilityName(name: string): string` — deterministic regex-based mapping to controlled vocabulary
- `getRelatedCapabilities(name: string): string[]` — returns sibling capabilities in same category
- `suggestMissingCapabilities(existingNames: string[]): string[]` — based on category coverage, suggests capabilities the institution may be missing

These functions consume capability-intelligence types. The Knowledge Engine does NOT own capability logic — it provides taxonomy enrichment.

---

## Residual Risks

| Risk | Mitigation |
|------|------------|
| Capability name normalization is regex-based — edge cases possible | Accept for MVP. Upgrade to embedding-based in later mission if needed |
| SponsorDecisionView not yet consumed by any runtime | Mission 7 (Sponsor Intelligence Runtime) will be first consumer |
| Knowledge Engine still thin (22→62 LOC) | Sufficient for taxonomy enrichment. Full ontology deferred to later mission |
| No performance testing on large capability matrices | Premature for MVP. Add when >50 institutions have evaluations |

---

## Verdict: PASS

The Capability & Knowledge Intelligence Layer is complete and ready for consumption. All boundary rules are verified. All 8 test cases pass. The layer explains without certifying, recommends without judging, and provides sponsor-facing projections as pure derived views.

**Recommendation for Mission 7**: Proceed with Sponsor Intelligence Runtime, which will consume both Readiness API v1 (Mission 5) and Capability Intelligence (Mission 6) as its primary data sources.

---

*End of KTP-1.5 Mission 6 Capability & Knowledge Intelligence Layer Specification.*
