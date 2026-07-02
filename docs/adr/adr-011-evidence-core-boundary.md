# ADR-011: Evidence Core Boundary Rule

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Kadarn Architecture  
**Baseline:** AF-1.0  
**Supersedes:** — (new ADR)  

---

## Context

KEMS-001 defines the Evidence Core as the foundational layer of Kadarn — the system of record for Claims, Evidence Nodes, Relationships, and Confidence State. However, KEMS does not define where the Core ends and the Engines begin.

Without an explicit boundary rule, two failure modes emerge:

1. **Core bloat** — functionality that interprets, infers, or modifies evidence migrates into the Core, making it unstable, opinionated, and hard to change.
2. **Boundary drift** — different teams make different assumptions about what belongs in the Core, producing inconsistent implementations across the platform.

This ADR exists to answer one question:

> **How does Kadarn decide whether a capability belongs to the Evidence Core or to an Engine?**

---

## Boundary Principle

> **If there is any reasonable doubt about whether a function interprets, infers, or modifies the meaning of evidence, that function does NOT belong to the Evidence Core.**

This principle is intentionally conservative. The Core must be stable, deterministic, and change very little. Innovation, interpretation, and computation belong in Engines — not in the Core.

---

## The Five-Condition Test

A capability belongs to the **Evidence Core** if and only if **all five** conditions are true:

| # | Condition | Rationale |
|---|-----------|-----------|
| 1 | **Store** — The capability persists evidence or evidence metadata to durable storage. | The Core is the system of record. If it doesn't persist, it's not Core. |
| 2 | **Provenance** — The capability preserves the complete creation and modification history of the evidence, without altering or deleting prior states. | Trust in the Core depends on immutable history. Append-only is a hard requirement. |
| 3 | **Relations** — The capability creates, maintains, or traverses relationships between evidence nodes. | The Confidence Graph (KEMS §2) is a graph of relationships. Without relations, there is no graph. |
| 4 | **Access** — The capability enforces visibility policy (who can see which evidence). | KEMS §7 defines a multi-actor visibility model. The Core must enforce it. |
| 5 | **Process State** — The capability tracks the state of an evidence lifecycle (submitted, disputed, responded, resolved) without interpreting the content of the evidence. | The Core tracks process. It does not evaluate meaning. |

If **any** of these conditions is false, the capability belongs to an **Engine**.

### Application rule

A function that meets all five conditions **may** be in the Core. Not all functions that meet the conditions need to be in the Core — but no function that fails any condition may be in the Core.

---

## Diagram

```
                      Evidence
                         │
                         ▼
              ┌─────────────────────┐
              │                     │
              │   Evidence Core     │
              │                     │
              │  • Store            │
              │  • Provenance       │
              │  • Relations        │
              │  • Access           │
              │  • Process State    │
              │                     │
              └────────┬────────────┘
                       │
                       ▼
              ┌─────────────────────┐
              │                     │
              │   Evidence Graph    │
              │   (Core output)     │
              │                     │
              └────────┬────────────┘
                       │
                       ▼
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌────────┐   ┌────────────┐   ┌──────────┐
   │Confid. │   │ Knowledge  │   │Analytics │
   │Engine  │   │ Engine     │   │Engine    │
   └────────┘   └────────────┘   └──────────┘
   ┌────────┐   ┌────────────┐   ┌──────────┐
   │AI      │   │ Matching   │   │Reports   │
   │Engine  │   │ Engine     │   │          │
   └────────┘   └────────────┘   └──────────┘
```

---

## Examples

| Function | Core? | Engine? | Why |
|----------|-------|---------|-----|
| Store a SOP as Class B Evidence Node | ✅ | | Stores evidence + provenance (conditions 1, 2) |
| Register an Evidence Node with source, date, class | ✅ | | Stores + provides provenance (1, 2) |
| Link two Evidence Nodes via "supports" relationship | ✅ | | Maintains relations (3) |
| Register Counter Evidence | ✅ | | Process state + store (1, 5) |
| Register Right of Response | ✅ | | Process state + store + relations (1, 3, 5) |
| Enforce site/sponsor visibility per KEMS §7 | ✅ | | Access control (4) |
| Resolve Confidence Value (0-100) from graph | | ✅ | Interprets evidence meaning. Fails condition check (interprets). |
| Detect anomalies in evidence submission patterns | | ✅ | Infers meaning from evidence metadata. Fails condition check. |
| Recommend a site based on Confidence Graphs | | ✅ | Interprets + infers. Engine concern. |
| Calculate benchmark percentile for a Claim | | ✅ | Computes aggregate — not a Core function. |
| Generate human-readable explanation via AI | | ✅ | Interprets evidence and generates derived content. |
| Match a sponsor's feasibility criteria to sites | | ✅ | Cross-engine interpretation. Matching Engine concern. |
| Compute Temporal Continuity score (Class E) | | ✅ | Interprets timeline coherence. KEMS §3 — Class E modulation. |

---

## What the Core is not

The Evidence Core is not:

- A scoring engine
- An AI pipeline
- A recommendation system
- A benchmark calculator
- A confidence formula
- A ranking algorithm

These all interpret, infer, or modify the meaning of evidence. They belong in Engines.

---

## The Core is intentionally boring

> **The Evidence Core is intentionally boring.**

It does five things. It does them deterministically. It changes rarely. It does not contain business logic, scoring formulas, AI models, or inference rules.

Innovation, differentiation, and intelligence happen in **Engines** — not in the Core. The Core's job is to be a reliable, append-only, access-controlled record of evidence that every Engine can depend on.

If a capability would make the Core "interesting," it does not belong in the Core.

---

## Impact

| Component | Core? | Action |
|-----------|-------|--------|
| `packages/provenance-graph/` — traversal + evidence chains | ✅ Core | Fits store + provenance + relations. Align with KEMS Evidence Node model. |
| `packages/provenance/` — append-only PROV | ✅ Core | Provenance preservation. Already compliant. |
| `packages/operational-twins/` — twin event streams | 🟡 Borderline | Produces Class C evidence. Core stores evidence produced by twins. Twin generation logic belongs in Operational Twins Engine. |
| `packages/trust-engine/` — scoring, decay, weighting | ❌ Engine | Interprets evidence (weighting, scoring). Pending migration per ADR-010. |
| `packages/intelligence-engine/` — AI classification | ❌ Engine | Interprets evidence via AI. Clear Engine. |
| `packages/policy-engine/` — OPA policy evaluation | ❌ Engine | Evaluates policy against evidence. Interprets meaning. |
| `packages/knowledge-engine/` — ontology normalization | ❌ Engine | Interprets and transforms terms. |
| `packages/matching-engine/` — site feasibility matching | ❌ Engine | Cross-engine inference. |
| `packages/graph-query/` — graph query layer | 🟡 Borderline | Query is a Core concern. Business logic on top is Engine. |

---

## Dependencies

| Artifact | Relationship |
|----------|-------------|
| KEMS-001 v1.0 (P0-002) | Provides the Evidence Core concept this ADR boundaries |
| ADR-010 (P0-003) | Retires Trust Engine — this ADR confirms it as Engine, not Core |
| ADR-012 (P0-005) | Engine governance — Core Engines definition depends on this boundary |
| KRM-RAO v2.0 (P0-008) | Must incorporate this boundary rule as §3.14 |
| Lexicon v1.2 (P0-006) | Must define "Evidence Core" per this ADR's scope |

---

## Consistency check

Pre-ratification review against existing artifacts:

| vs. | Result |
|-----|--------|
| KEMS-001 v1.0 | ✅ Consistent. Core scope aligns with KEMS §2 (Confidence Graph components). |
| ADR-010 | ✅ Consistent. Trust Engine confirmed as Engine, not Core. |
| Baseline AF-1.0 | ✅ Consistent. Boundary Principle reinforces Core stability. |

---

## Signature

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Architecture Lead | | 2026-07-01 | |
| Engineering Lead | | | |
| Product / Strategy | | | |

---

*This document is artifact P0-004 of the Architecture Freeze Baseline AF-1.0. It defines the boundary of the Evidence Core and the five-condition test for classifying capabilities.*
