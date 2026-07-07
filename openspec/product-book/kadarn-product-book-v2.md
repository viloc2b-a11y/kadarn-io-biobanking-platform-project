# Kadarn Product Book v2.0

## The Institutional Capability Intelligence Platform

---

**Version:** 2.0 — Canonical Edition
**Status:** Approved
**Date:** 2026-07-06
**Authors:** Kadarn Product Team with el Gentleman Architecture
**Revision:** First Canonical Edition

**Document Hierarchy:**
Product Book → Manifesto → KRM/KEMS → ADRs → OpenSpec

---

## Preface

### Why This Book Exists

Kadarn has undergone a fundamental transformation — from a marketplace-first biospecimen platform to an institution-first capability intelligence platform. This book captures the product that emerged from that transformation.

It exists so that every person who works on Kadarn — engineers, designers, product managers, salespeople, executives, partners, and future contributors — shares a single, coherent understanding of what Kadarn is, how it works, and why it exists.

### How to Read This Book

This book is designed to be read sequentially (Parts I through VI tell a complete story) or by topic (each part is independently readable).

- **Part I — Vision**: Why Kadarn exists and what principles guide it. Read this first.
- **Part II — Conceptual Model**: The philosophy of evidence and how Kadarn thinks about capability. Read this to understand what makes Kadarn different.
- **Part III — Product Model**: How Program Readiness and Capability Intelligence work. Read this to understand the core product.
- **Part IV — User Experience**: How institutions, sponsors, CROs, and biobanks experience Kadarn. Read this to understand the user journeys.
- **Part V — Commercial Model**: How Kadarn creates and captures value. Read this to understand the business.
- **Part VI — Ecosystem Evolution**: How Marketplace, networks, and certified engines grow from Readiness. Read this to understand the future.

### Who Should Read This Book

- **Product & Design**: The entire book. This is your primary reference.
- **Engineering**: Parts I–III for domain understanding. Appendices A, B, D for technical context.
- **Sales & Partnerships**: Parts I, IV, V. The commercial story.
- **Executive Leadership**: Parts I, V, VI. Vision, value, and ecosystem strategy.
- **New Contributors**: The entire book. This is your onboarding to Kadarn.

### How This Book Relates to Other Kadarn Documents

| Document | Role | Relationship |
|---|---|---|
| **Product Book** (this document) | Canonical product definition | Highest product authority |
| **Manifesto** | Founding principles | Extracted from Part I |
| **KRM / KEMS** | Kadarn Reference Model / Evidence Management System | Technical architecture |
| **ADRs** | Architecture Decision Records | Technical decisions |
| **OpenSpec** | Specifications and implementation | Execution artifacts |

If a proposed feature contradicts this Product Book, the Product Book wins. If the market evidence contradicts the Product Book, the Product Book is revised — not ignored.

---

## Table of Contents

**Part I — Vision**
1. Why Kadarn Exists
2. Product Principles
3. Product Architecture

**Part II — Conceptual Model**
4. The Philosophy of Evidence

**Part III — Product Model**
5. Program Readiness
6. Readiness Scenarios
7. Capability Intelligence

**Part IV — User Experience**
8. Institution Journey
9. Sponsor Journey
10. CRO & Biobank Journeys

**Part V — Commercial Model**
11. Value Creation & Capture

**Part VI — Ecosystem Evolution**
12. Ecosystem & Marketplace

**Appendices**
- A. Canonical Definitions
- B. Glossary
- C. Concept Evolution
- D. Document Hierarchy
- E. Future Vision

---

# Part I — Vision

---

## Chapter 1: Why Kadarn Exists

The biospecimen and clinical research industry operates on a broken model.

When a sponsor needs institutions for a clinical validation study, the process takes 6-8 weeks per site. Emails. PDFs. Spreadsheets. Phone calls. Certifications that may be expired. Capabilities claimed but never verified. Reputation substituting for evidence.

When an institution wants to demonstrate readiness for research programs, they send the same documents to every sponsor. Again and again. No standardized format. No way to proactively signal capability. Success depends on who you know, not what you can prove.

This is not a technology problem. It is an evidence problem.

The industry lacks a common infrastructure for institutions to demonstrate capabilities and for sponsors to verify them. Every transaction requires manual re-verification. Every program starts from scratch.

**Kadarn exists to solve this.**

Kadarn is an Institutional Capability Intelligence Platform. It provides the infrastructure for institutions to build verifiable, evidence-backed capability profiles — and for sponsors, CROs, and biobanks to discover institutions based on demonstrated readiness, not reputation.

### What Kadarn Is

Kadarn is where institutions prove their capabilities through immutable, verifiable evidence, and sponsors discover ready institutions based on demonstrated competence.

Kadarn provides:
- A standardized framework for defining what readiness means for any research program
- An evidence infrastructure where institutions submit, manage, and maintain capability evidence
- A readiness engine that derives readiness status from evidence — never manually declared
- A capability intelligence layer that interprets readiness without certifying it
- A dual-view model where the same evidence serves institutions and sponsors from different perspectives

### What Kadarn Is Not

Kadarn is not a LIMS (Laboratory Information Management System). It does not manage lab workflows, sample tracking, or instrument data.

Kadarn is not a CTMS (Clinical Trial Management System). It does not manage clinical trials, patient enrollment, or study monitoring.

Kadarn is not a certification body. It does not certify, accredit, or guarantee institutional capabilities. It surfaces evidence and enables informed decisions.

Kadarn is not a consultant. It does not tell institutions what capabilities to build or sponsors which institutions to select. It provides the intelligence; humans make the decisions.

Kadarn is not a marketplace — at least, not first. Marketplace is the last layer, consuming readiness that has already been validated. See Chapter 12.

---

## Chapter 2: Product Principles

Seven principles guide every product decision in Kadarn.

### 1. Evidence Over Reputation

Institutions are evaluated on what they can prove, not what they claim. A small reference lab with strong, current evidence can compete with a major academic center with an outdated profile. The evidence speaks. The reputation follows.

**In practice**: When a sponsor searches for institutions capable of PBMC processing, Kadarn ranks by readiness and confidence — not by name recognition.

### 2. Explainable, Not Opaque

Every readiness assessment traces to specific evidence. Every capability confidence score can be decomposed into the evidence items that produced it. No black boxes. No hidden weights.

**In practice**: A sponsor reviewing an institution's readiness can click any capability and see exactly which documents support it, what class they are, and when they were submitted.

### 3. Institution-First

The institution owns its capability data. Sponsors discover it — they don't control it. The institution decides what to publish, what visibility to grant, and how to present its capabilities.

**In practice**: An institution can build its readiness profile privately, publish when ready, and update or retract at any time. Sponsors cannot modify institution data.

### 4. Derived, Not Declared

Readiness is computed from evidence, never manually set. No one — not the institution, not an admin, not a sponsor — can declare an institution "Ready." It must be demonstrated.

**In practice**: If an institution's key certification expires, Kadarn automatically recalculates readiness. The status reflects current evidence, not past achievement.

### 5. Multi-Actor, Single Truth

The same evidence graph serves institutions, sponsors, CROs, and regulators. Each actor sees the data from their perspective, but there is only one source of truth.

**In practice**: An institution's CLIA certification is visible to every sponsor who reviews their profile. No duplication. No version conflicts.

### 6. Capability Over Certification

Kadarn assesses what institutions can DO, not what certificates they hold. Certificates are evidence — they contribute to capability assessment. But a capability requires multiple forms of evidence: documented processes, training records, equipment logs, reference projects. A certificate alone is insufficient.

**In practice**: PBMC Processing capability requires: a validated SOP (Class A), equipment calibration records (Class B), and viability QC data (Class B). A CAP certificate contributes but does not substitute.

### 7. Network Effects Through Quality

More evidence → better readiness → more sponsor trust → more programs → more institutions motivated to build evidence. The network grows through quality, not quantity.

**In practice**: Kadarn does not incentivize institutions to submit volume. It incentivizes quality. Weak evidence dilutes the network; strong evidence strengthens it.

---

## Chapter 3: Product Architecture

Kadarn's product architecture is a stack of layers, each building on the one below. This chapter explains the architecture in product terms — what each layer does and how they relate.

### The Evidence Stack

```text
Sponsor Intelligence      ← "Who is ready for my program?"
        ↑
Capability Intelligence   ← "What can this institution do?"
        ↑
Program Readiness         ← "Is this institution ready?"
        ↑
Evidence Core             ← "What proof exists?"
```

**Evidence Core**: The foundation. Where institutions submit documents, certifications, SOPs, and records. Every piece of evidence is class-weighted (A through F), timestamped, and immutable.

**Program Readiness**: Kadarn derives readiness from the evidence graph. For each program type, Kadarn checks which required capabilities are evidenced, evaluates evidence quality, computes confidence, and determines readiness status.

**Capability Intelligence**: Interprets readiness without certifying it. Produces capability matrices, gap analyses, improvement recommendations, and confidence distributions.

**Sponsor Intelligence**: Consumes readiness and capability intelligence to produce sponsor-facing views: portfolio summaries, program matching, institution comparisons, and decision support.

### The Dual View Model

Kadarn's most important architectural innovation is the dual view model. The same evidence graph supports two inverse queries:

**Institution View**: "What can this institution demonstrate?"
- Used by: Institutions managing their own readiness
- Answers: What's my status? What gaps exist? What should I improve?

**Program View**: "What institutions can execute this program?"
- Used by: Sponsors, CROs, program managers
- Answers: Who is ready? Who is close? How do they compare?

These are the same data, navigated differently. Institution View groups evidence by institution. Program View groups evidence by program requirements. No duplication. No synchronization. One graph, two perspectives.

### The Readiness Loop

```text
Institution builds evidence
        ↓
Kadarn derives readiness
        ↓
Institution publishes to network
        ↓
Sponsor discovers and reviews
        ↓
Program is executed
        ↓
New evidence is generated
        ↓
Readiness is updated
        ↓
        (cycle continues)
```

This is not a one-time assessment. It's a continuous cycle where execution generates evidence, evidence strengthens readiness, and readiness attracts new programs. Every cycle makes the institution stronger and the network more valuable.

---

# Part II — Conceptual Model

---

## Chapter 4: The Philosophy of Evidence

### The Core Innovation

Kadarn's core innovation is not Program Readiness. It's not Capability Intelligence. It's not the dual view model.

The core innovation is this:

> **Institutions should not compete on reputation. They should compete on cumulative, explainable evidence about their capabilities.**

This sounds obvious. It is not how the industry works today.

Today, an institution's ability to attract research programs depends on: who they know, what conferences they attend, how prestigious their name is, and whether a sponsor has worked with them before. These are reputation signals — valuable, but incomplete and unequally distributed.

Kadarn replaces this with a different signal: **verifiable evidence, continuously maintained, transparently evaluated.**

### Why Evidence, Not Scores

A single score hides information. "Institution Score: 87/100" tells you nothing about what's strong and what's weak. It invites gaming. It creates false precision.

Kadarn shows evidence, not scores:
- Which capabilities are evidenced and which are not
- What class of evidence backs each capability
- How confidence varies across capabilities
- What specific gaps exist and how to close them

This is more information than a score — and more useful. A sponsor evaluating an institution for an IVD study doesn't need to know "they're an 87." They need to know: "Is their quality management evidenced? Is their regulatory compliance current? Do they have characterized sample capabilities?"

### Why Explainable, Not Opaque

Every readiness assessment in Kadarn must answer three questions:
1. **Why this status?** — Trace to specific capability requirements
2. **What evidence?** — Link to specific evidence items
3. **What's missing?** — Identify specific, actionable gaps

This is not optional. It is the product. If Kadarn cannot explain a readiness assessment, the assessment is not complete.

### Why Derived, Not Manual

Readiness is always computed from the current state of the evidence graph. No one can set an institution to "Ready." No admin override. No exception process.

This has profound implications:
- Readiness reflects current reality, not past achievement
- Evidence expiration automatically affects readiness
- Institutions are incentivized to maintain evidence, not just submit it once
- Sponsors can trust that readiness means something — it's backed by current, verifiable proof

### Why No Certification

Kadarn does not certify institutions. This is deliberate.

Certification creates liability. If Kadarn certifies and something goes wrong, Kadarn is responsible. Readiness creates transparency. Kadarn surfaces evidence; sponsors make decisions.

Certification is a gate. You pass or you fail. Readiness is a continuum. Institutions can be partially ready, conditionally ready, fully ready. They can improve over time.

Certification expires. Readiness evolves. When evidence is updated, readiness reflects it immediately — no waiting for the next audit cycle.

### The Virtuous Cycle

```text
More evidence → Better readiness → More programs → More evidence
```

Every time an institution adds evidence, readiness improves. Every time readiness improves, the institution becomes more discoverable. Every time an institution executes a program, new evidence is generated. Every time new evidence is added, readiness updates.

This is the engine that drives Kadarn's network effects. Not user count. Not transaction volume. Evidence quality.

### What This Means for the Industry

Kadarn shifts the basis of competition in biospecimen and clinical research from **who you know** to **what you can prove**.

For institutions: your capabilities, documented and verified, become your competitive advantage. Small institutions with strong evidence can compete with large institutions with weak evidence.

For sponsors: your site selection becomes faster, more transparent, and more defensible. You select institutions based on demonstrated readiness, not personal relationships.

For the industry: standards rise. When readiness is visible and comparable, institutions invest in capabilities. Sponsors reward quality. The entire ecosystem improves.

---

# Part III — Product Model

---

## Chapter 5: Program Readiness

### Definition

Kadarn defines Program Readiness as:

> An institution's demonstrated capability to execute a specific program type, validated by evidence-class-weighted confidence derived from verifiable, explainable evidence.

### Readiness is Derived, Never Declared

No one can manually set an institution to "Ready" in Kadarn. Readiness is always computed from the current state of the evidence graph. Every readiness assessment includes a verifiable trail: what evidence supports each capability, what class that evidence belongs to, and what confidence Kadarn derives from it.

### The Four Readiness States

**NOT_READY**: Critical mandatory evidence is missing for one or more required capabilities. Kadarn identifies exactly what's missing and what class of evidence is required.

**PARTIAL**: Some mandatory evidence exists, but gaps remain. The institution has started the journey. Kadarn shows progress and the remaining path.

**CONDITIONALLY_READY**: All mandatory evidence is present and validated. Some optional evidence is missing. The institution can publish to the network — sponsors can review and decide.

**READY**: All mandatory and optional evidence is present. Confidence exceeds the program threshold. The institution appears at the top of program matching results.

### Readiness Dimensions

Readiness is not a single number. It has four dimensions:

| Dimension | What It Means |
|-----------|---------------|
| Capability Coverage | Which required capabilities have evidence |
| Evidence Quality | The regulatory weight of submitted evidence (Class A–F) |
| Confidence | How strongly evidence supports each capability (0.00–1.00) |
| Completeness | Mandatory vs optional evidence coverage |

### Readiness vs Certification

Kadarn does not certify. It surfaces evidence. The distinction is fundamental:

- Certification says "trust us, they passed." Readiness says "here's the evidence, you decide."
- Certification is static. Readiness evolves with new evidence.
- Certification is a gate. Readiness is a continuous improvement tool.

### The Readiness Lifecycle

```text
No Evaluation → Select Program → Submit Evidence → Kadarn Derives Readiness
    ↑                                                    ↓
    └────────── Continuous Improvement ←──────────────────┘
```

Readiness is not a destination. It's a practice. Institutions continuously add evidence, expand capabilities, and pursue new program types.

---

## Chapter 6: Readiness Scenarios

### Scenario 1: An Institution Pursues PBMC Processing

University Medical Center wants to attract sponsors for PBMC processing programs. They select "PBMC / Specialty Sample Processing" in Kadarn.

Kadarn shows 7 required capabilities with evidence requirements. UMC uploads their CLIA certification, PBMC SOP, cell counting protocol, and BSL-2 certification. Two gaps remain: viability assessment protocol (mandatory) and cold chain validation (optional).

Kadarn derives: **PARTIAL**. The gaps are surfaced as specific, actionable recommendations.

UMC documents their viability protocol and uploads it. Kadarn re-evaluates: **CONDITIONALLY_READY**. UMC publishes to the network. A month later, they add cold chain validation. Kadarn derives: **READY**.

### Scenario 2: A Sponsor Searches for IVD Validation Institutions

NovaDx needs 3-5 institutions for a clinical validation study. They open Kadarn, select "IVD / Diagnostic Validation," and see 20 evaluated institutions — 4 READY, 3 CONDITIONALLY_READY.

They filter to the top 7, review capability matrices and evidence backing, compare 3 finalists side-by-side, and select 2 institutions. Kadarn provides evidence-backed readiness reports for their medical director. The whole process takes hours, not weeks.

Kadarn didn't make the decision. Kadarn provided the evidence to make it.

---

## Chapter 7: Capability Intelligence

### The Capability Model

A capability in Kadarn is what an institution can **demonstrate**, not what it claims:

```
Capability = CapabilityType (vocabulary) × Evidence (proof) × Confidence (strength)
```

### The Capability Taxonomy

Kadarn organizes capabilities into ten categories: Biospecimen Processing, Laboratory, Storage, Shipping, Clinical Operations, Clinical Data, Regulatory, Quality, Personnel, and Infrastructure.

### The Capability Matrix

For any program type, the Capability Matrix shows: which capabilities are strong, adequate, weak, or unmet — with confidence scores, evidence counts, and gaps. It's both the institution's self-assessment dashboard and the sponsor's comparison tool.

### Why Capability Is Not Reputation

Reputation is subjective, slow to build, fragile, and non-transferable. Capability is objective, fast to demonstrate, resilient, and transferable. Kadarn doesn't eliminate reputation — it provides an evidence-based foundation for it.

### How Kadarn Recommends Without Certifying

Every gap analysis includes specific, actionable recommendations — but they are suggestions, not requirements. Kadarn says "consider adding Class B evidence for viability assessment." Not "you must." The institution decides what to prioritize.

---

# Part IV — User Experience

---

## Chapter 8: The Institution Journey

The institution journey is Kadarn's backbone.

```text
Create Organization → Define Programs → Connect Evidence
    → Readiness → Capability Workspace → Continuous Improvement
```

**Create Organization**: Register, define profile, set up team. Minimal upfront data entry — the goal is to reach the first readiness evaluation within the first session.

**Define Programs**: Browse readiness program types. Select the ones relevant to your institution. See what capabilities and evidence each requires.

**Connect Evidence**: Upload documents, link to external systems, reference existing records. Kadarn validates evidence class, completeness, and metadata as it's submitted. Build incrementally.

**Readiness**: The moment of truth. Kadarn derives readiness status. The institution sees, for the first time, a structured, evidence-backed assessment of their operational capabilities.

**Capability Workspace**: A unified view of everything the institution can demonstrate — across all programs, all capabilities, all evidence. Track trends, identify gaps, prioritize improvements.

**Continuous Improvement**: Readiness is a practice. Kadarn recommends next actions, tracks evidence expiration, surfaces new program opportunities, and celebrates readiness achievements.

---

## Chapter 9: The Sponsor Journey

The sponsor journey is the inverse of the institution journey.

```text
Portfolio → Program Definition → Institution Discovery
    → Evidence Review → Decision → Portfolio Monitoring
```

**Portfolio**: The sponsor's home. All tracked institutions, organized by program type and readiness. At-a-glance awareness of who's ready, who's improving, who's declining.

**Program Definition**: Define what matters for your specific program. Customize capability requirements, confidence thresholds, and evidence expectations.

**Institution Discovery**: Kadarn matches program requirements against institution readiness. Results ranked by match strength with explicit rationale — why each institution appears where it does.

**Evidence Review**: Drill into any institution's evidence backing. Capability-by-capability breakdown. Specific evidence items. Confidence distribution. Gap analysis.

**Decision**: Evidence-backed, not platform-dictated. Side-by-side comparison, exportable reports, team collaboration, decision documentation.

**Portfolio Monitoring**: Ongoing visibility. Alerts for readiness changes, evidence expiration, and new institution discovery.

---

## Chapter 10: CRO & Biobank Journeys

### The CRO Journey

CROs operate between sponsors and institutions. Kadarn provides: multi-program portfolio visibility, operational capacity assessment, execution readiness tracking, and cross-sponsor monitoring.

### The Biobank Journey

Biobanks demonstrate specialized capabilities: collection by sample type, processing by method, storage conditions, distribution capabilities, and quality systems. Kadarn enables biobanks to build evidence-backed profiles and sponsors to discover biobank capabilities for multi-site collection networks.

---

# Part V — Commercial Model

---

## Chapter 11: Value Creation & Capture

### How Kadarn Creates Value

For institutions: convert operational investment into discoverable, verifiable capability. One evidence profile serves all sponsors.

For sponsors: replace 6-8 week manual qualification with evidence-backed discovery in hours. Ongoing portfolio visibility replaces point-in-time assessments.

For the industry: common standards for capability assessment. Evidence-based selection replacing reputation-based selection. Continuous readiness replacing periodic audits.

### How Kadarn Captures Value

Kadarn uses a subscription model aligned with value received:

- **Institution Subscription**: Readiness evaluation, evidence management, capability workspace
- **Sponsor Subscription**: Institution discovery, program matching, portfolio monitoring
- **CRO Subscription**: Multi-program portfolio, cross-sponsor visibility
- **Network License**: Enterprise-scale access for large sponsors and networks

Kadarn deliberately avoids per-transaction fees. Transaction fees create misaligned incentives — the platform pushes transactions rather than quality. Subscription aligns Kadarn's incentives with evidence quality.

### Adoption Strategy

1. **Institution-Led Growth**: Early adopter institutions build readiness profiles. Target: 10-20 institutions.
2. **Sponsor Pull**: Sponsors discover value as the network grows. Target: 3-5 sponsors.
3. **Network Flywheel**: More institutions → more sponsors → more programs → more institutions.
4. **Market Expansion**: Marketplace launch as consumption layer. Geographic and vertical expansion.

---

# Part VI — Ecosystem Evolution

---

## Chapter 12: Ecosystem & Marketplace

### The Kadarn Ecosystem

Kadarn is not a tool for individual institutions. It is an ecosystem where institutions, sponsors, CROs, biobanks, and regulators interact through a shared evidence infrastructure.

### Marketplace as a Consumer of Readiness

The most important architectural decision in Kadarn's ecosystem: **Marketplace does not produce readiness. Marketplace consumes it.**

```text
Evidence → Readiness → Capability Intelligence → Sponsor Intelligence → Marketplace
```

Marketplace is the last layer, not the first. It surfaces institutions whose readiness has already been validated. It enables transactions supported by evidence. It monetizes the network that readiness built.

### Why Marketplace Comes Last

Trust is the scarcest resource in biospecimen and clinical research. If Kadarn launched as a marketplace, it would face the same trust problem every other platform faces. By building the evidence infrastructure first, Kadarn inverts the problem: when Marketplace launches, every institution surfaced has already demonstrated their capabilities.

This is Kadarn's moat. A competitor can build a marketplace faster. They cannot build the evidence infrastructure faster — and without it, their marketplace has the same trust problem.

### Ecosystem Roadmap

1. **Foundation**: Evidence Core, Readiness, first 3 program types
2. **Sponsor Activation**: Sponsor Workspace, Program Matching, Portfolio Monitoring
3. **Network Growth**: 10+ program types, 50+ institutions, CRO/Biobank workspaces
4. **Marketplace**: Transaction-ready discovery, evidence-backed matching
5. **Certified Engines**: Compliance, Quality, Risk, AI-assisted matching

### Network Effects

Kadarn's network effects are driven by evidence quality, not user count. More verified capabilities → more sponsor trust → more programs → more institutions → better evidence.

---

# Appendix A: Canonical Definitions

| Term | Definition |
|---|---|
| **Kadarn** | An Institutional Capability Intelligence Platform that transforms verifiable evidence into explainable readiness for research programs. |
| **Institution** | A lab, hospital, biobank, or clinical site that demonstrates operational capabilities through Kadarn. |
| **Capability** | A demonstrable institutional competency — what an institution can prove it can do, backed by evidence and measured by confidence. |
| **Claim** | An institution's assertion of a specific capability, which must be backed by evidence to be considered valid. |
| **Evidence** | Verifiable, class-weighted proof (documents, certifications, records) supporting institutional capability claims. |
| **Confidence** | A derived metric (0.00–1.00) representing how strongly evidence supports a capability claim. |
| **Program** | A defined set of capability and evidence requirements for a specific research domain (e.g., PBMC Processing, IVD Validation). |
| **Program Readiness** | An institution's demonstrated capability to execute a specific program type, derived from evidence and expressed as NOT_READY, PARTIAL, CONDITIONALLY_READY, or READY. |
| **Capability Intelligence** | The layer that interprets readiness without certifying it — producing matrices, gaps, recommendations, and confidence distributions. |
| **Sponsor Intelligence** | The layer that transforms readiness and capability data into sponsor-facing views: portfolios, program matching, and decision support. |
| **Marketplace** | The consumption layer — surfaces institutions whose readiness is already validated. The last layer in the stack, not the first. |

---

# Appendix B: Glossary

| Term | Definition |
|---|---|
| **Capability Matrix** | Per-program-type view showing capability status, confidence, and gaps |
| **Capability Taxonomy** | Controlled vocabulary organizing capabilities into categories |
| **Class (Evidence)** | Regulatory weight tier: A (highest) through F (lowest) |
| **Confidence Distribution** | How confidence varies across capabilities — richer than a single score |
| **Dual View Model** | Institution View ("what can we prove?") + Program View ("who can execute this?") |
| **Evidence Gap** | Missing evidence for a specific capability — presented as an opportunity |
| **Evidence Graph** | The network of evidence nodes, claims, and relationships |
| **Program Type** | A template defining required capabilities and evidence for a research domain |
| **Readiness Status** | NOT_READY, PARTIAL, CONDITIONALLY_READY, or READY |
| **Readiness Loop** | The continuous cycle: evidence → readiness → programs → evidence |
| **Sponsor Portfolio** | A sponsor's collection of tracked institutions |
| **Provenance** | Immutable record of evidence origin and changes over time |

---

# Appendix C: Concept Evolution

Kadarn's product concept has evolved through four stages:

### Stage 1: Discovery Platform
The original idea: help researchers find biospecimens across institutions. A search engine for samples.

### Stage 2: Marketplace
The natural extension: if you can discover samples, you can transact. Build a marketplace where institutions list and sponsors search.

### Stage 3: Evidence Platform
The realization: marketplace trust requires evidence infrastructure. Before transactions can happen, institutions need to prove what they can do. The Evidence Core is born.

### Stage 4: Institutional Capability Intelligence Platform (Current)
The pivot: readiness is the product. Marketplace is the downstream consumer. The platform is not about finding samples — it's about demonstrating and discovering institutional capabilities through evidence.

This evolution is not a series of pivots. It is a deepening understanding of the same fundamental problem: **the gap between what institutions can demonstrate and what sponsors need to verify.**

---

# Appendix D: Document Hierarchy

Kadarn's governance documents are organized in a hierarchy of authority:

```text
Kadarn Product Book v2.0 ← This document. Highest product authority.
        ↓
Manifesto ← Founding principles. Extracted from Product Book Part I.
        ↓
KRM / KEMS ← Kadarn Reference Model / Evidence Management System.
              Technical architecture. Must be consistent with Product Book.
        ↓
ADRs ← Architecture Decision Records. Justify specific technical choices.
        ↓
OpenSpec ← Specifications and implementation artifacts.
```

**Rule**: If a proposed feature contradicts the Product Book, the Product Book wins. If market evidence contradicts the Product Book, the Product Book is revised through a formal amendment process — not ignored.

---

# Appendix E: Future Vision

Kadarn's long-term evolution follows the evidence:

### Near-Term (KTP-2.0)
- Institution onboarding experience
- Sponsor Workspace with program matching
- Evidence collection UX
- Capability Workspace for institutions

### Medium-Term (KTP-3.0)
- Certified Engines: Compliance, Risk, Quality
- AI-assisted program-to-institution matching (explainable, evidence-backed)
- Predictive readiness ("you'll reach READY in ~3 weeks based on your trajectory")
- Geographic and vertical expansion

### Long-Term Vision
- Industry-standard program types adopted across the biospecimen and clinical research ecosystem
- Kadarn readiness status recognized as a market signal
- Evidence infrastructure enabling faster, higher-quality research programs
- Network effects that reward evidence quality over reputation

Kadarn's ultimate goal: **make institutional capability as verifiable and discoverable as a credit score — but explainable, evidence-backed, and controlled by the institution.**

---

*End of Kadarn Product Book v2.0 — Canonical Edition.*

---

**Document Status:** Approved
**Next Review:** KTP-2.0 Completion
**Authority:** This document supersedes all prior product definitions. All future product decisions must be consistent with the principles, definitions, and architecture described herein.
