# ADR-005: Architectural Lexicon

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn has grown from a biospecimen discovery marketplace into a Research
Asset orchestration platform. With this growth, terms that were once
unambiguous have become overloaded. Different documents, modules, and team
members use the same words to mean different things.

The terms `twin`, `provenance`, `policy`, `trust`, and `evidence` appear
in architectural discussions but lack precise definitions. Without a shared
vocabulary, new components risk being misaligned with existing ones, and
future ADRs become inconsistent.

---

## Decision: Adopt a Canonical Architectural Lexicon

Kadarn adopts `docs/architecture/lexicon.md` as the single source of
truth for platform vocabulary.

### Scope

The lexicon defines 24 terms across four categories:

1. **Core Abstractions (8 terms):** Research Asset, Biospecimen,
   Operational Twin (with subtypes Specimen Twin, Transaction Twin,
   Organization Twin, Shipment Twin), Event
2. **Behavioral Concepts (4 terms):** Policy, Workflow, Evidence,
   Provenance
3. **Graph Types (4 terms):** Network Graph, Provenance Graph,
   Knowledge Graph, Trust Graph
4. **Platform Components (4 terms):** Engine, Service, Fabric, Application
5. **Governance & Compliance (3 terms):** Governance, Compliance, Trust
6. **Economy (2 terms):** Fulfillment, Settlement

### Resolution of Ambiguity

The lexicon also resolves five known ambiguity pairs:

| Confused Pair | Resolution |
|---------------|------------|
| Audit Trail vs Provenance | Both needed. Audit trail = accountability. Provenance = trust & reproducibility. |
| Workflow vs Policy | Workflows orchestrate steps. Policies constrain decisions at those steps. |
| Sample Lifecycle vs Specimen Twin | Lifecycle = status field. Specimen Twin = event-sourced digital counterpart. |
| Document Vault vs Evidence Graph | Vault stores files. Evidence Graph connects evidence to entities. |
| AI Layer vs AI-Assisted Platform | AI is a horizontal capability, not a vertical module. |

### Enforcement

All new code, documentation, and ADRs MUST use lexicon definitions.
Existing documents may be updated incrementally.

---

## Consequences

### Positive

- Team communication becomes precise and consistent
- ADRs reference stable definitions
- New engineers onboard faster
- The lexicon provides a foundation for KRM-RAO and KRM-BNO

### Negative

- Existing documents may temporarily use pre-lexicon terminology
- Enforcement requires code review vigilance

### Neutral

- The lexicon will evolve. Updates follow ADR process.

---

## Compliance

This ADR is satisfied when:

- [x] `docs/architecture/lexicon.md` exists with all 24 terms
- [x] Each term has a definition and a Kadarn example
- [x] The "Terms Not to Confuse" section resolves the five ambiguity pairs
- [ ] All future documents reference lexicon terms
