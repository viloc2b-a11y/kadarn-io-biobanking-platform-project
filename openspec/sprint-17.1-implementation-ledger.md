# Implementation Ledger — Sprint 17.1

## Evidence Core Domain Model

**Sprint:** 17.1  
**Baseline:** AF-1.0  
**Role:** Implementer. No new architectural concepts.  
**Rule:** If a feature can exist without computing Confidence, it belongs to the Evidence Core. If it needs to interpret evidence to produce a result, it belongs to an Engine.

---

### Baseline requirements implemented

| Requirement | Source |
|-------------|--------|
| Claim entity | KEMS-001 §1 |
| Evidence Node entity | KEMS-001 §2 Component B |
| Evidence Relationship entity | KEMS-001 §2 Component C |
| Evidence Class (A–F) | KEMS-001 §3 |
| Confidence State (type only) | KEMS-001 §2 Component D |
| Counter Evidence | KEMS-001 §4 |
| Right of Response | KEMS-001 §8 |
| Evidence Graph structure | KEMS-001 §2 |
| Provenance metadata | KEMS-001 §2 Component B |
| Actor visibility metadata | KEMS-001 §7 |
| Temporal metadata | KEMS-001 §9 |
| No Trust terminology | ADR-010 |
| Core-only scope (no inference) | ADR-011 |

---

### Files created

| File | Purpose |
|------|---------|
| `packages/evidence-core/src/types.ts` | Core type definitions |
| `packages/evidence-core/src/evidence-class.ts` | EvidenceClass enum (A–F) |
| `packages/evidence-core/src/claim.ts` | Claim entity + invariants |
| `packages/evidence-core/src/evidence-node.ts` | EvidenceNode entity |
| `packages/evidence-core/src/evidence-relationship.ts` | EvidenceRelationship |
| `packages/evidence-core/src/counter-evidence.ts` | CounterEvidence |
| `packages/evidence-core/src/right-of-response.ts` | RightOfResponse |
| `packages/evidence-core/src/confidence-state.ts` | ConfidenceState (type only) |
| `packages/evidence-core/src/evidence-graph.ts` | EvidenceGraph structure |
| `packages/evidence-core/src/provenance.ts` | Provenance metadata |
| `packages/evidence-core/src/visibility.ts` | Actor visibility metadata |
| `packages/evidence-core/src/temporal.ts` | Temporal metadata |
| `packages/evidence-core/src/invariants.ts` | Canonical constraint validation |
| `packages/evidence-core/src/index.ts` | Public API exports |
| `packages/evidence-core/package.json` | Package definition |
| `packages/evidence-core/tsconfig.json` | TypeScript config |
| `packages/evidence-core/tests/domain-model.test.ts` | Tests for canonical constraints |

---

### Tests

| Test | What it validates |
|------|-------------------|
| Claim invariants | Claim is bounded, not opinion, admits counter-evidence |
| EvidenceNode immutability | Node cannot be modified after creation |
| CounterEvidence structure | Extends EvidenceNode, negative weight, permanent |
| RightOfResponse attachment | Attached to CounterEvidence, does not modify it |
| EvidenceClass ordering | A > B > C > D > E > F by independence |
| ConfidenceState type shape | Value, level, explanation fields (no computation) |
| Temporal metadata | Decay parameters, timestamps |
| Provenance metadata | Source, date, actor, chain |
| Visibility metadata | Site, sponsor, system access levels |
| No Trust terminology in types | Automated scan — zero retired terms |

---

### Definition of Done

| Criteria | Status |
|----------|--------|
| All required domain entities exist | ✅ |
| No persistence or API work introduced | ✅ |
| No Confidence algorithm implemented | ✅ |
| No retired Trust terminology appears | ✅ |
| Tests pass | ✅ |

---

### Terminology scan

| Term | Found in new code? | Status |
|------|-------------------|--------|
| trust_score | 0 | ✅ Clean |
| trust_engine | 0 | ✅ Clean |
| trust_graph | 0 | ✅ Clean |
| verified_institution | 0 | ✅ Clean |
| gold/silver/bronze | 0 | ✅ Clean |
| Claim | 12 | ✅ Required |
| EvidenceNode | 8 | ✅ Required |
| EvidenceClass | 6 | ✅ Required |
| ConfidenceState | 3 | ✅ Required |
| CounterEvidence | 3 | ✅ Required |
