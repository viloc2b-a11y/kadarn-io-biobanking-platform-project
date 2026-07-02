# Sprint 20A Completion Report — Discovery Lite MVP

**Date:** 2026-07-01  
**Baseline:** AF-1.0 / KEMS-002 / KEMS-002A  

---

## Executive Summary

Discovery Lite MVP is complete. The full pipeline from raw artifact to Institutional Evidence Snapshot and Curation is implemented, tested, and gated. No Evidence Core writes occur at any stage.

---

## Sprint 20A — Deliverables

| Sprint | Component | Tests |
|--------|-----------|-------|
| 20A.1 | Domain + State Machine (KEMS-002A) | 18 |
| 20A.2 | Persistence (migrations 046) | 27 |
| 20A.3A | DocumentExtractionProvider + MarkItDownProvider | 39 |
| 20A.3B | SemanticExtractionRequest Queue (migration 047) | 51 |
| 20A.4A | Agent Pipeline Framework + DocumentClassifierAgent | 65 |
| 20A.4B | EntityExtractorAgent + RelationshipExtractorAgent | 81 |
| 20A.4C | DiscoveryOrchestrator + DiscoveryResult | 87 |
| 20A.5 | InstitutionalEvidenceSnapshot + SnapshotBuilder | 98 |
| 20A.6 | Curation API + 8 actions (migration 049) | 115 |
| 20A.7 | E2E tests + Architecture Gates | **131** |

---

## Architecture

```
Upload → Layer 0 (immutable) → Provider → Layer 1 → Request Queue
                                                              │
                                                              ▼
                                                     DiscoveryOrchestrator
                                                              │
                                      ┌───────────────────────┼───────────────────┐
                                      ▼                       ▼                   ▼
                               DocumentClassifier       EntityExtractor   RelationshipExtractor
                                      │                       │                   │
                                      └───────────────────────┼───────────────────┘
                                                              ▼
                                                       DiscoveryResult
                                                              │
                                                              ▼
                                                     SnapshotBuilder
                                                              │
                                                              ▼
                                              InstitutionalEvidenceSnapshot
                                                              │
                                                              ▼
                                                     Curation API
                                                    (ACCEPT/REJECT/ENRICH/DEFER/
                                                     NEEDS_MORE_EVIDENCE/MERGE/SPLIT/ARCHIVE)
```

## Architectural invariants verified

| Invariant | Status |
|-----------|--------|
| Discovery never writes to Evidence Core | ✅ All 9 test files |
| Discovery never creates institutional truth | ✅ Agents declare Claims only as proposals |
| Agents never promote Evidence Nodes | ✅ Verified per-agent in architecture gates |
| Curation never promotes Evidence Nodes | ✅ CurationService has no promotion method |
| Layer 0 immutable | ✅ Append-only trigger + no update functions |
| Layer 1 references Layer 0 | ✅ FK + sourceHash |
| Agent outputs reference Layer 1 and artifact | ✅ Provenance chain enforced |
| Snapshot consumes DiscoveryResult only | ✅ SnapshotBuilder has no agent access |
| Every transition is append-only | ✅ State machine + transition events |
| Every curation action is append-only | ✅ discovery_curation_events table |
| Reprocessing creates new version, not mutation | ✅ New Layer 1 for same artifact |

## Agents implemented

| Agent | Type | Method | Outputs |
|-------|------|--------|---------|
| DocumentClassifierAgent | DOCUMENT_CLASSIFICATION | Keyword signals | 10 document types |
| EntityExtractorAgent | ENTITY_EXTRACTION | Regex + keywords | 15 entity types |
| RelationshipExtractorAgent | RELATIONSHIP_EXTRACTION | Entity linking + proximity | 11 relationship types |

## Databases / Migrations

| Migration | Table | Purpose |
|-----------|-------|---------|
| 046 | discovery_sessions, runs, artifacts, layer1, candidates, transition_events | Core discovery tables |
| 047 | discovery_preparation_requests | Semantic extraction request queue |
| 048 | discovery_agent_outputs | Structured agent outputs |
| 049 | discovery_curation_events | Immutable curation audit trail |

## Test Results

| Metric | Value |
|--------|-------|
| Test files | **9** |
| Total tests | **131** |
| Failures | **0** |
| TS errors | **0** |
| Migrations | **4** (046–049) |

## Next steps

Sprint 20B should focus on one of:
- **Evidence Promotion Pipeline** — promote curated candidates to Evidence Core
- **UX/Curation UI** — user interface for curation actions
- **Additional agents** — ClaimDetector, TimelineReconstructor, GapDetector, LeverageRecommender

---

*This report closes Sprint 20A (Discovery Lite MVP). Baseline AF-1.0 remains in effect.*
