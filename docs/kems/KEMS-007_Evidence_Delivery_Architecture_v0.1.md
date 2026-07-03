# KEMS-007 — Evidence Delivery Architecture

**Version:** v0.1
**Date:** 2026-07-03
**Status:** Canonical Draft pending ratification
**Hierarchy Level:** Level 2 — Canonical Architectural Model
**Authority:** Normative upon ratification
**Depends on:** KEMS-001 (Confidence Graph Model), KEMS-002 (Trustworthy Evidence Architecture), KEMS-003 (Product Constitution), ADR-011 (Evidence Core Boundary)

---

## 1. Central Decision

Kadarn does not deliver PDFs, reports, or exports as isolated outputs.

Kadarn delivers **governed Delivery Artifacts**, generated from **Published Views**, under **Policy + Visibility + Profile**, with full traceability: hash, version, recipient, template, applied policy, and delivery state.

This completes the chain built by Claims, Provenance, and Published Views:

- **Evidence Core** — what is evidentially supported truth
- **Published View** — what may be seen
- **Delivery Architecture** — how it leaves the system

Delivery is a **cross-cutting layer**. It does not belong to the Evidence Core, and it is not a feature of any single engine (including the Evidence Pack Engine).

## 2. Official Pipeline

```
Evidence Core
    ↓
Policy Engine
    ↓
Visibility Engine
    ↓
Published View
    ↓
Delivery Engine
    ↓
Delivery Artifact
    ↓
Delivery Channel
    ↓
Consumer
```

**Key rule — frozen:**

- Never: `Evidence Core → PDF`
- Always: `Published View → Delivery Artifact → Channel`

Every information exit from the system passes through this single pipeline. No route, report generator, export, or integration may bypass it. This rule is enforced by construction: the Delivery Engine is the only component authorized to produce consumer-facing output.

> **Wiring mandate.** The Policy Engine and Visibility Engine stages are mandatory runtime calls, not documentation conventions. The Delivery Engine is required to be a real consumer of `VisibilityPolicyEngine` and, where applicable, `InstitutionalConsentEngine`. A delivery path that does not invoke them is non-conformant, regardless of output correctness. (This closes the ad-hoc output pattern previously observed in public profile routes.)

## 3. Official Objects

| Object | Function |
|---|---|
| `DeliveryRequest` | Explicit or automatic request for a delivery |
| `DeliveryProfile` | Defines who consumes and what they may see |
| `DeliveryTemplate` | Defines format, layout, language, and presentation |
| `DeliveryArtifact` | Generated deliverable — versioned, hashed, auditable |
| `DeliveryChannel` | Output medium: dashboard, PDF, API, webhook, email, export |
| `DeliveryJob` | Technical execution: compile, render, sign, send |
| `DeliveryReceipt` | Evidence of authorization, delivery, reception, or failure |
| `DeliverySubscription` | Rule for scheduled or event-driven deliveries |
| `DeliveryPolicyBinding` | Policies applied to the artifact |
| `DeliveryEndpoint` | External technical destination: CTMS, webhook, email |

## 4. DeliveryArtifact Lifecycle

```
requested
  ↓
authorized
  ↓
compiled
  ↓
rendered
  ↓
signed
  ↓
queued
  ↓
delivered
  ↓
acknowledged
```

Alternate terminal/exception states: `failed`, `superseded`, `expired`, `revoked`.

Every report or export is an **auditable entity**, not a transient output. A DeliveryArtifact records at minimum: version, generation timestamp, recipient, template used, applied policy binding, language, delivery state, content hash, and reception confirmation. Artifacts are append-only: a corrected delivery supersedes; it never mutates.

## 5. Delivery Channels

| Channel | Use |
|---|---|
| Interactive Delivery | Dashboards, explorers, timelines |
| Generated Reports | PDFs, evidence packs, audit packages, sponsor reports |
| Machine Delivery | APIs, JSON, CSV, FHIR, CTMS exports |
| Scheduled Delivery | Weekly, monthly, quarterly reports |
| Event Delivery | Alerts on material changes: claim changed, evidence expired, confidence degraded |

All five channels consume the same pipeline (§2). A channel is a representation and transport concern only.

## 6. Frozen Principle — Evidence Model ≠ Presentation Model

A DeliveryTemplate MAY:

- order
- summarize
- translate
- format
- hide fields permitted by policy

A DeliveryTemplate MUST NEVER:

- recalculate confidence
- create claims
- reinterpret evidence
- bypass visibility rules

Presentation changes (report redesign, new formats, new languages) must be possible with zero changes to the Evidence Core or the Claims model.

## 7. Initial Delivery Profiles

| Profile | May see |
|---|---|
| Site | Own evidence, claims, gaps, counter-evidence |
| Sponsor | Published claims, authorized gaps, permitted risk flags |
| Kadarn QA | Full provenance, failed jobs, receipts, disputes |
| Auditor | Evidence packs, artifact history, signatures, receipts |
| CTMS Connector | Canonical machine-readable summaries |

A profile is a consumption contract, not a distinct document. The same underlying Published View, filtered by profile, produces different artifacts.

## 8. CTMS Contracts v1 (specification only — not immediate implementation priority)

Base contracts:

```
POST /delivery-artifacts
GET  /delivery-artifacts/{id}
GET  /ctms/studies/{study_id}/sites/{site_id}/evidence-summary
GET  /ctms/studies/{study_id}/sites/{site_id}/capabilities
POST /ctms/events/site-status-sync
```

Principles: canonical JSON, API versioning, idempotency key, correlation ID, audit logging, OAuth scopes bound to DeliveryProfile.

## 9. Roadmap Placement — Phase 7.5

| Sprint | Name | Deliverable |
|---|---|---|
| 27F | Delivery Architecture Spec | KEMS-007 v0.1 (this document) |
| 27G | Delivery Artifact Lifecycle | State machine + metadata model |
| 27H | Delivery Profiles & Templates | Profiles, templates, visibility matrix |
| 27I | Report & Evidence Pack Delivery | Generated reports from Published Views |
| 27J | Machine & Scheduled Delivery | API/export/webhook/scheduled reports |
| 27K | Delivery Audit & Receipts | Hash, receipts, revocation, supersession |

Sequencing note: Layers Interactive (exists) and Generated Reports come first; Scheduled and Event Delivery depend on scheduler and event-bus infrastructure that must be real (not fire-and-forget logging) before those sprints start.

## 10. Boundaries

- The Delivery layer never writes to the Evidence Core.
- The Delivery layer never computes or recomputes confidence (KEMS-001 §5 remains deferred; delivery is passthrough).
- The Delivery layer never uses retired vocabulary (KEMS-001 §10).
- DeliveryArtifacts and DeliveryReceipts are append-only.
- No consumer-facing output may exist outside a DeliveryChannel.

## 11. Open Questions (for ratification)

1. Signing authority and key management for the `signed` state.
2. Retention and expiry policy per profile (regulatory holds for Auditor artifacts).
3. FHIR resource mapping scope for Machine Delivery.
4. Whether Delivery Subscriptions require Institutional Consent renewal on material scope change.
5. Relationship to KEMS-004/005/006 (to be verified against the canonical registry at ratification).
