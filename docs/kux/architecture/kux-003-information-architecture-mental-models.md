# KUX-003 — Information Architecture & Mental Models

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-003 |
| Sprint | UX-3 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Ratified — Gate passed: Information Architecture Approved |
| Depends on | KUX-001, KUX-002, KEMS-001, Lexicon v1.2, Claim Taxonomy v1.0 |
| Governs | How the sponsor experience organizes and names information; the mental models all sponsor-facing workspaces must serve |
| Explicitly out of scope | Navigation (KUX-005), shell composition (KUX-004), wireframes, UI, screens, components |

---

## 1. Purpose

This document defines **how a sponsor thinks inside Kadarn**. It is the bridge between KEMS — how the system thinks — and KUX — how the user thinks.

KEMS models Claims, Evidence Nodes, and Confidence States. A sponsor does not wake up thinking about Confidence States. They wake up thinking: *"Which sites can actually run my study?"* This document maps the system's epistemology onto the user's intent, so that every later workspace is organized around what users are trying to do — not around what the database contains.

Nothing here describes screens. It describes the **information universe**: what exists, how it connects, how it is understood, and how its meaning shifts with context.

---

## 2. Mental Models

Five minds use the sponsor experience. Each has a governing question, a primary mental object, a fear, and a definition of success. Workspaces are designed for these minds, not for departments.

### 2.1 The Sponsor (organizational frame)

The umbrella mind — the organization's collective intent that the four operating roles express.

- **Governing question:** "Can we run our clinical programs with less uncertainty?"
- **Primary mental object:** the **Portfolio** — the set of institutions the organization works with or considers.
- **Fear:** committing to a site on stale, thin, or wrong information — and discovering it mid-study.
- **Success:** decisions that were faster than before *and* explainable afterwards.
- **Thinks in Kadarn as:** "Kadarn is where we know what we actually know about sites."

### 2.2 Portfolio Manager

- **Governing question:** "What is the state of my institutions, and what changed?"
- **Primary mental object:** the **Portfolio**, as a living population of institutions with evidence health.
- **Fear:** silent drift — a portfolio that looked healthy last quarter and quietly decayed.
- **Success:** always knowing which institutions need attention *before* being asked.
- **Thinks in evidence terms as:** coverage, freshness, and change over a population (P11 at portfolio scale).

### 2.3 Feasibility Lead

- **Governing question:** "Which institutions can execute *this specific study*?"
- **Primary mental object:** the **Opportunity** — a candidate match between a study's requirements and an institution's evidenced capabilities.
- **Fear:** false positives — a site that looked capable on paper and fails at activation.
- **Success:** a shortlist they can defend line by line: every inclusion and exclusion traceable to evidence.
- **Thinks in evidence terms as:** capability support vs. study requirements, with explicit gaps and confidence thresholds.

### 2.4 Medical Affairs

- **Governing question:** "Is this specific assertion about this institution actually supported?"
- **Primary mental object:** the **Claim** and its Evidence — the finest-grained mind of the five.
- **Fear:** signing off on an assertion that a contradicting document later disproves.
- **Success:** every judgment they endorse survives scrutiny; contested items are visibly contested.
- **Thinks in evidence terms as:** the native KEMS user — Evidence Classes, Counter Evidence, Right of Response, explainable inference.

### 2.5 Clinical Operations

- **Governing question:** "Will the sites we selected keep performing — and what is changing right now?"
- **Primary mental object:** the **Risk** and its **Alerts** — evidence in motion during delivery.
- **Fear:** finding out about a site problem from the site, not from Kadarn.
- **Success:** operational surprises approach zero; every alert that fires is worth reading.
- **Thinks in evidence terms as:** evidence decay, missing renewals, contradiction arrivals, and temporal continuity (P11 as an operational instrument).

### 2.6 The primary mental object — resolved

The series must answer: *Institution, Portfolio, Claim, Evidence, Opportunity, or Passport?*

**The primary mental object of the sponsor experience is the Institution — always seen through its evidence, with the Passport as its canonical representation.**

The deep rationale is not merely that every role's question terminates in an institution ("which site", "this site", "my sites") — though it does. It is that **Kadarn administers institutional memory**. It does not administer studies. It does not administer sponsors. It does not administer documents. All of those exist *because an institution exists*. Studies are run at institutions; documents evidence institutions; sponsors decide about institutions. The canonical phrase:

> **The Institution is the persistent object. Everything else is context.**

Evidence is the material (KUX-002 §3), not the destination; Claims are the grain Medical Affairs works at, but even they judge claims *about an institution*; Portfolio, Opportunity, and Risk are lenses over institutions. Per the Evidence-first Interface (KUX-002 §2), the user never sees "the Institution record" — they see the evidence that constructs the institution.

That constructed view is the Passport, defined with its temporal dimension explicit:

> **The Institutional Passport is the canonical representation of an Institution's evidence at a given point in time.**

There is no absolute Passport. There is a Passport *now* (KUX-001 P11). Everything in the sponsor experience either leads to a Passport or watches many of them.

### 2.7 Decision — the cognitive terminus

One object appears in no entity table because it is not a persistent entity: the **Decision**.

The Decision is a *cognitive object*. It does not live in the database — it lives in the user's head. But the product exists to produce it. The sponsor's mental chain runs:

```
Evidence
   ↓
Claim
   ↓
Capability
   ↓
Institution
   ↓
Decision
```

Everything upstream of the Decision is Kadarn's responsibility; the Decision itself is always the human's (KUX-001 §2.4 — the human always leads). The product's obligations toward this object: reduce the time to reach it (KUX-002 §13, Decision Velocity), make it explainable when it is reached (P2), and record its evidentiary context when it is taken (Decision Surface contract, KUX-002 §10) — without ever taking it on the user's behalf.

**Decision always belongs to a human.** This is a cognitive invariant (§12).

---

## 3. Core Entities

The nouns of the sponsor experience. Each is defined by what it is, what it is *not*, and its evidence-first rendering (KUX-002 §2). Entities marked **[KEMS]** are canonical evidence-model entities; entities marked **[SXP]** are sponsor-experience constructs projected over them.

| Entity | Is | Is not | The user sees |
|---|---|---|---|
| **Institution** [SXP] | A real-world research organization Kadarn holds evidence about | A CRM account or directory record | The evidence that constructs the institution (its Passport) |
| **Evidence** [KEMS] | An Evidence Node: a sourced, classed (A–F), dated unit of support | An editable field value | The node with provenance, class, age, and what it supports or contradicts |
| **Claim** [KEMS] | A falsifiable assertion about an institution, per the Claim Taxonomy | An opinion, ranking, or reputation | The claim with its Confidence State, supporting/contradicting evidence, and history |
| **Capability** [SXP] | A claim-shaped answer to "can this institution do X?" — always candidate or evidenced, never certified | A checkbox or a badge | The capability with the evidence suggesting it and the gaps around it |
| **Passport** [SXP] | The canonical representation of an Institution's evidence at a given point in time: identity, capabilities, claims, timeline, confidence, history | A profile page or brochure — or an absolute, timeless profile | The institution as a reconstructed, dated, explainable body of evidence |
| **Portfolio** [SXP] | A sponsor-defined set of institutions observed together | A folder | A population of Passports with aggregate evidence health — never an aggregate "score" (KEMS-001) |
| **Opportunity** [SXP] | A candidate match between a study's requirements and an institution's evidenced capabilities | A lead | The match *with its reasoning*: which requirements are supported, at what confidence, with what gaps |
| **Alert** [SXP] | A notification that evidence meaningfully changed | A generic notification | The change, the evidence that moved, and why it matters to *this* user (KUX-002 §14, "what changed") |
| **Risk** [SXP] | A derived condition where evidence is decaying, missing, or contradicted in a way that threatens a decision | A red badge with no lineage | The risk with the evidence that generates it (never the risk detached from its evidence) |
| **Study** [SXP] | The sponsor's clinical program context: requirements, phase, population, geography | A protocol document manager | The requirements profile that opportunities and feasibility are evaluated against |
| **Document** [KEMS-adjacent] | A source artifact (Layer 0) evidence is extracted from | A file in a folder | The artifact as the root of provenance chains — what was extracted from it and what it supports |
| **Evidence Graph** [KEMS] | The raw structure of nodes and relationships for an institution or claim | An infographic | A navigable reasoning structure (KUX-002 §6: only if the user can interrogate nodes) |

Naming discipline: these twelve names are the vocabulary of the sponsor experience. Workspaces may not invent synonyms ("Site Profile", "Score Card", "Lead") — Lexicon rules apply (KUX-001 P8).

---

## 4. Entity Relationships

What connects to what — and critically, **which relationships are permanent and which are contextual**.

### 4.1 Permanent relationships (evidential — true regardless of who is looking)

```
Document ──produces──▶ Evidence ──supports/contradicts──▶ Claim ──about──▶ Institution
                            │                                │
                            └────────── composes ───────────┘
                                         │
                                   Evidence Graph
Claim ──suggests──▶ Capability ──of──▶ Institution
Institution ──projected as──▶ Passport
```

These come from KEMS and never change per user, per workspace, or per study. They are the load-bearing structure of the information architecture.

### 4.2 Contextual relationships (intentional — exist because a sponsor is looking)

```
Sponsor ──defines──▶ Portfolio ──contains──▶ Institution
Study ──requires──▶ Capabilities
Study × Institution ──evaluated as──▶ Opportunity
Portfolio | Study | Institution ──generates──▶ Risk ──raises──▶ Alert
```

Contextual relationships are owned by the sponsor, scoped to their intent, and disposable without touching evidence. A Portfolio can be deleted; the institutions' evidence is untouched. An Opportunity expires with its study; the capabilities it evaluated remain.

### 4.3 The architectural rule

**Permanent relationships carry evidence; contextual relationships carry intent.** No workspace may present a contextual relationship as if it were evidential ("this site matches" is an evaluation against *a study*, not a property of the site), and no workspace may let intent mutate evidence (ADR-012 write rule, KUX-001 P5).

---

## 5. Information Domains

Six domains organize all sponsor-facing information. Domains are *containers of questions*, not menu items (navigation is KUX-005's problem).

| Domain | Contains | Primary question | Dominant surface types (KUX-002 §10) |
|---|---|---|---|
| **Portfolio** | Portfolios, aggregate evidence health, population-level change | "What is the state of my institutions?" | Monitoring, Comparison |
| **Institution** | Passports: identity, capabilities, claims, timeline, documents, history | "What do we know about this institution, and how well?" | Review, Decision |
| **Discovery** | Reconstruction in progress, new findings, opportunity matching | "What is Kadarn finding — and what matches my study?" | Discovery, Comparison |
| **Evidence** | Evidence nodes, graphs, claims, counter evidence, responses, provenance | "Is this assertion actually supported?" | Review, Investigation (Review-type) |
| **Monitoring** | Risks, alerts, evidence decay, change streams | "What changed, and does it threaten a decision?" | Monitoring |
| **Administration** | Users, roles, subscriptions, connectors, platform health | "Is the system configured and healthy?" | Administration |

Domain rules:

1. Every piece of information has **one home domain** — the place where it is authoritative and complete.
2. Information may **appear** in other domains as a projection, always linking back to its home.
3. The Evidence domain is the *ground floor*: every other domain's items descend into it (KUX-001 P2, P4).

---

## 6. Cognitive Model

What does the user believe they are doing? Not "using a dashboard." The experience must be organized around these self-narratives:

| Role | The user believes they are… | Never make them feel they are… |
|---|---|---|
| Portfolio Manager | "Keeping my institutions honest and current" | Grooming database records |
| Feasibility Lead | "Finding the best sites for this study" | Running filter queries |
| Medical Affairs | "Checking whether we can stand behind this" | Doing data entry QA |
| Clinical Operations | "Watching my sites so nothing surprises me" | Triaging a ticket queue |
| All roles | "Reducing the uncertainty of a real decision" | Consuming a report |

**The architectural consequence:** information is grouped and named by intent, not by system function. There is no "Claims module" in the sponsor's world — there is *"what we know about this institution"* (Institution domain) and *"is this assertion supported"* (Evidence domain). The KEMS machinery is the engine room; the cognitive model is the deck. Users may descend to the engine room (P7); they are never forced to live there.

---

## 7. Information Hierarchy

What appears first, everywhere in the sponsor experience — a domain-agnostic ordering derived from KUX-001 P6/P7 and KUX-002 §7–§8 (hierarchy + Evidence Gravity):

1. **State** — the synthesized answer to the domain's primary question ("what is the state of X?").
2. **Change** — what moved since the user last looked (P11; KUX-002 §14 question 3).
3. **Confidence & uncertainty** — how well-supported the state is, and where the gaps are (shown together, honestly — P3).
4. **The one next action** — exactly one (P6).
5. **The reasoning** — evidence, provenance, explanations, graphs (available by descent, never required — P7).
6. **The archive** — full history, all documents, complete records (reachable, never ambient).

Nothing may jump the queue: a screen that leads with the archive (a raw table) or with reasoning detail violates the hierarchy regardless of how important the content is. Evidence Gravity governs ordering *within* each level.

---

## 8. Information Gravity

The single diagram that explains how information flows toward decisions — and, later, how all navigation will feel. Information in Kadarn has a gravitational field: raw evidence at the bottom, the human decision at the top, every layer deriving its meaning from the layer beneath it.

```
Evidence
   │
   ▼
Claims
   │
   ▼
Capabilities
   │
   ▼
Institution Passport
   │
   ▼
Portfolio
   │
   ▼
Opportunity
   │
   ▼
Decision
```

Reading the diagram:

- **Upward is synthesis.** Each layer aggregates and interprets the one below: claims synthesize evidence, capabilities synthesize claims, the Passport synthesizes an institution, the Portfolio synthesizes institutions, an Opportunity synthesizes a portfolio against a study, and the Decision synthesizes it all in a human mind.
- **Downward is explanation.** From any layer, the user can descend to the layer beneath and ultimately to Evidence (KUX-001 P2, P4). Descent is the product's answer to every "why?".
- **Gravity strengthens downward.** Per Evidence Gravity (KUX-002 §8), the lower layers carry more evidentiary mass: no layer may visually or semantically outrank what sustains it.
- **Nothing skips layers upward.** An Opportunity is never derived directly from raw evidence without passing through claims and capabilities; a Decision is never presented as derived from a score. The chain is the explanation.
- **The top layer is human.** Kadarn owns every layer except the last (§2.7).

This diagram is normative for KUX-004 and KUX-005: shell structure and navigation must let the user move along this axis — up toward decision, down toward explanation — as the primary motion of the product.

---

## 9. Object Lifecycles

Mental-model lifecycles — the states a sponsor understands objects to move through. (System state machines live in KEMS/Discovery; these are their user-facing shadows and must never contradict them.)

### 9.1 Institution (the master lifecycle)

```
Discovery ──▶ Evaluation ──▶ Selection ──▶ Monitoring ──▶ Delivery
   ▲                                            │
   └──────────── re-discovery / enrichment ◀────┘
```

- **Discovery** — Kadarn reconstructs; the institution enters the sponsor's field of view.
- **Evaluation** — evidence is reviewed, challenged, enriched; opportunities are weighed.
- **Selection** — a decision is made and recorded with its evidentiary context (Decision Surface contract).
- **Monitoring** — the evidence is watched for decay, contradiction, and change.
- **Delivery** — the institution performs; operational evidence flows; risks are managed.
- The cycle re-enters: monitoring findings trigger re-discovery and re-evaluation. **The lifecycle is a loop, not a pipeline** — because evidence evolves (P11).

The loop propagates up the entire gravity chain (§8): *Evidence evolves → Passport evolves → Portfolio evolves → Decision evolves.* There is no final state anywhere in the chain — only current states with histories.

### 9.2 Supporting lifecycles

| Object | Lifecycle | Notes |
|---|---|---|
| Claim | proposed → reviewed → (accepted \| contested → resolved) → aging → renewed \| decayed | "Aging" is a first-class visible state, not an absence of state |
| Opportunity | drafted (study defined) → matched → shortlisted → decided → archived | Dies with its study; never survives as a property of the institution |
| Alert | raised → seen → acted \| dismissed → archived | An alert that cannot lead to action should not be raised (KUX-002 §13) |
| Risk | detected → assessed → mitigated \| accepted \| escalated → resolved → historized | Always carries the evidence that generates it |
| Document | acquired → extracted → evidenced → superseded \| archived | Never deleted from provenance chains |

---

## 10. Context Model

The same information changes *meaning* — never *content* — depending on where the sponsor stands.

| Information | In Portfolio context | In Feasibility context | In Monitoring context |
|---|---|---|---|
| An Institution | One of my holdings — is it healthy? | A candidate — does it fit this study? | A watched entity — is it changing? |
| A Capability | Part of population coverage | A requirement match to verify | An asset whose evidence may be decaying |
| A Confidence State | A component of aggregate health | A threshold to clear for shortlisting | A trajectory to watch for decline |
| An Evidence gap | A completeness cost | A disqualifier or a to-request item | A growing risk |
| A new Document | An enrichment event | Potential new support for a match | A change signal to evaluate |

Rules of the context model:

1. **Context re-frames; it never re-writes.** The underlying evidence and its properties (weight, provenance, uncertainty, time — KUX-002 §3) are identical in every context. Only prioritization and framing change.
2. **Context is always visible.** The user must always know which lens they are looking through — a confidence value presented without its context (portfolio health vs. study threshold) invites misreading.
3. **Crossing contexts preserves the object.** Following an institution from Portfolio into Feasibility does not produce a "different institution" — it produces the same Passport, re-prioritized. This is the architectural basis of continuity (Pillar: Continuity).

---

## 11. Cross-cutting Objects

Four objects belong to no single domain and must be reachable from everywhere:

| Object | Why it cuts across | Standing rule |
|---|---|---|
| **Evidence** | Every domain's ground floor (§5) | From any statement, evidence is one descent away — in every domain, without exception (P2, P4) |
| **Passport** | The canonical projection of the primary mental object (§2.6) | Any mention of an institution, anywhere, leads to its Passport |
| **Claim** | The unit of assertion all roles ultimately depend on | Any capability, risk, or match traces to the claims beneath it |
| **Alerts** | Change does not respect domain boundaries (P11) | Meaningful change is surfaced wherever the user is — carrying its evidence with it |

These four are ambient: the KUX-004 Workspace Shell must give them permanent structural presence, and KUX-005 must make them reachable from any point. (How, is their problem — that they must, is decided here.)

---

## 12. Cognitive Invariants

Truths that never change, in any workspace, in any context, at any time. Everything else in the sponsor experience may be re-framed, re-prioritized, or re-designed; these may not. They are the load-bearing walls of the UX — any future design that strains against one of them is wrong by definition.

```
Institution      always exists
Evidence         always has provenance
Claim            always belongs to an Institution
Passport         always summarizes
Opportunity      always depends on context
Decision         always belongs to a human
```

- **Institution always exists.** It is the persistent object (§2.6). Portfolios, studies, and opportunities come and go; the institution and its evidence remain.
- **Evidence always has provenance.** There is no such thing as unsourced evidence anywhere in the product (KUX-001 P4; KUX-002 §3).
- **Claim always belongs to an Institution.** No free-floating assertions; every claim is about someone (Claim Taxonomy).
- **Passport always summarizes.** It is a representation at a point in time, never the raw store; it always offers descent to what it summarizes (§8).
- **Opportunity always depends on context.** It exists only relative to a study; it is never a property of the institution (§4.3).
- **Decision always belongs to a human.** Kadarn produces everything up to the decision, and never the decision itself (§2.7).

Every future KUX document and every workspace specification is checked against these six invariants before its gate.

---

## 13. Acceptance Criteria (Gate: Information Architecture Approved — PASSED)

This document passes its gate when it can answer — and has answered — the following:

1. **What entities really exist for a sponsor?** — §3: twelve entities, each defined, bounded, and rendered evidence-first.
2. **What is the primary mental object?** — §2.6: the Institution — the persistent object; everything else is context — with the Passport as its canonical representation at a given point in time; per-role primary objects mapped in §2.
3. **Which relationships are permanent and which are contextual?** — §4: permanent = evidential (KEMS-derived), contextual = intentional (sponsor-defined); rule: evidence carries truth, context carries intent.
4. **What information changes meaning per workspace?** — §10: meaning changes, content never does; context is visible; crossing contexts preserves the object.
5. **What does the user believe they are doing?** — §6: intent narratives per role; information grouped by intent, not system function.
6. **What appears first?** — §7: State → Change → Confidence/uncertainty → One action → Reasoning → Archive.
7. **What is always visible?** — §11: Evidence, Passport, Claim, Alerts.
8. **What is the product for?** — §2.7: producing the Decision — a cognitive object that always belongs to a human.
9. **How does information flow toward decisions?** — §8: the Information Gravity chain (Evidence → Claims → Capabilities → Passport → Portfolio → Opportunity → Decision); up is synthesis, down is explanation, nothing skips layers.
10. **What never changes?** — §12: the six Cognitive Invariants, checked against every future gate.

Out-of-scope confirmations: no navigation was defined (KUX-005), no shell anatomy (KUX-004), no screens, no wireframes, no components, no technology.

**Next document (Sprint UX-4):** KUX-004 — Workspace Shell: The Kadarn Operating Environment.
