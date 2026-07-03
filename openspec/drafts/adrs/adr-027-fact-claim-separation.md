# ADR-027 — Fact / Claim Separation

**Status:** Proposed  
**Date:** 2026-07-03  
**Target sprint:** 28B, 28C  
**Baseline:** AF-2.0, KEMS-004  
**Related:** [phase-8-evidence-evolution-architecture.md](../../phase-8-evidence-evolution-architecture.md)

---

## Context

Discovery and legacy continuity paths can create Claims directly from document or agent output. Phase 8 requires strict separation: documents produce Facts; Facts produce Claim Candidates; review produces Claims.

---

## Decision

1. **No Document → Claim path.** All Claims must trace to `ExtractedFact` records with SourceVersion, parser version, and offset.
2. **ExtractedFact** is the atomic unit of document-derived truth (Sprint 28B).
3. **ClaimCandidate** is a proposed assertion derived from Facts via rules (Sprint 28C).
4. **Claim** is immutable once published; corrections append new versions or events.

---

## Consequences

| Area | Impact |
|------|--------|
| Discovery agents | Output maps to Facts, not Claims |
| evidence-lineage | Owns Fact → Candidate → Claim chain |
| evidence-discovery | Agent JSON becomes ExtractionRun input |
| continuity | Legacy claims remain until Compatibility Layer (28D) |

---

## Acceptance criteria (28C gate)

- [ ] No code path creates Claim from document without Facts
- [ ] Contract tests enforce separation in `packages/types/src/phase8/`
