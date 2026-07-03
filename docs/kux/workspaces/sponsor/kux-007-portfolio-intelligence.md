# KUX-007 — Portfolio Intelligence Workspace

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-007 |
| Sprint | UX-7 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Ratified — Gate passed: Portfolio Workspace Approved |
| Kind | **Product specification** |
| Depends on | KUX-001 – KUX-006 (all ratified; the Sponsor Workspace Contract, KUX-006 §5, is binding) |
| Governs | The Portfolio Intelligence workspace: purpose, views, aggregation rules, focus mechanics, decisions, states |
| Explicitly out of scope | Passport internals (KUX-008), feasibility matching (KUX-009), risk mechanics (KUX-011), wireframes, visual design, components, technology |

---

## 1. The One Question — and the Commercial Need

> **"What is happening across my institution portfolio, and where should I focus next?"**

Everything that does not help answer this question is out of this workspace.

**The commercial need.** A sponsor organization works with dozens to hundreds of institutions. Today, knowing their state means spreadsheets, emails, and expensive periodic re-assessments — and the truth decays between assessments. The cost is concrete: stale site information discovered mid-study, re-qualification fire drills, and portfolio reviews that consume weeks to produce a snapshot that is obsolete on delivery. Portfolio Intelligence replaces the periodic snapshot with a **continuously evidenced population view**: the portfolio manager knows which institutions need attention *before* being asked, at any moment, with every figure explainable. That is what this workspace is bought for.

**Rhythm:** slow · analytical (KUX-004 §12). **Surface types:** Monitoring (the standing view) + Comparison (within-portfolio). **Primary minds:** Portfolio Manager first; Sponsor org frame second (KUX-003 §2).

---

## 2. The Portfolio Object

Inherited from KUX-003 and made operational:

1. A Portfolio is a **sponsor-defined set of institutions observed together** — a contextual object carrying intent, never evidence (KUX-003 §4.2). Deleting a portfolio touches no institution's evidence.
2. A sponsor organization may hold **multiple portfolios** (by therapeutic area, by program, by region, by lifecycle stage — composition is the sponsor's business decision, not Kadarn's taxonomy). An institution may belong to many portfolios.
3. Membership has a lifecycle: institutions are **added** (from Feasibility results, Discovery suggestions, or directly), **watched**, and **removed** — each a recorded decision with provenance (KUX-005 §6). Removal archives the membership history; it never deletes it (Contract clause 5).
4. A portfolio always answers *since when*: membership dates are part of the object (P11), and population views can be read as of any past date.

---

## 3. Decisions Taken Here

Per the organizing principle (KUX-006 §0): the workspace is specified by its decisions.

| Decision | Trigger | Evidence shown before commitment | Recorded as |
|---|---|---|---|
| Add institution to portfolio | Feasibility/Discovery result, direct intent | The institution's Passport summary: coverage, freshness, gaps | Membership decision with provenance |
| Remove institution | Health decline, program end | Current state + the decision history that added it | Membership decision; history archived |
| Trigger re-discovery / evidence refresh | Staleness, gaps, upcoming study | What is stale or missing, per institution | Refresh request (feeds Discovery) |
| Focus: open an institution for attention | Attention queue (§5) | The change or condition that earned attention | Session start (Reasoning Session) |
| Escalate to Risk response | Population-level risk signal | The evidence generating the risk | Handoff to Risk Monitoring (KUX-011) |

Non-decisions, explicitly: this workspace never accepts/rejects claims (that is Passport/Judgment work), never selects sites for studies (Feasibility), never resolves risks (Risk Monitoring). It *routes* to those decisions through Movement.

---

## 4. Views

Eight views, each answering a sub-question of the one question. All views are population-level; every figure obeys the Aggregation Rules (§6) and descends to its members.

| View | Sub-question | Content rules |
|---|---|---|
| **Portfolio Overview** | "What is the state, in one glance?" | The hero synthesis: population size, evidence health summary, items requiring attention, change since last visit. Product Grammar in one screen (KUX-002 §14). |
| **Evidence Health** | "How well-evidenced is my population?" | Claims coverage, evidence freshness distribution, open gaps, contested items — as distributions and counts, never composite scores. Staleness visually aged (P11). |
| **Capability Distribution** | "What can my population evidently do?" | Counts of institutions with evidenced capability candidates per taxonomy category — always in candidate register ("evidence suggesting PBMC processing at 12 institutions"), never "12 sites have PBMC" (P8). |
| **Coverage** | "Where are the blind spots?" | Claim-taxonomy coverage across the population: which claim types are well-evidenced, thin, or absent — absence drawable (KUX-002 §9.6). |
| **Risk Distribution** | "Where does risk concentrate?" | Risks by institution, category, and severity — each risk carrying its generating evidence (KUX-003 §3). Deep treatment in KUX-011; this view is the population lens. |
| **Confidence Evolution** | "Which way is my population moving?" | Confidence-state trajectories over time, per claim type and per institution — movement, not snapshots (P11). Decline is as visible as improvement (P3). |
| **Comparison** | "How do these institutions differ, on evidence?" | Side-by-side within the portfolio, per KUX-005 §2.4 and the Canonical Design Law: no ranking column, every difference explainable, temporal asymmetry visible. |
| **Portfolio Timeline** | "What has happened to this population?" | The population's change history: memberships, evidence arrivals, confidence movements, decisions — one navigable temporal stream. |

View rules: Overview is the landing view; all others are one Focus away. No view duplicates another workspace's question — Risk Distribution links into Risk Monitoring, member details open the Passport (KUX-004 §14 rule 2).

---

## 5. Focus Mechanics — "where should I focus next?"

The second half of the one question, specified precisely because it is where products degenerate into either alarm noise or false rankings.

1. **The Attention Queue.** The workspace maintains a prioritized queue of *conditions requiring attention*: evidence decayed below a claim's decay period, a contradiction arrived, a gap opened on a depended-upon claim, a decision's basis weakened (Decision Ledger feedback, KUX-006 §8), coverage fell on a watched capability. Each entry states its condition, its evidence, and its suggested movement.
2. **Attention is prioritized; institutions are never ranked.** The queue orders *conditions* by decision impact (Evidence Gravity applied to attention, KUX-004 §13 rule 2). This is categorically different from ranking institutions: "this decay affects your active study" outranks "new document at a watched site" — but no institution is above or below another. The distinction is a Lexicon-level obligation (ADR-010).
3. **Exactly one next action** at workspace level (P6): the top of the queue, with its reason. The rest of the queue is visible but subordinate.
4. **Every queue entry is explainable and dismissible.** Dismissal is a recorded judgment ("not relevant because…"), and the queue learns nothing silently — subscription and threshold changes are explicit user decisions (KUX-012 will specify the delivery side).
5. **Quiet is an answer.** An empty attention queue renders the designed Quiet state: "Nothing requires your attention. 47 institutions monitored, evidence current." (KUX-004 §11).

---

## 6. Aggregation Rules

The epistemological core of this workspace. KEMS-001 prohibits aggregate institutional confidence; a portfolio view multiplies the temptation. These rules are binding:

1. **Aggregate evidence, never judgment.** Permitted aggregates are descriptive statistics of evidence: counts, coverage percentages, freshness distributions, gap counts, trajectory directions. Prohibited: any composite number that could be read as "how good is this institution" or "how good is this portfolio" — no portfolio score, no site score, no health *score* (health is shown as a set of explicit dimensions, never one number). This rule is elevated to a **Canonical Product Law** of the series, alongside "Evidence before opinion" and "Compare degenerates into ranking":

   > **Aggregate evidence, never judgment.**

2. **No number without members.** Every aggregate decomposes in one interaction into the institutions (and then the claims, and then the evidence) that compose it — the Explain movement applies to statistics (P2 at population scale). The complementary formulation, without exception: **every aggregate must be explorable.** "17 institutions affected" always opens into those 17.
3. **Aggregates carry time.** Every population figure states its as-of moment and can show its trajectory (P11). A coverage percentage without a trend direction is half a figure.
4. **Distributions over averages.** Where a spread exists, show the spread: an "average freshness" hides the three institutions whose evidence expired. Averages may summarize only where the distribution is also reachable (P3 — hiding the tail is hiding uncertainty).
5. **Candidate register survives aggregation.** Aggregated capability language remains suggestive: "evidence suggesting X at N institutions" (P8). Aggregation never launders candidates into facts.

---

## 7. Portfolio Memory

Alongside the Decision Ledger (decision-scoped) and Reasoning Sessions (inquiry-scoped), this workspace introduces the third memory: **Portfolio Memory — observation-scoped working memory.** Not a list; the workspace's remembered state of watching.

The workspace remembers, per portfolio:

- **which institutions remain under observation** — and since when;
- **which conditions motivated that observation** — every watch entry carries its reason (a decayed claim, an open gap, a pending confirmation), never a bare flag;
- **what changed since the last review** — the review diff: the workspace knows when this manager last reviewed and reconciles against that moment (the session-resume rule, KUX-005 §5.4, applied to the standing portfolio);
- **what was already resolved** — closed observations stay reachable with their resolution, so the same condition is never re-investigated from zero (Contract clause 5: history is never invalidated).

Portfolio Memory is what makes the Portfolio Cycle (§10) incremental rather than exhaustive: a quarterly review starts from "what moved since Q2," not from institution #1.

## 8. Portfolio Narrative

The population's change is delivered as **narrative, not counters**. Instead of `Alerts: 27`:

> *"Since your last review, three active programs have experienced evidence changes. Two are related to document expiration, one to newly submitted counter-evidence. No changes currently threaten enrollment decisions."*

Rules (inheriting the narrative discipline of the design language, KUX-002 §9):

1. **Every sentence cites.** Each narrative statement links to the evidence and institutions behind it — the narrative is an aggregate and obeys §6 (explorable, members reachable).
2. **The narrative answers Product Grammar question 3** ("what changed?") at population scale, in the calm register — it synthesizes, ranks by decision impact, and explicitly states what does *not* threaten decisions (honest reassurance is content, P3).
3. **The narrative never editorializes quality.** It reports evidence movement and its decision relevance; it never concludes "your portfolio is strong" (that would aggregate judgment, §6 rule 1).
4. Narrative first, counters behind it: the numbers remain available as the narrative's members.

## 9. Stability Indicators

The permitted per-institution signal — measuring **stability of knowledge, not quality of institution**. These are states of what Kadarn knows, fully KEMS-consistent:

| Indicator | Means |
|---|---|
| **Stable** | Evidence current, no material movement, nothing contested |
| **Evolving** | Evidence actively arriving or confidence states moving |
| **Under Review** | Human judgment in progress: contested items, open curation |
| **Evidence Refresh Needed** | Decay or gaps have passed the attention threshold |

Rules:

1. These are **states of the knowledge**, never labels of the institution — "Evidence Refresh Needed" describes Kadarn's representation, not the site's competence. The distinction is enforced in copy (P8).
2. Each indicator is explainable in one interaction: which evidence, which movement, which open judgment produced it (P2).
3. Indicators are temporal by nature (P11): they change as knowledge changes, and their history is visible.
4. They are categorical, never ordinal: there is no "better" indicator, no color scale implying rank, and they never sort institutions as a quality ordering (§5 rule 2 applies).

## 10. Movements and Cycles in This Workspace

- **Explore** — across views and across the population (lateral).
- **Focus** — portfolio → segment → institution; every narrowing stated (silent filters prohibited, KUX-005 §2.2). Saved segments are standing Focus (favorites semantics, KUX-005 §4.7) and feed Peripheral Awareness.
- **Explain** — from any figure to members to claims to evidence (§6 rule 2).
- **Compare** — the Comparison view; also entry point to Feasibility when comparison becomes study-specific ("this comparison needs requirements — continue in Feasibility Search?").
- **Decide** — the §3 catalog, each with provenance.

This workspace hosts the **Portfolio Cycle** (KUX-006 §4.5) and feeds the **Watch Cycle** (§4.4). It is a primary Reasoning Session surface: "Q3 portfolio review" is a session — parkable, resumable, reconciled on resume (KUX-005 §5).

---

## 11. States

Per KUX-004 §11, with workspace-specific behavior:

- **Cold start (no portfolios):** never empty — "Create your first portfolio from your Feasibility results, or add institutions directly. Kadarn is already holding evidence for N institutions you have touched." (P1).
- **Sparse portfolio (members without depth):** honest thinness — coverage views show how little is evidenced, with refresh/discovery as the next action; a thin portfolio never fakes health.
- **Quiet:** §5 rule 5.
- **Degraded:** if a source or discovery run affecting members is stale/down, the affected figures are marked, named, and dated — staleness declared, never discovered (Contract clause via KUX-004 §11).

---

## 12. Compliance and Acceptance

**Sponsor Workspace Contract (KUX-006 §5):** all six clauses hold — context preserved across views and into Passports (1); every figure descends to evidence (2); all §3 decisions show basis and record provenance (3); portfolio reviews are resumable sessions (4); membership and decision history archived, never rewritten (5); dismissals and judgments attributed (6).

**Workspace Integrity (KUX-004 §14):** one question declared (§1); non-decisions named (§3); neighboring questions linked, not absorbed (§4).

**The four executable-spec questions:**

1. *Real decision?* — Yes: §3 catalog — composition, refresh, focus, escalation — plus routing into selection and judgment decisions elsewhere.
2. *Less time to decision?* — Yes: the attention queue replaces manual population scanning; quiet state replaces reassurance-hunting; sessions eliminate review re-work.
3. *Evidence visible without overload?* — Yes: eight views each answering one sub-question; aggregation rules keep density honest; hierarchy state → change → action → detail.
4. *Implementable without inventing behavior?* — Yes: views enumerated with content rules, aggregates whitelisted and prohibited explicitly, attention queue conditions enumerated, states specified, decisions cataloged with what is shown and recorded.

### Acceptance Criteria (Gate: Portfolio Workspace Approved — PASSED)

1. What is the one question, and what is the commercial need? — §1.
2. What is a Portfolio, operationally? — §2: contextual, multiple, lifecycle with provenance, time-readable.
3. What is decided here — and what is explicitly not? — §3.
4. What views exist, each answering which sub-question? — §4: eight views with content rules.
5. How does "where should I focus next?" work without ranking institutions? — §5: attention queue over conditions; prioritized attention ≠ ranked institutions.
6. What may be aggregated and what may never be? — §6: five binding aggregation rules; "Aggregate evidence, never judgment" elevated to Canonical Product Law; every aggregate explorable.
7. What does the workspace remember? — §7: Portfolio Memory — observation-scoped working memory; incremental reviews.
8. How is change delivered? — §8: Portfolio Narrative — cited, decision-ranked, honestly reassuring, never quality-editorializing.
9. What per-institution signal is permitted? — §9: Stability Indicators — states of knowledge, categorical, explainable, never quality labels.
10. How do movements, cycles, and sessions operate here? — §10.
11. What are the workspace's states? — §11.

**Next document (Sprint UX-8):** KUX-008 — Institutional Passport.
