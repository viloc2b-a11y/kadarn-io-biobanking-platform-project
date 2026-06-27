# ADR-006: Ecosystem-First Architecture

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn's early architecture was product-centric: it defined a platform and
then looked for ecosystem problems to solve. This led to well-built modules
that sometimes strained to find their exact place in real-world workflows.

The architecture crystallization review revealed a need to reverse this:
understand the ecosystem first, then define Kadarn's role within it.

---

## Decision: Ecosystem-First Architecture

Kadarn adopts an ecosystem-first architectural methodology:

1. **Map the ecosystem** before defining platform components
2. **Identify frictions** before designing solutions
3. **Define boundaries** before building integrations
4. **Understand existing systems** before asserting Kadarn's role
5. **Design for replacement** — each Kadarn component should solve a
   clear ecosystem friction that no existing system addresses

### Methodology

Every new platform capability (Engine, Service, or Operational Twin)
must be justified by at least one of:

- An ecosystem friction identified in the Ecosystem Reference Architecture
- A flow that crosses organizational boundaries
- A need that no existing system in the ecosystem addresses

### Boundary Rule

Kadarn orchestrates **across** organizations. It does not replace
**within**-organization systems (LIMS, CTMS, EHR, ERP, LIS, IRB
systems). Integration with these systems uses event ingestion and
identifier mapping — not API calls that assume control.

### Reference Document

The canonical ecosystem description is `docs/architecture/
ecosystem-reference-architecture.md`.

---

## Consequences

### Positive

- Architectural decisions are grounded in real ecosystem needs
- Clear scope prevents feature creep into LIMS/CTMS/EHR territory
- Integration patterns follow from boundary definitions
- New team members learn the ecosystem before the platform

### Negative

- Ecosystem-first analysis adds up-front documentation overhead
- Requires periodic ecosystem reassessment as the landscape evolves

### Neutral

- The Ecosystem Reference Architecture is a living document
- Friction analysis may reveal opportunities beyond current roadmap
