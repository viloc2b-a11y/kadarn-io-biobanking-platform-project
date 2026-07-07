# ORP-1.1 — Architecture Alignment Audit

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Align onboarding with Kadarn's canonical architecture before creating new components.  
**Decision:** This is an implementation-consolidation program, not a new architecture program.

## Sprint Objective

Audit absolutely all onboarding behavior before refactoring.

ORP-1.1 must establish the factual map of the current system: what exists, where it lives canonically, what onboarding consumes, what remains legacy, and what must be refactored first.

## Activities

- Inventory the complete onboarding flow.
- Identify entities captured or implied by onboarding.
- Identify canonical objects each answer should create or update.
- Identify legacy keys and legacy projections.
- Identify duplicate captured concepts.
- Identify derived and calculated fields.
- Create the Canonical Compliance Matrix.
- Create the Refactoring Map.

## Deliverables

- Architecture Alignment Audit.
- Canonical Compliance Matrix.
- Refactoring Map.

## Gate

ORP-1.1 is complete only when 100% of onboarding has been audited.

## Operating Rule

```text
Architecture First
  -> Refactoring Second
  -> New Design Last
```

Kadarn should:

1. Audit what already exists.
2. Connect existing canonical components.
3. Refactor where technical debt blocks alignment.
4. Design new components only when a real architectural gap remains.

This avoids the largest risk in large platforms: two architectures solving the same problem in parallel.

## Non-Duplication Principle

No new component may be created while a canonical component already solves the same problem.

Every new proposal must first answer:

- Does this concept already exist in the Manifesto / Constitution?
- Does this concept already exist in KRM-RAO?
- Does this concept already exist in KEMS?
- Does this concept already exist in the Master Work Plan?
- Does this concept already exist in the Evidence Blueprint?

If yes, the work is implementation or integration, not redesign.

## Executive Finding

The Knowledge Acquisition Engine does not need to be invented from scratch. Most of it already exists conceptually in Kadarn:

- Evidence Core
- Claim model
- Evidence Pipeline
- Provenance
- Confidence Graph
- Temporal Continuity
- Feedback Loop
- Passport projections
- Capability/readiness projections
- Public/API evidence connector backlog

The real gap is that onboarding still behaves as a legacy form layer. ORP-1.0 should close the distance between canonical architecture and current onboarding code.

## Governance Shift

ORP changes the default product and engineering question.

Old question:

```text
What else do we need to design?
```

New question:

```text
Where does this concept live canonically, and why are we not consuming it yet?
```

This is now the governing lens for onboarding work. The purpose is to prevent parallel documents, models, and components from recreating concepts that already exist in the Manifesto / Constitution, KRM-RAO, KEMS, the Master Work Plan, or the Evidence Blueprint.

## Project Stage Model

ORP marks Kadarn's transition from architectural definition into architectural alignment.

| Stage | Objective |
|---|---|
| Phase 0 | Problem discovery. |
| Phase 1 | Architecture definition: Manifesto, KRM, KEMS, Blueprint, Master Work Plan. |
| Phase 2 | Architecture alignment: ORP. |
| Phase 3 | Canonical model implementation. |
| Phase 4 | Optimization and intelligence. |

ORP-1.1 closes Phase 1 as the primary bottleneck. From this point forward, the bottleneck is implementation alignment, not architectural imagination.

## Status Legend

| Status | Meaning |
|---|---|
| ✅ | Conceptually defined enough; do not redesign. |
| 🟡 | Defined but incomplete, disconnected, or partially implemented; prioritize integration/refactor. |
| 🔴 | Not sufficiently defined or implemented; create new work only here. |

## Canonical Compliance

`Canonical Compliance` is an objective progress score for ORP. It measures how closely a component consumes Kadarn's canonical architecture instead of relying on local, duplicated, or legacy form-shaped logic.

Suggested scoring:

| Range | Meaning |
|---|---|
| 0-39% | Concept exists but onboarding does not meaningfully consume it. |
| 40-69% | Partial alignment; implementation exists but is disconnected, local, or legacy-heavy. |
| 70-89% | Mostly aligned; remaining work is source-boundary cleanup, projection cleanup, or integration hardening. |
| 90-100% | Canonical source, projection boundary, evidence/provenance, and consumer behavior are aligned. |

## Alignment Matrix

| Component | Defined | Implemented | Consumed by Onboarding | Canonical Compliance | Action |
|---|---:|---:|---:|---:|---|
| Evidence Core | ✅ | 🟡 | ❌ | 55% | Connect onboarding evidence/claims to canonical Evidence Core lifecycle instead of local derived arrays. |
| Claim Model | ✅ | 🟡 | ❌ | 60% | Replace form-derived capability assertions with claim candidates and canonical claim mappings. |
| Evidence Pipeline | ✅ | 🟡 | ❌ | 45% | Integrate Documents with upload -> conversion/OCR -> extraction -> evidence objects -> claim candidates. |
| Provenance | ✅ | 🟡 | ❌ | 50% | Preserve source, extraction, review, and transformation metadata for onboarding-derived facts. |
| Confidence Graph | ✅ | 🟡 | ❌ | 55% | Consume confidence/readiness signals from claim/evidence relationships, not local scoring branches. |
| Temporal Continuity | ✅ | 🔴 | ❌ | 30% | Keep in backlog; do not redesign. Implement later as continuity events over claims/evidence/history. |
| Feedback Loop | ✅ | 🟡 | ❌ | 45% | Integrate after core onboarding refactor; sponsor/user feedback should produce evidence or review signals. |
| Passport | ✅ | ✅ | 🟡 | 82% | Change source of truth from `answers`/legacy projections to canonical objects and evidence graph reads. |
| Readiness | ✅ | ✅ | 🟡 | 75% | Derive from canonical objects, evidence freshness, missing proof, and claim support. |
| Capabilities | ✅ | 🟡 | 🟡 | 68% | Derive from claims and evidence support, not manual research focus or infrastructure checkboxes alone. |
| Organization / Institution | ✅ | 🟡 | ✅ | 70% | Keep as onboarding entry point, but stop mirroring primary address and other projections into flat keys. |
| People Knowledge Model | ✅ | 🔴 | 🟡 | 40% | Implement person/role/contribution/evidence separation behind existing People UI. |
| Infrastructure Graph | ✅ | 🔴 | 🟡 | 38% | Implement facility/lab/equipment/storage/utilities/logistics/services as canonical objects. |
| Document Taxonomy | ✅ | 🟡 | 🟡 | 58% | Link uploads to taxonomy IDs, entities, claims, validity, and evidence class. |
| Automatic Extraction | ✅ | 🔴 | ❌ | 25% | Implement after Documents enters the pipeline; suppress questions based on extraction confidence. |
| Progressive Onboarding Levels | ✅ | 🔴 | ❌ | 35% | Replace fast-track legacy question gates with canonical maturity gates. |

Compliance scores are starting estimates for ORP tracking. They should be updated sprint by sprint as code paths move from local onboarding state to canonical components.

## Current Onboarding Misalignment

The current onboarding layer is bimodal:

- It captures structured objects in the UI.
- It still persists or consumes legacy flat projection keys.

Examples:

- `people_team_members[]` exists, but `people_pi_name`, `people_roles`, and `people_certs` still influence progress and projections.
- `infra_location_infrastructure[]` exists, but `infra_has_lab`, `infra_has_biospecimen`, and `infra_backup_power` still appear in legacy gates.
- `uploadedDocs[]` exists, but `docs_uploaded_count` is still treated like a question.
- Passport, Capabilities, Readiness, Memory, and Roadmap reassemble local projections instead of consuming one canonical graph boundary.

## ORP-1.0 Scope

In scope:

- Remove onboarding dependency on legacy projection keys.
- Make each onboarding answer create or update a canonical object.
- Connect Documents to the existing Evidence Pipeline design.
- Derive Capabilities, Readiness, Passport, Roadmap, and Continuity from canonical objects and evidence graph read models.
- Replace fast-track with progressive maturity gates.
- Reduce questions through extraction, inference, and human review only where needed.

Out of scope:

- Designing a second Knowledge Acquisition Engine.
- Creating duplicate claim/evidence/confidence abstractions.
- Replacing Evidence Core.
- Replacing KEMS.
- Replacing the Passport model.
- Replacing the Master Work Plan.

## Implementation Priorities

### Priority 1 — Stop Persisting Legacy Projections

Refactor `withDerivedAnswers()` so derived fields are not persisted as canonical onboarding answers.

Target:

```text
canonical state
  -> projection adapter
  -> legacy read model only where needed
```

Not:

```text
canonical state
  -> writes projection keys into answers
  -> downstream code treats projections as inputs
```

### Priority 2 — Normalize Passport Sources

Refactor `passport-assembler.ts` so it reads structured canonical objects first and treats legacy branches as temporary compatibility only.

Target sources:

- `Institution`
- `Location[]`
- `Person[]`
- `Facility/Laboratory/Equipment/Storage/Logistics`
- `EvidenceObject[]`
- `ClaimCandidate[]` / accepted claims
- `ContinuityEvent[]` where relevant

### Priority 3 — Replace Fast-Track Gates

Replace legacy flat field gates with canonical maturity gates.

| Gate | Canonical check |
|---|---|
| First Passport | Institution identity and minimal research profile exist. |
| Capability Expansion | At least one person/role contribution and one infrastructure support object exist. |
| Evidence Expansion | At least one evidence object or extracted fact supports a claim. |
| Historical Intelligence | At least one continuity event links to a canonical subject. |
| Automatic Evidence | At least one authorized source contributes candidates. |

### Priority 4 — Wire Documents Into the Evidence Pipeline

Documents should stop behaving as a file checklist and begin entering the existing pipeline:

```text
Upload
  -> Conversion / OCR
  -> Classification
  -> Extraction
  -> Entity Resolution
  -> Evidence Object Creation
  -> Claim Candidate Generation
  -> Provenance
  -> Human Review
  -> Projection Updates
```

### Priority 5 — Derive Outputs From Canonical Graph Reads

The following must remain projections:

- Passport
- Capabilities
- Readiness
- Roadmap
- Continuity / Memory
- Marketplace visibility
- Sponsor Intelligence
- Analytics
- Recommendations

They should not own source truth.

## Backlog Classification

| Work item | Status | Next action |
|---|---|---|
| Evidence Core doctrine | ✅ Defined | Do not redesign. |
| Claim taxonomy and claim validity | ✅ Defined | Use as target for onboarding claim candidates. |
| Confidence Graph | ✅ Defined | Integrate once claims/evidence are canonicalized. |
| Evidence Pipeline design | ✅ Defined | Implement Documents integration. |
| Automatic extraction matrix | ✅ Defined | Implement suppression/review behavior after pipeline exists. |
| People Knowledge Model | ✅ Defined | Implement object separation behind People UI. |
| Infrastructure Graph | ✅ Defined | Implement object separation behind Infrastructure UI. |
| Institution Continuity Model | ✅ Defined | Backlog implementation; do not redesign. |
| Progressive onboarding levels | ✅ Defined | Replace fast-track metadata/gates. |
| Legacy answer projections | 🟡 Implemented but wrong boundary | Refactor first. |
| Passport assembler | 🟡 Implemented but wrong source boundary | Refactor second. |
| Documents upload | 🟡 Implemented but not pipeline-backed | Integrate third. |
| Readiness/capability derivation | 🟡 Implemented but too local/legacy | Move to canonical graph reads. |
| External public API connectors | 🟡 Backlog/partial | Integrate after core onboarding refactor. |
| Temporal continuity runtime | 🔴 Not implemented | Create only after canonical event/evidence sources are stable. |

## Recommended ORP Sequence

```text
ORP-1.1 Architecture Alignment Audit
  -> ORP-1.2 Legacy Projection Removal
  -> ORP-1.3 Canonical Object Write Path
  -> ORP-1.4 Passport / Capabilities / Readiness Source Refactor
  -> ORP-1.5 Documents to Evidence Pipeline Integration
  -> ORP-1.6 Progressive Maturity Gates
  -> ORP-1.7 Automatic Extraction and Question Suppression
```

## Acceptance Check

ORP-1.1 is complete when:

- Existing canonical components are identified before new work is proposed.
- Each onboarding gap is classified as defined/implemented/consumed.
- New architecture is explicitly blocked unless no canonical component exists.
- Onboarding refactor work is sequenced around integration and debt removal.
- Product outputs are reaffirmed as projections, not sources of truth.

## ORP Definition of Done

ORP should not close when the code merely looks cleaner. It should close when onboarding is architecturally aligned with Kadarn's canonical model.

Formal closure criteria:

- No persisted legacy projections remain as onboarding source truth.
- All onboarding-created objects originate from canonical entities or canonical object adapters.
- Passport, Readiness, Capabilities, and Roadmap are pure projections of the same knowledge model.
- No datum is captured more than once unless there is a documented regulatory or provenance reason.
- Documents feed the Evidence Pipeline, not an independent document repository.
- Onboarding can pause and resume without breaking canonical model consistency.
- New capabilities can be added through Claims and Evidence without modifying the base onboarding flow.
- Canonical Compliance for all ORP scope components is at or above 90%, or any exception is explicitly documented with a migration plan.

## Final Decision

Kadarn is entering a new stage:

```text
Discovery and architecture definition
  -> Architecture alignment and implementation consolidation
```

The priority is no longer to expand the conceptual model. The priority is to close the distance between Kadarn's canonical architecture and the code paths that users actually touch.
