# KUX-006 — Sponsor Workspace

> **The institutional intelligence workspace for evidence-based sponsor decisions.**

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-006 |
| Sprint | UX-6 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Ratified — Gate passed: Sponsor Workspace Approved |
| Kind | **Product specification** (not a UX guideline) |
| Depends on | KUX-001 through KUX-005 (all ratified; all binding) |
| Governs | The complete sponsor-facing workspace: its purpose, users, decisions, surfaces, and work cycles. Surface-level specifications follow in KUX-007 – KUX-012 |
| Explicitly out of scope | Wireframes, visual design, components, technology; deep specification of each surface (delegated to KUX-007+) |

---

## 0. Organizing Principle

The canonical phrase of this specification and of every workspace document that follows:

> **Kadarn is organized around decisions, not around screens.**

Screens are consequences. The architecture of the sponsor experience derives from the decisions sponsors must make (§2), the cycles in which they make them (§4), and the traceability those decisions deserve (§8, Decision Ledger).

## 1. The One Question

Per the Workspace Integrity Rule (KUX-004 §14), this workspace exists to answer exactly one question:

> **"Which institutions should carry our clinical programs — and on what evidence?"**

Everything in the Sponsor Workspace serves that question: finding institutions (Feasibility, Discovery), understanding them (Passport), holding them together (Portfolio), watching them (Risk, Monitoring), and committing to them (Decisions with provenance). Any surface that does not contribute to answering it fails the North Star Test here, whatever its other merits.

The workspace is the environment where the sponsor's **Reasoning Sessions** (KUX-005 §5) live — opened, worked, paused, resumed, and closed into decisions with **Decision Provenance** (KUX-005 §6).

---

## 2. Users and Their Decisions

The workspace serves the five minds of KUX-003 §2. A product specification names the decisions, not just the users. Every decision below is recorded with Decision Provenance when taken.

| Mind | Decisions taken in this workspace | Evidence that feeds them |
|---|---|---|
| **Sponsor (org frame)** | Adopt/retire institutions from the working set; approve study site strategies | Portfolio evidence health; decision histories |
| **Portfolio Manager** | Add/remove institutions from Portfolios; trigger re-discovery; request evidence refresh | Population-level coverage, freshness, change signals |
| **Feasibility Lead** | Include/exclude candidates in a shortlist; select sites for a study; request missing evidence from candidates | Capability support vs. study requirements; gaps; confidence thresholds |
| **Medical Affairs** | Accept/challenge Claims; endorse capability findings; resolve contested items | Claims, Evidence Classes, Counter Evidence, Right of Response |
| **Clinical Operations** | Respond to risks (mitigate/accept/escalate); act on decay and change alerts | Evidence decay, contradiction arrivals, operational signals |

Decision rules (binding on all surfaces):

1. Every decision affordance shows its evidence before the commitment (Decision Surface contract, KUX-002 §10).
2. Every recorded decision is an evidence-bearing item afterwards: explorable, explainable, time-anchored (KUX-005 §6).
3. No decision is ever suggested as made by Kadarn. Kadarn supplies the claims and evidence; the human decides (Cognitive Invariant 6).

---

## 3. The Workspace Map

The Sponsor Workspace is composed of seven surfaces. Each has exactly one question, a surface type (KUX-002 §10), a rhythm (KUX-004 §12), and a dedicated specification.

| Surface | Its one question | Surface type | Rhythm | Spec |
|---|---|---|---|---|
| **Dashboard** | "Where do I stand right now, and what should I do next?" | Monitoring | Calm re-entry | §7 (this document) |
| **Portfolio Intelligence** | "What is happening across my institutions?" | Monitoring + Comparison | Slow · analytical | KUX-007 |
| **Institutional Passport** | "Who is this institution?" | Review + Decision | Deep · explanatory | KUX-008 |
| **Feasibility Search** | "Who satisfies this need?" | Discovery + Comparison | Fast · exploratory | KUX-009 |
| **Opportunity Discovery** | "What matches should I consider that I haven't asked for?" | Discovery | Attentive · progressive | KUX-010 |
| **Risk Monitoring** | "What requires attention?" | Monitoring | Reactive · urgent when warranted | KUX-011 |
| **Notifications** | "What changed that concerns me?" | Monitoring (delivery layer) | Ambient | KUX-012 |

Map rules:

1. **The Dashboard is the entry door, not the building.** It is a re-entry and orientation surface; work happens in the other six. It never absorbs their content (Integrity Rule) — it points into them through Movement.
2. **Surfaces connect through movements, not links-for-links.** Portfolio → Passport is a Focus + Explain descent; Feasibility → Passport is Compare feeding Explain; Risk → Passport is an alert landing in Explain posture (KUX-005 §4.9). Every inter-surface transition preserves context (KUX-005 §2.6).
3. **The cross-cutting objects** (Evidence, Passport, Claim, Alerts — KUX-003 §11) are reachable from all seven surfaces via the Right Context Panel and deep links, exactly as KUX-004 guarantees.

---

## 4. Work Cycles

How a sponsor actually works — recurring cycles, each mapped to movements, surfaces, and session behavior. These cycles are the implementation target: engineering builds *for these loops*, not for isolated page visits.

### 4.1 The Re-entry Cycle (daily, minutes)

*"What happened, and where was I?"*

Dashboard → peripheral scan → open items. Movements: brief Explore. The Dashboard presents: state, change since last visit, open Reasoning Sessions ("Continue reasoning"), and the one next action. Exit: into a session or out of the product — both legitimate (Quiet is a success state, KUX-004 §11).

### 4.2 The Feasibility Cycle (per study, days to weeks)

*"Find the sites for Study X."*

Feasibility Search (Explore) → shortlist (Focus) → Passports of candidates (Explain) → side-by-side finalists (Compare) → site selection (Decide, with provenance). This is the canonical Reasoning Session (KUX-005 §2.6) and the workspace's economic core. The session persists across days; resumption reconciles evidence changes first (KUX-005 §5.4).

### 4.3 The Judgment Cycle (continuous, minutes per item)

*"Is this assertion supported?"*

Passport or review queue → claim inspection (Explain) → accept/challenge/enrich (Decide at claim grain). Runs at review speed (P10) in the Right Context Panel — the Review Loop (KUX-001 §6.1) without leaving the surface.

### 4.4 The Watch Cycle (ambient, continuous)

*"Is anything moving that threatens a decision?"*

Peripheral Awareness (KUX-004 §13) → Risk Monitoring when something earns attention → Explain on the moved evidence → risk response (Decide). Includes Decision Provenance's feedback loop: decisions whose evidentiary basis weakened surface here (KUX-005 §6.2).

### 4.5 The Portfolio Cycle (periodic, hours)

*"Is my population of institutions healthy?"*

Portfolio Intelligence (Explore + Compare over the population) → institutions needing attention (Focus) → Passports (Explain) → composition changes and refresh requests (Decide).

Cycle rules: every cycle ends in a decision, a parked session, or designed quiet — never in ambiguity about whether work remains. Open cycles are visible on the Dashboard (§7).

---

## 5. The Sponsor Workspace Contract

Before any walkthrough or surface: the guarantees this workspace makes, stated as an engineering checklist. Every implementation task, every surface spec (KUX-007+), and every release is verified against these six clauses.

> **Sponsor Workspace Contract**
>
> 1. **Context is never lost.** No transition — between surfaces, movements, sessions, or days — resets lens, moment, scope, or selection. (KUX-004 §4; KUX-005 §2.6)
> 2. **Evidence is always reachable.** From any statement, anywhere, the supporting evidence is one interaction away. (KUX-001 P2, P4; KUX-004 §6)
> 3. **Decisions are always explainable.** Every commitment shows its basis before it is taken and carries its provenance after. (KUX-002 §10; KUX-005 §6)
> 4. **Reasoning is resumable.** Any multi-step work can be paused for days and resumed as reasoning, reconciled against what changed. (KUX-005 §5)
> 5. **Evidence changes never invalidate history.** New evidence reframes; it never rewrites what was known, decided, or recorded at the time. (KUX-001 P11; KUX-005 §6.2)
> 6. **Human judgment is always explicit.** Every acceptance, challenge, and decision is attributable to a person and visible as such. (KUX-001 P5; Cognitive Invariant 6)

A build that violates any clause is not an incomplete implementation of the Sponsor Workspace — it is not the Sponsor Workspace.

## 6. A Complete Reasoning Session (normative walkthrough)

The specification's acid test — the answer to "how does a sponsor work during an entire reasoning session inside Kadarn?" This walkthrough is normative: every step names the mechanism that makes it work.

**Day 1, 09:10.** A Feasibility Lead opens Kadarn. The Dashboard (§7) shows quiet state on their portfolio, one alert (a document arrived at a watched site), and their one next action: *"Define candidate requirements for Study ABC"* — the study was registered yesterday. They start: Feasibility Search opens a new Reasoning Session bound to the question *"Who can run Study ABC?"* (KUX-005 §5.1). They express requirements naturally ("PBMC processing, Spain, oncology experience"); the interpretation is shown and adjustable (KUX-004 §9). Twenty-three candidates. They Focus to eight using evidence filters — the Context Bar states every active filter (KUX-005 §2.2). Lunch. The session parks itself as they leave.

**Day 3, 14:30.** The Dashboard lists the open session: *"Who can run Study ABC? — 8 candidates focused — evidence changed for 1."* They resume; the session first reconciles: one candidate's storage claim gained counter evidence (KUX-005 §5.4). They descend (Explain) into that claim from the Right Context Panel: the counter evidence is a failed calibration record, Class B, two weeks old. They mark the candidate excluded — a decision at shortlist grain, recorded with the counter evidence as basis (Decision Provenance). Three finalists go to Compare: capability support side by side, each cell explainable, one candidate's evidence visibly older (P11 asymmetry, KUX-005 §2.4). No ranking column exists (Canonical Design Law).

**Day 4, 10:00.** Medical Affairs receives a deep link to one finalist's PBMC claim — arriving in Explain posture on exactly what the Feasibility Lead saw (KUX-005 §4.4). They Accept the claim; the judgment is recorded and visible in the claim's history. The Feasibility Lead's session shows the endorsement.

**Day 4, 16:45.** Decide: two sites selected. The Decision Surface shows, before commitment: supporting claims, their confidence states, the one open gap (a pending close-out letter), and the contested history of the excluded candidate. Commitment records the full provenance chain — by whom, using which claims, on which evidence, at this moment. The session closes. The Dashboard's next action refreshes. Months later, when the calibration evidence at one selected site decays, the Watch Cycle raises: *"the basis of this decision has since weakened"* — and a new session begins.

---

## 7. The Dashboard — the first surface

The entry door, specified here because it belongs to the workspace as a whole, not to any sub-workspace.

**One question:** "Where do I stand right now, and what should I do next?"
**Surface type:** Monitoring. **Rhythm:** calm re-entry — designed for the first ninety seconds of a session, not for dwelling.

### 7.1 Regions (semantic, per KUX-004 anatomy)

- **Hero region — the situational answer.** One synthesized statement of state: the portfolio's evidence health, anything requiring attention, or honest quiet ("Nothing meaningful changed since Tuesday"). It follows the Product Grammar (KUX-002 §14) in one glance: what am I looking at (my institutional situation), why it matters, what changed, what next.
- **Open reasoning.** The user's Reasoning Sessions: open, parked, and recently closed — each resumable with honest aging ("evidence changed for 1 candidate"). This region makes the Dashboard the home of continuity, not a report.
- **The one next action.** Exactly one, with reason and linked item (P6). Other pending work exists in Open reasoning and the periphery — nothing competes with the one action.
- **Change feed.** Evidence-carrying changes since last visit (KUX-004 §10 rules apply: grouped by object, evidentiary priority, every entry landing in the right movement). Not an activity log — a change story.
- **Portfolio summary.** The population at a glance: coverage, freshness, attention items — every figure explainable (P2), no aggregate institution scores (KEMS-001).

### 7.2 KPI philosophy

The Dashboard carries **evidence-health indicators, not performance KPIs**: claims coverage, evidence freshness, open gaps, contested items, decisions whose basis moved. Rules: few (the hero region synthesizes; indicators support), every number descends to its evidence in one interaction, no number without its temporal trajectory (P11), and nothing resembling a site score, rating, or rank — ever (ADR-010).

### 7.3 States

Per KUX-004 §11, all seven environment states apply. Two get specific Dashboard behavior:

- **Cold start:** never empty. The Dashboard states what Kadarn will do ("Add institutions or define a study — Kadarn reconstructs the evidence first") with the single starting action (P1).
- **Quiet:** the designed good state. Calm hero statement, periphery at rest, next action may legitimately be "nothing urgent — continue Study ABC reasoning."

---

## 8. The Decision Ledger

A concept, not a feature: **every significant decision leaves a record, and the records connect everything.**

```
Decision
   ↓
Reasoning Session          (the inquiry that produced it — KUX-005 §5)
   ↓
Evidence Snapshot          (what was known, as of decision time — P11)
   ↓
Claims Used                (the assertions relied upon)
   ↓
Decision Provenance        (by whom, using what, when — KUX-005 §6)
   ↓
Decision Outcome           (what was committed: selected, excluded, accepted, escalated)
   ↓
Monitoring                 (the standing watch on the decision's basis — KUX-006 §4.4)
```

The Ledger is where the whole KUX system closes its loop: sessions produce decisions, decisions anchor evidence snapshots, snapshots feed monitoring, and monitoring opens new sessions when a basis weakens. For the sponsor organization, the Ledger is institutional memory of its *own judgment* — the complement to Kadarn's memory of institutions. Surface specifications (KUX-007+) reference the Ledger wherever decisions are taken or reviewed; its dedicated surface treatment belongs to future specification once the workspace surfaces exist.

## 9. Workspace-level Guarantees

Inherited from the architecture and binding on every surface specification (KUX-007 – KUX-012):

1. **Language:** all copy in the candidate/suggesting register; forbidden-terms list enforced (KUX-001 P8; Lexicon).
2. **Anatomy:** every evidence-bearing item shows the standard anatomy — title, type, confidence + explanation entry, provenance, temporal context, status, actions (KUX-001 consistency rule 1).
3. **Movements:** all five available wherever applicable; no dead ends, no traps, no teleports (KUX-005 §7 anti-patterns).
4. **Sessions:** any multi-step reasoning is a Reasoning Session — resumable, honest on resume (KUX-005 §5).
5. **Decisions:** all commitments carry Decision Provenance (KUX-005 §6).
6. **Periphery:** Peripheral Awareness configured by what the user watches — favorites, portfolios, open sessions (KUX-004 §13).
7. **Rhythm:** each surface honors its rhythm; urgency travels only through the Notification Model (KUX-004 §12).

---

## 10. Compliance and Acceptance

**Workspace Integrity:** one question declared (§1); each surface declares its own (§3); the Dashboard points, never absorbs.
**Cognitive Invariants:** checked — the walkthrough (§6) exercises all six without violation.
**Workspace Contract:** declared (§5) as the engineering checklist for every surface and release.

**The four executable-spec questions (README gate for KUX-006+):**

1. *Does it help the sponsor make a real decision?* — Yes: the decision catalog (§2) names them; the Feasibility Cycle (§4.2) is the economic core; §5 shows one taken end-to-end with provenance.
2. *Does it reduce the time to that decision?* — Yes: work cycles eliminate re-orientation (re-entry cycle), sessions eliminate re-work (resume with reconciliation), the one next action eliminates deliberation about where to start (Decision Velocity, KUX-002 §13).
3. *Does it make evidence visible without overloading?* — Yes: hierarchy (state → change → action → reasoning, KUX-003 §7), Evidence Gravity ordering, peripheral awareness instead of panel-hunting, quiet as a designed state.
4. *Could engineering implement without inventing behavior?* — Yes at workspace grain: surfaces, questions, types, rhythms, cycles, session semantics, dashboard regions, and states are specified; per-surface detail is delegated explicitly (§3) to KUX-007 – KUX-012, each of which must meet this same bar for its surface.

### Acceptance Criteria (Gate: Sponsor Workspace Approved — PASSED)

1. What is the workspace's one question? — §1. Organizing principle: Kadarn is organized around decisions, not around screens (§0).
2. Who decides what, on what evidence? — §2, with three binding decision rules.
3. What surfaces exist, each with one question, type, and rhythm? — §3.
4. How does a sponsor actually work? — §4: five work cycles, each ending in decision, parked session, or designed quiet.
5. What does the workspace guarantee, testably? — §5: the six-clause Sponsor Workspace Contract.
6. How does a full reasoning session flow end to end? — §6: normative walkthrough naming the mechanism at every step.
7. What is the Dashboard? — §7: entry door; hero, open reasoning, one action, change feed, portfolio summary; evidence-health KPI philosophy; cold-start and quiet states.
8. How do decisions connect the system? — §8: the Decision Ledger — session → snapshot → claims → provenance → outcome → monitoring.
9. What do all surface specs inherit? — §9: seven workspace-level guarantees.

**Next document (Sprint UX-7):** KUX-007 — Portfolio Intelligence.
