# KUX-001 — Kadarn Product Experience Principles

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-001 |
| Status | Ratified |
| Depends on | KEMS-001, ADR-010, ADR-011, ADR-012, Lexicon v1.2, Claim Taxonomy v1.0 |
| Governs | Every user-facing surface of the Kadarn platform |
| Supersedes | None (first document of the series) |

---

## 1. Purpose

This document defines the experience principles that govern how any human — sponsor, site director, reviewer, or operator — interacts with Kadarn.

It is the constitutional layer of the KUX series. Every subsequent document (Design Language, Information Architecture, Workspace Shell, Navigation Framework, Workspace Specifications) must be derivable from these principles. When a design decision cannot be resolved by a later document, it escalates to this one. When this document cannot resolve it, the decision escalates to the Lexicon and KEMS-001, which prevail.

This document contains no implementation detail. It defines how Kadarn must *feel*, *speak*, and *behave* — not how it is built.

---

## 2. Product Vision

Kadarn is the institutional intelligence workspace that transforms fragmented evidence into explainable operational decisions.

Kadarn does not replace human judgment. It reduces uncertainty. Every workspace exists to help institutions and sponsors make better decisions through evidence, context, and explainable reasoning.

Everything in the KUX series points at this vision. A surface that does not reduce uncertainty for a real decision does not belong in the product.

---

## 3. Product Philosophy

### 3.1 Kadarn is an evidence reasoning workspace, not a CRUD interface

> The Dashboard is not a CRUD interface. It is an evidence reasoning workspace. Every screen must help the user understand, validate, enrich, or challenge institutional evidence. The user's primary interaction is with Claims, Evidence, Provenance, and Discovery — not with database records.

This paragraph is binding. If a screen's primary verb is "manage," "edit," or "administer," it is not a Kadarn screen — it is an admin portal wearing Kadarn's clothes. The primary verbs of the Kadarn experience are: **understand, validate, enrich, challenge**.

### 3.2 Kadarn never asserts institutional truth

Kadarn represents the *current state of evidence* for Claims. It does not certify, verify, approve, or rank institutions. This epistemological stance (KEMS-001) is not a legal disclaimer buried in a footer — it is the product's personality. Every surface must communicate confidence as a living, explainable, challengeable state.

### 3.3 Kadarn is institutional memory reconstruction

The emotional core of the product is the moment an institution sees its own history reconstructed from artifacts it barely remembered it had. The experience should feel like an archivist presenting a recovered institutional memory — never like a form demanding data entry.

### 3.4 The human always leads

Kadarn does the work first; the human judges the work. The platform proposes, reconstructs, and suggests. The user accepts, rejects, enriches, defers, and challenges. Kadarn is never the final authority on meaning — the human curator is.

---

## 4. Experience Pillars

The pillars are not principles. They are the attributes every Kadarn experience must exhibit — the qualities a user should be able to name after using any part of the product. Every workspace, flow, and screen can be evaluated against all five.

| Pillar | The experience attribute |
|---|---|
| **Confidence** | The user always knows how strongly the evidence supports what they are seeing — and how strongly it does not. |
| **Clarity** | Every surface can be understood at first read: summary first, one next action, no ambient noise. |
| **Continuity** | Nothing is an isolated snapshot. Every item carries its history, its evolution, and its place in the institutional timeline. |
| **Explainability** | Every value, finding, and recommendation can answer "why?" in one interaction, all the way down to source evidence. |
| **Agency** | The human can always act on what they see — validate, enrich, challenge, or dispute — and their judgment is recorded and visible. |

A design that scores well on the principles but weakens a pillar is not finished. Pillar evaluation is part of every KUX design review.

---

## 5. Experience Principles

Each principle states the rule, why it exists, what it implies, and the anti-pattern it forbids.

### P1 — Kadarn works first

**Rule.** The platform reconstructs before it asks. No experience may open with an empty form when Kadarn could have produced a draft, a reconstruction, or a suggestion first.

**Why.** The product's differentiation is that institutions and sponsors receive value before they invest effort. Time-to-first-value is a design constraint, not a metric to optimize later.

**Implications.** Cold-start states must show what Kadarn *will* do and the single action needed to start it. Every workspace opens on what Kadarn has already produced.

**Anti-pattern.** Onboarding wizards that interrogate the user for data Kadarn could discover from artifacts.

### P2 — Every confidence value is explainable

**Rule.** No numeric or qualitative confidence may appear without a navigable explanation reaching the underlying Evidence Nodes. "Why does Kadarn believe this?" must be answerable from every screen, in at most one interaction.

**Why.** KEMS-001 makes Explainable Inference mandatory. An opaque score is not merely bad UX — it is a violation of the evidence model.

**Implications.** Confidence is always displayed with its Claim, its Level, and an entry point into its explanation. Explanations cite Evidence Classes (A–F) by letter and name.

**Anti-pattern.** A dashboard tile that says "87" — or any AI-style score — with no path to the evidence behind it.

### P3 — Uncertainty is explicit and first-class

**Rule.** What Kadarn does not know, cannot support, or holds with low confidence is displayed with the same design dignity as what it holds with high confidence. Gaps, missing evidence, and low-coverage findings are content, not error states.

**Why.** The product's credibility with sponsors depends on honest asymmetry: a platform that admits ignorance is believable when it expresses confidence.

**Implications.** Evidence gaps have their own surfaces, their own language ("Kadarn found no evidence supporting…"), and their own next actions (request, upload, enrich).

**Anti-pattern.** Hiding low-confidence findings to make a profile look complete.

### P4 — Everything has provenance

**Rule.** Every item a user sees — finding, entity, timeline event, capability candidate, narrative sentence — can be traced to its source artifact in one interaction. No orphan information may be rendered.

**Why.** Traceability is the product promise. A single unsourced statement contaminates trust in every sourced one.

**Implications.** Provenance links are part of an item's anatomy, as fundamental as its title. Narrative text carries citations. Derived items point to the items they derive from.

**Anti-pattern.** Summary text that paraphrases evidence without citing it.

### P5 — The user curates; Kadarn drafts

**Rule.** Human interaction is judgment over machine output: accept, reject, enrich, defer, request more evidence, merge, split, archive, challenge. Users are never asked to build from a blank state what Kadarn could draft.

**Why.** Curation is faster, more engaging, and higher quality than data entry — and it produces the validation signal the platform learns from.

**Implications.** Every reviewable item exposes its curation actions in place. Every curation action is recorded, attributable, and visible in history. Nothing the user does mutates evidence silently.

**Anti-pattern.** Editable free-text fields that overwrite machine findings without recording the human judgment as an event.

### P6 — One clear next action

**Rule.** Every session, and every major surface, presents exactly one prioritized next action — with its reason, its expected impact, and a link to the item it concerns. Not zero. Not five.

**Why.** Reviewers facing reconstructed institutional memory can drown in detail. The product's job is to end every session with momentum, not with a to-do list.

**Implications.** Next-action recommendations state their source ("recommended because 3 document classifications are unknown"). Completing the action immediately surfaces the next one.

**Anti-pattern.** A notifications tray of twelve equally-weighted alerts.

### P7 — Summaries first, forensic detail second

**Rule.** Every surface leads with the synthesized view and lets the user descend into detail. Descent is always available; it is never required to understand the summary.

**Why.** The primary users are decision-makers under time pressure. Forensic depth is the product's substance, but summary is its interface.

**Implications.** Progressive disclosure is the default composition model. Detail views inherit context from the summary that opened them — the user never re-orients.

**Anti-pattern.** Landing a reviewer on a raw table of 400 extracted entities.

### P8 — Language is part of the product

**Rule.** The interface speaks the Lexicon. Allowed register: "Kadarn found evidence suggesting…", "This document may support…", "This Claim Candidate requires review…", "This profile is reconstructed from available artifacts…". Forbidden register: "Verified site", "Certified capability", "This site has…", "Trust Score", "Approved by Kadarn", and all terminology retired by ADR-010.

**Why.** Kadarn's language *is* its epistemology. A single "Verified ✓" badge would silently convert an evidence platform into a certification authority — a product Kadarn deliberately is not.

**Implications.** Copy review is a design gate, not an editorial nicety. The forbidden-terms list is machine-checkable and enforced on every user-facing string. Candidate findings are always labeled as candidates or suggested findings.

**Anti-pattern.** Marketing language leaking into product surfaces ("trusted by leading sites").

### P9 — Challenge is a feature, not a complaint channel

**Rule.** Disagreeing with Kadarn is a designed, first-class interaction. Counter Evidence and Right of Response are visible capabilities wherever a Claim or finding is displayed — not support tickets.

**Why.** A platform that asserts evidence states must offer symmetrical means to contest them. The right to respond is what makes displayed confidence legitimate.

**Implications.** Every Claim surface exposes the path to contest it. Contested items visibly carry their contested state. Resolution history is part of the item's story.

**Anti-pattern.** A "report a problem" link as the only recourse against a finding an institution disputes.

### P10 — Review must be fast

**Rule.** The cost of judging one item — read, understand why, decide, act — is a primary design budget. Curation actions are always one interaction away from the item they act on.

**Why.** The validation loop is the engine of the product. If review is slow, evidence goes stale, reviewers disengage, and the platform's freshness promise fails.

**Implications.** Keyboard-speed review flows. Batch judgment where items are genuinely homogeneous. No confirmation dialogs for reversible actions; visible history and undo instead.

**Anti-pattern.** A five-click modal journey to reject one misclassified document.

### P11 — Evidence evolves

**Rule.** No information is ever presented as definitive. Every piece of evidence — and everything derived from it — is displayed with its temporal context: its history, its changes, its current validity, and its evolution.

**Why.** Kadarn revolves around time as much as around evidence. Evidence ages (Temporal Decay is a canonical KEMS-001 concept), institutions change, confidence states move. A platform that freezes evidence into timeless facts misrepresents the very model it is built on — and quietly re-introduces the certification posture that ADR-010 retired.

**Implications.** Every evidence-bearing item can answer: *since when, based on what, still current?* Confidence is displayed as a state that can move, with its trajectory available. Timelines are not a feature of one workspace; temporal navigation is an ambient capability of the product. Stale or decaying evidence is visibly aging, not silently equal to fresh evidence. This principle will shape Timeline, Passport, Discovery, Alerts, Risk, and Portfolio surfaces alike.

**Anti-pattern.** A capability displayed identically whether its supporting evidence is three weeks or three years old.

---

## 6. Interaction Models

### 6.1 The Review Loop

The atomic unit of the Kadarn experience:

1. **Inspect** — the user sees a finding with its summary, confidence, and status.
2. **Understand** — one interaction reveals why: provenance, rationale, supporting evidence, warnings.
3. **Act** — one interaction applies a judgment (accept / reject / enrich / defer / needs-more-evidence / merge / split / archive).
4. **See the consequence** — the item's state changes visibly, the curation history updates, and the next best action refreshes.

Every reviewable surface in Kadarn implements this loop. A surface that shows findings but breaks the loop (no "why", no action in place, no visible consequence) is incomplete.

### 6.2 The Reconstruction Reveal

The experience of first contact with a reconstructed profile follows a fixed dramatic order: recognition before interrogation. The user first sees what Kadarn reconstructed (the recognition moment), then what is uncertain, then what to do next. This ordering — *reconstruction → uncertainty → action* — is invariant across workspaces.

### 6.3 The Challenge Flow

For any displayed Claim or finding: *disagree → attach counter evidence or response → item enters contested state → resolution recorded*. The flow is symmetrical with curation and shares its visibility rules: attributable, historized, never silent.

---

## 7. Consistency Rules

1. **Same evidence, same anatomy.** An evidence-bearing item renders the same anatomical parts everywhere: title, type, confidence with explanation entry, provenance link, temporal context, status, available actions.
2. **Same action, same meaning.** "Accept" means the same judgment in every workspace. Curation vocabulary is fixed by the Curation API's action set and may not be paraphrased per screen.
3. **Same state, same appearance.** A Claim Candidate, a contested Claim, an evidence gap, and a deferred item each have one canonical visual state across the product.
4. **Status is never implied.** Review status, pipeline status, and confidence level are always displayed explicitly, never inferred from position or color alone.
5. **History is never hidden.** Any surface that lets a user change state must let the user see the history of state changes.
6. **The Lexicon prevails.** Where any KUX document, screen copy, or component label conflicts with Lexicon v1.2, the Lexicon wins without discussion.

---

## 8. Decision Framework

When designing any screen, flow, or feature, answer these in order. A "no" on any of them stops the design.

1. **Reasoning test** — Does this surface help the user understand, validate, enrich, or challenge evidence? (If its primary verb is "manage," redesign it.)
2. **Explanation test** — Can every confidence value shown here answer "why does Kadarn believe this?" in one interaction?
3. **Provenance test** — Can every item shown here be traced to a source artifact?
4. **Honesty test** — Does this surface show what Kadarn does *not* know with the same dignity as what it knows?
5. **Temporal test** — Does every item shown here carry its temporal context — since when, still current, how it has evolved?
6. **Language test** — Does every string survive the forbidden-terms list and speak in the candidate/suggesting register?
7. **Momentum test** — Does the user leave this surface knowing the one next thing to do?
8. **Speed test** — Can a reviewer judge an item here within the review-loop budget (understand why + act, each in one interaction)?

Trade-off rule: when principles conflict, honesty (P2, P3, P4, P8, P11) beats speed (P10), and speed beats completeness (P7). Kadarn would rather show less, honestly and fast, than everything, opaquely.

---

## 9. Anti-Pattern Catalog

| Anti-pattern | Violates | Correct form |
|---|---|---|
| Opaque score badges | P2 | Confidence + Level + explanation entry point |
| Empty-form onboarding | P1 | Reconstruction first, single start action |
| "Verified / Certified" language | P8 | Evidence-suggesting register, candidate labels |
| Hidden low-confidence findings | P3 | Gaps and uncertainty as first-class content |
| Unsourced summary prose | P4 | Cited narrative, provenance on every item |
| Silent edits to machine output | P5 | Recorded curation events with attribution |
| Alert trays and task lists as guidance | P6 | Exactly one prioritized next action |
| Raw data tables as landing surfaces | P7 | Summary first, progressive descent |
| "Report a problem" as dispute channel | P9 | First-class counter evidence / right of response |
| Multi-step modal confirmation for reversible acts | P10 | One-interaction actions, visible history |
| Evidence displayed as timeless fact | P11 | Temporal context visible: history, validity, evolution |

---

## 10. Scope of Authority

- This document governs **experience decisions**: what surfaces exist for, how they behave, how they speak.
- It does not govern visual identity (KUX-002), structural organization (KUX-003), shell composition (KUX-004), or navigation (KUX-005) — but each of those documents must demonstrate compliance with the principles herein.
- It does not amend KEMS-001, the ADRs, the Claim Taxonomy, or the Lexicon. Where it appears to, they prevail and this document must be corrected.

---

## 11. The North Star Test

Above every principle, pillar, and framework question sits a single question that every screen, flow, and feature must survive:

> **If this screen disappeared tomorrow, would sponsors and institutions make worse decisions?**

If the answer is "no," the screen probably should not exist — regardless of how well it scores on everything else. Kadarn is designed by value, not by functionality. Features earn their place by reducing uncertainty in real decisions; nothing earns its place by merely existing in a competitor, filling a navigation slot, or displaying data because the data is available.

The North Star Test is the first question of every design review and the last question before anything ships.

---

## 12. Ratification

KUX-001 is ratified when: (a) its principles and pillars are accepted as binding for all subsequent KUX documents, (b) the Decision Framework in §8 is adopted as the review gate for every new user-facing design, and (c) the North Star Test in §11 is adopted as the opening and closing question of every design review.

**Next document:** KUX-002 — Product Design Language.
