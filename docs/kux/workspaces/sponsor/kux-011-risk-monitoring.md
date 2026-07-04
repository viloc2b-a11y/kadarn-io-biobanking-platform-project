# KUX-011 — Risk Monitoring Workspace

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-011 |
| Sprint | UX-11 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Ratified — Gate passed: Risk Workspace Approved |
| Kind | **Product specification** |
| Depends on | KUX-001 – KUX-010 (all ratified/frozen); KEMS-001; Lexicon v1.2 |
| Governs | The Risk Monitoring workspace: risk categories, decay and contradiction monitoring, alert prioritization, risk timelines, monitoring cycles, and risk decisions |
| Explicitly out of scope | Notification delivery channels (KUX-012), opportunity origination (KUX-010), feasibility matching (KUX-009), wireframes, visual design, components, technology |

---

## 1. The One Question — and the Commercial Problem

> **"What requires attention now, and why?"**

Both halves are binding. *Now* — this workspace is about the present state of threat, not archives. *Why* — nothing may demand attention without its generating evidence attached.

**The commercial problem.** A sponsor's site decisions are made on evidence that was true at decision time — and then the world keeps moving. Certifications expire, equipment changes hands, counter-evidence arrives, key documents age past their decay horizons. Today sponsors discover this movement from the site itself, mid-study, when the cost is maximal — or from a periodic re-assessment that arrives months late. Clinical Operations' defining fear (KUX-003 §2.5): *finding out about a site problem from the site, not from Kadarn.* This workspace exists so that fear never materializes: it is the standing watch over every decision's evidentiary basis and every watched institution's knowledge state.

**Rhythm:** reactive · urgent when warranted (KUX-004 §12) — calm by default, decisive when evidence moves. **Surface type:** Monitoring. **Primary minds:** Clinical Operations first; Portfolio Manager and the Sponsor org frame second.

---

## 2. Workspace Purpose and Foundational Rule

The workspace's foundational rule, a ratified **Canonical Product Law** (constitutional for the KUX series):

> **Risk is a state of evidence, not a property of the institution.**

A Risk in Kadarn (KUX-003 §3) is a *derived condition*: evidence decaying, missing, or contradicted in a way that threatens a decision. It describes what Kadarn *knows* and what that knowledge supports — never the institution's character, quality, or reliability. The parallel with Stability Indicators (KUX-007 §9) is exact: both are states of knowledge. Consequences:

1. There is no "risky site" label, list, or filter — only *conditions* affecting evidence about sites (P8; ADR-010).
2. Every risk carries its generating evidence, inseparably. A risk that cannot show its evidence may not be displayed (Passport Integrity discipline, KUX-008 §2.3, applied to risk).
3. Risks resolve when the evidence state resolves — not when someone marks them "handled" without the evidence changing or the acceptance being recorded as a judgment (§10).

---

## 3. Primary Decisions

Per the organizing principle (KUX-006 §0): the workspace is specified by its decisions.

| Decision | Taken when | Evidence shown before commitment | Recorded as |
|---|---|---|---|
| **Mitigate** | The condition can be addressed | The generating evidence + available mitigations (request refresh, trigger re-discovery, open resolution with the institution) | Risk decision with provenance; opens tracked mitigation items |
| **Accept** | The sponsor knowingly proceeds despite the condition | The full condition + what decisions it touches | An explicit, attributed, time-anchored acceptance — visible on every surface the risk touches |
| **Escalate** | The condition exceeds the operator's authority or threatens materially | Condition + affected decisions + Decision Ledger anchors | Escalation with recipients and basis; the receiving reasoning starts oriented |
| **Re-decide** | A decision's basis has weakened past tolerance | The Decision Anchor (the Passport as it was) vs. the Passport now — a diff of knowledge | A new Reasoning Session opened from the old decision's provenance |
| **Dismiss** | The condition is genuinely not relevant | The condition + why it fired | A recorded judgment with reason; the risk returns only on material evidence change, and says so |

Rules: every decision follows the Decision Surface contract (KUX-002 §10) and lands in the Decision Ledger (KUX-006 §8). Acceptance is never silent, never default, and never expires silently — accepted risks re-surface if their evidence deteriorates further ("accepted under conditions that have since changed").

---

## 4. Risk Categories

The closed v1 catalog — new categories require amending this section. Categories are categorical, never scored (Aggregate evidence, never judgment).

| Category | The condition | Generating evidence |
|---|---|---|
| **Evidence Decay** | A depended-upon claim's evidence has aged past (or approaches) its decay horizon | The aging Evidence Nodes and the claim's decay period (Claim Taxonomy) |
| **Contradiction** | Counter evidence has arrived against a depended-upon claim | The Counter Evidence node(s) and the contested claim |
| **Evidence Gap** | A required or relied-upon claim has lost support, or a known gap now touches an active dependency | The gap (KUX-002 §9.6: absence is drawable) and what depends on it |
| **Decision-Basis Erosion** | A recorded decision's evidentiary basis has weakened since decision time | The Decision Anchor diff: then vs. now (KUX-008 §4.3) |
| **Operational Change** | Evidenced change at the institution material to a dependency: identity, organizational, capability, or timeline events | The evidencing documents/events |
| **Monitoring Degradation** | Kadarn's own field of view has degraded: a source down, discovery stale, extraction failing | The affected sources and the evidence whose currency is now unknown |

Monitoring Degradation is the meta-category that keeps the workspace honest: when Kadarn cannot see, it says so as a risk — silence must be meaningful, never accidental (KUX-004 §13 rule 4).

---

## 5. Evidence Decay

The operational treatment of Temporal Decay (KEMS-001; P11):

1. **Decay is continuous and visible before it is critical.** Every depended-upon claim shows its decay trajectory; the workspace surfaces *approaching* horizons ("cold-chain evidence enters its decay window in 6 weeks"), not just breaches — attention with lead time is the product's value.
2. **Decay horizons come from the Claim Taxonomy**, per claim type. User-configured tightening is permitted (a sponsor may watch more conservatively); loosening below taxonomy defaults is not.
3. **Dependency-scoped.** Decay fires as a risk only where something depends on the claim: an active study, a recorded decision, a portfolio watch, an open reasoning session. Undepended decay remains Passport-ambient aging (KUX-008 §4.4) — the Risk workspace is not a corpus-wide expiry list.
4. **Decay resolution is evidential**: refreshed evidence resolves the risk; nothing else does (an acceptance records tolerance, not resolution).

## 6. Counter-Evidence Monitoring

1. Contradiction against any depended-upon claim fires immediately — arrival of counter evidence is the highest-signal event the watch produces.
2. The risk presents the tension, not a verdict (KUX-002 §9.4): claim, counter evidence, both provenances, side by side. The workspace never pre-judges the dispute.
3. Resolution paths are the evidence machinery: Right of Response, curation, further evidence — tracked on the risk's timeline (§8). A transparently handled contradiction strengthens the Passport (Canonical Product Law, KUX-008), and this workspace is where "transparently handled" happens on time.
4. Contested-state propagation: while unresolved, every surface showing the affected claim shows its contested state (KUX-001 P9) — the risk workspace is the tracker, not the only place the truth appears.

## 7. Operational Changes

Evidenced institutional change material to dependencies: organizational restructuring, site relationships, capability-relevant equipment or personnel events, identity changes (KUX-008 §3.1), timeline events. Rules: only *evidenced* change fires (rumor has no representation in Kadarn); materiality is dependency-scoped (§5.3 logic); each change risk links the evidencing artifacts and the dependencies it touches.

---

## 8. Alert Prioritization and Risk Timelines

**Prioritization** inherits the Attention Queue discipline (KUX-007 §5) — its rules restated for risk without redefinition:

1. **Conditions are prioritized; institutions are never ranked.** Ordering is by decision impact: threatens an active study's standing decision → threatens an open reasoning/selection in progress → threatens a portfolio watch → informational. Within a tier, by time-to-impact (a horizon 2 weeks out before one 6 months out).
2. Priority is evidentiary, never emotional (KUX-004 §10.3): no severity theater, no color-coded panic, no urgency without cited evidence.
3. Exactly one next action at workspace level (P6): the top condition, with reason. The rest of the queue visible, subordinate.
4. Every aggregate explorable: "3 risks affect Study ABC" opens into the three.

**Risk Timelines.** Every risk is a temporal object with a visible lifecycle:

```
originated → seen → in mitigation | accepted | escalated → resolved | expired → historized
```

The risk's timeline records: the originating evidence event, every state change with actor, evidence movements during its life (the contradiction deepened; the refresh arrived), and its resolution basis. Risk history is never deleted (Contract clause 5) — resolved risks remain queryable on the institution's Passport history and the affected decision's Ledger entry. At portfolio scale, the Risk Distribution view (KUX-007 §4) is the population lens over these same objects — one source of truth, two altitudes.

---

## 9. Monitoring Cycles

This workspace operationalizes the Watch Cycle (KUX-006 §4.4):

1. **Ambient watch (continuous):** origination runs against every dependency; Peripheral Awareness (KUX-004 §13) carries the low-attention signal; the Notification Model (KUX-004 §10, delivery in KUX-012) interrupts only what earns it.
2. **Response loop (on alert):** alert → land in Explain posture on the generating evidence (KUX-005 §4.9) → decide (§3) → the queue refreshes. Designed for minutes, at review speed (P10).
3. **Standing review (periodic):** open risks, aging acceptances, mitigation progress, monitoring-degradation status — a resumable Reasoning Session ("Q3 risk review") with reconciliation on resume (KUX-005 §5.4).
4. **Decision watch (continuous):** every Decision Ledger entry is monitored against its anchor — the loop that closes KUX-006 §8: decisions feed monitoring; monitoring re-opens reasoning.

## 10. Decision Support

What the workspace guarantees at the moment of a risk decision:

1. **The full condition, explained**: generating evidence, affected dependencies, the condition's own history, and its projected trajectory if unaddressed (stated evidentially: "this evidence reaches its decay horizon on <date>", never speculative drama).
2. **The blast radius, explorable**: which decisions, studies, portfolios, and open sessions the condition touches — each navigable (every aggregate explorable).
3. **The alternatives, honestly**: where relevant (decay displacement, KUX-010 §2), evidenced alternatives are available for Compare — under full Compare rules, never as a ranked replacement list.
4. **The decision recorded**: per §3 — attributed, time-anchored, provenance-carrying, visible wherever the risk is visible.

---

## 11. Monitoring Memory

The fourth memory of the system — alongside Reasoning Sessions (inquiry-scoped), the Decision Ledger (decision-scoped), and Portfolio Memory (observation-scoped): **Monitoring Memory, vigilance-scoped.**

The workspace remembers, per user and per scope:

- **which risks were already reviewed** — and as of which evidence state, so a re-review starts from the delta, not from zero;
- **which conditions were accepted** — the standing acceptance registry: every tolerance, by whom, on what basis, and what has moved since (§3: acceptances re-surface on deterioration);
- **which remain pending** — open conditions with their age and mitigation progress, so nothing silently rots in the queue;
- **which reappeared** — conditions that resolved and returned, shown *as returns* with their prior episode attached ("this contradiction previously fired in March; resolved by certificate; new counter evidence differs").

Purpose discipline: Monitoring Memory exists **for continuity, never for concealment** — it changes how conditions are presented (as deltas, returns, and standing tolerances), never whether they are presented (Contract clause: no silent risk).

## 12. Risk Narrative

Change is delivered as narrative, not counters — the discipline of KUX-007 §8 applied to vigilance. Instead of `12 alerts`:

> *"Since your last review, one decision requires reconsideration because supporting evidence has weakened. Two previously accepted conditions remain stable. One contradiction from March has reappeared with new counter evidence."*

Rules:

1. Every sentence cites — statements open into the conditions, evidence, and decisions behind them (every aggregate explorable).
2. The narrative is decision-ranked: reconsiderations first, active mitigations next, stable tolerances last — honest reassurance is content (P3).
3. It is built on Monitoring Memory (§11): the narrative's tense is *since your last review*, which only memory makes possible.
4. It never editorializes institutional character (§2: risk is a state of evidence) — the narrative reports evidence conditions and their decision relevance, nothing else.

## 13. Workspace Walkthrough (normative)

**Tuesday 08:50.** A Clinical Operations lead opens Kadarn. The Dashboard periphery shows one risk signal; the Risk workspace's one next action reads: *"Counter evidence arrived against St. Mary's cold-chain claim — Study ABC's site selection depends on it."* Reason and links attached (KUX-010 §3 field discipline applies to alerts). They land in Explain posture on the tension: the claim, its Class B supporting evidence, the new counter evidence (a failed audit finding, Class A, three days old), both provenances. The contested state already shows on the Passport and Study ABC's ledger entry. They open the blast radius: one recorded decision (Study ABC site selection, anchored eight months ago), one active portfolio watch. From the Decision Anchor, the then-vs-now diff shows the basis change precisely. They **Escalate** to the study lead with the condition and basis — recorded, oriented arrival for the recipient. The study lead **Mitigates**: opens a Right-of-Response window for the institution and requests the current audit certificate — tracked mitigation items on the risk's timeline. Three weeks later the refreshed certificate arrives via Discovery; the contradiction resolves; the risk closes with its resolution basis; the Passport's contested episode historizes — visible, credibility-strengthening, done on time. The queue's next condition surfaces.

## 14. Empty and Failure States

**Empty (Quiet)** — the designed good state, informative per KUX-010 §7: *"Nothing requires attention. Kadarn is watching 12 recorded decisions, 47 institutions, and 3 open sessions. All evidence within horizons."* The watch statement makes quiet meaningful; the sponsor should spend most of their time here, and the state must reduce anxiety, not create checking-compulsion (KUX-004 §11).

**Cold start** — no dependencies yet: "Risk monitoring activates when there is something to protect — record a decision, build a portfolio, or open a study profile."

**Failure states:**

- **Monitoring Degradation (§4)** — the workspace's own blindness is a first-class risk with the same anatomy: which sources, since when, what evidence's currency is now unknown, what dependencies are affected. Never a silent gap in coverage.
- **Alert delivery failure** — if the delivery layer (KUX-012) cannot confirm delivery of a decision-impacting alert, the condition remains at queue top with its undelivered status visible.
- **Scoped error** — a failed view never poisons the workspace's credibility; what remains trustworthy is stated (KUX-004 §11 error state).

## 15. Risk Workspace Contract

Extending the Sponsor Workspace Contract (KUX-006 §5 — all six clauses inherited), this workspace adds four clauses:

> 1. **No risk without evidence.** Every displayed risk carries its generating evidence, inseparably and explorably.
> 2. **No silent risk.** A condition meeting the dependency-scoped criteria is surfaced or its non-surfacing is a Monitoring Degradation risk — the watch never has quiet gaps it doesn't declare.
> 3. **No unattributed tolerance.** Every acceptance is an explicit, attributed, time-anchored judgment that re-surfaces on further deterioration.
> 4. **No institutional stigma.** Risk language describes evidence states, never institutional character; resolved risks leave history, not labels.

## 16. Compliance and Acceptance Gates

**Canonical Laws honored:** conditions ordered, institutions never ranked; aggregates are evidence statistics, all explorable; thresholds (decay-watch tightening) belong to the user; contested Passports strengthened by timely transparent handling; risk states never editable — they evolve through evidence and judgment (the Passport law's discipline applied to risk objects).

**The four executable-spec questions:**

1. *Real decision?* — Yes: mitigate/accept/escalate/re-decide/dismiss (§3), each specified with what is shown and recorded — including re-decide, the decision most products cannot even represent.
2. *Less time to decision?* — Yes: lead-time surfacing of decay (§5.1), blast-radius in one interaction (§10.2), alert-to-decision loop designed for minutes (§9.2), quiet state eliminating reassurance-hunting.
3. *Evidence visible without overload?* — Yes: dependency-scoping keeps the queue relevant (§5.3), impact-tiered ordering, one next action, periphery for the rest.
4. *Implementable without inventing behavior?* — Yes: closed category catalog (§4), decision table (§3), prioritization tiers and tie-breaking (§8.1), risk lifecycle states (§8), cycle definitions (§9), contract clauses (§13).

### Acceptance Criteria (Gate: Risk Workspace Approved — PASSED)

1. What is the one question and the commercial problem? — §1: the standing watch; ClinOps' fear designed against.
2. What is a risk? — §2: a state of evidence, not a property of the institution (ratified Canonical Product Law).
3. What is decided here? — §3: five decisions with full mechanics.
4. What categories exist? — §4: closed six-category catalog including Monitoring Degradation.
5. How do decay, contradiction, and operational change fire? — §5–§7: dependency-scoped, evidential, lead-time-oriented.
6. How is attention ordered and how do risks live? — §8: impact tiers + time-to-impact; the risk lifecycle and its timeline.
7. How does monitoring run? — §9: four cycles closing the Decision Ledger loop.
8. What does the workspace remember? — §11: Monitoring Memory — reviewed, accepted, pending, reappeared; continuity, never concealment.
9. How is change delivered? — §12: Risk Narrative — cited, decision-ranked, built on memory, never character-editorializing.
10. What does the sponsor see at the moment of deciding? — §10: condition, blast radius, alternatives, recording.
11. What do empty and failure states look like? — §14: informative quiet; the workspace declares its own blindness.
12. What does the workspace additionally guarantee? — §15: four added contract clauses.

**Next document (Sprint UX-12):** KUX-012 — Alerts & Notifications.
