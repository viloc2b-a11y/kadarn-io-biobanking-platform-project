# Institution Profile — Conceptual Model

**Status:** Product concept — no implementation changes required

---

## Definition

The Institution Profile is the canonical, live representation of an organization generated from the Evidence Graph. It is not a static document — it is a continuously updated synthesis of everything the system knows about an institution.

## Data Model (Conceptual)

```
Institution Profile
├── Identity
│   ├── Name, Legal Name, Tax ID
│   ├── Type (Site, Lab, CRO, Sponsor)
│   └── Location(s)
│
├── People
│   ├── Key Personnel
│   ├── Roles & Delegations
│   ├── Training & Credentials
│   └── Experience
│
├── Capabilities (generated from Claims + Evidence)
│   ├── Capability Name
│   ├── Status (verified, declared, gap)
│   ├── Confidence Score
│   ├── Supporting Evidence
│   └── Last Reviewed
│
├── Experience
│   ├── Active Studies
│   ├── Completed Studies
│   ├── Therapeutic Areas
│   └── Patient Populations
│
├── Infrastructure
│   ├── Facilities & Labs
│   ├── Equipment
│   ├── Storage Capacity
│   └── Technology Systems
│
├── Operational Metrics (see separate spec)
│   ├── Enrollment Performance
│   ├── Activation Timelines
│   ├── Retention Rates
│   └── Startup Timelines
│
├── Credentials (see separate spec)
│   ├── Licenses
│   ├── Certifications
│   └── Training Records
│
├── Recruitment (see Discovery Readiness)
│   ├── Patient Panel Size
│   ├── Diversity Demographics
│   ├── Therapeutic Experience
│   └── Recruitment Channels
│
├── Evidence Summary
│   ├── Total Claims
│   ├── Evidence Coverage %
│   ├── Evidence Freshness
│   └── Evidence Gaps
│
└── Confidence Summary
    ├── Overall Trust Score
    ├── Capability Confidence Breakdown
    └── Recency-Weighted Confidence
```

## Relationship to Existing Tables

| Profile Field | Existing Source | Status |
|---------------|----------------|--------|
| Identity | Organizations table | ✅ Exists |
| People | (No dedicated table — MVP blocker) | 🔴 KAD-002 |
| Capabilities | Claims + evidence_nodes | ✅ Exists |
| Experience | claims (domain + study references) | 🟡 Partial |
| Infrastructure | (No dedicated table) | 🔴 Future |
| Operational Metrics | (No dedicated structure) | 🔴 New concept |
| Credentials | (No dedicated table) | 🔴 New concept |
| Recruitment | discovery_candidates + readiness | 🟡 Partial |
| Evidence Summary | evidence-core queries | ✅ Computable |
| Confidence Summary | confidence_state_snapshots | 🟡 Partial wiring |

## Generation Pipeline

```
Raw Data → Evidence Graph → Institution Profile → Generated Representations
```

The Institution Profile is MATERIALIZED from the Evidence Graph on read, not stored as a separate table. Each user's view of the profile may differ based on:
- Their relationship to the institution (self, sponsor-verified, public)
- Authorization level
- Context (feasibility, due diligence, public discovery)
