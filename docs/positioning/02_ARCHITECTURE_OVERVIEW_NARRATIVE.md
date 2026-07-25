# Architecture Overview — Institutional Trust Infrastructure Narrative

**Date:** 2026-07-24
**Status:** Narrative update only — no architectural changes

---

## Previous Narrative

Kadarn was described as an "Evidence Intelligence Platform" where institutions store claims and evidence, and the system computes confidence and publishes passports. The narrative emphasized the internal workings — the graph, the engines, the data model.

## New Narrative

Kadarn is the **Institutional Trust Infrastructure for Clinical Research**.

The Evidence Graph is the engine. The output is the **Institution Profile** — a live, evidence-backed representation of what an institution can do, how well they do it, and how trustworthy they are.

---

## Architecture Flow (Narrative)

```
┌─────────────────────────────────────────────────────┐
│                   INSTITUTION                        │
│  People · Capabilities · Experience · Infrastructure │
│  Recruitment · Metrics · Credentials · Evidence      │
└──────────────────────┬──────────────────────────────┘
                       │ feeds into
                       ▼
┌─────────────────────────────────────────────────────┐
│                EVIDENCE GRAPH                         │
│  Claim → Evidence → Review → Confidence → Passport   │
│                                                       │
│  (unchanged — the engine that processes and verifies) │
└──────────────────────┬──────────────────────────────┘
                       │ generates
                       ▼
┌─────────────────────────────────────────────────────┐
│              INSTITUTION PROFILE                      │
│  A live, canonical representation of the institution  │
│  backed by verified evidence with computed confidence │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
│Sponsor   ││Capability││Feasibility│Public Trust   │
│Brochure  ││Profile   ││Response  │Page           │
└─────────┘ └─────────┘ └─────────┘ └──────────────┘
```

---

## Key Architectural Layers

### Layer 1: Institution Layer
The institution itself — its people, locations, capabilities, experience, credentials, operational metrics, and infrastructure. This is the real-world entity that the system represents.

### Layer 2: Evidence Graph (Unchanged)
The processing layer that ingests, validates, relates, and evaluates all institutional data:
- **Claims** — Assertions about institutional capabilities
- **Evidence** — Verifiable support for claims
- **Review** — Human or automated verification
- **Confidence** — Algorithmic trust computation
- **Passport** — Curated publication of verified capabilities
- **Share Grant** — Controlled audience access

### Layer 3: Institution Profile (New Product Concept)
The canonical output of the Evidence Graph. A live, continuously updated representation that combines:
- Evidence-backed claims and confidence scores
- Operational metrics (active studies, enrollment, timelines)
- Credential status (licenses, certifications, training)
- Dynamic discovery readiness assessment

### Layer 4: Generated Representations (New Product Concept)
Every downstream deliverable is generated from the Institution Profile:
- Sponsor-facing documents (brochures, profiles, responses)
- Public trust pages
- Regulatory evidence packs
- Feasibility questionnaires

---

## What This Means for Implementation

The API, database, and package architecture remain unchanged. The only changes are:

1. **Dashboard UI** — Reorganize to emphasize the Institution Profile rather than internal graph constructs
2. **Navigation** — Lead with "What does a sponsor see?" rather than "What claims have we made?"
3. **Terminology** — Use product-facing language (Institution Profile, Discovery Readiness, Credential Registry) in UI copy and documentation
4. **Metrics** — Surface operational indicators alongside evidence-based claims
