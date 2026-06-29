# Sprint 10 — Knowledge Fabric Engineering Report

**Version:** `1.0.0-hardening.10`  
**Date:** 2026-06-28  
**Gate:** `npm run verify`

---

## Objective

Connect Knowledge Engine, KPE ecosystem, Operational Twins, Provenance Graph, and Semantic Search so Kadarn knowledge feeds automatically from platform activity.

---

## Architecture

```
Domain Events / Pipelines
        │
        ▼
 knowledge-runtime.ts ──► ontology_terms / synonyms / mappings
        │                  knowledge_entity_links
        │                  ontology_term_candidates
        ▼
 graph-fabric-runtime.ts ──► GraphQueryService
        │                      (Knowledge + Trust + Provenance)
        ▼
 discovery_search_semantic ──► Supply items (FTS + expanded terms)
```

---

## Components

| Layer | Path | Role |
|-------|------|------|
| Pure engine | `packages/knowledge-engine/` | normalize, expand, mapToExternal, hierarchy |
| Service | `packages/knowledge-engine/src/service.ts` | DB-agnostic KnowledgeService |
| Fabric runtime | `apps/api/src/lib/knowledge-runtime.ts` | Supabase adapter, ingestion, semantic search |
| Graph fabric | `apps/api/src/lib/graph-fabric-runtime.ts` | Cross-graph queries + twin enrichment |
| Migration 040 | `040_knowledge_fabric.sql` | Entity links, candidates, semantic RPC |

---

## Automatic Knowledge Feeding

### Pipeline stages (real, not stubs)

- `runDiscoveryStage` → `runDiscoveryFabricStage()` — expands terms + semantic discovery_search
- `runKnowledgeStage` → `runKnowledgeFabricStage()` — normalizes + links entities
- `runTwinsStage` → `enrichTwinWithKnowledge()` for specimen/collection twins

### Event-driven ingestion

| Event | Feeds |
|-------|-------|
| `SupplyItemCreated` | sample types, disease labels → ontology links + expanded search index |
| `FeasibilityAssessmentCompleted` | program name terms |
| `CollectionCreated` | collection name terms |
| `QcCompleted` | QC status → processing vocabulary |

Unknown terms → `ontology_term_candidates` staging queue.

---

## Semantic Search

- API: `GET /api/v1/discovery` uses `semanticDiscoverySearch()`
- RPC: `discovery_search_semantic(p_expanded_terms)` merges knowledge-expanded sample types
- Fallback to `discovery_search` when migration 040 not yet applied

---

## Graph + KPE

- **Provenance graph** — specimen lineage enriched with `knowledge_entity_links` evidence
- **Trust graph** — composed via existing trust runtime in graph fabric adapter
- **KPE** — benefits from richer provenance/knowledge evidence (scoring unchanged; data layer improved)

---

## Gate Tests

- `tests/hardening/sprint10-knowledge-fabric.test.ts`

---

## Apply Migration

```bash
supabase migration up --local
# or apply database/migrations/040_knowledge_fabric.sql
```
