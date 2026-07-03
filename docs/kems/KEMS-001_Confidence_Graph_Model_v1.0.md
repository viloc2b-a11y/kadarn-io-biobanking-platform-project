# KEMS-001 v1.0 — The Kadarn Confidence Graph Model

**Status:** Reconstructed Canonical Draft pending ratification

---

## Reconstruction Note

This file was found absent from the repository. No original KEMS-001 document text exists in version control at the time of this reconstruction (2026-07-03). This draft was triangulated entirely from artifacts that cite KEMS-001 by section number, specifically:

- `openspec/ratificacion-kems-001.md` — the ratification record for KEMS-001 v1.0, including its full Retired Terms Registry table (reproduced verbatim in §10 below) and its list of open questions (§5 here).
- `docs/domain/claim-taxonomy-v1.0.md` — cites KEMS-001 §1 (Claim), §2 (Confidence Graph), §3 (Evidence Class A–F), §4 (Counter Evidence).
- `database/migrations/045_evidence_core.sql` — implements the KEMS-001 §2/§3/§7/§8 data model; its inline comments cite KEMS-001 by section throughout.
- `packages/evidence-core/src/confidence-state.ts` — implements the `ConfidenceState` type per "KEMS-001 §2 Component D", including the explainability mandate (§6) and the exact field shape reproduced in §2 below.
- `docs/adr/adr-010-trust-engine-retirement.md` — cites KEMS-001 as the model that supersedes the Trust paradigm, and references §5 as leaving the confidence algorithm as an explicit open question.
- `docs/adr/adr-011-evidence-core-boundary.md` (existing ADR referenced by the migration header) — establishes that the Evidence Core stores/relates/persists but does not compute Confidence, which this draft treats as consistent with KEMS-001's own boundary.

Sections or sub-details not evidenced by any citing artifact are marked **SOURCE-SILENT** below rather than invented. In particular, §5 (the Confidence algorithm) is explicitly deferred by the ratification record itself and is NOT reconstructed as a formula — see §5.

**Merged 2026-07-03: schema-aligned reconstruction unified with previously tracked draft's Architectural Boundaries and KEMS-003 relationship sections (RC-0.3).**

---

## §1 — Claim

A **Claim** is a bounded assertion about institutional capability. A Claim is never an opinion, a ranking, or a reputational judgment.

Per `docs/domain/claim-taxonomy-v1.0.md`:

> A Claim represents a capability that can be supported or contradicted by evidence. Claims never represent opinions, rankings, reputations, or institutional value judgments.

A Claim is valid if and only if:
1. It uses only terms from the Lexicon.
2. It can be represented by a Confidence Graph (§2).
3. It admits at least one valid Evidence Class (§3, A–F).
4. It can be contradicted by Counter Evidence (§4).

Migration 045 comment: *"KEMS-001 §1: A Claim is a bounded assertion about institutional capability."*

---

## §2 — The Confidence Graph

The Confidence Graph is composed of the following components:

- **Component A — Claim**: the bounded assertion (§1).
- **Component B — Evidence Node**: an immutable, append-only unit of evidence attached to a Claim. Evidence Nodes may not be updated or deleted; corrections are made by appending a new node that supersedes the prior one (`wasRevisionOf` / `supersedes` relationship pattern).
- **Component C — Evidence Relationship**: a typed connection between Evidence Nodes (`supports`, `contradicts`, `corroborates`, `responds_to`, `supersedes`).
- **Component D — Confidence State**: the emergent, per-Claim output of the graph. Per `packages/evidence-core/src/confidence-state.ts:37-52`, a Confidence State has the shape:

```ts
interface ConfidenceState {
  claimId: string;
  value: number;              // Confidence Value, 0-100
  level: ConfidenceLevel;     // 'high' | 'moderate' | 'low' | 'insufficient'
  lastUpdated: string;        // ISO 8601
  explanation: string;        // MANDATORY — see §6
  contributions: ConfidenceContribution[];
  hasUnresolvedCounterEvidence: boolean;
}
```

A `ConfidenceContribution` records, per contributing Evidence Node: the node ID, its Evidence Class, its individual weight, and a human-readable description of that contribution.

The Confidence State is **not per organization** — it is per Claim. This is the central departure from the retired Trust model (see §10).

---

## §3 — Evidence Classes

KEMS-001 defines six Evidence Classes, A through F, each with a default decay period (in months; null = no decay) and a default weight. Reproduced exactly from `database/migrations/045_evidence_core.sql` (Part 2, KEMS-001 §3 reference data):

| Class | Name | Description | Decay (months) | Default Weight |
|-------|------|--------------|-----------------|-----------------|
| A | Public Independent Evidence | Evidence from public registries verifiable without relying on the institution. | 60 | 0.80 |
| B | Institutional Documentary Evidence | Evidence from the institution in the form of structured documents. | 24 | 0.50 |
| C | Operational Evidence | Evidence generated automatically by operational systems as a byproduct of execution. | 12 | 0.70 |
| D | Cross-Source Corroboration | Structural consistency when independent sources agree. | null | 0.00 |
| E | Temporal Continuity Evidence | Evidence of consistent capability maintenance over time. | null | 0.00 |
| F | External Confirmation | Evidence from an independent third party confirming capability. | 36 | 1.00 |

Note that Classes D and E carry a default weight of 0.00 — they are structural/corroborative signals rather than direct evidentiary weight contributors. The exact mechanism by which D and E influence the Confidence Value is **SOURCE-SILENT** (not specified in any citing artifact); see §5.

---

## §4 — Counter Evidence

Counter Evidence is evidence that contradicts a Claim. Per the schema (migration 045, Part 4), Counter Evidence:

- Is represented as an Evidence Node with `is_counter_evidence = true`.
- Carries a **negative weight** (`weight < 0`), enforced by a database constraint (`counter_evidence_negative_weight`).
- May have a `response_id` linking to a Right of Response (§8); non-counter-evidence nodes must not have a response.
- Cannot be deleted — the append-only enforcement (triggers `evidence_nodes_no_update` / `evidence_nodes_no_delete`) applies equally to Counter Evidence.

A Claim's Confidence State tracks `hasUnresolvedCounterEvidence` as a first-class boolean (§2, Component D) — unresolved Counter Evidence is visible in the Confidence State itself, not hidden.

---

## §5 — Confidence Algorithm (SOURCE-SILENT — explicitly deferred)

**No formula is reconstructed here.** This is not an omission — it reflects the actual state of KEMS-001 as ratified.

Per `openspec/ratificacion-kems-001.md:69-70` (Open questions, not resolved by KEMS-001, do not block ratification):

> Confidence algorithm specifics (how the graph produces a value 0-100) — resolved in: Future ADR (post-Freeze).

`docs/adr/adr-010-trust-engine-retirement.md` (Decision 3) independently confirms: *"KEMS-001 §5 leaves the algorithm as an open question. A future ADR may define a Confidence Engine or delegate confidence computation to the Intelligence Engine or another mechanism. This ADR does not pre-judge that decision."*

The Evidence Core (per ADR-011) deliberately does not compute Confidence — computation is an Engine-layer concern, explicitly out of scope for the Core and for this document.

---

## §6 — Explainability Mandate

No Confidence Value may be presented without an accompanying explanation. This is enforced structurally:

- `ConfidenceState.explanation: string` is a non-optional field (`packages/evidence-core/src/confidence-state.ts:46`, marked "KEMS-001 §6 — mandatory").
- `confidence_state_snapshots.explanation` is `NOT NULL` in the schema (migration 045, Part 7).
- Every `ConfidenceContribution` also carries its own `description`, so the explanation is navigable down to the level of individual contributing Evidence Nodes, not just a single top-level summary string.

---

## §7 — Visibility Model

Evidence and Claims carry a `visibility_scope` with three values (migration 045, Part 1 enum `visibility_scope`; cross-referenced by ADR-011):

- `site` — visible to the owning organization only.
- `sponsor_authorized` — visible to specific sponsor actors named in `authorized_sponsor_ids`.
- `system` — visible platform-wide.

Row-Level Security policies in migration 045 (Part 8) enforce this at the database layer for `claims`, `evidence_nodes`, `evidence_relationships`, `right_of_response`, and `confidence_state_snapshots` — each table has explicit `_select_org`, `_select_sponsor`, and/or `_select_system` policies matching this three-way model.

---

## §8 — Right of Response

Counter Evidence (§4) may receive a **Right of Response** without modifying the Counter Evidence itself. Per migration 045 (Part 6):

- A `right_of_response` row attaches to a `counter_evidence_id` (an Evidence Node with `is_counter_evidence = true`).
- It carries its own `status` lifecycle: `submitted → accepted | rejected | confirmed`.
- It may cite `supporting_evidence_ids`.
- Once submitted, its substantive fields (`description`, `resolution_date`, supporting evidence, provenance) are immutable — only the `status` may transition, and only by the owning organization (RLS policy `right_of_response_update_org`).

This preserves the original Counter Evidence unmodified while giving the challenged party a structured, auditable channel to respond.

---

## §9 — Temporal Metadata and Decay

Each Evidence Class (§3) carries a `decay_months` value. Where non-null (Classes A, B, C, F), evidence contribution is understood to diminish over time on that schedule; Classes D and E (structural/corroborative) do not decay (`decay_months = NULL`).

Claims themselves carry decay metadata at the Claim level (migration 045, Part 3): `decays: boolean` and `decay_period_months`, enforced together by a check constraint (`claim_decay_consistent`) so a Claim cannot claim non-decay while specifying a decay period, or vice versa.

All Core tables carry `created_at` / `updated_at` timestamps, and provenance is captured via `correlation_id`, `created_by_actor_id`, `created_by_org_id`, and a free-text `provenance_summary` — consistent across `claims`, `evidence_nodes` (via a `provenance` JSONB blob), `right_of_response`, and `confidence_state_snapshots`.

The precise decay function (e.g., linear vs. exponential falloff, and how it composes with the §5 algorithm) is **SOURCE-SILENT**.

---

## §10 — Retired Terms Registry

Reproduced verbatim from `openspec/ratificacion-kems-001.md:50-59` ("Conceptos sustituidos"):

| Retired Concept | Replaced By | KEMS Reference |
|-------------------|---------------|-----------------|
| Trust Score | Confidence State (per Claim, with explanation) | §2 — Component D |
| Trust Engine (as Core Engine) | Confidence Engine | KEMS preamble |
| Trust Graph | Evidence Graph | §2 — The Confidence Graph |
| Trust Fabric | (not replaced — redundant) | KEMS preamble |
| Trust Level: Gold / Silver / Bronze | Confidence Level: High / Moderate / Low / Insufficient | §2 — Component D |
| Verified (as in "this site is Verified") | "Supported by Evidence" with Evidence Class and source | §3 |
| Institutional Certification | External Confirmation (Class F) | §3 — Class F |
| Trust Score (numeric 0.0-1.0) | Confidence Value (numeric 0-100) | §2 — Component D |

From the effective date of ratification (2026-07-01, per AF-1.0), all new documentation, code, and communication must use only the right-hand column vocabulary above.

---

## §11 — Architectural Boundaries

The Confidence Graph Model applies to:

- Evidence Core — stores evidence nodes and claims
- Discovery Pipeline — surfaces claims with confidence states
- Canonical Engines — may operate on the confidence graph

It does NOT apply to:

- Institutional identity resolution (separate model)
- Document intake pipeline (infrastructure, domain-agnostic)
- Connector layer (data transport, no intelligence)

This boundary is consistent with ADR-011's Core/Engine boundary rule: the Confidence Graph Model governs how evidence and claims relate to confidence, not the deterministic store/provenance/relations/access/process-state functions the Evidence Core performs per ADR-011's five-condition test. Computation of the Confidence Value itself (§5) remains an Engine-layer concern, not a Core concern.

---

## §12 — Relationship to KEMS-003

This document is subordinate to KEMS-003 (Kadarn Product Constitution). Where KEMS-003 defines WHAT Kadarn is, this document defines HOW Kadarn models evidence and confidence.

Specifically, this document implements KEMS-003 Principle 1 ("Evidence Precedes Trust") and Principle 3 ("Every Conclusion Must Be Explainable").

---

*This is a reconstructed draft. It has not been ratified in its reconstructed form. Where this document conflicts with `openspec/ratificacion-kems-001.md` or any frozen artifact in `openspec/canonical-documents-registry-af-2.1.md`, the frozen artifact controls.*
