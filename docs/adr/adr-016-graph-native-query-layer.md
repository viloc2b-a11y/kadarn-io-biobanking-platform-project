# ADR-016: Graph-Native Query Layer

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn now has four independent graphs: Network, Provenance, Knowledge,
and Trust. Each lives in its own tables and package. However, real
questions cut across them:

- "Show all specimens matching this diagnosis, from trusted suppliers,
  with full provenance" → Knowledge + Trust + Provenance
- "Show regulatory evidence for this shipment, and the trust trajectory
  of the supplier" → Provenance + Trust
- "Find suppliers by capability that can fulfill this request within
  policy constraints" → Network + Trust + Policy

Without a unified query layer, application code must orchestrate across
multiple packages manually, increasing complexity and duplication.

---

## Decision: Build a Lightweight Graph Query Service

### 1. Architecture

The Graph Query Layer is a **service** that composes existing graph
engines. It does not replace them — it orchestrates cross-graph queries.

```
Application
    │
    ▼
Graph Query Service  ─┬──► Provenance Graph (lineage)
    │                  ├──► Knowledge Graph (semantic)
    │                  ├──► Trust Graph (scores)
    │                  └──► Network Graph (org relationships)
```

### 2. Query Types

| Query | Graphs Used |
|-------|-------------|
| `specimenFullProvenance(id)` | Provenance |
| `organizationTrustHistory(id)` | Trust |
| `specimenWithKnowledge(specId)` | Knowledge + Provenance |
| `shipmentRegulatoryEvidence(id)` | Provenance |
| `matchingSuppliers(criteria)` | Network + Trust + Knowledge |
| `assetsByDiagnosis(code)` | Knowledge + Provenance |

### 3. Implementation

Each query type is a function that composes calls to the underlying
graph adapters. Results are assembled into a unified response shape.

### 4. Non-Goals

- Not a replacement for the existing relational APIs
- Not a graph database — queries traverse existing PostgreSQL tables
  via the graph packages
- Not a query language (no Cypher, SPARQL, or custom DSL)
