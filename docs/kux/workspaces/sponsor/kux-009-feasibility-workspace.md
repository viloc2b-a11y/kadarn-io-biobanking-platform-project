# KUX-009 — Feasibility Workspace

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-009 |
| Sprint | UX-9 (Phase 10 — Sponsor Intelligence Workspace) |
| Status | Ratified — Gate passed: Feasibility Approved |
| Kind | **Product specification** |
| Depends on | KUX-001 – KUX-008 (all ratified); Claim Taxonomy v1.0 |
| Governs | The Feasibility workspace: study requirements, natural search, filters, explainable matching, shortlists, and the site-selection decision |
| Explicitly out of scope | Unsolicited matching (Opportunity Discovery, KUX-010), risk mechanics (KUX-011), Passport internals (KUX-008), wireframes, visual design, components, technology |

---

## 1. The One Question — and the Commercial Need

> **"Who satisfies this need?"**

Where "this need" is always concrete: a protocol, with requirements, looking for institutions.

**The commercial need.** Feasibility today is a questionnaire blast: sponsors send forms to dozens of sites, wait weeks, and receive self-reported answers that are optimistic, unverifiable, and already aging. Site selection — the sponsor's most expensive recurring decision — runs on the weakest evidence in the industry. This workspace inverts it: the sponsor searches over *already-evidenced* capability, sees per-requirement support with its evidence, and reaches a defensible shortlist in hours instead of weeks. This is the Feasibility Cycle (KUX-006 §4.2) — the workspace's economic core and the sponsor's entry motive: *"I need to find institutions suited for this protocol."*

**Rhythm:** fast · exploratory (KUX-004 §12). **Surface types:** Discovery + Comparison, terminating in Decision. **Primary mind:** the Feasibility Lead (KUX-003 §2.3), whose fear — false positives — this specification is designed against.

---

## 2. The Study Requirements Profile

Feasibility begins with the need, made explicit. The **Study Requirements Profile** is the workspace's founding object — a contextual object carrying intent (KUX-003 §4.2), owned by the sponsor, disposable without touching evidence.

Composition:

| Requirement type | Expressed as | Example |
|---|---|---|
| **Capability requirements** | Claim-taxonomy needs, marked required or preferred | `biospecimen.processing.pbmc` — required |
| **Geography** | Regions/countries the study operates in | Spain, Portugal |
| **Population** | Evidenced access to the study population | Oncology patient population access |
| **Study history** | Timeline-evidenced experience | Prior phase-II oncology studies, last 5 years |
| **Confidence thresholds** | Minimum confidence per requirement, set explicitly by the user | "Required capabilities at Moderate confidence or above" |

Rules:

1. **Requirements are explicit and inspectable.** The profile is a first-class object the whole team can read — no criteria hidden inside a search box.
2. **Requirements are versioned.** Protocols evolve; the profile records its changes, and shortlists reference the version they were built against (Contract clause 5).
3. **Thresholds belong to the user.** Confidence thresholds are sponsor decisions, visible and adjustable — never invisible defaults doing silent gatekeeping (KUX-005 §2.2: silent filters are the corruption of Focus).
4. **The profile speaks the taxonomy.** Requirements bind to Claim Taxonomy entries so that matching is evidence-addressable — free-text requirements are interpreted into taxonomy terms with the interpretation shown (§3).

---

## 3. Natural Search

The differentiated entry: the Feasibility Lead expresses need in their own words —

> *"PBMC processing sites in Spain with oncology trial experience"*

— and Kadarn interprets it against evidenced capability. The rules that keep this honest (extending the shell Search Model, KUX-004 §9):

1. **Interpretation is shown, always.** The query decomposes visibly into requirement candidates ("PBMC processing → `biospecimen.processing.pbmc`, required; Spain → geography; oncology experience → study history"). The user confirms or adjusts — the interpretation is itself explainable (P2 applies to the search, not just its results).
2. **Interpretation feeds the profile.** A confirmed natural search *is* a Study Requirements Profile draft — search and profile are one object at two fidelities, not two systems.
3. **No hallucinated requirements.** Terms that don't map to the taxonomy are surfaced as unmapped ("'GMP-adjacent' — no taxonomy match; refine or drop?"), never silently guessed.
4. **Question-tolerant, not oracle-styled.** The search understands intent phrasing; it never performs fake omniscience — what it cannot interpret, it says.

---

## 4. Filters

Filters are the Focus movement made mechanical (KUX-005 §2.2). All filters share three rules: always visible while active, always reversible, and always countable — every filter states how many candidates it excludes ("this threshold removes 6").

| Filter family | Operates on |
|---|---|
| **Evidence filters** | Evidence classes present (A–F), evidence freshness, contested status |
| **Capability filters** | Candidate status, supporting-evidence depth, gap presence |
| **Geography** | Evidenced locations (from Identity, KUX-008 §3.1) |
| **Population** | Evidenced population access claims |
| **Study history** | Timeline-evidenced experience: phases, therapeutic areas, recency |
| **Confidence thresholds** | Per-requirement minimum confidence, from the profile (§2) |

The exclusion ledger: at any moment, the workspace can answer *"who was excluded, and by which filter?"* — exclusions are explorable (the aggregate-explorability law applied to search: "requirement X eliminated 14 candidates" opens into those 14). A false negative discovered here is recoverable; one buried in a silent filter is a lost site.

---

## 5. The Match — Explainable Matching

The heart of the workspace, and the place where every competitor reaches for a score. Kadarn does not.

**A match is a per-requirement support assessment**, not a number:

| Assessment | Meaning |
|---|---|
| **Supported** | Evidence suggests the requirement is met, at the stated confidence |
| **Partially supported** | Some supporting evidence; below threshold or with material gaps |
| **Gap** | No evidence found for this requirement |
| **Contradicted** | Counter evidence exists against this requirement |

The match display is a **requirements × evidence matrix**: for each candidate, each requirement's assessment — every cell explainable (descend to the claims and evidence behind it, KUX-005 §2.4), every cell temporal (freshness visible, P11).

**Ordering without ranking.** Results are organized by **match completeness categories** — categorical, explainable groups, never a composite score:

1. *All required — evidenced* (at or above thresholds)
2. *All required — with partial support*
3. *Gaps on required requirements*
4. *Contradictions present*

Within a category, ordering is by a **single, explicit, user-chosen dimension** (count of evidenced requirements, evidence freshness, geography) — stated in the Context Bar, changeable, and decomposable. There is no default "best match" ordering, no relevance percentage, no hidden weighting. The Canonical Design Law (KUX-005 §2.4) governs: the moment this matrix collapses into one sortable number, Kadarn has become a certification authority again.

**Match honesty rules:**

1. A gap is a finding, not an absence — "no evidence found" is displayed content with a next action (request from candidate), never a blank (P3; KUX-002 §9.6).
2. Contradicted requirements are shown with their tension (KUX-002 §9.4) — a contradicted candidate is not auto-excluded; the human weighs it.
3. Match assessments age: the matrix shows evidence freshness per cell, and a resumed feasibility session reconciles matches against evidence changes (KUX-005 §5.4).
4. The match never claims operational certainty: it assesses *evidenced capability*, and says so — activation performance is Risk Monitoring's later concern.

---

## 6. The Shortlist

The shortlist is where search becomes judgment — a contextual object with full decision mechanics:

1. **Inclusion and exclusion are decisions**, each recorded with provenance (KUX-005 §6): including a candidate cites its match state; excluding one cites the reason — a threshold, a gap, a contradiction ("excluded: storage claim contradicted by failed calibration record"). Six months later, *"why wasn't site Y considered?"* has an answer.
2. **The shortlist is a living subset**: while the session is open, evidence changes at shortlisted candidates surface as reconciliation items (a shortlist built Tuesday is re-verified Thursday).
3. **Evidence requests are shortlist work**: for gaps at promising candidates, the workspace issues trackable evidence requests — feasibility becomes a targeted evidence conversation instead of a questionnaire blast. Requests and their fulfillment feed Discovery and the candidate's Passport.
4. **The shortlist is shareable** as evidence in context (deep links, KUX-005 §4.4): a shared shortlist shows the matrix, the reasoning, and the open questions — not a list of names.

---

## 7. Search Provenance

Every executed search leaves a reproducible context — Decision Provenance's upstream twin:

```
Search
   ↓
Study Requirements Profile (version)
   ↓
Thresholds
   ↓
Filters
   ↓
Evidence Snapshot        (what Kadarn knew at execution time)
   ↓
Results                  (including the exclusion ledger)
```

Rules:

1. **Every executed search is recorded** with this full chain. Six months later, the search reproduces exactly: same profile version, same thresholds, same evidence snapshot — same results.
2. **Re-running against the present is a diff, not a repeat.** Re-executing an old search against current evidence shows what changed: who entered, who left, which assessments moved, and why (P11 applied to search itself).
3. **Search Provenance feeds Decision Provenance.** When a selection is made (§10), the search chain that produced the candidates is part of the decision's basis — *"why was site Y never considered?"* is answerable from the decision itself.

## 8. Feasibility Narrative

After execution, the workspace delivers its result as operational narrative — not creative prose, and not a bare count:

> *"Four institutions fully support the current requirements. Three require updated cold-chain evidence. Two satisfy the protocol if PBMC processing is considered optional. One institution was excluded due to unresolved counter-evidence."*

Rules (inheriting the narrative discipline of KUX-007 §8):

1. Every sentence cites — each statement opens into the candidates and assessments behind it (every aggregate explorable).
2. The narrative is decision-ranked: what blocks selection first, what is conditional next, honest reassurance last.
3. It states actionable conditionals ("if PBMC is considered optional…") — surfacing threshold and requirement sensitivity without deciding for the user.
4. It never editorializes institutional quality; it reports match states and their reasons.

## 9. Candidate Evolution

A candidate is never frozen at `Match | No Match`. Candidates **evolve** — the match matrix is a temporal surface (P11):

```
Gap
   ↓ evidence uploaded / discovered
Supported
   ↓ thresholds met, judgment endorsed
Decision Candidate
```

— and equally in reverse: `Supported → counter-evidence arrives → Contradicted → resolved → Supported`.

Rules:

1. **Per-candidate trajectory is tracked** within the profile's context: when and why each assessment changed, visible as the candidate's evolution line.
2. **Evidence requests drive evolution** (§6.3): a request fulfilled moves the candidate visibly — feasibility becomes a progressing conversation, not a snapshot re-run.
3. **Evolution generates reconciliation, not silent updates**: an open session or shortlist surfaces candidate movements as review items (KUX-005 §5.4); nothing changes state behind the user's back.
4. **Excluded is not terminal**: an excluded candidate whose condition resolves (contradiction cleared, gap filled) resurfaces as an evolution event — recoverable false negatives are the exclusion ledger's payoff (§4).

## 10. From Search to Decision

The complete movement chain (the canonical Reasoning Session, KUX-006 §6):

- **Compare** — finalists side by side under KUX-005 §2.4 rules: per-requirement, explainable, temporally honest, never ranked.
- **Explain** — Passports under the study lens (KUX-008 §5.3): the Passport highlights what the requirements care about without hiding the rest.
- **Judge** — claims material to the selection get reviewed/endorsed in place (Judgment Cycle), pulling Medical Affairs in via shared links.
- **Decide** — site selection, the sponsor's most expensive recurring decision, taken on a Decision Surface (KUX-002 §10): supporting claims, confidence states, open gaps, and contested items shown *before* commitment; recorded with full Decision Provenance and a Passport snapshot anchor per selected site (KUX-008 §4.3). The Decision Ledger entry closes the session — and opens the standing watch (Risk Monitoring inherits the decision's basis).

Every feasibility session ends in selection, a parked session, or a documented no-fit ("no candidates satisfy the profile — here are the closest, and here is what evidence would change that") — never in ambiguity (KUX-006 §4).

---

## 11. States

- **No results:** the most important state. Never a bare empty list — the workspace shows *why*: which requirement eliminated whom (exclusion ledger, §4), what relaxation would change the outcome ("lowering the PBMC threshold to Low admits 4 candidates — with these risks"), and what evidence requests could fill the gap. A no-result search that explains itself is a finding; one that doesn't is a dead end (KUX-005 §5 anti-patterns).
- **Thin-evidence region:** when the search touches a geography or capability where Kadarn's evidence is sparse, the workspace says so explicitly — "coverage in this region is thin; results reflect Kadarn's evidence, not the market" (P3 at corpus scale; the honest asymmetry that keeps false negatives from masquerading as market truth).
- **Reconstructing candidates:** candidates with active Discovery runs are marked; their matches carry "evidence still arriving" status.
- **Quiet/parked:** an open feasibility session parks and resumes with reconciliation like any session (KUX-005 §5).

---

## 12. Compliance and Acceptance

**Sponsor Workspace Contract:** context preserved across search → matrix → Passport → comparison (1); every cell descends (2); selection shows basis before commitment and records provenance after (3); sessions resumable with reconciliation (4); requirement versions and exclusion reasons archived (5); inclusions, exclusions, and judgments attributed (6).

**Canonical Laws honored:** no match score, no best-match ranking (Compare degenerates into ranking); match categories aggregate evidence states, never judgment (Aggregate evidence, never judgment); every aggregate — category counts, exclusion counts — explorable.

**The four executable-spec questions:**

1. *Real decision?* — Yes: site selection, the sponsor's most expensive recurring decision, plus shortlist inclusion/exclusion and evidence requests — all with provenance.
2. *Less time to decision?* — Yes: hours over evidenced capability instead of weeks of questionnaires; the exclusion ledger kills re-litigation; targeted evidence requests replace blanket forms.
3. *Evidence visible without overload?* — Yes: matrix of assessments with descent on demand; categories before detail; freshness ambient per cell.
4. *Implementable without inventing behavior?* — Yes: requirement types enumerated, interpretation rules specified, filter families and their three shared rules specified, match assessments enumerated with ordering semantics, shortlist mechanics and decision flow specified, states specified including no-results behavior.

### Acceptance Criteria (Gate: Feasibility Approved — PASSED)

1. What is the one question and the commercial need? — §1: replaces the questionnaire blast; the sponsor's entry motive.
2. How is the need expressed? — §2: the Study Requirements Profile — explicit, versioned, taxonomy-bound, user-owned thresholds.
3. How does natural search stay honest? — §3: interpretation shown, unmapped terms surfaced, search and profile are one object.
4. How do filters avoid silent gatekeeping? — §4: visible, reversible, countable; the exclusion ledger.
5. What is a match, and how are results ordered without ranking? — §5: per-requirement assessments; completeness categories; single explicit user-chosen sort; no composite score.
6. What is the shortlist? — §6: a living, judged, shareable subset with recorded inclusion/exclusion reasoning and evidence requests.
7. Is a search reproducible? — §7: Search Provenance — profile version, thresholds, filters, evidence snapshot, results; re-running is a diff; feeds Decision Provenance.
8. How is the result delivered? — §8: Feasibility Narrative — cited, decision-ranked, conditional-surfacing, never quality-editorializing.
9. Do candidates evolve? — §9: Candidate Evolution — temporal match states, evidence-driven trajectories, reconciliation not silent updates, exclusion is not terminal.
10. How does search become a traceable decision? — §10: Compare → Explain → Judge → Decide with Decision Provenance and Passport anchors.
11. What happens when there are no results? — §11: the explained no-fit; thin-evidence honesty.

**Next document (Sprint UX-10):** KUX-010 — Opportunity Discovery.
