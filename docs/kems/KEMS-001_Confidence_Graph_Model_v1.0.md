# KEMS-001 — Confidence Graph Model

**Version:** 1.0  
**Status:** Reconstructed Canonical Draft — pending ratification  
**Category:** Architecture Model  
**Authority:** Defines the evidence-to-confidence paradigm  
**Reconstructed:** 2026-07-03  
**Based on:** ADR-010, KEMS-003, AF-2.0  

---

## Purpose

This document defines Kadarn's Confidence Graph Model — the epistemological framework that governs how institutional evidence produces navigable confidence.

It replaces the retired "Trust Score" paradigm (ADR-010) and establishes the permanent vocabulary for Kadarn's evidence architecture.

---

## First Principle

**Kadarn never asserts institutional truth. Kadarn represents the current state of evidence supporting institutional claims.**

This principle is non-negotiable. Every engine, API, UI component, and report must operate within this constraint.

---

## Core Model

```
Evidence Node (verifiable fact)
        ↓
    Claim (assertion supported by evidence)
        ↓
    Confidence Graph (relationships between claims and evidence)
        ↓
    Confidence State (emergent, explainable, per-claim)
```

### What Kadarn Does

- Organizes verifiable evidence
- Surfaces claims supported by that evidence
- Computes emergent confidence from evidence relationships
- Makes every confidence value explainable
- Enables institutional response to claims (Right of Response)

### What Kadarn Does Not Do

- Produce a single numeric "Trust Score" for any institution
- Certify, verify, or rate institutions
- Make assertions about institutional quality
- Replace institutional judgment with algorithmic decisions

---

## Confidence Graph

### Definition

A Confidence Graph is a directed, weighted graph where:

- **Nodes** are Evidence Nodes and Claims
- **Edges** represent evidentiary relationships:
  - `supports` — evidence supports a claim
  - `contradicts` — evidence undermines a claim  
  - `references` — claim builds on prior evidence
  - `responds_to` — institutional response to a claim
- **Weights** represent evidentiary strength (Class A–F)

### Evidence Classes

| Class | Description | Weight |
|-------|-------------|--------|
| A | Primary source, verified, recent | 1.0 |
| B | Primary source, unverified | 0.8 |
| C | Secondary source, authoritative | 0.6 |
| D | Secondary source, unverified | 0.4 |
| E | Self-reported, structured | 0.2 |
| F | Self-reported, unstructured | 0.1 |

---

## Confidence State

### Definition

A Confidence State is an emergent property of the Confidence Graph for a specific Claim. It is:

- **Per-Claim** — never aggregated to an institutional level
- **Explainable** — every value includes mandatory provenance
- **Temporal** — decays without new evidence
- **Appealable** — institutions may respond to claims

### Confidence Levels

| Level | Range | Meaning |
|-------|-------|---------|
| High | 80–100 | Strong, diverse, recent evidence |
| Moderate | 50–79 | Sufficient evidence, some gaps |
| Low | 20–49 | Weak or conflicting evidence |
| Insufficient | 0–19 | No meaningful evidence available |

These qualitative labels replace the retired Gold/Silver/Bronze tier system.

### Confidence Value

A numeric value 0–100, derived from:

1. Evidence class weights (A–F)
2. Evidence recency (temporal decay)
3. Evidence diversity (multiple independent sources)
4. Counter-evidence presence (contradicting nodes)
5. Institutional Right of Response status

The exact algorithm is an open question deferred to a future ADR.

---

## Permanent Vocabulary

### Permitted Terms

| Term | Definition |
|------|-----------|
| Claim | An evidence-supported assertion about an institution |
| Evidence Node | A verifiable fact from a known source |
| Evidence Class | A–F categorization of evidentiary strength |
| Confidence Graph | Directed graph of claims and evidence relationships |
| Confidence State | Emergent explainable state per claim |
| Confidence Value | Numeric 0–100 per claim |
| Confidence Level | Qualitative: High/Moderate/Low/Insufficient |
| Counter Evidence | Evidence that contradicts a claim |
| Right of Response | Institutional ability to respond to claims |
| Temporal Decay | Confidence reduction without new evidence |

### Prohibited Terms (Retired)

| Term | Replacement |
|------|-------------|
| Trust Score | Confidence Value (per claim, not per institution) |
| Trust Engine | Confidence Graph computation (engine TBD) |
| Trust Graph | Confidence Graph |
| Trust Fabric | Confidence State storage |
| Trust Level | Confidence Level |
| Verified (institutional) | Not replaced — Kadarn does not verify |
| Certified (institutional) | Not replaced — Kadarn does not certify |
| Gold/Silver/Bronze | High/Moderate/Low/Insufficient |

---

## Architectural Boundaries

The Confidence Graph Model applies to:

- Evidence Core — stores evidence nodes and claims
- Discovery Pipeline — surfaces claims with confidence states
- Canonical Engines — may operate on the confidence graph

It does NOT apply to:

- Institutional identity resolution (separate model)
- Document intake pipeline (infrastructure, domain-agnostic)
- Connector layer (data transport, no intelligence)

---

## Relationship to KEMS-003

This document is subordinate to KEMS-003 (Kadarn Product Constitution). Where KEMS-003 defines WHAT Kadarn is, this document defines HOW Kadarn models evidence and confidence.

Specifically, this document implements KEMS-003 Principle 1 ("Evidence Precedes Trust") and Principle 3 ("Every Conclusion Must Be Explainable").

---

## Evolution

The algorithm for Confidence Value computation is intentionally deferred. A future ADR may define:

- A specific Confidence Engine
- Graph traversal algorithms
- Weight combination formulas
- Decay functions

Until then, confidence is represented structurally through the graph, without automated aggregation.

---

*This document is a reconstructed canonical draft. Full ratification requires Architecture Review per AF-2.1 change process.*
