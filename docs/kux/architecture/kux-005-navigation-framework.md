# KUX-005 — Navigation Framework: Movement

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-005 |
| Sprint | UX-5 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Ratified — Gate passed: Navigation Approved |
| Depends on | KUX-001, KUX-002, KUX-003 (Information Gravity, normative), KUX-004 (shell anatomy, canonical regions) |
| Governs | How users move through Kadarn; every navigation mechanism in every workspace |
| Explicitly out of scope | Screens (KUX-006+), visual design, components, technology |

---

## 1. Purpose — Movement, not Navigation

Navigation is an implementation. **Movement is the behavior.** This document designs the behavior first and derives the implementation from it.

The central thesis, canonical for the series:

> **Users do not navigate Kadarn. They follow evidence toward a decision.**

A traditional navigation document asks: *"How does the user get from A to B?"* This document answers a different question: **"How does Kadarn accompany the user's reasoning without them ever losing context?"**

The difference is the product. An application is *navigated*: the user carries the burden of knowing where things are, and every transition costs orientation. A reasoning platform *accompanies*: the environment carries the context (KUX-004), the evidence carries the direction (Information Gravity, KUX-003 §8), and the user spends their attention on judgment, not on wayfinding.

---

## 2. The Five Movements

Everything a sponsor does in Kadarn is one of five movements. Every navigation mechanism (§4) exists to serve one or more of them; any mechanism that serves none is removed.

### 2.1 Explore — discover information

- **The user is:** looking without a fixed target — scanning a portfolio, browsing discoveries, following curiosity through evidence.
- **Mental state:** open; forming questions rather than answering them.
- **Gravity direction:** lateral — moving across objects at the same layer.
- **The environment guarantees:** the trail records the path (KUX-004 §8); nothing explored is lost; anything found can become a Focus in one act.
- **Breaks when:** exploring costs commitment — if looking at something changes state, marks it, or buries the way back, exploration dies.

### 2.2 Focus — reduce context to the relevant

- **The user is:** narrowing — from portfolio to shortlist, from institution to capability, from everything to *this*.
- **Mental state:** filtering; deciding what deserves attention.
- **Gravity direction:** inward — same layer, smaller scope.
- **The environment guarantees:** the active scope is always stated (Context Bar, KUX-004 §4); narrowing is always reversible without loss; what was excluded remains one step away.
- **Breaks when:** the user can no longer tell what they are *not* seeing — silent filters are the corruption of Focus (P3 applied to scope).

### 2.3 Explain — descend toward evidence and the why

- **The user is:** asking "why does Kadarn believe this?" and descending the gravity chain: capability → claims → evidence → source.
- **Mental state:** verifying; building or testing trust in a statement.
- **Gravity direction:** downward — the canonical descent (KUX-003 §8).
- **The environment guarantees:** descent from anywhere in one interaction (KUX-001 P2; Right Context Panel, KUX-004 §6); every level offers the level beneath; ascent is lossless (breadcrumbs, KUX-004 §8).
- **Breaks when:** any statement is a dead end — an assertion with no descent path violates the movement and the model (P4).

### 2.4 Compare — put institutions, claims, or capabilities side by side

- **The user is:** weighing alternatives on their evidence — sites against a study, claims against each other, one institution's trajectory against another's.
- **Mental state:** discriminating; looking for the difference that decides.
- **Gravity direction:** parallel — two or more descent paths held simultaneously.
- **The environment guarantees:** comparison is on evidence, never on opaque aggregates (Comparison Surface, KUX-002 §10); every compared difference is itself explainable (each cell of a comparison can Explain); items keep their temporal context — comparing a fresh Passport against a stale one is visibly asymmetric (P11).
- **Breaks when:** comparison flattens into ranking — a single sorted score column is not Compare, it is the retired Trust Score wearing a new name (ADR-010).

This failure mode is elevated to a **Canonical Design Law** of the series — an epistemological rule wearing UX clothes:

> **Compare degenerates into ranking.**
> Every comparison surface must be designed against this decay. The moment differences collapse into one sortable number, Kadarn has silently become a certification authority again.

### 2.5 Decide — record or execute a decision, keeping its traceability

- **The user is:** committing — shortlisting, selecting, rejecting, accepting a claim, closing a risk.
- **Mental state:** resolving; ending an open question.
- **Gravity direction:** upward — the final ascent to the human layer (KUX-003 §8: the top layer is human).
- **The environment guarantees:** the decision affordance states what evidence supports it, what is uncertain, and what is contested *before* the commitment (Decision Surface contract, KUX-002 §10); the decision is recorded with its evidentiary context (KUX-002 §13, recorded outcome); after deciding, the next best action refreshes (P6) — the loop continues.
- **Breaks when:** a decision is executable without its reasoning visible, or recorded without its context — an untraceable decision is a violation of the product's reason to exist.

### 2.6 Movement grammar

Movements chain into reasoning paths:

```
Explore ──▶ Focus ──▶ Explain ──▶ Compare ──▶ Decide
   ▲                                             │
   └──────────── the loop re-enters ◀────────────┘
```

- The canonical feasibility path: *Explore* candidates → *Focus* on a shortlist → *Explain* each candidate's support → *Compare* the finalists → *Decide*. But movements are not a wizard: users enter anywhere, repeat freely, and move backward without penalty.
- **Every transition preserves context.** Moving between movements never resets lens, moment, scope, or selection (KUX-004 §4) — this is the single most important rule in the document.
- **Every movement is interruptible and resumable.** A sponsor who leaves mid-Compare returns to the comparison as they left it (Recents, §4.6; Continuity).

---

## 3. Accompaniment Rules

What "Kadarn accompanies the reasoning" means, made testable:

1. **The user never pays for moving.** No movement costs re-orientation: arrival is always oriented (context stated, trail extended), departure is always returnable.
2. **The environment proposes, the user moves.** At every point, the one next action (P6) suggests the most valuable next movement — "Explain this low-confidence claim", "Compare your two finalists" — with its reason. The user may ignore it freely.
3. **Direction is always legible.** The user can always tell whether they just moved laterally (Explore), inward (Focus), down (Explain), in parallel (Compare), or up (Decide) — the trail and context bar express the motion (KUX-002 §12: motion expresses continuity).
4. **No movement is ever trapped.** Modal dead ends, forced flows, and unreturnable transitions are prohibited. Every state of the product is exitable with context intact.
5. **Reasoning outlives the session.** A path of movements is a unit of work; sessions resume where reasoning stopped, not at a home screen (§4.6).

---

## 4. Navigation as Consequence

The navigation mechanics — the traditional contents of a navigation framework — are now derivable. Each mechanism exists as an implementation of movements, and its rules follow from the movement it serves.

### 4.1 Primary Navigation (serves: Explore)

The Left Navigation (KUX-004 §5) presents the six Information Domains as stable places. It answers "where can I go to ask a kind of question." Rules: stable for years; intent-labeled; Administration subordinate; never expands to compete with the Work Area.

### 4.2 Workspace Navigation (serves: Focus)

Within a workspace, secondary navigation narrows scope: sections of a Passport, views of a Portfolio, facets of a search. Rules: every narrowing is stated in the Context Bar; the Workspace Integrity Rule (KUX-004 §14) bounds what may appear — sections that answer a different question are links into the neighboring workspace, not embedded tabs.

### 4.3 Breadcrumbs (serve: Explain)

Fully defined in KUX-004 §8: the trail records position on the gravity axis with lens context and lossless return. They are the Explain movement's memory.

### 4.4 Deep Links (serve: all movements — entering mid-reasoning)

Every object, at every layer, at every lens, at every moment, is addressable. Rules:

1. A deep link reconstructs *full context* on arrival: object + lens + temporal position + scope — the Context Bar states it exactly as if the user had walked there (KUX-004 §4 contract 1).
2. Links shared between users carry context: a Medical Affairs reviewer receiving a claim link lands in Explain posture on that claim, seeing what the sender saw (subject to access policy) — the Share verb (KUX-002 §11) is "give evidence in context," and deep links are its mechanism.
3. Temporal links are honest: a link to "the Passport as of March" opens time-travel announced (P11), never silently presenting the past as present.

### 4.5 Search (serves: Explore and Focus)

The shell-level Search Model (KUX-004 §9) is the accelerator of the first two movements: question-tolerant, object-aware, scope-stated, explainable interpretation. Landing preserves the search context in the trail. Feasibility Search (KUX-009) is a full workspace built on the same model.

### 4.6 Recents (serve: resuming reasoning)

Recents are not a history of pages — they are **resumable reasoning paths**: "your comparison of three sites for Study ABC", "your review of St. Mary's claims", each restoring movement, scope, lens, and selection. Rules: recents restore state losslessly; they age honestly (a resumed path re-checks for evidence that changed since — P11 — and says so).

### 4.7 Favorites (serve: standing Focus)

A favorite is a persistent declaration of attention: an institution, a portfolio view, a search. Favorites feed Peripheral Awareness (KUX-004 §13) — what the user has marked is what the periphery watches hardest. Rules: favoriting is one interaction; favorites carry evidence anatomy (a favorited institution shows its change signal, not just its name).

### 4.8 Keyboard Movement (serves: all movements at speed)

Keyboard support is movement-shaped, not shortcut-soup: the five movements have first-class keyboard expression — advance/return along the gravity axis, next/previous item in scope, act on selection, open search, jump to recents. Rules: everything reviewable is keyboard-judgeable (P10 — keyboard-speed review); keyboard paths and pointer paths produce identical trails and context.

### 4.9 Notifications as entry points (serve: re-entering with direction)

An alert opened from the Notification Model (KUX-004 §10) lands the user in the movement its content demands — a decay alert lands in Explain on the decayed evidence; a risk alert lands in Focus on the risk. Arrival is oriented like every other movement (rule §3.1).

---

## 5. Reasoning Sessions

The unit of work in Kadarn is not the login session. It is the **Reasoning Session** — a cognitive session, not a technical one:

> **A Reasoning Session is the continuous chain of exploration, explanation, comparison and decision around a specific institutional question.**

A Reasoning Session may last ten minutes, three days, or two weeks. Kadarn remembers where the *reasoning* stopped — not merely where the navigation stopped.

Properties:

1. **Bound to a question.** A session exists around a specific institutional question ("who runs PBMC processing for Study ABC?", "is St. Mary's still solid?"). The question gives the session identity — the same way workspaces have exactly one question (KUX-004 §14), sessions have exactly one inquiry.
2. **Composed of movements.** A session is a recorded path of Explore/Focus/Explain/Compare movements converging toward Decide (§2.6). Its state includes lens, scope, selections, comparisons in progress, and open "why" descents.
3. **Persistent across time.** Days later, the session resumes as reasoning: *"Yesterday — PBMC capability investigation → Evidence changed → Continue reasoning."* Resumption restores the full cognitive state, not a page.
4. **Honest on resume.** Because evidence evolves (P11), a resumed session first reconciles: what changed since the reasoning paused is surfaced *before* the user continues, so no conclusion silently rests on moved ground. This generalizes the Recents aging rule (§4.6) to the whole session.
5. **Terminates in a Decision — or deliberately doesn't.** Sessions end by producing a Decision (with its provenance, §6), by being explicitly parked, or by being abandoned — and the product knows which, because open reasoning is a real cost the sponsor should see.

Reasoning Sessions unify Recents (§4.6 — sessions are what recents actually list), workspace memory (KUX-004 continuity), and Decision context (§6). They are the product's answer to how institutional questions are actually worked: intermittently, by busy people, over days.

## 6. Decision Provenance

Kadarn has Evidence Provenance from its foundations (KUX-001 P4). This document introduces its symmetric twin — **Decision Provenance**:

> Every decision must be able to answer:
>
> ```
> Decision
>    ↓ made by
> this person
>    ↓ using
> these claims
>    ↓ supported by
> this evidence
>    ↓ at this time
> ```

Rules:

1. **Recording is part of Deciding.** The Decide movement (§2.5) is not complete until the decision's provenance chain is captured: actor, claims relied upon, evidence supporting them, confidence states as they stood, and the moment of commitment.
2. **Time-anchored.** The chain preserves the evidence *as of decision time*. Evidence may evolve afterward (P11) — the decision's basis does not retroactively change. "We selected this site based on what we knew then" is reconstructable forever, which is precisely what makes later evidence changes actionable ("the basis of this decision has since weakened" is a Monitoring signal, not an embarrassment).
3. **Explainable like everything else.** A decision is an evidence-bearing item: it has the standard anatomy and supports the Explain movement — anyone with access can descend from the decision to its claims to its evidence (P2 applied to human judgments).
4. **Human-owned.** Decision Provenance records that a human decided (Cognitive Invariant: Decision always belongs to a human) — Kadarn's contribution appears as the claims and evidence used, never as the decider.

Decision Provenance is what will make the Sponsor Workspace more than a viewer: portfolios and studies accumulate not just evidence about institutions, but an auditable history of *judgments* — each one traceable, each one honestly dated.

## 7. Anti-Patterns of Movement

| Anti-pattern | Violates | Correct form |
|---|---|---|
| Teleporting (arrival without context) | §3.1 | Every arrival states object, lens, moment, scope |
| Dead-end statements (no descent available) | Explain | Every assertion offers its "why" (P2, P4) |
| Silent filters | Focus | Active scope always stated; exclusions one step away |
| Ranking disguised as comparison | Compare | Evidence-based, explainable, temporally honest comparison |
| Untraceable commitment | Decide | Decisions record their evidentiary context |
| Forced flows / modal traps | §3.4 | Every state exitable with context intact |
| History-as-recents (page lists) | §4.6 | Resumable reasoning paths with honest aging |
| Navigation that competes with content | KUX-004 §2 | The shell serves the work |

---

## 8. Compliance

- **Against Information Gravity (KUX-003 §8):** the five movements are the gravity axis in motion — Explore/Focus lateral and inward, Explain down, Decide up, Compare in parallel. Normative requirement satisfied: shell and navigation let the user move along the axis as the product's primary motion.
- **Against the Cognitive Invariants (KUX-003 §12):** movement never mutates evidence (moving is free), never detaches a claim from its institution (trails preserve ownership), and Decide always terminates in a human (§2.5).
- **Against the Pillars:** Continuity is this document's spine — context preserved across every transition, reasoning resumable across sessions.
- **Against the North Star Test:** each mechanism in §4 was derived from a movement; none exists because "apps have one."

## 9. Acceptance Criteria (Gate: Navigation Approved — PASSED)

The document must answer — and has answered:

1. What is the difference between navigation and movement? — §1: navigation is implementation; movement is behavior; users follow evidence toward a decision.
2. What movements exist? — §2: Explore, Focus, Explain, Compare, Decide — with guarantees and failure modes each; "Compare degenerates into ranking" elevated to Canonical Design Law (§2.4).
3. How do movements chain? — §2.6: freely, reversibly, context-preserving; the loop re-enters after Decide.
4. What does "accompaniment" mean, testably? — §3: five rules — no orientation cost, proposed next movement, legible direction, no traps, reasoning outlives sessions.
5. How is each classic navigation mechanism derived? — §4: primary nav, workspace nav, breadcrumbs, deep links, search, recents, favorites, keyboard, notification entry — each mapped to the movement it serves, with rules.
6. What is the unit of work? — §5: the Reasoning Session — a cognitive session bound to one institutional question, persistent across days, honest on resume, terminating in a Decision or deliberately parked.
7. How are decisions traceable? — §6: Decision Provenance — made by / using these claims / supported by this evidence / at this time; time-anchored, explainable, human-owned.
8. What is prohibited? — §7: eight movement anti-patterns.

Out-of-scope confirmations: no screens, no wireframes, no components, no visual design, no technology.

**Next document (Sprint UX-6):** KUX-006 — Sponsor Workspace (the complete workspace; the Dashboard is one of its surfaces — the entry door, not the building).
