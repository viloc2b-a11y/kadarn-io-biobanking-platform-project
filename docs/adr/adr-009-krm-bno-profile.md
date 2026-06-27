# ADR-009: KRM-BNO Biospecimen Profile

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

KRM-RAO defines an abstract reference model for Research Asset
Orchestration. However, Kadarn's primary domain is biospecimen network
orchestration. Without a domain specialization, the reference model
remains too abstract for day-to-day engineering decisions.

A profile is needed that:
1. Specializes Research Assets into concrete biobanking types
2. Defines the complete biospecimen lifecycle with 19 phases
3. Maps each lifecycle phase to KRM-RAO components
4. Provides Operational Twin event streams specific to biospecimens
5. Validates existing module coverage
6. Identifies gaps in priority order

---

## Decision: Adopt KRM-BNO Profile

Kadarn adopts the **Kadarn Reference Model for Biospecimen Network
Orchestration (KRM-BNO)** as the domain-specific profile of KRM-RAO.

### What KRM-BNO Defines

1. **Research Asset specialization** — Biospecimen, Aliquot, Collection,
   Dataset, Shipment with domain-specific properties
2. **Operational Twin specialization** — Specimen Twin, Transaction Twin,
   Organization Twin, Shipment Twin, Collection Twin with event stream
   definitions
3. **Biospecimen lifecycle** — 19 phases from Discovery through Settlement,
   mapped to KRM-RAO components and existing Kadarn modules
4. **Existing module mapping** — Validates each module against KRM-RAO
5. **Gap analysis** — Prioritized gaps: P0 (Policy Engine, Trust Engine,
   Operational Twins, Provenance Graph) through P2

### Priority Definition

| Priority | Meaning | Timeline |
|----------|---------|----------|
| **P0** | Blocks network orchestration | Must be implemented before v1.0.0-beta |
| **P1** | Required for v1.0 completeness | Should be implemented for v1.0.0-beta |
| **P2** | Enhancement | Post-v1.0 |

---

## Consequences

### Positive

- Clear implementation priorities — teams know what to build first
- Existing modules validated against domain model
- Lifecycle phases map directly to component responsibilities
- Event stream definitions guide Twin implementation
- Compliance criteria provide clear acceptance tests

### Negative

- KRM-BNO must be maintained as the domain model evolves
- Some existing modules may need gradual refactoring to align

### Neutral

- KRM-BNO is a living document; updates follow ADR process
- KRM-BNO does not modify KRM-RAO; it specializes it
