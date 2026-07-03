# KUX-002 — Product Design Language

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-002 |
| Status | Ratified |
| Depends on | KUX-001, KEMS-001, ADR-010, Lexicon v1.2 |
| Governs | The visual and semantic language of every Kadarn surface |
| Explicitly does NOT define | Components, buttons, colors, typography, icons, spacing, layouts, or any Design System artifact |

---

## 1. Purpose

This document defines the visual and semantic language that makes Kadarn feel like Kadarn — before a single screen is drawn.

It is not a Design System. It is the **grammar of the product**: how Kadarn thinks, how it communicates, and what every surface must transmit regardless of how it is eventually rendered. The Design System will be derived later, after the Information Architecture (KUX-003) and the Workspaces are defined. Any discussion of pixels, palettes, or components during the KUX-002 stage is premature and out of order.

What Kadarn must transmit is not "modern" and not "beautiful." Kadarn must transmit:

- **Confidence** — the interface knows what it knows, and shows how well it knows it.
- **Precision** — nothing vague, nothing approximate presented as exact.
- **Transparency** — the reasoning is always one step away.
- **Intelligence** — the product visibly works, reconstructs, and reasons.
- **Calm** — no urgency theater, no competing signals, no noise.
- **Professionalism** — an instrument for institutions, not a consumer app.

Every downstream design decision — in KUX-003 through the Workspace specifications and eventually the Design System — must be justifiable as an expression of these six transmissions.

---

## 2. The Evidence-first Interface

Kadarn introduces an interface stance that separates it from every CRM, directory, and administrative tool:

> **The interface never revolves around the object. It revolves around the evidence.**

The user does not see a Hospital — they see the evidence of the Hospital. They do not see a Passport — they see the evidence that constructs the Passport. They do not see a Risk — they see the evidence that generates the Risk.

The distinction looks subtle. It defines the entire product:

| Object-first interface (what Kadarn is not) | Evidence-first interface (what Kadarn is) |
|---|---|
| Shows a record with fields | Shows a reconstruction with sources |
| The detail view is a form | The detail view is a body of evidence |
| Editing changes the truth | Curation records a judgment about the evidence |
| Completeness is implied by filled fields | Support, gaps, and uncertainty are shown explicitly |
| History is an audit log in a tab | Evolution is part of the object's face (KUX-001 P11) |
| The object simply *is* | The object is *supported, contested, or insufficiently evidenced* |

**Consequences.** Every entity surface in Kadarn is an evidence surface. There is no screen where an institutional fact appears detached from what supports it. When a future workspace is designed and its central element is "the record," the design has drifted object-first and must be corrected before proceeding.

This stance operationalizes KUX-001 §3.1 (evidence reasoning workspace) and P4 (everything has provenance) at the level of visual and semantic language.

---

## 3. Information as Material

Kadarn does not treat information as text on a screen. **Information is the material the product is built from** — the way steel is the material of a bridge. Materials have physical properties that construction must respect; Kadarn's information has epistemic properties that design must preserve:

> Information is not decoration.
> Information has **weight**.
> Information has **provenance**.
> Information has **uncertainty**.
> Information has **time**.
> Every visual decision must preserve those properties.

- **Weight** — evidence strength and relevance are properties of the information itself, and its rendering must carry them (see §8, Evidence Gravity).
- **Provenance** — where information came from travels with it everywhere; stripping provenance from a piece of information deforms the material (KUX-001 P4).
- **Uncertainty** — confidence and coverage are part of the information, not annotations on it; a representation that drops them is showing different information (P3).
- **Time** — age, validity, and evolution are intrinsic (P11); information rendered without its temporal dimension is materially misrepresented.

This section connects the design language directly to KEMS: the properties of the Confidence Graph model are the properties of the material. A "clean" screen that achieves its cleanliness by stripping weight, provenance, uncertainty, or time has not simplified the material — it has adulterated it.

---

## 4. Design Attributes

Attributes, not components. Every Kadarn surface must be describable with all seven words — and none of their negations.

| Attribute | Means | Never means |
|---|---|---|
| **Precise** | Exact values, honest ranges, explicit precision ("estimated month", "approximate range") | False exactness; decorative decimals; rounding that hides uncertainty |
| **Calm** | Stable surfaces, few competing signals, quiet by default | Alarm aesthetics, badge storms, blinking urgency |
| **Evidence-driven** | Every statement visually anchored to its support | Free-floating assertions, unsourced summaries |
| **Contextual** | Every item carries where it came from, when, and what surrounds it | Isolated data points that force the user to reconstruct context |
| **Explainable** | The "why" is structurally present, one interaction away | Explanations buried in documentation or tooltips of tooltips |
| **Institutional** | Serious, durable, built for years of organizational memory | Playful, trendy, gamified |
| **Modern** | Current interaction expectations, no legacy enterprise clutter | Novelty for its own sake; fashion over function |

Attribute conflicts resolve by KUX-001's trade-off rule: honesty beats speed beats completeness. *Calm* never justifies hiding uncertainty (P3); *Modern* never justifies violating the Lexicon (P8).

---

## 5. Visual Tone

What sensation does Kadarn produce? Define it first by what it must never evoke:

- **It does not feel like a CRM.** No pipeline-and-quota energy, no records-with-owners mentality.
- **It does not feel like a financial dashboard.** No wall of KPIs implying that more numbers equals more insight.
- **It does not feel like a CTMS.** No form-driven compliance bureaucracy where the interface is the paperwork.
- **It does not feel like an admin panel.** Established in KUX-001 §3.1; restated here as tone.

It must feel like:

> **Mission Control for Institutional Intelligence.**

The Mission Control sensation decomposes into observable qualities:

1. **Situational awareness at a glance** — the state of the institution's evidence is legible in seconds (KUX-001 P7).
2. **Instruments, not decorations** — everything on screen measures, explains, or enables action; nothing exists to fill space.
3. **Trust in the readings** — every instrument can be interrogated down to its source (P2, P4).
4. **Calm under complexity** — high information capability with low ambient noise; density is available, never imposed.
5. **A living system** — the surface conveys that evidence is being gathered, evaluated, and aged continuously (P11), even while the user is away.

---

## 6. Information Density

Density is a decision, not an accident. The representation is chosen by the question the user is answering — never by the shape of the data.

| Representation | Use when the user asks | Rules |
|---|---|---|
| **Table** | "How do many homogeneous items compare on the same attributes?" | Only for genuinely homogeneous, scannable items (workbench queues, document inventories). Never as a landing surface (KUX-001 P7). Every row keeps the evidence anatomy: confidence, provenance, status, action. |
| **Card** | "What is the state of this one thing, summarized?" | For heterogeneous items that deserve individual identity (a Claim Candidate, a gap, a next action). A card is a summary with a descent path — never a dead end. |
| **Timeline** | "How did this evolve? What happened when?" | The canonical expression of P11. Events carry date precision honestly. Temporal navigation is an interaction, not an illustration. |
| **Graph** | "How is this connected? What supports or contradicts what?" | For relationship reasoning (evidence graphs, corroboration networks). Never used as visual spectacle; if the user cannot act on or interrogate a node, the graph does not belong. |
| **Evidence tree** | "Why does Kadarn believe this?" | The canonical expression of P2. A conclusion decomposes into contributions, contributions into Evidence Nodes, nodes into sources. Depth is progressive; the root is always a plain-language statement. |

Two global rules:

1. **Summary before density.** Every dense representation is reached *from* a synthesis, never instead of one.
2. **Density never deletes anatomy.** However compact the representation, confidence, provenance, temporal context, and status survive. If a representation cannot carry the anatomy, it is the wrong representation.

---

## 7. Visual Hierarchy

Hierarchy is semantic before it is visual. In every Kadarn surface:

**Primary — what the surface exists for:**
- The evidence statement or reconstruction being examined
- Its confidence, with its explanation entry point
- The one next action (KUX-001 P6)

**Secondary — what qualifies the primary:**
- Provenance, temporal context, status, warnings
- Curation and challenge affordances (present in place, quiet until relevant)

**Tertiary — what situates the user:**
- Navigation, filters, session context, identity

**Never competes:**
- Decoration does not exist as a hierarchy level; anything that neither informs nor enables action is removed, not de-emphasized.
- Two elements may not claim primary attention simultaneously. If a surface has two "most important" things, it is two surfaces.
- Alerts do not outrank the next best action. Urgency is expressed by reprioritizing the one next action, not by adding competing signals (P6, *Calm*).
- Navigation never dominates content. The shell serves the work; it is never the show.

---

## 8. Evidence Gravity

A concept native to Kadarn, introduced here as a law of the design language. It is a visual rule and an epistemological rule at the same time:

> **The stronger and more relevant the evidence, the more visual prominence it receives.**

Prominence in Kadarn is not assigned by feature priority, recency of development, or stakeholder enthusiasm. It is assigned by evidentiary mass. Corollaries:

1. **An inference may never look more important than the evidence that sustains it.** Derived conclusions orbit their sources, not the other way around.
2. **Low-confidence evidence may never visually dominate high-quality evidence.** Uncertainty is shown with dignity (P3), but dignity is not dominance.
3. **A recommendation never outranks its explanation.** The "what to do" is rendered subordinate to the "why," or at minimum inseparable from it (P2, P6).
4. **Recent evidence may visually displace older evidence when the context requires it** — temporality is a legitimate component of gravity (P11) — but displacement is contextual, never deletion: the older evidence remains reachable with its history intact.

Evidence Gravity is the force that makes Visual Hierarchy (§7) self-organizing on evidence-bearing surfaces: instead of deciding element by element what is primary, a surface that respects gravity lets the evidence itself settle into prominence. Every workspace specification must be able to answer, for each screen: *what has the most gravity here, and does the design give it the most prominence?*

---

## 9. Evidence Visualization Principles

This chapter is exclusive to Kadarn and is expected to become one of the product's differentiators. It defines *what must be visually expressible* — not how it will be drawn.

### 9.1 Evidence is visually distinct from inference

What Kadarn *found* (an Evidence Node, a document, an extracted entity) and what Kadarn *derived* (a capability candidate, a confidence state, a narrative sentence) are never rendered as the same kind of thing. The user must always be able to tell, without reading carefully, whether they are looking at source material or at Kadarn's reasoning over it.

### 9.2 Inference shows its lineage

A derived item is visually a *conclusion with roots*. Its representation always offers the descent into what produced it (the evidence tree, §6). An inference rendered without a visible path to its inputs is a violation, not a simplification.

### 9.3 Uncertainty is rendered, never omitted

Low confidence, partial coverage, and estimated precision have their own visual expression — with the same design dignity as certainty (P3). Uncertainty is never expressed by simply graying things out into ignorable noise, and never resolved by hiding the item. An honest "Kadarn is not sure" is a designed state.

### 9.4 Contradiction is visible tension

When Counter Evidence exists, the surface shows *both sides and the tension between them* — not the winner. A contested Claim visibly carries its contested state (P9). The visual language must be able to say "these two pieces of evidence disagree" without deciding for the user.

### 9.5 Temporality is ambient

Every evidence-bearing item can express: since when, how fresh, how it moved (P11). Age and decay are perceivable at a glance, not discoverable in a metadata panel. A confidence value is a *position in a trajectory*, and the trajectory is always available. Fresh and stale evidence are never visually identical.

### 9.6 Absence is drawable

Gaps are first-class visual objects: a missing document, an unconfirmed capability, an evidence-free period in a timeline. The language must be able to show *the shape of what is missing* — because requesting and filling gaps is a core user action, and users act on what they can see.

---

## 10. Decision Surfaces

Every Kadarn screen belongs to exactly one surface type. The type determines its rules. A screen that mixes types is redesigned or split.

| Surface | Exists to | Primary question | Rules |
|---|---|---|---|
| **Review Surface** | Judge machine output | "Is this right?" | Implements the full Review Loop (KUX-001 §6.1). Curation actions in place. Optimized for judgment speed (P10). |
| **Discovery Surface** | Watch and steer reconstruction | "What is Kadarn finding?" | Shows pipeline state honestly, surfaces the recognition moment, converts findings into review work. Never fakes progress. |
| **Comparison Surface** | Weigh alternatives | "Which one, and why?" | Compares on evidence, never on opaque aggregates. Differences trace to their supporting evidence. No ranking without explanation (KEMS-001). |
| **Decision Surface** | Commit to a course of action | "Do we proceed?" | States what evidence supports the decision, what is uncertain, and what is contested — before the commitment affordance. Records the decision with its evidentiary context. |
| **Monitoring Surface** | Detect meaningful change | "What changed since I last looked?" | Change-oriented, not inventory-oriented. Silence is a valid, designed state: "nothing meaningful changed" is information. Every signal links to the evidence that moved. |
| **Administration Surface** | Operate the platform itself | "Is the system configured and healthy?" | The only surface type where object-first interaction is acceptable (users, roles, connectors). Visually subordinate: administration is a utility room, never the lobby. Exempt from the evidence anatomy, not from the Lexicon. |

Every workspace specification (KUX-004 onward) must declare the surface type of each of its screens. The North Star Test (KUX-001 §11) applies to surfaces individually.

---

## 11. Interaction Language

Kadarn's verbs are part of its grammar. The interface speaks in acts of reasoning and judgment — not in acts of form processing.

**Canonical verbs:**

| Verb | The user is… |
|---|---|
| **Review** | examining machine output to judge it |
| **Accept** | recording agreement with a finding |
| **Challenge** | contesting a finding with counter evidence or response |
| **Investigate** | descending into the evidence behind a statement |
| **Explore** | moving through reconstructed material without a target |
| **Compare** | weighing alternatives on their evidence |
| **Monitor** | watching for meaningful change |
| **Resolve** | closing a contested or uncertain state |
| **Share** | giving another party access to evidence in context |
| **Trace** | following provenance to the source |

The curation vocabulary (Accept, Reject, Enrich, Defer, Needs More Evidence, Merge, Split, Archive) is fixed by the Curation API and is part of this language unchanged (KUX-001 consistency rule 2).

**Forbidden verbs on Kadarn surfaces:**

- **Submit** — users do not submit; they record judgments and provide evidence.
- **Approve** — adjacent to "Approved by Kadarn," which is forbidden language (Lexicon, P8). Institutional acceptance is expressed as *Accept*.
- **Verify / Certify** — retired by ADR-010; they assert truth Kadarn does not claim.
- **Manage / Administer** — outside Administration Surfaces, these verbs indicate an object-first screen that must be redesigned (§2).
- **Edit** (applied to evidence or findings) — evidence is never edited; it is curated, enriched, or challenged, and the judgment is recorded (P5).

---

## 12. Motion Philosophy

This section defines what movement *communicates* — not animations.

**Motion means exactly one thing in Kadarn: something changed.**

1. **Motion = state change.** A confidence state moved, an item changed review status, new evidence arrived, the next action was replaced. Motion draws the eye precisely because it is reserved for meaning.
2. **Motion expresses causality.** When a user acts, what their action changed moves; nothing else does. The Review Loop's fourth step (see the consequence) is motion's primary job.
3. **Motion expresses continuity.** Transitions preserve context: descending from summary to detail feels like descending, not like teleporting to an unrelated place (P7 — the user never re-orients).
4. **Motion is never decoration.** Ambient animation, attention-seeking loops, and celebratory effects contradict *Calm* and are excluded — not toned down, excluded.
5. **Stillness is a statement.** A surface at rest asserts "nothing has changed." That assertion must be true (it is the Monitoring Surface's contract). Gratuitous motion makes stillness meaningless and destroys the signal.

---

## 13. Decision Velocity

Kadarn does not only want better decisions. It wants to **reduce the time it takes to reach them**. The design language therefore optimizes a chain, in order:

```
Low cognitive load
      ↓
Fast understanding
      ↓
Confident decision
      ↓
Recorded outcome
```

- **Low cognitive load** — the surface presents only what the current question requires (§6, KUX-001 P7); everything else is one descent away, not on screen.
- **Fast understanding** — the Product Grammar's first three questions (§14) are answerable in seconds, because hierarchy and gravity already did the sorting (§7, §8).
- **Confident decision** — confidence comes from explainability, not from volume: the user decides because the "why" was available, not because every datum was displayed (P2).
- **Recorded outcome** — a decision that isn't captured with its evidentiary context evaporates; the loop closes only when the judgment is recorded (P5, and the Decision Surface contract in §10).

**The success of a screen is not how much it shows. It is how quickly the user understands what they must do.** Decision Velocity is the measurable expression of this language: when UX instrumentation is designed, time-to-understanding and time-to-confident-action on each surface type are the primary metrics — not engagement, not time-on-screen (which this language treats as a cost, not a win).

---

## 14. Product Grammar

Every Kadarn screen answers four questions, in this order, without the user asking:

> 1. **What am I looking at?**
> 2. **Why does it matter?**
> 3. **What changed?**
> 4. **What should I do next?**

- *What am I looking at* — the reconstruction, finding, or state, named in Lexicon terms, with its evidence anatomy.
- *Why does it matter* — the connection to a decision: confidence, coverage, risk, or opportunity, explainable in one interaction.
- *What changed* — the temporal dimension (P11): what moved since the user last looked, or the honest statement that nothing did.
- *What should I do next* — exactly one prioritized action (P6).

**If a screen does not answer all four questions, it is not finished.** This grammar is the working test that operationalizes the North Star Test during design: a screen that answers all four questions but still fails "would decisions get worse without it?" should not exist; a screen that passes the North Star Test but cannot answer the four questions is not yet designed.

---

## 15. Scope of Authority and Ratification

- KUX-002 governs the **language** of the product: what surfaces transmit, how information is represented, what words and movements mean.
- It defines no components, colors, typography, icons, or layouts. The Design System that eventually does must demonstrate, artifact by artifact, that it expresses this language.
- KUX-003 (Information Architecture & Mental Models) must organize the product using the surface types of §10. Workspace specifications must declare surface types, respect Evidence Gravity (§8), and pass the Product Grammar of §14.
- Where this document conflicts with KUX-001, KUX-001 prevails. Where it conflicts with the Lexicon or KEMS-001, they prevail.

KUX-002 is ratified with the following accepted as binding for all subsequent KUX documents: the Evidence-first Interface stance (§2), Information as Material (§3), Evidence Gravity (§8), the surface taxonomy (§10), the interaction language (§11), Decision Velocity (§13), and the Product Grammar (§14).

**Next document:** KUX-003 — Information Architecture & Mental Models.
