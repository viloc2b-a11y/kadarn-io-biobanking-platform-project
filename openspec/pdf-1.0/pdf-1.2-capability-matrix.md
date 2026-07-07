# PDF-1.2 — Capability Matrix

**Sprint:** PDF-1.2  
**Gate:** All capabilities classified  
**Status:** Draft for approval  
**Sign-off role:** Architecture

---

## Status vs Maturity

**Status** = release commitment (what we promise in a given version).  
**Maturity** = technical readiness (where the capability actually is today).

This separation avoids labeling an entire spec (e.g. KEMS-007) as "RC" when individual capabilities may ship at different times and be promoted independently to GA.

### Status legend

| Status | Meaning |
|--------|---------|
| **GA** | General Availability — supported in Kadarn 1.0 |
| **RC** | Release Candidate — shipped in 1.0 but not GA-guaranteed |
| **Planned** | Committed roadmap — target version shown (e.g. 1.x) |
| **Experimental** | In repo; no stability guarantee |
| **Deferred** | Post-1.0 roadmap |
| **Retired** | Must not be used / marketed |

### Maturity legend

| Maturity | Meaning |
|----------|---------|
| **Production** | Production-proven or production-ready |
| **Staging Validated** | Staging PASS; prod cutover pending |
| **Under Development** | Active implementation |
| **Stub** | Interface exists; not production-functional |
| **Experimental** | Partial / unproven implementation |
| **Not Started** | Design or spec only |
| **Retired** | Removed or banned |

---

## Core platform

| Capability | Version | Status | Maturity | Owner | Notes |
|------------|---------|--------|----------|-------|-------|
| Evidence Core (Claim/Fact model) | 1.0 | GA | Production | Core | Frozen post-Phase 1; schema-only evolution |
| Evidence Lineage (Source→Fact→Claim) | 1.0 | GA | Staging Validated | Core | Domain package; partial API wiring |
| Confidence Graph (derived) | 1.0 | GA | Production | Core | ADR-029; projection in views |
| Policy Engine | 1.0 | GA | Production | Core | ADR-012 |
| Provenance (W3C PROV) | 1.0 | GA | Staging Validated | Core | ≠ KEMS-004 Claim Provenance |
| Visibility Policy | 1.0 | GA | Production | Core | Consent + visibility on access |
| Instrumentation (`@kadarn/instrumentation`) | 1.0 | GA | Production | Platform | AF-4.0 Sprint 1 |

---

## Evidence & discovery

| Capability | Version | Status | Maturity | Owner | Notes |
|------------|---------|--------|----------|-------|-------|
| Discovery Engine | 1.0 | GA | Production | Core | Pipeline, agents, firewall |
| Discovery Workbench (UX) | 1.0 | GA | Production | Core | Workspace + KOC modes |
| Discovery Dashboard API | 1.0 | GA | Staging Validated | Core | Published View path |
| Discovery Report API | 1.0 | GA | Staging Validated | Core | Recognition report |
| Discovery Session / Curation | 1.0 | GA | Production | Core | Human review loop |
| Public Discovery (institution page) | 1.0 | GA | Production | Core | `/institutions/[slug]` |
| Connector Framework | 1.0 | GA | Staging Validated | Core | Inbound; partial live providers |
| Document Intake (KDIE) | — | Experimental | Experimental | Core | Metrics only |

---

## Published representation

| Capability | Version | Status | Maturity | Owner | Notes |
|------------|---------|--------|----------|-------|-------|
| Published View Service | 1.0 | GA | Staging Validated | Core | ADR-030; Compatibility Layer retained |
| Evidence Passport | 1.0 | GA | Staging Validated | Core | Public anonymous read |
| Institution Public Profile | 1.0 | GA | Staging Validated | Core | `/api/v1/institution/public/{slug}` |
| Institution Profile (authenticated) | 1.0 | RC | Staging Validated | Core | Deferred 28K — VIEW_PENDING |
| Native phase8_published_views reads | — | Deferred | Not Started | Core | P4 optional post-GA |
| Hybrid Index (048) | — | Deferred | Stub | Core | Migration exists; prod pending |

---

## Delivery capabilities (Kadarn platform — not a separate product)

KEMS-007 defines the **architecture** for delivery. Delivery capabilities are **Kadarn capabilities**, classified individually. They are **not** labeled "RC" as a block — each promotes to GA on its own merit when ready.

| Capability | Version | Status | Maturity | Owner | Notes |
|------------|---------|--------|----------|-------|-------|
| Delivery Engine | 1.x | Planned | Under Development | Core | Spec: KEMS-007; `@kadarn/delivery-domain` |
| Evidence Packages | 1.x | Planned | Stub | Core | Compile input for delivery; stub API today |
| PDF Delivery | 1.x | Planned | Under Development | Core | Channel — Phase 9 |
| Dashboard Delivery | 1.x | Planned | Not Started | Core | Channel — Phase 9 |
| Webhooks (outbound) | 1.x | Planned | Under Development | Core | Channel — Phase 9 |
| Email Delivery | 1.x | Planned | Not Started | Core | Channel — Phase 9 |
| DLQ / idempotency registry | 1.x | Planned | Under Development | Core | Delivery reliability |

**Promotion rule:** When a delivery capability completes validation, update **Status** to GA (or RC if partial) in a PDF-1.2 amendment — without reclassifying the entire KEMS-007 spec.

**Pipeline rule:** `Published View → Delivery Artifact → Channel`. Never `Evidence Core → PDF`.

---

## Experiences (UX)

| Capability | Version | Status | Maturity | Owner | Notes |
|------------|---------|--------|----------|-------|-------|
| Workspace (Site Director) | 1.0 | GA | Production | Product | Discovery, continuity |
| Marketplace (Sponsor) | 1.0 | GA | Production | Product | Search, requests |
| KOC (Operations) | 1.0 | GA | Production | Product | Internal role only |
| Site Passport page | 1.0 | GA | Staging Validated | Product | `/site-passport/[slug]` |
| Login / auth routing | 1.0 | GA | Production | Platform | `/login` |

---

## Service engines (partial / experimental)

| Capability | Version | Status | Maturity | Owner | Notes |
|------------|---------|--------|----------|-------|-------|
| Exchange Engine | — | Experimental | Experimental | Engines | Deals API exists |
| Logistics Engine | — | Experimental | Experimental | Engines | Shipments API |
| Financial Engine | — | Experimental | Experimental | Engines | Settlements API |
| Workflow Engine (Temporal) | — | Experimental | Stub | Engines | Exchange workflow stub |
| Intelligence Engine | — | Experimental | Experimental | Engines | KOC analytics |
| Matching Engine | — | Experimental | Not Started | Engines | — |
| Fulfillment Engine | — | Experimental | Not Started | Engines | — |
| Knowledge Engine | — | Experimental | Experimental | Engines | KOC knowledge page |
| Operational Twins | — | Experimental | Experimental | Engines | KOC twins |
| Trust Engine | — | Retired | Retired | — | ADR-010; terminology banned |
| AI Layer | — | Experimental | Experimental | Engines | KOC AI insights |

---

## Operations & release

| Capability | Version | Status | Maturity | Owner | Notes |
|------------|---------|--------|----------|-------|-------|
| Phase 8 cutover ops | 1.0 | GA | Staging Validated | Platform | Prod cutover pending |
| Health / readiness / metrics | 1.0 | GA | Production | Platform | AF-4.0 |
| SDK (`@kadarn/sdk`) | 1.0 | RC | Staging Validated | Platform | Stable surfaces only |
| CLI (`@kadarn/cli`) | 1.0 | RC | Staging Validated | Platform | doctor, seed scaffold |

---

## Gate: Capability classification

- [x] Every capability has Version + Status + Maturity + Owner
- [x] Delivery capabilities classified individually as Planned for 1.x (not "KEMS-007 RC")
- [x] Status vs Maturity separation documented
- [ ] **Architecture sign-off**

**Upon approval:** capability promotions require PDF-1.2 amendment only for the affected row(s).
