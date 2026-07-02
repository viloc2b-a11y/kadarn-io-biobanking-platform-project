# Sprint 20B — Institutional Intelligence Completion Report

**Date:** 2026-07-01
**Baseline:** AF-1.0 / Sprint 20A Completion

---

## Executive Summary

Sprint 20B (Institutional Intelligence) is complete. The full pipeline from DiscoveryResult to InstitutionalProfile is implemented, tested, and gated. No Evidence Core writes occur at any stage. Every component is explainable and traceable to evidence.

---

## Sprint 20B — Deliverables

| Sprint | Component | Tests |
|--------|-----------|-------|
| 20B.1 | Institutional Timeline Reconstruction | 11 |
| 20B.2 | Capability Detection | 33 |
| 20B.3 | Claim Candidate Detection | 26 |
| 20B.4 | Evidence Gap Detection | 18 |
| 20B.5 | Institutional Narrative Engine | 24 |
| 20B.6 | Institutional Profile Builder | 20 |
| 20B.7 | Discovery UX Architecture | 16 |
| 20B.8 | Integration + E2E + Gates | **22** |
| **Total** | | **170** (Sprint 20B) + 131 (Sprint 20A) = **301** |

---

## Pipeline Architecture

```
DiscoveryResult (20A)
       │
       ▼
┌─────────────────────────────┐
│ TimelineEngine              │  20B.1 — Chronological reconstruction
│   → InstitutionalTimeline   │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ CapabilityDetector          │  20B.2 — 20 rules across 6 categories
│   → CandidateCapability[]   │
├─────────────────────────────┤
│ CapabilityNormalizer        │  Canonical names + dedup
├─────────────────────────────┤
│ CapabilityGates             │  Quality filters
├─────────────────────────────┤
│ StopConditionEvaluator      │  Runaway prevention
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ ClaimCandidateDetector      │  20B.3 — Capability → Claim mapping
│   → CandidateClaim[]        │  16 mapping rules, evidence coverage
├─────────────────────────────┤
│ ClaimGates                  │  Quality filters
├─────────────────────────────┤
│ ClaimStopConditionEvaluator │  Stop conditions
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ EvidenceGapDetector         │  20B.4 — 4-axis coverage analysis
│   → GapAnalysisReport       │  Severity levels, recommendations
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ NarrativeEngine             │  20B.5 — Evidence-cited narrative
│   → InstitutionalNarrative  │  5 sections, every sentence cites evidence
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ ProfileBuilder              │  20B.6 — Combined InstitutionalProfile
│   → InstitutionalProfile    │  Readiness score, status, summary
├─────────────────────────────┤
│ ProfileBuilder              │  analyzeReadiness() — blockers + warnings
│   .analyzeReadiness()       │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ DiscoveryUXOrchestrator     │  20B.7 — UX state machine
│   → UX phases & messages    │  onboarding → uploading → processing → reviewing → complete
└─────────────────────────────┘
```

---

## Architectural Invariants Verified (20B Gates)

| Invariant | Status |
|-----------|--------|
| Timeline engine never creates Claims | ✅ All 7 components verified |
| Capability detector never creates Claims | ✅ |
| Claim Candidate detector never creates official Claims | ✅ |
| Gap detector never modifies Evidence Core | ✅ |
| Narrative engine never invents information | ✅ Every sentence cites evidence |
| Profile builder never promotes to Evidence Core | ✅ |
| UX orchestrator never creates Evidence Nodes | ✅ |
| Every component is explainable | ✅ reasoning / humanExplanation on all outputs |

---

## New Files Created in Sprint 20B

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/capability/` | types, engine, normalization, gates, stop-conditions, index | 20B.2 |
| `src/claim-candidate/` | types, mapping, detector, gates, stop-conditions, index | 20B.3 |
| `src/gap-detection/` | types, detector, index | 20B.4 |
| `src/narrative/` | types, engine, index | 20B.5 |
| `src/profile/` | types, builder, index | 20B.6 |
| `src/discovery-ux/` | types, orchestrator, index | 20B.7 |
| `tests/` | 20b-integration.test.ts | 20B.8 |

---

## Test Results

| Metric | Value |
|--------|-------|
| Test files | **17** |
| Total tests | **301** |
| Failures | **0** |
| TS errors | **0** |

## Next Steps

### Sprint 20C — Evidence Promotion Pipeline (suggested)
Bridge Institutional Profile → Evidence Core. Promote curated capabilities and claims while maintaining audit trail.

### Additional Candidates
- Cross-Institutional Comparison (20B.x)
- Capability Scoring & Ranking (20B.x)
- UX/Curation UI (visual)
- Evidence Explorer (institutional profile browser)

---

*This report closes Sprint 20B (Institutional Intelligence). Baseline AF-1.0 remains in effect. 301 tests, 0 failures, 0 Evidence Core writes.*
