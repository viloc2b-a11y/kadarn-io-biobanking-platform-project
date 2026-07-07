# PB-2.4 — Actors & Personas

> **Kadarn Product Book v2.0 — Part II: Conceptual Model**
> *Who uses Kadarn and why*

---

Kadarn serves multiple actors across the biospecimen and translational research ecosystem. Each has distinct goals, pain points, and ways of interacting with the platform. Understanding these actors is essential — every product decision must serve at least one of them directly.

---

## Actor 1: Institution / Lab Director

**Who they are.** Director of a biobank, clinical laboratory, core facility, or research institution that collects, processes, stores, or analyzes biospecimens. Manages staff, equipment, SOPs, certifications, and client relationships.

**Primary goal.** Demonstrate operational readiness for research programs to attract sponsors, CROs, and collaborators — without manually re-proving capabilities for every opportunity.

**Secondary goals.**
- Understand which programs their institution is qualified to pursue
- Identify specific gaps to close before pursuing new program types
- Maintain an evergreen, verifiable capability profile
- Reduce the administrative burden of evidence collection

**Pain points today.**
- Evidence is scattered: certifications in one folder, SOPs in another, training records in an HR system, equipment logs on paper
- Every new sponsor asks for the same evidence, re-formatted
- No way to know if they're "close" to qualifying for a program type they've never done
- Reputation-based selection means smaller or newer institutions are invisible regardless of actual capability

**How Kadarn helps.**
- Upload evidence once; it applies to all relevant program types
- Readiness is computed automatically; gaps are surfaced clearly
- Institutions control visibility — readiness can be published to the network or kept private
- Cumulative evidence grows over time, building a permanent capability record

---

## Actor 2: Sponsor / Program Manager

**Who they are.** Program manager at a pharmaceutical company, biotech, CRO, or academic research network responsible for identifying, qualifying, and selecting institutions for biospecimen collection, processing, or analysis programs.

**Primary goal.** Find institutions whose demonstrated capabilities match program requirements — quickly, with verifiable evidence, and without manual re-verification.

**Secondary goals.**
- Compare institutions objectively using standardized readiness criteria
- Monitor readiness changes across a portfolio of candidate institutions
- Reduce site qualification time from weeks to days
- Justify selection decisions to internal stakeholders and regulators with evidence trails

**Pain points today.**
- Site identification is manual: conference introductions, publication searches, personal networks
- Qualification requires collecting and reviewing documents from each candidate separately
- No standardized way to compare institutions across different evidence formats
- Once qualified, no ongoing monitoring — capabilities may change without the sponsor knowing
- Selection decisions are hard to defend because evidence is not structured

**How Kadarn helps.**
- Search for institutions by program type and required capabilities
- See readiness status with specific evidence highlights and gaps
- Review evidence directly — certifications, SOPs, program outcomes — within the platform
- Monitor portfolio: Kadarn alerts sponsors when an institution's readiness changes
- Every selection decision traces to specific, verifiable evidence

---

## Actor 3: CRO (Contract Research Organization)

**Who they are.** Organization that manages clinical research programs on behalf of sponsors. Responsible for site identification, qualification, monitoring, and program execution.

**Primary goal.** Match programs to qualified institutions efficiently, reducing the time from protocol to first patient/sample while maintaining quality.

**Secondary goals.**
- Standardize site qualification across multiple sponsors and program types
- Maintain a portfolio of pre-qualified institutions ready for rapid deployment
- Reduce duplicate qualification effort across programs
- Provide sponsors with transparent, defensible site selection rationale

**Pain points today.**
- Each sponsor has different qualification criteria; no shared framework
- Site qualification is repeated for every program, even with the same institution
- Institutional capability changes between programs go undetected
- Manual qualification processes don't scale across large site networks

**How Kadarn helps.**
- Standardized readiness framework applies across sponsors and programs
- Institutions maintain their own evidence; CROs review, not collect
- Portfolio monitoring: Kadarn tracks readiness changes across all institutions in a CRO's network
- Qualification cycles shorten because readiness is pre-assessed and continuously updated

---

## Actor 4: Biobank Operator

**Who they are.** Operator of a biospecimen repository that collects, processes, stores, and distributes biological samples for research. May be hospital-based, academic, commercial, or population-based.

**Primary goal.** Demonstrate biospecimen collection, processing, and storage capabilities to attract research programs and collaborations — with evidence that stands up to sponsor and regulatory scrutiny.

**Secondary goals.**
- Standardize readiness demonstration across multiple sample types (blood, tissue, PBMC, etc.)
- Track and surface compliance with biobanking standards (ISO 20387, ISBER Best Practices)
- Differentiate from other biobanks based on demonstrated capability, not just sample inventory
- Reduce the overhead of responding to capability questionnaires from multiple sponsors

**Pain points today.**
- Biobanking readiness is poorly defined — no standard framework exists
- Sample catalogs dominate discovery; operational capability is invisible
- ISO 20387 and ISBER compliance documentation is disconnected from sponsor qualification
- Biobanks are evaluated on what they have, not what they can do

**How Kadarn helps.**
- Program Readiness for biobanking: "Biospecimen Collection Readiness," "PBMC Processing Readiness," etc.
- Evidence includes SOPs, certifications, equipment logs, and program outcomes — not just sample counts
- ISO 20387 compliance evidence is linked directly to readiness assessment
- Biobanks become discoverable by capability, not just inventory

---

## Actor 5: Regulatory / Compliance Professional

**Who they are.** Auditor, compliance officer, or regulatory professional responsible for verifying institutional compliance with GCP, GLP, CLIA, CAP, ISO, HIPAA, GDPR, 21 CFR Part 11, and other applicable frameworks.

**Primary goal.** Verify institutional compliance efficiently using a structured, traceable evidence record rather than manual document review.

**Secondary goals.**
- Reduce audit preparation time for institutions
- Access a complete, immutable audit trail for every capability assessment
- Compare institutional evidence across multiple programs and time periods
- Identify evidence gaps proactively before they become audit findings

**Pain points today.**
- Audit preparation is manual, reactive, and time-consuming
- Evidence is scattered and inconsistently formatted
- No single view of institutional capability across all programs
- Audit findings are point-in-time; continuous monitoring is impossible

**How Kadarn helps.**
- Complete evidence trail with provenance: every piece of evidence has an immutable audit record
- Readiness assessments are computed, not declared — regulatory confidence is built into the system
- Evidence gaps are surfaced proactively, enabling continuous compliance rather than reactive audit prep
- Multi-actor visibility: regulators see the same evidence graph as the institution and sponsors

---

## Actor 6: Kadarn Platform Administrator

**Who they are.** Internal Kadarn team member responsible for maintaining the platform's taxonomy, onboarding institutions, ensuring data quality, and managing platform governance.

**Primary goal.** Maintain a high-quality, trustworthy capability intelligence platform that serves all other actors effectively.

**Secondary goals.**
- Curate the program type taxonomy and capability vocabulary
- Onboard and verify new institutions
- Monitor platform health: evidence quality, evaluation consistency, network growth
- Manage RLS policies and access controls

**Pain points today.**
- Taxonomy drift: new program types must be added without breaking existing assessments
- Quality assurance: ensuring evidence submitted is genuine and properly classified
- Growth management: balancing network growth with quality standards

**How Kadarn helps.**
- Taxonomy management interface for adding new program types and capability requirements
- Evidence quality monitoring: flagging stale, insufficient, or potentially problematic evidence
- Administrative dashboards for network health, growth metrics, and quality indicators
- Access control and visibility management at the platform level

---

## Actor Relationships

```
                    ┌──────────────────┐
                    │   PLATFORM ADMIN  │
                    │  (taxonomy, gov) │
                    └────────┬─────────┘
                             │ maintains taxonomy for
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ INSTITUTION│  │  BIODANK   │  │    CRO     │
     │  (lab,     │  │  OPERATOR  │  │ (site mgmt)│
     │   clinic)  │  │            │  │            │
     └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
           │               │               │
           │  build and publish readiness   │
           │               │               │
           ▼               ▼               ▼
     ┌─────────────────────────────────────────┐
     │           EVIDENCE GRAPH                 │
     │      (single source of truth)            │
     └─────────────────┬───────────────────────┘
                       │
           ┌───────────┼───────────┐
           │           │           │
           ▼           ▼           ▼
     ┌────────┐  ┌────────┐  ┌────────────┐
     │SPONSOR │  │  CRO   │  │ REGULATOR  │
     │(pharma,│  │(as     │  │(compliance │
     │biotech)│  │sponsor)│  │  officer)  │
     └────────┘  └────────┘  └────────────┘
         │            │            │
         │  discover  │  verify    │
         │  qualified │  readiness │
         │  instit.   │            │
         └────────────┴────────────┘
```

---

*Next: PB-2.5 — The Philosophy of Evidence*
