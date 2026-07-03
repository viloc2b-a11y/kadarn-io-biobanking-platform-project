# KUX-008 — Institutional Passport Workspace

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-008 |
| Sprint | UX-8 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Ratified — Gate passed: Passport Approved |
| Kind | **Product specification** |
| Depends on | KUX-001 – KUX-007 (all ratified); KEMS-001; Claim Taxonomy v1.0; Lexicon v1.2 |
| Governs | The Institutional Passport workspace: its nature, anatomy, temporal behavior, judgment work, and boundaries |
| Explicitly out of scope | Feasibility matching (KUX-009), risk mechanics (KUX-011), Discovery pipeline UX, wireframes, visual design, components, technology |

---

## 0. The Defining Law

Every section of this document is subordinate to one sentence:

> **The Institutional Passport is not a profile. It is the living, explainable representation of institutional capability at a point in time.**

Three words carry the specification. **Living** — it changes as evidence changes, and shows that it changes. **Explainable** — every element answers "why does Kadarn believe this?" down to source. **At a point in time** — there is no absolute Passport; there is a Passport *now*, and there was a Passport *then*, and both are readable.

If any surface of this workspace could be mistaken for a directory listing, a brochure, a scorecard, or a form — the design has failed this law and must be corrected before proceeding.

---

## 1. The One Question — and the Commercial Need

> **"Who is this institution?"**

Asked by a sponsor who is about to risk a study, a timeline, and a budget on the answer.

**The commercial need.** Today that question is answered by site CVs, feasibility questionnaires, and directory profiles — self-reported, unverifiable, and stale on arrival. Every sponsor re-collects the same information about the same institutions, study after study, because no representation is trusted or current. The Passport is what this replaces: a representation **constructed from evidence rather than declared**, current because it is living, and trustworthy because every statement is traceable and challengeable. This is the product. Everything else in Kadarn — Discovery, Portfolio, Feasibility, Risk — exists to build, use, or watch Passports.

**Rhythm:** deep · explanatory (KUX-004 §12). **Surface types:** Review + Decision. **Minds:** all five (KUX-003 §2) — the Passport is where every role's question terminates (§2.6: the Institution is the persistent object; the Passport its canonical representation at a given point in time).

---

## 2. The Nature of the Passport

What the Passport is — and, load-bearingly, what it is not:

| The Passport is | It is not |
|---|---|
| **Constructed** from evidence by Discovery and curation | **Declared** by the institution or edited as fields |
| **Living** — re-formed as evidence arrives, decays, or is contested | A snapshot refreshed on a schedule |
| **Explainable** — every statement descends to evidence (Evidence Tree, §3.10) | A summary that asks to be taken on faith |
| **Temporal** — readable as of any moment, with visible evolution | A "current state" that silently overwrites its past |
| **Judged** — carrying human acceptances, challenges, and their history | Machine output presented as settled fact |
| **Asymmetric with honesty** — gaps and uncertainty shown with the same dignity as strengths | A marketing surface that hides thinness |

Consequences:

1. **There is no "edit Passport."** Humans act on the Passport only through judgment (accept, challenge, enrich, curate) and through evidence (upload, request) — every change is an event with an actor (Contract clause 6). The Passport cannot be typed into. This is a **Canonical Product Law**:

   > **A Passport cannot be edited. It can only evolve through evidence and human judgment.**
2. **The Passport never says "this site has X."** It says what the evidence suggests, at what confidence, as of when (P8). Its strongest possible statement is a well-supported, uncontested, current Claim — which is exactly as strong as honest gets.
3. **One institution, one Passport.** Lenses re-frame it (a Feasibility evaluation, a Portfolio membership) but never fork it (KUX-003 §10.3): everyone judging the institution judges the same representation.

### 2.1 Passport Identity

The Passport has an identity of its own — not merely a reference to an institution. As a conceptual contract (not UI), every Passport possesses:

- **Passport ID** — a stable, addressable identity (deep-linkable, KUX-005 §4.4);
- **Current Snapshot** — the representation as of now;
- **Historical Timeline** — its own evolution (§3.8);
- **Decision Anchors** — the snapshots bound to recorded decisions (§4.3);
- **Evidence Tree** — its explanation structure (§3.10);
- **Provenance Summary** — the sources and reconstruction lineage it stands on.

Anything claiming to be a Passport without all six is a profile wearing the name.

### 2.2 Passport Continuity

> **The Passport is never replaced. Never recreated. Never reset. It always evolves.**

Re-discovery enriches it; new evidence re-forms it; contestation reshapes it — but it is the same Passport, with the same identity and the same unbroken history. There is no "regenerate Passport" operation, because regeneration would sever the continuity that makes it living (§0) and auditable (§4.3). A Passport's age is part of its value: an institution evidenced over five years carries a depth no fresh reconstruction can imitate.

### 2.3 Passport Integrity

> **The Passport can never show something it cannot explain.**

An obvious-sounding rule that protects the entire product: every statement, figure, indicator, and recommendation rendered on the Passport must have a working descent path to its evidence *at the moment of rendering*. If explanation is unavailable (source offline, extraction pending), the statement is withheld or explicitly marked unexplainable-right-now — never displayed bare. Integrity is checked at the surface level: a Passport view that renders one unexplainable element fails its release gate.

---

## 3. Anatomy

Eleven sections compose the Passport. Order follows the Information Hierarchy (KUX-003 §7): synthesis first, forensic depth by descent. Every element carries the standard evidence anatomy (KUX-006 §9.2).

### 3.1 Identity
Who this is, evidenced: names and aliases, locations, organizational relationships (parent networks, departments, sites), external identifiers — each with its sources. Identity is itself evidence-based: conflicting or unresolved identity signals are shown as such, never silently merged (honest identity resolution).

### 3.2 Capabilities
The institution's evidenced capability candidates, organized by the Claim Taxonomy. Each capability shows: its status (candidate register — "evidence suggesting…"), its supporting claims and evidence, its gaps, its temporal state (fresh, aging, decayed), and its judgment history. Capabilities are the Passport's center of gravity for sponsors — and the most protected against certification language.

### 3.3 Claims
The full claim inventory beneath the capabilities: every Claim with its Confidence State (value + level + explanation entry, KEMS-001), its evidence classes present, its contested status, and its decay horizon. This is Medical Affairs' native grain (KUX-003 §2.4).

### 3.4 Evidence
The body of evidence itself: Evidence Nodes by class (A–F), source, date, and what each supports or contradicts. Filterable as a corpus; every node traceable to its document.

### 3.5 Documents
The source artifacts (Layer 0 roots): what was provided or discovered, when, and what was extracted from each. Documents are provenance anchors — never a file cabinet. Superseded documents remain in the chain (Contract clause 5).

### 3.6 Timeline
The reconstructed institutional history: studies, certifications, equipment, people, organizational changes — dated with honest precision ("estimated year" is a legitimate date), each event citing its evidence. The Timeline is where the institution's story becomes visible — the recognition moment lives here.

### 3.7 Confidence
The per-claim confidence landscape and its **trajectories**: which confidence states are rising, falling, decaying toward review. Never aggregated into an institution number (Canonical Product Law). Confidence here is a landscape to read, not a grade to award.

### 3.8 History
The Passport's own history: how this representation evolved — evidence arrivals, confidence movements, judgments, curation events, contested episodes and their resolutions. The History section is what makes "living" verifiable: the user can watch the Passport having changed.

### 3.9 Counter Evidence & Responses
Contested ground, first-class: every piece of counter evidence, the claims it contests, the institution's Right of Response entries, and resolution chains. Tension is shown, not resolved by the interface (KUX-002 §9.4). A Passport with visible, well-handled contestation is *more* credible, not less — the design treats this section accordingly.

### 3.10 Evidence Tree
The Explain instrument (KUX-002 §6): from any statement anywhere in the Passport, the descent — statement → claims → evidence nodes → documents — as a navigable structure. The Evidence Tree is not a section to visit; it is the mechanism behind every "why?" in every section, hosted in the Right Context Panel (KUX-004 §6) and expandable to the Work Area for deep exploration.

### 3.11 Recommendations
What would most improve this representation: gaps worth filling, documents worth requesting, decayed evidence worth refreshing, contested items worth resolving — each with reason and expected impact, in suggestion register. Exactly one is the Passport's next best action (P6); the rest are its queue. Recommendations serve the *representation*, never rate the institution.

---

## 4. Time — Reading the Passport at a Point

The "at a point in time" clause, operationalized:

1. **Default: now.** The Passport opens as of the present moment, and says so (Context Bar, KUX-004 §4).
2. **As-of navigation.** Any past moment is readable: "the Passport as of March 2026" shows what was known then — announced time-travel, never silent (P11). Evolution between two moments is viewable as a diff of knowledge: what arrived, what decayed, what was judged.
3. **Decision anchors.** Every decision recorded against this institution (Decision Ledger, KUX-006 §8) anchors a Passport snapshot: from the decision, one interaction opens "the Passport as it was when we decided." This is the Ledger's Evidence Snapshot made navigable.
4. **Aging is ambient.** Without any time-travel, the present Passport wears its age honestly: fresh, aging, and decayed evidence are visually distinct at a glance (KUX-002 §9.5); a Passport whose core evidence is three years old *looks* like it.

---

## 5. Working in the Passport

### 5.1 Decisions taken here

| Decision | Mechanism |
|---|---|
| Accept / challenge a Claim | Judgment Cycle in the Right Context Panel (KUX-006 §4.3); recorded with provenance |
| Endorse / dispute a capability finding | Same, at capability grain |
| Request evidence / documents from the institution | Recommendation → request, tracked as an open item |
| Trigger re-discovery | Refresh request (feeds Discovery) |
| Add to / remove from a Portfolio | Membership decision (KUX-007 §3) taken from Passport context |
| Flag a risk | Handoff to Risk Monitoring with the generating evidence |

**Not decided here:** site selection for a study (Feasibility's decision — the Passport informs it), risk resolution (KUX-011), portfolio strategy (KUX-007). The Passport is where institutions are *understood and judged*, not where studies are staffed.

### 5.2 Movements

The Passport is the product's deepest **Explain** surface — the Evidence Tree makes descent its native motion. Focus narrows within (identity → capabilities → one claim). Compare exits to Feasibility or Portfolio comparison with this institution carried along. Decide operates at claim/capability/membership grain (§5.1). A Passport reading session is a Reasoning Session when it serves an inquiry — parked and resumed with reconciliation like any other (KUX-005 §5).

### 5.3 Arrival

All roads lead here (KUX-003 §11: any mention of an institution, anywhere, leads to its Passport). Arrivals are oriented and carry their lens: from Portfolio (attention condition in context), from Feasibility (study requirements in context), from Risk (the generating evidence in context), from a shared deep link (the sender's exact view — Share is giving evidence in context, KUX-005 §4.4). The Passport under a lens highlights what the lens cares about without hiding the rest (re-frame, never re-write).

---

## 6. Honesty Machinery

The Passport is where Kadarn's epistemology faces the strongest commercial pressure — sponsors want scores and institutions want flattering profiles. The machinery that resists both:

1. **The Stability Indicator** (KUX-007 §9) applies at Passport level: Stable / Evolving / Under Review / Evidence Refresh Needed — the state of the knowledge, prominently placed, never a quality grade.
2. **Gaps are content** (P3): what the Passport does not evidence is a designed section of the capability view, with its own next actions — a thin Passport looks thin and says why, and *"reconstructed from 12 artifacts — request more"* is a legitimate, honest state.
3. **The forbidden register is enforced mechanically** on every Passport string: no "verified," no "certified," no "this site has," no score, no badge of quality (Lexicon §4 machine-checkable list; KUX-001 P8).
4. **Contestation is visible credibility** (§3.9): contested items are never buried to keep the Passport pretty. Elevated to a **Canonical Product Law**:

   > **A challenged Passport is not a weaker Passport. A transparently challenged Passport is a more credible Passport.**
5. **No completeness theater:** the Passport never displays a "profile completeness" meter (that gamifies declaration — profile logic, not evidence logic). Its improvement surface is Recommendations (§3.11), phrased as evidence work.

---

## 7. States

- **Young Passport (sparse):** honest thinness — what little is evidenced, shown with full anatomy; reconstruction and request actions dominate Recommendations; never padded to look complete (P1 + P3).
- **Reconstructing:** Discovery is actively working; truthful pipeline state; new findings land visibly with their provenance (KUX-004 §11).
- **Active / judged:** the default described throughout.
- **Contested-heavy:** multiple open disputes; the Passport foregrounds the contested landscape and its resolution paths without panic styling (*Calm*).
- **Stale:** core evidence past decay horizons; the Passport wears it ambient (§4.4), the Stability Indicator says Evidence Refresh Needed, and refresh is the next action. A stale Passport never silently presents as current — this is the profile-decay trap the entire product exists to escape.

---

## 8. Compliance and Acceptance

**The Defining Law (§0):** every section was checked against "living, explainable, at a point in time" — §3.8/§4 make living verifiable, §3.10 makes explainable structural, §4 makes temporality navigable.
**Sponsor Workspace Contract (KUX-006 §5):** all six clauses hold; clause 5 (evidence changes never invalidate history) is this workspace's §4.3 decision anchors and §3.8 history.
**Cognitive Invariants:** Passport always summarizes (descent always offered); Claim always belongs to this Institution; Decision always human (§5.1 judgments are attributed).
**Canonical Product Laws:** no aggregate judgment anywhere (§3.7); Compare exits rather than ranks; evidence before opinion is the document's spine.

**The four executable-spec questions:**

1. *Real decision?* — Yes: §5.1 catalog; and the Passport is the evidentiary basis of the sponsor's largest decision (site selection), anchored via Decision Ledger snapshots (§4.3).
2. *Less time to decision?* — Yes: one living representation replaces re-collection per study; arrival-with-lens eliminates re-orientation; the Evidence Tree answers "why" in one interaction instead of an email thread.
3. *Evidence visible without overload?* — Yes: eleven sections in strict hierarchy, synthesis-first; the Tree behind every statement rather than on every screen; aging ambient rather than tabular.
4. *Implementable without inventing behavior?* — Yes: anatomy enumerated with per-section rules, temporal behavior specified (default, as-of, anchors, aging), judgment mechanics specified, arrival semantics specified, states specified, prohibitions explicit (no edit, no scores, no completeness meter).

### Acceptance Criteria (Gate: Passport Approved — PASSED)

1. What law governs the workspace? — §0, held throughout.
2. What is the one question and the commercial need? — §1: the Passport *is* the product; it replaces self-reported, stale site profiles.
3. What is the Passport, and what is it not? — §2, with three consequences (no edit — Canonical Product Law; no "has"; one Passport, many lenses) and three object contracts: Passport Identity (§2.1), Passport Continuity (§2.2 — never replaced, recreated, or reset), Passport Integrity (§2.3 — never shows what it cannot explain).
4. What is its anatomy? — §3: eleven sections, each specified.
5. How does time work? — §4: now by default, as-of navigation, decision anchors, ambient aging.
6. What is decided here and what is not? — §5.1; movements §5.2; arrival semantics §5.3.
7. How does it resist becoming a scorecard or a brochure? — §6: five honesty mechanisms.
8. What are its states? — §7, including the stale state that names the profile-decay trap.

**Next document (Sprint UX-9):** KUX-009 — Feasibility Search.
