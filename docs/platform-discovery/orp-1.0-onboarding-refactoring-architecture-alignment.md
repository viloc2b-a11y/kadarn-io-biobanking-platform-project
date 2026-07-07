# ORP-1.0 — Onboarding Refactoring & Architecture Alignment

ORP-1.0 is an independent implementation program to align Kadarn onboarding with the platform's canonical architecture. The goal is not to redesign onboarding. The goal is to remove legacy technical debt and make onboarding consume Evidence Core, canonical objects, claims, evidence, provenance, and derived projections correctly.

## General Objective

Align onboarding completely with Kadarn's canonical architecture by:

- eliminating legacy form-shaped dependencies
- ensuring every captured fact creates or updates canonical objects
- connecting document intake to the Evidence Pipeline
- deriving Passport, Capabilities, Readiness, Roadmap, and Continuity from canonical objects and evidence graph reads
- preserving platform stability after each sprint

Each ORP sprint must leave the system working. No sprint should require a broken intermediate state.

## Operating Rule

```text
Architecture First
  -> Refactoring Second
  -> New Design Last
```

Before creating any component, ORP must confirm whether the concept already exists in Kadarn's canonical architecture.

## Program Scope

In scope:

- onboarding state and answer model
- legacy projection removal
- canonical object write paths
- Evidence Pipeline integration for Documents
- Passport / Capabilities / Readiness / Roadmap source refactor
- progressive maturity gates
- automatic extraction and question suppression

Out of scope:

- redesigning Evidence Core
- creating a second Knowledge Acquisition Engine
- replacing KEMS, the Evidence Blueprint, or the Master Work Plan
- building speculative new product surfaces before canonical alignment is complete

## Sprint Sequence

| Sprint | Name | Objective | Gate |
|---|---|---|---|
| ORP-1.1 | Architecture Alignment Audit | Audit onboarding end to end and create the compliance/refactoring map. | 100% of onboarding audited. |
| ORP-1.2 | Canonical Data Refactoring | Remove redundant flat capture and make onboarding write to canonical objects only. | No new writes target legacy models or flat projection keys. |
| ORP-1.3 | Derived Projection Refactoring | Remove persistence of derived projections and make outputs derive from canonical objects, evidence, claims, and confidence graph inputs. | No derived data is persisted as source truth. |
| ORP-1.4 | Document → Evidence Integration | Connect Documents with Evidence Core through OCR, extraction, evidence objects, claims, provenance, and confidence graph links. | Every uploaded document generates Evidence Objects. |
| ORP-1.5 | Progressive Onboarding | Replace the 102-minute onboarding model with levels that produce value progressively. | First Passport generated in less than 10 minutes. |
| ORP-1.6 | Automatic Knowledge Extraction | Reduce manual questions by extracting canonical knowledge from evidence sources. | At least 40% of questions are eliminated, suppressed, or downgraded to confirmation. |
| ORP-1.7 | Knowledge Continuity | Refactor Memory into linked continuity timelines across institution, people, capabilities, evidence, documents, infrastructure, sponsors, inspections, technology, and growth. | Every evidence object has temporal continuity metadata. |
| ORP-1.8 | Readiness Engine Refactoring | Remove manual readiness rules and derive readiness only from claims, evidence, confidence, missing evidence, and temporal continuity. | Readiness is completely derived. |
| ORP-1.9 | Passport Refactoring | Refactor Passport into a regenerable projection over identity, evidence, capabilities, readiness, and roadmap. | Passport is regenerable. |
| ORP-1.10 | Fast Track Elimination | Remove `fast-track.ts` and replace legacy progress logic with a Progressive Maturity Engine. | No legacy Fast Track logic remains. |
| ORP-1.11 | UX Consolidation | Reduce friction by merging Organization, People, Infrastructure, Documents, and Memory through inference, AI, extraction, and context. | Manual interaction is reduced by 50%. |
| ORP-1.12 | Canonical Compliance Certification | Run the final audit and certify that onboarding fully consumes Kadarn's canonical architecture. | ORP final gate is satisfied. |

## Execution Priority

Do not execute ORP sprints in parallel.

Recommended sequence:

| Phase | Sprints | Purpose |
|---|---|---|
| Phase A — Architecture Alignment | ORP-1.1 → ORP-1.2 → ORP-1.3 | Align the data model, eliminate legacy writes, and remove persisted projection boundaries first. |
| Phase B — Evidence Model Integration | ORP-1.4 → ORP-1.5 → ORP-1.6 | Connect the Evidence Pipeline, make onboarding progressive, and reduce manual questions through extraction. |
| Phase C — Derivation And Intelligence | ORP-1.7 → ORP-1.8 → ORP-1.9 | Add continuity, derive readiness, and make Passport a regenerable projection. |
| Phase D — Cleanup And Certification | ORP-1.10 → ORP-1.11 → ORP-1.12 | Remove remaining legacy logic, consolidate UX friction, and certify canonical compliance. |

This sequence minimizes risk because it first aligns the data model, then connects the evidence pipeline, then migrates projections, and finally eliminates remaining technical debt before certification.

## ORP-1.1 — Architecture Alignment Audit

Objective:

Audit absolutely all onboarding behavior before refactoring.

Activities:

- inventory the complete onboarding flow
- identify entities
- identify canonical objects
- identify legacy keys
- identify duplicates
- identify derivations
- create the compliance matrix
- create the refactoring map

Deliverables:

- Architecture Alignment Audit
- Canonical Compliance Matrix
- Refactoring Map

Gate:

- 100% of onboarding audited.

Reference:

- `docs/platform-discovery/orp-1.1-architecture-alignment-audit.md`

## ORP-1.2 — Canonical Data Refactoring

Objective:

Eliminate redundant capture by replacing flat legacy writes with writes to canonical objects.

Activities:

- remove writes to `people_pi_name`, `people_roles`, `infra_has_lab`, `docs_uploaded_count`, and similar legacy keys
- replace flat writes with canonical object writes
- map all captured facts to `Institution`, `Person`, `Location`, `Equipment`, `Laboratory`, `Document`, `Evidence`, `Timeline Event`, or `Claim`
- keep legacy values only as read-only compatibility projections during migration

Deliverables:

- Canonical Data Refactoring plan
- Legacy write target inventory
- Canonical replacement map

Gate:

- No new writes target legacy models or flat projection keys.

Reference:

- `docs/platform-discovery/orp-1.2-canonical-data-refactoring.md`

## ORP-1.3 — Derived Projection Refactoring

Objective:

Eliminate persistence of projections.

Activities:

- refactor `withDerivedAnswers`
- refactor `passport-assembler`
- refactor readiness builder boundaries
- refactor capability builder boundaries
- refactor roadmap builder boundaries
- ensure every derived output reads from canonical objects, evidence, claims, and confidence graph inputs

Deliverables:

- Derived Projection Refactoring plan
- Persisted derived data inventory
- Projection adapter map
- Output source-boundary matrix

Gate:

- No derived data is persisted as source truth.

Reference:

- `docs/platform-discovery/orp-1.3-derived-projection-refactoring.md`

## ORP-1.4 — Document → Evidence Integration

Objective:

Connect Documents with Evidence Core.

Pipeline:

```text
Upload
  -> OCR
  -> Extraction
  -> Evidence Objects
  -> Claims
  -> Confidence Graph
```

Not:

```text
Upload
  -> Storage
```

Activities:

- OCR
- extraction
- metadata
- claim linking
- evidence linking
- provenance

Deliverables:

- Document → Evidence Integration plan
- Evidence Pipeline mapping for Documents
- Document metadata model
- Claim/evidence linking map
- Provenance requirements

Gate:

- Every uploaded document generates Evidence Objects.

Reference:

- `docs/platform-discovery/orp-1.4-document-evidence-integration.md`

## ORP-1.5 — Progressive Onboarding

Objective:

Eliminate the 102-minute onboarding model and create progressive levels.

Levels:

```text
Level 1
  Identity
  -> Initial Passport

Level 2
  People
  Infrastructure
  -> Capabilities

Level 3
  Evidence
  -> Readiness

Level 4
  Memory
  -> Continuity

Level 5
  Automation
  -> APIs
  -> Feedback
  -> Historical ingestion
```

Deliverables:

- Progressive Onboarding plan
- Level model
- Canonical maturity gate map
- Fast-track replacement map
- Level-to-output projection map

Gate:

- First Passport generated in less than 10 minutes.

Reference:

- `docs/platform-discovery/orp-1.5-progressive-onboarding.md`

## ORP-1.6 — Automatic Knowledge Extraction

Objective:

Reduce questions by implementing automatic extraction.

Extraction targets:

```text
CLIA
  -> Laboratory

CV
  -> People
  -> Credentials
  -> Experience

FDA Form 1572
  -> Investigators

Medical License
  -> Credentials

Equipment IQ/OQ/PQ
  -> Equipment

SOP
  -> Capabilities

Shipping SOP
  -> Shipping

Historical Study
  -> Research Memory
```

Deliverables:

- Automatic Knowledge Extraction plan
- Evidence-to-object extraction map
- Question suppression rules
- Extraction confidence policy
- Question reduction metrics
- Review UI requirements

Gate:

- At least 40% of onboarding questions are eliminated, suppressed, or downgraded to confirmation.

Reference:

- `docs/platform-discovery/orp-1.6-automatic-knowledge-extraction.md`

## ORP-1.7 — Knowledge Continuity

Objective:

Refactor Memory into linked knowledge continuity.

Create:

- Institution Timeline
- People Timeline
- Capability Timeline
- Evidence Timeline
- Document Timeline
- Infrastructure Timeline
- Sponsor Timeline
- Inspection Timeline
- Technology Timeline
- Growth Timeline

All timelines are linked views over one continuity event graph.

Deliverables:

- Knowledge Continuity plan
- Timeline lens model
- Continuity event model
- Evidence continuity metadata requirements
- Event relationship model
- Memory refactor map

Gate:

- Every evidence object has temporal continuity metadata.

Reference:

- `docs/platform-discovery/orp-1.7-knowledge-continuity.md`

## ORP-1.8 — Readiness Engine Refactoring

Objective:

Eliminate manual readiness rules.

Readiness must calculate only from:

- Claims
- Evidence
- Confidence
- Missing Evidence
- Temporal Continuity

Never from manual fields.

Deliverables:

- Readiness Engine Refactoring plan
- Readiness source-field inventory
- Claim-to-readiness dimension map
- Evidence requirement map
- Missing evidence model
- Temporal continuity impact map
- Readiness projection boundary specification

Gate:

- Readiness is completely derived.

Reference:

- `docs/platform-discovery/orp-1.8-readiness-engine-refactoring.md`

## ORP-1.9 — Passport Refactoring

Objective:

Passport equals projection.

Do not store Passport text as source truth. Rebuild Passport dynamically from:

```text
Identity
  -> Evidence
  -> Capabilities
  -> Readiness
  -> Roadmap
```

Deliverables:

- Passport Refactoring plan
- Passport projection input contract
- Passport section source-boundary map
- Regeneration requirements
- No stored text rule
- Export/share provenance requirements

Gate:

- Passport is regenerable.

Reference:

- `docs/platform-discovery/orp-1.9-passport-refactoring.md`

## ORP-1.10 — Fast Track Elimination

Objective:

Eliminate `fast-track.ts`.

Replace it with:

```text
Progressive Maturity Engine
  -> Level 1
  -> Level 2
  -> Level 3
  -> Level 4
  -> Level 5
```

Deliverables:

- Fast Track Elimination plan
- Fast-track usage inventory
- Progressive Maturity Engine specification
- Level gate map
- Migration/removal map
- UI copy replacement map

Gate:

- No legacy Fast Track logic remains.

Reference:

- `docs/platform-discovery/orp-1.10-fast-track-elimination.md`

## ORP-1.11 — UX Consolidation

Objective:

Reduce friction and eliminate repeated questions.

Consolidate:

- Organization
- People
- Infrastructure
- Documents
- Memory

Through:

- inference
- AI
- extraction
- context

Deliverables:

- UX Consolidation plan
- Manual interaction inventory
- Interaction reduction baseline
- Context/inference suppression map
- Review flow model
- Module consolidation map
- UX metrics specification

Gate:

- Manual interaction is reduced by 50%.

Reference:

- `docs/platform-discovery/orp-1.11-ux-consolidation.md`

## ORP-1.12 — Canonical Compliance Certification

Objective:

Final audit.

Verify:

- no legacy
- no duplicates
- no persisted projections
- everything derives from canonical objects
- every document generates evidence
- every evidence object generates or supports Claims
- every Claim feeds Confidence
- every Confidence signal feeds Passport

Deliverables:

- Canonical Compliance Report
- Architecture Alignment Report
- ORP Final Report

Final Gate:

- 100% of onboarding consumes the existing canonical architecture.
- 0% of new writes use legacy structures.
- Passport, Readiness, Capabilities, and Roadmap are pure projections of the same knowledge model.
- Documents works as an entry point to the Evidence Pipeline, not as an independent repository.
- Onboarding is progressive, resumable, and evidence-based.
- New capabilities are added through new Claims and Evidence, without modifying the base onboarding flow.

Reference:

- `docs/platform-discovery/orp-1.12-canonical-compliance-certification.md`

## Program Definition of Done

ORP-1.0 is complete when:

- 100% of onboarding consumes the existing canonical architecture
- 0% of new writes use legacy structures
- no persisted legacy projections remain as onboarding source truth
- all onboarding-created objects originate from canonical entities or canonical adapters
- Passport, Readiness, Capabilities, and Roadmap are pure projections of the same knowledge model
- no datum is captured more than once unless there is a documented regulatory or provenance reason
- Documents feed the Evidence Pipeline, not an independent document repository
- onboarding can pause and resume without breaking canonical model consistency
- new capabilities can be added through Claims and Evidence without modifying the base onboarding flow
- every evidence object carries temporal continuity metadata
- readiness is derived only from claims, evidence, confidence, missing evidence, and temporal continuity
- Passport is regenerable from canonical identity, evidence, claims, readiness, roadmap, and continuity inputs
- no legacy Fast Track logic remains
- onboarding progress is computed from progressive canonical maturity levels
- manual interaction is reduced by at least 50% without reducing evidence explainability
- every document generates evidence, every evidence object supports Claims, every Claim feeds Confidence, and Confidence feeds Passport
- Canonical Compliance for all ORP scope components is at or above 90%, or exceptions have explicit migration plans

## Final Outcome

ORP-1.0 succeeds when onboarding stops behaving like a legacy form and becomes a stable consumer of Kadarn's canonical knowledge architecture.
