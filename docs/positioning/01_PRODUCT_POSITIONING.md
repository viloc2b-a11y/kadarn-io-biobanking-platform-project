# Kadarn Product Positioning — v2.0

**Date:** 2026-07-24
**Status:** Approved
**Supersedes:** Previous positioning documents that frame Kadarn as an evidence repository

---

## The Core Insight

Sponsors do not buy documents. Sponsors do not buy databases. Sponsors do not buy equipment.

**Sponsors buy confidence that a site can successfully execute a clinical study.**

Sites do not fail because they cannot complete feasibility questionnaires. Sites fail because they are not discovered, not trusted, and therefore never receive enough feasibility opportunities to convert.

Kadarn exists to close this gap.

---

## Product Identity

**Kadarn is the Institutional Trust Infrastructure for Clinical Research.**

An institutional trust infrastructure continuously builds a verified institutional profile backed by evidence, and automatically generates every downstream representation a site or sponsor needs.

---

## The Evidence Graph Remains the Engine

The technical architecture does not change:

```
Claim → Evidence → Review → Confidence → Passport → Share Grant
```

The Evidence Graph remains the source of truth. Claims, evidence, provenance, review, confidence, and passport publication continue to work exactly as implemented.

**What changes is what we call the output.**

---

## Generated Representations

The Evidence Graph produces one canonical asset: the **Institution Profile**.

Every other deliverable is a generated representation of that profile:

| Deliverable | Generated From | Audience |
|-------------|---------------|----------|
| Capability Profile | Institution Profile + Evidence + Confidence | Sponsors |
| Sponsor Brochure | Institution Profile + Capability Profile + Experience | Sponsors |
| Site Profile | Institution Profile + Operational Metrics + Credentials | Sponsors, CROs |
| Feasibility Response | Institution Profile + Capability Profile + Recruitment | Sponsors |
| Evidence Passport | Institution Profile + Evidence + Confidence | Sponsors, Regulators |
| Public Trust Page | Institution Profile (curated subset) | Public, Patients |
| Sponsor-facing Package | Institution Profile (curated) + Evidence Passport | Sponsors |

---

## What Kadarn Is

- An **Institutional Trust Infrastructure**
- An **Evidence Intelligence Platform**
- A **Capability Verification Engine**
- A **Discovery Readiness System**
- A **Credential Registry**
- An **Operational Metrics Platform**

## What Kadarn Is Not

- A broker — Kadarn does not match sites to studies
- A marketplace — Kadarn does not facilitate transactions
- An EDC — Kadarn does not collect clinical data
- A CTMS — Kadarn does not manage study operations
- A CRM — Kadarn does not sell contact lists
- An RBM platform — Kadarn does not perform risk-based monitoring

---

## Trust Model

Trust in Kadarn is not declared. Trust is **earned through evidence** and **maintained through continuous verification**.

The trust model operates on four layers:

1. **Evidence** — Verifiable claims backed by documents, data, or attestation
2. **Confidence** — Algorithmic assessment of evidence quality, freshness, and coverage
3. **Review** — Human or automated verification of evidence and claims
4. **Publication** — Controlled exposure of verified institutional capabilities to authorized audiences

---

## Relationship to Existing Implementation

This positioning document does NOT change:

- Database schema or migrations
- Evidence Graph architecture (Claims → Evidence → Review → Confidence → Passport → Share Grant)
- Review Workflow
- Claim lifecycle
- API contracts
- Package boundaries

It adds product concepts that expose the value the existing architecture already enables.
