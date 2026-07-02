# Kadarn Sponsor Experience
## Product Definition Document — v1.0

---

## Who is this user?

**Primary persona: Medical Monitor / Clinical Operations Lead**

The person at a pharmaceutical company, biotech, or CRO responsible for site selection, feasibility assessment, or ongoing monitoring. They work across multiple studies simultaneously. Time is their most constrained resource.

**Secondary persona: VP of Clinical Operations / Head of Site Management**

Makes strategic decisions about site networks. Needs aggregated views, not individual site detail. Uses Kadarn to validate recommendations made by their team.

**What they are NOT:** a data scientist, a compliance auditor, or an academic researcher. They are decision-makers under time pressure who need to justify their choices.

---

## What are they trying to accomplish?

Three jobs, in priority order:

1. **Find the right sites** — Which institutions have genuinely demonstrated capability for this indication?
2. **Evaluate a specific site** — Before committing, is this site what it claims to be?
3. **Build a defensible record** — When the DMC, IRB, or sponsor leadership asks why we selected this site, what do we show them?

Everything in this experience must serve one of those three jobs.

---

## Moment of Truth

> The Medical Monitor searches for sites with oncology Phase II experience, opens the top result's Evidence Passport, and within 60 seconds knows whether this institution can justify the commitment — and has a link they can share with their VP.

If that moment does not happen in the first session, the product has failed for this actor.

---

## Primary Object: Institution Search

The Sponsor's entry point is a search, not a dashboard. They arrive with a question, not a task list.

The search is the product. Everything else — the Passport view, the comparison tool, the saved lists — is downstream of that first search.

---

## Entry Point

**URL:** `/marketplace`

The Sponsor lands on a clean search interface. No feed. No recommended content. Just:

> *"What are you looking for?"*

The search understands therapeutic area, indication, operational capability, geography, regulatory track record, and evidence strength — in natural language.

---

## Primary Flows

### Flow 1 — Find sites for a new study

**Trigger:** Sponsor needs to build a site list for a feasibility assessment.

**Steps:**
1. Enter search query — e.g., "Phase II oncology sites with GCP inspection history, US and Canada"
2. See ranked results — institutions sorted by confidence score for the specified criteria
3. Apply filters: geography, phase, therapeutic area, evidence recency, confidence tier
4. Review result cards — each shows: institution name, top 3 matching Claims, confidence score, last evidence update
5. Open institution detail for promising sites
6. Save sites to a named list ("Feasibility Study – Oncology 2025")
7. Export list with evidence summary for internal review

**What the user must understand at the end of this flow:**
- Which sites match their criteria and how strongly
- What evidence backs each match
- Which sites are worth deeper evaluation

**What they must NOT need to do:** manually score institutions, interpret raw graph data, or cross-reference external sources.

---

### Flow 2 — Evaluate a specific institution

**Trigger:** A site has been recommended by a CRA or colleague. Sponsor wants to verify.

**Steps:**
1. Search by institution name or enter direct link
2. Open the Evidence Passport — read-only view (same data the Site sees, with Sponsor-appropriate framing)
3. Review Claims by domain — Therapeutic Area, Operational History, Quality Record, Regulatory Compliance
4. For each relevant Claim: see evidence strength, source connectors, recency, and any Counter Evidence
5. Check Confidence Graph summary — how stable is this institution's representation over time?
6. Check Right of Response history — has the institution responded to any challenges? How?
7. Decide: flag as Selected / flag as Backup / flag as Rejected (with reason)

**What the user must understand at the end of this flow:**
- Does this institution's profile match the study requirements?
- What is the quality and recency of the evidence?
- Are there any unresolved concerns?

**What they must NOT need to do:** contact the institution directly through Kadarn, request additional data not already in the Passport, or manage the relationship.

---

### Flow 3 — Build a defensible site selection record

**Trigger:** Study reaches regulatory review, or internal governance requires documentation of site selection rationale.

**Steps:**
1. Open a saved site list
2. Generate Site Selection Report — Kadarn-generated document per site
3. Report includes: Confidence Score at time of selection, top matching Claims, supporting EvidenceNodes, any Counter Evidence and resolutions, Passport version timestamp
4. Export as PDF — signed with Kadarn-issued timestamp
5. Attach to regulatory submission or internal governance record

**What the user must understand at the end of this flow:**
- This report is auditable — it captures the state of evidence at the moment of decision
- It is generated by Kadarn, not manually assembled
- It meets the evidentiary standard expected by regulators

---

## Screen Inventory

| Screen | Purpose |
|--------|---------|
| Search | Primary entry — natural language query, filtered results |
| Institution Card | Search result — name, top Claims, confidence score, quick actions |
| Institution Detail / Passport View | Full Passport — read-only, Sponsor framing |
| Claim Detail (read-only) | Evidence supporting a single Claim |
| Saved Lists | Named collections of sites for a specific study or program |
| Comparison View | Side-by-side Passport comparison (max 3 institutions) |
| Site Selection Report | Generated per-institution document for regulatory/governance use |
| Account / Preferences | Search defaults, notification settings, team management |

---

## Navigation Structure

```
/ (Search)
├── /results                     Ranked search results
│   └── /institution/:id         Institution Detail — Passport (read-only)
│       └── /institution/:id/claims/:cid  Claim Detail (read-only)
├── /lists                       Saved site lists
│   └── /lists/:id               Named list — institutions + status flags
├── /compare                     Side-by-side comparison (up to 3 sites)
├── /reports                     Generated site selection reports
└── /settings                    Team, defaults, notifications
```

---

## What this user must be able to answer in under 30 seconds

1. Which sites in this geography have evidence of experience in this indication?
2. What is the confidence score of this specific institution, and why?
3. Does this institution have any unresolved Counter Evidence?
4. When was the last time evidence was updated for this site?
5. Can I export a defensible record of why I selected this site?

---

## What this user must NEVER see

- Other sponsors' search queries or saved lists
- Identity graph internals
- Kadarn operational data (staging queues, connector health)
- The name or identity of who filed Counter Evidence against an institution
- Real-time processing status of any evidence item
- The institution's own team members or internal activity

---

## Permissions

| Action | Medical Monitor | VP Ops |
|--------|----------------|--------|
| Search institutions | ✓ | ✓ |
| View Evidence Passport | ✓ | ✓ |
| Save sites to list | ✓ | ✓ |
| Flag site status (selected / rejected) | ✓ | ✓ |
| Generate Site Selection Report | ✓ | ✓ |
| Manage team members | — | ✓ |
| View team's saved lists | — | ✓ |
| Export bulk data | — | ✓ |

---

## Search capability requirements

The search must understand:

| Input type | Example |
|-----------|---------|
| Therapeutic area | "oncology", "rare disease", "CNS" |
| Phase | "Phase II", "Phase III" |
| Geography | "US", "Europe", "Latin America" |
| Capability | "biomarker collection", "cold chain", "pediatric" |
| Regulatory history | "GCP inspection", "FDA audit", "EMA approval" |
| Evidence recency | "active in last 2 years" |
| Confidence band | "Established or above" |

Search must tolerate natural language, not require structured query syntax.

---

## Notification triggers

| Event | Channel | Urgency |
|-------|---------|---------|
| Confidence score change on a saved site (±5 points) | Email + In-app | High |
| New Counter Evidence on a saved site | In-app | High |
| Site Selection Report ready | In-app | Low |
| Saved list shared by team member | In-app | Medium |
| Evidence update on a flagged site | In-app | Low |

---

## Open questions before implementation

1. Should Sponsors be able to see which other studies a site has participated in? (Sensitivity issue — ClinicalTrials.gov data is public, but aggregation creates new exposure)
2. Should the Confidence Score be shown as a number or a qualitative band? (Recommended: band for search results, number available in detail view)
3. Can a Sponsor file Counter Evidence? Or only view it? (Recommended: yes — with strict sourcing requirements)
4. Should saved lists be shareable within a Sponsor organization? (Recommended: yes, with role-based visibility)
5. Does the Site Selection Report carry any legal evidentiary weight? (Legal review required before launch)
