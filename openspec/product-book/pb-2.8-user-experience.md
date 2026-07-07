# PB-2.8 — User Experience

> **Part IV — User Experience**
> **Status:** Canonical
> **Purpose:** Define the core experiences Kadarn enables. Not screens. Not components. Journeys.

---

## How to Read This Chapter

This chapter describes **experiences**, not interfaces. It does not specify buttons, layouts, or navigation patterns. It answers: *What does each actor need to accomplish, and how does Kadarn enable that journey?*

Product designers should use this chapter as the foundation for screen design. Engineers should use it to validate that the product supports these journeys end-to-end. Sales should use it to tell Kadarn's story to prospects.

---

## The Institution Journey

The institution journey is the backbone of Kadarn. Every other experience depends on institutions building and maintaining their capability profiles.

### 1. Create Organization

An institution's journey begins with registration. The lab director or administrator creates an organization profile, providing basic information: institution name, type (academic medical center, community hospital, reference lab, biobank), location, and primary contact.

Kadarn does not require exhaustive upfront data entry. The profile starts minimal and grows as the institution engages with the platform. The goal is to get the institution to their first readiness evaluation as quickly as possible — ideally within the first session.

### 2. Define Programs

Once registered, the institution browses available readiness program types. Kadarn presents these organized by domain: Biospecimen, IVD/Diagnostics, Translational Research, Biobanking.

For each program type, Kadarn shows:
- What the program validates
- What capabilities are required
- What evidence is needed for each capability
- How many institutions are currently evaluated for this program

The institution selects the programs relevant to their operations. A university hospital might select "Prospective Biospecimen Collection" and "PBMC Processing." A reference lab might select "IVD Clinical Validation" and "Specialty Sample Processing."

### 3. Connect Evidence

This is where the institution builds their capability profile. For each selected program, Kadarn shows the required capabilities and evidence types. The institution connects evidence — uploading documents, linking to external systems, or referencing existing records.

Kadarn validates evidence as it's submitted:
- Is the evidence class appropriate for the requirement?
- Is the document complete and legible?
- Does it have required metadata (date, version, authorizing body)?

The experience is designed to be incremental. An institution doesn't need to submit everything at once. They can start with what they have, see their readiness, and build from there.

### 4. Readiness

With evidence submitted, Kadarn derives the institution's readiness status. This is a moment of truth — the institution sees, for the first time, a structured assessment of their capabilities.

The readiness view shows:
- Overall readiness status with clear explanation
- Capability-by-capability breakdown with confidence scores
- Evidence gaps with specific, actionable recommendations
- Comparison to program requirements

For many institutions, this will be the first time they've seen their operational readiness visualized systematically. The experience should feel illuminating, not judgmental.

### 5. Capability Workspace

Beyond individual program readiness, the Capability Workspace provides a unified view of everything the institution can demonstrate.

The workspace shows:
- All evidenced capabilities across all programs
- Readiness status for each active program
- Evidence inventory — what's current, what's expiring, what's missing
- Trend analysis — are capabilities improving or declining?
- Recommendations prioritized by impact

The Capability Workspace becomes the institution's operational command center. It's where they manage their evidence, track their readiness, and plan their improvement investments.

### 6. Continuous Improvement

Readiness is not a destination — it's a practice. Kadarn supports continuous improvement through:

- **Recommendations engine**: Prioritized actions to close gaps and strengthen capabilities
- **Evidence reminders**: Alerts when evidence is approaching expiration or needs updating
- **Program discovery**: Suggestions for new program types the institution might be ready for
- **Peer benchmarking**: Understanding how the institution compares to similar organizations (anonymized, opt-in)
- **Milestone tracking**: Celebrating readiness achievements and progress

The continuous improvement loop turns Kadarn from a one-time assessment tool into an ongoing operational partner.

---

## The Sponsor Journey

Sponsors come to Kadarn to find institutions capable of executing their programs. Their journey is the inverse of the institution journey — they start with program requirements and discover institutions that match.

### 1. Portfolio

The sponsor's home in Kadarn is their portfolio. It shows all institutions they're tracking, organized by program type and readiness status.

The portfolio view provides at-a-glance awareness:
- How many institutions are evaluated for each program type
- Readiness distribution (READY / CONDITIONALLY_READY / PARTIAL / NOT_READY)
- Recent changes — who improved, who declined
- New institutions that weren't there last time

This view replaces the spreadsheets, email threads, and mental notes that sponsors use today to track institutional capabilities.

### 2. Program Definition

Sponsors can define what matters for their specific program. While Kadarn provides standard readiness program types, sponsors can customize:
- Which capabilities are mandatory vs. nice-to-have
- Minimum confidence thresholds
- Specific evidence requirements beyond the standard template

This customization ensures that Kadarn surfaces institutions that match the sponsor's actual needs, not a generic checklist.

### 3. Institution Discovery

Program matching is where Kadarn's dual-view model shines. The sponsor selects a program type, and Kadarn surfaces institutions whose readiness matches.

Results are ranked by match strength:
- **Excellent**: READY, high confidence, all custom requirements met
- **Good**: CONDITIONALLY_READY, minor gaps in optional areas
- **Adequate**: PARTIAL but with strengths in the sponsor's priority capabilities
- **Limited**: Significant gaps; may be worth monitoring for future

Each result includes a match rationale — a plain-language explanation of why this institution appears at this rank.

### 4. Evidence Review

The sponsor can drill into any institution to review the evidence behind their readiness. This is not a surface-level check — Kadarn provides:

- Capability-by-capability breakdown with confidence scores
- Specific evidence items linked to each capability claim
- Evidence class and date for every item
- Gap analysis showing what's missing
- Trend data showing capability evolution over time

The evidence review experience enables the sponsor to make their own assessment. Kadarn provides the structured data; the sponsor applies their domain expertise.

### 5. Decision

Kadarn does not make decisions for sponsors. It enables informed decisions by providing:
- Side-by-side institution comparison on all readiness dimensions
- Exportable readiness reports with full evidence trails
- Team collaboration — share findings, annotate, discuss
- Decision documentation — record why an institution was selected or not

The decision is the sponsor's. Kadarn ensures it's evidence-based.

### 6. Portfolio Monitoring

After selecting institutions, sponsors continue monitoring their portfolio:
- Alerts when readiness status changes
- Evidence expiration warnings
- New institution discovery (institutions that recently reached readiness)
- Portfolio health dashboard — are your institutions maintaining readiness?

This ongoing monitoring transforms Kadarn from a point-in-time search tool into a continuous partner for sponsor portfolio management.

---

## The CRO Journey

Contract Research Organizations (CROs) operate between sponsors and institutions. Their journey combines elements of both.

### 1. Multi-Program Portfolio

CROs manage multiple sponsor programs simultaneously. Kadarn provides a unified portfolio view across all active programs, showing:
- Institutions by program, by readiness, by sponsor
- Cross-program institution visibility (an institution qualified for one program may be strong for another)
- Resource allocation — which institutions are at capacity, which have availability

### 2. Operational Capacity

Beyond readiness, CROs need to understand operational capacity. Kadarn provides:
- Throughput estimates based on evidenced capabilities
- Institution availability and current study load
- Geographic distribution for multi-site programs
- Capability depth — not just "can they do it" but "how much can they do"

### 3. Execution Readiness

Initial readiness and execution readiness are different. Kadarn tracks:
- Active program status for each institution
- Performance against program milestones
- Evidence currency — is the institution's evidence still valid?
- Any new gaps that emerged during execution

### 4. Monitoring

CROs receive real-time visibility into portfolio changes:
- Readiness changes across all managed programs
- New institutions becoming available
- Capacity changes at existing institutions
- Evidence expiration and renewal tracking

---

## The Biobank Journey

Biobanks have a specialized role: they collect, process, store, and distribute biospecimens. Their Kadarn journey focuses on demonstrating these specific capabilities.

### 1. Biobank-Specific Capabilities

Kadarn's capability taxonomy includes biobank-specific categories:
- Collection capabilities (by sample type: blood, tissue, urine, etc.)
- Processing capabilities (by method: PBMC, plasma, DNA extraction, etc.)
- Storage capabilities (-80°C, LN2, ambient)
- Distribution capabilities (domestic, international, cold chain)
- Quality capabilities (sample QC, viability testing, contamination screening)

### 2. Collection Network Building

For sponsors and CROs building multi-site programs, Kadarn enables biobank network construction:
- Search for biobanks by capability, sample type, and geography
- Compare biobank capabilities side by side
- Build a collection network with complementary capabilities
- Monitor network health — are all required capabilities covered?

### 3. Institution-Biobank Matching

When an institution needs biospecimen capabilities they don't have internally, Kadarn surfaces biobank partners:
- "You need PBMC processing but haven't evidenced it. Three biobanks in your region have this capability."
- Kadarn doesn't facilitate the transaction — it surfaces the capability match.

---

*Part IV concludes here. Part V (PB-2.9) covers the Commercial Model — pricing, go-to-market, and adoption strategy.*
