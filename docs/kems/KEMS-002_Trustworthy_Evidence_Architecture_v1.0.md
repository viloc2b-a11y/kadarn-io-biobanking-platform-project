# KEMS-002 — Trustworthy Evidence Architecture

**Version:** 1.0  
**Status:** Reconstructed Canonical Draft — pending ratification  
**Category:** Architecture Model  
**Authority:** Defines evidence trustworthiness without institutional scoring  
**Reconstructed:** 2026-07-03  
**Based on:** ADR-010, KEMS-001, AF-2.0, ADR-011 (Evidence Core Boundary)  

---

## Purpose

This document defines what makes evidence "trustworthy" in the Kadarn platform — without computing institutional Trust Scores, without certifying organizations, and without replacing human judgment.

It establishes the architectural foundation for Kadarn's evidence governance: how evidence enters the platform, what properties make it reliable, and how downstream consumers assess its quality.

---

## Core Distinction

**Trust is not a score Kadarn produces. Trust is a property that emerges from verifiable, governed, transparent evidence.**

This distinction is fundamental. Kadarn does not say "this institution is trustworthy." Kadarn says "this claim is supported by Class A evidence from two independent sources, last verified 2026-06-15."

---

## Evidence Trustworthiness Dimensions

Evidence is assessed along four structural dimensions — never aggregated into a single score.

### 1. Provenance

**Where did this evidence come from?**

- Source identity (resolved via Identity Resolution Engine)
- Acquisition method (connector, upload, API)
- Chain of custody (full provenance graph)

### 2. Verifiability

**Can this evidence be independently confirmed?**

- Evidence class (A–F per KEMS-001)
- Multiple independent sources
- Primary vs. secondary origin
- Public accessibility of source

### 3. Governance

**Who controls this evidence?**

- Visibility Policy applies
- Institutional Consent required for sharing
- Right of Response available
- Private evidence protected

### 4. Temporal Validity

**Is this evidence current?**

- Acquisition timestamp
- Temporal decay function
- Last verification date
- Recency relative to claim type

---

## Evidence Pipeline

Evidence enters Kadarn through:

```
Provider → Connector Layer → Identity Resolution → Evidence Firewall → Evidence Core
```

At each stage, trustworthiness metadata is preserved or enhanced:

| Stage | Trustworthiness Effect |
|-------|----------------------|
| Connector Layer | Records provenance (provider, retrieval time, adapter version) |
| Identity Resolution | Links evidence to resolved institutional identities |
| Evidence Firewall | Classifies evidence (A–F), filters unacceptable sources |
| Evidence Core | Stores as immutable Evidence Nodes with full metadata |

---

## What Kadarn Does NOT Do

- **Does not certify institutions.** No "Kadarn Verified" badge exists.
- **Does not rate organizations.** No institutional score is computed.
- **Does not guarantee claims.** Evidence supports claims; Kadarn does not validate them.
- **Does not replace contractual trust.** MTAs, BAAs, and legal agreements exist outside the platform.

---

## Institutional Autonomy

Institutions retain full control over their evidence:

1. **Visibility Policy** — Institutions define who can see what
2. **Institutional Consent** — Dynamic, revocable sharing permissions
3. **Right of Response** — Institutions may publish responses to claims
4. **Private Evidence** — Never leaves institutional control without authorization

This autonomy is what makes the evidence architecture "trustworthy" — not a score, but the platform's commitment to institutional governance.

---

## Consumer-Side Trust Assessment

Consumers (sponsors, researchers, collaborators) assess evidence trustworthiness through:

1. **Confidence State per Claim** (per KEMS-001)
2. **Evidence provenance navigation** (full graph traceability)
3. **Source diversity inspection** (multiple independent sources visible)
4. **Temporal validity check** (recency metadata available)
5. **Governance transparency** (visibility policy and consent status visible)

The consumer decides what level of evidence is sufficient for their purpose. Kadarn provides the structure; the consumer provides the judgment.

---

## Relationship to Retired Concepts

| Retired Concept | Replacement |
|----------------|-------------|
| Trust Score (institutional) | Confidence State (per claim) + Evidence Trustworthiness Dimensions |
| Trust Badge / Verified | Not replaced — Kadarn does not certify |
| Trust Navigation | Not replaced — replaced by Evidence Firewall + Governance layer |
| kadarn_verified | Not replaced — verification is structural (pipeline stages), not a label |
| badge_level enum | Not replaced — badges are retired as an architectural concept |
| continuity_badge_level | Not replaced — continuity is governed by claim state, not badge level |

---

## Architectural Boundaries

This architecture applies to:

- Evidence Core — stores evidence with trustworthiness metadata
- Discovery Pipeline — surfaces evidence trustworthiness to consumers
- Identity Resolution — links evidence to identities
- Evidence Firewall — classifies and filters evidence
- Governance Layer — enforces visibility and consent
- Provenance Graph — maintains chain of custody

It does NOT apply to:

- Document Intake Pipeline (infrastructure, evidence-agnostic)
- Financial Engine (operational, not evidentiary)
- Fulfillment Engine (logistical, not evidentiary)
- Processing Engine (LIMS integration, not evidentiary)

---

## Permanent Vocabulary

### Permitted

Evidence Node, Evidence Class (A–F), Evidence Provenance, Evidence Trustworthiness, Confidence State, Visibility Policy, Institutional Consent, Right of Response, Temporal Decay, Chain of Custody, Source Identity, Connector Provenance.

### Prohibited (Retired)

Trust Score, Trust Engine, Trust Graph, Trust Fabric, Trust Level, Trust Badge, Verified Institution, Certified Institution, kadarn_verified, badge_level, continuity_badge_level, Gold/Silver/Bronze.

---

## Relationship to KEMS-001 and KEMS-003

- **KEMS-003** defines the product: Kadarn is an Institutional Evidence Intelligence Platform
- **KEMS-001** defines the model: Evidence → Claim → Confidence Graph → Confidence State
- **KEMS-002** defines the architecture: what makes that model "trustworthy" at the pipeline level

Together, the three KEMS documents form the permanent epistemological foundation of Kadarn.

---

*This document is a reconstructed canonical draft. Full ratification requires Architecture Review per AF-2.1 change process.*
