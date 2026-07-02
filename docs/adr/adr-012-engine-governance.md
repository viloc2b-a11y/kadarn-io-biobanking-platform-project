# ADR-012: Engine Governance — Core, Certified, Private

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Kadarn Architecture  
**Baseline:** AF-1.0  
**Supersedes:** — (new ADR)  

---

## Context

ADR-011 defines what belongs in the Evidence Core. This ADR defines what happens outside it — the ecosystem of Engines that consume the Core and produce value for Kadarn's actors.

Without a governance model, two failure modes emerge:

1. **Unbounded Core** — Engines that should be independent get absorbed into the Core because there is no clear home for them.
2. **Unregulated extension** — Third parties build Engines that consume the Evidence Core without rules, potentially compromising data integrity, provenance, or access control.

KRM-RAO v1.0 lists 14+ Engines (Trust, Policy, Knowledge, Intelligence, Matching, Workflow, etc.) but does not distinguish between those that are canonical to the platform and those that are optional or third-party.

This ADR answers one question:

> **Who can extend Kadarn, and under what rules?**

---

## Decision 1: Three Engine types

Kadarn defines exactly three Engine types:

| Type | Developed by | Governed by | Purpose |
|------|-------------|-------------|---------|
| **Core Engine** | Kadarn | Kadarn Architecture | Defines canonical semantics. Every Kadarn deployment includes Core Engines. |
| **Certified Engine** | Third party | Kadarn + Certification agreement | Interoperates with the Evidence Core under a formal compatibility guarantee. |
| **Private Engine** | Single organization | That organization | Consumes the Evidence Core for internal use. Does not alter the shared model. |

No additional Engine types may be created without amending this ADR.

---

## Decision 2: The dependency rule

> **All Engines depend on the Evidence Core. The Evidence Core depends on no Engine.**

This is the fundamental architectural invariant of Kadarn.

**What this means:**
- Every Engine — Core, Certified, or Private — reads from and writes to the Evidence Core through its defined interfaces.
- The Evidence Core has zero knowledge of any Engine. It does not import, reference, or depend on any Engine's types, interfaces, or implementations.
- An Engine may depend on another Engine (e.g., the Analytics Engine may depend on the Confidence Engine), but that dependency is always transitive through the Core: Engine → (Core) → Engine.

**What this prevents:**
- An Engine cannot become a mandatory dependency of the Core.
- The Core cannot accumulate Engine-specific logic through dependency inversion.
- Removing an Engine never breaks the Core.

---

## Decision 3: The write rule

> **Engines read from the Evidence Core. Engines do not modify existing Evidence Nodes.**

**What this means:**
- Any Engine can query the Evidence Graph, traverse relationships, and read Evidence Nodes.
- No Engine may UPDATE, DELETE, or alter an existing Evidence Node.
- If an Engine produces new information (a Confidence value, an anomaly flag, a classification), that information is registered as **new evidence** with its own provenance, or as a **derived result** clearly separated from the base evidence per the model defined in KEMS and subsequent ADRs.

**What this preserves:**
- Append-only integrity of the Evidence Core (migration 032).
- Immutable provenance chains.
- The ability to audit exactly what evidence led to any derived result.

---

## Decision 4: Private Engine independence

> **A Private Engine may produce any internal model, but that model does not automatically become shared ecosystem knowledge.**

**What this means:**
- A Private Engine consumes the Evidence Core for its own organization's Claims and authorized third-party Claims.
- Any model, score, inference, or analysis produced by a Private Engine is property of that organization unless explicitly shared.
- Private Engine outputs are not visible to other organizations unless the producing organization explicitly publishes them as new evidence (subject to KEMS §7 visibility policy).

**What this protects:**
- Organizational IP — an organization's proprietary analysis of evidence remains its own.
- Kadarn neutrality — Kadarn does not aggregate private Engine outputs without consent.
- Ecosystem integrity — no Private Engine can unilaterally alter the shared evidence model.

---

## Core Engines for v1

The following Engines are designated Core Engines for Kadarn v1. This list is canonical and exhaustive. No Engine outside this list may be built without amending this ADR.

| Engine | Rationale | Status |
|--------|-----------|--------|
| **Policy Engine** | Enforces authorization and governance policy on Core operations. Required to enforce KEMS §7 visibility. | Existing (`packages/policy-engine/`) |
| **Provenance Engine** | Maintains the append-only provenance graph. Required for KEMS §2 Component B (Evidence Node provenance). | Existing (`packages/provenance/` + `provenance-graph/`) |
| **Confidence Engine** | (Decision deferred — see §Open Questions) | Pending future ADR |

All other Engines from KRM-RAO v1.0 — Trust (retired per ADR-010), Knowledge, Intelligence, Matching, Workflow, Analytics, Operational Twins, Financial, Fulfillment, Integration — are **service Engines**, not Core Engines. They are valuable platform capabilities but are not part of the canonical Core.

Certified and Private Engines are deferred entirely to Year 2 planning. This ADR defines the categories; it does not operationalize them.

---

## Examples

| Engine | Type | Meets dependency rule? | Meets write rule? |
|--------|------|----------------------|-------------------|
| Policy Engine | Core | ✅ Reads Core. Core does not depend on it. | ✅ Read-only on evidence. Writes policy decisions as derived state. |
| Provenance Engine | Core | ✅ Reads and writes provenance metadata. Core does not depend on it. | ✅ Append-only. Never modifies existing provenance. |
| Knowledge Engine (ontology) | Service | ✅ Reads Core for term resolution. | ✅ Read-only. |
| Intelligence Engine (AI) | Service | ✅ Reads Core for AI context. | ✅ Writes inference results as new evidence or derived output. |
| Matching Engine (feasibility) | Service | ✅ Reads Core for site/Claim data. | ✅ Read-only. |
| Trust Engine (retired) | — | Obsolete per ADR-010. Algorithms pending migration. | — |
| Custom site analytics (Private) | Private | ✅ Reads authorized Claims only. | ✅ Read-only. Internal model not shared. |
| CRO benchmark tool (Certified — future) | Certified | ✅ Reads Core via certified interface. | ✅ Writes benchmark results as new evidence (Class F if externally confirmed). |

---

## Impact

| Component | Classification | Action |
|-----------|---------------|--------|
| `packages/policy-engine/` | Core Engine v1 | Preserve. Align interfaces with Evidence Core. |
| `packages/provenance/` + `provenance-graph/` | Core Engine v1 | Preserve. These form the Provenance Engine. |
| `packages/trust-engine/` | Retired (ADR-010) | Pending migration. Algorithms may feed into future Confidence Engine. |
| `packages/knowledge-engine/` | Service Engine | Preserve. Not Core. |
| `packages/intelligence-engine/` | Service Engine | Preserve. Not Core. |
| `packages/matching-engine/` | Service Engine | Preserve. Not Core. |
| `packages/workflow-engine/` | Service Engine | Preserve. Not Core. |
| `packages/operational-twins/` | Service Engine | Preserve. Produces Class C evidence for Core. |
| `packages/financial-engine/` | Service Engine | Preserve. Not Core. |
| Certified Engines | Future (Year 2) | No action until certification framework exists. |
| Private Engines | Always permitted | No action. Governance is organizational. |

---

## Tri-ADR coherence check

Before ratification, a coherence check across the three architectural ADRs:

| Question | Answered by | Answer |
|----------|-------------|--------|
| What paradigm does Kadarn use? | ADR-010 | Evidence → Claim → Confidence. Trust paradigm retired. |
| Where does the Core end? | ADR-011 | Five-condition test. Core stores, proves provenance, relates, controls access, tracks process state. Nothing more. |
| Who can extend the system? | ADR-012 | Three Engine types. Dependency rule: all Engines depend on Core, never vice versa. Write rule: Engines read, do not modify existing evidence. |

**Result:** ✅ No contradictions detected. The three ADRs form a consistent governance layer.

---

## Open questions (deferred)

| Question | Resolution path |
|----------|----------------|
| Does a Confidence Engine exist as a Core Engine? | Future ADR (Phase 1 planning). This ADR leaves the slot open. |
| Certification framework for Certified Engines | Year 2 planning. This ADR defines the category only. |
| Private Engine → shared evidence publishing protocol | Requires extending KEMS §7 visibility model. Future RFC. |

---

## Signature

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Architecture Lead | | 2026-07-01 | |
| Engineering Lead | | | |
| Product / Strategy | | | |

---

*This document is artifact P0-005 of the Architecture Freeze Baseline AF-1.0. It defines the governance model for all Engines in the Kadarn ecosystem.*
