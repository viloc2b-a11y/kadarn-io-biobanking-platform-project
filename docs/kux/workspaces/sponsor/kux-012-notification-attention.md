# KUX-012 — Notification & Attention Workspace

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-012 |
| Sprint | UX-12 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Ratified — Gate passed: Notification & Attention Approved |
| Kind | **Product specification** |
| Depends on | KUX-001 – KUX-011 (all ratified); KUX-004 §10 (Notification Model) and §13 (Peripheral Awareness) are its constitutional inputs |
| Governs | All product communication and attention management: in-app, email, digest, timelines, priority, grouping, subscriptions — across every workspace |
| Explicitly out of scope | What fires conditions (KUX-007 §5, KUX-010 §3, KUX-011 §4 own their origination), wireframes, visual design, components, technology |

---

## 1. The One Question — and the Reframe

> **"What deserves my attention — and when?"**

This document is not about notifications. It is about **attention management** — the discipline that the whole series has been circling: the Attention Queue (KUX-007 §5), Peripheral Awareness (KUX-004 §13), the Quiet state (KUX-004 §11), Evidence Gravity applied to interruptions (KUX-004 §10.3), Operational Presence. All of it is one discipline. The reframe, a ratified **Canonical Product Law** (constitutional for the KUX series):

> **Notifications are a mechanism. Attention is the product.**
> *Every interruption spends credibility.*

**The commercial problem.** Every B2B monitoring product trains its users to ignore it: alert volume grows, signal density falls, users mute the channel, and the one alert that mattered dies in a muted inbox. Attention is the scarcest resource a sponsor gives Kadarn — spent carelessly once, it is repriced forever. This workspace treats attention as a budget the product spends like money: deliberately, explainably, and with an account of every expenditure.

**Rhythm:** ambient (KUX-004 §12). **Surface type:** Monitoring (delivery layer). **Minds:** all five — attention is the one surface every role shares.

---

## 2. The Attention Economy

Binding rules, extending KUX-004 §10 (which remains constitutional — nothing here weakens it):

1. **Every interruption spends credibility.** An interruption that does not change what the user does next was a purchase the product could not afford. The workspace is designed to *minimize* delivered interruptions, not to maximize engagement — engagement metrics are explicitly non-goals (KUX-002 §13: time-on-screen is a cost).
2. **Every notification carries its evidence and earns its interruption** (KUX-004 §10.2, restated as the admission rule). A communication that cannot state what changed, show the evidence that moved, and land the user in the right movement (KUX-005 §4.9) is not sent — on any channel.
3. **Priority is evidentiary, never emotional** (KUX-004 §10.3). No urgency theater on any channel; the only legitimate urgency cites evidence and decision impact.
4. **Silence is a designed product surface.** "Nothing needs you" is delivered content (the Quiet state, the empty digest §6.3) — attention *returned* to the user is a feature, and the product says so.

---

## 3. Attention Tiers

Every condition originated anywhere in the product (Portfolio, Opportunity, Risk) is assigned exactly one attention tier. Tiers are the workspace's core mechanism:

| Tier | Meaning | Delivery |
|---|---|---|
| **Interrupt** | Requires the user *now*: it materially threatens an active decision and has short time-to-impact | Pushed across channels (in-app + email immediately) |
| **Queue** | Requires the user *next visit*: enters the relevant Attention Queue and the Dashboard | In-app; included in the next digest |
| **Periphery** | Worth ambient awareness, not action | Peripheral Awareness signal only (KUX-004 §13) |
| **Digest** | Worth knowing on a cadence | Batched into the narrative digest (§6) |
| **Record** | Worth history, not attention | Written to the notification timeline (§7) only |

Tier assignment rules:

1. **Default assignment is by decision impact**, using the established prioritization tiers (KUX-011 §8.1): active-study decision threat → Interrupt or Queue by time-to-impact; open-reasoning relevance → Queue; portfolio watch → Periphery or Digest; informational → Digest or Record.
2. **Users re-tier via Subscriptions (§5)** — thresholds belong to the user. With one floor: a condition of category Decision-Basis Erosion or Contradiction affecting an *active study's recorded decision* can be lowered to Queue but never below it — the product will not let its reason to exist be muted into Record.
3. **Nothing is ever deleted by tiering.** Re-tiering changes delivery, never existence: everything lands in the timeline (§7). Attention is managed; the record is total.
4. **Tier assignment is explainable** (§8): every delivered item can state which rule and which subscription placed it in its tier.

---

## 4. Grouping

Inherited from KUX-004 §10.4 and made mechanical: grouping is **by object first, by change type second, by time third**. Ten changes at one institution are one story with ten cited members (every aggregate explorable). A condition affecting many objects (one source outage touching 14 institutions) groups by the *condition*, listing the objects. Groups never hide severity mixtures: a group containing one Interrupt-tier member is presented at Interrupt tier with the member distinguished.

## 5. Subscriptions

Subscriptions are the user's explicit attention contract:

1. **Scoped:** per portfolio, study, institution, category (KUX-011 §4 catalog), or session — favorites are standing subscriptions (KUX-005 §4.7).
2. **Explicit:** no subscription is created, modified, or removed silently — including by the product itself. Defaults exist (sensible decision-impact mapping, §3.1), are visible, and are labeled as defaults.
3. **Inspectable:** the subscription surface answers "what am I watching, at which tiers, and why?" in one view — the user's attention contract is readable the way a requirements profile is (KUX-009 §2.1 discipline).
4. **Team-aware:** a role can see (not silently inherit) what their team watches, so escalations (KUX-011 §3) arrive to people who are actually subscribed — an escalation to an unsubscribed recipient states so.

## 6. Channels

| Channel | Carries | Rules |
|---|---|---|
| **In-app** | Queue + Periphery + timeline | The primary surface; the Dashboard change feed (KUX-006 §7.1) is its projection |
| **Email** | Interrupt tier + digest | Every email lands its links oriented (deep links, KUX-005 §4.4); an email that is only "you have notifications" is prohibited — the evidence summary travels in the message |
| **Digest** | The narrative cadence (daily/weekly, user-chosen) | §6.3 |
| **Timeline** | Everything (§7) | The historized total record |

**§6.3 The Digest is a narrative.** The digest is the Portfolio Narrative (KUX-007 §8) and Risk Narrative (KUX-011 §12) delivered on cadence — cited, decision-ranked, memory-based ("since your last digest"), honestly quiet when quiet: *"Nothing meaningful changed this week. Kadarn is watching 12 decisions, 47 institutions. All evidence within horizons."* An empty digest is sent, not skipped — rhythm builds trust; skipped rhythm builds checking-compulsion.

## 7. The Notification Timeline

The historized stream of everything the product ever brought (or chose not to bring) to attention: condition, tier assigned, channels delivered, seen/acted state, and outcome. Rules: append-only; per-user and per-scope views; searchable; and it is the audit answer to *"was I told?"* — including the honest answer "it was tiered to Record by your subscription, here is the rule" (§8). Delivery failures surface per KUX-011 §14.

## 8. Attention Provenance

The workspace's own explainability obligation — P2 applied to interruptions:

> Every delivered communication can answer: **"Why am I seeing this, why now, and why on this channel?"**

The answer chain: originating condition → its generating evidence → the tier rule applied → the subscription that scoped it → the channel policy. One interaction from any notification (the Explain movement works on the notification itself). A communication that cannot produce this chain is blocked at the delivery layer — the admission rule (§2.2) enforced mechanically.

---

## 9. States

- **Quiet:** §2.4 — delivered, informative, watch-stated.
- **Cold start:** attention needs subscriptions — defaults activate with the first portfolio/study/decision, and the workspace shows the resulting attention contract for confirmation.
- **Storm (mass condition event):** a source outage or bulk ingestion fires many conditions at once — grouping (§4) collapses by condition, the digest absorbs the tail, and Interrupt tier remains reserved for genuine decision threats; the product never converts a storm into an inbox flood (Calm under load is the tier system's stress test).
- **Delivery degradation:** undeliverable Interrupt-tier items persist at queue top with undelivered status (KUX-011 §14); the timeline records the failure.

## 10. Compliance and Acceptance

**Constitutional inputs honored:** KUX-004 §10 rules 1–5 are enforced per channel (§2, §6); Peripheral Awareness rules (KUX-004 §13) govern the Periphery tier; the Workspace Integrity Rule holds — this workspace manages attention; it never absorbs the workspaces it delivers for (a notification lands the user *there*, in the right movement).

**The four executable-spec questions:**

1. *Real decision?* — Yes: where to spend attention — the meta-decision that gates every other decision; plus the explicit subscription contract and the re-tier judgments.
2. *Less time to decision?* — Yes: tiering delivers decision threats with lead time and removes everything else from the interrupt path; the narrative digest replaces inbox archaeology; oriented landings eliminate re-orientation.
3. *Evidence visible without overload?* — Yes: five tiers with a floor, grouping by object/condition, narrative over counters, silence as content.
4. *Implementable without inventing behavior?* — Yes: tier catalog with assignment rules and floor, channel table with per-channel rules, grouping precedence, subscription semantics, provenance chain, storm behavior — all enumerated.

### Acceptance Criteria (Gate: Notification & Attention Approved)

1. What is the one question and the reframe? — §1: attention is the product; notifications a mechanism (proposed Canonical Product Law).
2. What is the attention economy? — §2: four binding rules; interruptions spend credibility; silence is designed.
3. How are conditions tiered? — §3: five tiers, decision-impact defaults, user re-tiering with the active-decision floor, nothing deleted by tiering.
4. How is volume kept honest? — §4: grouping precedence; §9: storm behavior.
5. What is the user's attention contract? — §5: scoped, explicit, inspectable, team-aware subscriptions.
6. What do channels carry? — §6: in-app/email/digest/timeline with per-channel rules; the digest as cited narrative, sent even when empty.
7. Is the record total? — §7: append-only timeline answering "was I told?".
8. Is attention explainable? — §8: Attention Provenance — the full chain, mechanically enforced at delivery.

**Next document:** KUX-1.0 — Sponsor Product Specification Freeze (series closing document).
