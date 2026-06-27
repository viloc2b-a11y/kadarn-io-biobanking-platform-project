# Kadarn Manifesto

**Version:** 1.0  
**Status:** Accepted  

---

## Canonical Statement

<!-- manifesto-statement: v1.0 -->
> **Kadarn is the orchestration infrastructure for biospecimen research — a platform that connects biobanks, sponsors, CROs, laboratories, and couriers into a unified network where specimens are discoverable, governable, traceable, and fulfillable under computable trust.**
<!-- /manifesto-statement -->

This is the canonical, versioned definition of Kadarn. Any future change to this sentence requires its own ADR. All downstream documents (Lexicon, Ecosystem Reference Architecture, KRM-RAO, pitch materials, contracts) must quote this block verbatim rather than paraphrasing it.

---

## Scope Boundary

Kadarn is a **network orchestration layer**, not an all-in-one research platform. The following boundaries are permanent unless explicitly amended by an ADR:

| Kadarn IS | Kadarn IS NOT |
|-----------|---------------|
| A cross-organizational orchestration platform | A LIMS, CTMS, EDC, or EHR system |
| A policy evaluation engine for governance | A contract management or legal system |
| A computed-trust network based on evidence | A reputation system or rating platform |
| An event-sourced provenance tracker | A document management or vault system |
| A federated discovery layer over existing systems | A data repository or data lake |
| A settlement facilitator between parties | A payment processor or banking system |

Kadarn orchestrates **across** organizations. It does not replace **within**-organization systems. Every feature request should be tested against this boundary: "Does this replace something an organization already runs internally?" If yes, the integration pattern applies — event ingestion, not system replacement.

---

## Why Kadarn Exists

Biomedical research depends on biospecimens — the physical starting point
for understanding disease, developing therapies, and validating biomarkers.
Yet the process of accessing biospecimens is broken.

A pharmaceutical sponsor seeking 500 tumor samples for a Phase II trial
must navigate: multiple biobanks, each with its own catalog; manual inquiry
and negotiation; IRB and ethics review across every site; Material Transfer
Agreements drafted and signed per transaction; cold chain logistics with
limited visibility; settlement disconnected from fulfillment.

The result: **4 to 9 months** from discovery to receipt. Specimens degrade
in freezers while researchers wait. Biobanks operate at a fraction of their
capacity. Data about specimens — provenance, QC, clinical linkage — is lost
between systems.

Kadarn exists to close this gap.

---

## The Systemic Problem

The biospecimen access problem is not a logistics problem. It is an
**orchestration problem**.

Logistics gets a package from A to B. Orchestration manages: who can
request what, under which governance, with what consent, under which
agreement, with what trust, with what evidence, and settled at what price.

Current solutions are marketplace-only: they show inventory and facilitate
payment. But the hard problems — governance, provenance, trust, regulatory
compliance — remain manual.

### Why Marketplace-Only Models Are Insufficient

| Dimension | Marketplace | Orchestration |
|-----------|-------------|---------------|
| Discovery | Catalog search | Federated query across governance boundaries |
| Governance | Post-hoc MTA | Policy-evaluated before request |
| Provenance | Receipt confirmation | Full lifecycle traceability |
| Trust | Ratings/reviews | Evidence-based computed trust |
| Settlement | Fixed price | Multi-party fee distribution |
| Compliance | Self-reported | Policy-enforced and monitored |
| Integration | Standalone | Embedded in biobank workflows |

Kadarn is not a marketplace. Kadarn is an **orchestration platform** that
happens to enable transactions.

---

## Why Orchestration Matters

Orchestration is the difference between a tool you use and infrastructure
you build on.

When biobanks, CROs, and sponsors treat specimen access as a series of
manual transactions, each transaction costs more in coordination than in
material. The overhead of governance, legal, logistics, and settlement
dwarfs the value of the specimen itself.

Orchestration collapses this overhead by:

- **Discovering** available assets across governance boundaries
- **Evaluating** policies before requests are submitted
- **Tracking** provenance from collection to data publication
- **Computing** trust from evidence, not reputation
- **Settling** automatically upon fulfillment

---

## Why Trust, Provenance, Governance, and Fulfillment Are Core

These four are not features. They are the structural pillars of the platform.

| Pillar | Question It Answers |
|--------|-------------------|
| **Trust** | Can I rely on this organization to handle my specimens correctly? |
| **Provenance** | Can I verify the complete history of this result? |
| **Governance** | Is this use authorized by all applicable policies and consents? |
| **Fulfillment** | Was the requested material delivered as agreed? |

Without trust, risk-averse sponsors constrain their options to known
partners, defeating the purpose of a network. Without provenance,
regulatory submissions and publications rest on unverifiable claims.
Without governance, the platform cannot operate across jurisdictions
with different consent and privacy regimes. Without fulfillment,
agreements produce no outcomes.

---

## Permanent Principles

### Orchestration over Directory

A directory shows what exists. Orchestration makes things happen.
Kadarn does not catalog specimens; it enables their movement under
governance.

### Evidence over Declaration

Trust is not what an organization declares about itself. Trust is what
evidence demonstrates. Every attestation must be accompanied by
verifiable evidence.

### Provenance over Static Records

A record is a point-in-time snapshot. Provenance is the complete,
verifiable history from origin to current state. Kadarn tracks the
latter.

### Policy over Hardcode

Business rules change. Regulations evolve. Consent terms differ by
jurisdiction. Kadarn evaluates policies at runtime, not compile time.

### Events over Mutable State

State is derived, not stored. Every state change is an immutable event.
The full event stream is the single source of truth.

### Federation over Replacement

Kadarn does not replace LIMS, CTMS, EHR, or ERP systems. It federates
across them, ingesting events at organizational boundaries and
orchestrating across the network.

### Trust over Assumptions

No participant is trusted by default. Trust is computed from evidence,
decays without new evidence, and can be challenged.

### Human-in-the-Loop Where Risk Matters

Automation drives efficiency. But where regulatory, ethical, or
financial risk is high — IRB review, MTA signing, breach adjudication —
humans remain in control.

---

## Conclusion

The biospecimen ecosystem does not need another marketplace. It needs
an orchestration layer that connects existing systems, preserves each
organization's autonomy, and provides the governance, provenance, trust,
and fulfillment that the market demands.

Kadarn is that layer.
