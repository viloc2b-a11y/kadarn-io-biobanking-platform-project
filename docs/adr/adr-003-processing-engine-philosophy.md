# ADR-003: Kadarn Processing Engine Philosophy

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn coordinates biospecimen programs across a network of organizations including processing laboratories. As programs mature past discovery and negotiation, the platform needs to track what happens to samples during processing: receipt, aliquoting, quality control, storage, and shipment.

However, the biospecimen industry already has mature enterprise LIMS platforms (LabVantage, LabWare, STARLIMS, Thermo SampleManager). Kadarn must not compete with these systems.

The question is: how should Kadarn handle sample processing without becoming a LIMS?

---

## Decision: Create the Kadarn Processing Engine as a bounded module

**Do not build a general-purpose LIMS.**

Kadarn Processing Engine (KPE) provides the **minimum operational capabilities required to execute biospecimen programs** within the Kadarn network.

### Scope

KPE covers:

- Sample lifecycle state machine (Collected → Archived)
- Processing workflows (configurable by sample type)
- Aliquot management (Sample → Aliquot hierarchy)
- Quality control parameter tracking
- Storage location tracking (simplified)
- Chain of custody (movement audit trail)
- Instrument run recording (minimal)
- LIMS integration layer (connector-based)

KPE does **NOT** cover:

- Full laboratory inventory management
- Instrument control or maintenance
- Raw instrument data storage
- Laboratory staff scheduling
- Billing or invoicing for lab services
- Compliance with CLIA, CAP, or other lab accreditation standards
- Replacement of enterprise LIMS platforms

### Integration Strategy

| Scenario | Kadarn role |
|----------|-------------|
| Enterprise LIMS exists at the lab | Kadarn integrates via REST API connector |
| No LIMS exists | Kadarn provides minimum operational capabilities for program execution |

---

## Consequences

| Positive | Negative |
|----------|----------|
| Kadarn remains an infrastructure platform (not a LIMS vendor) | Some operational complexity is pushed into the platform |
| Enterprise labs keep their existing LIMS workflows | Connector development requires LIMS vendor API knowledge |
| Smaller labs can operate directly inside Kadarn | The Processing Engine adds migration surface area |
| Architecture remains modular and vendor-neutral | Integration testing with multiple LIMS vendors is non-trivial |

### Compliance

This ADR implements decisions from:

- **LIMS scope**: Processing Engine is bounded — not a general-purpose LIMS
- **Integration**: REST API connectors for enterprise LIMS platforms
- **Minimum capability**: Platform provides what is needed for program execution, not lab management
- **Modularity**: Processing Engine is a separate module with its own data model and lifecycle

---

## References

- Blueprint §12 — Kadarn Processing Engine
- ADR-001: Platform Core vs. Service Layer Separation
- ADR-002: Multi-Tenant Architecture & Organization Model
