# ADR-024: Continuity Engine — Site Continuity Profile

**Status:** Proposed  
**Date:** 2026-06-28  
**Deciders:** Kadarn Architecture  
**Principle:** Clinical performance should belong to the site that earned it  

---

## Decision

Kadarn will add the **Continuity Engine** as a core platform capability that
turns verified site history into durable, portable, and permission-aware
operational memory.

Continuity is **not** a profile page. It is an event-derived domain capability
that produces:

- Site Continuity Profile
- Site Passport
- Experience Ledger
- Continuity Graph
- Trust Evidence Layer
- Opportunity Match Signals
- Performance Timeline

The Continuity Engine will integrate with the existing organization, program,
processing, logistics, regulatory, trust, provenance, policy, audit, matching,
knowledge, and domain-event foundations instead of creating parallel systems.

---

## Current architecture fit

| Existing capability | Reuse for Continuity |
|---------------------|----------------------|
| `organizations` | Site identity and organization scope |
| `organization_capabilities` / `organization_capability_types` | Initial capability source; Continuity adds history, evidence, verification, and maturity |
| `programs` / `program_participants` | Study/program relationship and sponsor/CRO participation source |
| `processing_samples`, `processing_aliquots`, `processing_workflows`, `quality_control_results` | Biospecimen workflow and performance evidence |
| `logistics_shipments`, `logistics_telemetry`, `logistics_shipment_items` | Shipping, chain-of-custody, delivery, and temperature performance evidence |
| `regulatory_documents`, `regulatory_protocols`, `regulatory_submissions`, `regulatory_submission_events` | Certification, SOP, protocol, and regulatory evidence |
| `audit_events` | Accountability trail for manual and system changes |
| `domain_event_store` / `domain_event_outbox` | Durable event ingestion and asynchronous projection |
| `provenance_nodes`, `provenance_edges`, `provenance_evidence` | Evidence and lineage links for continuity claims |
| `organization_trust`, `trust_events`, `trust_challenges` | Trust score consumption and challenge workflow |
| `policies`, `policy_evaluations`, `program_access_policies` | Privacy, visibility, and sponsor-name masking decisions |
| `matching-engine` | Opportunity ranking using continuity match signals |
| `knowledge-engine` | Normalized therapeutic area, biospecimen, disease, and capability terms |

---

## Domain boundaries

### Continuity owns

- Site-level continuity profile state.
- Experience ledger entries and their source classification.
- Site passport visibility and publication state.
- Continuity-specific relationships, capabilities, performance metrics,
  timeline events, and evidence links.
- Completeness, maturity, and opportunity signal computations.

### Continuity consumes

- Organization lifecycle and capability events.
- Program participation and study-status events.
- Processing, QC, logistics, regulatory, trust, and fulfillment events.
- Audit/provenance evidence references.
- Policy decisions for public, private, and shared-link disclosure.

### Continuity must not own

- Organization identity.
- Trust score computation.
- Provenance graph storage.
- Audit trail storage.
- Policy evaluation.
- Matching engine internals.
- PHI, donor-level data, or protocol-sensitive confidential data.

---

## Persistence model direction

Sprint 1 should add a Continuity-specific persistence layer:

- `site_continuity_profiles`
- `continuity_experience_ledger`
- `continuity_relationships`
- `continuity_capabilities`
- `continuity_performance_metrics`
- `continuity_timeline_events`
- `continuity_evidence_links`

All tables must:

- Use UUID primary keys.
- Be organization-scoped.
- Include `created_at` and `updated_at`.
- Enable RLS.
- Support manual, document-backed, event-derived, sponsor-confirmed, and
  Kadarn-verified sources.
- Store evidence references, not PHI.
- Link to `provenance_evidence`, `audit_events`, domain events, documents, or
  workflow records where available.

The persistence layer stores Continuity projections and claims. It does **not**
replace source-of-truth operational tables.

---

## Event model direction

Continuity will follow ADR-013 and publish typed domain events through the
existing domain-event package and event bus.

Required event types:

- `SiteContinuityProfileCreated`
- `ContinuityExperienceAdded`
- `ContinuityCapabilityAdded`
- `ContinuityCapabilityUpdated`
- `ContinuityPerformanceMetricRecorded`
- `ContinuityRelationshipCreated`
- `ContinuityTimelineEventRecorded`
- `ContinuityEvidenceLinked`
- `SitePassportPublished`
- `SitePassportUpdated`

Continuity projections should be derived from existing domain events when
possible. Manual edits must also emit events so audit, provenance, trust, and
timeline consumers receive the same operational signal.

---

## Privacy and permission rules

Continuity must never expose:

- PHI.
- Donor-level data.
- Confidential sponsor/CRO names unless explicitly permitted.
- Protocol-sensitive data unless explicitly authorized.
- Self-reported or unverified claims as verified.

The Site Passport requires visibility modes:

| Mode | Meaning |
|------|---------|
| `private` | Visible only to authorized organization users and admins |
| `shared_link` | Visible to permissioned external viewers |
| `public` | Public-safe site reputation and capability summary |

Sponsor/CRO names should support masked, private, and permissioned display.
Evidence-backed metrics must rank above self-reported metrics.

---

## Legacy experience and reference validation

Kadarn must preserve experience earned before a site joins the platform.
Legacy experience enters Continuity as an editable **Experience Claim** and
only becomes high-confidence reputation after evidence, references, or Kadarn
verification support it.

| Concept | Decision |
|---------|----------|
| Legacy Experience | Historical site experience earned before Kadarn onboarding |
| Native Experience | Experience generated by Kadarn platform events |
| Experience Claim | A site-authored statement that can be reviewed, evidenced, referenced, accepted, rejected, or expired |
| Evidence Item | A document, certificate, CV, 1572, sponsor/CRO letter, audit report, SOP, equipment record, completion letter, URL, or document reference supporting a claim |
| Reference | An external sponsor, CRO, CRA, monitor, PI, lab, biobank, or logistics provider that can validate a claim |
| Confidence Score | Deterministic 0–100 confidence value derived from status, submitted evidence, and reference confirmation |

Legacy validation extends Continuity with:

- `continuity_experience_claims`
- `continuity_evidence_items`
- `continuity_references`

These tables do not replace `continuity_experience_ledger` or
`continuity_evidence_links`. Claims are the editable onboarding workflow;
the ledger remains the durable experience projection.

### Claim confidence rules

| State | Confidence |
|-------|------------|
| Self-reported only | 25 |
| Evidence submitted | 50 |
| Reference added but pending | 60 |
| Reference confirmed | 80 |
| Multiple evidence items plus confirmed reference | Up to 90 |
| Kadarn verified | 95 |
| Rejected | 0 |
| Expired | 30 |

Rejected claims must never appear as verified. Self-reported claims must never
appear as Kadarn verified.

### Public display rules

Site Passport may display only public or permissioned claims. Public claims
must show verification level and must not expose PHI, confidential sponsor/CRO
names, or protocol-sensitive details unless the site has explicit rights to
disclose them. Sponsor/CRO names may be masked as:

- Global pharma sponsor
- Top 10 CRO
- IVD company
- Academic medical center
- Specialty lab

---

## Integration sequence

1. **Sprint 1 — Persistence:** create Continuity tables with RLS and evidence
   references.
2. **Sprint 2 — Events:** add typed events and event emission.
3. **Sprint 3 — Service:** implement profile, ledger, evidence, completeness,
   and maturity service functions.
4. **Sprint 4 — Passport:** expose permission-aware API and UI.
5. **Sprint 5–7 — Timeline, ledger, evidence:** project operational history and
   verification indicators.
6. **Sprint 8–9 — Matching and UI integration:** feed Discovery, Exchange,
   Trust, Admin, Organization dashboard, and sponsor-facing views.
7. **Sprint 10 — Quality gates:** enforce migration, RLS, service, event, API,
   UI smoke, privacy, permission, and evidence-linking tests.

---

## Consequences

### Positive

- Sites retain portable operational memory after a study, CRO, or broker
  relationship changes.
- Buyers can discover qualified sites using verified historical evidence.
- Trust and matching become evidence-richer without duplicating trust or
  provenance logic.
- Kadarn reinforces its ecosystem position without becoming an opaque
  intermediary.

### Negative / accepted

- Continuity introduces new projections that must remain consistent with source
  events.
- Passport visibility requires careful policy integration before public launch.
- Historical backfill will need explicit provenance confidence levels.

### Non-negotiable quality gate

No Continuity feature ships if it exposes PHI, confidential sponsor data, or
unverified claims as verified.

---

## References

- [ADR-011: Trust Engine](./adr-011-trust-engine.md)
- [ADR-013: Event-First Platform](./adr-013-event-first-platform.md)
- [ADR-014: Provenance Graph](./adr-014-provenance-graph.md)
- [ADR-018: Matching Engine](./adr-018-matching-engine.md)
- [Kadarn Event Catalog](../architecture/event-catalog.md)
