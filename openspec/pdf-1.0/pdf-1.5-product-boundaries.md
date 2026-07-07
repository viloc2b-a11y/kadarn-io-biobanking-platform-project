# PDF-1.5 — Product Boundaries

**Sprint:** PDF-1.5  
**Gate:** Boundary Freeze  
**Status:** Draft for approval  
**Sign-off role:** Architecture

This document answers formally: **¿Qué NO es Kadarn?**

*Normative sources: KEMS-002/KEMS-003 product constitution (AF-2.1 registry), ADR-010 (Trust Engine retirement), KEMS-007 (delivery boundary), lexicon v1.x*

---

## Category boundaries — Kadarn is NOT

| System | Why not Kadarn |
|--------|----------------|
| **CTMS** (Clinical Trial Management) | Kadarn does not manage protocol execution, visit scheduling, or site activation workflows |
| **eISF** (electronic Investigator Site File) | Kadarn does not replace regulatory binders or TMF/eTMF systems |
| **LIMS** (Laboratory Information Management) | Kadarn does not operate lab workflows, aliquot QC, or instrument integration as primary product |
| **EDC** (Electronic Data Capture) | Kadarn is not a case report form or clinical data capture system |
| **CRO execution platform** | Kadarn does not run trials, monitor sites, or manage CRA workflows |

---

## Commercial boundaries — Kadarn is NOT

| Concept | Why not Kadarn |
|---------|----------------|
| **Marketplace** (specimen / inventory trading) | Kadarn evaluates institutions; it does not broker specimens or biobank inventory |
| **Sponsor Portal** (replacement) | Kadarn provides evidence intelligence; it does not replace sponsor CTMS/portals |
| **Institution directory / CRM** | Kadarn is claim-centric evidence, not a marketing database |
| **Broker / matchmaker** | Matching engines exist experimentally; product positioning is evidence, not deal-making |

---

## Platform boundaries — Kadarn is NOT

| System | Relationship |
|--------|--------------|
| **Vilo OS** | Optional integration — **not** a functional requirement (see § Vilo OS independence) |
| **Trust Engine / Trust Score** | **Retired** — terminology and product surface banned (ADR-010) |
| **Static PDF vendor** | PDF output is a Kadarn delivery capability (Planned 1.x); core is live evidence intelligence |
| **Generic BI dashboard** | Discovery dashboards are evidence-bound, session-scoped, not ad-hoc analytics |

---

## Architectural boundaries — Kadarn does NOT

| Prohibited pattern | Correct pattern |
|--------------------|-----------------|
| Read raw Claims in product UX | Read through **Published View** (ADR-030) |
| `Evidence Core → PDF` | `Published View → Delivery Artifact → Channel` (KEMS-007) |
| Mutate Claims from Delivery Layer | Delivery is read-only projection consumer |
| Recalculate confidence in product routes | Confidence is **derived** (ADR-029); consume projection |
| Bypass Visibility Policy on public routes | Visibility + consent govern all external reads |
| Market "Verified Institution" badges | Use explainable confidence; no trust badges |

---

## What Kadarn IS (positive boundary)

Kadarn 1.0 **is**:

1. **Institutional Evidence Intelligence Platform** — reconstruct, govern, publish verifiable institutional evidence
2. **Three governed experiences** — Site (Workspace), Sponsor (Marketplace), Operations (KOC)
3. **Claim-centric model** — Claims → Evidence → Capabilities → Research Assets
4. **Published View boundary** — single external read projection for product surfaces
5. **Self-hosted evidence infrastructure** — Supabase + API + Web; operable without Vilo OS

---

## Experience boundary matrix

| Actor | Kadarn provides | Kadarn does not provide |
|-------|-----------------|-------------------------|
| **Site** | Passport, discovery, claim defense | Trial management, lab processing |
| **Sponsor** | Search, evaluation, evidence context | CTMS, contracting, specimen ordering |
| **KOC** | Governance, curation, ops visibility | Customer-facing product SKU |
| **Public** | Anonymous Passport read (governed) | Account creation, marketplace access |

---

## Vilo OS independence (formal)

Kadarn 1.0 and Vilo OS are **separate products**. Kadarn consumes evidence from multiple source types; Vilo OS is one optional source among them.

### Evidence sources

| Source | Required for Kadarn 1.0 |
|--------|-------------------------|
| Public Sources | **Yes** |
| Institutional Documents | **Yes** |
| External Confirmation | **Yes** |
| Vilo OS Operational Events | **Optional** |

### Standalone operation declaration

> **Kadarn 1.0 can operate completely without Vilo OS.** Vilo OS automatically increases evidence depth through operational events, but it is **not** a functional requirement for platform use.

This applies to product, sales, and architecture:

- **Product:** Kadarn 1.0 GA promise does not include Vilo OS deployment
- **Sales:** Kadarn is sold and deployed as standalone evidence infrastructure
- **Architecture:** No Kadarn 1.0 GA workflow may require a Vilo OS API, event bus, or identity provider

When Vilo OS is present, operational events feed the Discovery pipeline as **optional high-fidelity evidence sources** — enriching Claims, not gating platform function.

---

## Delivery capabilities boundary

Delivery (PDF, webhooks, email, Evidence Packages) are **Kadarn platform capabilities** — Planned for 1.x, not a separate product (see PDF-1.2):

- They **extend** Kadarn; they do not redefine Evidence Core or Published View
- They **must not** become the identity of Kadarn 1.0 GA — core GA is evidence + passport + discovery
- Each capability promotes to GA individually when validated; KEMS-007 is the architecture spec, not a release label

---

## Gate: Boundary Freeze

- [x] Category exclusions (CTMS, LIMS, eISF, etc.) documented
- [x] Commercial exclusions (marketplace, sponsor portal) documented
- [x] Vilo OS independence formalized (evidence sources matrix + standalone declaration)
- [x] Architectural prohibitions stated
- [x] Positive product definition stated
- [ ] **Architecture sign-off**

**Upon approval:** marketing, sales, and engineering must not position Kadarn outside these boundaries without PDF-1.5 amendment.
