# ADR-010: Trust Engine Retirement

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Kadarn Architecture  
**Baseline:** AF-1.0  
**Supersedes:** ADR-011 (Trust Engine — Evidence-Based Trust Computation)  

---

## Context

Kadarn was originally designed around the concept of **Trust** as a computed, evidence-based assessment of institutional reliability. This produced:

- A **Trust Engine** (`packages/trust-engine/`) with scoring algorithms
- A **Trust Score** model (four dimensions, 0.0–1.0, decaying)
- A **Trust Graph** in KRM-RAO §4.4
- A **Trust Fabric** in the reference model
- Trust Levels (Gold/Silver/Bronze) as qualitative labels

The publication of **KEMS-001 v1.0** (ratified per P0-002, Baseline AF-1.0) introduces a fundamentally different epistemological model:

> *Kadarn never asserts institutional truth. Kadarn represents the current state of evidence supporting institutional claims.*

The fundamental unit shifts from a **Trust Score** (aggregate numeric) to a **Claim** (specific, evidence-supported assertion) with a **Confidence Graph** that produces an emergent **Confidence State** (0–100, explainable per Claim).

The two models are incompatible at the concept level. The "Trust" paradigm implies Kadarn makes judgments about institutions. The "Evidence → Claim → Confidence" paradigm implies Kadarn organizes navigable evidence and lets confidence emerge from it.

---

## Decision 1: Trust as a product is retired

Trust is no longer a product, a feature, or a capability of the Kadarn platform.

**What this means:**
- Kadarn does not produce a "Trust Score" for any institution.
- Kadarn does not certify, verify, or rate institutions.
- Kadarn organizes evidence. That is its only role in institutional assessment.

**What this does not mean:**
- Existing implementations are not deleted. They are marked as pending migration (see Decision 4).
- Users who previously relied on Trust Scores are not abandoned — a migration path will be defined in subsequent architecture.

---

## Decision 2: Trust Score is retired

The concept of a single numeric Trust Score (0.0–1.0) for an organization is replaced by the KEMS-001 model.

**Replacement:**
- A **Confidence State** (0–100) per **Claim**, not per organization.
- Every Confidence State includes a mandatory, navigable explanation.
- Confidence Level: High / Moderate / Low / Insufficient (replaces Gold/Silver/Bronze).

---

## Decision 3: Trust Engine is retired as an architectural concept

"Trust Engine" ceases to exist as a canonical Engine in Kadarn's architecture.

**What this means:**
- KRM-RAO v2.0 (P0-008) will not include Trust Engine in its canonical list.
- New architecture documentation shall not reference Trust Engine without citing this ADR.
- The term "Trust Engine" enters the Retired Terms Registry.

**What this does not mean:**
- The architectural decision about whether a **Confidence Engine** exists is **deferred**. KEMS-001 §5 leaves the algorithm as an open question. A future ADR may define a Confidence Engine or delegate confidence computation to the Intelligence Engine or another mechanism. This ADR does not pre-judge that decision.

---

## Decision 4: Existing implementation is preserved and marked for migration

The code in `packages/trust-engine/` and `database/migrations/023_trust_engine.sql` contains algorithms, data structures, and patterns that may be reusable. This ADR does not delete them.

**Classification:**
| Component | Status | Action |
|-----------|--------|--------|
| `packages/trust-engine/src/engine.ts` — scoring, decay, weighting, traversal | 🟡 Pendiente de migración | Algoritmos reutilizables en Confidence Engine o Intelligence Engine |
| `packages/trust-engine/src/service.ts` — service layer | 🟡 Pendiente de migración | Requiere refactor para operar sobre Claims |
| `packages/trust-engine/src/types.ts` — OrganizationTrust, TrustEvent, TrustChallenge | 🟡 Pendiente de migración | Types obsoletos. Servirán como referencia para nuevos types. |
| `database/migrations/023_trust_engine.sql` | 🟡 Pendiente de migración | Schema reusable como base de Confidence State storage |
| `apps/api/.../trust/route.ts` | 🟡 Pendiente de migración | API debe alinearse con Confidence State |
| `tests/trust/trust-engine.test.ts` | 🟡 Pendiente de migración | Tests de algoritmos reutilizables |

**Regla:** Ninguno de estos componentes puede ser eliminado sin un ADR específico que evalúe su contenido y decida su destino.

---

## Decision 5: All future references must use KEMS-001 vocabulary

From the effective date of this ADR, any new documentation, code, API design, or architectural artifact must use the vocabulary defined in KEMS-001.

**Permitted vocabulary:** Claim, Evidence Node, Evidence Class (A–F), Confidence Graph, Confidence State, Confidence Value, Confidence Level, Counter Evidence, Right of Response, Temporal Decay.

**Prohibited vocabulary:** Trust Score, Trust Engine, Trust Graph, Trust Fabric, Trust Level, Verified (as institutional label), Certification (as institutional label), Gold/Silver/Bronze.

**Enforcement:** The Architecture Freeze Checklist (P0-001) gate rules apply. The terminology lint (to be defined in P0-006 — Lexicon v1.2) will codify this as an automated check.

---

## Impact

| Area | Impact |
|------|--------|
| **Architecture documentation** | KRM-RAO v1.0 §4.4 (Trust Graph) and §5.4 (Trust Engine) must be rewritten. KRM-BNO v1.1 references must be updated. |
| **Lexicon** | Terms must be removed or redefined. |
| **Code** | `packages/trust-engine/` and related routes preserved but marked pendiente de migración. No deletion without a future ADR. |
| **Tests** | `tests/trust/` preserved but marked pendiente de migración. |
| **Communication** | No external communication shall reference Trust Scores, Trust Levels, or similar terms after this ADR. |
| **Contracts/BAAs** | Legal review required to ensure no contractual reference to "Trust Score" exists. |

---

## Dependencies

| Artifact | Relationship |
|----------|-------------|
| KEMS-001 v1.0 (P0-002) | Provides the replacement model |
| Lexicon v1.2 (P0-006) | Must reflect retired terms after this ADR |
| KRM-RAO v2.0 (P0-008) | Must remove Trust Engine/Graph/Fabric |
| KRM-BNO v1.2 (P0-009) | Must update Trust references |
| Sprint 17 | Cannot begin until all dependent artifacts are updated |

---

## Open questions (deferred)

| Question | Resolution path |
|----------|----------------|
| Does a Confidence Engine exist as a canonical Engine? | Future ADR (deferred to Phase 1 planning) |
| How does the Confidence State algorithm map graph structure to value 0–100? | Future ADR (KEMS §5 — open question) |
| What is the migration path for existing Trust Score consumers? | Future RFC |

---

## Signature

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Architecture Lead | | 2026-07-01 | |
| Engineering Lead | | | |
| Product / Strategy | | | |

---

*This document is artifact P0-003 of the Architecture Freeze Baseline AF-1.0. It supersedes ADR-011 (Trust Engine — Evidence-Based Trust Computation) in its entirety.*
