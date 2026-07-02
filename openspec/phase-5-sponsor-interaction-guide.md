# KADARN — Phase 5 Guide
## Sponsor Interaction Layer

**Status:** Planned  
**Depends on:** Phase 4 — Trustworthy Evidence Infrastructure  
**Date:** 2026-07-02

---

## Purpose

Define the commercial interaction model between sponsors and institutions without turning Kadarn into a broker or open site directory.

## Core Principle

The institution's identity is never the product. Verifiable institutional evidence is the product.

Kadarn does not sell access to site names or contact information. Kadarn sells intelligence that reduces uncertainty through evidence, capability mapping, controlled visibility, and consent-based collaboration.

Institution identity is revealed only when a real opportunity exists and mutual consent has been granted.

## Phase 5 Objective

Build the sponsor-site interaction layer that allows sponsors to discover capabilities, evaluate fit, submit structured opportunities, and request access while protecting institution time, identity, and evidence.

## Architecture

```
Public / Private Evidence
        ↓
Trustworthy Evidence Infrastructure (Phase 4)
        ↓
Canonical Intelligence Engines (Phase 2)
        ↓
Executive Profile / Sponsor Search (Phase 3)
        ↓
Visibility Policy Engine        ← 24A
        ↓
Capability Graph                ← 24B
        ↓
Discovery Workspace             ← 24C
        ↓
Opportunity Brief               ← 24D
        ↓
Institutional Consent Engine    ← 24E
        ↓
Mutual Reveal                   ← 24F
        ↓
Feasibility Passport
        ↓
Collaboration Workspace
```

---

## Sprint 24A — Visibility Policy Engine

**Mission:** Implement claim-level and actor-level visibility policies.

Control what each sponsor, CRO, site, Kadarn reviewer, or public visitor can see.

Visibility applies to: institution identity, claims, evidence summaries, evidence details, research assets, sponsor readiness, recommendations, private evidence, feasibility passport fields.

### Rules

- No global "profile visibility" model
- Visibility must be claim-level where possible
- Private evidence remains hidden unless authorized
- Public views never expose restricted evidence
- Sponsors never see identity unless policy allows it

### Deliverables

- Visibility Policy Engine
- Actor visibility matrix
- Claim-level visibility contract
- Dashboard/internal visibility tester
- Tests
- Commit

---

## Sprint 24B — Capability Graph

**Mission:** Implement sponsor-facing anonymous capability discovery.

Sponsors search for capabilities, not institutions.

Example: A sponsor searches "PBMC + Phase I + Texas + Hispanic population + Longitudinal dataset". Kadarn returns "27 matching institutions" with identity hidden, capability evidence summarized, readiness visible only as authorized.

### Rules

- No institution names in anonymous search
- No emails, no contact information
- No direct bypass around Kadarn
- Results are capability-based, not directory-based

### Deliverables

- Capability Graph view
- Anonymous sponsor search results
- Capability match cards
- Visibility enforcement
- Tests
- Commit

---

## Sprint 24C — Discovery Workspace

**Mission:** Create the workspace where sponsors define research needs.

Replace generic outreach with structured opportunity creation.

### Inputs

Protocol summary, study type, therapeutic area, sample/data needs, timeline, geography, population needs, budget/compensation range, operational requirements.

### Outputs

Required claims, required research assets, compatibility analysis, candidate institution pool, gaps and risks, opportunity draft.

### Rules

- No mass messaging
- No copy-paste outreach to institutions
- Sponsor must define a real opportunity before access is requested

### Deliverables

- Discovery Workspace
- Protocol requirement form
- Compatibility summary
- Candidate pool
- Tests
- Commit

---

## Sprint 24D — Opportunity Brief Engine

**Mission:** Convert sponsor intent into a site-facing Opportunity Brief.

The institution receives a structured opportunity, not a vague request.

### Opportunity Brief Includes

Study summary, sponsor type, therapeutic area, sample/data requirements, estimated workload, timeline, estimated compensation, required capabilities, why Kadarn matched the institution, known gaps or risks, requested visibility access.

### Rules

- No sponsor identity reveal unless policy allows
- No institution identity reveal yet
- The brief must help the site decide quickly
- The site can accept, decline, defer, or request clarification

### Deliverables

- Opportunity Brief object
- Site-facing brief UI
- Sponsor-facing draft preview
- Tests
- Commit

---

## Sprint 24E — Institutional Consent Engine

**Mission:** Implement consent-based access control for institutional evidence.

Govern who can see what, for what purpose, for how long, and under what agreement.

### Consent Controls

Actor, purpose, claim scope, evidence scope, research asset scope, duration, expiration, revocation, audit trail.

### Rules

- Consent is explicit
- Consent is revocable
- Consent can expire
- Consent is scoped
- Consent is auditable
- No sponsor gets unrestricted access by default

### Deliverables

- Institutional Consent Engine
- Consent policy model
- Consent grant/revoke flow
- Audit trail
- Tests
- Commit

---

## Sprint 24F — Mutual Reveal + Feasibility Passport

**Mission:** Implement mutual reveal and the living Feasibility Passport.

When both sides accept, identities are revealed and a controlled collaboration workspace opens.

### Mutual Reveal

- Before consent: sponsor identity hidden or partially disclosed, institution identity hidden
- After mutual acceptance: both identities revealed, collaboration workspace opened, Feasibility Passport unlocked according to consent

### Feasibility Passport Includes

Authorized claims, supporting evidence summaries, certifications, lab/infrastructure capabilities, research assets enabled, sponsor readiness, evidence gaps, expirations, version history, download/export option.

### Rules

- Passport is not a static PDF — it is a live controlled object
- Sponsor sees only authorized content
- Public users never see private Passport details

### Deliverables

- Mutual Reveal workflow
- Feasibility Passport
- Collaboration Workspace shell
- Passport export/print view
- Tests
- Commit

---

## Phase 5 Definition of Done

Phase 5 is complete when Kadarn supports the full sponsor-site interaction flow:

```
Sponsor searches capabilities
        ↓
Kadarn returns anonymous capability matches
        ↓
Sponsor creates structured opportunity
        ↓
Kadarn generates Opportunity Brief
        ↓
Institution reviews and controls access
        ↓
Mutual reveal occurs
        ↓
Feasibility Passport opens
        ↓
Collaboration workspace begins
```

Kadarn must protect: institution identity, institution time, private evidence, sponsor seriousness, platform value, and the Evidence Core principles.

## Non-Goals

Phase 5 does not implement: open site directory, unrestricted sponsor messaging, marketplace bidding, broker-style lead selling, public access to private evidence, contact scraping, mass outreach, unscoped sponsor access.

## Strategic Outcome

After Phase 5, Kadarn becomes a consent-based institutional intelligence platform.

It no longer only shows what an institution can demonstrate. It controls how that evidence is discovered, requested, shared, and converted into real sponsor-site collaboration.
