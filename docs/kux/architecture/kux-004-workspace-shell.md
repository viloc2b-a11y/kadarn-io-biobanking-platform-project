# KUX-004 — Workspace Shell: The Kadarn Operating Environment

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-004 |
| Sprint | UX-4 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Ratified — Gate passed: Workspace Shell Approved |
| Depends on | KUX-001, KUX-002, KUX-003 |
| Governs | The persistent environment every sponsor workspace lives inside: its anatomy, its regions, their responsibilities and contracts |
| Explicitly out of scope | Navigation structure and behavior (KUX-005), individual screens (KUX-006+), wireframes, components, visual design, technology |

---

## 1. The Operating Environment

This document does not describe the structure of a screen. It describes **the environment where a sponsor works for hours** — the thing that is still there when every screen changes.

Kadarn is not a collection of views. It is an operating environment for institutional intelligence: a persistent frame within which content arrives, evolves, and is judged. The shell is to Kadarn what the cockpit is to Mission Control (KUX-002 §5): the instruments are always in the same place, the context is always visible, and the operator never has to rebuild their orientation.

Three commitments define the environment. The first is canonical — it is to KUX-004 what "The Institution is the persistent object" is to KUX-003:

> **The environment persists. The content flows.**

1. **The environment persists; the content flows.** Screens, tabs, and objects change constantly. The shell — orientation, context, cross-cutting objects, the next action — never disappears and never rearranges itself (Pillar: Continuity).
2. **The environment embodies Information Gravity.** The primary motion of the product — up toward decision, down toward explanation (KUX-003 §8) — is a structural property of the shell, not a feature of individual screens.
3. **The environment carries the invariants.** The six Cognitive Invariants (KUX-003 §12) and the four cross-cutting objects (KUX-003 §11 — Evidence, Passport, Claim, Alerts) are guaranteed by the shell so that no individual screen has to re-earn them.

---

## 2. Workspace Anatomy

The environment has six named regions. Names are canonical; later documents refer to them exactly as written here.

```
┌─────────────────────────────────────────────────────────────────┐
│  GLOBAL HEADER          identity · search · alerts · user       │
├─────────────────────────────────────────────────────────────────┤
│  CONTEXT BAR            where am I · which lens · which moment  │
├──────────┬───────────────────────────────────────┬──────────────┤
│          │                                       │              │
│  LEFT    │              WORK AREA                │  RIGHT       │
│  NAV     │        (the stage — content           │  CONTEXT     │
│          │         lives and changes here)       │  PANEL       │
│          │                                       │              │
├──────────┴───────────────────────────────────────┴──────────────┤
│  ACTION BAR             the one next action · contextual verbs  │
└─────────────────────────────────────────────────────────────────┘
```

| Region | Role in one sentence | Persistence |
|---|---|---|
| **Global Header** | Who I am, where I can go, what needs me | Always present, never changes shape |
| **Context Bar** | What I am looking at, through which lens, at which moment | Always present, content reflects context |
| **Left Navigation** | The six Information Domains as places (KUX-003 §5) | Always present (KUX-005 defines its behavior) |
| **Work Area** | The stage where the current surface (KUX-002 §10) performs | Content changes freely; it is the only region that does |
| **Right Context Panel** | The reasoning side: evidence, provenance, curation, explanation | Summoned in place; never navigates the user away |
| **Action Bar** | The one next action, plus the verbs the current object affords | Always present; contents follow the selection |

**The gravity axis.** The anatomy encodes Information Gravity horizontally: the Work Area holds the current layer (a Portfolio, a Passport, a Claim), the Right Context Panel holds the layer *beneath it* (its evidence, its explanation), and the Action Bar holds the movement *upward* (the judgment or decision the layer affords). Descending never means leaving; ascending never means losing the trail.

**The competition rule.** Only the Work Area may hold primary attention (KUX-002 §7). Every other region is structurally subordinate — the shell serves the work; it is never the show.

---

## 3. Global Header

The header answers three questions permanently: *who am I operating as, how do I reach anything, what needs my attention.*

Contents (semantic, not visual):

- **Identity & organization** — the sponsor org and the user, including role context (KUX-003 §2 minds).
- **Global search entry** — the single entry point to the Search Model (§9), always one interaction away.
- **Alerts entry** — the single entry point to the Notification Model (§10). One entry point, not scattered badges (*Calm*).
- **User & session** — profile, preferences, sign-out.

Contracts:

1. The header never carries content, metrics, or state about the current object — that is the Context Bar's job. The header is the environment's chrome, not its instrumentation.
2. The header is identical in every domain and every workspace. If a workspace "needs a different header," the design is wrong (Continuity).
3. Nothing in the header blinks, counts up, or animates for attention (KUX-002 §12 — motion means state change, and header state rarely changes).

---

## 4. Context Bar

The Context Bar is where KUX-003's Context Model (§10) becomes a permanent structural guarantee: **the user always knows which lens they are looking through.**

It answers, at all times:

- **What am I looking at?** — the current object, named in canonical vocabulary (a Portfolio, an Institution's Passport, a Claim).
- **Through which lens?** — the active context: Portfolio view, Feasibility evaluation against Study X, Monitoring watch. Contextual relationships are visibly contextual ("evaluated against Study X"), never disguised as properties.
- **At which moment?** — the temporal position (P11): "as of now" by default, explicit when viewing the past ("Passport as of 2026-03"). Time travel is announced by the environment, not discoverable in fine print.

Contracts:

1. Context is never implied by navigation history — it is stated. A user who arrives by deep link (KUX-005) sees the same context statement as one who navigated there.
2. Switching lenses re-frames, never re-writes (KUX-003 §10): the Context Bar makes the switch explicit and reversible.
3. The Context Bar hosts the **Breadcrumb Model** (§8) — the trail is part of the context statement.

---

## 5. Left Navigation

Structural role only — behavior, ordering, and interaction belong to KUX-005.

- The Left Navigation presents the **six Information Domains** (KUX-003 §5: Portfolio, Institution, Discovery, Evidence, Monitoring, Administration) as *places the user goes to ask a kind of question* — labeled by intent, not by system function (KUX-003 §6).
- It is a map, not a menu of features. New capabilities appear inside domains; the domain list itself is stable for years. If a feature cannot find its home domain, the feature is questioned before the navigation is (KUX-003 §5 rule 1).
- Administration is present but visually subordinate — the utility room, never the lobby (KUX-002 §10).
- The navigation never expands to compete with the Work Area (§2, competition rule).

---

## 6. Right Context Panel

The Right Context Panel is the shell's answer to the product's most frequent question: **"Why does Kadarn believe this?"** — without navigation cost.

Role:

- When the user selects any evidence-bearing item in the Work Area, the panel presents the layer beneath it (Information Gravity descent): provenance, supporting and contradicting evidence, rationale, warnings, temporal trajectory, current status.
- It hosts **in-place judgment**: the Review Loop's understand-and-act steps (KUX-001 §6.1) happen here — curation actions, challenge entry, validation notes — so that reviewing never requires leaving the surface (P10).
- It is the structural home of the cross-cutting objects when summoned (KUX-003 §11): evidence detail, Passport preview, Claim inspection — one descent away from anywhere.

Contracts:

1. The panel **augments** the Work Area; it never replaces it. Opening the panel never navigates; closing it never loses work-area state.
2. The panel always shows *the selected thing's* reasoning — it is contextual to selection, never a general-purpose sidebar of widgets.
3. If the reasoning is too deep for the panel (full Evidence Graph exploration, full Passport), the panel offers the descent as an explicit transition to the Work Area — the trail records it (§8).

---

## 7. Action Bar

The Action Bar is the shell's guarantee of KUX-001 P6 and the top of the gravity axis: **the movement toward decision is always visible.**

Contents:

- **The one next action** — exactly one, always present, with its reason available (P6). When the context changes, the action changes; it never multiplies.
- **Contextual verbs** — the actions the currently selected object affords, drawn exclusively from the Interaction Language (KUX-002 §11): Review, Accept, Challenge, Investigate, Compare, Monitor, Resolve, Share, Trace, and the curation set.

Contracts:

1. No verb appears that the selected object does not afford in its current lifecycle state (KUX-003 §9). Dead buttons do not exist; unavailable actions are absent, not disabled decoration.
2. Destructive or irreversible actions are rare by design (evidence is append-only); where they exist, the bar demands explicit confirmation — everything else is one interaction (P10).
3. The Action Bar never hosts navigation. Going somewhere is not an action on an object.

---

## 8. Breadcrumb Model

Breadcrumbs in Kadarn do not record folder paths. **They record the user's position on the Information Gravity axis** (KUX-003 §8).

```
Portfolio › St. Mary's Hospital (Passport) › PBMC Processing (Capability) › Claim › Evidence
```

Semantics:

- Each crumb is a *layer*, not a page. Moving left ascends toward synthesis; the current position is the deepest layer descended to.
- Contextual lenses are part of the trail when active: `Study ABC (Feasibility) › Candidates › St. Mary's (Passport) › …` — the trail preserves *why* the user is here, not just where.
- The trail is faithful to descent, not to click history: side-steps (opening the context panel) do not pollute it; explicit descents do extend it.
- Every crumb is a return point that restores full context (lens, moment, selection) — ascending is lossless (Continuity).

---

## 9. Search Model

Shell-level model only — the differentiated Feasibility Search is KUX-009's subject.

Search in Kadarn is **an entry into reasoning, not a text-match utility**. The model:

- **One global entry** (from the Global Header, and by keyboard from anywhere — KUX-005 details the mechanics).
- **Object-aware results.** Results are canonical entities (Institutions, Claims, Evidence, Documents, Portfolios, Studies), each presented with its evidence anatomy — type, confidence, temporal context — never as bare text links (KUX-002 §3: density never deletes anatomy).
- **Question-tolerant.** The model accepts intent phrasing ("sites with PBMC processing in Spain") and decomposes it against evidenced capabilities — surfacing *how* the query was interpreted, so the interpretation itself is explainable (P2 applies to search too).
- **Scoped by context, expandable to global.** Search defaults to the current context (this Portfolio, this Passport) with the global scope one step away — and the active scope always stated (§4, context is never implied).
- **Landing rule.** A search result opens the object *with the search context in the trail* (§8) — arrival is oriented, never a teleport (KUX-002 §12, continuity of motion).

---

## 10. Notification Model

Notifications are the shell-level expression of Alerts (KUX-003 §3) — change that travels to the user (P11). The model is governed by one sentence: **every notification carries its evidence and earns its interruption.**

Rules:

1. **One stream, one entry point** (§3). There are no per-feature notification silos.
2. **Every notification is an Alert in the KUX-003 sense**: it states what changed, shows the evidence that moved, and links to the affected object with context (KUX-002 §14, question 3). A notification that cannot do this is not sent.
3. **Priority is evidentiary, not emotional.** Ranking follows decision impact — evidence decay on a selected site outranks a new document on a watched one. No "urgent!" styling divorced from evidentiary weight (Evidence Gravity applies to interruptions).
4. **Grouping is by object, then by change type** — ten changes to one institution are one story, not ten entries (*Calm*; KUX-001 P6's spirit: no equally-weighted alert trays).
5. **Silence is designed.** "Nothing meaningful changed" is a legitimate, honest state of the notification surface (KUX-002 §12 — stillness is a statement).
6. Delivery channels (in-app, email, digest, subscriptions) are KUX-012's subject; this model constrains all of them: no channel may deliver a notification that violates rules 2–5.

---

## 11. Workspace States

The environment itself has states. Each is designed, honest, and visually owned by the shell — no surface improvises them.

| State | The environment says | Rules |
|---|---|---|
| **Cold start** | "Kadarn is ready to reconstruct — here is what it will do and the one action to begin" | Never an empty dashboard; P1 (Kadarn works first) applies to the first minute of the product |
| **Reconstructing** | "Kadarn is working — here is the honest pipeline state" | Progress is truthful (KUX-002 §10, Discovery Surface: never fake progress); partial results appear as they genuinely exist |
| **Active** | Normal operation: content, context, one next action | The default described throughout this document |
| **Reviewing** | "You are judging — the loop is open" | The Right Context Panel and Action Bar are in review posture; distractions recede (P10) |
| **Quiet** | "Nothing meaningful changed" | A designed state, not an absence; stillness asserts monitored stability (§10 rule 5) |
| **Degraded / stale** | "Some evidence here may be outdated or a source is unavailable" | Staleness is declared by the environment, never discovered by the user (P3, P11); what is affected is named |
| **Error** | "This failed — here is what, and what remains trustworthy" | Errors are scoped: one failed surface never poisons the environment's credibility; recovery is the one next action |

State transitions follow the Motion Philosophy (KUX-002 §12): the environment moves only when its state changes, and the movement shows what changed.

---

## 12. Workspace Rhythm

Every workspace has a rhythm — the tempo at which its user thinks. The shell does not impose one pace on all work; it adapts its posture to the rhythm of the workspace on stage.

| Workspace | Rhythm | The mind at work |
|---|---|---|
| Portfolio | **Slow · analytical** | Scanning a population, forming judgments over minutes |
| Passport | **Deep · explanatory** | Descending through evidence, building understanding |
| Search / Feasibility | **Fast · exploratory** | Iterating queries, discarding candidates in seconds |
| Discovery | **Attentive · progressive** | Watching reconstruction unfold, reviewing as it lands |
| Risk / Monitoring | **Reactive · urgent when warranted** | Waiting calmly; acting decisively when evidence moves |
| Administration | **Infrequent · procedural** | Configuring and leaving |

Rules:

1. **Rhythm is a design budget.** Interaction design (KUX-006+) allocates per rhythm: fast workspaces minimize per-item cost (P10); deep workspaces invest in explanation richness (P2); slow workspaces favor synthesis stability over live churn.
2. **The shell keeps the beat.** Action Bar, Context Panel, and notification posture follow the active rhythm — review posture in deep work, low-interruption posture in analytical work, heightened change-visibility in reactive work.
3. **Rhythms do not leak.** A fast exploratory surface never injects urgency into a slow analytical one; urgency travels only through the Notification Model (§10) with evidentiary priority.

## 13. Peripheral Awareness

A signature concept of the environment: **the user does not need to open ten panels to know whether something important changed. The environment maintains peripheral awareness on their behalf.**

What the periphery carries, permanently and quietly:

- recent changes to what the user watches
- new evidence arriving
- growing risk
- degradation and staleness
- reconstruction and platform activity

Rules:

1. **Always visible, never invasive.** Peripheral signals are perceivable without interaction and ignorable without cost. They inform; they do not interrupt — interruption is the Notification Model's job (§10), with its evidentiary bar.
2. **Evidence Gravity governs the periphery.** What earns peripheral presence is decided by decision impact (KUX-002 §8), not by feature enthusiasm. Most things earn nothing.
3. **The periphery is calm by construction.** It never blinks, counts, or animates for attention (KUX-002 §12). Its resting state is the Quiet state (§11): a calm periphery *is* the message "all is well."
4. **The periphery is truthful.** If awareness is degraded (a source down, evidence stale), the periphery says so — silence must always be meaningful, never accidental (P3, P11).

Peripheral Awareness is the shell-level expression of Operational Presence: Kadarn is visibly on watch even when the user is focused elsewhere.

## 14. The Workspace Integrity Rule

> **Every Workspace answers exactly one question. If it tries to answer two, it must be split.**

| Workspace | Its one question |
|---|---|
| Portfolio | "What is happening across my institutions?" |
| Passport | "Who is this institution?" |
| Search / Feasibility | "Who satisfies this need?" |
| Discovery | "What is Kadarn finding?" |
| Risk | "What requires attention?" |
| Monitoring | "What changed?" |

This rule is the structural defense against the "super dashboard" — the entropy by which every workspace slowly accretes every feature. Enforcement:

1. Every workspace specification (KUX-006 onward) opens by declaring its one question; the gate review checks every section of the spec against it.
2. Content that answers a *different* question is linked, not embedded: the workspace points into the neighboring workspace (through Movement, KUX-005) rather than absorbing it.
3. The Workspace Integrity Rule operates alongside the North Star Test (KUX-001 §11): North Star decides whether a surface should exist; Integrity decides whether it is one surface or two.

## 15. Compliance

**Against the Cognitive Invariants (KUX-003 §12):** the shell guarantees Evidence always reachable with provenance (Right Context Panel), the Passport always one step from any institution mention (cross-cutting presence), context-dependence always visible (Context Bar), and the Decision always human (Action Bar affords judgment; it never auto-decides).

**Against the Pillars (KUX-001 §4):** Confidence (context + panel always show support), Clarity (competition rule; one next action), Continuity (persistent anatomy; lossless trail), Explainability (descent from anywhere), Agency (verbs in place, judgment recorded).

**Against the North Star Test:** the shell itself passes — without this environment, every screen re-invents orientation, context, explanation access, and action placement, and decisions get worse. Individual regions were each tested: none exists for decoration.

## 16. Acceptance Criteria (Gate: Workspace Shell Approved — PASSED)

The document must answer — and has answered:

1. What are the named regions and their single responsibilities? — §2 (six regions, canonical names).
2. What is persistent and what flows? — §2: only the Work Area changes freely. Canonical phrase: "The environment persists. The content flows." (§1).
3. Where does the user's context live? — §4: stated, never implied; lens and moment always visible.
4. How is "why does Kadarn believe this?" answered without navigating? — §6.
5. Where is the one next action? — §7: always in the Action Bar, always exactly one.
6. What do breadcrumbs record? — §8: position on the gravity axis, with lens context, lossless return.
7. What is search? — §9: an explainable entry into reasoning over canonical objects.
8. What may interrupt the user? — §10: only evidence-carrying, decision-relevant, grouped change.
9. What states can the environment be in? — §11: seven designed states including honest quiet, staleness, and failure.
10. At what tempo does each workspace think? — §12: rhythms as design budgets; the shell keeps the beat; rhythms do not leak.
11. How does the user know something changed without opening panels? — §13: Peripheral Awareness — always visible, never invasive, calm by construction, truthful.
12. What keeps workspaces from becoming super dashboards? — §14: the Workspace Integrity Rule — one workspace, one question.
13. Does the shell structurally honor Information Gravity and the invariants? — §2 (gravity axis), §15.

Out-of-scope confirmations: no navigation behavior (KUX-005), no screens, no wireframes, no components, no visual design, no technology.

**Next document (Sprint UX-5):** KUX-005 — Navigation Framework.
