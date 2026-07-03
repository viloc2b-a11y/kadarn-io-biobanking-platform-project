# KUX-010 — Opportunity Discovery Workspace

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-010 |
| Sprint | UX-10 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Draft for gate: Opportunity Discovery Approved |
| Kind | **Product specification** |
| Depends on | KUX-001 – KUX-009 (all ratified) |
| Governs | The Opportunity Discovery workspace: how Kadarn proposes matches the sponsor has not asked for — origination, presentation, boundaries |
| Explicitly out of scope | Requirement-driven search (KUX-009), risk mechanics (KUX-011), notification delivery (KUX-012), wireframes, visual design, components, technology |

---

## 1. The One Question — and the Commercial Need

> **"What opportunities am I not yet seeing?"**

Feasibility (KUX-009) answers questions the sponsor formulates. This workspace answers the ones they haven't — a different problem, and a more strategic one.

**The commercial need.** Sponsors only find what they ask for. The cost of the unasked question is invisible and enormous: a site that gained PBMC capability last quarter and nobody re-checked; an institution excluded a year ago whose contradiction has since resolved; a portfolio member whose evidence now satisfies a struggling study the sponsor never thought to match it against; a newly evidenced region that would de-risk a concentrated program. No amount of better *searching* recovers these — they require the platform to propose. This is P1 (*Kadarn works first*) applied to matching: **the sponsor curates opportunities; Kadarn originates them.**

**Rhythm:** attentive · progressive (KUX-004 §12). **Surface type:** Discovery. **Primary minds:** Feasibility Lead and Portfolio Manager; the Sponsor org frame for coverage strategy.

---

## 2. The Opportunity Object

From KUX-003 §3, made operational: an Opportunity is a candidate match between a need and evidenced capability — **always contextual, never a property of the institution** (Cognitive Invariant 5: Opportunity always depends on context).

Opportunity types (the exhaustive v1 catalog — new types require amending this section):

| Type | Originates when | Example |
|---|---|---|
| **Emergent candidate** | New/changed evidence makes an institution newly relevant to an *active* requirements profile | "Evidence suggesting PBMC processing has appeared at an institution matching Study ABC's open profile" |
| **Reactivation** | A previously excluded candidate's blocking condition resolves (Candidate Evolution, KUX-009 §9.4) | "The counter-evidence that excluded this site has been resolved" |
| **Portfolio latency** | An existing portfolio member's evidence satisfies a need it was never matched against | "A current partner's timeline shows phase-II oncology experience relevant to Study XYZ" |
| **Coverage opportunity** | Evidence emerges in a region/capability where the sponsor's coverage is thin (KUX-007 Coverage view) | "Three institutions in a previously thin region now carry relevant evidence" |
| **Decay displacement** | A depended-upon institution's evidence is decaying while an evidenced alternative exists | "Evidence for a selected site's cold-chain claim is aging; two alternatives hold current evidence" |

Every opportunity binds: the **need** (a requirements profile, a portfolio gap, or a coverage goal), the **institution(s)**, the **evidence event that originated it**, and its **reasoning chain**.

---

## 3. Origination — Explainable by Construction

The rule that separates this workspace from a recommender system:

> **An opportunity is never "recommended for you." It is originated by an evidence event, through a reasoning chain, toward a stated need.**

Every suggestion carries, mandatorily (no field optional):

1. **Action label** — what to consider doing ("Review this institution against Study ABC's profile").
2. **Reason** — the evidence event that fired it ("a close-out letter evidencing phase-II oncology experience was discovered on June 12").
3. **Expected impact** — what it could change, in decision terms ("would raise Study ABC's fully-supported candidates from 4 to 5").
4. **Source of recommendation** — the mechanism, named ("matched against open profile Study ABC v3, requirement 2 of 6 previously unmet").
5. **Linked items** — the institution's Passport, the profile, the originating evidence.

Prohibitions: no opportunity may originate from an opaque similarity model without an articulable evidence chain ("institutions like your selected ones" is prohibited *as a reason* — the underlying signal must resolve to named, evidenced commonalities or it is not shown). No synthetic urgency. No volume targets — an origination engine tuned to "engagement" is structurally corrupt under this specification.

---

## 4. Presentation — Proposing Without Ranking

The Attention Queue discipline (KUX-007 §5) applied to opportunities:

1. **Opportunities are grouped by type and prioritized by decision impact** — a decay displacement affecting an active study outranks a coverage note. Conditions are ordered; institutions are never ranked (the Lexicon-level distinction holds here where the temptation is strongest).
2. **Few and high-quality beats many.** The queue is curated by evidentiary significance, not filled. **"No new opportunities" is an honest, designed state** — a quiet queue is credibility, not failure (KUX-004 §11).
3. **Every opportunity is explorable and dismissible.** Exploration opens the Passport under the need's lens (KUX-008 §5.3). Dismissal is a recorded judgment with a reason, and dismissed opportunities do not silently return — they return only if their evidence materially changes, and say so ("previously dismissed; new evidence since").
4. **Opportunities age honestly** (P11): an opportunity whose originating evidence has itself decayed says so or retires.
5. **The suggestion register is absolute**: every opportunity is phrased as evidence suggesting relevance — never as endorsement, prediction, or "top pick" (P8; ADR-010).

---

## 5. From Opportunity to Work

An accepted opportunity converts into the existing machinery — this workspace originates; it never operates:

| Opportunity accepted → | Becomes |
|---|---|
| Emergent candidate / Reactivation | A candidate in the relevant Feasibility profile (KUX-009), entering the match matrix with full assessment |
| Portfolio latency | A Reasoning Session on the member institution, under the need's lens |
| Coverage opportunity | A Feasibility exploration or a Portfolio watch on the region/capability |
| Decay displacement | A Risk-linked review: the decaying dependency and the alternatives, side by side (Compare rules) |

Acceptance, like dismissal, is recorded — the opportunity's lifecycle (originated → seen → explored → accepted | dismissed → archived) is auditable, and accepted opportunities carry their origination chain into the ensuing session's provenance (a selection that began as a Kadarn-originated opportunity says so in its Decision Provenance).

---

## 6. Boundaries

What this workspace must never do — each prohibition load-bearing:

1. **Never auto-acts.** No opportunity adds itself to a shortlist, portfolio, or study. Origination proposes; humans move (Cognitive Invariant 6).
2. **Never contacts institutions.** An opportunity is sponsor-internal reasoning; no outreach, notification, or visibility to the institution occurs from origination.
3. **Never expresses endorsement.** Kadarn found evidence suggesting relevance — full stop. "Kadarn recommends this site" is forbidden language in spirit and letter.
4. **Never manufactures scarcity or urgency.** No "opportunity expires soon" theater; the only legitimate urgency is evidentiary (decay, an active study's timeline), and it must cite its evidence.
5. **Never competes with Feasibility.** If the sponsor has formulated the question, the answer lives in KUX-009. This workspace exists precisely for the unformulated — overlap indicates a design error (Workspace Integrity Rule).

---

## 7. States

- **Quiet:** "No new opportunities. Kadarn is watching N open profiles, M portfolio institutions, and your coverage goals." — the standing statement of what origination is watching, so quiet is informative (Peripheral Awareness rule 4: silence must be meaningful).
- **Cold start:** origination needs needs — with no open profiles or portfolios, the workspace says exactly that and routes to creating them ("Opportunity Discovery activates when Kadarn has needs to match against — define a study profile or a portfolio").
- **Thin evidence:** where Kadarn's corpus is sparse, origination is honest about its field of view ("coverage in this region is thin; absence of opportunities here reflects Kadarn's evidence, not the market" — KUX-009 §11 honesty, inherited).
- **High activity:** after a large discovery ingestion, opportunities may spike; the queue remains impact-ordered and grouped — never a flood (Calm; grouping rules from KUX-004 §10).

---

## 8. Compliance and Acceptance

**Sponsor Workspace Contract:** all six clauses hold — notably clause 6: origination is machine work, but every state change (accept, dismiss, explore) is attributed human judgment.
**Canonical Laws:** no ranking (conditions ordered, institutions never); no aggregate judgment; every aggregate ("3 institutions in region") explorable; suggestion register absolute.
**Workspace Integrity:** one question (§1); the formulated-question boundary with Feasibility explicit (§6.5).

**The four executable-spec questions:**

1. *Real decision?* — Yes: whether to pursue an unformulated opportunity — a decision sponsors currently make by accident or not at all; plus the recorded accept/dismiss judgments.
2. *Less time to decision?* — Yes: it eliminates the periodic manual re-sweep ("has anything changed anywhere?") by making origination continuous; reactivations recover excluded candidates without re-running feasibility from zero.
3. *Evidence visible without overload?* — Yes: five mandatory fields per opportunity; impact-ordered grouped queue; quiet designed; no flood states.
4. *Implementable without inventing behavior?* — Yes: opportunity types enumerated (closed catalog), origination fields mandatory and enumerated, prohibitions explicit, lifecycle states named, conversion targets specified per type.

### Acceptance Criteria (Gate: Opportunity Discovery Approved)

1. What is the one question and how does it differ from Feasibility? — §1: the unformulated question; §6.5: the boundary.
2. What is an Opportunity and what types exist? — §2: contextual object; five-type closed catalog.
3. How are opportunities originated? — §3: evidence event + reasoning chain + stated need; five mandatory fields; no opaque similarity, no engagement tuning.
4. How are they presented without ranking? — §4: impact-ordered conditions, honest quiet, recorded dismissals, aging opportunities.
5. What happens on acceptance? — §5: conversion into Feasibility/Sessions/Risk with origination carried into provenance.
6. What is prohibited? — §6: five boundaries.
7. What are the states? — §7, including the informative quiet.

**Next document (Sprint UX-11):** KUX-011 — Risk Monitoring.
