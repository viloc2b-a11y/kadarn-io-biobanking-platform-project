# ADR-008: KRM-RAO Reference Model

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn has grown organically — modules were added as needs arose, guided
by a high-level roadmap but without a formal reference model. As the
architecture crystallizes, a reference model is needed to:

1. Define the canonical abstractions and component categories
2. Guide where new capabilities should be placed
3. Map existing modules to architectural roles
4. Identify gaps systematically
5. Provide a shared mental model for engineering decisions

---

## Decision: Adopt KRM-RAO

Kadarn adopts the **Kadarn Reference Model for Research Asset Orchestration
(KRM-RAO)** as the canonical architectural reference model.

### What KRM-RAO Defines

1. **Nine core abstractions:** Research Asset, Operational Twin, Event,
   Policy, Evidence, Provenance, Trust, Graph, Fabric
2. **Seven component categories:** Applications, Engines, Services,
   Operational Twins, Graphs, Fabrics, Infrastructure
3. **Four canonical graphs:** Network Graph, Provenance Graph, Knowledge
   Graph, Trust Graph
4. **Nine engine roles:** Knowledge, Policy, Workflow, Trust, Matching,
   Fulfillment, Financial, Intelligence, Integration
5. **Mapping of existing modules** to KRM-RAO categories
6. **Gap analysis** identifying missing components
7. **Interaction patterns** for common flows
8. **Architectural invariants** — rules that all implementations must follow

### What KRM-RAO Does NOT Define

- Implementation details (database schemas, API endpoints, specific
  technologies)
- Biospecimen-specific semantics (handled by KRM-BNO)
- Deployment topology or infrastructure choices

---

## Consequences

### Positive

- Shared vocabulary and mental model for all engineering decisions
- Systematic gap identification (Policy Engine, Trust Engine, Knowledge
  Engine, Operational Twins, Graphs are clearly missing)
- Clear placement guidance for new components
- Existing modules validated against the reference model

### Negative

- Teams must learn the reference model
- Some existing modules may need refactoring to align with their KRM-RAO
  role (e.g., Discovery → Matching Engine, AI Layer → Intelligence Engine)

### Neutral

- KRM-RAO evolves as the platform grows
- Domain-specific profiles (KRM-BNO) extend rather than modify the
  reference model
