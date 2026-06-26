# ADR-004: Platform Boundaries

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn is a **biospecimen network infrastructure platform**. As the platform grows and the engineering team expands, there will be increasing pressure to add features that blur the boundary between Kadarn and other systems in the biospecimen and clinical research ecosystem.

Without explicit boundaries, Kadarn risks becoming:

- A general-purpose LIMS
- A clinical trial management system
- An electronic data capture system
- A laboratory information system
- An accounting or ERP platform

Each of these roles is already served by mature, specialized vendors. Kadarn's value is in **orchestration and infrastructure**, not in replacing these systems.

---

## Decision: Define explicit Platform Boundaries

Kadarn maintains a clear boundary between **what the platform does** and **what it integrates with**.

### What Kadarn DOES NOT Replace

| System | Rationale |
|--------|-----------|
| **Enterprise LIMS** (LabVantage, LabWare, STARLIMS, Thermo SampleManager) | Kadarn tracks processing metadata for program execution. It does not manage lab operations. |
| **CTMS** (Clinical Trial Management System) | Kadarn manages biospecimen programs, not clinical trials. Trial-level management belongs to CTMS. |
| **EDC** (Electronic Data Capture) | Kadarn does not capture patient-level clinical data. It tracks biospecimen provenance and metadata. |
| **eTMF** (Electronic Trial Master File) | Kadarn provides audit trails for biospecimens, not TMF document management. |
| **EMR / EHR** (Electronic Medical/Health Record) | Kadarn consumes de-identified data. Patient records remain in the healthcare system. |
| **ERP** (Enterprise Resource Planning) | Kadarn handles program-level payments via escrow. It does not replace corporate accounting. |
| **Financial Systems** | Kadarn provides payment orchestration (escrow, milestones). Invoicing and revenue recognition belong to financial systems. |
| **Courier / Logistics Software** | Kadarn coordinates logistics providers and tracks chain of custody. It does not replace courier dispatch or fleet management. |
| **Instrument Control Software** | Kadarn records instrument runs (ID, operator, SOP, date). It does not control instruments or store raw data. |
| **Biobank Inventory Management** | Kadarn tracks sample locations within programs. Full biobank inventory management belongs to biobank-specific systems. |
| **Regulatory Document Management** | Kadarn provides regulatory workspaces and template libraries. Document lifecycle management belongs to dedicated DMS. |

### What Kadarn DOES

| Capability | Boundaries |
|------------|------------|
| **Orchestrate Programs** | Define, manage, and execute multi-organization biospecimen programs end-to-end. |
| **Coordinate Organizations** | Register organizations, manage capabilities, enforce multi-tenant isolation via RLS. |
| **Track Biospecimens** | Track samples and aliquots through their program lifecycle. Metadata only — no clinical data. |
| **Manage Processing Metadata** | Record processing workflows, QC parameters, storage locations, and instrument runs for program samples. |
| **Provide Traceability** | Immutable audit trail for all significant actions. Chain of custody for all sample movements. |
| **Enable Discovery** | Federated search across the network's supply items, collections, and capabilities. |
| **Enable Feasibility** | Assess program viability using network intelligence and operational data. |
| **Coordinate Logistics** | Integrate logistics providers, track cold chain telemetry, manage chain of custody. |
| **Manage Regulatory Workflows** | Provide template libraries, submission tracking, and document exchange for IRB/ethics workflows. |
| **Generate Analytics** | Network intelligence, program performance, supplier quality metrics from operational data. |

---

## Boundary Enforcement Rules

### Rule 1: Integration over Replacement

When a feature overlaps with an existing system category:

1. First ask: does an industry-standard system already serve this need?
2. If yes: integrate via API connector. Do not build a replacement.
3. If no: build only the minimum capability required for program execution.
4. Document the boundary in the relevant engine's philosophy section.

### Rule 2: Program Scope Only

All Kadarn features must be scoped to **program execution**. If a feature would be useful outside the context of a Kadarn program, it is likely out of scope.

Examples:
- ✅ Track sample processing for a program → in scope
- ❌ Build a general laboratory sample tracking system → out of scope
- ✅ Record instrument runs for program samples → in scope
- ❌ Build instrument maintenance scheduling → out of scope
- ✅ Manage regulatory submissions for a program → in scope
- ❌ Build a general IRB document management system → out of scope

### Rule 3: Metadata, Not Clinical Data

Kadarn tracks **biospecimen metadata and provenance**, not clinical data about patients.

- ✅ Sample type, storage condition, processing date, QC metrics → in scope
- ❌ Patient diagnosis, treatment history, genetic results → out of scope (EDC / EHR domain)
- The exception: de-identified disease codes at the aggregate collection level (for discovery/feasibility).

### Rule 4: Orchestration, Not Operations

Kadarn **orchestrates** network participants. It does not **operate** on their behalf.

- ✅ Sponsor defines a program → in scope
- ✅ Lab processes samples and records results in Kadarn → in scope
- ❌ Kadarn tells the lab how to process samples → out of scope (lab SOPs are internal)
- ✅ Kadarn tracks chain of custody → in scope
- ❌ Kadarn dispatches couriers → out of scope (courier software does this)

---

## Consequences

| Positive | Negative |
|----------|----------|
| Product vision is protected from scope creep | Requires discipline from the engineering team |
| Integration strategy is clear for new features | Some requests will need to be declined or redirected |
| Third-party vendors are partners, not competitors | Connector development is ongoing work |
| Kadarn's positioning remains differentiated | Engineers may need to reference ADR-004 during design reviews |

### Enforcement

- All new features must be reviewed against ADR-004 during architecture review.
- Any feature that falls into "What Kadarn Does Not Replace" must use the integration approach.
- Exceptions require a new ADR amendment signed by the architecture team.

---

## References

- ADR-001: Platform Core vs. Service Layer Separation
- ADR-002: Multi-Tenant Architecture & Organization Model
- ADR-003: Kadarn Processing Engine Philosophy
- Blueprint §2 — Platform Principles
