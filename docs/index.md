# Kadarn Platform — Architecture Documentation Index

**Current version:** v0.12.0-rc  
**Target:** v1.0.0-beta  

---

## Navigation

### Foundation Documents

| Document | Description |
|----------|-------------|
| [Kadarn Manifesto](kadarn-manifesto.md) | Why Kadarn exists — canonical statement, principles, scope boundaries |
| [Ecosystem Reference Architecture](ecosystem-reference-architecture.md) | The biomedical research ecosystem: actors, flows, frictions, boundaries |
| [Architectural Lexicon](lexicon.md) | Canonical vocabulary — 30+ terms defined with examples |
| [Lexicon Changelog](lexicon-changelog.md) | History of term additions and changes |

### Reference Models

| Document | Description |
|----------|-------------|
| [KRM-RAO](krm-rao.md) | Kadarn Reference Model for Research Asset Orchestration — abstract model |
| [KRM-BNO Profile](krm-bno-profile.md) | Biospecimen Network Orchestration profile of KRM-RAO |

### Domain Specifications

| Document | Description |
|----------|-------------|
| [Event Catalog](event-catalog.md) | All 62 canonical events with envelopes and versioning |
| [Provenance Graph](../domain/provenance-graph.md) | Cross-entity lineage — nodes, edges, evidence |
| [Knowledge Engine](../domain/knowledge-engine.md) | Controlled vocabularies, term normalization, semantic mapping |
| [Graph-Native Query Layer](graph-native-query-layer.md) | Unified cross-graph queries |

### Architecture Decision Records

| # | Title | Status |
|---|-------|--------|
| 001 | Platform Core vs Service Layer Separation | ✅ |
| 002 | Multi-Tenant Architecture & Organization Model | ✅ |
| 003 | Processing Engine Philosophy | ✅ |
| 004 | Platform Boundaries | ✅ |
| 005 | Architectural Lexicon | ✅ |
| 006 | Ecosystem-First Architecture | ✅ |
| 007 | Kadarn Platform Principles | ✅ |
| 008 | KRM-RAO Reference Model | ✅ |
| 009 | KRM-BNO Biospecimen Profile | ✅ |
| 010 | Policy Engine — Declarative Policy Evaluation | ✅ |
| 011 | Trust Engine — Evidence-Based Trust Computation | ✅ |
| 012 | Operational Twins — Event-Sourced Digital Representations | ✅ |
| 013 | Event-First Platform | ✅ |
| 014 | Provenance Graph — Cross-Entity Lineage | ✅ |
| 015 | Knowledge Engine — Semantic Understanding Layer | ✅ |
| 016 | Graph-Native Query Layer | ✅ |

### CI & Quality

| Script | Purpose |
|--------|---------|
| [terminology-lint.sh](../../scripts/terminology-lint.sh) | Ensures all bolded terms in docs exist in the lexicon |
| [cross-doc-consistency.sh](../../scripts/cross-doc-consistency.sh) | Validates Twins/Engines/Fabrics match across KRM-RAO and KRM-BNO |
