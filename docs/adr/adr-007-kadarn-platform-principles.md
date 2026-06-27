# ADR-007: Kadarn Platform Principles

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

As Kadarn grows from a functional platform into an enterprise orchestration
platform, architectural decisions must be guided by explicit principles.
Without them, tactical choices accumulate into strategic inconsistency.

The architecture crystallization review identified eight principles that
must govern all future platform decisions.

---

## Decision: Adopt Eight Permanent Principles

### The Principles

1. **Orchestration over Directory** — Kadarn enables action, not just
   discovery. Every catalog entry must be fulfillable.
2. **Evidence over Declaration** — Trust is computed from verifiable
   evidence, not self-attestations.
3. **Provenance over Static Records** — The complete entity history is
   tracked, not just current state.
4. **Policy over Hardcode** — Business and governance rules are
   evaluated at runtime, not compiled.
5. **Events over Mutable State** — All state is derived from immutable
   events. Events are append-only.
6. **Federation over Replacement** — Kadarn integrates with existing
   systems (LIMS, CTMS, EHR, ERP) rather than replacing them.
7. **Trust over Assumptions** — No participant is trusted by default.
   Trust is computed, decays, and can be challenged.
8. **Human-in-the-Loop Where Risk Matters** — Automated orchestration
   with human oversight at risk-critical decision points.

### Application

- Every new Engine, Service, or Operational Twin must be consistent with
  these principles
- ADR decisions must reference applicable principles
- Principles may be extended but not contradicted

---

## Consequences

### Positive

- Consistent decision-making across engineering teams
- Clear guardrails for new feature proposals
- Each principle maps to a specific architectural practice

### Neutral

- Principles are permanent unless superseded by a future ADR
- Periodic review ensures principles remain relevant
