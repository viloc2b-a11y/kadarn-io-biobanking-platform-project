# Traceability Matrix: Principle → ADR → Domain → Module

Maps each Kadarn principle to the ADRs, domain artifacts, and implementation
modules that realize it.

---

## Orchestration over Directory

| Level | Artifact |
|-------|----------|
| **Principle** | Kadarn Manifesto — Orchestration over Directory |
| **ADR** | ADR-006: Ecosystem-First Architecture — defines orchestration boundary |
| **ADR** | ADR-008: KRM-RAO Reference Model — component categories (Engines, Twins, Fabrics) |
| **Domain** | KRM-RAO §3 — 7-layer component stack |
| **Domain** | KRM-BNO §5 — 19-phase biospecimen lifecycle |
| **Module** | `packages/policy-engine/` — policy-driven orchestration |
| **Module** | `packages/provenance-graph/` — cross-entity lineage |

## Evidence over Declaration

| Level | Artifact |
|-------|----------|
| **Principle** | Kadarn Manifesto — Evidence over Declaration |
| **ADR** | ADR-011: Trust Engine — evidence-based trust computation |
| **Domain** | KRM-RAO §2.5 — Evidence abstraction |
| **Module** | `packages/trust-engine/` — trust from events, not ratings |
| **Module** | `database/migrations/014_trust_engine.sql` — trust_events append-only log |

## Provenance over Static Records

| Level | Artifact |
|-------|----------|
| **Principle** | Kadarn Manifesto — Provenance over Static Records |
| **ADR** | ADR-014: Provenance Graph — cross-entity lineage |
| **Domain** | KRM-RAO §2.6 — Provenance abstraction |
| **Module** | `packages/provenance-graph/` — traceForward, traceBackward, fullLineage |

## Policy over Hardcode

| Level | Artifact |
|-------|----------|
| **Principle** | Kadarn Manifesto — Policy over Hardcode |
| **ADR** | ADR-010: Policy Engine — declarative policy evaluation |
| **Domain** | KRM-RAO §2.4 — Policy abstraction |
| **Domain** | KRM-RAO §5.2 — Policy Engine role |
| **Module** | `packages/policy-engine/` — JSON expression tree, compose, evaluate |
| **Module** | `database/migrations/013_policy_engine.sql` — policies table |

## Events over Mutable State

| Level | Artifact |
|-------|----------|
| **Principle** | Kadarn Manifesto — Events over Mutable State |
| **ADR** | ADR-012: Operational Twins — event-sourced digital representations |
| **ADR** | ADR-013: Event-First Platform — standardized event model |
| **Domain** | KRM-RAO §2.3 — Event abstraction |
| **Domain** | Event Catalog — 62 canonical events |
| **Module** | `packages/domain-events/` — event contracts and EventBus interface |
| **Module** | `packages/operational-twins/` — event-sourced Specimen Twin |
| **Module** | `database/migrations/015_operational_twins.sql` — twin_events table |

## Federation over Replacement

| Level | Artifact |
|-------|----------|
| **Principle** | Kadarn Manifesto — Federation over Replacement |
| **ADR** | ADR-004: Platform Boundaries — what Kadarn does and doesn't replace |
| **ADR** | ADR-006: Ecosystem-First Architecture — boundary rules |
| **Domain** | Ecosystem Reference Architecture §6 — orchestration boundary |

## Trust over Assumptions

| Level | Artifact |
|-------|----------|
| **Principle** | Kadarn Manifesto — Trust over Assumptions |
| **ADR** | ADR-011: Trust Engine — computed, decaying trust |
| **Domain** | KRM-RAO §2.7 — Trust abstraction |
| **Domain** | KRM-RAO §4.4 — Trust Graph |
| **Module** | `packages/trust-engine/` — 4 dimensions, decay, challenges |

## Human-in-the-Loop Where Risk Matters

| Level | Artifact |
|-------|----------|
| **Principle** | Kadarn Manifesto — Human-in-the-Loop Where Risk Matters |
| **Domain** | KRM-BNO §5 — IRB/Ethics Review, MTA/DUA governance phases |
| **Module** | `packages/policy-engine/` — conditional outcomes trigger human review |

---

## Architecture Decision Coverage

| Domain | ADRs |
|--------|------|
| Platform Foundation | 001, 002, 004, 005, 006 |
| Reference Model | 007, 008, 009 |
| Policy | 010 |
| Trust | 011 |
| Operational Twins | 012 |
| Events | 013 |
| Provenance | 014 |
| Knowledge | 015 |
| Query | 016 |
