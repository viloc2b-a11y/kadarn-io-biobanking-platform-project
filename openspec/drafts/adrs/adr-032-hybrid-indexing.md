# ADR-032 — Hybrid Indexing (PostgreSQL)

**Status:** Proposed  
**Date:** 2026-07-03  
**Target sprint:** 28K  
**Baseline:** AF-3.0  
**Related:** [phase-8-evidence-evolution-architecture.md](../../phase-8-evidence-evolution-architecture.md)

---

## Context

Evidence graph queries (support/contradict edges, entity lookup, sponsor search) need sub-second performance without introducing a separate graph database.

---

## Decision

1. Use **PostgreSQL only**: BTREE + GIN + materialized edge tables.
2. **HybridIndexingEngine** maintains materialized edges; migrations run in **28K** — not before domain freeze.
3. No Neo4j or external Graph DB for Phase 8.
4. Index migrations ship with cutover sprint to avoid indexing unstable schemas.

---

## Consequences

| Area | Impact |
|------|--------|
| Supabase | New migration in 28K only |
| Sponsor search | Real index replaces sample data path |
| evidence-lineage | hybrid-indexing.ts owns config |

---

## Acceptance criteria (28K gate)

- [ ] Query p95 under agreed SLO for graph traversals
- [ ] Materialized edges refresh on claim publish events
