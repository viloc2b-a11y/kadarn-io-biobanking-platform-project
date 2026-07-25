# KAD-LOOP-004 — Loop Charter

## Loop ID
KAD-LOOP-004

## Name
Confidence Engine

## Status
ACTIVE

## Branch
`feat/loop-4-confidence` (from master, post LOOP-3 merge)

## Migration Head
085

## Purpose
Implement the canonical Confidence Engine for KADARN. Calculate explainable, versioned and reproducible confidence for institutional Capabilities using reviewed Claims, Evidence Sufficiency, conflict state, freshness and governance status.

## Canonical Flow
```
InstitutionalEvent → SourceRecord → Evidence → Review → Claim → Capability → Confidence Assessment → Passport
```

## Scope
- ✅ Confidence Models (governed, versioned methodology)
- ✅ Confidence Rules (explicit, effective-dated, attributable)
- ✅ Input Eligibility Gate (4 states: ELIGIBLE, ELIGIBLE_WITH_WARNINGS, MANUAL_REVIEW_REQUIRED, NOT_ELIGIBLE)
- ✅ Deterministic Calculation Engine (same inputs → same output)
- ✅ Scoring Dimensions (8: coverage, quality, review, freshness, consistency, completeness, diversity, governance)
- ✅ Penalties & Blockers (rule-based, traceable)
- ✅ Immutable Assessments (versioned, hashed, replayable)
- ✅ Stale Detection (upstream change detection, preserves history)
- ✅ Institution-Level Summary (transparent aggregation, no unexplained roll-up)

## Out of Scope
- ❌ Passport publishing and external sharing (LOOP 5)
- ❌ Generative AI as scoring authority
- ❌ Confidence from raw documents or isolated Evidence
- ❌ Redesign of existing UI

## Core Principle
Confidence is not a decorative score. Every assessment must explain: what was evaluated, which capability, which claims, which evidence, which rules, which weights, which penalties, which blockers, whether conflicts existed, whether evidence expired, model version, timestamps, input/output hashes.

## Orchestrator
Hermes — architecture, governance, decomposition, validation, acceptance

## Implementation
PI Coding Agent / delegation subagents — migrations, repositories, services, APIs, tests, bounded UI integration, implementation documentation

## Exit Criteria
- LOOP-3 merged and validated on master
- Confidence domain model canonical
- Models and rules governed and versioned
- Eligibility gate operational
- Calculation deterministic
- Scoring dimensions explicit
- Weights model-version controlled
- Penalties/blockers rule-based
- Assessments immutable
- Replay operational
- Input/output hashing operational
- Stale detection operational
- Capability confidence explainable
- Institution summary transparent
- APIs operational
- UI connected
- RLS and tenant isolation validated
- Build green, typecheck 0 new errors, 0 LOOP-4 regressions
- Ready for Passport (LOOP 5)