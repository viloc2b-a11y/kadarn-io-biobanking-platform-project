# PDF-1.1 — Product Scope

**Sprint:** PDF-1.1  
**Gate:** Scope Freeze  
**Status:** Draft for approval  
**Sign-off role:** Product

---

## Question answered

**¿Qué es exactamente Kadarn 1.0?**

Kadarn 1.0 is an **Institutional Evidence Intelligence Platform** that reconstructs, governs, and publishes verifiable institutional evidence — enabling sites to demonstrate capabilities and sponsors to evaluate institutions through evidence-backed Passports and Discovery, not marketing claims.

---

## Product vision

Kadarn enables organizations to demonstrate what they can do through **evidence instead of marketing**.

Institutions build a living **Evidence Passport**. Sponsors search and evaluate with explainable confidence. Kadarn Operations (KOC) governs evidence quality, identity, and connector health.

The fundamental unit is the **Claim**. Everything derives from Claims → Evidence → Capabilities → Research Assets.

*Source: KEMS-003 Product Constitution*

---

## Product positioning

| Dimension | Kadarn 1.0 |
|-----------|------------|
| Category | Institutional Evidence Intelligence |
| Primary buyers | Research sites, biobanks, academic medical centers, sponsor R&D |
| Core value | Reduce institutional uncertainty through verifiable evidence |
| Differentiator | Claim-centric, explainable, governed — not a directory or broker |
| Deployment | Self-hosted platform (Supabase + API + Web); **not** Vilo OS required |
| Delivery (Phase 9) | RC track via KEMS-007 — **not GA in 1.0 core** |

---

## In scope (Kadarn 1.0 GA intent)

### Evidence & representation

- Evidence Core (Phase 1 frozen domain — adapters only post-freeze)
- Institutional Discovery pipeline (connectors, agents, firewall, sessions)
- Published View projection layer for external product surfaces (ADR-030)
- Evidence Passport (public and authenticated, visibility-governed)
- Institution public profile
- Discovery Workbench: dashboard, session, recognition report
- Visibility Policy + Institutional Consent on governed access
- Counter-evidence and right-of-response flows (where implemented)
- Phase 8 Compatibility Layer (retained until post-GA sign-off)

### Actor experiences

| Experience | Route prefix | GA intent |
|------------|--------------|-----------|
| Site / Workspace | `/workspace` | Understand, strengthen, defend Passport |
| Sponsor / Marketplace | `/marketplace` | Search, evaluate, save, report (read-only Passport) |
| Kadarn Operations (KOC) | `/koc` | Evidence queue, discovery review, ops, cutover panel |

### Platform services (AF-4.0 baseline)

- Unified API envelope, error taxonomy, correlation IDs
- Health, readiness, metrics endpoints
- Security headers, rate limiting on public routes
- SDK for stable public APIs
- Staging-validated Phase 8 cutover configuration

---

## Out of scope (Kadarn 1.0)

### Product category exclusions

- CTMS, eISF, LIMS, EDC, CRO execution platform
- Specimen marketplace or biobank inventory trading
- CRM, marketing automation, institution directory
- Clinical decision support, patient recruitment
- Regulatory submission authoring, protocol writing
- Site payments / financial settlement as primary product

### Technical / release exclusions

- **Evidence Pack production delivery** (Phase 8 stub — not GA)
- **KEMS-007 Delivery Engine in production** (RC — Gentle AI track)
- PDF/email/webhook outbound delivery channels (Phase 9)
- Native reads from `phase8_published_views` write pipeline (optional P4)
- Production cutover execution (pending sign-off — pre-GA ops)
- Certified / Private Engines marketplace (Year 2 roadmap)
- Full elimination of legacy `continuity_experience_claims` reads (post-cutover)
- Vilo OS integration as **requirement** for Kadarn standalone

### Deferred UX / features

- Collaboration workspace document sharing (PDD deferred)
- Push/email notification delivery (generator-only today)
- Continuous monitoring auto-triggers
- Zero-knowledge private evidence proofs (V3)

---

## Product boundaries (summary)

Full boundary freeze: [pdf-1.5-product-boundaries.md](pdf-1.5-product-boundaries.md)

**Kadarn 1.0 is NOT:** a broker, CTMS, LIMS, eISF, marketplace for specimens, sponsor portal replacement, Vilo OS, or static PDF vendor.

**Kadarn 1.0 IS:** evidence infrastructure with three governed experiences (Site, Sponsor, KOC) and four stable public API surfaces.

---

## Vilo OS dependency

| Capability | Standalone Kadarn | Requires Vilo OS |
|------------|-------------------|------------------|
| Evidence Core, Discovery, Passport | Yes | No |
| Workspace / Marketplace / KOC UX | Yes | No |
| Vilo-specific screening / sentinel integrations | Optional | Yes (when deployed) |
| Delivery Layer (KEMS-007) | RC when shipped | Independent |

Kadarn 1.0 **must be operable without Vilo OS**. Vilo integrations are optional deployment extensions.

---

## KEMS-007 dependency

| Surface | Kadarn 1.0 without KEMS-007 | With KEMS-007 (RC) |
|---------|----------------------------|---------------------|
| Passport, institution, discovery APIs | **GA** | Unchanged |
| Evidence Pack API (stub) | Not GA | Becomes delivery input |
| PDF / webhook / email delivery | Not available | RC capability |
| `@kadarn/delivery-domain` package | Present, not prod | Wired by Gentle AI |

KEMS-007 **extends** Kadarn 1.0; it does not redefine the core GA surfaces.

---

## Gate: Scope Freeze

- [x] In Scope documented
- [x] Out of Scope documented
- [x] Product Vision stated
- [x] Product Positioning stated
- [x] Product Boundaries summarized
- [ ] **Product sign-off**

**Upon approval:** no new GA features without PDF-1.1 amendment.
