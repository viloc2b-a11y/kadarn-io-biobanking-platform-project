# Current State vs. KRM-RAO Reference Model

Maps each KRM-RAO component to its implementation status. This document
is the single source of truth for what exists and what remains.

---

## 1. Abstractions

| Abstraction | KRM-RAO | Status | Implementation |
|-------------|---------|--------|----------------|
| Research Asset | §2.1 | ✅ | Defined in Lexicon, typed in KRM-BNO |
| Operational Twin | §2.2 | ✅ | `packages/operational-twins/` — Specimen Twin active |
| Event | §2.3 | ✅ | `packages/domain-events/`, Event Catalog (62 types) |
| Policy | §2.4 | ✅ | `packages/policy-engine/` — expression tree, evaluation |
| Evidence | §2.5 | ✅ | `database/migrations/016_provenance_graph.sql` — evidence table |
| Provenance | §2.6 | ✅ | `packages/provenance-graph/` — DAG lineage |
| Trust | §2.7 | ✅ | `packages/trust-engine/` — 4 dimensions, decay |
| Graph | §2.8 | ⚡ Partial | 4 graphs defined, query layer built, full integration pending |
| Fabric | §2.9 | ⚡ Partial | Patterns established, runtime in existing RLS/auth |

## 2. Component Categories

| Category | KRM-RAO | Status | Implementation |
|----------|---------|--------|----------------|
| Applications | §3.1 | ❌ | Post-v1.0 — portals are future work |
| Engines | §3.2 | ⚡ Partial | 3 of 9 engines built |
| Services | §3.3 | ✅ | Existing from v0.11.0 (17 contracts) |
| Operational Twins | §3.4 | ⚡ Partial | Specimen Twin active; Transaction, Shipment pending |
| Graphs | §3.5 | ⚡ Partial | Storage built, query layer built |
| Fabrics | §3.6 | ⚡ Partial | Patterns established |
| Infrastructure | §3.7 | ✅ | PostgreSQL, queue patterns established |

## 3. Engines

| Engine | KRM-RAO | Status | Tests |
|--------|---------|--------|-------|
| Policy Engine | §5.2 | ✅ Complete | 36 |
| Workflow Engine | §5.3 | ❌ Pending | — |
| Trust Engine | §5.4 | ✅ Complete | 36 |
| Matching Engine | §5.5 | ⚡ Partial (Discovery) | — |
| Fulfillment Engine | §5.6 | ❌ Pending | — |
| Financial Engine | §5.7 | ❌ Pending | — |
| Intelligence Engine | §5.8 | ❌ Pending (AI transversal) | — |
| Integration Engine | §5.9 | ❌ Pending | — |
| Knowledge Engine | §5.1 | ✅ Complete | 18 |

## 4. Operational Twins

| Twin | KRM-BNO | Status | Tests |
|------|---------|--------|-------|
| Specimen Twin | §4.1 | ✅ Complete | 24 |
| Transaction Twin | §4.2 | ❌ Pending | — |
| Organization Twin | §4.3 | ⚡ Partial (Trust Engine covers scores) | — |
| Shipment Twin | §4.4 | ❌ Pending | — |
| Collection Twin | §4.5 | ❌ Pending | — |

## 5. Graphs

| Graph | KRM-RAO | Status | Tests |
|-------|---------|--------|-------|
| Network Graph | §4.1 | ⚡ Partial (from organizations table) | — |
| Provenance Graph | §4.2 | ✅ Complete | 11 |
| Knowledge Graph | §4.3 | ✅ Complete | 18 |
| Trust Graph | §4.4 | ✅ Complete (from Trust Engine) | 36 |
| Cross-Graph Query | §6 | ✅ Complete | 8 |

## 6. Summary

| Category | Total | Complete | Partial | Pending | Completion |
|----------|-------|----------|---------|---------|------------|
| Abstractions | 9 | 7 | 2 | 0 | 78% |
| Components | 7 | 3 | 4 | 0 | 43% |
| Engines | 9 | 3 | 1 | 5 | 33% |
| Twins | 5 | 1 | 1 | 3 | 20% |
| Graphs | 5 | 4 | 1 | 0 | 80% |
| **Overall** | **35** | **18** | **9** | **8** | **51%** |
