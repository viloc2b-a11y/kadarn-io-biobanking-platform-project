# Kadarn Lexicon

> **Version:** v1.1
> **Type:** Foundational Architectural Documentation
> **Includes:** Lexicon · Manifesto · Reference Architecture (KRM-RAO) · Business Network Overview (KRM-BNO)
> **Source:** `governance/lexicon/Kadarn_Lexicon_v1.1_English.md`

---

## Overview

This document defines the canonical vocabulary and architectural model for Kadarn. It consists of four integrated sections:

### 1. Lexicon

Defines the canonical meaning of core terms used across Kadarn: *Research Asset*, *Operational Twin*, *Provenance*, *Trust*, *Policy*, *Fabric*, *Engine*, *Graph*, and 25+ other terms. Every downstream document must use these definitions without exception.

Key principle: **terms are defined for architectural consistency, not marketing language.**

### 2. Manifesto

States why Kadarn exists, what it is, and what it is not. Codifies the shift from "discovery platform" to **execution infrastructure for biospecimen and Research Asset programs**.

### 3. Reference Architecture (KRM-RAO)

Describes the architectural model in 13 sections:
- **Operational Twin Model** — Specimen Twin, Transaction Twin
- **Fabric Model** — Identity, Data, Trust, Governance, Integration fabrics
- **Engine Model** — 12 engines including Knowledge Engine
- **Graph Model** — Knowledge, Network, Provenance, Trust graphs
- **Policy Model, Event Model, Workflow Model, Evidence Model**
- **Network, Security, Observability, Integration models**

### 4. Business Network Overview (KRM-BNO)

Describes the operational environment: actors, lifecycle, capability model, agreements, commercial flows, and compliance context.

---

## Key Concepts Introduced

| Concept | Description |
|---------|-------------|
| **Research Asset** | Scientific entity with identity, lifecycle, governance, and traceability |
| **Operational Twin** | Digital representation of a real-world operational asset |
| **Specimen Twin** | Operational Twin for a physical biospecimen |
| **Transaction Twin** | Operational Twin for a scientific request lifecycle |
| **Fabric** | Connective layer linking systems under shared governance |
| **Knowledge Engine** | Engine for semantic understanding, ontology resolution |
| **Graph** | Semantic (Knowledge), structural (Network), temporal (Provenance), trust (Trust) |

---

## Relationship to Blueprint

The Blueprint (`docs/architecture/kadarn-platform-blueprint.md`) is the **implementation-oriented** architecture document. The Lexicon/KRM-RAO is the **conceptual** architecture. They are consistent and complementary — the Blueprint implements the patterns defined in the KRM-RAO.

| Blueprint Concept | KRM-RAO Concept |
|------------------|-----------------|
| supply_items | Research Asset with Specimen Twin |
| exchange_requests | Transaction Twin |
| Programs | Orchestrated Workflow |
| Platform Services | Supporting Services |
| Discovery Engine + Feasibility Engine | Knowledge Engine capabilities |
| RLS model | Identity Fabric instantiation |

---

## Release Readiness Framework

See `release-readiness-framework.md` for the formal RC exit checklist, versioning rules, and governance pack structure.
