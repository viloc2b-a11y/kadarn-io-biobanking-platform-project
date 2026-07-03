# KEMS-006 — Systems Integration Standard

**Version:** 1.0
**Status:** Canonical — Ratified for Phase 8
**Category:** Architecture Standard
**Authority:** Defines how Kadarn integrates with external systems
**Date:** 2026-07-03
**Depends on:** KEMS-003, KEMS-004

---

## 1. Purpose

This document defines the canonical integration architecture for Kadarn.

Kadarn does not replace CTMS, LIMS, EDC, eTMF, EMR, or ERP systems. Kadarn enriches them with institutional evidence intelligence. This standard defines the interfaces, protocols, and guarantees for all external integrations.

---

## 2. Core Principle

**Kadarn enriches. Kadarn never replaces.**

Every integration must demonstrate that Kadarn adds value without duplicating or competing with the target system's core function.

---

## 3. Integration Patterns

### 3.1 Inbound Pull (Connector Layer)

Existing pattern. Kadarn pulls data from external sources:

```
External Source → Connector Adapter → Identity Resolution → Evidence Firewall → Evidence Core
```

**Supported sources:** ClinicalTrials.gov, PubMed, CrossRef, OpenAlex, FDA, ORCID, ROR, Private Uploads.

### 3.2 Webhook Events (Outbound Push)

NEW in Phase 8. Kadarn pushes events to external systems:

```
Kadarn Event → Webhook Dispatcher → External System
```

**Event types:**
- `claim.published` — A new Claim has been published
- `claim.disputed` — A Claim has been challenged
- `evidence.updated` — New evidence affects an existing Claim
- `review.requested` — Human review requested
- `consent.granted` / `consent.revoked` — Institutional consent changed

### 3.3 Outbound Evidence API

NEW in Phase 8. External systems query Kadarn for evidence:

```
External System → Evidence API → Published View → Response
```

**Endpoints:**
- `GET /api/v2/evidence/claims?entity={id}` — Claims for an entity
- `GET /api/v2/evidence/claim/{id}` — Full Claim with provenance
- `GET /api/v2/evidence/pack/{id}` — Evidence Pack for a Claim
- `GET /api/v2/evidence/search?q={query}` — Search across published evidence

---

## 4. System-Specific Integration Contracts

### 4.1 CTMS Integration

| Direction | What Kadarn provides | What CTMS provides |
|---|---|---|
| Kadarn → CTMS | Institution capability evidence, site readiness scores | Trial protocols, site lists |
| CTMS → Kadarn | Trial enrollment data, site performance metrics | — |
| Integration point | Webhook `claim.published` triggers CTMS site qualification update | Connector pulls CTMS data for evidence |

**Kadarn does NOT:** manage trials, track enrollment, handle randomization, or replace CTMS workflows.

### 4.2 LIMS Integration

| Direction | What Kadarn provides | What LIMS provides |
|---|---|---|
| Kadarn → LIMS | Biospecimen capability evidence, processing SOP references | Sample inventory, processing logs |
| LIMS → Kadarn | Sample processing completion events | — |
| Integration point | Evidence API queried for biospecimen claims during sample request | Webhook `evidence.updated` on processing completion |

**Kadarn does NOT:** track samples, manage workflows, store raw lab data, or replace LIMS.

### 4.3 EDC Integration

| Direction | What Kadarn provides | What EDC provides |
|---|---|---|
| Kadarn → EDC | Site capability evidence, PI credentials | Study data, CRF designs |
| EDC → Kadarn | Data quality metrics, query resolution rates | — |
| Integration point | Evidence API provides site readiness before EDC go-live | Connector pulls EDC metrics for evidence |

**Kadarn does NOT:** capture clinical data, design CRFs, manage queries, or replace EDC.

### 4.4 eTMF Integration

| Direction | What Kadarn provides | What eTMF provides |
|---|---|---|
| Kadarn → eTMF | Evidence Packs for regulatory submissions | Document placeholders, TMF structure |
| eTMF → Kadarn | Document filing confirmations | — |
| Integration point | Evidence Pack exported in ICH-GCP compliant format | Webhook confirms filing |

**Kadarn does NOT:** manage TMF structure, handle document versioning, or replace eTMF.

### 4.5 EMR/EHR Integration

| Direction | What Kadarn provides | What EMR provides |
|---|---|---|
| Kadarn → EMR | Institution capability for clinical research | Patient demographics (de-identified) |
| EMR → Kadarn | Patient cohort counts for feasibility | — |
| Integration point | Evidence API provides site capability during feasibility | Connector pulls aggregate cohort data |

**Kadarn does NOT:** store patient data, access medical records, or replace EMR.

---

## 5. Integration Guarantees

| Guarantee | Description |
|---|---|
| **Idempotency** | All outbound events are idempotent. Duplicate delivery is safe. |
| **Ordering** | Events for the same entity are delivered in order. |
| **Retry** | Failed deliveries retry with exponential backoff (max 24h). |
| **Dead Letter** | Undeliverable events go to dead letter queue after 3 retries. |
| **Schema Versioning** | Event schemas are versioned. Consumers negotiate versions. |
| **Auth** | All outbound APIs require API key + HMAC signature. |

---

## 6. Integration Governance

1. Every integration requires a System Integration Contract (SIC)
2. SIC defines: data flow, auth method, rate limits, SLA, failure handling
3. New system integrations require an ADR
4. Integration health is monitored via `/api/health` connector status
5. Degraded integrations do not block Kadarn core functions

---

## 7. Required ADRs

- ADR-029 — Webhook Event Architecture
- ADR-030 — Outbound Evidence API Design
- ADR-031 — Integration Health Monitoring
- ADR-032 — CTMS Integration Contract
- ADR-033 — LIMS Integration Contract

---

*Ratified for Phase 8. All system integrations must comply with this standard.*
