# KUX-1.0 — Sponsor Product Specification Freeze

| Field | Value |
|---|---|
| Series | KUX (Kadarn User Experience) |
| Document | KUX-1.0 (series closing document) |
| Kind | **Specification Freeze** — consolidation only; this document invents nothing |
| Status | Frozen · Ratified · Ready for Engineering |
| Authority | Consolidates KUX-001 through KUX-012, all individually ratified |

---

## 1. Purpose

This document formally closes the first generation of Kadarn Product Engineering. It consolidates the ratified KUX series into a single contract between Product Engineering and Engineering — the product-layer equivalent of what the Architecture Freeze (AF-1.0) is for KEMS.

Nothing in this document is new. Every statement herein cites a ratified source. Where this document and a ratified KUX document appear to differ, the ratified document prevails and this one must be corrected.

## 2. Scope

Frozen by this document: the complete Sponsor product specification — philosophy, language, information architecture, operating environment, movement, and the seven sponsor workspace specifications. Not frozen: anything listed in §8 (Deferred to KUX 2.0), and the underlying KEMS/architecture artifacts, which have their own freeze.

## 3. Ratified Documents

| Document | Title | Gate |
|---|---|---|
| KUX-001 | Product Experience Principles | Ratified |
| KUX-002 | Product Design Language | Ratified |
| KUX-003 | Information Architecture & Mental Models | Information Architecture Approved |
| KUX-004 | Workspace Shell: The Kadarn Operating Environment | Workspace Shell Approved |
| KUX-005 | Navigation Framework: Movement | Navigation Approved |
| KUX-006 | Sponsor Workspace | Sponsor Workspace Approved |
| KUX-007 | Portfolio Intelligence Workspace | Portfolio Workspace Approved |
| KUX-008 | Institutional Passport Workspace | Passport Approved |
| KUX-009 | Feasibility Workspace | Feasibility Approved |
| KUX-010 | Opportunity Discovery Workspace | Opportunity Discovery Approved (v1.0) |
| KUX-011 | Risk Monitoring Workspace | Risk Workspace Approved |
| KUX-012 | Notification & Attention Workspace | Notification & Attention Approved |

All documents live under `docs/kux/` (principles/, architecture/, workspaces/sponsor/). The authority chain remains: **Lexicon v1.2 > KEMS-001 > ADRs > KUX-001 > later KUX documents.**

## 4. Canonical Product Laws

The constitutional laws of the Kadarn product, consolidated. Each is binding on every surface, every workspace, and every future document until amended by an explicit Product Decision Record.

| # | Law | Source |
|---|---|---|
| 1 | **Evidence before opinion.** | Series-wide; KUX-001/002 spine |
| 2 | **The Institution is the persistent object. Everything else is context.** | KUX-003 §2.6 |
| 3 | **The Institutional Passport is the canonical representation of an Institution's evidence at a given point in time.** | KUX-003 §2.6 |
| 4 | **The environment persists. The content flows.** | KUX-004 §1 |
| 5 | **Users do not navigate Kadarn. They follow evidence toward a decision.** | KUX-005 §1 |
| 6 | **Compare degenerates into ranking.** (Every comparison surface is designed against this decay.) | KUX-005 §2.4 |
| 7 | **Kadarn is organized around decisions, not around screens.** | KUX-006 §0 |
| 8 | **Aggregate evidence, never judgment.** | KUX-007 §6.1 |
| 9 | **Every aggregate must be explorable.** | KUX-007 §6.2 |
| 10 | **Confidence thresholds belong to the user.** | KUX-009 §2.3 |
| 11 | **A Passport cannot be edited. It can only evolve through evidence and human judgment.** | KUX-008 §2 |
| 12 | **A challenged Passport is not a weaker Passport. A transparently challenged Passport is a more credible Passport.** | KUX-008 §6.4 |
| 13 | **Risk is a state of evidence, not a property of the institution.** | KUX-011 §2 |
| 14 | **Notifications are a mechanism. Attention is the product.** *(Every interruption spends credibility.)* | KUX-012 §1 |

Supporting constitutional instruments (not laws, but binding review gates): the North Star Test (KUX-001 §11), the Experience Pillars (KUX-001 §4), the Decision Framework (KUX-001 §8), the Product Grammar (KUX-002 §14), the Cognitive Invariants (KUX-003 §12), the Workspace Integrity Rule (KUX-004 §14), and the four executable-spec questions (README, KUX-006+ gates).

## 5. Workspace Contracts

| Contract | Clauses | Source |
|---|---|---|
| **Sponsor Workspace Contract** (inherited by every surface) | 1. Context is never lost. 2. Evidence is always reachable. 3. Decisions are always explainable. 4. Reasoning is resumable. 5. Evidence changes never invalidate history. 6. Human judgment is always explicit. | KUX-006 §5 |
| **Passport Object Contracts** | Passport Identity (six mandatory elements); Passport Continuity (never replaced, recreated, or reset); Passport Integrity (never shows what it cannot explain). | KUX-008 §2.1–2.3 |
| **Risk Workspace Contract** (adds to Sponsor Contract) | 7. No risk without evidence. 8. No silent risk. 9. No unattributed tolerance. 10. No institutional stigma. | KUX-011 §15 |
| **Attention Admission Rule** | No communication is delivered, on any channel, unless it states what changed, carries its evidence, lands oriented, and can produce its full Attention Provenance chain. | KUX-012 §2, §8 |

A build that violates any contract clause is not an incomplete implementation — it is not the specified product (KUX-006 §5).

## 6. Acceptance Gates

All twelve gates listed in §3 are **PASSED**. Each ratified document carries its acceptance criteria section answering, item by item, what the gate required. For KUX-006 onward, every gate additionally answered the four executable-spec questions: (1) helps a real decision, (2) reduces time to it, (3) evidence visible without overload, (4) implementable without inventing behavior.

## 7. Cross-document Invariants

The eight objects that hold the specification together, each with its consolidated invariant:

| Object | Invariant | Anchors |
|---|---|---|
| **Institution** | The persistent object; always exists; everything else is context | KUX-003 §2.6, §12 |
| **Passport** | Always summarizes; canonical representation at a point in time; living, explainable, never edited, never reset | KUX-003, KUX-008 |
| **Evidence** | Always has provenance; always one interaction away; its properties (weight, provenance, uncertainty, time) survive every rendering | KUX-001 P4, KUX-002 §3, KUX-003 §12 |
| **Movement** | Five movements (Explore, Focus, Explain, Compare, Decide); every transition preserves context; no traps, no teleports, no dead ends | KUX-005 |
| **Attention** | Tiered by decision impact; explainable via Attention Provenance; silence is designed; the active-decision floor cannot be muted away | KUX-012, KUX-004 §10, §13 |
| **Decision** | Always belongs to a human; always shows its basis before commitment; always recorded with Decision Provenance; anchored in the Decision Ledger and monitored thereafter | KUX-003 §2.7, KUX-005 §6, KUX-006 §8 |
| **Reasoning** | Lives in Reasoning Sessions bound to one institutional question; parkable, resumable, honest on resume | KUX-005 §5 |
| **Monitoring** | Dependency-scoped, evidence-generated, lead-time-oriented; declares its own blindness; remembered by Monitoring Memory | KUX-011 |

The four memories of the system: **Reasoning Sessions** (inquiry-scoped), **Decision Ledger** (decision-scoped), **Portfolio Memory** (observation-scoped), **Monitoring Memory** (vigilance-scoped) — KUX-005 §5, KUX-006 §8, KUX-007 §7, KUX-011 §11.

## 8. Deferred to KUX 2.0

Consciously out of scope for this freeze. Their absence is a decision, not an omission:

- **Institution Workspace** (the institution-facing experience; `workspaces/institution/` reserved)
- **Public Workspace** (`workspaces/public/` reserved)
- **AI Copilot** (conversational assistance over the evidence model)
- **Mobile Companion & Responsive Strategy** (originally UX-13; to be designed, not adapted)
- **Accessibility & Product Polish specification** (originally UX-14; WCAG conformance remains a baseline engineering obligation regardless — deferring the *document* defers no legal or quality bar)
- **Enterprise Administration** (beyond the Administration surface's utility-room scope)
- **Cross-workspace orchestration** (multi-workspace automation)
- **Predictive Intelligence** (forecasting over evidence; must clear the epistemological bar before any design)
- **Decision Ledger dedicated surface** (concept ratified in KUX-006 §8; its own workspace treatment deferred)

## 9. Engineering Readiness

Formal declaration:

> **The Sponsor Product Specification is complete.**
> **Engineering teams must implement behavior defined in KUX.**
> **Product behavior may not be invented during implementation.**
> **Any behavioral deviation requires a Product Decision Record or ADR.**

Implementation guidance already in force: every surface declares its one question and its surface type; every release is verified against the applicable Workspace Contract; every user-facing string passes the Lexicon's machine-checkable forbidden-terms list; every design review opens and closes with the North Star Test.

## 10. Version

```
KUX Sponsor Product Specification

Version   1.0
Status    Frozen
          Ratified
          Ready for Engineering
```

With this document, the work changes in nature: from discovering how the Sponsor Workspace must behave, to implementing it with fidelity.
