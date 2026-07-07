# Sponsor Platform Invariants v1.0

**Date:** 2026-07-05  
**Status:** Frozen baseline for RC-12  
**Applies to:** Sponsor Platform, Sponsor Passport API, Evidence Core Adapter, RC-12 production integration work  
**Depends on:** Sponsor Platform Architecture v1.0, RC-10.2 Sponsor Passport Contract, KUX-008

---

## 1. Objective

This document defines the architectural properties that must remain stable while the Sponsor Platform evolves.

It does not describe how the system works. It defines what must not be broken by RC-12 or later program phases.

Any RC-12 sprint must satisfy these invariants before closure.

---

## 2. Layer Invariants

| ID | Invariant | Status |
|---|---|---|
| L-01 | Sponsor UI never accesses Evidence Core directly. | Required |
| L-02 | Sponsor UI never imports adapter internals. | Required |
| L-03 | All Sponsor Passport reads pass through Sponsor API routes. | Required |
| L-04 | Sponsor API routes access passport data through `PassportStore`. | Required |
| L-05 | Evidence Core Adapter is the only Sponsor Platform layer that reads Evidence Core for passport DTOs. | Required |
| L-06 | Sponsor Passport Contract is the only public representation of the sponsor passport model. | Required |
| L-07 | Lower layers must not depend on higher layers. | Required |

Allowed dependency direction:

```
Sponsor UI
   |
   v
Sponsor API
   |
   v
Sponsor Passport Contract
   |
   v
Evidence Core Adapter
   |
   v
Evidence Core
```

---

## 3. Contract Invariants

| ID | Invariant | Status |
|---|---|---|
| C-01 | RC-10.2 remains the stable Sponsor Passport contract for v1. | Required |
| C-02 | No response field may be removed without contract versioning. | Required |
| C-03 | No response field may change meaning without contract versioning. | Required |
| C-04 | Additive optional fields require contract review before exposure. | Required |
| C-05 | Consumers must never depend on Evidence Core internal structures. | Required |
| C-06 | Confidence remains enum-only; no numeric aggregate scores. | Required |
| C-07 | Sponsor Passport must not expose Public Projection shapes. | Required |
| C-08 | Sponsor Passport must not expose `continuity/passport` shapes. | Required |

Contract changes that affect API consumers require a new versioned contract or approved program decision.

---

## 4. Data Invariants

| ID | Invariant | Status |
|---|---|---|
| D-01 | Sponsor Platform does not mutate Evidence Core evidence as part of passport reads. | Required |
| D-02 | Evidence Core remains the production source of truth for claims and evidence. | Required |
| D-03 | Provenance must not be dropped during adapter transformations. | Required |
| D-04 | Adapter transformations may change representation but not meaning. | Required |
| D-05 | Counter-evidence must remain visible where the contract exposes contested state. | Required |
| D-06 | History events must be backed by audit or lifecycle data. | Required |
| D-07 | Recommendations must be backed by existing claim/evidence state. | Required |
| D-08 | Portfolio membership must be enforced before institution passport reads. | Required |

The adapter may select, group, or format data for the Sponsor Passport contract. It must not invent source facts.

---

## 5. Runtime Invariants

| ID | Invariant | Status |
|---|---|---|
| R-01 | Sponsor UI remains decoupled from persistence. | Required |
| R-02 | Sponsor API does not contain presentation logic. | Required |
| R-03 | Evidence Core Adapter does not implement Evidence Core domain policy. | Required |
| R-04 | Cache may optimize reads but must never become the authoritative source. | Required |
| R-05 | Pagination may change transport mechanics only through approved contract-compatible behavior. | Required |
| R-06 | Mock mode must preserve the contract while it exists. | Required |
| R-07 | Production mode must prefer Evidence Core-backed reads. | Required |
| R-08 | Temporary implementations must be tracked as RC-12 backlog, not hidden inside runtime behavior. | Required |

---

## 6. Security Invariants

| ID | Invariant | Status |
|---|---|---|
| S-01 | Authentication occurs before any Sponsor Passport read. | Required |
| S-02 | Sponsor organization authorization occurs before any portfolio-scoped query. | Required |
| S-03 | Portfolio membership is enforced before institution detail or provenance reads. | Required |
| S-04 | The API must never expose evidence outside the sponsor's authorization scope. | Required |
| S-05 | Responses must respect Evidence Core visibility and policy constraints. | Required |
| S-06 | Errors must not leak unauthorized evidence, internal storage details, or credentials. | Required |
| S-07 | Audit and provenance data must remain traceable for explainability-sensitive responses. | Required |

Security constraints apply even when mock mode or cache layers are enabled.

---

## 7. Evolution Rules

### Changes Allowed Without Breaking v1.0

The following changes may be made during RC-12 if they preserve all invariants:

| Change Type | Condition |
|---|---|
| New internal modules | Must respect dependency direction. |
| New adapter implementations | Must satisfy `PassportStore`. |
| New optional response fields | Must pass contract review before exposure. |
| New internal engines | Must remain behind approved API or adapter boundaries. |
| New recommendation types | Must be backed by claim/evidence state and remain contract-compatible. |
| Cache layers | Must be invalidatable and non-authoritative. |
| Persistent portfolio storage | Must preserve portfolio-scoped authorization semantics. |
| Stability runtime | Must preserve allowed stability enum and contract meaning. |

### Changes Requiring New Version or Governance Review

The following changes require an ADR, RFC, or versioned program phase:

| Change Type | Required Governance |
|---|---|
| Removing contract fields | New contract version. |
| Changing field meaning | New contract version. |
| Changing layer dependency direction | ADR or RFC. |
| Bypassing `PassportStore` for Sponsor Passport reads | ADR or RFC. |
| Reusing Public Projection for Sponsor Passport | ADR or RFC; presumed forbidden by default. |
| Reusing `continuity/passport` for Sponsor Passport | ADR or RFC; presumed forbidden by default. |
| Making cache authoritative | ADR or RFC; presumed forbidden by default. |
| Changing these invariants | ADR plus new architecture baseline. |

---

## 8. RC-12 Sprint Closure Checklist

Every RC-12 sprint must answer this checklist before closure:

| Check | Required Answer |
|---|---|
| Does the Sponsor UI still consume only Sponsor API/contract surfaces? | Yes |
| Does the API still route passport reads through `PassportStore`? | Yes |
| Is Evidence Core still the production source of truth? | Yes |
| Is RC-10.2 still contract-compatible? | Yes |
| Are Public Projection and `continuity/passport` untouched? | Yes |
| Are authorization and portfolio scope preserved? | Yes |
| Are provenance and contested state preserved where applicable? | Yes |
| Are temporary implementations either removed or explicitly tracked? | Yes |
| Do build, TypeScript, Sponsor Passport tests, and Evidence Core tests pass? | Yes |

---

## 9. Freeze Statement

The invariants defined in this document are the architectural constraints of **Sponsor Platform v1.0**.

Any modification to these invariants must be justified through an ADR, RFC, or a new versioned program phase. RC-12 may replace temporary implementations with production-grade infrastructure, but it must not weaken the contract, layer boundaries, source-of-truth ownership, or security model defined here.

---

## Next Artifact

The next RC-12.0 artifact is **RC-12 Roadmap**.

That roadmap must define RC-12.1 through RC-12.5 using a standard sprint card:

- objective,
- scope,
- exclusions,
- dependencies,
- entry criteria,
- exit criteria,
- technical gates,
- risks.

---

*Sponsor Platform Invariants v1.0 converts the Sponsor Platform Architecture v1.0 into closure criteria. These invariants are binding for RC-12 production integration work.*
