# PDF-1.8 — Kadarn 1.0 Product Definition Freeze

**Program:** PDF-1.0  
**Document type:** Consolidated freeze (final)  
**Status:** Draft — pending tripartite approval  
**Effective upon approval:** Product definition frozen; changes require PDF amendment process

---

## Executive summary

Kadarn 1.0 is an **Institutional Evidence Intelligence Platform** that enables research sites to demonstrate capabilities and sponsors to evaluate institutions through **evidence-backed Passports and Discovery** — not marketing claims or trust badges.

This document consolidates PDF-1.1 through PDF-1.7 into the authoritative product definition that governs RC-1, RC-2, and GA 1.0.

**No code or architecture changes are authorized by this document.** It freezes *what the product is*.

---

## 1. Scope

### In scope (GA intent)

| Area | Capabilities |
|------|--------------|
| Evidence | Evidence Core, lineage, confidence projection, policy, visibility |
| Discovery | Pipeline, agents, curation, dashboard, recognition report |
| Representation | Published View, Passport, institution public profile |
| Experiences | Workspace (Site), Marketplace (Sponsor), KOC (Operations) |
| Platform | Health/metrics, unified API envelope, SDK (stable surfaces), staging-validated cutover |

### Out of scope

- CTMS, eISF, LIMS, EDC, specimen marketplace, sponsor portal replacement
- Evidence Pack / delivery channels (Planned 1.x — individual capability promotion)
- Vilo OS as mandatory dependency
- Trust badges / Trust Engine (retired)

**Detail:** [pdf-1.1-product-scope.md](pdf-1.1-product-scope.md)

---

## 2. Boundaries

### Kadarn is NOT

- CTMS, LIMS, eISF, marketplace, sponsor portal, Vilo OS (as requirement), static PDF vendor

### Vilo OS (standalone)

Kadarn 1.0 operates with Public Sources, Institutional Documents, and External Confirmation. Vilo OS Operational Events are **optional** — they increase evidence depth but are not a functional requirement.

> Kadarn 1.0 can operate completely without Vilo OS.

### Kadarn IS

- Claim-centric evidence infrastructure with three governed experiences and Published View as the external read boundary

### Architectural rules

- Product reads → Published View only (ADR-030)
- Delivery → `Published View → Artifact → Channel` (KEMS-007)
- Confidence → derived, never recalculated in product routes (ADR-029)

**Detail:** [pdf-1.5-product-boundaries.md](pdf-1.5-product-boundaries.md)

---

## 3. Capabilities

| Tier | Examples | Status | Maturity |
|------|----------|--------|----------|
| **GA Core (1.0)** | Evidence Core, Discovery, Published View, Passport, Institution Public, UX | GA | Production / Staging Validated |
| **RC Platform (1.0)** | SDK, CLI, institution/profile (deferred) | RC | Staging Validated |
| **Planned (1.x)** | Delivery Engine, Evidence Packages, PDF, Webhooks, Email | Planned | Under Development / Stub |
| **Experimental** | Exchange, Financial, Logistics, Intelligence engines | Experimental | Experimental |
| **Retired** | Trust Engine | Retired | Retired |

Delivery capabilities are **Kadarn platform capabilities** — not a separate product. Each promotes to GA individually via PDF-1.2 amendment.

**Detail:** [pdf-1.2-capability-matrix.md](pdf-1.2-capability-matrix.md)

---

## 4. APIs

### Official stable (contract-frozen)

| Method | Path |
|--------|------|
| GET | `/api/health`, `/api/health/ready`, `/api/metrics` |
| GET | `/api/v1/institution/public/{slug}` |
| GET | `/api/v1/continuity/passport/{slug}` |
| GET | `/api/v1/discovery/dashboard`, `/api/v1/discovery/report` |

~115 additional v1 routes are **internal** (Kadarn Web only). Experimental engine routes have no stability guarantee.

**Envelope:** `{ ok, data|error, request_id, correlation_id, generated_at }`  
**Errors:** `KadarnErrorCode` taxonomy  
**SDK:** `@kadarn/sdk` for stable surfaces only

**Detail:** [pdf-1.3-stable-api-catalog.md](pdf-1.3-stable-api-catalog.md)

---

## 5. Workflows (supported)

| # | Workflow | Primary actor |
|---|----------|---------------|
| 1 | Institution onboarding → Passport | Site |
| 2 | Discovery → Curation → Claims | Site + KOC |
| 3 | Claim lifecycle (submit → verify → publish) | Site |
| 4 | Anonymous Passport consumption | Public / Sponsor |
| 5 | Sponsor search → evaluate → Passport | Sponsor |
| 6 | Institution public profile | Public |
| 7 | KOC operations & governance | KOC |
| 8 | Phase 8 cutover operations | Platform ops |
| 9 | Evidence Pack → Delivery (RC, not GA prod) | Integrator |

**Detail:** [pdf-1.4-supported-workflows.md](pdf-1.4-supported-workflows.md)

---

## 6. Compatibility & versioning

| Topic | Policy |
|-------|--------|
| API version | `/api/v1/*`, header `X-Kadarn-Api-Version: v1` |
| Breaking changes | ADR + version bump + release notes |
| Phase 8 cutover | Staging PASS; prod pending; Compatibility Layer retained until post-GA |
| Legacy routes | `/api/*` deprecated; direct claim reads blocked in product |
| KEMS-007 merge | Must not break stable API shapes; delivery is additive (Planned 1.x) |

---

## 7. GA definition

GA requires:

1. PDF-1.0 approved (this document — incremental sign-offs PDF-1.1–1.7 complete)
2. Core GA capabilities production-proven
3. RC-1 installation validation complete
4. RC-2 operational validation (blind operator) complete
5. AF-4.0 fully certified (not conditional)
6. Production Phase 8 cutover executed
7. **KEMS-003 ratified** (GA blocker — does not block RC-1)

Delivery capabilities (Planned 1.x) **do not block** core GA.

**Detail:** [pdf-1.7-ga-definition.md](pdf-1.7-ga-definition.md)

---

## 8. Documentation structure

Ten-section index: Product, Architecture, Operations, Administration, API, Deployment, Evidence, Security, DR, Compliance, Validation.

**Detail:** [pdf-1.6-documentation-index.md](pdf-1.6-documentation-index.md)

---

## 9. Parallel tracks

```
Cursor track              Delivery implementation (Gentle AI)
─────────────             ───────────────────────────────────
PDF-1.0 (this)            KEMS-007 architecture + capabilities
    ↓                         ↓
RC-1 Installation         Delivery capabilities mature (Planned → GA per row)
    ↓                         ↓
RC-2 Ops validation       Individual capability promotion (PDF-1.2)
    ↓                         ↓
GA 1.0 core               Delivery GA (1.x — when each capability ready)
```

KEMS-007 defines **how** delivery works architecturally. Release status is per-capability in PDF-1.2, not a monolithic label.

---

## 10. Amendment process

After PDF-1.0 freeze:

| Change type | Process |
|-------------|---------|
| GA scope addition | PDF-1.1 amendment + architecture review |
| New stable API | PDF-1.3 amendment + OpenAPI + SDK |
| New supported workflow | PDF-1.4 amendment + validation evidence |
| Boundary change | PDF-1.5 amendment + KEMS/ADR if architectural |
| GA criteria change | PDF-1.7 amendment |

---

## Approval & freeze gate

Incremental sign-offs (see [README.md](README.md)) must be complete before executive approval.

| Sprint | Gate | Sign-off | Status |
|--------|------|----------|--------|
| PDF-1.1 | Scope Freeze | Product | Draft |
| PDF-1.2 | Capabilities classified | Architecture | Draft |
| PDF-1.3 | API Contract Freeze | Engineering | Draft |
| PDF-1.4 | Workflow Freeze | Product | Draft |
| PDF-1.5 | Boundary Freeze | Architecture | Draft |
| PDF-1.6 | Doc structure approved | Product | Draft |
| PDF-1.7 | GA criteria approved | Product + Architecture + Operations | Draft |
| **PDF-1.8** | **PDF-1.0 FROZEN** | **Executive** | **Pending** |

### Executive sign-off (PDF-1.8 only)

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product | | | [ ] |
| Architecture | | | [ ] |
| Engineering | | | [ ] |
| Executive | | | [ ] |

*PDF-1.8 confirms consolidation — not a full re-review of PDF-1.1–1.7.*

---

**Upon final approval:** Kadarn 1.0 product definition is frozen. Cursor proceeds to **RC-1 — Installation & Validation**. No platform code changes until RC-1 charter is opened — except KEMS-007 track (Gentle AI) and bugfixes explicitly authorized under release governance.

---

*Consolidated from PDF-1.1–1.7 — 2026-07-03*
