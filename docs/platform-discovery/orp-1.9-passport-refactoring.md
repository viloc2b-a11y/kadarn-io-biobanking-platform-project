# ORP-1.9 — Passport Refactoring

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Refactor Passport into a regenerable projection over canonical identity, evidence, capabilities, readiness, and roadmap data.  
**Gate:** Passport is regenerable.

## Objective

Passport equals projection.

Passport must not store source text, manual summaries, or duplicated derived state. It should be rebuilt dynamically from the canonical knowledge model whenever the underlying identity, evidence, claims, confidence, readiness, roadmap, or continuity data changes.

```text
Identity
  -> Evidence
  -> Capabilities
  -> Readiness
  -> Roadmap
  -> Passport
```

Not:

```text
Passport text
  -> stored as source truth
```

## Current Problem

The current Passport UI behaves as a derived page, which is correct directionally. However, the assembler still mixes:

- canonical structured objects
- local onboarding answers
- legacy flat fallback keys
- local document projections
- locally derived capabilities/readiness/next steps
- presentation text composed directly in UI

This is acceptable for MVP, but ORP-1.9 must make the boundary explicit:

> Passport is an audience-facing read model. It is not the institution, evidence, claim, readiness model, or roadmap source.

## Passport Projection Rule

Passport may include:

- generated section text
- summaries
- scores
- evidence lists
- capability summaries
- readiness summaries
- roadmap actions
- share/export presentation formats

Passport may not own:

- institution identity source truth
- evidence source truth
- claim truth
- readiness source truth
- roadmap source truth
- continuity source truth
- manually edited sponsor-facing narratives detached from evidence

## Target Source Chain

| Passport section | Canonical source |
|---|---|
| Who We Are | `Institution`, `Location`, current identity/profile read model. |
| What We Can Prove | `EvidenceObject`, `EvidenceSource`, provenance, evidence state. |
| What We Can Do | `Claim`, `ClaimCandidate`, accepted capabilities, evidence support. |
| How Ready We Are | Readiness projection from claims/evidence/confidence/missing evidence/continuity. |
| What We Should Do Next | Roadmap projection from missing evidence, weak claims, readiness gaps, continuity gaps. |

## Dynamic Reconstruction Model

```text
Canonical knowledge graph
  -> Passport projection builder
  -> Passport read model
  -> UI / share / export
```

Any Passport should be reconstructable from:

- current identity
- current canonical objects
- current evidence graph
- current claims
- current confidence states
- current readiness projection
- current roadmap projection
- current continuity links

## No Stored Text Rule

Passport copy should be generated from structured data and templates.

Allowed:

- reusable section templates
- generated summaries
- cached read models with source/version metadata
- exported PDF snapshots that preserve generation metadata
- published views with provenance

Not allowed:

- user-edited Passport text as source truth
- Passport summaries stored without source references
- Passport sections that cannot explain their evidence
- manually stored readiness/capability claims inside Passport
- Passport-specific duplicated institution profile fields

## Regeneration Requirements

Every Passport regeneration must include:

- source version or source timestamp
- generated timestamp
- source object references
- evidence references
- claim references
- readiness projection reference
- roadmap projection reference
- continuity/provenance references where applicable

If the same source graph is regenerated, the Passport should produce the same substantive content, excluding allowed time/display formatting differences.

## Source Boundary By Section

| Section | Must explain | Required references |
|---|---|---|
| Identity | Who the institution is today. | Institution and Location object IDs. |
| Evidence | What can be demonstrated today. | Evidence object IDs, source versions, provenance. |
| Capabilities | What claims are supported. | Claim IDs, evidence links, confidence/contribution summaries. |
| Readiness | How ready the institution is and why. | Readiness dimension IDs, claim/evidence/confidence/missing evidence references. |
| Roadmap | What should improve next. | Gap IDs, missing evidence IDs, weak claim references, continuity gaps. |

## Current-to-Target Refactor

| Current pattern | ORP-1.9 replacement |
|---|---|
| `assemblePassport({ answers, uploadedDocs })` | `buildPassportProjection({ canonicalObjects, evidenceGraph, claims, readiness, roadmap, continuity })` |
| `institution.team.piName` from legacy fallbacks | Person/role projection from canonical `Person` and `PersonRoleAssignment`. |
| `evidence.documents` from uploaded docs/static templates | Evidence projection from `EvidenceObject` and required/missing evidence map. |
| `capabilities` locally derived from answers | Capability projection from claims and evidence support. |
| `readiness` locally derived from answers | Readiness projection from ORP-1.8 readiness engine. |
| `nextSteps` locally derived from gaps | Roadmap projection from missing evidence, weak claims, readiness gaps, continuity gaps. |

## Activities

- Inventory all Passport fields and source dependencies.
- Mark legacy fallback branches as compatibility-only.
- Define Passport projection input contract.
- Define Passport section builders.
- Ensure every section has source references.
- Remove Passport-specific source fields.
- Replace stored/generic text with generated text from structured templates.
- Add regeneration checks.
- Ensure share/export outputs preserve source/provenance metadata.

## Non-Regression Rule

ORP-1.9 must preserve current Passport usability while changing the source boundary.

Allowed:

- cached Passport read models
- compatibility assembler during migration
- generated text templates
- export snapshots with generation metadata
- side-by-side old/new Passport comparison tests

Not allowed:

- storing Passport text as canonical truth
- editing Passport sections as source fields
- generating Passport sections without source references
- using Passport as input for Capabilities, Readiness, Roadmap, or Continuity
- losing share/export behavior

## Deliverables

- Passport Refactoring plan.
- Passport projection input contract.
- Passport section source-boundary map.
- Regeneration requirements.
- No stored text rule.
- Export/share provenance requirements.

## Gate

ORP-1.9 is complete when:

- Passport is regenerable from canonical identity, evidence, claims, readiness, roadmap, and continuity inputs
- no Passport section stores source text as canonical truth
- every Passport section references source objects or projections
- Passport can be regenerated after source graph changes
- Passport share/export includes generation and source/provenance metadata
- Passport is not used as source input by other product surfaces
